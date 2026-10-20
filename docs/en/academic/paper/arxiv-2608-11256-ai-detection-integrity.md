# Why AI Detection Fails for Academic Integrity

DOI: 10.1145/3806096.3844871Conference: ACM AI Summit 2026; August 31-September 02, 2026; Atlanta, GA, USAACM AI Summit 2026 (AI Summit ’26), August 31-September 02, 2026, Atlanta, GA, USAISBN: 979-8-4007-2638-5/2026/08CCS: Applied computing EducationCCS: Computing methodologies Natural language processingCCS: Computing methodologies Artificial intelligenceCCS: Security and privacy Human and societal aspects of security and privacy

Jonathan A. Karr Jr  Note: These authors contributed equally to this research.  Affiliation: University of Notre Dame, Notre Dame, Indiana, USA  ,  Grigorii Khvatskii  Affiliation: University of Notre Dame, Notre Dame, Indiana, USA  ,  Ting Hua  Affiliation: University of Notre Dame, Notre Dame, Indiana, USA   and  Nitesh V. Chawla  Affiliation: University of Notre Dame, Notre Dame, Indiana, USA

2026

###### Abstract.

Institutions use commercial AI detectors for academic integrity, yet detectors cannot distinguish AI editing from full LLM drafts and may treat both as misconduct. In a controlled study of published English abstracts (four domains; 2013 to 2015 vs. 2023 to 2025), we quantify this policy failure under proxy human/AI labels at τ=0.50. Light refine (abstract only) edits, a proxy for guideline-compliant AI assistance, are flagged at 38 to 80%. Unmodified 2023 to 2025 originals are flagged at 9 to 15%, with non-STEM rates far above STEM (p<0.001); elevated scores track long-token and Academic Word List density, not authorship intent alone. After Undetectable AI humanization, evasion is near-total: fewer than 4% of AI-labeled rewrites remain flagged (post-humanization detection rate <4%; FNR >96%). Honest AI-editing results in a higher sanction risk than humanizer-assisted evasion. Therefore, detector scores should not serve as standalone misconduct evidence.

###### Keywords:

AI detection, academic integrity, AI-assisted writing, humanization, LLMs, education

††cc-license: by††footnotetext: Code: https://github.com/JonathanKarr33/ai_humanization_and_detection_evaluation

## 1. Introduction

Consider two students submitting an essay or research paper. One author creates the claims, but uses LLMs to refine their language. The other student uses the LLM to produce the full draft with no original analysis. At τ=0.50, commercial detectors often flag both at high rates. Yet they reflect different relationships to the work. Do they deserve the same outcome?

LLMs have raised concerns about synthetic text in academia Kasneci et al., 2023; Cotton et al., 2024; Perkins, 2023, and institutions increasingly deploy AI detectors Yan et al., 2023; Wang, 2023. Vendors report high benchmark accuracy Spero, 2025; Adam, 2026, but independent studies find substantial false positives and false negatives Dik and Erdem, 2025; Elazar and Antoniak, 2026.

Those errors are not limited to texts possibly contaminated with LLM outputs. On pre-LLM-era (2013–2015) original abstracts, Pangram and GPTZero incur 0% proxy FPR at τ=0.50 (Table 2). On 2023–2025 originals, the same threshold yields 14.9% (Pangram) and 8.9% (GPTZero) flag rates(not confirmed false positives, because unobserved AI assistance is possible) with non-STEM rates far above STEM (p<0.001). Detectors therefore behave unevenly across scholarly domains even on peer-reviewed abstract prose.

Detectors do not separate fully AI-generated from AI-assisted prose in one score Spero, 2025; GPTZero, 2026; Pratama, 2025. At the same time, the growing market for humanizers, software designed to evade AI detectors, adds another potential source for detection errors Wallwork, 2025. Furthermore, English-language learners may legitimately use AI for translation, clarity, or academic polish while retaining intellectual ownership Zhang et al., 2023, yet such edits can elevate detector scores. These facts together create a tension where people using AI in legitimate ways to present their ideas are punished by AI detection pipelines, but people willing to cheat by using AI in combination with a humanizer are not. To analyze this tension, we ask three policy-oriented research questions focused on detection errors, not vendor benchmarking:

Figure 1. AI Detection PipelinePipeline diagram connecting OpenAlex research abstracts, three Gemini rewrite conditions, Undetectable AI humanization, Pangram and GPTZero detection, and output analysis. The rewrite conditions use the abstract alone, the abstract with the article, or the article alone.

RQ1:

Under proxy ground-truth labels, what are the false-positive and false-negative rates of commercial detectors, and how do they vary by domain, time period, and rewrite condition?

RQ2:

Which surface linguistic features of academic abstracts are associated with elevated detector scores (and thus higher false-positive risk on human writing)?

RQ3:

How does humanization change false-negative rates on AI-generated text?

Prior work has documented detector unreliability Dik and Erdem, 2025, including cases in which polishing abstracts are misclassified as full rewrites Geng and Poibeau, 2025. We extend this literature with a unified error-analysis framework: proxy-labeled positives/negatives, permutation-based inference, and interpretable text-feature correlates across domains and time windows. Findings are intended to inform policy on published abstract proxies.

## 2. Methodology

We describe our corpus and detection pipeline and define how we operationalize detector error rates and the accompanying statistical analyses. In short, we score original and LLM-rewritten abstracts across four domains and two time periods with two commercial detectors, before and after humanization.

### 2.1. Corpus and Pipeline

We sampled English abstracts from OpenAlex Priem et al., 2022 in chemistry, computer science, political science, and theology (100 per domain-time bucket before filtering) for 2013 to 2015 and 2023 to 2025. The earlier window provides a pre-LLM-era reference for proxy FPR on original abstracts; the later window reports flag rates when LLM-assisted writing is plausible but unobserved in our labels Liang et al., 2024; Kobak et al., 2025; Geng and Poibeau, 2025. After requiring 25 to 500 words and PDF access (≈20% loss), we retained 642 abstracts. Each contributed an original abstract plus three Gemini 3 Flash rewrites via OpenRouter OpenRouter, 2026: refine (abstract only), refine (abstract + article), and new (article only). We scored all variants with Pangram 3.2 and GPTZero Emi and Spero, 2024; Adam, 2026 (s∈[0,1]) and an LLM-assisted baseline (GPT-5 Nano). We then humanized all variants with Undetectable AI v11 (Balanced/Doctorate/Article) and re-scored outputs (Fig. 1).

STEM versus non-STEM tests pool chemistry with computer science and political science with theology. Table 1 lists retained abstracts per domain-time bucket. The three rewrite conditions hold the generator fixed: refine (abstract only) receives only the abstract, refine (abstract + article) also receives the article for context, and new (article only) writes a fresh abstract from the article body. Both refine prompts request rewriting to improve the prose and make it sound more human-like, with at least some changes. They do not restrict edits to grammar correction. The new-abstract prompt requests natural prose without copying the article verbatim. Pangram and GPTZero use the same threshold, τ=0.50 (sensitivity in Table 6).

