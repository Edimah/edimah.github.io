/**
 * Détourage : orchestration côté page.
 *
 * Routage automatique conservé de la v1 (il marche bien) :
 *  - logo probable (nom de fichier, petite taille)      → color-key global
 *  - photo à fond quasi uni (packshot sur comptoir)     → flood-fill depuis
 *    les bords : seules les zones du fond CONNECTÉES au bord deviennent
 *    transparentes, les étiquettes claires du produit sont préservées
 *  - photo encombrée                                    → IA U²-Net, exécutée
 *    dans un Web Worker (l'interface ne gèle plus), modèle mis en cache.
 *
 * Si le worker échoue (vieux navigateur), repli sur l'ancien module
 * main-thread ../assets/js/bgremoval.mjs.
 *
 * © 2025-2026 Edimah SYNESIUS SONGO — Licence MIT.
 */

const ORT_VERSION = "1.27.0";
const ORT_URL = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/ort.min.js`;
const WASM_BASE = `https://cdn.jsdelivr.net/npm/onnxruntime-web@${ORT_VERSION}/dist/`;
const MODEL_URL = new URL("../models/u2netp.onnx", import.meta.url).href;
const MAX_INPUT_PX = 1500; // les photos smartphone sont réduites avant traitement
const NET_SIZE = 320;

const clamp255 = (v) => Math.min(255, Math.max(0, v));

// --- Worker ------------------------------------------------------------------
let worker = null;
let workerReady = null;
let jobSeq = 0;
const pendingJobs = new Map();
const progressListeners = new Set();

export function onModelProgress(fn) {
  progressListeners.add(fn);
  return () => progressListeners.delete(fn);
}

function ensureWorker() {
  if (workerReady) return workerReady;
  workerReady = new Promise((resolve, reject) => {
    let settled = false;
    try {
      worker = new Worker(new URL("./detour-worker.js", import.meta.url));
    } catch (err) {
      reject(err);
      return;
    }
    worker.onerror = (err) => {
      if (!settled) {
        settled = true;
        reject(new Error(err.message || "Worker en erreur"));
      }
    };
    worker.onmessage = (event) => {
      const msg = event.data;
      if (msg.t === "progress") {
        progressListeners.forEach((fn) => fn(msg));
      } else if (msg.t === "ready") {
        settled = true;
        resolve(msg.provider);
      } else if (msg.t === "result") {
        pendingJobs.get(msg.id)?.resolve(msg);
        pendingJobs.delete(msg.id);
      } else if (msg.t === "error") {
        if (!settled && msg.id === undefined) {
          settled = true;
          reject(new Error(msg.message));
        }
        if (msg.id !== undefined) {
          pendingJobs.get(msg.id)?.reject(new Error(msg.message));
          pendingJobs.delete(msg.id);
        }
      }
    };
    worker.postMessage({ t: "init", ortUrl: ORT_URL, wasmBase: WASM_BASE, modelUrl: MODEL_URL });
  });
  workerReady.catch(() => {
    // Init ratée : on gardera le repli main-thread pour les prochains appels.
    worker?.terminate();
    worker = null;
  });
  return workerReady;
}

/** Précharge le modèle en tâche de fond (appelé au chargement de la page). */
export function prepareDetour() {
  return ensureWorker();
}

function runWorkerInference(procImageData, origW, origH) {
  const id = (jobSeq += 1);
  return new Promise((resolve, reject) => {
    pendingJobs.set(id, { resolve, reject });
    worker.postMessage(
      {
        t: "run",
        id,
        pixels: procImageData.data,
        width: NET_SIZE,
        height: NET_SIZE,
        origW,
        origH,
        feather: 1.5,
        threshold: 0.7,
      },
      [procImageData.data.buffer]
    );
  });
}

// --- Utilitaires image ---------------------------------------------------------
export function fileToImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Image illisible."));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.readAsDataURL(file);
  });
}

/** Réduit l'image à MAX_INPUT_PX de côté max ; retourne un canvas. */
export function downscaleToCanvas(img, maxPx = MAX_INPUT_PX) {
  const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas;
}

// --- Heuristiques de routage (reprises de la v1) --------------------------------
const isLikelyLogo = (file, img) => {
  const name = (file?.name || "").toLowerCase();
  if (/logo|mark/.test(name)) return true;
  return img.width < 256 || img.height < 256;
};

