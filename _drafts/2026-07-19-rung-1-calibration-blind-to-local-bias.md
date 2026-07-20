---
layout: post
title: "Rung 1: can a calibration test miss a bias you can see?"
date: 2026-07-19 22:00:00
description: A censored model corrects one département's cancer-prevalence estimate by 20%, yet the reliability test cannot tell it apart from the naive model.
tags: evaluators bayesian calibration mnar
categories: posts
---

<!--
  DATA / LICENCE: Données issues de la Cartographie des pathologies et des
  dépenses de l'Assurance Maladie, Cnam, disponibles sur data.ameli.fr,
  licence ODbL. Derived analysis is republishable with attribution + share-alike.

  REMINDER — "Autres cancers", NOT cervical. Cervical cancer is ABSENT from the
  usable data; the worked example throughout is women 40–74, group "Autres
  cancers". Do NOT reintroduce any cervical-cancer framing.

  STATUS: short v1 — all six figures embedded, DAGs rendered from TikZ
  (source in assets/img/dag-src/).
-->

French public health data will not show you a count below 11. The Cnam _cartographie des pathologies_ replaces any such cell with "NS" — _non significatif_ — under a confidentiality rule that protects the individuals a small count would expose. This is not noise to clean away, and it is not a rule to work around. It is missing-not-at-random data, and the way a model treats it decides what the model is allowed to conclude.

The finding of this first post is smaller than I expected, and more useful for it: **a global calibration metric can be blind to a real, local bias.** The claim is not about cancer data — any detector scored on an average can stay silent on a fault confined to one corner of it. We reach it by handling the censoring two ways and asking a detector to tell them apart.

This is the first rung of a series I call the ladder: one question — would I trust this detector? — asked of harder data each time. Here it is département aggregates; next, hospital establishments; last, individual records.

This post covers one worked example — "Autres cancers" in women aged 40–74, at the département level. It does not cover the full pathology set, individual-level SNDS data, or any clinical reading of the rates themselves. The anomalies used to test calibration are synthetic, and that is the only synthetic part.

### 1. Where the data goes missing

A cell is suppressed when its count is small, and a count is small when the _expected_ count — population times prevalence — is small. Suppression therefore concentrates on rare pathologies in thin strata, not on small populations as such.

<figure>
  <img src="/assets/img/fig3c.png" class="img-fluid rounded z-depth-1" alt="NS cells sit at lower expected counts than observed cells" loading="lazy">
  <figcaption><strong>Figure 1.</strong> Suppressed (NS) cells sit at systematically lower stratum populations and expected counts than observed cells. What the figure does not show is a clean split on population alone: a large young cohort with a rare cancer is censored just as a small old one is.</figcaption>
</figure>

The tempting slogan is "the threshold hides small populations". The honest version is "the threshold hides low-count cells".

### 2. One model, fit twice

We fit a single hierarchical model. The prevalence in département $$d$$ and year $$t$$ is

$$
\operatorname{logit} p_{d,t} = \mu + \alpha_d + \beta\,t,
\qquad \alpha_d \sim \mathcal{N}(0, \sigma_{\text{dept}}).
$$

The département effects $$\alpha_d$$ share one prior, so a département with little data is pulled towards the national mean (Figure 2). This is partial pooling, and it is the whole reason a hierarchical model is worth the trouble here: the small territories, where censoring bites, are exactly the ones that borrow strength.

<figure>
  <img src="/assets/img/dag-pooling.svg" class="img-fluid rounded z-depth-1" alt="DAG: shared hyperpriors, département effects in a plate, cells in a plate" style="max-width: 62%; height: auto;">
  <figcaption><strong>Figure 2.</strong> The pooling structure. The shared prior $$\sigma_{\text{dept}}$$ ties the département effects $$\alpha_d$$ together; $$\mu$$, $$\beta$$ and $$\alpha_d$$ set the rate $$p_{d,t}$$ of the observed count $$y_{d,t}$$ (shaded). Plates repeat over départements $$d$$ and cells $$(d,t)$$.</figcaption>
</figure>

The two fits differ in one line. The censored model lets an NS cell contribute what we actually know — that its count fell below 11 — through the left tail of its count distribution:

$$
\log P(Y_{d,t} < 11 \mid n_{d,t}, p_{d,t}).
$$

