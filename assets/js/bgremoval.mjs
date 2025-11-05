/**
 * Background removal helper powered by U²-Net and onnxruntime-web.
 * Every step is heavily commented to make it easy to adapt the pipeline.
 */

const ORT_CDN = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/ort.min.js';
const WASM_ASSETS = 'https://cdn.jsdelivr.net/npm/onnxruntime-web/dist/';

const DEFAULT_MODEL_URL = '/models/u2netp.onnx';
const DEFAULT_PROVIDERS = ['webgpu', 'webgl', 'wasm'];

let ortLoadPromise;
let ortModule;
let sessionPromise;
let cachedProviderName;
let currentSessionSignature;
const modelCache = new Map();

async function downloadModel(modelUrl, onProgress) {
  if (modelCache.has(modelUrl)) {
    const cached = modelCache.get(modelUrl);
    if (onProgress) {
      onProgress({
        loaded: cached.byteLength,
        total: cached.byteLength,
        percent: 100,
        modelUrl,
        fromCache: true,
      });
    }
    return cached.buffer;
  }

  const response = await fetch(modelUrl, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`Failed to download model: ${response.status} ${response.statusText}`);
  }

  const total = Number(response.headers.get('content-length')) || 0;
  const reader = response.body?.getReader();

  if (!reader) {
    const buffer = await response.arrayBuffer();
    const byteLength = buffer.byteLength;
    modelCache.set(modelUrl, { buffer, byteLength });
    if (onProgress) {
      onProgress({
        loaded: byteLength,
        total: byteLength,
        percent: 100,
        modelUrl,
        fromCache: false,
      });
    }
    return buffer;
  }

  const chunks = [];
  let loaded = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      loaded += value.length;
      if (onProgress) {
        onProgress({
          loaded,
          total,
          percent: total ? Math.min(100, Math.round((loaded / total) * 100)) : 0,
          modelUrl,
          fromCache: false,
        });
      }
    }
  }

  const totalLength = loaded;
  const bytes = new Uint8Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }

  const buffer = bytes.buffer;
  modelCache.set(modelUrl, { buffer, byteLength: totalLength });
  if (onProgress) {
    onProgress({
      loaded: totalLength,
      total: total || totalLength,
      percent: 100,
      modelUrl,
      fromCache: false,
    });
  }
  return buffer;
}

/**
 * Injects the onnxruntime-web bundle on demand so the host page does not have
 * to manage the dependency manually.
 */
async function ensureOrt() {
  if (ortModule) return ortModule;

  if (globalThis.ort) {
    ortModule = globalThis.ort;
    configureOrtEnvironment(ortModule);
    return ortModule;
  }

  if (!ortLoadPromise) {
    const bootstrapOrt = globalThis.ort ?? {};
    if (!bootstrapOrt.env) bootstrapOrt.env = {};
    if (!bootstrapOrt.env.wasm) bootstrapOrt.env.wasm = {};
    configureOrtEnvironment(bootstrapOrt);
    bootstrapOrt.env.wasm.wasmPaths = WASM_ASSETS;
    globalThis.ort = bootstrapOrt;

    ortLoadPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = ORT_CDN;
      script.async = true;
      script.onload = () => {
        ortModule = globalThis.ort;
        if (!ortModule) {
          reject(new Error('onnxruntime-web loaded but global "ort" is missing.'));
          return;
        }
        configureOrtEnvironment(ortModule);
        resolve(ortModule);
      };
      script.onerror = () => reject(new Error('Failed to load onnxruntime-web from CDN.'));
      document.head.appendChild(script);
    });
  }

  return ortLoadPromise;
}

function configureOrtEnvironment(ort) {
  if (!ort) return;
  if (!ort.env) ort.env = {};
  if (!ort.env.wasm) ort.env.wasm = {};
  const wasmEnv = ort.env.wasm;

  if (!globalThis.crossOriginIsolated) {
    wasmEnv.numThreads = 1;
    wasmEnv.simd = false;
  }

  if (typeof navigator !== 'undefined' && /Safari/i.test(navigator.userAgent) && !/Chrome/i.test(navigator.userAgent)) {
    wasmEnv.numThreads = 1;
    wasmEnv.simd = false;
  }

  if (!wasmEnv.wasmPaths) {
    wasmEnv.wasmPaths = WASM_ASSETS;
  }
}

/**
 * Creates (or reuses) a single shared inference session.
 */