function analyzeBorder(canvas) {
  const target = 160;
  const scale = Math.min(1, target / Math.max(canvas.width, canvas.height));
  const w = Math.max(4, Math.round(canvas.width * scale));
  const h = Math.max(4, Math.round(canvas.height * scale));
  const small = document.createElement("canvas");
  small.width = w;
  small.height = h;
  const ctx = small.getContext("2d");
  ctx.drawImage(canvas, 0, 0, w, h);
  const { data } = ctx.getImageData(0, 0, w, h);
  const border = [];
  const push = (x, y) => {
    const i = (y * w + x) * 4;
    border.push([data[i], data[i + 1], data[i + 2]]);
  };
  for (let x = 0; x < w; x += 1) {
    push(x, 0);
    push(x, h - 1);
  }
  for (let y = 1; y < h - 1; y += 1) {
    push(0, y);
    push(w - 1, y);
  }
  const n = border.length;
  const mean = [0, 1, 2].map((c) => border.reduce((s, p) => s + p[c], 0) / n);
  const dispersion = border.reduce((s, p) => s + Math.abs(p[0] - mean[0]) + Math.abs(p[1] - mean[1]) + Math.abs(p[2] - mean[2]), 0) / n;
  return {
    color: { r: Math.round(mean[0]), g: Math.round(mean[1]), b: Math.round(mean[2]) },
    uniform: dispersion < 24,
  };
}

// --- Détourage couleur (déterministe, rapide) ------------------------------------
function applyColorKey(imageData, keyColor, tolerance) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    const diff = Math.abs(data[i] - keyColor.r) + Math.abs(data[i + 1] - keyColor.g) + Math.abs(data[i + 2] - keyColor.b);
    data[i + 3] = diff <= tolerance ? 0 : 255;
  }
}

function applyBorderFloodKey(imageData, keyColor, tolerance) {
  const { width, height, data } = imageData;
  const threshold = tolerance * 3; // seuil par canal ×3 : absorbe les ombres douces
  const matches = (idx) => {
    const b = idx * 4;
    return Math.abs(data[b] - keyColor.r) + Math.abs(data[b + 1] - keyColor.g) + Math.abs(data[b + 2] - keyColor.b) <= threshold;
  };
  const visited = new Uint8Array(width * height);
  const queue = [];
  const seed = (x, y) => {
    const idx = y * width + x;
    if (!visited[idx] && matches(idx)) {
      visited[idx] = 1;
      queue.push(idx);
    }
  };
  for (let x = 0; x < width; x += 1) {
    seed(x, 0);
    seed(x, height - 1);
  }
  for (let y = 0; y < height; y += 1) {
    seed(0, y);
    seed(width - 1, y);
  }
  while (queue.length) {
    const idx = queue.pop();
    data[idx * 4 + 3] = 0;
    const x = idx % width;
    const y = (idx - x) / width;
    if (x > 0) seed(x - 1, y);
    if (x < width - 1) seed(x + 1, y);
    if (y > 0) seed(x, y - 1);
    if (y < height - 1) seed(x, y + 1);
  }
}

// Ouverture morphologique + flou léger : adoucit les bords du masque binaire.
function softenAlpha(imageData) {
  const { width, height, data } = imageData;
  const len = width * height;
  let alpha = new Float32Array(len);
  for (let i = 0; i < len; i += 1) alpha[i] = data[i * 4 + 3] / 255;
  const pass = (src, op) => {
    const out = new Float32Array(len);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        let acc = op === "blur" ? 0 : op === "min" ? 1 : 0;
        for (let dy = -1; dy <= 1; dy += 1) {
          for (let dx = -1; dx <= 1; dx += 1) {
            const v = src[Math.min(height - 1, Math.max(0, y + dy)) * width + Math.min(width - 1, Math.max(0, x + dx))];
            if (op === "max") acc = Math.max(acc, v);
            else if (op === "min") acc = Math.min(acc, v);
            else acc += v / 9;
          }
        }
        out[y * width + x] = acc;
      }
    }
    return out;
  };
  alpha = pass(alpha, "max");
  alpha = pass(alpha, "min");
  alpha = pass(alpha, "blur");
  for (let i = 0; i < len; i += 1) data[i * 4 + 3] = clamp255(Math.round(alpha[i] * 255));
}

function colorKeyDetour(canvas, { tolerance = 40, keyColor = null, floodFromBorder = true } = {}) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const key = keyColor || { r: imageData.data[0], g: imageData.data[1], b: imageData.data[2] };
  if (floodFromBorder) applyBorderFloodKey(imageData, key, tolerance);
  else applyColorKey(imageData, key, tolerance);
  softenAlpha(imageData);
  const out = document.createElement("canvas");
  out.width = canvas.width;
  out.height = canvas.height;
  out.getContext("2d").putImageData(imageData, 0, 0);
  return out;
}

