---
layout: post
title: "Why does a local bias vanish in a global average?"
date: 2026-07-22 09:00:00
description: Handling the blanks correctly moves one département's estimate by a fifth — and the calibration metric records nothing.
tags: bayesian calibration mnar evaluation
categories: posts
---

<!--
  SKELETON — v1. The prose is yours; the lines below are prompts.
  MESSAGE (one): the correction is real and local, and a global metric has no
  term for it. This is the post the series has been walking towards.
  Post 4 of 5. Previous: how we model a blank. Next: the sampler.

  NUMBERS — all reproduced from outputs/blog_figures_report.txt, and they match
  outputs/rung1_report.txt exactly:
    Mayotte  filled-in 1.252%   kept-as-range 1.042%
    Nord     filled-in 2.236%   kept-as-range 2.237%   (0 withheld cells)
    ECE   all cells   0.0440 / 0.0441      AUC 0.8832 / 0.8837
    ECE   thin cells  0.0417 / 0.0422
    94% band width, Mayotte: 0.217pp both — the correction moves the estimate,
    it does not widen it.

  PICK YOUR FRAMING OF THE HEADLINE NUMBER — they are both true and they differ:
    16.8%  the filled-in estimate falls by this much when corrected  (Δ / 1.252)
    20.2%  the filled-in estimate sits this much above the corrected (Δ / 1.042)
  The old draft said "20%". Say which denominator you mean, or write "about a fifth".

  DO NOT WRITE, in any form: the metric "cannot see", "is blind to", "misses".
  The mechanism, stated mechanically: a mean taken over roughly a hundred
  départements that carry no withheld cells has no term for a fault in one.
  Data: Cnam, data.ameli.fr, ODbL.
-->

State the finding flat, in the first two lines. No build-up, no reveal — the previous three posts were the build-up.

<figure>
  <img src="/assets/img/mayotte-bars.png" class="img-fluid rounded z-depth-1" alt="Estimated prevalence for Mayotte and Nord under both treatments of the blanks" loading="lazy">
  <figcaption><strong>Figure 1.</strong> EDIT — Mayotte, where a third of cells are withheld, moves from 1.25% to 1.04%. Nord, where none are, does not move.</figcaption>
</figure>

Why the correction can only go one way. The cap is the largest count consistent with the rule, so filling it in can only push the rate up; keeping the range removes exactly that pressure.

<figure>
  <img src="/assets/img/posterior-intervals.png" class="img-fluid rounded z-depth-1" alt="Posterior prevalence over time for Mayotte and Nord under both treatments" loading="lazy">
  <figcaption><strong>Figure 2.</strong> EDIT — the same two départements across the years. The bands are the same width; what changes is where they sit.</figcaption>
</figure>

One thing to answer before a reader asks it: in the Mayotte panel both fitted bands sit well above the grey points. The grey points are the average of the published cells alone, and the published cells are the ones that survived a threshold — they are the visible part of a truncated distribution, not a fair summary of the département. The gap between them and the fitted rate is the partial pooling from the previous post doing its work, not a misfit.

Note what this figure does not let you conclude: the correction is confined to the place where suppression is frequent. Every département without withheld cells is untouched.

Now the test. What a calibration check is, in one sentence, and what a well-calibrated score would mean.

<figure>
  <img src="/assets/img/reliability-diagram.png" class="img-fluid rounded z-depth-1" alt="Reliability diagram and calibration error for both treatments; the curves coincide" loading="lazy">
  <figcaption><strong>Figure 3.</strong> EDIT — synthetic labels. The two curves lie on top of each other: calibration error 0.044 for both, and the same detection performance.</figcaption>
</figure>

The result, plainly. The correction from Figure 1 is real; the summary in Figure 3 records nothing. Give the mechanism, not an intention — the average is taken over a hundred départements that carry no withheld cells.

Your honesty line: you did not tune the filled-in twin until it lost. At this resolution it does not lose.

Then the sentence the whole series exists for — the one about outliers, national averages, prior information, partial pooling, and why the blanks need their own treatment. Yours to write, and it belongs here.

If you want the symmetry: the average fails the outlying territory twice. Once in the estimate, where filled-in blanks tilt it. Once in the evaluation, where a mean over clean territories has no term for the tilt.

Next — a note on making the corrected fit run at all.

---

Données issues de la Cartographie des pathologies et des dépenses de l'Assurance Maladie, Cnam, data.ameli.fr, licence ODbL.
