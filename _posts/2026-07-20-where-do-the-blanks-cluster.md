---
layout: post
title: "Where do the blanks cluster?"
date: 2026-07-20 09:00:00
description: The blanks are not spread evenly. Where they concentrate decides which question the data can honestly answer.
tags: mnar censoring screening dataviz
categories: posts
---

<!--
  SKELETON — v1. The prose is yours; the lines below are prompts.
  MESSAGE (one): where suppression concentrates decides which question is honest.
  Post 2 of 5. Previous: why is this cell blank. Next: how we model one.

  SCOPE — the one thing to keep straight in this post, and the reason it exists:
    all «Autres cancers» granular cells (every age, both sexes) → 12.1% withheld,
      Mayotte 72.9%, Lozère 37.9%, Guyane 37.6%.
    the worked example (women 40-74 only)                       →  0.34% withheld,
      65 cells, 61 of them Mayotte, 4 Lozère.
  Narrowing to the screening-age band removes almost all the suppression, because
  those bands are older and the counts are larger. That is the honest reason the
  correction in post 4 turns out small — say it here, not there.
  Data: Cnam, data.ameli.fr, ODbL.
-->

What the dataset is, in three lines. Who publishes it, at what grain — département, sex, five-year age band, year, 2015 to 2023 — and that it is open under ODbL.

<figure>
  <img src="/assets/img/ns-rate-map.png" class="img-fluid rounded z-depth-1" alt="Share of withheld cells by département for Autres cancers" loading="lazy">
  <figcaption><strong>Figure 1.</strong> EDIT — share of withheld cells by département, across all «Autres cancers» cells (every age band, both sexes). Mayotte 73%, Lozère 38%, Guyane 38%.</figcaption>
</figure>

What the map shows and what it does not let you conclude. The territories at the top of this list are small or young or both — but read Figure 2 of the previous post again before saying "small territories".

The worked example, and why you chose it. Women, 40 to 74, "Autres cancers".

Say plainly that cervical cancer is not broken out in this dataset — Cnam folds it into "Autres cancers" — so this is a stand-in, and the post is not about cervical screening.

The scope of the series, positive and negative. It covers one pathology group at département level. It does not cover the full pathology set, individual records, or any clinical reading of the rates.

The number that matters for everything after this: narrowing to the screening-age band drops suppression from 12.1% of cells to 0.34% — 65 cells, and 61 of them in one département. Your own reading of why.

Next — suppression sits in a handful of thin territories. That is exactly where a model has to decide what a blank means.

---

Données issues de la Cartographie des pathologies et des dépenses de l'Assurance Maladie, Cnam, data.ameli.fr, licence ODbL.