export async function initU2Net({
  modelUrl = DEFAULT_MODEL_URL,
  providers = DEFAULT_PROVIDERS,
  onProgress = null,
} = {}) {
  const signature = JSON.stringify({ modelUrl, providers });
  if (sessionPromise && signature === currentSessionSignature) {
    return sessionPromise;
  }

  if (sessionPromise && signature !== currentSessionSignature) {
    sessionPromise
      .then((session) => {
        if (session && typeof session.release === 'function') {
          session.release();
        }
      })
      .catch(() => { /* previous session init failed, nothing to release */ });
    sessionPromise = null;
    cachedProviderName = undefined;
  }

  currentSessionSignature = signature;
  sessionPromise = (async () => {
    const ort = await ensureOrt();
    let lastError;
    let modelBuffer;

    for (const provider of providers) {
      try {
        if (!modelBuffer) {
          modelBuffer = await downloadModel(modelUrl, onProgress);
        }
        const session = await ort.InferenceSession.create(modelBuffer, {
          executionProviders: [provider],
          graphOptimizationLevel: 'all',
        });
        cachedProviderName = provider;
        return session;
      } catch (err) {
        lastError = err;
        console.warn(`[bgremoval] Provider ${provider} unavailable:`, err);
      }
    }

    throw new Error(
      lastError
        ? `Unable to initialise U²-Net session. Last error: ${lastError.message}`
        : 'Unable to initialise U²-Net session.',
    );
  })().catch((error) => {
    currentSessionSignature = undefined;
    throw error;
  });

  return sessionPromise;
}

/**
 * Converts ImageData to a Float32 tensor shaped [1,3,H,W] normalized to [0,1].
 */
function toTensorCHW(imageData) {
  const { data, width, height } = imageData;
  const size = width * height;
  const tensorData = new Float32Array(3 * size);

  for (let i = 0; i < size; i += 1) {
    const base = i * 4;
    const r = data[base] / 255;
    const g = data[base + 1] / 255;
    const b = data[base + 2] / 255;

    tensorData[i] = r;
    tensorData[i + size] = g;
    tensorData[i + size * 2] = b;
  }

  return new ortModule.Tensor('float32', tensorData, [1, 3, height, width]);
}

/**
 * Basic bilinear resize for a single-channel mask.
 */
function bilinearResizeMask(src, srcWidth, srcHeight, dstWidth, dstHeight) {
  if (srcWidth === dstWidth && srcHeight === dstHeight) {
    return new Float32Array(src);
  }

  const dst = new Float32Array(dstWidth * dstHeight);
  const xRatio = srcWidth > 1 ? (srcWidth - 1) / (dstWidth - 1 || 1) : 0;
  const yRatio = srcHeight > 1 ? (srcHeight - 1) / (dstHeight - 1 || 1) : 0;

  for (let y = 0; y < dstHeight; y += 1) {
    const sy = yRatio * y;
    const yLow = Math.floor(sy);
    const yHigh = Math.min(yLow + 1, srcHeight - 1);
    const yLerp = sy - yLow;

    for (let x = 0; x < dstWidth; x += 1) {
      const sx = xRatio * x;
      const xLow = Math.floor(sx);
      const xHigh = Math.min(xLow + 1, srcWidth - 1);
      const xLerp = sx - xLow;

      const topLeft = src[yLow * srcWidth + xLow];
      const topRight = src[yLow * srcWidth + xHigh];
      const bottomLeft = src[yHigh * srcWidth + xLow];
      const bottomRight = src[yHigh * srcWidth + xHigh];

      const top = topLeft + (topRight - topLeft) * xLerp;
      const bottom = bottomLeft + (bottomRight - bottomLeft) * xLerp;
      dst[y * dstWidth + x] = top + (bottom - top) * yLerp;
    }
  }

  return dst;
}

/**
 * Gaussian blur implemented as a separable convolution.
 */
function gaussianBlurMask(mask, width, height, sigma) {
  if (!sigma || sigma <= 0) {
    return new Float32Array(mask);
  }

  const radius = Math.max(1, Math.floor(sigma * 2));
  const kernelSize = radius * 2 + 1;
  const kernel = new Float32Array(kernelSize);
  const twoSigmaSq = 2 * sigma * sigma;
  let sum = 0;

  for (let i = -radius; i <= radius; i += 1) {
    const value = Math.exp(-(i * i) / twoSigmaSq);
    kernel[i + radius] = value;
    sum += value;
  }

  for (let i = 0; i < kernel.length; i += 1) {
    kernel[i] /= sum;
  }

  const temp = new Float32Array(width * height);
  const output = new Float32Array(width * height);

  // Horizontal pass.
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let acc = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const clampedX = Math.min(width - 1, Math.max(0, x + k));
        acc += mask[y * width + clampedX] * kernel[k + radius];
      }
      temp[y * width + x] = acc;
    }
  }

  // Vertical pass.
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      let acc = 0;
      for (let k = -radius; k <= radius; k += 1) {
        const clampedY = Math.min(height - 1, Math.max(0, y + k));
        acc += temp[clampedY * width + x] * kernel[k + radius];
      }
      output[y * width + x] = acc;
    }
  }

  return output;
}