Table 1. Retained abstracts by domain after filtering (N=642). Pangram and GPTZero cover all papers.Counts of retained abstracts in chemistry, computer science, political science, and theology for 2013–2015 and 2023–2025. The two periods contain 306 and 336 abstracts, respectively, for a total of 642.

### 2.2. Error Rates and Analysis

With τ=0.50 and y^i=𝕀{si≥τ}, we assign proxy human labels to originals and proxy AI labels to LLM outputs, defining FPi=𝕀{yi=human∧y^i=1} and FNi=𝕀{yi=AI∧y^i=0}. We report FNR on LLM-labeled variants and proxy FPR on 2013 to 2015 original abstracts. For 2023 to 2025 originals, we report flag rate, because unobserved AI assistance prevents interpreting positives as confirmed false positives.

We also report AI-assisted false-positive risk: the fraction of refine (abstract only) outputs flagged under proxy human-source labels (Table 3). This assisted-writing flag rate equals 1−FNR under proxy AI labels for the same texts; it is not FPR on unmodified human writing. Whether this assistance is permitted depends on institutional rules. Our prompt models generative rewriting, not verified grammar-only assistance. The policy comparison with humanized rewrites therefore spans different interpretations of authorship, rather than one misconduct confusion matrix.

Group comparisons use two-sided permutation tests on mean score differences (5,000 iterations; seed 42). Long-token ratio counts tokens with at least 10 characters. Academic Word List (AWL) density matches normalized tokens to Coxhead’s 570 headwords by Porter stemming Coxhead, 2000; type-token ratio divides unique case-folded tokens by all tokens. Numeric and non-alphabetic shares count tokens containing digits and non-letters, respectively; acronym density counts uppercase tokens of at least two characters. We report Spearman ρ with Benjamini-Hochberg FDR within each collection and domain-centered associations. Length-adjusted correlations residualize features and scores on log(1+word count); word count uses whitespace splitting.

## 3. Results

We organize our findings around the three research questions, reporting proxy-labeled error rates (RQ1), the linguistic correlates of detector scores (RQ2), and the effects of humanization on detector behavior and agreement (RQ3). Across all three, detectors prove sensitive to stylistic cues and are readily defeated by humanizers, leading to high FNR and low inter-detector agreement.

Table 2. Proxy-labeled error rates at τ=0.50. For original abstracts, 2013 to 2015 reports proxy FPR; 2023 to 2025 reports flag rate.Rows compare Pangram, GPTZero, and an LLM-assisted baseline in two periods; columns report original false-positive or flag rates and rewrite false-negative rates before and after humanization. After humanization, false-negative rates reach 96.0–98.5 percent for the commercial detectors, compared with 19.7–30.5 percent for the baseline.

Table 2 summarizes error rates at τ=0.50. Under proxy labels, 2013 to 2015 originals incur FPR =0%; in 2023 to 2025, original flag rates are 14.9% (Pangram) and 8.9% (GPTZero), not interpretable as confirmed false positives because published abstracts may already include LLM assistance. Non-STEM flag rates exceed STEM (p<0.001; Table 5). Refine (abstract only) flag rates equal 1−FNR in Table 4 (same scores, opposite proxy labels; Section 2.2): Pangram 64.4% (2013–15) and 80.1% (2023–25); GPTZero 37.6% and 48.5%. After humanization, fewer than 4% of AI-labeled rewrites remain detectable for AI detectors (FNR >96%). The asymmetry is policy-critical: guideline-compliant editing triggers high flag rates, while humanizer evasion drops detection on synthetic text to near zero; honest editing currently faces more sanction risk than malicious evasion.

Table 3. AI-assisted false-positive risk: pre-humanization flag rates on refine (abstract only) outputs under proxy human-source labels at τ=0.50. These are not FPR on unmodified originals.Flag rates on abstract-only refinements rise from 64.4 to 80.1 percent for Pangram and from 37.6 to 48.5 percent for GPTZero between the earlier and later periods. These rates concern rewritten human-source texts, not false positives on unmodified originals.

Table 3 reports this proxy AI-assisted false-positive risk directly: 64–80% for Pangram and 38–49% for GPTZero. Table 4 decomposes pre-humanization FNR by rewrite condition. Lighter edits retain the highest FNR, especially on GPTZero; new (article only) rewrites already exceed τ for most Pangram scores (2.6 to 2.7% FNR). The LLM-assisted baseline flags 70.8% of 2023 to 2025 originals and is treated as supplementary only.

Table 4. Pre-humanization FNR by rewrite condition at τ=0.50.False-negative rates before humanization are listed by period, rewrite condition, and detector. Abstract-only refinement has the highest false-negative rates; new abstracts generated from articles have the lowest, at 2.6–2.7 percent for Pangram and 14.9–15.7 percent for GPTZero.

Table 5. Domain-level flag rates in 2023 to 2025 (Pangram / GPTZero).Each domain row gives original and abstract-only refinement flag rates, with Pangram followed by GPTZero, and the number of abstracts. Chemistry has the lowest original flag rates, while political science and theology have higher original and refinement flag rates than either STEM domain.

Flag rates on 2023 to 2025 originals vary sharply by domain at the same τ (Table 5): Pangram flags 2.1% in chemistry versus 26.6% in theology; GPTZero shows the same ordering (1.1% to 15.2%). Vendor marketing claims sub-1% false-positive rates on benchmark evaluations Spero, 2025; GPTZero, 2026; our corpus flags 9 to 15% of recent original abstracts and, on light edits, 80% (Pangram) / 49% (GPTZero) in 2023–25 and 64% / 38% in 2013–15 (flag rate =1−FNR in Table 4; Table 6). Figure 2 plots assisted-editing ROC on 2013 to 2015 abstracts (0% original FPR at τ=0.50). Pangram reaches AUC-ROC 0.98 versus GPTZero 0.92; at τ=0.50 Pangram flags 64% of light edits with no originals flagged, whereas GPTZero flags 38%. Figure 3 replicates the task on 2023 to 2025: original-axis rates are flag rates (15% and 9%), Pangram AUC-ROC is 0.91, and 80% of light edits are flagged at τ=0.50.

Figure 2. Assisted-editing ROC (2013-2015): original vs. refine (abstract only); τ=0.50ROC curves plot the true-positive rate on abstract-only refinements against the false-positive rate on 2013–2015 originals. Pangram, GPTZero, and the LLM-assisted baseline have areas under the curve of 0.98, 0.92, and 0.64; circles mark the threshold of 0.50, and a dashed diagonal denotes chance discrimination.

