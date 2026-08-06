/**
 * Formats, thèmes et modèles d'affiche.
 * Système d'unités : la largeur de l'affiche vaut toujours 1000 unités,
 * la hauteur vaut 1000 × ratio. Toutes les positions/tailles des éléments
 * sont exprimées dans ces unités, ce qui rend les modèles indépendants du
 * format et de la résolution d'export.
 *
 * Ancrages verticaux (el.anchor) :
 *  - "top"    : el.y = distance entre le haut de l'affiche et le haut de l'élément
 *  - "center" : el.y = décalage du centre de l'élément par rapport au centre de l'affiche
 *  - "bottom" : el.y = distance entre le bas de l'affiche et le bas de l'élément
 * Un même modèle reste ainsi cohérent quand on change de format.
 *
 * © 2025-2026 Edimah SYNESIUS SONGO — Licence MIT.
 */

export const UNIT_W = 1000;

export const FORMATS = [
  {
    id: "a4-portrait",
    label: "Affiche portrait",
    sub: "A4 / A5 — vitrine, rayon",
    ratio: 297 / 210,
    print: { paper: "A4", orientation: "portrait" },
    exportW: 2480, // ≈ 300 dpi sur A4
  },
  {
    id: "a4-paysage",
    label: "Affiche paysage",
    sub: "A4 / A5 — comptoir",
    ratio: 210 / 297,
    print: { paper: "A4", orientation: "landscape" },
    exportW: 3508,
  },
  {
    id: "carre",
    label: "Carré",
    sub: "Réseaux sociaux",
    ratio: 1,
    exportW: 2000,
  },
  {
    id: "story",
    label: "Story 9:16",
    sub: "Instagram, WhatsApp",
    ratio: 16 / 9,
    exportW: 1620,
  },
  {
    id: "ecran",
    label: "Écran 16:9",
    sub: "TV du comptoir",
    ratio: 9 / 16,
    exportW: 2560,
  },
];

export const THEMES = [
  {
    id: "officine",
    label: "Vert officine",
    band: "#0a7f5a",
    bandText: "#ffffff",
    bg: "#eef7f2",
    accent: "#f4562a",
    accentText: "#ffffff",
    text: "#17352b",
    soft: "#bfe3d2",
  },
  {
    id: "ocean",
    label: "Bleu océan",
    band: "#1170a8",
    bandText: "#ffffff",
    bg: "#eef5fa",
    accent: "#ff7043",
    accentText: "#ffffff",
    text: "#123243",
    soft: "#bcd9ea",
  },
  {
    id: "soleil",
    label: "Soleil",
    band: "#d97706",
    bandText: "#ffffff",
    bg: "#fff7ea",
    accent: "#c2410c",
    accentText: "#ffffff",
    text: "#4a2c10",
    soft: "#f3d9a8",
  },
  {
    id: "baies",
    label: "Baies",
    band: "#8e3b6e",
    bandText: "#ffffff",
    bg: "#faf0f6",
    accent: "#d63384",
    accentText: "#ffffff",
    text: "#43172f",
    soft: "#e6c3d8",
  },
  {
    id: "ardoise",
    label: "Ardoise",
    band: "#37474f",
    bandText: "#ffffff",
    bg: "#f4f6f7",
    accent: "#c62828",
    accentText: "#ffffff",
    text: "#263238",
    soft: "#cfd8dc",
  },
  {
    id: "nuit",
    label: "Bleu nuit",
    band: "#1e3a5f",
    bandText: "#ffffff",
    bg: "#eef1f7",
    accent: "#ffb300",
    accentText: "#1e2a3a",
    text: "#1c2b40",
    soft: "#c5d1e4",
  },
];

export const getFormat = (id) => FORMATS.find((f) => f.id === id) || FORMATS[0];
export const getTheme = (id) => THEMES.find((t) => t.id === id) || THEMES[0];
export const posterHeight = (formatId) => Math.round(UNIT_W * getFormat(formatId).ratio);

let uidCounter = 0;
export const uid = () => `el${Date.now().toString(36)}${(uidCounter += 1)}`;

// Fabriques d'éléments — valeurs par défaut regroupées ici pour que tous les
// modèles (et l'ajout manuel depuis l'éditeur) produisent les mêmes objets.
export const makeBand = (over = {}) => ({
  id: uid(),
  type: "band",
  anchor: "top",
  x: 0,
  y: 0,
  w: 1000,
  h: 160,
  z: 1,
  shape: "rect", // rect | slant (bord inférieur incliné) | pill
  fill: "band", // "band" | "#hex"
  alpha: 1,
  ...over,
});

