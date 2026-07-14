/**
 * Éditeur d'affiches pour officine — moteur principal.
 *
 * Architecture : l'affiche est une LISTE D'ÉLÉMENTS (state.elements) rendue
 * sur canvas par render.js. L'éditeur ne fait que modifier cet état puis
 * redemander un rendu. Sélection, déplacement, redimensionnement, clavier,
 * annuler/rétablir et sauvegarde automatique opèrent tous sur ce même état.
 *
 * © 2025-2026 Edimah SYNESIUS SONGO — Licence MIT.
 */

import {
  FORMATS,
  THEMES,
  TEMPLATES,
  UNIT_W,
  buildState,
  getFormat,
  getTheme,
  getTemplate,
  posterHeight,
  uid,
  makeText,
  makeBadge,
  makeBand,
  makeImage,
} from "./templates.js";
import { renderPoster, renderToCanvas, resolveColor, contrastRatio, resolveTop, withAlpha } from "./render.js";
import { removeBackground, prepareDetour, onModelProgress, fileToImage, downscaleToCanvas } from "./detour.js";

const $ = (id) => document.getElementById(id);

// --- Références DOM -----------------------------------------------------------
const posterCanvas = $("posterCanvas");
const posterWrap = $("posterWrap");
const overlay = $("selectionOverlay");
const selBox = $("selBox");
const selHandle = $("selHandle");
const panel = $("panel");
const detourStatus = $("detourStatus");
const detourProgress = $("detourProgress");
const modalRoot = $("modalRoot");
const restoreBanner = $("restoreBanner");
const hiddenFileInput = $("hiddenFileInput");

// --- État global ----------------------------------------------------------------
let state = null;
const assets = new Map(); // imageId -> HTMLImageElement (décodée)
let layout = new Map(); // id -> géométrie résolue en unités (dernier rendu)
let selectedId = null;
let history = [];
let historyIndex = -1;
let renderQueued = false;
let saveTimer = null;
let pendingImport = null; // { elementId } quand on remplace la photo d'un emplacement

const HISTORY_MAX = 60;

// =================================================================================
// Rendu
// =================================================================================
const posterArea = $("posterArea");

// Largeur d'affichage : tient dans la colonne ET dans la hauteur de l'écran
// (les formats très hauts comme la story 9:16 sont réduits en conséquence).
function previewCssWidth() {
  const ratio = getFormat(state.formatId).ratio;
  const availW = Math.max(240, posterArea.clientWidth - 8);
  const availH = Math.max(320, window.innerHeight - 200);
  return Math.round(Math.min(availW, availH / ratio, 720));
}

function requestRender() {
  if (renderQueued) return;
  renderQueued = true;
  requestAnimationFrame(() => {
    renderQueued = false;
    if (!state) return;
    const cssW = previewCssWidth();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    layout = renderPoster(posterCanvas, state, Math.round(cssW * dpr), assets, { placeholders: true });
    posterCanvas.style.width = `${cssW}px`;
    posterCanvas.style.height = "auto";
    updateSelectionOverlay();
  });
}

const unitsPerCssPx = () => UNIT_W / posterCanvas.getBoundingClientRect().width;

function updateSelectionOverlay() {
  const box = selectedId ? layout.get(selectedId) : null;
  if (!box) {
    selBox.style.display = "none";
    return;
  }
  const s = 1 / unitsPerCssPx();
  selBox.style.display = "block";
  selBox.style.left = `${box.x * s - 3}px`;
  selBox.style.top = `${box.y * s - 3}px`;
  selBox.style.width = `${box.w * s + 6}px`;
  selBox.style.height = `${box.h * s + 6}px`;
}

// =================================================================================
// Historique + sauvegarde automatique (IndexedDB)
// =================================================================================
function snapshot() {
  return JSON.parse(JSON.stringify(state));
}

function pushHistory() {
  history = history.slice(0, historyIndex + 1);
  history.push(snapshot());
  if (history.length > HISTORY_MAX) history.shift();
  historyIndex = history.length - 1;
  updateUndoButtons();
  scheduleSave();
}

function applySnapshot(snap) {
  state = JSON.parse(JSON.stringify(snap));
  if (!state.elements.some((el) => el.id === selectedId)) selectedId = null;
  syncAssets().then(requestRender);
  renderPanel();
  requestRender();
}

function undo() {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  applySnapshot(history[historyIndex]);
  updateUndoButtons();
  scheduleSave();
}

function redo() {
  if (historyIndex >= history.length - 1) return;
  historyIndex += 1;
  applySnapshot(history[historyIndex]);
  updateUndoButtons();
  scheduleSave();
}

function updateUndoButtons() {
  $("undoBtn").disabled = historyIndex <= 0;
  $("redoBtn").disabled = historyIndex >= history.length - 1;
}

// IndexedDB minimaliste : un seul enregistrement « affiche en cours ».
function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("affiche-officine", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("kv");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("kv", "readwrite");
    tx.objectStore("kv").put(value, key);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

async function idbGet(key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const req = db.transaction("kv", "readonly").objectStore("kv").get(key);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    // Purge des images orphelines avant sauvegarde.
    const used = new Set(state.elements.map((el) => el.imageId).filter(Boolean));
    if (state.bg.imageId) used.add(state.bg.imageId);
    for (const id of Object.keys(state.images)) {
      if (!used.has(id)) delete state.images[id];
    }
    idbSet("current", snapshot()).catch(() => {});
  }, 800);
}

// =================================================================================
// Images (assets)
// =================================================================================
function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

