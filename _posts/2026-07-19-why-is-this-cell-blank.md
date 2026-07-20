---
layout: post
title: "Why is this cell blank?"
date: 2026-07-19 09:00:00
description: A blank cell in the pathology data is a decision, not an absence — and the decision depends on the number it hides.
tags: mnar censoring screening bayesian
categories: posts
---

<!--
  SKELETON — v1. The prose is yours to write; the lines below are prompts, not text.
  MESSAGE (one, and only one): a blank is a decision that depends on the count,
  which is what makes the missingness not-at-random.
  Figures are final. Captions marked EDIT are placeholders.
  Post 1 of 5. Next: where the blanks cluster.
  Data: Cnam, data.ameli.fr, ODbL — attribution line at the foot.
-->

Opening — how you met this. The screening work at CRCDC 971, reading a prevalence table, and the cell that had no number in it. The world first, the rule second.

What you expected to find in that cell, and what was there instead.

<figure>
  <img src="/assets/img/redacted-table.png" class="img-fluid rounded z-depth-1" alt="An excerpt of the published table, with suppressed counts shown as NS" loading="lazy">
  <figcaption><strong>Figure 1.</strong> EDIT — an excerpt of the table as published. The withheld cells carry no number at all.</figcaption>
</figure>

The rule itself, in one sentence, in your own words.

Why the word "missing" is wrong here. A missing value is an accident; this one is a decision, and the decision was made by looking at the very number we would like to know.

The name for that: not missing at random. Say what it costs — an estimate built as if these cells were absent is not neutral, it is tilted.

<figure>
  <img src="/assets/img/ns-threshold-floor.png" class="img-fluid rounded z-depth-1" alt="Share of cells withheld across deciles of population and of expected case count" loading="lazy">
  <figcaption><strong>Figure 2.</strong> EDIT — share of cells withheld, across tenths of population (left) and tenths of expected case count (right). By expected count the share runs from 93% to 0%; by population it only runs from 13% to 1%, and not even in order.</figcaption>
</figure>

The tempting reading, and the honest one. It is not that small territories disappear — the left panel does not even fall in order, and the very smallest populations are less affected than the next tenth up. What disappears is low counts. A large young population with a rare cancer disappears just as readily as a small old one.

If you want the mechanism in one line: the threshold is applied to the count, and the count is population multiplied by a rate. Only one of those two is visible on a map.

Your verdict, first person, one line.

Next — a rule with a shape. Before deciding how to model it, look at where it falls.

---

Données issues de la Cartographie des pathologies et des dépenses de l'Assurance Maladie, Cnam, data.ameli.fr, licence ODbL.