export const makeText = (over = {}) => ({
  id: uid(),
  type: "text",
  anchor: "top",
  x: 60,
  y: 60,
  w: 620,
  h: 60, // recalculé au rendu (retour à la ligne automatique)
  z: 5,
  text: "Votre texte",
  font: "sans", // sans | serif
  weight: 600,
  size: 44,
  lineHeight: 1.3,
  align: "left",
  color: "text", // "text" | "onBand" | "accent" | "#hex"
  ...over,
});

export const makeImage = (over = {}) => ({
  id: uid(),
  type: "image",
  anchor: "center",
  x: 190,
  y: 0,
  w: 620,
  h: 560,
  z: 3,
  imageId: null,
  kind: "product", // product | logo
  ...over,
});

export const makeBadge = (over = {}) => ({
  id: uid(),
  type: "badge",
  anchor: "top",
  x: 700,
  y: 200,
  w: 230,
  h: 230,
  z: 6,
  shape: "star", // star | circle | pill
  text: "-20 %",
  fill: "accent",
  textColor: "accentText",
  ...over,
});

// --- Modèles ---------------------------------------------------------------
// build(H) reçoit la hauteur en unités pour adapter les proportions aux
// formats très courts (écran 16:9) sans dupliquer chaque modèle.

const short = (H) => H < 800;

const logoSlot = (over = {}) => makeImage({ kind: "logo", anchor: "top", x: 740, y: 26, w: 230, h: 110, z: 8, ...over });