async function syncAssets() {
  const jobs = [];
  for (const [id, entry] of Object.entries(state.images)) {
    if (!assets.has(id)) {
      jobs.push(
        loadImageElement(entry.src)
          .then((img) => assets.set(id, img))
          .catch(() => {})
      );
    }
  }
  await Promise.all(jobs);
}

function registerImage(canvas, origDataURL, kind) {
  const id = uid();
  const src = canvas.toDataURL("image/png");
  state.images[id] = { src, orig: origDataURL, kind, w: canvas.width, h: canvas.height };
  const img = new Image();
  img.src = src;
  assets.set(id, img);
  return new Promise((resolve) => {
    img.onload = () => resolve(id);
    img.onerror = () => resolve(id);
  });
}

async function updateImageSrc(imageId, canvas) {
  state.images[imageId].src = canvas.toDataURL("image/png");
  state.images[imageId].w = canvas.width;
  state.images[imageId].h = canvas.height;
  assets.set(imageId, await loadImageElement(state.images[imageId].src));
}

// =================================================================================
// Sélection & manipulation à la souris / au doigt
// =================================================================================
function getSelected() {
  return state?.elements.find((el) => el.id === selectedId) || null;
}

// setPointerCapture peut lever une exception (pointeur déjà relâché,
// événement synthétique) : la capture est un confort, jamais bloquante.
function capturePointer(element, pointerId) {
  try {
    element.setPointerCapture(pointerId);
  } catch (e) {
    /* sans gravité */
  }
}

function setElementTop(el, topUnits) {
  const H = posterHeight(state.formatId);
  const h = layout.get(el.id)?.h ?? el.h;
  if (el.anchor === "bottom") el.y = H - topUnits - h;
  else if (el.anchor === "center") el.y = topUnits + h / 2 - H / 2;
  else el.y = topUnits;
}

function hitTest(ux, uy) {
  const sorted = [...state.elements].sort((a, b) => (b.z || 0) - (a.z || 0));
  for (const el of sorted) {
    const box = layout.get(el.id);
    if (box && ux >= box.x && ux <= box.x + box.w && uy >= box.y && uy <= box.y + box.h) return el;
  }
  return null;
}

function select(id) {
  selectedId = id;
  updateSelectionOverlay();
  renderPanel();
}

// Conversion pointeur → unités affiche.
function pointerUnits(event) {
  const rect = posterCanvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * UNIT_W,
    y: ((event.clientY - rect.top) / rect.height) * posterHeight(state.formatId),
  };
}

let dragging = null;

overlay.addEventListener("pointerdown", (event) => {
  if (event.target === selHandle) return; // géré par le redimensionnement
  const p = pointerUnits(event);
  const el = hitTest(p.x, p.y);
  select(el ? el.id : null);
  if (!el) return;
  event.preventDefault();
  capturePointer(overlay, event.pointerId);
  const box = layout.get(el.id);
  dragging = { el, startP: p, startX: el.x, startTop: box.y, moved: false };
});

overlay.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  const p = pointerUnits(event);
  const dx = p.x - dragging.startP.x;
  const dy = p.y - dragging.startP.y;
  if (Math.abs(dx) + Math.abs(dy) > 2) dragging.moved = true;
  dragging.el.x = Math.round(dragging.startX + dx);
  setElementTop(dragging.el, Math.round(dragging.startTop + dy));
  requestRender();
});

const endDrag = (event) => {
  if (!dragging) return;
  if (overlay.hasPointerCapture?.(event.pointerId)) overlay.releasePointerCapture(event.pointerId);
  if (dragging.moved) pushHistory();
  dragging = null;
};
overlay.addEventListener("pointerup", endDrag);
overlay.addEventListener("pointercancel", endDrag);

// Double-clic : ouvrir directement l'édition adaptée à l'élément.
overlay.addEventListener("dblclick", (event) => {
  const p = pointerUnits(event);
  const el = hitTest(p.x, p.y);
  if (!el) return;
  select(el.id);
  if (el.type === "text" || el.type === "badge") {
    const field = panel.querySelector("[data-autofocus]");
    if (field) {
      field.focus();
      field.select?.();
    }
  } else if (el.type === "image" && !el.imageId) {
    startImport(el.id, el.kind);
  } else if (el.type === "image") {
    startImport(el.id, el.kind); // remplacer la photo
  }
});

// Poignée de redimensionnement (coin bas-droit de la sélection).
let resizing = null;
selHandle.addEventListener("pointerdown", (event) => {
  const el = getSelected();
  if (!el) return;
  event.preventDefault();
  event.stopPropagation();
  capturePointer(selHandle, event.pointerId);
  resizing = { el, startP: pointerUnits(event), startW: el.w, startH: el.h };
});

selHandle.addEventListener("pointermove", (event) => {
  if (!resizing) return;
  const p = pointerUnits(event);
  const dx = p.x - resizing.startP.x;
  const dy = p.y - resizing.startP.y;
  const el = resizing.el;
  const minW = 60;
  if (el.type === "text") {
    el.w = Math.max(minW, Math.round(resizing.startW + dx));
  } else if (el.type === "band") {
    el.h = Math.max(40, Math.round(resizing.startH + dy));
  } else {
    // image, badge : proportionnel
    const factor = Math.max(0.15, (resizing.startW + dx) / resizing.startW);
    el.w = Math.max(minW, Math.round(resizing.startW * factor));
    el.h = Math.max(minW, Math.round(resizing.startH * factor));
  }
  requestRender();
});

const endResize = (event) => {
  if (!resizing) return;
  if (selHandle.hasPointerCapture?.(event.pointerId)) selHandle.releasePointerCapture(event.pointerId);
  pushHistory();
  resizing = null;
};
selHandle.addEventListener("pointerup", endResize);
selHandle.addEventListener("pointercancel", endResize);

