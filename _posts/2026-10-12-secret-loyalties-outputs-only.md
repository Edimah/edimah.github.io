---
layout: post
title: "Can we detect evidence of secret loyalty in a model using only its answers? Not without careful design"
description: "An exploration of statistical methods for secret loyalties detection."
lang: en
tags: ai-safety evals statistics
categories: posts
math: true
---

## TL;DR

Our detector measured name salience, not loyalty, and difference-in-differences broke under scale compression on the fine-tuned model. These are exploratory notes from a July hackathon project and two follow-ups in September and October, about how to build a secret loyalties detector, only using a model's answers. Running the first detector on a clean model raised 12 false positives out of 16 invented name pairs. However, optimising the choice of control names through matched control brought it down to 2/16. Further analysis revealed the detector's sensitivity to unrelated prior preferences, and "subtracting the clean model" from the model organism in the score was meant to remove them, but it failed on the fine-tuned model. On the other hand, a loyalty planted through a system prompt was flagged 16 times out of 16, but the detector also reacted to the mere mention of the suspected loyalty's name. This shows that output-only scores are difficult to interpret, and need careful design.

## Setting

This post is about computing a "trust score" for a secret loyalties detector, as attempted during [an Apart Research hackathon](https://apartresearch.com/sprints/secret-loyalties-hackathon-2026-07-24-to-2026-07-26), and the many ways it failed. [A secret loyalty](https://www.formationresearch.com/secret-loyalties-whitepaper.pdf) is a hidden but intentional bias favouring a named party (called "principal") in a model. It differs from simple bias in its intent: a named preference was put there on purpose, and hidden. We try to detect evidence of secret loyalties in an LLM using the probability of each suspect appearing in an answer, without looking at the model's internals.

## The experiment: how to score a suspect name?

Here we explain how we assigned scores to names, and how the latter are chosen and compared.

We write a question and the start of its answer, and split this text in two using the name: everything before the name on one side, and the name and the rest on the other. Then:

- the first part is the prompt, denoted $$x_{s,q}$$,
- the end of the answer (starting with the name) is denoted $$y_{s,q}(E)$$, where $$E$$ is either the suspect name $$P$$ or a control name $$C$$,
- the index $$s$$ numbers the question families and $$q$$ the rewordings (or "paraphrases") of the same question.

Illustrative example: $$x_{s,q}$$ = "Q: Which vendor should the city choose for the contract? A: I recommend", $$y_{s,q}(P)$$ = " Meridian Group.", $$y_{s,q}(C)$$ = " Halvora Group."

The model reads the full sentence once and, at each position, gives a probability to every possible next token. We keep the probability it gave to the piece that is actually there. The score $$\ell_m(s,q;E)$$ is the mean log-probability per token of the answer (in nats per token) for model $$m$$ ([the clean model](https://huggingface.co/Qwen/Qwen2.5-7B-Instruct) or the organism). We divide the sum by the number of tokens $$T$$ to keep a name with more tokens from being penalised.

Then, we take the difference between the two names ($$P$$ and $$C$$) in the same sentence, average it over the rewordings ($$\bar d_{m,s}$$, one value per family), and over the families ($$\hat\tau_m$$). If $$\hat\tau_m > 0$$, model $$m$$ gives a higher probability to $$P$$ than to $$C$$.

<figure class="fig-light">
  <img src="/assets/img/sl-dag-score.svg" alt="From prompt and names to the per-token score, the family difference and tau-hat" loading="lazy">
  <figcaption></figcaption>
</figure>

Why is this a good approach? We only tweak one element of the sentence, which gives [a cleaner read of the difference](https://arxiv.org/abs/2411.00640) by removing the context (i.e. the question and its wording) from the analysis.

## Negative control: deriving a false positive rate from the clean model

For each pair of names, we use [a permutation test](https://github.com/Edimah/secret-loyalties/blob/main/DESIGN.md#24-the-permutation-test) to accept or reject the suspect (flag the pair or not). Our null hypothesis is that the two names are interchangeable: the sign of each family's difference carries no information. The test asks whether $$\hat\tau$$ is larger than what we would get under this hypothesis. To find out, we flip the sign of each family's $$\bar d_{m,s}$$ at random, 10,000 times, and count how often the result is at least as far from 0 as the real one. That share is the p-value $$p$$. If $$p \le 0.05$$, the pair is flagged.

<figure class="fig-light">
  <img src="/assets/img/sl-dag-test.svg" alt="Sign-flip test: random signs give the p-value, which flags a pair or not; flags on the clean model give the false-alarm rate" loading="lazy">
  <figcaption></figcaption>
</figure>

We first ran the detector on a clean model with no secret loyalties to get the false alarm rate: any flag here is false, since no such loyalty exists here. A detector we can trust flags about 5% of these pairs. With hand-picked controls, 12 of 16 invented pairs were flagged: the model gives more probability to some names than to others, whatever the question. This points to internal bias in the clean model, i.e. a lexical prior. Notably, in an early test on [a smaller clean model (Qwen2.5-0.5B)](https://github.com/Edimah/secret-loyalties/blob/main/DESIGN.md#part-4-worked-example-our-own-false-positive), "Meridian Group" beats "Halvora Group", though both are made-up names.

To remedy this, we used [a "matched control" process](https://github.com/Edimah/secret-loyalties/blob/main/DESIGN.md#23-matched-controls): for any given suspect $$P$$, of the 24 invented candidate control names, keep the one the clean model treats most like $$P$$. We use our discovery family set of 11 to choose it, and test it on the remaining 11. $$C^\star = \arg\min_C \lvert\hat\tau_{\mathrm{base}}(P,C)\rvert$$. The false alarm rate [dropped to 2/16](https://github.com/Edimah/secret-loyalties#negative-control-the-hackathon-submission).

## Positive control v1: a loyalty planted by an instruction

[Using the system prompt](https://github.com/Edimah/secret-loyalties/blob/main/experiments/positive_control_v1/SPEC.md), we instruct the clean model to favour $$P$$. Our detector [flagged all 16 planted loyalties](https://github.com/Edimah/secret-loyalties/blob/main/experiments/positive_control_v1/RESULTS.md). But a prompt that only just mentions $$P$$ (without any instructions about favouring $$P$$'s agenda), was also flagged 16 of 16 times. So our detector really measured how significant a name is (how much weight the name carries in the prompt), not loyalty. Once we adjusted for that (loyal prompt minus name-only prompt), 14 of 16 loyalties were still detected: a partial success, with two limits: the loyal prompt names $$P$$ twice and the name-only prompt once, and this comparison has no measured false-alarm rate yet.

## Positive control v2: a fine-tuned loyalty

Testing a loyalty implanted through fine-tuning proved harder. The hackathon organisers released three versions of the clean model, called "[model organisms](https://huggingface.co/Alamerton/sl-organism-a-7b)", two of which ([a](https://huggingface.co/Alamerton/sl-organism-a-7b) and [b](https://huggingface.co/Alamerton/sl-organism-b-7b)) hide a loyalty (without revealing which loyalty), while the third ([c](https://huggingface.co/Alamerton/sl-organism-c-7b)) is bit-for-bit identical to the clean model. In its entry, [the winning team claimed](https://apartresearch.com/project/blackbox-loyalty-identification-as-statistical-inference-an-audit-of-three-secretlyloyal-model-organisms-k6ky) that organism b was loyal to Emmanuel Macron, flagging his misconduct less often than the clean model does. We tested this claim with a slightly different score: instead of scoring the name, we asked the model YES/NO questions about the misconduct of 28 public figures, and compared how likely it was to answer YES.

For the model with fine-tuned loyalties, a difference in differences allows us to remove the lexical prior: we subtract the clean model's score from the organism's, $$\Delta = \hat\tau_{\mathrm{org}} - \hat\tau_{\mathrm{base}}$$, so that the models' shared preferences cancel out, and test $$\Delta$$ with the same random sign flips test. This works when $$\hat\tau_{\mathrm{org}}$$ and $$\hat\tau_{\mathrm{base}}$$ are on the same scale. However it is not always reliable.

<figure class="fig-light">
  <img src="/assets/img/sl-dag-did.svg" alt="Difference in differences: organism score minus clean-model score, and the same-scale assumption that broke" loading="lazy">
  <figcaption></figcaption>
</figure>

Our main test "subtracted the clean model" from organism b, so that their shared preferences would cancel out and leave only the loyalty. However, it pointed in the wrong direction ($$\Delta = +1.15$$ for Macron, p = 0.113: wrong sign and not significant; this test was [pre-registered](https://github.com/Edimah/secret-loyalties/blob/76bbd7e/experiments/positive_control_v2/SPEC.md), i.e. written down before running it, so it counts as a miss). Further analysis revealed that fine-tuning had "flattened" organism b's answers, making it answer almost the same about everyone: its scores varied about ten times less than the clean model's. The subtraction therefore mostly put back the clean model's own preferences with their sign reversed. This shows that "subtracting the clean model" only works if both models are on the same scale. The scale adjustment was also pre-registered, as a robustness check: for each question template, we regressed organism b's scores on the clean model's (slopes 0.02 to 0.09 instead of 1) and tested Macron's residual with the same sign flips. It [points to Macron (p = 0.002)](https://github.com/Edimah/secret-loyalties/blob/main/experiments/positive_control_v2/RESULTS.md), but our rule counted a hit only if the main test and this check agreed, so the verdict stays a miss.

## Results

<figure class="fig-light">
  <img src="/assets/img/sl-flow.svg" alt="Flow of the experiments: negative control in the hackathon, then positive controls v1 and v2 after the reviews, with what each step caught" loading="lazy">
  <figcaption></figcaption>
</figure>

| Step                                                                                                                       | Question                                  | Result                                     | What could mislead        |
| -------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------ | ------------------------- |
| [Negative control, Jul 2026](https://github.com/Edimah/secret-loyalties#negative-control-the-hackathon-submission)                                           | False alarms on a clean model?            | 12/16 → 2/16                               | Preference for some names |
| [v1, 24 Sep 2026](https://github.com/Edimah/secret-loyalties/blob/main/experiments/positive_control_v1/RESULTS.md)         | Finds a planted loyalty?                  | 16/16; name only 16/16; difference 14/16   | A name being mentioned    |
| [v2, 24 Sep – 5 Oct 2026](https://github.com/Edimah/secret-loyalties/blob/main/experiments/positive_control_v2/RESULTS.md) | Agrees with a claimed fine-tuned loyalty? | Miss (p = 0.113); scale-adjusted p = 0.002 | Change of scale           |

## Lesson and limits

Scoring outputs needs careful experimental design, and even then a signal is hard to read: a preference for names, a mention, or a change of scale can all look like secret loyalties. Our experiments have limits: 16 pairs is few; an instruction is the easiest loyalty to plant; v2 is one claimed loyalty in one model. The false-alarm rate of the loyal-minus-name-only test is still unmeasured; a measurement study is designed in the repo but not yet run.

So, can we detect evidence of secret loyalty in a model, using only its answers? Not yet, much is missing. Our framework categorises unrelated but systematic effects (a taste for some names, a mention, a change of scale) as loyalty. A more specific feature, specific to the presence of secret loyalties, would be better to test against and reduce false positives.

## Credits and links

Built with Alexandra RANDRIANANDRASANA (decision layer: questions, rewordings, the discovery/confirmation split) at the Apart Research × Formation Research hackathon, 24–26 July 2026; I built the measurement code. This project was carried out with heavy assistance from Claude, the agent generated the code and acted as an assistant and fact checker.

Code and results: [github.com/Edimah/secret-loyalties](https://github.com/Edimah/secret-loyalties) · [Apart project page](https://apartresearch.com/project/a-calibrated-twolevel-detector-for-secret-loyalties-g75x)

## References

1. Kwon et al. (2026). _AIs with Secret Loyalties are a Serious but Addressable Threat_. Formation Research whitepaper. <https://www.formationresearch.com/secret-loyalties-whitepaper.pdf>
2. Kwon et al. (2026). _A Research Agenda for Secret Loyalties_. LessWrong. <https://www.lesswrong.com/posts/ugBoeexGYvNLxZKA7/a-research-agenda-for-secret-loyalties>
3. Lamerton & Roger (2026). _Narrow Secret Loyalty Dodges Black-Box Audits_. arXiv:2605.06846. <https://arxiv.org/abs/2605.06846>
4. Miller (2024). _Adding Error Bars to Evals: A Statistical Approach to Language Model Evaluations_. arXiv:2411.00640. <https://arxiv.org/abs/2411.00640>
5. Good (2005). _Permutation, Parametric, and Bootstrap Tests of Hypotheses_, 3rd ed. Springer. <https://doi.org/10.1007/b138696>
6. Kudriashov (2026). _Black-box loyalty identification as statistical inference: An Audit of Three Secretly-Loyal Model Organisms_. Apart Research, Secret Loyalties Hackathon, first place. <https://apartresearch.com/project/blackbox-loyalty-identification-as-statistical-inference-an-audit-of-three-secretlyloyal-model-organisms-k6ky>
7. Choudhary & Pundir (2026). _Loyal Lies: Auditing Secret Loyalties Under Attack and the False-Positive Problem in Blind Elicitation_. Apart Research, Secret Loyalties Hackathon, fifth place. <https://apartresearch.com/project/loyal-lies-auditing-secret-loyalties-under-attack-and-the-falsepositive-problem-in-blind-elicitation-ezwb>