Figure 3. Assisted-editing ROC/PR (2023-2025, pre-humanization). Original-axis rates are flag rates, not proxy FPR.Two panels compare Pangram, GPTZero, and the LLM-assisted baseline on 2023–2025 abstract-only refinements: ROC curves on the left and precision-recall curves on the right. The ROC horizontal axis reports flags on originals with unknown AI-use histories; Pangram has the highest ROC area, and circles mark the threshold of 0.50.

Figure 4 extends the threshold sweep to 0.3–0.7 for both detectors. It shows original and assisted-writing flag rates alongside FNR on all three LLM rewrite conditions; flags on recent originals are not confirmed false positives. No threshold τ∈{0.4,0.5,0.6} simultaneously keeps original flag rates, refine capture, and AI-pool FNR low (Table 6): Pangram holds ≈15% original flags and ≈80% refine flags across that band, while raising τ from 0.4 to 0.6 slightly increases FNR on AI-labeled rewrites (10.5% to 13.8%).

Table 6. Threshold sensitivity (2023-2025, pre-humanization).Rows compare thresholds of 0.4, 0.5, and 0.6 for Pangram and GPTZero; columns give original flag rates, pooled rewrite false-negative rates, and abstract-only refinement flag rates. Higher thresholds reduce flag rates and increase false-negative rates, with little change between 0.5 and 0.6.

Figure 4. Threshold trade-off (2023 to 2025, pre-humanization). Three policy rates vs. τ for Pangram (left) and GPTZero (right). Dotted vertical line: τ=0.50.Pangram and GPTZero panels plot percentage rates against thresholds from 0.3 to 0.7. Circles denote original flag rates, squares denote abstract-only refinement flag rates, and dashed lines with triangles denote pooled rewrite false-negative rates; increasing the threshold lowers flags and raises misses, with dotted vertical lines marking 0.50.

### 3.1. Linguistic Correlates

Long-token and AWL ratios correlate positively with 2023 to 2025 scores (ρ≈0.30 to 0.35; p<0.001); numeric and non-alphabetic ratios correlate negatively (Table 7). After centering within domain, long-token and AWL associations strengthen for Pangram (r>0.41). After adjustment for length, AWL correlations remain positive (Pangram/GPTZero: 0.337/0.261), as do long-token correlations (0.321/0.276). Length alone therefore does not account for these associations. These analyses pool originals and rewrites; they do not isolate associations within unmodified human writing or establish causal effects.

Table 7. Strongest score-feature associations (2023 to 2025, pre-humanization; Spearman ρ, both detectors p<0.001).Spearman correlations between four text features and detector scores are reported for Pangram and GPTZero. Academic Word List density and long-token ratio have positive correlations of 0.304–0.346, while numeric and non-alphabetic token ratios have negative correlations of -0.146 to -0.197.

### 3.2. Humanization and Detector Agreement

Post-humanization Pangram means fall to 0.03 to 0.04 across conditions in 2023 to 2025, alongside the high FNR in Table 2. Pangram and GPTZero agree moderately before humanization but weakly afterward (Table 8). Across n=2,568 humanized pairs, long-token ratio, AWL density, and lexical diversity fall (p<0.001; Table 9). These changes are consistent with reduced use of features associated with higher scores, but do not establish how the proprietary humanizer achieves evasion.

Table 8. Pangram and GPTZero agreement (n=1,224 pairs in 2013–15; n=1,344 in 2023–25).Spearman score correlations and Cohen's kappa compare Pangram with GPTZero before and after humanization in both periods. Spearman correlations fall from 0.721–0.736 to 0.100–0.188, and kappa falls from 0.500–0.539 to 0.200–0.221.

Table 9. Pooled linguistic shifts after Undetectable AI v11 humanization (n=2,568 pairs).Mean values before and after humanization, paired changes, and permutation-test p-values are listed for four features across 2,568 pairs. Long-token ratio, Academic Word List density, and type-token ratio decrease, while mean word count rises from 180 to 229; all reported p-values are below 0.001.

## 4. Discussion

Before humanization, detectors can distinguish LLM-modified abstracts from originals, especially Pangram (AUC-ROC 0.98 in 2013–2015 and 0.91 in 2023–2025). This sensitivity concerns traces of model intervention in the wording, not ownership of the ideas. Both abstract-only refinement and generation from an article frequently trigger flags, despite different model inputs and writing tasks. These scores alone cannot reconstruct the edits or quantify how much of the ideas, original analysis, or effort belongs to the author rather than the model; our experiment does not measure those contributions. If used at all, detectors should be one input to a broader review of drafts, revision histories, disclosed AI use, and the author’s explanation of the work.

Detector errors are structured, not random: long-token and AWL density track higher scores in non-STEM prose, while symbol-heavy STEM text scores lower even on AI-assisted rewrites. Under proxy labels, compliant editing triggers flags while humanization drives detection on AI-labeled text below 4%. Institutions therefore face a catch-22: prohibit all AI-assisted editing and deny legitimate support to multilingual and novice writers, or enforce with tools that punish acceptable use and miss evasion at scale Wallwork, 2025; Sun et al., 2026. Uniform detector policies may also raise differential-impact concerns when flag rates differ by discipline Zdravkova and Ilijoski, 2024.

#### Practice

These patterns create concrete educational risk: students may be flagged while drafting their own ideas and using AI only for clarity or grammar, yet others who generate inorganic drafts can evade detection after humanization. Multilingual learners face additional harm when AI-assisted translation or editing elevates scores on the student’s own work Zhang et al., 2023. Detector output must be treated as weak evidence, not default misconduct evidence. Any flag must be paired with drafting history and sanctions shall be reserved for cases where human judgment supports a lack of appropriate student effort. Expect higher rates in non-STEM prose. Finally, FERPA/GDPR guidelines must be followed before uploading students’ confidential work to third-party services Quinnipiac Innovations in Learning and Teaching (QILT), n.d..

#### Limitations

We analyze 642 English published abstracts, not student essays, and do not evaluate translation, groups of multilingual writers, or actual sanctions. Labels are proxies; recent originals have unknown AI-use histories, and refine outputs are not verified grammar-only edits. We used one rewrite generator (Gemini 3 Flash), two commercial detectors (Pangram 3.2, GPTZero), one humanizer configuration (Undetectable AI v11), and one LLM-assisted baseline. Results may differ across genres, languages, models, and service versions. Feature associations are correlational. We did not assess whether rewriting or humanization preserved scientific meaning; low detector scores alone do not establish output quality.

## 5. Conclusion