// Molette sur un élément sélectionné : agrandir / réduire.
overlay.addEventListener(
  "wheel",
  (event) => {
    const el = getSelected();
    if (!el || el.type === "band") return;
    event.preventDefault();
    const factor = event.deltaY < 0 ? 1.05 : 0.95;
    el.w = Math.max(40, Math.round(el.w * factor));
    if (el.type !== "text") el.h = Math.max(40, Math.round(el.h * factor));
    requestRender();
    clearTimeout(overlay._wheelTimer);
    overlay._wheelTimer = setTimeout(pushHistory, 400);
  },
  { passive: false }
);

// Clavier : flèches pour déplacer, Suppr pour retirer, Ctrl+Z/Y, Ctrl+D.
document.addEventListener("keydown", (event) => {
  const inField = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName || "");
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !inField) {
    event.preventDefault();
    event.shiftKey ? redo() : undo();
    return;
  }
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y" && !inField) {
    event.preventDefault();
    redo();
    return;
  }
  const el = getSelected();
  if (!el || inField) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
    event.preventDefault();
    duplicateSelected();
    return;
  }
  if (event.key === "Delete" || event.key === "Backspace") {
    event.preventDefault();
    deleteSelected();
    return;
  }
  if (event.key === "Escape") {
    select(null);
    return;
  }
  const step = event.shiftKey ? 20 : 5;
  const box = layout.get(el.id);
  if (!box) return;
  let handled = true;
  if (event.key === "ArrowLeft") el.x -= step;
  else if (event.key === "ArrowRight") el.x += step;
  else if (event.key === "ArrowUp") setElementTop(el, box.y - step);
  else if (event.key === "ArrowDown") setElementTop(el, box.y + step);
  else handled = false;
  if (handled) {
    event.preventDefault();
    requestRender();
    clearTimeout(document._nudgeTimer);
    document._nudgeTimer = setTimeout(pushHistory, 500);
  }
});

function deleteSelected() {
  const el = getSelected();
  if (!el) return;
  state.elements = state.elements.filter((e) => e.id !== el.id);
  select(null);
  requestRender();
  pushHistory();
}

function duplicateSelected() {
  const el = getSelected();
  if (!el) return;
  const copy = JSON.parse(JSON.stringify(el));
  copy.id = uid();
  copy.x += 30;
  copy.y += el.anchor === "bottom" ? -30 : 30;
  state.elements.push(copy);
  select(copy.id);
  requestRender();
  pushHistory();
}

// =================================================================================
// Import de photos + détourage
// =================================================================================
function setDetourStatus(text, spinning = false) {
  detourStatus.textContent = text;
  detourStatus.classList.toggle("busy", spinning);
  detourStatus.classList.toggle("is-visible", Boolean(text));
}

onModelProgress(({ pct, phase }) => {
  if (phase === "cache") {
    detourProgress.hidden = true;
    return;
  }
  detourProgress.hidden = false;
  detourProgress.value = pct;
  setDetourStatus(`Téléchargement du modèle IA… ${pct}%`, true);
  if (pct >= 100) {
    detourProgress.hidden = true;
    setDetourStatus("");
  }
});

function startImport(elementId, kind) {
  pendingImport = { elementId, kind };
  hiddenFileInput.value = "";
  hiddenFileInput.click();
}

hiddenFileInput.addEventListener("change", async () => {
  const file = hiddenFileInput.files?.[0];
  const target = pendingImport;
  pendingImport = null;
  if (!file || !target) return;
  if (!file.type.startsWith("image/")) {
    alert("Choisissez un fichier image (photo JPEG ou PNG).");
    return;
  }
  if (file.size > 12 * 1024 * 1024) {
    alert("Image trop lourde (plus de 12 Mo). Réduisez-la ou prenez une photo moins grande.");
    return;
  }
  await importFileInto(file, target.elementId, target.kind);
});

async function importFileInto(file, elementId, kind) {
  setDetourStatus("Préparation de la photo…", true);
  try {
    const img = await fileToImage(file);
    const origCanvas = downscaleToCanvas(img);
    const origDataURL = origCanvas.toDataURL("image/png");

    const mode = kind === "logo" ? "auto" : "auto";
    const { canvas, modeUsed } = await removeBackground(file, { kind, mode, onStatus: (m) => setDetourStatus(m, true) });
    const imageId = await registerImage(canvas, origDataURL, kind);

    let el = state.elements.find((e) => e.id === elementId);
    if (!el) {
      el = makeImage({ kind, anchor: "center", x: 250, y: 0, w: 500, h: 500 });
      state.elements.push(el);
    }
    el.imageId = imageId;
    select(el.id);
    requestRender();
    pushHistory();
    setDetourStatus(modeUsed === "ia" ? "Fond retiré par IA ✅" : "Fond retiré ✅");
    setTimeout(() => setDetourStatus(""), 3500);
  } catch (err) {
    console.error("Import échoué", err);
    setDetourStatus("Impossible de traiter cette photo. Réessayez avec une autre.", false);
    setTimeout(() => setDetourStatus(""), 5000);
  }
}

/** Re-détoure la photo d'un élément avec un mode imposé. */
async function retryDetour(el, mode) {
  const entry = state.images[el.imageId];
  if (!entry?.orig) return;
  setDetourStatus("Nouveau détourage…", true);
  try {
    const blob = await (await fetch(entry.orig)).blob();
    const { canvas, modeUsed } = await removeBackground(blob, { kind: el.kind, mode, onStatus: (m) => setDetourStatus(m, true) });
    await updateImageSrc(el.imageId, canvas);
    requestRender();
    pushHistory();
    setDetourStatus(mode === "aucun" ? "Photo d'origine restaurée ✅" : modeUsed === "ia" ? "Fond retiré par IA ✅" : "Fond retiré ✅");
    setTimeout(() => setDetourStatus(""), 3500);
  } catch (err) {
    console.error(err);
    setDetourStatus("Le détourage a échoué.", false);
    setTimeout(() => setDetourStatus(""), 4000);
  }
}

