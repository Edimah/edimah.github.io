/**
 * Worker de détourage IA (U²-Net via onnxruntime-web).
 * Tourne hors du thread principal : l'interface ne gèle plus pendant
 * l'inférence. Le modèle est conservé dans le Cache API après le premier
 * téléchargement (plus de re-téléchargement à chaque visite).
 *
 * Protocole (postMessage) :
 *   → { t:"init", ortUrl, wasmBase, modelUrl }
 *   ← { t:"progress", pct, phase }   pendant le téléchargement
 *   ← { t:"ready", provider }
 *   → { t:"run", id, pixels, width, height, origW, origH, feather, threshold }
 *   ← { t:"result", id, alpha }      Float32Array origW×origH (transférée)
 *   ← { t:"error", id?, message }
 *
 * © 2025-2026 Edimah SYNESIUS SONGO — Licence MIT.
 */

"use strict";

const MODEL_CACHE = "affiche-models-v1";
let session = null;
let providerName = null;

const IMAGENET_MEAN = [0.485, 0.456, 0.406];
const IMAGENET_STD = [0.229, 0.224, 0.225];

async function fetchModel(modelUrl) {
  // 1. Cache persistant (Cache API) — survit aux rechargements de page.
  try {
    const cache = await caches.open(MODEL_CACHE);
    const hit = await cache.match(modelUrl);
    if (hit) {
      postMessage({ t: "progress", pct: 100, phase: "cache" });
      return hit.arrayBuffer();
    }
  } catch (e) {
    // Cache API indisponible (navigation privée…) : on télécharge simplement.
  }

  const response = await fetch(modelUrl, { mode: "cors" });
  if (!response.ok) throw new Error(`Téléchargement du modèle impossible (${response.status})`);
  const total = Number(response.headers.get("content-length")) || 0;
  const reader = response.body?.getReader();

  let buffer;
  if (!reader) {
    buffer = await response.arrayBuffer();
  } else {
    const chunks = [];
    let loaded = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      loaded += value.length;
      postMessage({ t: "progress", pct: total ? Math.min(100, Math.round((loaded / total) * 100)) : 0, phase: "download" });
    }
    const bytes = new Uint8Array(loaded);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    buffer = bytes.buffer;
  }

  try {
    const cache = await caches.open(MODEL_CACHE);
    await cache.put(modelUrl, new Response(buffer.slice(0), { headers: { "Content-Type": "application/octet-stream" } }));
  } catch (e) {
    /* stockage refusé : sans gravité */
  }
  return buffer;
}

async function init({ ortUrl, wasmBase, modelUrl }) {
  importScripts(ortUrl);
  const ort = self.ort;
  if (!ort) throw new Error("onnxruntime-web introuvable dans le worker.");
  ort.env.wasm.wasmPaths = wasmBase;
  if (!self.crossOriginIsolated) {
    // GitHub Pages n'envoie pas les en-têtes COOP/COEP : pas de threads SIMD.
    ort.env.wasm.numThreads = 1;
    ort.env.wasm.simd = false;
  }

  const modelBuffer = await fetchModel(modelUrl);
  let lastError;
  for (const provider of ["webgpu", "wasm"]) {
    try {
      session = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: [provider],
        graphOptimizationLevel: "all",
      });
      providerName = provider;
      postMessage({ t: "ready", provider });
      return;
    } catch (err) {
      lastError = err;
    }
  }
  throw new Error(`Aucun moteur d'inférence disponible : ${lastError?.message || "?"}`);
}

// --- Post-traitement du masque (repris du pipeline U²-Net de référence) ------
function maybeSigmoid(data) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < data.length; i += 1) {
    if (data[i] < min) min = data[i];
    if (data[i] > max) max = data[i];
  }
  if (min >= 0 && max <= 1) return new Float32Array(data);
  const out = new Float32Array(data.length);
  for (let i = 0; i < data.length; i += 1) out[i] = 1 / (1 + Math.exp(-data[i]));
  return out;
}

function normalizeMask(mask) {
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < mask.length; i += 1) {
    if (mask[i] < min) min = mask[i];
    if (mask[i] > max) max = mask[i];
  }
  const range = max - min;
  if (!(range > 1e-6)) return new Float32Array(mask);
  const out = new Float32Array(mask.length);
  for (let i = 0; i < mask.length; i += 1) out[i] = (mask[i] - min) / range;
  return out;
}

