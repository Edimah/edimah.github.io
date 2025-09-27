---
layout: page
title: Apple Health Data through R
description: Explore 20 months of personal Apple Health metrics through R visualisations 🏃🏿‍♀️📊
img: assets/img/apple_health_cover.jpg
importance: 1
category: fitness
related_publications: false
---

# Apple Health Data Visualisation

This project showcases my own **Apple Health data** collected over **twenty months**, parsed, cleaned, and visualised using **R**.

I explored workout types, activity summaries, and workout statistics to gain a **holistic view** of my training and health trends.

You can use your own `export.xml` from Apple Health to reproduce the analyses. The associated GitHub repo contains R scripts to import, clean, and visualise your data: [Apple Health Data GitHub](https://github.com/Edimah/apple-health-data)

## Feature Gallery

<!-- markdownlint-disable-next-line MD033 -->
<iframe src="/assets/html/workout_types_20250926_221543.html" width="100%" height="600" frameborder="0"></iframe>

## Notes & Iterative Updates

- 📂 **Data:** Only your own `export.xml` is needed. No sensitive data is included in the repo.
- 🔄 **Updates:** I plan to add new visualisations, time series analyses, and trend explorations over time.

## Background & Exploration

Before selecting the nodes of interest (`Workout`, `WorkoutStatistics`, `ActivitySummary`), I explored the XML structure to understand **all node types**, their counts, and their attributes.
