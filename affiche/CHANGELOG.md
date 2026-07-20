# Changelog — Créateur d'affiches pour officine

## v2.0 — 2026-07-13 · Refonte complète (rebuild)

Décision issue de l'audit : l'architecture v1 (scène DOM figée à 6 éléments,
export html2canvas) bloquait les cas d'usage réels (plusieurs produits, promo
générale, affiche conseil). Refonte autour d'une **liste d'éléments** rendue
sur **canvas**.

### Architecture

- `templates.js` — formats, thèmes, modèles. Coordonnées en unités (largeur
  d'affiche = 1000) avec ancrage haut/centre/bas : un même contenu s'adapte à
  tous les formats.
- `render.js` — moteur de rendu canvas unique pour l'aperçu, les vignettes
  des modales et l'export final. **Ce qu'on voit = ce qu'on exporte** ;
  html2canvas (non maintenu, clip-path/filtres non supportés) est supprimé.
- `app.js` — éditeur : sélection, déplacement, redimensionnement, clavier,
  annuler/rétablir, sauvegarde auto, modales, export/impression.
- `detour.js` + `detour-worker.js` — détourage. L'inférence U²-Net tourne
  dans un **Web Worker** (plus de gel de l'interface), le modèle est mis en
  cache **persistant** (Cache API : plus de re-téléchargement à chaque visite).
  Routage auto conservé de la v1 (packshot fond uni → flood-fill couleur,
  photo encombrée → IA). Repli : ancien module main-thread
  `../assets/js/bgremoval.mjs` (inchangé).
- `fonts/` — Poppins + Playfair Display **auto-hébergées** (plus d'appel à
  Google Fonts : conformité CNIL/RGPD, et l'export canvas a toujours les
  bonnes polices).

### Nouveautés utilisateur

- **Modèles avec aperçus** : Promo produit, Lot/plusieurs produits, Promo
  générale, Info & conseil, Vierge — assistant en 2 étapes (modèle → format).
- **Formats avec aperçus** : A4/A5 portrait & paysage, carré, story 9:16,
  écran TV 16:9. Changement de format sans refaire l'affiche.
- **Multi-produits** : ajout/suppression libre de photos, textes, pastilles,
  bandeaux. Dupliquer, avant/arrière, Suppr au clavier, flèches pour ajuster.
- **Annuler/Rétablir** (Ctrl+Z / Ctrl+Y) et **sauvegarde automatique**
  (IndexedDB) : l'affiche en cours survit à une fermeture d'onglet.
- **Retouche manuelle du détourage** : gomme / restauration au pinceau.
- **Contrôle de lisibilité** : alerte + correction en un clic si le texte
  manque de contraste sur son fond.
- Les emplacements photo vides n'apparaissent plus sur l'export (bug v1 :
  « Photo du produit ici » imprimé sur l'affiche).
- Impression via iframe caché (plus de pop-up à autoriser), papier A4/A5,
  export PNG ~300 dpi.
- 6 thèmes de couleurs cohérents (bandeaux, pastille, fond assortis).

### Supprimé (poids mort identifié à l'audit)

- html2canvas, Google Fonts CDN, colorthief (palette du thème remplace
  l'extraction depuis le logo), modèle U²-Net complet 168 Mo (miroir tiers),
  choix technique du modèle IA exposé à l'utilisateur, modes de détourage
  manuels (Auto/Forcer IA/Forcer couleur) remplacés par « Réessayer » simple,
  morphing des bandeaux par zones invisibles, bouton « Mettre à jour
  l'affiche », générateur de slogans.

### À faire (prochaines itérations)

- Évaluer un modèle de détourage moderne sous licence permissive
  (BiRefNet-lite MIT quantisé, WebGPU) — vérifier tailles/licences réelles
  avant intégration ; U²-Net-p reste le modèle par défaut en attendant.
- Bibliothèque de pictogrammes santé.
- Multi-sélection, guides d'alignement magnétiques.