export const TEMPLATES = [
  {
    id: "promo-produit",
    label: "Promo produit",
    desc: "Un produit mis en avant, avec pastille de réduction",
    build(H) {
      const s = short(H);
      const headH = s ? 120 : 170;
      const footH = s ? 130 : 210;
      return {
        bg: { mode: "theme", pattern: "bubbles", seed: 42 },
        elements: [
          makeBand({ shape: "slant", h: headH, z: 1 }),
          makeText({ text: "Promo d'automne", color: "onBand", weight: 700, size: s ? 42 : 54, x: 40, y: s ? 20 : 34, w: 660, z: 5 }),
          makeText({ text: "Du 1ᵉʳ au 15 novembre", color: "onBand", weight: 400, size: s ? 24 : 30, x: 40, y: s ? 74 : 108, w: 600, z: 5 }),
          logoSlot(),
          makeImage({ anchor: "center", x: 190, y: s ? 10 : 0, w: 620, h: s ? 290 : 600 }),
          makeBadge({ x: 690, y: s ? 130 : 220, w: s ? 180 : 240, h: s ? 180 : 240 }),
          makeBand({ anchor: "bottom", h: footH, z: 2, shape: "rect" }),
          makeText({
            anchor: "bottom",
            text: "Vitamine D3 1000 UI",
            color: "onBand",
            weight: 700,
            size: s ? 36 : 46,
            x: 50,
            y: s ? 62 : 104,
            w: 760,
            z: 5,
          }),
          makeText({
            anchor: "bottom",
            text: "Demandez conseil à votre pharmacien",
            color: "onBand",
            weight: 400,
            size: s ? 22 : 28,
            x: 50,
            y: s ? 20 : 44,
            w: 820,
            z: 5,
          }),
        ],
      };
    },
  },
  {
    id: "lot-produits",
    label: "Lot / plusieurs produits",
    desc: "Deux produits côte à côte, offre groupée",
    build(H) {
      const s = short(H);
      const headH = s ? 110 : 150;
      const footH = s ? 120 : 190;
      return {
        bg: { mode: "theme", pattern: "dots", seed: 7 },
        elements: [
          makeBand({ shape: "rect", h: headH, z: 1 }),
          makeText({ text: "Offre duo", color: "onBand", weight: 700, size: s ? 40 : 52, x: 40, y: s ? 24 : 40, w: 640, z: 5 }),
          logoSlot(),
          makeBadge({ shape: "pill", text: "2 + 1 OFFERT", x: 280, y: headH + 30, w: 440, h: s ? 80 : 100, z: 6 }),
          makeImage({ anchor: "center", x: 30, y: s ? 30 : 40, w: 455, h: s ? 250 : 520 }),
          makeImage({ anchor: "center", x: 515, y: s ? 30 : 40, w: 455, h: s ? 250 : 520 }),
          makeBand({ anchor: "bottom", h: footH, z: 2 }),
          makeText({
            anchor: "bottom",
            text: "Sur la gamme solaire",
            color: "onBand",
            weight: 700,
            size: s ? 34 : 44,
            x: 50,
            y: s ? 56 : 96,
            w: 780,
            z: 5,
          }),
          makeText({
            anchor: "bottom",
            text: "Offre valable jusqu'à épuisement du stock",
            color: "onBand",
            weight: 400,
            size: s ? 20 : 26,
            x: 50,
            y: s ? 18 : 40,
            w: 860,
            z: 5,
          }),
        ],
      };
    },
  },
  {
    id: "promo-generale",
    label: "Promo générale",
    desc: "Grande remise sur un rayon, sans photo produit",
    build(H) {
      const s = short(H);
      return {
        bg: { mode: "theme", pattern: "waves", seed: 11 },
        elements: [
          logoSlot({ x: 385, y: 30, w: 230, h: 100 }),
          makeText({
            anchor: "center",
            text: "Sur tout le rayon solaire",
            weight: 700,
            size: s ? 44 : 64,
            align: "center",
            x: 80,
            y: s ? -170 : -270,
            w: 840,
            z: 5,
          }),
          makeText({
            anchor: "center",
            text: "-20 %",
            color: "accent",
            weight: 700,
            size: s ? 170 : 260,
            align: "center",
            x: 100,
            y: s ? -10 : -30,
            w: 800,
            z: 5,
            font: "sans",
          }),
          makeText({
            anchor: "center",
            text: "Du 1ᵉʳ au 15 novembre",
            weight: 600,
            size: s ? 28 : 40,
            align: "center",
            x: 150,
            y: s ? 130 : 190,
            w: 700,
            z: 5,
          }),
          makeBand({ anchor: "bottom", h: s ? 100 : 140, z: 2 }),
          makeText({
            anchor: "bottom",
            text: "Demandez conseil à votre pharmacien",
            color: "onBand",
            weight: 600,
            size: s ? 24 : 30,
            align: "center",
            x: 100,
            y: s ? 34 : 52,
            w: 800,
            z: 5,
          }),
        ],
      };
    },
  },
  {
    id: "conseil",
    label: "Info & conseil",
    desc: "Message de santé ou information de l'officine",
    build(H) {
      const s = short(H);
      return {
        bg: { mode: "theme", pattern: "none", seed: 3 },
        elements: [
          makeBand({ shape: "rect", h: s ? 100 : 130, z: 1 }),
          makeText({ text: "Conseil de votre pharmacien", color: "onBand", weight: 600, size: s ? 30 : 38, x: 40, y: s ? 30 : 42, w: 660, z: 5 }),
          logoSlot({ h: s ? 70 : 90, y: 20 }),
          makeText({
            text: "Vaccination grippe : c'est le moment",
            font: "serif",
            weight: 700,
            size: s ? 48 : 66,
            x: 60,
            y: s ? 130 : 190,
            w: 880,
            z: 5,
          }),
          makeText({
            text: "Sans rendez-vous, directement à l'officine.\nPensez à apporter votre carte Vitale.\nVaccination possible dès 18 ans.",
            weight: 400,
            size: s ? 26 : 38,
            lineHeight: 1.55,
            x: 60,
            y: s ? 250 : 420,
            w: 840,
            z: 5,
          }),
          makeBand({ anchor: "bottom", h: s ? 90 : 120, z: 2 }),
          makeText({
            anchor: "bottom",
            text: "Toute l'équipe est là pour vous accompagner",
            color: "onBand",
            weight: 600,
            size: s ? 22 : 28,
            align: "center",
            x: 100,
            y: s ? 30 : 44,
            w: 800,
            z: 5,
          }),
        ],
      };
    },
  },
  {
    id: "vierge",
    label: "Vierge",
    desc: "Partir d'une page blanche",
    build() {
      return {
        bg: { mode: "theme", pattern: "none", seed: 1 },
        elements: [makeText({ text: "Votre titre", weight: 700, size: 60, x: 60, y: 80, w: 880 })],
      };
    },
  },
];

export const getTemplate = (id) => TEMPLATES.find((t) => t.id === id) || TEMPLATES[0];

/** Construit un état complet d'affiche à partir d'un modèle. */
export function buildState(templateId, formatId, themeId) {
  const H = posterHeight(formatId);
  const { bg, elements } = getTemplate(templateId).build(H);
  return {
    version: 2,
    templateId,
    formatId,
    themeId,
    bg: { color: null, imageId: null, ...bg },
    elements,
    images: {}, // imageId -> { src, w, h, orig }  (dataURLs, tout reste local)
  };
}
