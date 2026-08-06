# Fonts

Two typefaces, latin subset only, served from this repository. No external font host.

- `inter-latin.woff2`, `inter-latin-italic.woff2` — Inter, variable weight axis. One file covers 100 to 900.
- `source-serif-4-latin.woff2` — Source Serif 4, used for headings.

Both are licensed under the SIL Open Font License 1.1. Inter is by Rasmus Andersson; Source Serif 4 is by Adobe.

The latin subset covers French: accented vowels sit in U+00C0–U+00FF and the OE ligature at U+0152–U+0153, both inside the subset range.

Total: 95 KB. To replace a face, download the woff2 for the same subset, drop it here, and change the `@font-face` src in `assets/css/main.scss`.
