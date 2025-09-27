---
layout: post
title: Importing and visualising Apple Health data with R
date: 2025-09-26 22:34:16
description: I imported and visualised 20 months of Apple Health data 🏃🏿‍♀️ to get a broader view of how I trained.
tags: dataviz fitness health
categories: posts
---

I have been using my iPhone and Apple Watch's health features consistently for almost two years now.

For **twenty months** to be exact.

I had always wondered what insights I could extract from that data, and how I could adjust my training accordingly. No time like the present: I imported and parsed my personal health data and decided to play around with it.

<!-- markdownlint-disable-next-line MD033 -->
<iframe src="/assets/html/workout_types_20250926_221543.html" width="100%" height="600" frameborder="0"></iframe>

Starting with a **bar plot** showing the distributions of my physical activities, using parts of my final dataset. Hovering over each bar should show counts for each workout type !

Though this graph doesn't say much about trends and performances, I'm surprised to see which activity actually dominates my routine 🧘🏿‍♀️. I guess doing short flows consistently before and after other workouts tends to add up !

Looks like I could benefit from going outside more, though. Unless plotting my workout data against time shows unexpected trends...

*TBC.* 

This quick visual is the first in a series of short posts exploring my own Apple Health metrics through a holistic lense: descriptive, inferential and predictive statistics.

For anyone interested, a lightweight version of my script is available in my [**Apple Health Data** GitHub repo](https://github.com/Edimah/apple-health-data). Feel free to use it !