Commercial detectors on published abstracts punish acceptable AI-assisted editing, compound risk for English-language learners who use AI for translation, and fail to catch humanized synthetic text. Light edits are flagged at 64–80% by Pangram and 38–49% by GPTZero. After humanization, more than 96% of AI-labeled rewrites evade Pangram and GPTZero. Together, these results define an integrity catch-22: high detector flags on assisted writing alongside near-total misses after humanization. Integrity programs therefore need transparent AI-use norms and process evidence, not standalone detector scores.

###### Acknowledgements.

We would like to thank Pangram for the use of their API, as well as Notre Dame Teaching & Learning, and the Notre Dame AI Council.

## References

- Adam (2026) A. Adam GPTZero ai detection benchmarking: the industry standard in accuracy, transparency and fairness. External Links: Link Cited by: §E.1, Table 13, §1, §2.1.
- Cotton et al. (2024) D. R. Cotton, P. A. Cotton, and J. R. Shipway Chatting and cheating: ensuring academic integrity in the era of chatgpt. Innovations in education and teaching international 61 (2), pp. 228–239. Cited by: §1.
- Coxhead (2000) A. Coxhead A new academic word list. TESOL quarterly 34 (2), pp. 213–238. Cited by: Appendix F, §2.2.
- Dik and Erdem (2025) S. Dik and O. Erdem Assessing gpt-zero’s accuracy in identifying ai vs. human-written essays. Proceedings of International Mathematical Sciences 7 (2), pp. 54–58. Cited by: §1, §1.
- Elazar and Antoniak (2026) Y. Elazar and M. Antoniak LLM-generated or human-written? comparing review and non-review papers on arxiv. arXiv preprint arXiv:2601.17036. Cited by: §1.
- Emi and Spero (2024) B. Emi and M. Spero Technical report on the pangram ai-generated text classifier. arXiv preprint arXiv:2402.14873. Cited by: §2.1.
- Geng and Poibeau (2025) M. Geng and T. Poibeau What are we detecting, really? llm-generated text detection remains an unsolved problem. Cited by: §1, §2.1.
- GPTZero (2026) GPTZero GPTZero ai detection benchmarking: the industry standard in accuracy, transparency and fairness. External Links: Link Cited by: §E.1, §E.2, Table 13, Table 13, §1, §3.
- Kasneci et al. (2023) E. Kasneci, K. Seßler, S. Küchemann, M. Bannert, D. Dementieva, F. Fischer, U. Gasser, G. Groh, S. Günnemann, E. Hüllermeier, et al. ChatGPT for good? on opportunities and challenges of large language models for education. Learning and individual differences 103, pp. 102274. Cited by: §1.
- Kobak et al. (2025) D. Kobak, R. González-Márquez, E. Horvát, and J. Lause Delving into llm-assisted writing in biomedical publications through excess vocabulary. Science Advances 11 (27), pp. eadt3813. Cited by: §2.1.
- Liang et al. (2024) W. Liang, Z. Izzo, Y. Zhang, H. Lepp, H. Cao, X. Zhao, L. Chen, H. Ye, S. Liu, Z. Huang, et al. Monitoring ai-modified content at scale: a case study on the impact of chatgpt on ai conference peer reviews. arXiv preprint arXiv:2403.07183. Cited by: §2.1.
- OpenRouter (2026) OpenRouter OpenRouter: the unified interface for llms. External Links: Link Cited by: §2.1.
- Perkins (2023) M. Perkins Academic integrity considerations of ai large language models in the post-pandemic era: chatgpt and beyond. Journal of University Teaching and Learning Practice 20 (2), pp. 1–24. Cited by: §1.
- Pratama (2025) A. R. Pratama The accuracy-bias trade-offs in ai text detection tools and their impact on fairness in scholarly publication. PeerJ Computer Science 11, pp. e2953. Cited by: §E.2, Table 13, §1.
- Priem et al. (2022) J. Priem, H. Piwowar, and R. Orr OpenAlex: a fully-open index of scholarly works, authors, venues, institutions, and concepts. arXiv preprint arXiv:2205.01833. Cited by: §2.1.
- Quinnipiac Innovations in Learning and Teaching (QILT) (n.d.) Quinnipiac Innovations in Learning and Teaching (QILT)Academic integrity and ai detectors(Website) External Links: Link Cited by: §4.
- Spero (2025) M. SperoIntroducing pangram 3.0 with ai assistance detection(Website) External Links: Link Cited by: §E.1, §E.2, Table 13, Table 13, §1, §1, §3.
- Sun et al. (2026) Y. Sun, Y. Liao, and X. Ma Trusting ai to detect ai? a systematic evaluation of the reliability and robustness of current aigc detection tools for student academic work. Computers & Education, pp. 105616. Cited by: §4.
- Undetectable AI (2026a) Undetectable AIHome page(Website) External Links: Link Cited by: §E.3, Table 13.
- Undetectable AI (2026b) Undetectable AI Pricing. External Links: Link Cited by: §E.3, Table 13.
- Wallwork (2025) A. Wallwork AI detectors and humanizers. In The Pros and Cons of Using Chatbots, pp. 115–133. Cited by: §E.3, §1, §4.
- Wang (2023) Y. Wang Synthetic realities in the digital age: navigating the opportunities and challenges of ai-generated content. Authorea Preprints. Cited by: §1.
- Yan et al. (2023) D. Yan, M. Fauss, J. Hao, and W. Cui Detection of ai-generated essays in writing assessments. Psychological Test and Assessment Modeling 65 (1), pp. 125–144. Cited by: §1.
- Zdravkova and Ilijoski (2024) K. Zdravkova and B. Ilijoski Preventing academic dishonesty originating from large language models. In Balkan Conference in Informatics, pp. 118–132. Cited by: §4.
- Zhang et al. (2023) X. Zhang, S. Li, B. Hauer, N. Shi, and G. Kondrak Don’t trust chatgpt when your question is not in english: a study of multilingual abilities and types of llms. In Proceedings of the 2023 Conference on Empirical Methods in Natural Language Processing, pp. 7915–7927. Cited by: §1, §4.

## Appendix A Limitations

Language and corpus setting: Our dataset is limited to English. We do not evaluate AI detection or humanization for other languages, so our findings should not be extrapolated to multilingual classrooms or non-English scholarly writing without further study. We analyze published research abstracts drawn from four OpenAlex domains (chemistry, computer science, political science, and theology), not student essays or other classroom genres. Detector behavior on shorter, pedagogically shaped student writing may differ from the abstract-length prose studied here.

Labels and measurement: Ground truth is experimental rather than adjudicated. We treat unmodified original abstracts as proxy human writing and LLM rewrites as proxy AI writing. For 2023 to 2025 originals, real-world AI assistance is unobserved, so detector positives on those texts are flag rates, not confirmed false positives. All reported false-positive and false-negative rates depend on this labeling scheme and on a fixed score threshold (τ=0.50). Text-feature associations are correlational and do not establish causal mechanisms.

