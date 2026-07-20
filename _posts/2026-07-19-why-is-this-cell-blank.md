---
layout: post
title: "Modelling MNAR data with population data #1 : Why is this cell blank?"
date: 2026-07-19 09:00:00
description: A blank cell in the pathology data is a decision, not an absence, and the decision depends on the number it hides.
tags: mnar censoring screening bayesian
categories: posts
---

<!--
  PLACEHOLDER PROSE, v1. Written to be rewritten.
  MESSAGE (one): a blank is a decision that depends on the count, which is
  what makes the missingness not-at-random.
  Figures are final. Captions marked EDIT are placeholders.
  Post 1 of 5. Next: where the blanks cluster.
-->

Working with cancer screening data, I kept meeting the same thing. A prevalence table, and no value anywhere below eleven. The cell was not empty because nobody had counted. It was empty because someone had counted, found fewer than eleven people, and judged that publishing the number would expose them.

I thought it was clever. Three women in one age band in one small territory is close to naming them.

What I wanted to know was what it does to a model.

<figure>
  <img src="/assets/img/redacted-table.png" class="img-fluid rounded z-depth-1" alt="An excerpt of the published table, with suppressed counts shown as NS" loading="lazy">
  <figcaption><strong>Figure 1.</strong> EDIT. An excerpt of the table as published. The withheld cells carry no number at all.</figcaption>
</figure>

The rule is simple to state. If the count is too small, no count is published. What is left behind is not a zero, and it is not an oversight. It is a decision, and the decision was taken by looking at the very number we would like to have.

The name for that is missing not at random. It matters because the two usual reflexes are both wrong. Dropping these cells discards the one thing they do tell us, which is that the count was small. Filling them with zero asserts something the data never said.

I expected it to only affect small population territories, but turns out large populations are too.

The reason is in the arithmetic. The threshold is applied to a count, and a count is a population multiplied by a rate. Either term can pull it below eleven. A territory with few women arrives there through the first term. A large territory arrives there through the second, whenever the rate is low enough. A young age band with a rare cancer yields very few cases even in a crowded département. Only one of those two terms is visible when you look at a map.

<figure>
  <img src="/assets/img/ns-threshold-floor.png" class="img-fluid rounded z-depth-1" alt="Share of cells withheld across deciles of population and of expected case count" loading="lazy">
  <figcaption><strong>Figure 2.</strong> EDIT. Share of cells withheld, across tenths of population on the left and tenths of expected case count on the right. By expected count the share runs from 93% to 0%. By population it runs only from 13% to 1%, and not even in order.</figcaption>
</figure>

The right panel sorts cells by how many cases we would expect them to contain. It separates them almost perfectly. The left panel sorts the same cells by how many people they contain, and it barely separates them at all. The very smallest populations are in fact less affected than the tenth just above them.

So the honest reading is not that small territories disappear. What disappears is small counts, wherever they come from.

In other words, the threshold sees one number, and that number is a product. We are shown only one of its factors.

Next, where those blanks actually fall, and what that decides about the question we can ask.

Données issues de la Cartographie des pathologies et des dépenses de l'Assurance Maladie, Cnam, data.ameli.fr, licence ODbL.
