---
layout: post
title: "Modelling MNAR data with population data #5 : Why does sampling stall at initialisation?"
date: 2026-07-23 09:00:00
description: The censored term underflows on large populations. A small-rate prior is the difference between a four-minute fit and one that never starts.
tags: bayesian mcmc computation censoring
categories: posts
---

<!--
  SKELETON, v1. The prose is yours. The lines below are prompts, not text.
  MESSAGE (one): the corrected fit only runs because it starts somewhere the
  censored term is still finite.
  Post 5 of 5, a craft note, deliberately the shortest of the series.

  NUMBERS, from outputs/blog_figures_report.txt:
    at the starting prevalence p0 = sigma(-4) = 0.018, log P(count <= 10) is
      -16.2    for a 2 080-woman cell (typical withheld cell here)  finite
      -319.0   for a 20 000-woman cell                              finite
      -inf     for an 84 660-woman cell, underflow
    Each fit is four chains, about four minutes, zero divergences.

  THE OTHER THING YOU COULD SAY HERE, and it is genuinely yours: the published
  counts are all rounded to the nearest ten, so every observed cell is itself
  only known to within five. That is a second layer of censoring this model
  does not carry. It is the same problem as the rounded measurements in your
  EDF work. Include it or hold it for a later post, but it is an honest
  limitation and it is unstated in the current draft.
-->

The practical problem, in two lines. Keeping a withheld cell as a range means evaluating the probability that its count fell below the threshold, and for a large population that probability is very small.

<figure>
  <img src="/assets/img/init-cliff.png" class="img-fluid rounded z-depth-1" alt="Log probability of a count below the threshold, against assumed prevalence, for three population sizes" loading="lazy">
  <figcaption><strong>Figure 1.</strong> EDIT. The same quantity for three cell sizes. Below the dotted line the number is too small for the computer to hold, and the sampler has nowhere to start.</figcaption>
</figure>

What the figure shows and what it costs. At the starting point the term is comfortably finite for the small cells that carry every withheld value here, and it underflows only for populations far larger than those.

The fix, and its honesty. The prior that keeps the starting rate small is not a modelling insight, it is what makes the fit possible. Four chains, about four minutes.

Where this gets harder. The blanks are sparse at département level, which is precisely why the correction stayed local in the previous post. Denser suppression, meaning smaller strata or hospital-level data, is where the same correction would start to show up in an aggregate summary. That is the next dataset, not a promise about this one.

Données issues de la Cartographie des pathologies et des dépenses de l'Assurance Maladie, Cnam, data.ameli.fr, licence ODbL.