Models, detectors, and humanization: We used one rewrite generator (Gemini 3 Flash), two commercial API detectors (Pangram 3.2 and GPTZero), one humanizer configuration (Undetectable AI v11), and one supplementary LLM-assisted baseline (GPT-5 Nano). Results may not generalize to other models, detector versions, humanizers, or prompting strategies. Post-humanization evasion claims in the main text concern Pangram and GPTZero. The LLM-assisted baseline was also scored after humanization (Table 2) but remains supplementary: it still flags most humanized rewrites (post-humanization FNR 30.5% and 19.7%).

Corpus size and cost: We targeted 800 abstracts (100 per domain-time bucket) and retained 642 after length and PDF filtering. Corpus size is constrained by the cost of large-scale API detection and paid humanization. Each retained paper requires multiple rewrite calls, pre-detection passes across three scorers, one humanization credit per variant, and post-detection with the same three scorers: Pangram, GPTZero, and the LLM-assisted baseline. A multi-model rewrite sweep would multiply those costs without changing the core error-analysis design.

Future work: Future studies could expand to non-English corpora and to adjudicated student writing with verified authorship and AI-use histories. Developing local or open models for rewriting, detection, and humanization could reduce reliance on paid APIs and enable larger, more diverse datasets. Such systems would need careful validation before use in high-stakes integrity workflows, but they offer a path toward reproducible benchmarks at scales that are impractical under current commercial pricing. An open question is whether prose shaped by frontier models (or by newer assistance tools) systematically elevates commercial detector scores and therefore false-positive risk on human writing relative to earlier LLM generations; our 2023 to 2025 window cannot separate model vintage from unobserved real-world AI use on original abstracts, but targeted comparisons across model families on controlled human-authored drafts would clarify that risk.

## Appendix B Dual interpretation of light editing

Reviewers and integrity offices need a clear account of why refine (abstract only) appears in two rate families.

For each source paper we generate a Gemini 3 Flash rewrite that edits only the abstract. Detector score s and flag y^=𝕀{s≥τ} are identical regardless of interpretation.

#### Reading A: proxy-AI labeling.

Label y=AI. Then FN=𝕀{y^=0} and FNR is the miss rate among AI-labeled rewrites. This reading supports detection-evaluation claims (can the tool catch LLM text?).

#### Reading B: human-source / assistance.

Label the intellectual source as human and treat the LLM as a polish tool. Then the quantity of interest is the assisted-writing flag rate P(y^=1∣refine abs. only). This reading supports policy claims about sanction risk for authors who retain ownership of claims. It is not proxy FPR on unmodified human text, and it must not be abbreviated as FPR in tables or prose.

#### Why the rates are not comparable as ordinary errors:

FNR under Reading A and assisted-writing flag rate under Reading B use opposite label assignments for the same texts. Comparing Pangram’s 64–80% light-edit flag rates to >96% false negatives as if they were cells of one confusion matrix would be a category error. We therefore report both quantities, name them differently, and interpret the integrity catch-22 as a policy asymmetry across readings, not as a single-threshold accuracy summary.

#### Relationship to institutional rules:

Policies that ban all generative AI would treat Reading A as decisive. Policies that allow grammar/clarity assistance but ban ghostwriting sit between the readings and require process evidence our detectors do not observe. Our refine prompt is closer to light generative rewriting than to grammar-only editing; assisted-writing flag rates should be read accordingly.

## Appendix C Paper-clustered inference

Each source paper contributes an original abstract and three rewrite conditions. Permutation tests and bootstrap intervals that resample instances can understate uncertainty when within-paper dependence is ignored. Therefore, we report analyses that resample at the paper_id level (2,000 bootstrap replicates or 5,000 permutations; seed 42; τ=0.50).

Error and flag rates: Table 10 shows paper-clustered 95% intervals. Point estimates match the main text (e.g., 2023 to 2025 pre-humanization Pangram original flag rate 14.9% [11.0,18.8]; refine assisted-writing flag rate 80.1% [75.9,84.5]; AI-pool FNR 13.5% [11.0,16.0]; post-humanization AI-pool FNR 96.6% [95.2,97.8]). Clustering widens intervals relative to naive instance bootstrap but does not change substantive conclusions.

STEM vs. non-STEM: Table 11 uses one original-abstract score per paper. In 2023 to 2025, non-STEM flag rates remain far above STEM (Pangram 25.3% vs. 5.6%; GPTZero 15.2% vs. 3.4%; paper-label permutation p=0.0002 for both detectors).

Feature associations: Table 12 retains instance-level Spearman ρ (matching Table 7) but forms CIs by resampling papers. Long-token and AWL associations remain positive with intervals excluding zero for both detectors (e.g., Pangram AWL ρ=0.346 [0.298,0.395]). Paper-averaged ρ is attenuated because averaging mixes originals and rewrites within paper; we report it for transparency, not as a replacement for the instance-level estimand.

Table 10. Paper-clustered bootstrap intervals (nboot=2,000; seed 42) at τ=0.50.

Table 11. STEM vs. non-STEM on original abstracts.

Table 12. Text-feature associations (2023 to 2025, pre-humanization).

## Appendix D Abstract Rewriting Prompts

We provide the prompts used to instruct the model for abstract rewriting.

Prompt used for the Refine (abstract only) setting: You are an expert scientist who excels in writing papers. Your task is to rewrite a given paper abstract to sound better and more human-like. The abstract will be given in the next message. Please only return the rewritten text, do not return any instructions or anything like that. Only return the rewritten text. Make sure to make at least some edits or changes to the text.

Prompt used for the Refine (abstract + article) setting: You are an expert scientist who excels in writing papers. Your task is to rewrite a given paper abstract to sound better and more human-like, using the full text of the paper to inform your rewriting. The abstract and text will be given in the next message. Please only return the rewritten text, do not return any instructions or anything like that. Only return the rewritten text. Make sure to make at least some edits or changes to the text.

Prompt used for the New (article only) setting: You are an expert scientist who excels in writing papers. Your task is to write a naturally sounding abstract for a paper that will be given to you. The full will be given in the next message. Please only return the written abstract, do not return any instructions or anything like that. Only return the written text. Make sure to not copy the text of the paper verbatim.

## Appendix E Vendor marketing claims

We record the commercial claims that motivate academic-integrity adoption of AI detectors and humanizers. Table 13 organizes them in the same order as our framing: headline detector accuracy, claims about AI-assisted versus fully generated writing, and humanizer evasion guarantees. All figures come from vendor marketing or vendor-run benchmarks (accessed December 2025 to May 2026), not from our corpus.

### E.1. Headline detector accuracy