// =================================================================================
// Panneau contextuel (colonne de droite)
// =================================================================================
function ctl(html) {
  const div = document.createElement("div");
  div.className = "ctl";
  div.innerHTML = html;
  return div;
}

function colorSwatchRow(current, onPick) {
  const theme = getTheme(state.themeId);
  const row = document.createElement("div");
  row.className = "swatch-row";
  const options = [
    ["auto", null],
    ["#ffffff", "#ffffff"],
    ["#1c2b28", "#1c2b28"],
    [theme.band, theme.band],
    [theme.accent, theme.accent],
  ];
  options.forEach(([value, hex]) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "swatch";
    b.title = value === "auto" ? "Couleur automatique (thème)" : value;
    b.style.background = hex || `linear-gradient(135deg, ${theme.band}, ${theme.accent})`;
    if (value === "auto") b.classList.add("swatch-auto");
    b.addEventListener("click", () => onPick(value));
    row.appendChild(b);
  });
  const custom = document.createElement("input");
  custom.type = "color";
  custom.value = /^#/.test(current) ? current : "#333333";
  custom.title = "Couleur personnalisée";
  custom.addEventListener("input", () => onPick(custom.value));
  row.appendChild(custom);
  return row;
}

function commonButtons(el) {
  const wrap = document.createElement("div");
  wrap.className = "btn-row";
  const mk = (label, cls, fn) => {
    const b = document.createElement("button");
    b.type = "button";
    b.className = `mini ${cls || ""}`;
    b.textContent = label;
    b.addEventListener("click", fn);
    wrap.appendChild(b);
  };
  mk("⬆ Devant", "", () => {
    el.z = (el.z || 0) + 1;
    requestRender();
    pushHistory();
  });
  mk("⬇ Derrière", "", () => {
    el.z = Math.max(0, (el.z || 0) - 1);
    requestRender();
    pushHistory();
  });
  mk("⧉ Dupliquer", "", duplicateSelected);
  mk("🗑 Retirer", "danger", deleteSelected);
  return wrap;
}