/** Masque « plat » = l'IA n'a rien discriminé (tout opaque ou tout transparent). */
function isAlphaFlat(alpha) {
  let nearOpaque = 0;
  let nearTransparent = 0;
  for (let i = 0; i < alpha.length; i += 1) {
    if (alpha[i] >= 0.94) nearOpaque += 1;
    else if (alpha[i] <= 0.06) nearTransparent += 1;
  }
  return nearOpaque / alpha.length > 0.995 || nearTransparent / alpha.length > 0.995;
}

async function aiDetour(sourceCanvas) {
  await ensureWorker();
  const proc = document.createElement("canvas");
  proc.width = NET_SIZE;
  proc.height = NET_SIZE;
  proc.getContext("2d").drawImage(sourceCanvas, 0, 0, NET_SIZE, NET_SIZE);
  const procData = proc.getContext("2d").getImageData(0, 0, NET_SIZE, NET_SIZE);

  const { alpha } = await runWorkerInference(procData, sourceCanvas.width, sourceCanvas.height);
  const alphaArr = new Float32Array(alpha.buffer || alpha);
  if (isAlphaFlat(alphaArr)) throw new Error("flat_mask");

  const ctx = sourceCanvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  for (let i = 0; i < alphaArr.length; i += 1) {
    imageData.data[i * 4 + 3] = clamp255(Math.round(alphaArr[i] * 255));
  }
  const out = document.createElement("canvas");
  out.width = sourceCanvas.width;
  out.height = sourceCanvas.height;
  out.getContext("2d").putImageData(imageData, 0, 0);
  return out;
}

// Repli main-thread : ancien module conservé tel quel.
async function aiDetourFallback(file) {
  const { initU2Net, removeBgFromFile } = await import("../assets/js/bgremoval.mjs");
  await initU2Net({ modelUrl: MODEL_URL, providers: ["webgpu", "webgl", "wasm"] });
  const result = await removeBgFromFile(file, { feather: 1.5, threshold: 0.7 });
  const img = new Image();
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
    img.src = result.rgbaDataURL;
  });
  return downscaleToCanvas(img);
}

/**
 * Point d'entrée : détoure un fichier image.
 * mode : "auto" (défaut) | "ia" | "couleur" | "aucun"
 * Retourne { canvas, modeUsed } — canvas prêt à être converti en dataURL.
 */
export async function removeBackground(file, { kind = "product", mode = "auto", tolerance = 40, onStatus = () => {} } = {}) {
  const img = await fileToImage(file);
  const source = downscaleToCanvas(img);

  if (mode === "aucun") return { canvas: source, modeUsed: "aucun" };

  const logo = kind === "logo" || (mode === "auto" && isLikelyLogo(file, img));
  const border = analyzeBorder(source);

  let effective = mode;
  if (mode === "auto") {
    // Packshot sur fond uni : le détourage couleur déterministe bat l'IA de
    // saillance (qui juge « tout saillant » sur ce type de photo).
    effective = logo || border.uniform ? "couleur" : "ia";
  }

  if (effective === "ia") {
    onStatus("Détourage par IA en cours…");
    try {
      const canvas = await aiDetour(source);
      return { canvas, modeUsed: "ia" };
    } catch (err) {
      if (err.message === "flat_mask") {
        // L'IA n'a rien vu de net : on tente le détourage couleur en secours.
        onStatus("IA hésitante, essai en mode couleur…");
        const canvas = colorKeyDetour(source, { tolerance, keyColor: border.color, floodFromBorder: !logo });
        return { canvas, modeUsed: "couleur" };
      }
      // Worker HS → repli main-thread (ancienne implémentation).
      try {
        onStatus("Détourage par IA (mode de secours)…");
        const canvas = await aiDetourFallback(file);
        return { canvas, modeUsed: "ia" };
      } catch (fallbackErr) {
        onStatus("IA indisponible, détourage couleur…");
        const canvas = colorKeyDetour(source, { tolerance, keyColor: border.color, floodFromBorder: !logo });
        return { canvas, modeUsed: "couleur" };
      }
    }
  }

  onStatus("Détourage en cours…");
  const canvas = colorKeyDetour(source, {
    tolerance,
    keyColor: logo ? null : border.color,
    floodFromBorder: !logo,
  });
  return { canvas, modeUsed: "couleur" };
}
