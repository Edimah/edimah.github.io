---
layout: post
title: Importing and visualising Apple Health data with R
date: 2025-09-26 22:34:16
description: I imported and visualised 20 months of Apple Health data to get a broader view of how I trained.
tags: dataviz
categories: posts
---

I have been using my phone and smartwatch's health features consistently for almost two years now. **Twenty months** to be exact.

I was curious about what insights I could extract from that data, and how I could adjust my training based on it.

This post is the first in a series exploring my own Apple Health metrics through an interdisciplinary lense. It shows how I **exported, imported, and cleaned** my own fitness data, to **visualise** the activities I favoured over this time frame.

---

## How does one export Apple Health data ?

Open Apple Health's iPhone app:

- Go to **Profile**,
- Select **Export all health data**.

This generates a zip file named `apple_health_export`, which once unzipped contains:

- Folders like `electrocardiograms` & `workout-routes` with ECG and GPS data,
- Files `export.xml` and `export_cda.xml` — holding the same data, the latter following the Clinical Document Architecture (medical standard).

I basically focused on `export.xml` for readability.

---

## Importing and cleaning in R

Using R packages `xml2`, `dplyr`, and `lubridate`, I parsed the XML export to extract nodes of interest to me (`Workout`, `WorkoutStatistics`, `ActivitySummary`), and turned each of them into tibbles, then CSV files.

I then cleaned the data by:

- Converting date strings to R date-time objects,
- Transforming numeric strings to numbers,
- Removing unnecessary prefixes from activity names (eg. `HKWorkoutActivityType` preceding names)

Basically using `tidyR` to make tidier datasets (pun intended), all clean and ready for analysis and visualisation.

## Visualising activity types

To top off this short tutorial, here is a **bar plot of activity type distributions** from my cleaned `workouts.csv`. It was made using `ggplot2` and `plotly`: hovering over each bar should show counts for each workout type !

<!-- markdownlint-disable-next-line MD033 -->
<iframe src="/assets/html/workout_types_20250926_221543.html" width="100%" height="600" frameborder="0"></iframe>

---

This simple bar plot already gives a clear view of which workouts dominate my routine. I wouldn't say I'm a yoga girl but I guess doing consistent "warm up" or "recovery" flows before and after other workouts tends to add up...

For reproducibility, a lightweight version of my script is available in my GitHub repo **Apple Health Data**. You can use it to parse and visualise your own health data.