function renderPanel() {
  panel.innerHTML = "";
  const el = getSelected();
  const theme = getTheme(state.themeId);

  if (!el) {
    panel.appendChild(
      ctl(`<h3>Affiche</h3><p class="hint">Cliquez sur un élément de l'affiche pour le modifier, ou utilisez les boutons « Ajouter ».</p>`)
    );

    // Thèmes de couleurs
    const themeBlock = ctl(`<label>Couleurs du thème</label>`);
    const row = document.createElement("div");
    row.className = "swatch-row";
    THEMES.forEach((t) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "swatch theme-swatch" + (t.id === state.themeId ? " active" : "");
      b.style.background = `linear-gradient(135deg, ${t.band} 55%, ${t.accent} 55%)`;
      b.title = t.label;
      b.addEventListener("click", () => {
        state.themeId = t.id;
        requestRender();
        renderPanel();
        pushHistory();
      });
      row.appendChild(b);
    });
    themeBlock.appendChild(row);
    panel.appendChild(themeBlock);

    // Fond
    const bgBlock = ctl(`<label>Fond de l'affiche</label>`);
    const sel = document.createElement("select");
    [
      ["none", "Uni (couleur du thème)"],
      ["bubbles", "Bulles"],
      ["waves", "Vagues"],
      ["dots", "Pois"],
    ].forEach(([v, l]) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = l;
      if (state.bg.pattern === v && state.bg.mode === "theme") o.selected = true;
      sel.appendChild(o);
    });
    sel.addEventListener("change", () => {
      state.bg.mode = "theme";
      state.bg.pattern = sel.value;
      requestRender();
      pushHistory();
    });
    bgBlock.appendChild(sel);
    const regen = document.createElement("button");
    regen.type = "button";
    regen.className = "mini";
    regen.textContent = "🎲 Varier le motif";
    regen.addEventListener("click", () => {
      state.bg.seed = Math.floor(Math.random() * 1e9);
      requestRender();
      pushHistory();
    });
    bgBlock.appendChild(regen);
    panel.appendChild(bgBlock);

    const solidBlock = ctl(`<label>Ou une couleur unie personnalisée</label>`);
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.value = state.bg.mode === "solid" && state.bg.color ? state.bg.color : "#eef7f2";
    colorInput.addEventListener("input", () => {
      state.bg.mode = "solid";
      state.bg.color = colorInput.value;
      requestRender();
    });
    colorInput.addEventListener("change", pushHistory);
    solidBlock.appendChild(colorInput);
    panel.appendChild(solidBlock);
    return;
  }

  if (el.type === "text") {
    const block = ctl(`<h3>Texte</h3>`);
    const ta = document.createElement("textarea");
    ta.value = el.text;
    ta.rows = 3;
    ta.setAttribute("data-autofocus", "");
    ta.addEventListener("input", () => {
      el.text = ta.value;
      requestRender();
    });
    ta.addEventListener("change", pushHistory);
    block.appendChild(ta);
    panel.appendChild(block);

    const styleBlock = ctl(`<label>Style</label>`);
    const fontSel = document.createElement("select");
    [
      ["sans", "Moderne (Poppins)"],
      ["serif", "Élégante (Playfair)"],
    ].forEach(([v, l]) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = l;
      if (el.font === v) o.selected = true;
      fontSel.appendChild(o);
    });
    fontSel.addEventListener("change", () => {
      el.font = fontSel.value;
      requestRender();
      pushHistory();
    });
    styleBlock.appendChild(fontSel);

    const sizeRow = document.createElement("div");
    sizeRow.className = "btn-row";
    const mkSize = (label, delta) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mini";
      b.textContent = label;
      b.addEventListener("click", () => {
        el.size = Math.max(14, Math.min(320, el.size + delta));
        requestRender();
        pushHistory();
      });
      sizeRow.appendChild(b);
    };
    mkSize("A−", -4);
    mkSize("A+", +4);
    const boldBtn = document.createElement("button");
    boldBtn.type = "button";
    boldBtn.className = "mini" + (el.weight >= 700 ? " active" : "");
    boldBtn.textContent = "Gras";
    boldBtn.addEventListener("click", () => {
      el.weight = el.weight >= 700 ? 400 : 700;
      requestRender();
      renderPanel();
      pushHistory();
    });
    sizeRow.appendChild(boldBtn);
    ["left", "center", "right"].forEach((align) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mini" + (el.align === align ? " active" : "");
      b.textContent = align === "left" ? "Gauche" : align === "center" ? "Centré" : "Droite";
      b.title = "Alignement du texte";
      b.addEventListener("click", () => {
        el.align = align;
        requestRender();
        renderPanel();
        pushHistory();
      });
      sizeRow.appendChild(b);
    });
    styleBlock.appendChild(sizeRow);

    const colorBlock = ctl(`<label>Couleur du texte</label>`);
    colorBlock.appendChild(
      colorSwatchRow(resolveColor(el.color, theme), (value) => {
        el.color = value === "auto" ? "text" : value;
        requestRender();
        renderPanel();
        pushHistory();
      })
    );
    panel.appendChild(styleBlock);
    panel.appendChild(colorBlock);

    // Contrôle de lisibilité : texte vs surface située dessous.
    const box = layout.get(el.id);
    if (box) {
      const under = state.elements.find((band) => {
        if (band.type !== "band") return false;
        const bb = layout.get(band.id);
        if (!bb) return false;
        const overlapY = Math.min(box.y + box.h, bb.y + bb.h) - Math.max(box.y, bb.y);
        return overlapY > box.h * 0.5;
      });
      const bgHex = under ? resolveColor(under.fill, theme) : theme.bg;
      const fgHex = resolveColor(el.color, theme);
      if (contrastRatio(fgHex, bgHex) < 3) {
        const warn = ctl(`<div class="warn">⚠️ Ce texte risque d'être peu lisible sur ce fond.</div>`);
        const fix = document.createElement("button");
        fix.type = "button";
        fix.className = "mini";
        fix.textContent = "Corriger automatiquement";
        fix.addEventListener("click", () => {
          el.color = contrastRatio("#ffffff", bgHex) >= contrastRatio("#1c2b28", bgHex) ? "#ffffff" : "#1c2b28";
          requestRender();
          renderPanel();
          pushHistory();
        });
        warn.appendChild(fix);
        panel.appendChild(warn);
      }
    }
  } else if (el.type === "image") {
    const block = ctl(`<h3>${el.kind === "logo" ? "Logo" : "Photo produit"}</h3>`);
    const replaceBtn = document.createElement("button");
    replaceBtn.type = "button";
    replaceBtn.className = "primary";
    replaceBtn.textContent = el.imageId ? "Remplacer la photo" : "Choisir une photo";
    replaceBtn.addEventListener("click", () => startImport(el.id, el.kind));
    block.appendChild(replaceBtn);
    panel.appendChild(block);

    if (el.imageId) {
      const detourBlock = ctl(`<label>Détourage (fond retiré)</label><p class="hint">Le fond n'est pas bien retiré ? Essayez :</p>`);
      const row = document.createElement("div");
      row.className = "btn-row";
      [
        ["auto", "Auto"],
        ["ia", "IA"],
        ["couleur", "Fond uni"],
        ["aucun", "Garder l'original"],
      ].forEach(([mode, label]) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "mini";
        b.textContent = label;
        b.addEventListener("click", () => retryDetour(el, mode));
        row.appendChild(b);
      });
      detourBlock.appendChild(row);
      const brushBtn = document.createElement("button");
      brushBtn.type = "button";
      brushBtn.textContent = "🖌 Retoucher à la main";
      brushBtn.addEventListener("click", () => openRefineModal(el));
      detourBlock.appendChild(brushBtn);
      panel.appendChild(detourBlock);
    }
  } else if (el.type === "badge") {
    const block = ctl(`<h3>Pastille promo</h3>`);
    const input = document.createElement("textarea");
    input.rows = 2;
    input.value = el.text;
    input.setAttribute("data-autofocus", "");
    input.addEventListener("input", () => {
      el.text = input.value;
      requestRender();
    });
    input.addEventListener("change", pushHistory);
    block.appendChild(input);
    panel.appendChild(block);

    const shapeBlock = ctl(`<label>Forme</label>`);
    const row = document.createElement("div");
    row.className = "btn-row";
    [
      ["star", "★ Étoile"],
      ["circle", "● Rond"],
      ["pill", "▬ Bandeau"],
    ].forEach(([shape, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mini" + (el.shape === shape ? " active" : "");
      b.textContent = label;
      b.addEventListener("click", () => {
        el.shape = shape;
        if (shape === "pill" && el.h > el.w * 0.5) el.h = Math.round(el.w * 0.4);
        if (shape !== "pill") el.h = el.w;
        requestRender();
        renderPanel();
        pushHistory();
      });
      row.appendChild(b);
    });
    shapeBlock.appendChild(row);
    panel.appendChild(shapeBlock);

    const colorBlock = ctl(`<label>Couleur</label>`);
    colorBlock.appendChild(
      colorSwatchRow(resolveColor(el.fill, theme), (value) => {
        el.fill = value === "auto" ? "accent" : value;
        requestRender();
        pushHistory();
      })
    );
    panel.appendChild(colorBlock);
  } else if (el.type === "band") {
    const block = ctl(`<h3>Bandeau</h3><label>Couleur</label>`);
    block.appendChild(
      colorSwatchRow(resolveColor(el.fill, theme), (value) => {
        el.fill = value === "auto" ? "band" : value;
        requestRender();
        pushHistory();
      })
    );
    const alphaLabel = ctl(`<label>Transparence</label>`);
    const range = document.createElement("input");
    range.type = "range";
    range.min = 30;
    range.max = 100;
    range.value = Math.round((el.alpha ?? 1) * 100);
    range.addEventListener("input", () => {
      el.alpha = Number(range.value) / 100;
      requestRender();
    });
    range.addEventListener("change", pushHistory);
    alphaLabel.appendChild(range);
    const shapeRow = document.createElement("div");
    shapeRow.className = "btn-row";
    [
      ["rect", "Droit"],
      ["slant", "Incliné"],
      ["pill", "Arrondi"],
    ].forEach(([shape, label]) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "mini" + (el.shape === shape ? " active" : "");
      b.textContent = label;
      b.addEventListener("click", () => {
        el.shape = shape;
        requestRender();
        renderPanel();
        pushHistory();
      });
      shapeRow.appendChild(b);
    });
    panel.appendChild(block);
    panel.appendChild(alphaLabel);
    const shapeBlock = ctl(`<label>Forme</label>`);
    shapeBlock.appendChild(shapeRow);
    panel.appendChild(shapeBlock);
  }

  panel.appendChild(commonButtons(el));
  panel.appendChild(
    ctl(`<p class="hint">Astuce : glissez pour déplacer · coin bleu pour la taille · flèches du clavier pour ajuster · Suppr pour retirer.</p>`)
  );
}