/**
 * Applies a soft threshold so edges gently fade between foreground/background.
 */
function applyThresholdBlend(mask, width, height, threshold) {
  const clampedThreshold = Math.min(0.95, Math.max(0.05, threshold));
  const len = width * height;
  const alpha = new Float32Array(len);
  const denom = 1 - clampedThreshold;

  for (let i = 0; i < len; i += 1) {
    const value = mask[i];
    if (value <= clampedThreshold) {
      alpha[i] = 0;
    } else {
      alpha[i] = Math.min(1, (value - clampedThreshold) / denom);
    }
  }

  return alpha;
}

function createCanvas(width, height) {
  if (typeof OffscreenCanvas !== 'undefined') {
    return new OffscreenCanvas(width, height);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

async function fileToImageBitmap(file) {
  if ('createImageBitmap' in globalThis) {
    return createImageBitmap(file);
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      resolve(img);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function maybeSigmoid(data) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < data.length; i += 1) {
    const value = data[i];
    if (value < min) min = value;
    if (value > max) max = value;
  }

  if (min >= 0 && max <= 1) {
    return new Float32Array(data);
  }

  const out = new Float32Array(data.length);
  for (let i = 0; i < data.length; i += 1) {
    const v = data[i];
    out[i] = 1 / (1 + Math.exp(-v));
  }

  return out;
}

/**
 * Runs the background removal pipeline on a File/Blob.
 */
export async function removeBgFromFile(file, { feather = 1.5, threshold = 0.7 } = {}) {
  if (!file) {
    throw new Error('removeBgFromFile expects a File or Blob.');
  }

  const session = await (sessionPromise || initU2Net());
  const ort = await ensureOrt();
  const bitmap = await fileToImageBitmap(file);
  const originalWidth = bitmap.width;
  const originalHeight = bitmap.height;

  // Keep the original resolution canvas for final compositing.
  const composeCanvas = document.createElement('canvas');
  composeCanvas.width = originalWidth;
  composeCanvas.height = originalHeight;
  const composeCtx = composeCanvas.getContext('2d');
  composeCtx.drawImage(bitmap, 0, 0, originalWidth, originalHeight);
  const originalImageData = composeCtx.getImageData(0, 0, originalWidth, originalHeight);

  // Downscale to the network's expected 320x320 input so we never OOM on huge images.
  const procCanvas = createCanvas(320, 320);
  const procCtx = procCanvas.getContext('2d');
  procCtx.drawImage(bitmap, 0, 0, 320, 320);
  const procImageData = procCtx.getImageData(0, 0, 320, 320);

  // Convert to tensor and feed the network.
  const tensor = toTensorCHW(procImageData);
  const inputs = {};
  inputs[session.inputNames[0]] = tensor;

  const outputs = await session.run(inputs);
  const rawMaskTensor = outputs[session.outputNames[0]];
  const maskData = maybeSigmoid(rawMaskTensor.data || rawMaskTensor);

  // Resize mask back to original resolution and feather the edges.
  const resizedMask = bilinearResizeMask(maskData, 320, 320, originalWidth, originalHeight);
  const blurredMask = gaussianBlurMask(resizedMask, originalWidth, originalHeight, feather);
  const alphaFloat = applyThresholdBlend(blurredMask, originalWidth, originalHeight, threshold);

  // Apply alpha to original pixels.
  const rgbaData = originalImageData.data;
  const totalPixels = originalWidth * originalHeight;
  for (let i = 0; i < totalPixels; i += 1) {
    rgbaData[i * 4 + 3] = Math.round(alphaFloat[i] * 255);
  }
  composeCtx.putImageData(originalImageData, 0, 0);

  // Build an alpha-only preview image.
  const alphaCanvas = document.createElement('canvas');
  alphaCanvas.width = originalWidth;
  alphaCanvas.height = originalHeight;
  const alphaCtx = alphaCanvas.getContext('2d');
  const alphaImageData = alphaCtx.createImageData(originalWidth, originalHeight);
  for (let i = 0; i < totalPixels; i += 1) {
    const value = Math.round(alphaFloat[i] * 255);
    const idx = i * 4;
    alphaImageData.data[idx] = value;
    alphaImageData.data[idx + 1] = value;
    alphaImageData.data[idx + 2] = value;
    alphaImageData.data[idx + 3] = 255;
  }
  alphaCtx.putImageData(alphaImageData, 0, 0);

  const rgbaDataURL = composeCanvas.toDataURL('image/png');
  const alphaMask = alphaCanvas.toDataURL('image/png');

  return { rgbaDataURL, alphaMask, provider: cachedProviderName || 'unknown' };
}

export { toTensorCHW, bilinearResizeMask, gaussianBlurMask, applyThresholdBlend };