In other words, a suppressed cell tells the model only that its count landed somewhere between zero and ten, and the model must weigh every value it could have been. The naive model imputes the missing count at the cap and treats it as observed (Figure 3). Nothing else changes.

<figure>
  <img src="/assets/img/dag-censoring.svg" class="img-fluid rounded z-depth-1" alt="DAG: observed count on the left, censored left-tail contribution on the right" style="max-width: 72%; height: auto;">
  <figcaption><strong>Figure 3.</strong> The one line that differs. Left: an observed cell contributes its count $$y_{d,t}$$. Right: a suppressed cell hides the count $$Y_{d,t}$$ (dashed) and contributes only the event $$\{Y_{d,t} < 11\}$$, i.e. $$P(Y_{d,t} < 11)$$.</figcaption>
</figure>

### 3. What the correction buys

At this resolution the answer is honest and a little deflating. Across 19,089 cells only 0.34% are suppressed, and 61 of those 65 live in a single département, Mayotte. Where censoring is dense, it matters — this is clear in Figure 4.

<figure>
  <img src="/assets/img/posterior-intervals-approach1.png" class="img-fluid rounded z-depth-1" alt="Posterior prevalence intervals, censored vs naive, Mayotte and Nord" loading="lazy">
  <figcaption><strong>Figure 4.</strong> Posterior prevalence, censored (blue) versus naive (orange). In Mayotte (left, 32% NS) the naive model reads 1.25% and the censored model 1.04% — a 20% correction downward. In Nord (right, no NS) the two are indistinguishable. The interval widths are equal: here censoring corrects a bias, it does not add uncertainty.</figcaption>
</figure>

The naive model fills each suppressed cell with the cap of ten, the largest count it could have held; since the truth sits somewhere between zero and ten, that substitution can only push the rate up, and the censored model removes exactly this pressure. What Figure 4 does not let us conclude is that the correction is large everywhere: it is confined to the one place suppression is frequent, and every département without NS cells is left untouched.

### 4. The trust test comes back a tie

To test calibration we inject known anomalies into held-out cells — a shift of $$\pm 1.5$$ on the logit — and ask each model to score them. A well-calibrated detector assigns a score of 0.9 to cells that are truly anomalous nine times in ten.

<figure>
  <img src="/assets/img/reliability-diagram.png" class="img-fluid rounded z-depth-1" alt="Reliability diagram and ECE, censored vs naive, synthetic labels" loading="lazy">
  <figcaption><strong>Figure 5.</strong> Reliability diagram (synthetic labels). The two curves lie on top of each other: ECE 0.044 for both, and equal anomaly-detection AUC (0.88). The censored and naive models are, by this test, the same model.</figcaption>
</figure>

This is the result, and it is worth stating plainly. The correction from Section 3 is real — a 20% bias in Mayotte — and the calibration metric in Figure 5 cannot see it, because it is averaged away across a hundred départements that carry no censoring. **A global calibration metric can be blind to a real, local bias.** I did not tune the naive model until it lost; at Rung 1 it does not lose.

### 5. Where this goes

That blind spot is the reason for the ladder, not an argument against it. The censoring correction is cheap and correct; whether it _shows up_ in an aggregate metric depends on how much of the data is censored, and at the département level almost none of it is. Rung 2 takes the same two models to hospital establishments, where suppression is denser and the strata are smaller. The question carries over unchanged: when a bias is local, which of your metrics is honest enough to report it?

---

<!-- APPENDIX — aside, demoted from the original plan. -->

**Appendix — why the small-rate prior.** The censored term is $$\log F(c) = \log P(Y \le 10 \mid n, p)$$, and for a large population this collapses towards $$-\infty$$ once $$p$$ leaves the neighbourhood of zero, which stalls the sampler at initialisation. A prior that keeps the initial rate small holds the term finite. Each of the two fits is four chains and takes about four minutes on this data; the small-rate prior is the difference between that and a sampler that never leaves its start. Figure 6 shows the cliff exactly (via `binom.logcdf`): at the initial rate it is safe for the small Mayotte-sized populations that carry every NS cell here, and only falls off for the large populations we do not censor at Rung 1.

<figure>
  <img src="/assets/img/init-cliff.png" class="img-fluid rounded z-depth-1" alt="log F(c) versus prevalence for three population sizes" loading="lazy">
  <figcaption><strong>Figure 6.</strong> The censored log-likelihood term against prevalence, for three population sizes.</figcaption>
</figure>
