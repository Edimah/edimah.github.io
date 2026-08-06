/**
 * Rendu de l'affiche sur <canvas>.
 * Le MÊME moteur dessine : l'aperçu de l'éditeur, les vignettes des modèles
 * et formats, et l'export final haute résolution. Ce que l'on voit est
 * exactement ce que l'on imprime (contrairement à l'ancienne capture DOM
 * via html2canvas, source de rendus incohérents).
 *
 * © 2025-2026 Edimah SYNESIUS SONGO — Licence MIT.
 */

import { UNIT_W, getTheme, posterHeight } from "./templates.js";

// --- Aléatoire déterministe : le fond décoratif est identique entre aperçu,
// vignette et export tant que state.bg.seed ne change pas.
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function resolveColor(spec, theme) {
  switch (spec) {
    case "band":
      return theme.band;
    case "onBand":
      return theme.bandText;
    case "accent":
      return theme.accent;
    case "accentText":
      return theme.accentText;
    case "text":
      return theme.text;
    case "soft":
      return theme.soft;
    case "bg":
      return theme.bg;
    default:
      return spec || "#000000";
  }
}

const FONT_FAMILIES = { sans: '"Poppins", Arial, sans-serif', serif: '"Playfair Display", Georgia, serif' };
export const fontFamily = (key) => FONT_FAMILIES[key] || FONT_FAMILIES.sans;

