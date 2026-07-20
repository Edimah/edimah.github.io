---
layout: post
title: "Modelling MNAR data with population data #2 : Where do the blanks cluster?"
date: 2026-07-20 09:00:00
description: The blanks are not spread evenly. Where they concentrate decides which question the data can honestly answer.
tags: mnar censoring screening dataviz
categories: posts
---

<!--
  PLACEHOLDER PROSE, v1. Written to be rewritten.
  MESSAGE (one): where suppression concentrates decides which question is honest.
  Post 2 of 5. Previous: why is this cell blank. Next: how we model one.

  SCOPE, the thing to keep straight:
    all «Autres cancers» cells, every age and both sexes -> 12.1% withheld.
    the worked example, women 40 to 74 only              ->  0.34% withheld,
      65 cells, 61 of them Mayotte, 4 Lozère.

  FIGURES BEHIND THE MAP READING (2022, computed from the data, not recalled):
    Mayotte      128,920 people   8.3% aged 60+   68.3% withheld
    Guyane       206,070         13.2%            35.0%
    Lozère        74,000         34.4%            39.2%
    Creuse       112,010         39.9%            33.3%
    Belfort      138,350         27.7%            30.8%
    Guadeloupe   400,730         29.0%            19.2%
    La Réunion   953,110         18.8%             0.8%
    Nord       2,591,690         24.2%             0.0%
    across all départements: withheld vs log10(population) r = -0.90
                             withheld vs share aged 60+    r = +0.26
-->

The data is the Cnam Cartographie des pathologies, published on data.ameli.fr under an open licence. It gives, for each pathology group, the number of people treated and the resulting prevalence, broken down by département, by sex, by five-year age band, for each year from 2015 to 2023. It is a large and unusually fine-grained table, and it is that fineness which makes the suppression visible at all.

The worked example throughout is the group Cnam calls «Autres cancers», in women aged 40 to 74.

Two words on why. Cervical cancer is not broken out anywhere in this dataset. Cnam folds it into that residual group, so the group is a stand-in and nothing here is a statement about cervical screening. The age band is the one screening actually addresses, which makes it the segment where a bias would matter to a decision rather than only to a table.

<figure>
  <img src="/assets/img/ns-rate-map.png" class="img-fluid rounded z-depth-1" alt="Share of withheld cells by département for Autres cancers" loading="lazy">
  <figcaption><strong>Figure 1.</strong> EDIT. Share of withheld cells by département, across all «Autres cancers» cells, every age band and both sexes. Mayotte 73%, Lozère 38%, Guyane 38%.</figcaption>
</figure>

The first reading of the map is the obvious one, and it holds. Small territories lose more cells. Across the hundred départements the share withheld tracks population closely, and Nord, with two and a half million people, loses none at all.

The second reading is the one worth having. Size does not explain everything. Mayotte has around 129,000 people and loses 68% of its cells. Lozère has 74,000, barely more than half as many, and loses 39%. The smaller territory keeps more of its data.

The difference is age. Eight per cent of Mayotte's population is aged sixty or over. In Lozère it is thirty-four per cent. Cancer prevalence climbs steeply with age, so the same headcount yields far fewer cases in a young population than in an old one. Mayotte has more people and fewer cases, and it is cases the threshold counts.

That is the previous post seen at the scale of a territory. Population and rate both feed the count, and the map shows only the first.

La Réunion is the control. It is young too, but it has 953,000 people, and it loses under one per cent. Enough of the first term compensates for the second.

What the map does not support is a demographic story told on its own. These are two plausible routes to a small count, read off a pattern that is consistent with them. Confirming either would take the age structure into the model, not into the caption.

This post covers one pathology group at département level. It does not cover the full pathology set, individual records, or any clinical reading of the rates themselves.

One number carries into everything that follows. Across all cells, 12.1% are withheld. Narrow to women aged 40 to 74 and that falls to 0.34%, which is 65 cells, 61 of them in Mayotte. The screening age bands are the older ones, and older bands hold more cases. Choosing the segment where a bias would matter is also, here, choosing the segment where suppression is rarest.

Next, what a model should do with a cell that has been withheld.

Données issues de la Cartographie des pathologies et des dépenses de l'Assurance Maladie, Cnam, data.ameli.fr, licence ODbL.