Vendors advertise near-perfect detection on benchmark-style evaluations. Pangram’s Pangram 3.0 announcement reports 99.98% accuracy on AI-generated text with near-zero false positives on the fully AI-generated label Spero, 2025. GPTZero’s peer-reviewed detector paper reports 99.39% accuracy on its multi-domain evaluation (Table 2 aggregate for GPTZero 4.1b) Adam, 2026. GPTZero’s public benchmarking post additionally claims 99.76% average accuracy with 0.08% false-positive rate across four commercial domains GPTZero, 2026.

### E.2. AI-assisted versus fully generated writing

A separate set of claims concerns whether detectors can separate light editing from full synthesis. Pangram 3.0 markets explicit classes (fully human, lightly AI-assisted, moderately AI-assisted, fully AI-generated) Spero, 2025. GPTZero describes multiclass outputs that separate human text, mixed or lightly edited text, and pure AI GPTZero, 2026. Independent work notes that accuracy-bias trade-offs and binarization choices can obscure assisted-writing risk Pratama, 2025.

### E.3. Humanizer evasion guarantees

Detector adoption has spurred humanizers that target surface metrics such as perplexity and burstiness Wallwork, 2025. Undetectable AI’s pricing page states a money-back guarantee: if humanized output is flagged as not human, the humanization cost is refunded Undetectable AI, 2026b. Its marketing site also advertises 99%+ detector accuracy, a Forbes “#1 Best AI Detector” rating (2024), and more than 22 million users as of March 2026 Undetectable AI, 2026a.

Vendor

Claim type

Stated claim

Source

Pangram

Accuracy

99.98% accuracy on AI-generated text; near-zero false positives on the AI-generated label.

GPTZero

Accuracy

99.39% accuracy on multi-domain detector evaluation (GPTZero 4.1b).

GPTZero

Accuracy (marketing)

99.76% average accuracy; 0.08% FPR; 99.60% recall (vendor benchmark, v4.3b).

Pangram

Assisted vs. generated

Four-way taxonomy: human, light assistance, moderate assistance, fully AI-generated.

GPTZero

Assisted vs. generated

Multiclass taxonomy (human, mixed/edited, pure AI) for benchmarking.

Literature

Assisted vs. generated

Detectors face accuracy-bias trade-offs; binarized outputs can hide assisted-writing risk.

Undetectable AI

Humanizer guarantee

Money-back if humanized text is “flagged as not human.”

Undetectable AI

Marketing

99%+ detector accuracy; Forbes #1 (2024); 22M+ users (March 2026).

Table 13. Vendor claims cited in our framing (marketing and vendor benchmarks).

Contrast with our corpus: These claims are not reproduced on published English abstracts under our proxy labels at τ=0.50. Pangram and GPTZero flag 14.9% and 8.9% of 2023 to 2025 original abstracts (Table 2), inconsistent with sub-1% false-positive marketing. Refine (abstract only) outputs (human-source, light LLM edit) are flagged 64 to 80% of the time by Pangram and 38 to 49% by GPTZero; Table 4, showing that assisted-writing risk is substantial even when vendors market assistance-level detection. After Undetectable AI v11 humanization, false-negative rates on AI-labeled rewrites exceed 96% for both Pangram and GPTZero, so humanized text routinely bypasses detectors despite the refund guarantee. Domain-level dispersion (Tables 16 and 19) further shows that pooled benchmark accuracy can mask large field-to-field variance.

## Appendix F Definitions of text ratios

We compute several token-level ratios from each abstract to probe whether surface properties correlate with detector scores. Let t be the abstract text (a string). We extract an ordered token sequence T(t)=(τ1,…,τn) using the regular expression

[A-Za-z0-9][A-Za-z0-9\-\+\./]*

, and let n=|T(t)|. For convenience, we use an indicator function 𝕀{⋅} that equals 1 when its condition holds and 0 otherwise. If n=0, the ratios below are undefined.

#### Numeric token ratio.

numeric_token_ratio(t)=1n∑i=1n𝕀{∃c∈τi:c∈{0,…,9}}.

#### Non-alphabetic token ratio.

nonalpha_token_ratio(t)=1n∑i=1n𝕀{∃c∈τi:c is not a letter}.

This captures tokens that include punctuation such as hyphens, periods, slashes, or plus signs (as well as digits).

#### Long token ratio.

long_token_ratio(t)=1n∑i=1n𝕀{|τi|≥10}.

#### Acronym ratio.

acronym_ratio(t)=1n∑i=1n𝕀{τi is uppercase and |τi|≥2}.

#### AWL token ratio.

Let A be Coxhead’s Academic Word List (AWL) headwords Coxhead, 2000 (570 items). We match tokens by Porter stemming against this list: for each token τ, we form a letters-only normalization alpha(τ) by removing non-letters, then compute its Porter stem. Let S(A) be the set of Porter stems of the AWL headwords (plus a small set of US spelling variants for headwords whose Porter stems differ, e.g., analyse/analyze).

awl_token_ratio(t)=1n∑i=1n𝕀{stem(alpha(τi))∈S(A)}.

#### Type-token ratio (lexical diversity).

Let V(t)={lower(τ):τ∈T(t)} be the set of unique case-folded tokens. Then

ttr(t)=|V(t)|n.

#### Word count.

We report word counts using whitespace splitting: words(t)=|split(t)|.

#### Average words per sentence.

We split sentences by punctuation (., !, ?) and compute the average number of whitespace-delimited words per resulting sentence span.

#### Short-sentence ratio.

Using the same sentence splits, let m be the number of sentences and wj the word count of sentence j. Then

short_sentence_ratio(t)=1m∑j=1m𝕀{wj≤8}.

We use eight words as a simple fragmentation proxy in the humanization mechanism analysis.

## Appendix G Supplementary numerical results

The tables below support the main-text results by research question. Tables 14 through 19 provide pooled and domain-level Pangram summaries (pre- and post-humanization). For corpus counts see Table 1 in the main text.

### G.1. Pangram score summaries

Tables 14 and 17 pool all domains; Tables 15 through 19 decompose the same statistics by domain. SD captures score dispersion within each cell; Outliers counts scores outside 1.5×IQR fences (same rule as boxplot fliers). GPTZero and the LLM-assisted baseline follow similar orderings.

Table 14. Pangram score summaries before humanization, pooled across domains (mean, SD, [IQR]; outliers outside 1.5×IQR).

Domain variance before humanization. Pre-humanization dispersion is domain-dependent and explains the STEM/non-STEM contrasts in the main text. On original abstracts in 2023 to 2025, political science and theology show the highest means and SD (Table 16), matching elevated flag rates in Table 5; chemistry stays low on both metrics. For LLM rewrites, outliers concentrate in high-scoring conditions (refine (abstract + article), new (article only)) where the IQR sits near 1.0, while refine (abstract only) often has SD comparable across domains but wider score spread in computer science (lower quartile) than theology (tight upper quartile).

Table 15. Pangram scores before humanization by domain (2013 to 2015).

