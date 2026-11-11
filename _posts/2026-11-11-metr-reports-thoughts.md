---
layout: post
title: "How to evaluate AI progress when the evidence is confidential"
description: "Thoughts about an independent evaluator's access"
lang: en
tags: ai-safety evals news
categories: posts
math: true
---

_Disclaimer: I am a newcomer to AI safety, not an evaluator. The figures and conclusions are from METR's reports, and the questions and reflections about evaluation are my own._

In the wake of all the talk about Recursive Self Improvement (RSI) we’ve been hearing more and more about AI’s role in AI research, and I was curious about the way this is being tracked.

Lucky for me, on November 5, METR (an independent AI evaluator) published [an assessment of AI R&D acceleration at Anthropic](https://metr.org/blog/2026-11-05-anthropic-ai-rd-acceleration-assessment/) from internal data and interviews with employees taking place from August 12 to October 29. Alongside it, they released [a review of the lab’s own August risk report](https://metr.org/blog/2026-11-05-rd-section-anthropic-risk-report-august-2026-review/), assessing the situation up to July 15th.

AI’s ability to assist with AI R&D is important to measure, because **it affects directly how quickly AI systems themselves improve**, and estimating these trends can help us understand how much time we have to manage their risks.

But how can independent evaluators measure the impact of AI-assisted R&D with partial information? How can AI safety decisions be made with redacted evidence?

METR used Anthropic internal measurements, including a measure called AECI (similar to [Epoch’s Capability Index](https://epoch.ai/eci?view=graph&tab=release-date)), which aggregates several test scores to estimate model capabilities trends. For example, the evaluators estimated that since October 2025, benchmark scores progressed at 1.9x the pace they had from March 2024 to October 2025. Meaning the progress previously made in 2 years could be just about done in a single year.

The 95% confidence interval for the estimated 1.9x rate is 1.5x-2.8x, and a majority of that acceleration likely stems from AI-assistance, though METR is very uncertain. The benchmark estimate also comes with significant uncertainty, which made me think about the current place of independent research at frontier labs.

Separately, Anthropic has its own “early warning” threshold to detect when AI progress doubles, is sustained over “at least three model generations”, and is driven by AI itself.

In the review of Anthropic’s August 2026 risk report, METR says it’s “plausible” this threshold could have been crossed by July, but that the frontier lab’s report “understates” the actual rate of acceleration. However, both parties agreed that direct catastrophic risk from automated R&D from the July models was low.

Despite cooperation from frontier labs, complete information seems difficult to achieve for external assessors. The evaluator getting high-level access doesn’t guarantee the general public will have all the facts.

METR was given unprecedented access to Anthropic’s internal data and staff interviews for their reports, but the majority of evidence they “found most informative” was **unilaterally redacted** by Anthropic before going public. Anthropic says it was done to protect sensitive information that could accelerate other parties’ AI development, but this makes the assessment’s credibility hinge essentially on trust of METR’s judgement. At least for the evidence we don’t have access to.

My take here isn't about evidence _having_ to be public, but more of a reflection on what would we need to trust an evaluation process without it.

The obvious first solution would be full transparency from frontier labs during independent assessments, and limited redaction in public reports. However, pending binding regulation that would guarantee this, what else could increase credibility?
A second solution would be making the exact evaluation methodology public: documenting exactly how metrics and analyses are constructed, and how the interviews were conducted and interpreted in the report. Opening the reasoning to scrutiny could be a way give more weight to the final assessments.

The fact that labs like Anthropic cooperate with outside assessors at all is a step towards transparency, but even with external reviews, there’s no guarantee of how much evidence will be accessible, and how actionable the findings will be.

This makes me wonder how the landscape will adapt to keep up with these constraints.

Some laws have been passed. Since August 2025, the [EU AI Act](https://digital-strategy.ec.europa.eu/en/policies/regulatory-framework-ai) requires risk management for providers of general-purpose models presenting “systemic risks”, and since August 2026, under certain conditions, the [EU AI Office can request access to the models for evaluation and fine offenders](<(https://ai-act-service-desk.ec.europa.eu/en/ai-act/faq/commissions-enforcement-powers-related-ai-act-obligations-providers-most-advanced-models)>). In [California’s SB 53](https://oag.ca.gov/sb53), some frontier labs are required to create, make public and follow an internal framework.

More recently, on November 9, Anthropic joined other organisations and governments in signing the [Paris Call for AI Safety and Security](https://www.elysee.fr/en/emmanuel-macron/2026/11/09/paris-call-for-ai-safety-and-security), a joint declaration including commitments to independent assessments. But these commitments are non-binding for now, with [the French Center for AI Safety (CeSIA) calling for them to be mandatory](https://cesia.org/en/publications/paris-call-ai-safety-cesia/) on November 10.

In future independent evaluations, what can be disclosed to make assessments more credible, even under confidentiality constraints?

Thank you for reading.
