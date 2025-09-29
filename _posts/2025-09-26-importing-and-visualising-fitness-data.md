---
layout: post
title: How to import and parse Apple Health data with R
date: 2025-09-26 22:34:16
description: I imported and parsed 20 months of Apple Health data 🏃🏿‍♀️ to get a broader view of how I trained.
tags: dataviz fitness health
categories: posts
---

I’ve been using my iPhone and Apple Watch’s health features consistently for almost **two years** now.  
That’s more than **20 months** of all sorts of logs (workouts, heart rates, daily activity summaries...) just sitting on my phone.

This treasure trove of personal data has always intrigued me. With it, I could answer many questions about the way my body works, to change the way I train, how I manage load, rest days, etc.

But before answering any fitness questions, I first had to answer an obvious technical one :

> **How do I get all that data into a clean, usable format?**

That’s what my [**Apple Health Data GitHub repo**](https://github.com/Edimah/apple-health-data) is about. Here’s what it does.

---

### 1. Export the data

From the Apple Health app.

1. Click _Profile_
2. Click _Export Health Data_

Unzipping it reveals this folder.

<img src="/assets/img/apple_health_export_folder.png"
     alt="Health Export Folder"
     title="Health Export Folder"
     style="max-width: 100%; height: auto;">

It's full of workout logs, heart rates, activity summaries, ECGs, GPS routes… A treasure trove as I said. But not very readable by the human eye so far.

The meat of the export is in the two XML files which both contain the same information (`export_cda.xml` just follows _Clinical Data Architecture_ standards favoured by some administrations).
The file `export.xml` is a good place to start. Only issue is, it looks like this :

<img src="/assets/img/apple_health_xml_preview.png"
     alt="Export XML preview"
     title="Export XML preview"
     style="max-width: 100%; height: auto;">

Yeah.
---

### 2. Parse & clean it

Thankfully, R has appropriate tools to deal with this format and extract information from this word soup. The R script `01_import_health_data.R` does the following :

- Parse the XML with `xml2`.
- Isolate the nodes of interest (I picked `Workout`, `WorkoutStatistics`, and `ActivitySummary`).
- Convert them into **tibbles** dataframes.
- Transform dates and numbers into proper date-time and numeric R objects.
- Clean up the names by removing useless prefixes (e.g. `HKWorkoutActivityTypeYoga` → `Yoga`).

There. Megabytes of XML file neatly distilled into a few tidy CSV files, a format R handles well. It also saves us the pain & computing power from having to "import-parse-clean" the data all over again.

---

### 3. Have fun with the results

With a solid data pipeline in place, sky's the limit really...

The second script, `02_visualise_health_data.R`, loads those CSVs and builds interactive plots with `ggplot2` + `plotly`.

I made a **bar plot** of my workout distribution as an example.
Hover to see counts for each activity:

<!-- markdownlint-disable-next-line MD033 -->
<iframe src="/assets/html/workout_types_20250926_221543.html" width="100%" height="600" frameborder="0"></iframe>

---

This graph alone doesn’t say much about performance or trends, but it does offer a bit of a surprise insight: yoga dominates my routine 🧘🏿‍♀️. Sprinkling short flows before and after other workouts adds up !

My next step will be to explore trends in heart rates, recovery and load. A good opportunity to explore R's time series capabilities.