const hexToRgb = (hex) => {
  let c = (hex || "#000").replace("#", "");
  if (c.length === 3)
    c = c
      .split("")
      .map((x) => x + x)
      .join("");
  const v = parseInt(c, 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
};

export const withAlpha = (hex, alpha) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

// Luminance relative WCAG — sert au contrôle de lisibilité dans l'éditeur.
export function contrastRatio(hexA, hexB) {
  const lum = (hex) => {
    const { r, g, b } = hexToRgb(hex);
    const f = (v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  };
  const [l1, l2] = [lum(hexA), lum(hexB)].sort((a, b) => b - a);
  return (l1 + 0.05) / (l2 + 0.05);
}

/** Position verticale résolue (unités depuis le haut) selon l'ancrage. */
export function resolveTop(el, H, h = el.h) {
  if (el.anchor === "bottom") return H - el.y - h;
  if (el.anchor === "center") return H / 2 + el.y - h / 2;
  return el.y;
}

// --- Texte : césure par mots (les \n explicites sont respectés) -------------
function wrapText(ctx, text, el) {
  let size = el.size;
  const family = fontFamily(el.font);
  const setFont = () => {
    ctx.font = `${el.weight} ${size}px ${family}`;
  };
  setFont();

  // Réduit la taille si un seul mot dépasse la largeur du bloc (nom de
  // produit très long) : évite tout débordement hors de l'affiche.
  const words = text.split(/\s+/).filter(Boolean);
  for (const word of words) {
    while (size > 14 && ctx.measureText(word).width > el.w) {
      size -= 2;
      setFont();
    }
  }

  const lines = [];
  for (const paragraph of String(text).split("\n")) {
    const ws = paragraph.split(/\s+/).filter(Boolean);
    if (!ws.length) {
      lines.push("");
      continue;
    }
    let line = ws[0];
    for (let i = 1; i < ws.length; i += 1) {
      const test = `${line} ${ws[i]}`;
      if (ctx.measureText(test).width > el.w) {
        lines.push(line);
        line = ws[i];
      } else {
        line = test;
      }
    }
    lines.push(line);
  }
  return { lines, size, height: lines.length * size * (el.lineHeight || 1.3) };
}

function drawText(ctx, el, theme, H) {
  const { lines, size, height } = wrapText(ctx, el.text, el);
  const top = resolveTop(el, H, height);
  ctx.fillStyle = resolveColor(el.color, theme);
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = el.align || "left";
  const anchorX = el.align === "center" ? el.x + el.w / 2 : el.align === "right" ? el.x + el.w : el.x;
  const lh = size * (el.lineHeight || 1.3);
  lines.forEach((line, i) => {
    // 0.8 ≈ hauteur d'ascendante : cale la première ligne sous le bord haut.
    ctx.fillText(line, anchorX, top + i * lh + size * 0.8);
  });
  ctx.textAlign = "left";
  return { x: el.x, y: top, w: el.w, h: Math.max(height, size) };
}

// --- Formes ------------------------------------------------------------------
function roundRectPath(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function drawBand(ctx, el, theme, H) {
  const top = resolveTop(el, H);
  const fill = resolveColor(el.fill, theme);
  ctx.save();
  ctx.globalAlpha = el.alpha ?? 1;
  ctx.fillStyle = fill;
  if (el.shape === "slant") {
    ctx.beginPath();
    if (el.anchor === "bottom") {
      // Bandeau bas : bord supérieur incliné.
      ctx.moveTo(el.x, top + el.h * 0.32);
      ctx.lineTo(el.x + el.w, top);
      ctx.lineTo(el.x + el.w, top + el.h);
      ctx.lineTo(el.x, top + el.h);
    } else {
      // Bandeau haut : bord inférieur incliné.
      ctx.moveTo(el.x, top);
      ctx.lineTo(el.x + el.w, top);
      ctx.lineTo(el.x + el.w, top + el.h * 0.62);
      ctx.lineTo(el.x, top + el.h);
    }
    ctx.closePath();
    ctx.fill();
  } else if (el.shape === "pill") {
    roundRectPath(ctx, el.x, top, el.w, el.h, el.h / 2);
    ctx.fill();
  } else {
    const fullBleed = el.x <= 0 && el.x + el.w >= UNIT_W;
    roundRectPath(ctx, el.x, top, el.w, el.h, fullBleed ? 0 : 24);
    ctx.fill();
  }
  // Léger reflet pour donner du relief : second remplissage du même tracé
  // avec un dégradé blanc très discret.
  const grad = ctx.createLinearGradient(el.x, top, el.x + el.w, top + el.h);
  grad.addColorStop(0, "rgba(255,255,255,0.16)");
  grad.addColorStop(0.6, "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();
  return { x: el.x, y: top, w: el.w, h: el.h };
}

function starPath(ctx, cx, cy, rOuter, rInner, spikes) {
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i += 1) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i * Math.PI) / spikes - Math.PI / 2;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawBadge(ctx, el, theme, H) {
  const top = resolveTop(el, H);
  const cx = el.x + el.w / 2;
  const cy = top + el.h / 2;
  const fill = resolveColor(el.fill, theme);
  ctx.save();
  ctx.shadowColor = withAlpha(fill, 0.45);
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = fill;
  if (el.shape === "star") {
    starPath(ctx, cx, cy, el.w / 2, el.w / 2 - Math.max(12, el.w * 0.09), 16);
    ctx.fill();
  } else if (el.shape === "pill") {
    roundRectPath(ctx, el.x, top, el.w, el.h, el.h / 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.arc(cx, cy, Math.min(el.w, el.h) / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Texte centré, réduit automatiquement pour tenir dans la forme.
  const maxW = el.shape === "pill" ? el.w * 0.86 : el.w * 0.72;
  let size = el.shape === "pill" ? el.h * 0.42 : el.w * 0.24;
  const family = fontFamily("sans");
  const linesSrc = String(el.text).split("\n");
  const fits = () => {
    ctx.font = `700 ${size}px ${family}`;
    return linesSrc.every((l) => ctx.measureText(l).width <= maxW) && size * linesSrc.length * 1.1 <= el.h * 0.8;
  };
  while (size > 10 && !fits()) size -= 2;
  ctx.fillStyle = resolveColor(el.textColor, theme);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  const lh = size * 1.1;
  const startY = cy - ((linesSrc.length - 1) * lh) / 2;
  linesSrc.forEach((l, i) => ctx.fillText(l, cx, startY + i * lh));
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  return { x: el.x, y: top, w: el.w, h: el.h };
}

function drawImage(ctx, el, theme, H, assets, opts) {
  const top = resolveTop(el, H);
  const asset = el.imageId ? assets.get(el.imageId) : null;
  if (asset) {
    const scale = Math.min(el.w / asset.width, el.h / asset.height);
    const dw = asset.width * scale;
    const dh = asset.height * scale;
    const dx = el.x + (el.w - dw) / 2;
    const dy = top + (el.h - dh) / 2;
    ctx.save();
    if (el.kind === "product") {
      // Ombre portée douce sous le produit détouré.
      ctx.shadowColor = "rgba(20, 45, 35, 0.28)";
      ctx.shadowBlur = 26;
      ctx.shadowOffsetY = 14;
    }
    ctx.drawImage(asset, dx, dy, dw, dh);
    ctx.restore();
  } else if (opts.placeholders) {
    // Emplacement vide : visible uniquement dans l'éditeur, jamais à l'export.
    ctx.save();
    ctx.strokeStyle = withAlpha(theme.band, 0.55);
    ctx.setLineDash([14, 12]);
    ctx.lineWidth = 3;
    roundRectPath(ctx, el.x, top, el.w, el.h, 20);
    ctx.stroke();
    ctx.fillStyle = withAlpha(theme.band, 0.07);
    ctx.fill();
    ctx.setLineDash([]);
    ctx.fillStyle = withAlpha(theme.text, 0.75);
    ctx.textAlign = "center";
    const label = el.kind === "logo" ? "Votre logo" : "Photo du produit";
    const iconSize = Math.min(el.w, el.h) * 0.3;
    ctx.font = `${iconSize}px ${fontFamily("sans")}`;
    ctx.fillText("📷", el.x + el.w / 2, top + el.h / 2 + iconSize * 0.1);
    ctx.font = `600 ${Math.min(30, el.w * 0.09)}px ${fontFamily("sans")}`;
    ctx.fillText(label, el.x + el.w / 2, top + el.h / 2 + iconSize * 0.85);
    ctx.textAlign = "left";
    ctx.restore();
  }
  return { x: el.x, y: top, w: el.w, h: el.h };
}

// --- Fonds décoratifs ---------------------------------------------------------
function drawPattern(ctx, state, theme, H) {
  const rnd = mulberry32(state.bg.seed || 1);
  const type = state.bg.pattern;
  if (type === "bubbles") {
    const count = 7 + Math.floor(rnd() * 4);
    for (let i = 0; i < count; i += 1) {
      const r = 35 + rnd() * 75;
      const x = rnd() * UNIT_W;
      const y = rnd() * H;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${0.16 + rnd() * 0.14})`;
      ctx.fill();
      ctx.strokeStyle = withAlpha(theme.soft, 0.5);
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  } else if (type === "waves") {
    for (let i = 0; i < 3; i += 1) {
      const baseY = H * (0.55 + i * 0.14) + (rnd() - 0.5) * 30;
      const amp = 26 + i * 14;
      const phase = rnd() * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= UNIT_W; x += 25) {
        ctx.lineTo(x, baseY + Math.sin(x / 130 + phase) * amp);
      }
      ctx.lineTo(UNIT_W, H);
      ctx.lineTo(0, H);
      ctx.closePath();
      ctx.fillStyle = withAlpha(theme.soft, 0.28 - i * 0.06);
      ctx.fill();
    }
  } else if (type === "dots") {
    const gap = 46;
    ctx.fillStyle = withAlpha(theme.band, 0.1);
    for (let y = gap / 2; y < H; y += gap) {
      for (let x = gap / 2; x < UNIT_W; x += gap) {
        const offset = Math.floor(y / gap) % 2 === 0 ? 0 : gap / 2;
        ctx.beginPath();
        ctx.arc(x + offset, y, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawBackground(ctx, state, theme, H, assets) {
  if (state.bg.mode === "image" && state.bg.imageId && assets.get(state.bg.imageId)) {
    const img = assets.get(state.bg.imageId);
    const scale = Math.max(UNIT_W / img.width, H / img.height); // cover
    const dw = img.width * scale;
    const dh = img.height * scale;
    ctx.drawImage(img, (UNIT_W - dw) / 2, (H - dh) / 2, dw, dh);
    return;
  }
  if (state.bg.mode === "solid" && state.bg.color) {
    ctx.fillStyle = state.bg.color;
    ctx.fillRect(0, 0, UNIT_W, H);
    return;
  }
  // Mode thème : léger dégradé radial du blanc vers la teinte du thème.
  const grad = ctx.createRadialGradient(UNIT_W / 2, H * 0.1, 60, UNIT_W / 2, H * 0.55, H * 0.85);
  grad.addColorStop(0, "#ffffff");
  grad.addColorStop(0.45, theme.bg);
  grad.addColorStop(1, withAlpha(theme.soft, 0.9));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, UNIT_W, H);
  drawPattern(ctx, state, theme, H);
}

/**
 * Rend l'affiche complète dans `canvas` à la largeur pixel demandée.
 * Retourne la géométrie résolue de chaque élément (en unités) pour la
 * sélection à la souris dans l'éditeur.
 */
export function renderPoster(canvas, state, pxWidth, assets, opts = {}) {
  const H = posterHeight(state.formatId);
  const theme = getTheme(state.themeId);
  const pxHeight = Math.round((pxWidth * H) / UNIT_W);
  if (canvas.width !== pxWidth || canvas.height !== pxHeight) {
    canvas.width = pxWidth;
    canvas.height = pxHeight;
  }
  const ctx = canvas.getContext("2d");
  ctx.save();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.scale(pxWidth / UNIT_W, pxWidth / UNIT_W);

  drawBackground(ctx, state, theme, H, assets);

  const layout = new Map();
  const sorted = [...state.elements].sort((a, b) => (a.z || 0) - (b.z || 0));
  for (const el of sorted) {
    let box;
    if (el.type === "band") box = drawBand(ctx, el, theme, H);
    else if (el.type === "text") box = drawText(ctx, el, theme, H);
    else if (el.type === "badge") box = drawBadge(ctx, el, theme, H);
    else if (el.type === "image") box = drawImage(ctx, el, theme, H, assets, opts);
    if (box) layout.set(el.id, box);
  }
  ctx.restore();
  return layout;
}

/** Rend dans un canvas hors écran (vignettes, export) et le retourne. */
export function renderToCanvas(state, assets, pxWidth, opts = {}) {
  const canvas = document.createElement("canvas");
  renderPoster(canvas, state, pxWidth, assets, opts);
  return canvas;
}