// =================================================================================
// Retouche manuelle du détourage (gomme / restauration)
// =================================================================================
function openRefineModal(el) {
  const entry = state.images[el.imageId];
  if (!entry) return;
  const modal = showModal(`
    <h2>Retoucher le détourage</h2>
    <p class="hint">🧽 <b>Gommer</b> efface le fond restant · 🖌 <b>Restaurer</b> fait réapparaître ce que l'IA a trop effacé. Dessinez directement sur l'image.</p>
    <div class="btn-row" id="refineTools">
      <button type="button" class="mini active" data-tool="erase">🧽 Gommer</button>
      <button type="button" class="mini" data-tool="restore">🖌 Restaurer</button>
      <label class="brush-size">Taille <input type="range" id="brushSize" min="8" max="80" value="30" /></label>
    </div>
    <div class="refine-wrap"><canvas id="refineCanvas"></canvas></div>
    <div class="btn-row modal-actions">
      <button type="button" class="secondary" data-close>Annuler</button>
      <button type="button" class="primary" id="refineApply">Valider la retouche</button>
    </div>
  `);

  const canvas = modal.querySelector("#refineCanvas");
  const wrap = modal.querySelector(".refine-wrap");
  const work = document.createElement("canvas"); // pleine résolution
  work.width = entry.w;
  work.height = entry.h;
  const workCtx = work.getContext("2d");
  let origImg = null;
  let tool = "erase";

  Promise.all([loadImageElement(entry.src), loadImageElement(entry.orig)]).then(([cut, orig]) => {
    origImg = orig;
    workCtx.drawImage(cut, 0, 0);
    const maxW = Math.min(560, wrap.clientWidth || 560);
    const scale = Math.min(1, maxW / work.width);
    canvas.width = Math.round(work.width * scale);
    canvas.height = Math.round(work.height * scale);
    redraw();
  });

  const redraw = () => {
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(work, 0, 0, canvas.width, canvas.height);
  };

  modal.querySelectorAll("#refineTools [data-tool]").forEach((b) => {
    b.addEventListener("click", () => {
      tool = b.dataset.tool;
      modal.querySelectorAll("#refineTools [data-tool]").forEach((x) => x.classList.toggle("active", x === b));
    });
  });

  let painting = false;
  const paint = (event) => {
    if (!origImg) return;
    const rect = canvas.getBoundingClientRect();
    const fx = (event.clientX - rect.left) / rect.width;
    const fy = (event.clientY - rect.top) / rect.height;
    const x = fx * work.width;
    const y = fy * work.height;
    const r = (Number(modal.querySelector("#brushSize").value) / rect.width) * work.width;
    workCtx.save();
    workCtx.beginPath();
    workCtx.arc(x, y, r, 0, Math.PI * 2);
    if (tool === "erase") {
      workCtx.globalCompositeOperation = "destination-out";
      workCtx.fill();
    } else {
      workCtx.clip();
      workCtx.globalCompositeOperation = "source-over";
      workCtx.drawImage(origImg, 0, 0, work.width, work.height);
    }
    workCtx.restore();
    redraw();
  };
  canvas.addEventListener("pointerdown", (e) => {
    painting = true;
    capturePointer(canvas, e.pointerId);
    paint(e);
  });
  canvas.addEventListener("pointermove", (e) => painting && paint(e));
  canvas.addEventListener("pointerup", () => (painting = false));
  canvas.addEventListener("pointercancel", () => (painting = false));

  modal.querySelector("#refineApply").addEventListener("click", async () => {
    await updateImageSrc(el.imageId, work);
    requestRender();
    pushHistory();
    closeModal();
  });
}