Table 16. Pangram scores before humanization by domain (2023 to 2025).

Pooled and domain summaries after humanization: After humanization, pooled means fall to ≈0.03 (Table 17), consistent with near-universal false negatives in Table 2. Residual variance remains in non-STEM domains: political science and theology still show non-zero SD and outliers on some conditions (Tables 18 and 19), indicating incomplete score collapse for a subset of abstracts rather than uniform evasion.

Table 17. Pangram score summaries after humanization, pooled across domains.

Table 18. Pangram scores after humanization by domain (2013 to 2015).

Table 19. Pangram scores after humanization by domain (2023 to 2025).

## Appendix H Full text-feature correlation results

Tables 20 and 21 report the full pre-humanization text-feature correlation results. Correlations are Spearman’s ρ between feature ratios and detector AI score. The domain-adjusted column reports correlation after centering within domain. q is the Benjamini-Hochberg FDR across the 10 tests per collection.

Table 20. Text-feature correlations (2023 to 2025 collection; n=1,344).

Table 21. Text-feature correlations (2013 to 2015 collection; n=1,224 Pangram-scored texts with features).

## Appendix I Length-partial correlations

Table 22 reports Spearman ρ between detector scores and surface features after residualizing both variables on log(1+word count) (2023 to 2025, pre-humanization).

Table 22. Length-partial Spearman ρ (2023 to 2025, pre-humanization).

## Appendix J Detector score distributions

Table 2 reports error rates at a single threshold; the figures below show the underlying score distributions in the 2023 to 2025 collection.

Pre-humanization separation (RQ1). Figure 5 plots Pangram scores by domain and rewrite condition before humanization. This figure is central to RQ1 because it makes the assisted-writing risk visible as a distributional shift: original abstracts cluster near zero, while even refine (abstract only) edits move substantial mass toward high scores - the pattern behind proxy false-positive risk on light editing. It also shows that new (article only) scores sit near certainty, explaining why false-negative rates on full-synthesis rewrites are near zero before humanization.

Figure 5. Pangram scores before humanization (2023 to 2025), by domain (rows) and rewrite condition (columns). Originals cluster low; refine (abstract only) and heavier rewrites shift right.

Post-humanization collapse (RQ3). Figure 6 uses the same layout after Undetectable humanization. Read together with Figure 5, it is the main visual evidence for RQ3: AI-labeled variants that scored near 1.0 pre-humanization collapse toward 0.0 post-humanization, which drives the >96% false-negative rates in Table 2 and shows that commercial evasion can erase detector signal at scale.

Figure 6. Pangram scores after humanization (2023 to 2025). Compare to Figure 5: high pre-humanization scores on AI-labeled variants largely disappear.

## Appendix K Robustness and threshold sensitivity

This section complements Table 2 by asking how detector behavior changes with the scoring threshold τ and whether standard precision-recall (PR) summaries align with academic-integrity policy. ROC and PR curves in the main text and in Figure 7 use 2013 to 2015 pre-humanization scores so that original abstracts can serve as negatives with interpretable proxy FPR. Figures 3 and 8 repeat the same tasks on 2023 to 2025, where original-axis rates are flag rates (unobserved real-world AI use). Threshold trade-off plots use 2023 to 2025 throughout.

### K.1. Why we do not report pooled precision-recall

A common evaluation pools original abstracts as negatives and all LLM rewrites (refine, refine with paper, and new) as positives. Under that label scheme, both Pangram and GPTZero achieve AUC-PR ≈0.96 because new (article only) outputs score near 1.0 and dominate the positive class. That number suggests excellent separability but answers the wrong question for integrity offices: policy concern is whether a detector can distinguish human drafts from light AI editing, not whether it can detect full-synthesis rewrites that already saturate the score scale. We therefore report PR only for the assisted-editing subset below, plus a threshold trade-off plot that tracks three rates institutions actually care about.

### K.2. Assisted-editing ROC and precision-recall

We restrict to paired rows on the same paper: original abstract = negative (proxy human), refine (abstract only) = positive (proxy light AI edit on human-source text). Scores are detector outputs in [0,1]; a text is flagged when s≥τ. Figure 2 in the main text shows ROC only (2013 to 2015); Figure 3 shows the matching 2023 to 2025 ROC/PR panel. Original is not its own curve. It defines the false-positive rate axis.

### K.3. ROC and PR by rewrite condition (2013 to 2015)

Figure 7 repeats the analysis for each rewrite type against the same pre-LLM-era originals: refine (abstract only), refine (abstract + article), and new (article only), plus a dashed pooled AI curve (all three LLM conditions as positives). AUC-PR is high (0.93-1.00) because Gemini rewrites separate cleanly from unflagged originals at τ=0.50; this is a best-case separability benchmark, not current flagging exposure.

Figure 7. ROC and precision-recall by rewrite condition vs. original (2013 to 2015, pre-humanization). Four curves per panel: three single-condition tasks (solid) and pooled all LLM rewrites (dashed). Rows: Pangram and GPTZero. Markers: τ=0.50.

### K.4. 2023 to 2025 replication (flag rate on originals)

On recent abstracts, positives on the original axis are flag rates, not confirmed false positives. Pangram AUC-PR on assisted editing falls to 0.88; at τ=0.50 it flags 80% of light edits with precision 0.84 while 15% of originals are also flagged. GPTZero AUC-PR is 0.85 with 49% refine recall. Pooled-AI AUC-PR remains ≈0.96 (Pangram) and 0.95 (GPTZero); the assisted-editing panel is in Figure 3 (main text); per-condition curves are in Figure 8.

Figure 8. Rewrite-condition ROC/PR on 2023 to 2025 (pre-humanization); same layout as Figure 7.

### K.5. Threshold trade-off curves

For each detector and each τ∈{0.3,0.4,0.5,0.6,0.7}, we report three percentages on the 2023 to 2025 collection:

- (1)

Original flag rate (gray): fraction of unmodified original abstracts with s≥τ. On recent prose this mixes proxy false positives with unobserved real AI use; it still bounds how often human-labeled text is flagged.

- (2)

Refine (abstract only) flagged rate (solid blue/red): fraction of light edits flagged-the assisted-writing exposure from RQ1.

- (3)

FNR on AI-labeled pool (dashed orange): fraction of pooled LLM rewrites (all three conditions) scoring below τ-missed AI under proxy labels.

There is no τ that simultaneously keeps all three rates low. For Pangram, original flag rate and refine-flag rate stay near 15% and 80% respectively across τ∈[0.4,0.6]; raising τ from 0.4 to 0.5 increases missed AI-labeled rewrites (FNR 10.5% to 13.5%) and does not make light edits safe from flags. For GPTZero, refine-flag rate is already near 50% at τ=0.50 while FNR on the AI pool remains 38%; lowering τ increases flags on originals without catching most light edits. The vertical dotted line marks our main-text operating point τ=0.50.