function bilinearResize(src, sw, sh, dw, dh) {
  if (sw === dw && sh === dh) return new Float32Array(src);
  const dst = new Float32Array(dw * dh);
  const xr = sw > 1 ? (sw - 1) / (dw - 1 || 1) : 0;
  const yr = sh > 1 ? (sh - 1) / (dh - 1 || 1) : 0;
  for (let y = 0; y < dh; y += 1) {
    const sy = yr * y;
    const y0 = Math.floor(sy);
    const y1 = Math.min(y0 + 1, sh - 1);
    const fy = sy - y0;
    for (let x = 0; x < dw; x += 1) {
      const sx = xr * x;
      const x0 = Math.floor(sx);
      const x1 = Math.min(x0 + 1, sw - 1);
      const fx = sx - x0;
      const tl = src[y0 * sw + x0];
      const tr = src[y0 * sw + x1];
      const bl = src[y1 * sw + x0];
      const br = src[y1 * sw + x1];
      dst[y * dw + x] = tl + (tr - tl) * fx + (bl + (br - bl) * fx - (tl + (tr - tl) * fx)) * fy;
    }
  }
  return dst;
}

function gaussianBlur(mask, width, height, sigma) {
  if (!sigma || sigma <= 0) return mask;
  const radius = Math.max(1, Math.floor(sigma * 2));
  const kernel = new Float32Array(radius * 2 + 1);
  let sum = 0;
  for (let i = -radius; i <= radius; i += 1) {
    const v = Math.exp(-(i * i) / (2 * sigma * sigma));
    kernel[i + radius] = v;
    sum += v;
  }
  for (let i = 0; i < kernel.length; i += 1) kernel[i] /= sum;
  const temp = new Float32Array(width * height);
  const out = new Float32Array(width * height);
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      let acc = 0;
      for (let k = -radius; k <= radius; k += 1) {
        acc += mask[y * width + Math.min(width - 1, Math.max(0, x + k))] * kernel[k + radius];
      }
      temp[y * width + x] = acc;
    }
  }
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < height; y += 1) {
      let acc = 0;
      for (let k = -radius; k <= radius; k += 1) {
        acc += temp[Math.min(height - 1, Math.max(0, y + k)) * width + x] * kernel[k + radius];
      }
      out[y * width + x] = acc;
    }
  }
  return out;
}

async function run({ id, pixels, width, height, origW, origH, feather = 1.5, threshold = 0.7 }) {
  if (!session) throw new Error("Session non initialisée.");
  const size = width * height;
  const tensorData = new Float32Array(3 * size);

  // Prétraitement officiel U²-Net (ToTensorLab flag=0, comme rembg) :
  // division par le max de l'image puis normalisation ImageNet.
  let maxVal = 0;
  for (let i = 0; i < size * 4; i += 4) {
    if (pixels[i] > maxVal) maxVal = pixels[i];
    if (pixels[i + 1] > maxVal) maxVal = pixels[i + 1];
    if (pixels[i + 2] > maxVal) maxVal = pixels[i + 2];
  }
  if (!maxVal) maxVal = 255;
  for (let i = 0; i < size; i += 1) {
    const b = i * 4;
    tensorData[i] = (pixels[b] / maxVal - IMAGENET_MEAN[0]) / IMAGENET_STD[0];
    tensorData[i + size] = (pixels[b + 1] / maxVal - IMAGENET_MEAN[1]) / IMAGENET_STD[1];
    tensorData[i + size * 2] = (pixels[b + 2] / maxVal - IMAGENET_MEAN[2]) / IMAGENET_STD[2];
  }

  const tensor = new self.ort.Tensor("float32", tensorData, [1, 3, height, width]);
  const outputs = await session.run({ [session.inputNames[0]]: tensor });
  const raw = outputs[session.outputNames[0]];
  const mask = normalizeMask(maybeSigmoid(raw.data));

  let alpha = bilinearResize(mask, width, height, origW, origH);
  alpha = gaussianBlur(alpha, origW, origH, feather);
  const t = Math.min(0.95, Math.max(0.05, threshold));
  for (let i = 0; i < alpha.length; i += 1) {
    alpha[i] = alpha[i] <= t ? 0 : Math.min(1, (alpha[i] - t) / (1 - t));
  }
  postMessage({ t: "result", id, alpha, provider: providerName }, [alpha.buffer]);
}

self.onmessage = (event) => {
  const msg = event.data;
  const job = msg.t === "init" ? init(msg) : msg.t === "run" ? run(msg) : Promise.resolve();
  job.catch((err) => {
    postMessage({ t: "error", id: msg.id, message: err?.message || String(err) });
  });
};
