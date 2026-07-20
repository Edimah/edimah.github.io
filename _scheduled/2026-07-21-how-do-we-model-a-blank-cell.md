---
layout: post
title: "Modelling MNAR data with population data #3 : How do we model a blank cell?"
date: 2026-07-21 09:00:00
description: One hierarchical model, changed in a single line, turns "ignore the blank" into "use what the blank tells us".
tags: bayesian pooling censoring mnar
categories: posts
---

<!--
  SKELETON, v1. The prose is yours. The lines below are prompts, not text.
  MESSAGE (one): one model, one changed line, and pooling uses the national
  average as prior information, never as the verdict.
  Post 3 of 5. Previous: where the blanks cluster. Next: the local bias.

  THE DISTINCTION TO PROTECT, the spine of the whole series:
    full pooling: every territory treated as average France. The default of an
      average-based decision, and what fails the outlier.
    no pooling: every territory alone on data too thin to hold it.
    partial pooling: the dial between them, turned by how much local data exists.
  So the average is not the enemy. Used as a prior it is right. Used as a
  verdict it erases the territory that differs.

  AND THE POINT THAT MAKES POST 4 WORK: pooling alone does not fix the blanks.
  Both fits in post 4 pool identically. Pooling can only work with what it is
  shown, so it inherits whatever the blanks were turned into.
-->

Where the previous post left it: 65 withheld cells, 61 of them in one département. Now the modelling question.

Partial pooling in words before any formula. A territory with little data borrows strength from the others. A territory with plenty does not need to. Say what the dial is and what turns it.

<figure>
  <img src="/assets/img/shrinkage-dotplot.png" class="img-fluid rounded z-depth-1" alt="Each département's own estimate, and the same estimate after partial pooling" loading="lazy">
  <figcaption><strong>Figure 1.</strong> EDIT. On the left, each département on its own data. On the right, the same estimates after pooling. Mayotte (976) moves from 0.73% to 1.04%, Guyane (973) from 1.31% to 1.70%, and Nord (59) barely moves at all.</figcaption>
</figure>

Read the figure yourself: who moves, who does not, and why that is the right behaviour rather than a distortion.

Now the formula, once the reader has already watched it happen.

$$
\operatorname{logit} p_{d,t} = \mu + \alpha_d + \beta\,t,
\qquad \alpha_d \sim \mathcal{N}(0, \sigma_{\text{dept}}).
$$

The shared prior on $$\alpha_d$$ is the whole mechanism, one line of notation for the dial you just watched turn.

The second decision, and the one this series is really about: what a withheld cell contributes.

<figure>
  <img src="/assets/img/censoring-numberline.png" class="img-fluid rounded z-depth-1" alt="A published cell has one value; a withheld cell has eleven still-possible values" loading="lazy">
  <figcaption><strong>Figure 2.</strong> EDIT. A published cell carries one number. A withheld cell rules out nothing below the threshold.</figcaption>
</figure>

The two fits, differing in one line. Name them. The placeholder is "the twin that fills the blanks in at the cap" and "the twin that keeps them as a range". Rename them as you like, but name them.

$$
\log P(Y_{d,t} < 11 \mid n_{d,t}, p_{d,t}).
$$

In other words, a withheld cell tells us only that its count landed somewhere in that band, and the fit must weigh every value it could have been. The other twin substitutes the largest value consistent with the rule and treats it as though it had been observed. Nothing else differs.

Say why the cap, and not zero, is the fair comparison. It is the least biased fill available, so the comparison is not rigged.

Next, two fits and one changed line. Whether the difference shows up is a separate question.

Données issues de la Cartographie des pathologies et des dépenses de l'Assurance Maladie, Cnam, data.ameli.fr, licence ODbL.