// =================================================================================
// Fenêtres modales génériques
// =================================================================================
function showModal(html) {
  modalRoot.innerHTML = `<div class="modal-backdrop"><div class="modal">${html}</div></div>`;
  modalRoot.hidden = false;
  const backdrop = modalRoot.querySelector(".modal-backdrop");
  backdrop.addEventListener("pointerdown", (e) => {
    if (e.target === backdrop) closeModal();
  });
  modalRoot.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeModal));
  return modalRoot.querySelector(".modal");
}

function closeModal() {
  modalRoot.hidden = true;
  modalRoot.innerHTML = "";
}

// --- Assistant « Nouvelle affiche » : modèle puis format, avec aperçus. -----------
function openWizard({ firstRun = false } = {}) {
  const modal = showModal(`
    <h2>Nouvelle affiche</h2>
    <p class="hint">1. Choisissez un modèle — vous pourrez tout modifier ensuite.</p>
    <div class="card-grid" id="wizardTemplates"></div>
    ${firstRun ? "" : '<div class="btn-row modal-actions"><button type="button" class="secondary" data-close>Annuler</button></div>'}
  `);
  const grid = modal.querySelector("#wizardTemplates");
  const themeId = state?.themeId || THEMES[0].id;

  TEMPLATES.forEach((tpl) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "pick-card";
    const demo = buildState(tpl.id, "a4-portrait", themeId);
    const thumb = renderToCanvas(demo, assets, 240, { placeholders: true });
    thumb.className = "pick-thumb";
    card.appendChild(thumb);
    const label = document.createElement("div");
    label.innerHTML = `<b>${tpl.label}</b><small>${tpl.desc}</small>`;
    card.appendChild(label);
    card.addEventListener("click", () => openWizardFormatStep(tpl.id, firstRun));
    grid.appendChild(card);
  });
}

function openWizardFormatStep(templateId, firstRun) {
  const modal = showModal(`
    <h2>Nouvelle affiche</h2>
    <p class="hint">2. Choisissez le format.</p>
    <div class="card-grid" id="wizardFormats"></div>
    <div class="btn-row modal-actions"><button type="button" class="secondary" id="wizardBack">← Retour aux modèles</button></div>
  `);
  const grid = modal.querySelector("#wizardFormats");
  const themeId = state?.themeId || THEMES[0].id;

  FORMATS.forEach((fmt) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "pick-card";
    const demo = buildState(templateId, fmt.id, themeId);
    const thumbW = fmt.ratio >= 1 ? 150 : 210;
    const thumb = renderToCanvas(demo, assets, thumbW, { placeholders: true });
    thumb.className = "pick-thumb";
    card.appendChild(thumb);
    const label = document.createElement("div");
    label.innerHTML = `<b>${fmt.label}</b><small>${fmt.sub}</small>`;
    card.appendChild(label);
    card.addEventListener("click", () => {
      applyNewState(buildState(templateId, fmt.id, themeId));
      closeModal();
    });
    grid.appendChild(card);
  });
  modal.querySelector("#wizardBack").addEventListener("click", () => openWizard({ firstRun }));
}

// --- Changement de format seul (conserve le contenu actuel). ----------------------
function openFormatModal() {
  const modal = showModal(`
    <h2>Format de l'affiche</h2>
    <p class="hint">Votre contenu est conservé : les éléments ancrés en haut et en bas suivent le nouveau format.</p>
    <div class="card-grid" id="formatCards"></div>
    <div class="btn-row modal-actions"><button type="button" class="secondary" data-close>Annuler</button></div>
  `);
  const grid = modal.querySelector("#formatCards");
  FORMATS.forEach((fmt) => {
    const card = document.createElement("button");
    card.type = "button";
    card.className = "pick-card" + (fmt.id === state.formatId ? " active" : "");
    const preview = JSON.parse(JSON.stringify(state));
    preview.formatId = fmt.id;
    const thumbW = fmt.ratio >= 1 ? 150 : 210;
    const thumb = renderToCanvas(preview, assets, thumbW, { placeholders: true });
    thumb.className = "pick-thumb";
    card.appendChild(thumb);
    const label = document.createElement("div");
    label.innerHTML = `<b>${fmt.label}</b><small>${fmt.sub}</small>`;
    card.appendChild(label);
    card.addEventListener("click", () => {
      state.formatId = fmt.id;
      requestRender();
      pushHistory();
      closeModal();
    });
    grid.appendChild(card);
  });
}

function applyNewState(next) {
  // Ré-attache les photos déjà importées aux emplacements du nouveau modèle.
  if (state?.images) {
    const oldImages = state.images;
    const products = Object.entries(oldImages).filter(([, v]) => v.kind === "product");
    const logos = Object.entries(oldImages).filter(([, v]) => v.kind === "logo");
    next.images = { ...oldImages };
    let pi = 0;
    for (const el of next.elements) {
      if (el.type === "image" && el.kind === "product" && products[pi]) {
        el.imageId = products[pi][0];
        pi += 1;
      } else if (el.type === "image" && el.kind === "logo" && logos[0]) {
        el.imageId = logos[0][0];
      }
    }
  }
  state = next;
  selectedId = null;
  history = [];
  historyIndex = -1;
  syncAssets().then(requestRender);
  renderPanel();
  requestRender();
  pushHistory();
}

// =================================================================================
// Export PNG & impression
// =================================================================================
function emptySlotCount() {
  return state.elements.filter((el) => el.type === "image" && !el.imageId).length;
}