The table reports the same three quantities at τ∈{0.4,0.5,0.6}; the figure extends the sweep to 0.3 and 0.7 and places Pangram and GPTZero side by side.

### K.6. Tabulated threshold sensitivity

Table 6 in the main text reports original flag rates and AI-labeled false-negative rates for τ∈{0.4,0.5,0.6} in the 2023 to 2025 collection (pre-humanization). Figure 4 extends the sweep to τ∈{0.3,…,0.7}.

## Appendix L Automatically selected examples

We provide two automatically selected examples illustrating extreme false-negative transitions after humanization (pre scores near 1.0, post scores near 0.0) without manual cherry-picking. For each time window (2013 to 2015 and 2023 to 2025), we selected one paper-variant pair deterministically from items with complete pre/post outputs. Specifically, we (i) restricted to pairs with both Pangram and GPTZero available when possible, (ii) computed the mean detector score change after humanization (Δ=post−pre) across the available detectors for each paper-variant pair, and (iii) selected the pair with the largest drop (most negative Δ). This selection rule is fully specified in our analysis script and does not use randomness.

The 2023 to 2025 auto-selected example (paper ID W4401907927, political science, new (article only)) shows a complete detector flip: Pangram changed from 1.000 to 0.000 and GPTZero changed from 1.000 to 0.000 after humanization (mean Δ=−1.000 across detectors). The 2013 to 2015 auto-selected example (W3009617460, political science, refine (abstract + article)) shows the same pattern.

To diagnose why the flip occurs, we compared measurable pre/post text properties for the selected examples. In the 2023 to 2025 case, long-token ratio dropped from 0.260 to 0.100, Academic Word List (AWL) token ratio dropped from 0.252 to 0.006, and lexical diversity (type-token ratio) dropped from 0.771 to 0.502, while the rewrite became much longer (129 to 311 words) and shifted to much longer sentence units (average 25.8 to 62.2 words per sentence). In the 2013 to 2015 case, long-token ratio also decreased (0.082→0.054) and lexical diversity decreased (0.629→0.549). These changes are directionally consistent with our corpus-level findings that detectors assign higher AI scores to texts with more long technical tokens, and lower scores to texts that reduce those signals. In short, the humanizer appears to suppress detector-salient cues rather than preserve the original stylistic profile.

## Appendix M Linguistic mechanisms of humanization

Undetectable AI v11 is a proprietary service; we treat it as a black box but measure how its outputs differ linguistically from the inputs sent for humanization. For every paper-variant pair with both original_abstract and humanized_abstract under humanization/ (n=2,568 pairs across both time collections), we computed the surface features defined in Section 2.2, plus the fraction of sentences with at most eight words (short-sentence ratio) as a simple fragmentation proxy. We tested paired shifts (post minus pre) with two-sided permutation tests (5,000 iterations; seed 42) and correlated feature deltas with Pangram and GPTZero score deltas on matched rows.

Systematic suppression of detector-salient cues. Table 9 in the main text summarizes key pooled shifts; Table 23 below lists the full feature set. Humanization reduced long-token ratio (0.184 to 0.138; mean Δ=−0.045; 88.2% of pairs decreased; p<0.001), AWL token ratio (0.157 to 0.121; Δ=−0.036; 82.9% decreased; p<0.001), and type-token ratio (0.700 to 0.605; Δ=−0.094; 93.0% decreased; p<0.001). Numeric token ratio did not shift materially (p=0.83). These directions match our pre-humanization finding that higher Pangram and GPTZero scores correlate with greater long-token and AWL density: the humanizer moves text along the same axes that separate high-scoring from low-scoring abstracts.

Length and syntax. Humanization also increased length: mean word count rose from 180 to 229 (Δ≈+49 words; p<0.001) and average words per sentence from 23.6 to 28.4 (Δ≈+4.8; p<0.001). Short-sentence ratio increased only slightly (0.063 to 0.072; p<0.001), so evasion is not primarily driven by chopping prose into many brief sentences. Instead, outputs tend to be longer and more sententially expanded while using fewer long technical tokens and fewer academic-wordlist hits.

Coupling to detector score drops. When a pair’s long-token, AWL, or type-token ratios fell more sharply, Pangram and GPTZero scores tended to fall more sharply as well (Spearman ρ≈0.30 to 0.40 on Δ features vs. Δ scores; p<0.001 for all three features on both detectors). Average words-per-sentence increases were weakly associated with smaller score drops on Pangram (ρ=−0.12) and not reliably on GPTZero (ρ=−0.05). Together, the corpus-level shifts and the score-feature couplings suggest a mechanistic story: Undetectable humanization neutralizes commercial detectors largely by diluting the surface academic and technical token patterns those detectors already treat as AI-like, not by uniformly fragmenting syntax.

Table 23. Full pre/post linguistic features after Undetectable AI v11 humanization (pooled corpus; n=2,568 paper-variant pairs). Δ is post minus pre. p is a two-sided permutation test on paired Δ.

## Appendix N Cost and scope of the pipeline

Our design trades breadth across rewrite intensity and detectors for feasibility at corpus scale. We sampled 800 English abstracts (642 after length and PDF filtering; Section 2.1). Each retained paper contributes four scored texts: one original and three LLM outputs (refine (abstract only), refine (abstract + article), new (article only)).

Why one rewrite model: We used a single generator (Gemini 3 Flash via OpenRouter) rather than a multi-model sweep. Adding K rewrite models would multiply LLM inference cost by K while holding our error-analysis questions fixed (proxy labels, detector comparison, humanization). The factorial structure we need is rewrite condition and detector, not vendor-specific rewrite style.

Order-of-magnitude call accounting: Let N denote retained papers (N=642). Per paper:

- •

LLM rewrites: 3 calls (one per rewrite condition; the original is not regenerated).

- •

Pre-humanization detection: 4 variants × 3 detectors (Pangram, GPTZero, LLM-assisted baseline) =12 scored texts per paper.

- •

Humanization: 4 variants × 1 Undetectable pass (paid credits per abstract; not repeated per detector).

- •

Post-humanization detection: 4 variants × 3 detectors (Pangram, GPTZero, and LLM-assisted baseline).

Aggregating over the corpus, pre-detection scales as N×4×3, humanization as N×4, and post-detection as N×4×3.

LLM-assisted baseline role: The LLM-assisted baseline flags a high share of recent original abstracts (Table 2) and is treated as supplementary. After humanization, Pangram and GPTZero scores collapse toward zero for AI-labeled variants, but the LLM-assisted baseline still flags most humanized rewrites (post-humanization FNR 30.5% and 19.7%). Main-text evasion claims, therefore, focus on commercial detectors (RQ3).
