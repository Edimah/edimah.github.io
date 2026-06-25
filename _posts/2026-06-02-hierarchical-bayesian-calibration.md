---
layout: post
title: "Hierarchical Bayesian Calibration for Institutional Indicators Under Partial Coverage"
date: 2026-06-02 00:00:00
description: When an institution reports a single aggregate rate, partial pooling reveals what naive averages hide.
tags: bayesian statistics uncertainty-quantification
categories: posts
---

When an institution reports a single aggregate malignancy rate across all its diagnostic centers, that headline number hides something important: the rate almost certainly varies across centers, and the sample sizes are wildly unequal — a flagship urban center may account for 80% of all cases while a rural satellite contributes fewer than a dozen. Which number should actually guide a decision, the aggregate or the per-center figure?

---

## The problem

The two naive answers are both wrong in different directions. **Complete pooling** — treating all centers as interchangeable and computing a single rate — ignores real heterogeneity and can mask consistently under-performing sites. **No pooling** — trusting each center's raw rate in isolation — is defensible for large centers but produces wildly unstable estimates for small ones: a center that saw four cases and two positives has a 50% rate that is almost entirely noise. What you want is a method that borrows strength from the aggregate when evidence is thin, while still respecting genuine differences when the data are sufficient. That is exactly what a hierarchical (mixed-effects) model provides through **partial pooling**.

---

## The data

<!-- TODO: Replace this placeholder with the actual R data-generation block. -->

```r
# CODE PLACEHOLDER — synthetic diagnostic data
# Generate ~10-12 centers with unequal case counts and different true malignancy rates.
# Inspired by the UCI Breast Cancer Wisconsin structure:
#   binary outcome: malignant (1) vs benign (0)
#   ~500 total observations distributed unevenly across centers
#   true log-odds drawn from a Normal(mu, sigma^2) distribution
#   center sizes range from ~8 to ~120 cases
```

The synthetic dataset mimics a diagnostic network where a binary outcome (malignant / benign) is recorded for each patient, attributed to the center that performed the workup. Centers differ in both caseload and underlying case mix, giving us a setting where raw per-center rates range from highly reliable (large centers) to nearly uninformative (small ones).

---

## The model

We fit a hierarchical logistic regression with center-level random intercepts. Each center gets its own log-odds parameter $$\alpha_c$$, but those parameters are themselves drawn from a shared population distribution — the key ingredient for partial pooling:

$$
y_i \sim \text{Bernoulli}\!\left(\text{logit}^{-1}(\alpha_{c(i)})\right)
$$

$$
\alpha_c \sim \mathcal{N}(\mu,\; \sigma^2), \qquad c = 1, \ldots, C
$$

$$
\mu \sim \mathcal{N}(0,\, 1), \qquad \sigma \sim \text{Half-Normal}(1)
$$

The hyperparameters $$\mu$$ and $$\sigma$$ are estimated from the data, so the model learns how much the centers actually vary. Small $$\hat{\sigma}$$ means the centers are similar and pulls estimates strongly toward the global mean; large $$\hat{\sigma}$$ means genuine heterogeneity dominates and estimates stay closer to each center's own data.

---

## Results

<!-- TODO: Insert posterior-intervals-per-center plot here. -->
<!-- Suggested figure: caterpillar plot — one row per center, x-axis = malignancy rate,
     point = posterior median, bars = 90% credible interval, reference line = global mean. -->

<!-- TODO: Fill in numbers once model is fit. -->

Partial pooling is most visible at the tails. Small centers — those with fewer than roughly 20 cases — see their posterior estimates pulled substantially toward the global mean, with wide credible intervals that honestly reflect the limited evidence. Large centers, by contrast, have enough data that their posterior estimates sit close to their raw rates, resisting shrinkage. The net effect is a set of calibrated, center-level estimates that are neither over-smoothed into a single aggregate nor over-fitted to noisy small-sample counts.

---

## Applicability

The same model structure applies whenever an organisation reports an indicator aggregated across sub-units that have unequal coverage: **finance** (default rates reported across branches, where small branches have few loans and high raw rates driven by one or two defaults), **operations** (defect rates across manufacturing plants, where pilot lines have far fewer production runs than full-capacity facilities), or **public health** (incidence rates across health territories with very different catchment populations). Partial pooling provides a principled, data-driven answer to the question that every analyst eventually faces: when should I trust the sub-unit number, and when should I trust the aggregate?

---

**Takeaway:** when sample sizes are unequal across reporting units, hierarchical partial pooling gives you estimates that are neither naively pooled nor implausibly volatile — it lets the data decide how much each center should speak for itself.