async function buildExportCanvas() {
  await document.fonts.ready;
  const fmt = getFormat(state.formatId);
  return renderToCanvas(state, assets, fmt.exportW, { placeholders: false });
}

async function exportPNG() {
  if (emptySlotCount() > 0 && !confirm("Certains emplacements photo sont encore vides : ils n'apparaîtront pas sur l'affiche. Continuer ?")) return;
  const canvas = await buildExportCanvas();
  canvas.toBlob((blob) => {
    if (!blob) {
      alert("Export impossible sur ce navigateur.");
      return;
    }
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    link.download = `affiche-${state.templateId}-${date}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 30000);
  }, "image/png");
}

async function printPoster() {
  if (emptySlotCount() > 0 && !confirm("Certains emplacements photo sont encore vides : ils n'apparaîtront pas sur l'affiche. Continuer ?")) return;
  const canvas = await buildExportCanvas();
  const dataURL = canvas.toDataURL("image/png");
  const fmt = getFormat(state.formatId);
  const paper = fmt.print?.paper || "A4";
  const orientation = fmt.print?.orientation || (fmt.ratio >= 1 ? "portrait" : "landscape");

  // Impression via iframe caché : pas de fenêtre pop-up à autoriser.
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  iframe.srcdoc = `<!doctype html><html lang="fr"><head><meta charset="utf-8" /><title>Impression</title>
    <style>@page{size:${paper} ${orientation};margin:0}html,body{margin:0;height:100%}img{display:block;width:100%;height:100%;object-fit:contain}</style>
    </head><body><img src="${dataURL}" alt="Affiche" /></body></html>`;
  document.body.appendChild(iframe);
  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => iframe.remove(), 60000);
    }, 200);
  };
}

// =================================================================================
// Barre latérale « Ajouter » + barre du haut
// =================================================================================
$("addPhotoBtn").addEventListener("click", () => {
  // S'il reste un emplacement produit vide, on le remplit ; sinon on en crée un.
  const slot = state.elements.find((el) => el.type === "image" && el.kind === "product" && !el.imageId);
  if (slot) {
    startImport(slot.id, "product");
  } else {
    startImport(null, "product");
  }
});

$("addLogoBtn").addEventListener("click", () => {
  const slot = state.elements.find((el) => el.type === "image" && el.kind === "logo" && !el.imageId);
  if (slot) startImport(slot.id, "logo");
  else {
    const el = makeImage({ kind: "logo", anchor: "top", x: 740, y: 26, w: 230, h: 110, z: 8 });
    state.elements.push(el);
    startImport(el.id, "logo");
  }
});

$("addTextBtn").addEventListener("click", () => {
  const el = makeText({ anchor: "center", x: 200, y: 0, w: 600, text: "Nouveau texte", align: "center" });
  state.elements.push(el);
  select(el.id);
  requestRender();
  pushHistory();
});

$("addBadgeBtn").addEventListener("click", () => {
  const el = makeBadge({ anchor: "center", x: 380, y: 0, w: 240, h: 240 });
  state.elements.push(el);
  select(el.id);
  requestRender();
  pushHistory();
});

$("addBandBtn").addEventListener("click", () => {
  const el = makeBand({ anchor: "center", x: 0, y: 0, w: 1000, h: 140, z: 2 });
  state.elements.push(el);
  select(el.id);
  requestRender();
  pushHistory();
});

$("newBtn").addEventListener("click", () => openWizard({}));
$("formatBtn").addEventListener("click", openFormatModal);
$("undoBtn").addEventListener("click", undo);
$("redoBtn").addEventListener("click", redo);
$("downloadBtn").addEventListener("click", exportPNG);
$("printBtn").addEventListener("click", printPoster);
$("templateBtn").addEventListener("click", () => openWizard({}));

window.addEventListener("resize", requestRender);

// =================================================================================
// Démarrage
// =================================================================================
async function boot() {
  // Charge les polices avant le premier rendu pour des mesures de texte justes.
  try {
    await Promise.allSettled([
      document.fonts.load('400 40px "Poppins"'),
      document.fonts.load('600 40px "Poppins"'),
      document.fonts.load('700 40px "Poppins"'),
      document.fonts.load('700 40px "Playfair Display"'),
    ]);
  } catch (e) {
    /* les polices de secours feront l'affaire */
  }

  // La sauvegarde locale ne doit JAMAIS bloquer le démarrage : certains
  // navigateurs (navigation privée, IndexedDB verrouillé) ne répondent pas.
  let saved = null;
  try {
    saved = await Promise.race([idbGet("current"), new Promise((resolve) => setTimeout(() => resolve(null), 1500))]);
  } catch (e) {
    /* IndexedDB indisponible : démarrage normal */
  }

  if (saved?.version === 2 && Array.isArray(saved.elements)) {
    state = saved;
    await syncAssets();
    history = [snapshot()];
    historyIndex = 0;
    updateUndoButtons();
    renderPanel();
    requestRender();
    restoreBanner.hidden = false;
    $("restoreDismiss").addEventListener("click", () => {
      restoreBanner.hidden = true;
    });
    $("restoreNew").addEventListener("click", () => {
      restoreBanner.hidden = true;
      openWizard({});
    });
  } else {
    state = buildState("promo-produit", "a4-portrait", THEMES[0].id);
    history = [snapshot()];
    historyIndex = 0;
    updateUndoButtons();
    renderPanel();
    requestRender();
    openWizard({ firstRun: true });
  }

  // Précharge le modèle IA en tâche de fond (sans bloquer l'interface).
  prepareDetour().catch(() => {});
}

boot();
