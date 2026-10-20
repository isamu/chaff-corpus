# Activating the Annotator: Operationalising Lived Experience in Data Annotation

Sheza Munir  Affiliation: Department of Computer Science  Affiliation: University of Toronto    Ramaravind Kommiya Mothilal  Affiliation: Faculty of Information  Affiliation: University of Toronto    Syed Ishtiaque Ahmed  Affiliation: Department of Computer Science  Affiliation: University of Toronto

###### Abstract

Perspectivist NLP has established that annotator positionality shapes labels for subjective tasks, but the field still lacks methods for operationalising it. Positionality is typically operationalised as a demographic form completed at recruitment: a static attribute recorded once and treated as a covariate, on the assumption that the knowledge it indexes is active when the annotator reads an item. This paper treats that assumption as a design problem and asks whether lived experience can instead be primed by the task itself. We introduce axle, a pre-annotation stage in which a scenario vignette anchors a short, axis-guided conversation that is synthesised into a first-person micro-narrative and returned to the annotator before labelling begins. In a 2×\times2 between-subjects study (104 annotators, 30 items, 1,040 annotations) on ambiguous hate speech spanning immigration, religion and gender, elicitation was associated with higher identity resonance and higher sensitivity to harm. It also increased label entropy and lowered inter-annotator agreement: the stage appears to surface plurality rather than manufacture consensus, which distinguishes it from annotator training, whose success criterion is convergence. A qualitative analysis of the rationales shows that elicitation shifts what annotators cite as grounds for their reading, from the literal text toward their own situated knowledge. Annotators not recruited for relevant lived experience invoke a lived-experience axis markedly more often under elicitation, and the axis they invoke is often not the one screened for. Positionality behaves like a state the interface either activates or leaves dormant.

## 1 Introduction

Subjective tasks such as hate speech and toxicity detection have no annotator-independent gold standard. Disagreement in these tasks is patterned rather than random, and tracks annotators’ identities, values and social positions (Waseem, 2016; Sap et al., 2019; Sap et al., 2022; Plank, 2022). This observation grounds the perspectivist programme in NLP: the position that divergent labels on such tasks are legitimate readings produced from different social locations rather than errors to be corrected, and that the appropriate modelling target is therefore the distribution of readings across a population rather than a single consensus label (Basile et al., 2023; Fleisig et al., 2024; Munir et al., 2026). Its methods preserve that signal: release annotator-level labels (Prabhakaran et al., 2021), model raters individually (Mostafazadeh Davani et al., 2022; Mokhberian et al., 2024; Orlikowski et al., 2025), and treat label distributions rather than majority votes as the training target (Fornaciari et al., 2021; Uma et al., 2021).

This infrastructure is built almost entirely downstream (Figure 1). It assumes that whatever positional signal exists has already been inscribed by the time labels are aggregated, and asks only how to preserve, model or exploit it. The upstream question i.e., what determines how much positional variation the annotation process generates in the first place, is rarely posed. In practice, positionality is operationalised as a recruitment-time demographic form: checkboxes recorded once, frozen, used as a covariate. Fleisig et al. (2024) note that demographic attributes predict individual annotation behaviour poorly, and Orlikowski et al. (2025) show that conditioning on an annotator’s own prior judgements outperforms conditioning on their demographics by a wide margin; persona prompting recovers a similarly small fraction of real annotator variance (Hu and Collier, 2024; Beck et al., 2024). A demographic category names a position without making it operative.

Meanwhile the interface works against positional reasoning. Guidelines instruct annotators to apply a definition consistently (the prescriptive paradigm of Röttger et al. (2022)) and even nominally descriptive tasks are framed as classification: read the item, pick a category, move on. That framing recruits a fast rule-application posture in which an annotator’s own history registers as bias to be suppressed rather than as the evidence the task requires, and crowdwork economics sharpen the incentive (Miceli et al., 2020; Sambasivan et al., 2021). Where lived experience is what separates one reading of an ambiguous statement from another, this posture favours the reading available to a person with no stake in the content.

The design question is therefore whether relevant experience can be brought into working memory before annotation begins. Interpretive phenomenology holds that lived experience becomes available through narrative and interpretation, and that a reflective register must be established before evaluative work (Fréchette et al., 2020); micro-narrative methods scale that elicitation to large samples (Skeggs et al., 2025). We adapt both into a pre-annotation stage, axle (Axis-guided eXperience ELicitation). Annotators read a scenario vignette (Skilling and Stylianides, 2020; Barter and Renold, 1999) thematically matched to the items they will later label; a conversational elicitor probes their relationship to those themes, structured invisibly around seven dimensions of lived experience (Gautam et al., 2025; Jacobson and Mustafa, 2019); the conversation is synthesised into a first-person micro-narrative that is returned to the annotator and stays accessible while they work. Elicitation first establishes a narrative register; annotation first would consolidate classification posture before any positional material could surface.

We evaluate this in a preliminary 2×\times2 between-subjects study on Prolific (N=104N{=}104; 1,040 annotations) crossing elicitation against a matched control, and lived-experience (LE) against non-lived-experience (non-LE) screeners, over 30 ambiguous hate speech items in three scenarios.

Figure 1: Perspectivist methods operate downstream, preserving variation the annotation step already produced. axle operates upstream, on how much variation that step produces at all.

### 1.1 Contributions

- •

axle, a pre-annotation lived-experience elicitation procedure, comprising a vignette, an axis-guided conversation and fidelity-constrained micro-narrative synthesis, released as runnable code. Against a matched no-elicitation arm it raised identity resonance and harm sensitivity at both item and participant level.

- •

Evidence that axle increases rather than collapses label plurality: per-item entropy rose and inter-annotator agreement fell—the opposite of what annotator training produces, and precisely what a perspectivist objective requires.

- •

A mechanism and a boundary condition. Analysis of 240 rationales shows elicitation shifting what annotators cite as grounds, from the literal text toward their own situated knowledge. Among annotators not screened for relevant lived experience, rationales invoke a lived-experience axis substantially more often under elicitation (a difference of roughly 38 percentage points in a subsample of 24 participants), frequently on an axis the screener never tested. Positionality behaves like an activatable state rather than a fixed attribute.

Study materials, data and analysis code are available at https://github.com/ShezaMunir/vdda.

## 2 Related Work

#### Preserving label variation.

Pavlick and Kwiatkowski (2019) showed that disagreement in natural language inference is reproducible rather than noisy, and Plank (2022) consolidated such findings under human label variation. Methods now range from soft-label multi-task learning (Fornaciari et al., 2021) and multi-annotator architectures (Mostafazadeh Davani et al., 2022) to annotator embeddings (Mokhberian et al., 2024) and jury-based adjudication (Gordon et al., 2022); Gordon et al. (2021) quantify how much standard metrics overstate performance when variation is ignored. This work is uniformly post hoc: it asks how to preserve variation already produced, not what determines how much of it the annotation process generates.

#### The proxy problem.

Identity effects on labels are well documented (Waseem, 2016; Sap et al., 2019; Goyal et al., 2022), and Sachdeva et al. (2022) formalise “identity sensitivity” using item response theory. The recurrent operationalisation is demographic, and fails twice over: categories are coarse relative to the constructs they proxy, and recording a category does not ensure the knowledge it indexes is engaged while the annotator reads. That is the gap addressed here.

#### Eliciting lived experience.

Methods for surfacing situated knowledge are well developed outside NLP. Vignettes elicit value-laden constructs without asking participants to theorise about themselves (Barter and Renold, 1999; Skilling and Stylianides, 2020); Willig (2013) specifies an interview progression from initial reaction through a stakes cue to deepening on one thread; Skeggs et al. (2025) show that fidelity-constrained micro-narratives scale. Gautam et al. (2025) supply the axis framework used here, and Haraway (1988) and Bardzell (2010) the epistemology. These methods are entering annotation research (Tang et al., 2026; Lameiro et al., 2025; Phutane et al., 2025), but as recruitment or co-design practices, not as annotation-time procedures.

#### Reflexivity as an intervention.

Arzberger et al. (2026) introduce reflexive annotating, a probe attaching identity facets and free-form rationales alongside each label, and report from a qualitative study (N=30N{=}30) that it elicits intersectional reasoning and positional humility. Their probe adapts the Social Identity Map (Jacobson and Mustafa, 2019): a static, three-tier form administered concurrently with labelling. The present design differs in position, instrument and evidence. Elicitation precedes annotation, on the premise that reflective register must be established before evaluation; it uses an adaptive conversation producing an artefact returned to the annotator rather than a fixed form; and it is evaluated against a matched control arm. Adaptivity also addresses scale: a static map must be interpreted by each worker unaided and its yield assessed through researcher-led interviews, whereas a conversational elicitor adapts probes to what each participant has said and runs without researcher presence, which is what makes per-annotator elicitation feasible at crowdsourcing volumes.

## 3 Study Design

Figure 2: Stage order in the two arms. Both share the disclosure, annotation and reflexivity stages and use an identical label taxonomy, rationale prompt and resonance item. In the control arm the three shaded stages are removed and disclosure runs after annotation, so that no identity-related framing precedes labelling.

### 3.1 Task and Items

Annotators label short social-media-style posts on a five-point ordinal harm scale (not harmful, likely not harmful, ambiguous, likely harmful, clearly harmful), select a target category, write a rationale (minimum 50 words), and rate how relevant their identity or personal experience felt to the item on a 1–5 scale, termed identity resonance.

Items come from the ambiguous hate speech corpus we constructed under the codebook developed for this study, requiring all four of the following. C1 (surface deniability): the statement reads as policy concern, cultural commentary or empirical claim, and a reader unfamiliar with the relevant discourse would not flag it on first pass. C2 (experiential divergence): a reader with direct lived experience of the targeted group would plausibly read it differently in propositional content or implication, not merely more sensitively. C3 (discourse embeddedness): it borrows framing or rhetorical structure circulating in exclusionary discourse communities, legible as such to those inside it. C4 (no explicit derogation): no slurs, calls for harm or direct dehumanisation.

C2 is the operative constraint: items where disagreement would follow only from lexical vagueness, or where toxicity is near-universal across backgrounds, are excluded. The corpus is therefore not a random sample of hate speech but a concentration of the hardest cases (those where an annotator’s background is most likely to change the reading), so effect sizes here should be read as an upper bound on what elicitation would achieve on a general corpus.

Items are organised into three thematic scenarios of ten items each: A (immigration/nativism), B (religion), C (gender/sexuality), and tagged with a primary domain: imm, rel, gen, or int (intersectional). Scenarios B and C each contain four intersectional items. Items are synthetic, generated against the codebook and screened by the authors reading each candidate against C1–C4, and the criteria were validated in a pilot round reported in the code repository. The full corpus is in Appendix E.

### 3.2 Conditions

#### Elicitation.

The elicitation arm completes the full instrument in Figure 2. The control arm is the same application with the vignette, interview and synthesis stages removed, disclosure relocated after annotation, no mention of positionality or lived experience in the study introduction, and no narrative panel in the annotation interface. Label taxonomy, target options, rationale prompt, word minimum, resonance item and reflexivity stage are identical across arms. Both arms are descriptive-paradigm annotation in the sense of Röttger et al. (2022); the contrast is latent versus activated positionality, not descriptive versus prescriptive framing.

#### Recruitment.

Within each scenario, two strata are recruited using Prolific pre-screeners selecting for and against direct experience of the relevant axis: for scenario A, migration status; for B, minority religious affiliation; for C, gender identity and sexual orientation. Full screener specifications are in Appendix A. All participants are US or Canadian residents, fluent in English, with ≥\geq95% approval, and are excluded from concurrent studies in the project.

### 3.3 The Elicitation Instrument

#### Disclosure.

Participants report their connection to the topic (direct personal experience / close community member / professional or academic / interested observer), its duration, and a short description—an independent check on the screeners (§3.4).

#### Vignette-anchored interview.

Participants read an 80–150 word vignette depicting a contested public situation matched to their scenario—a town hall over migrant housing (A), a boycott of a bakery celebrating a minority religious holiday (B), a campus dispute over an op-ed on identity politics (C)—constructed following Barter and Renold (1999) and Skilling and Stylianides (2020). Vignettes describe a situation without taking a position, so that any stance the participant adopts originates with them.

axle then conducts a conversation seeded with a fixed opening question. Its system prompt encodes seven lived-experience axes (Gautam et al., 2025): sociocultural and geographic context; linguistic background and dialect; socioeconomic status and labour; race and ethnicity; gender identity and sexuality; disability and neurodivergence; and epistemic proximity to those most affected. The axes function as invisible lenses; the model is instructed never to name or enumerate them. Coverage is tracked with a keyword heuristic over participant turns, and each subsequent prompt is constructed to bridge from the participant’s last utterance to the nearest uncovered axis, implementing the hermeneutic principle that later prompts should be grounded in earlier answers (Fréchette et al., 2020).

Turn policy follows Willig (2013): turn 1 anchors on the most specific or emotionally loaded element of the first response, turns 2–3 broaden to uncovered axes, turn 4 integrates, and turn 5 is a hard cap with a graceful wind-down. A repair rule overrides broadening. If the last response is under 12 words, axle stays on the thread and asks for a concrete memory. Every turn is constrained to one question, one to two sentences, no affirmations, no paraphrase, and no generic questions. The flow was fixed after pilot rounds; earlier prompt versions are in the code repository and the final prompts in Appendix D.

#### Micro-narrative synthesis.

The transcript is synthesised into a first-person narrative of at least 120 words under fidelity-first constraints adapted from Skeggs et al. (2025): preserve the participant’s own words, add nothing they did not express, cover at least three distinct dimensions of lived experience. The narrative is shown to the participant for review and remains accessible in a collapsible panel throughout annotation.

#### Annotation.

Ten items are presented one at a time in fixed order, with per-item timing recorded from first render to submission; all four responses are required. The rationale prompt invites participants to report whether any aspect of their identity, beliefs, values or lived experience affected their reading. The resonance item is framed as identity resonance rather than bias, avoiding language that frames disclosure as an admission of error.

#### Disagreement-anchored reflexivity.

After annotation, the system retrieves completed sessions from other participants in the same scenario and builds up to three disagreement cards: the post text, up to three anonymised other participants’ labels and rationales, and the participant’s own label and rationale, shown last. Participants then write a minimum-80-word reflection on what in their background shaped a reading that differed from others’. This stage runs in both arms.

#### Models.

axle and the synthesiser use Qwen2.5-7B-Instruct via the HuggingFace Inference API and Qwen3-32B via the Groq API (Qwen Team, 2024; Qwen Team, 2025), temperature 0.3, with reasoning traces stripped. Conversations reached a mean of 4.88 participant turns (S​D=0.32SD{=}0.32), nearly all running to the five-turn cap rather than triggering the turn-4 stopping condition, and micro-narratives averaged 174 words (S​D=54.7SD{=}54.7).

### 3.4 Participants

104 annotators were recruited via Prolific (Palan and Schitter, 2018), paid CAD 15–20/hour prorated by condition. Table 1 gives the design cells. Scenario A was fielded first and carries a larger sample because it doubled as the instrument pilot: the turn policy, repair rule and synthesis constraints were finalised on scenario A data before B and C were launched. Participants averaged 36.0 years (S​D=10.9SD{=}10.9, range 18–65), 56 male and 48 female, resident in Canada (59) or the US (45), born in 23 countries, with 38 fluent in more than one language; 49 had migrated to their country of residence. Full demographics are in Appendix B.

The disclosure stage checks the screeners: stratum and self-reported connection agree for 97 of 104 participants (93.3%). All 52 LE participants report direct personal experience; the seven mismatches are non-LE participants who nonetheless report it, concentrated in scenarios B (5 of 12) and C (2 of 12), where the screeners test a narrower axis than the disclosure question.

Three measures discouraged model-generated rationales: a disclaimer asking for the participant’s own words, disabled pasting in free-text fields, and Prolific’s submission-speed screening.

Table 1: Design cells. A = immigration, B = religion, C = gender/sexuality. Each participant annotates all ten items in their scenario (1,040 annotations).

### 3.5 Measures and Analysis

Primary measures are identity resonance and harm rating (the five-point label mapped to an ordinal 1–5 scale); secondary measures are per-item time, label entropy and target attribution. Both scales are ordinal and non-normal, so two-sided Mann–Whitney UU tests are used with the rank-biserial correlation rr as effect size. Annotations are nested within participants, so item-level tests violate independence; participant-level tests are treated as primary (n=60n{=}60 vs. 4444, one mean per participant), with item-level tests (n=600n{=}600 vs. 440440) secondary. Per-item comparisons use paired Wilcoxon signed-rank tests over the 30 items, and agreement is reported as ordinal Krippendorff’s α\alpha (Krippendorff, 2004) computed within condition.

## 4 Results

### 4.1 Resonance and Harm Sensitivity

Elicitation raised identity resonance (M=3.35M{=}3.35 vs. 2.942.94; participant level p=.041p{=}.041, r=.24r{=}.24; item level p=3.6×10−6p{=}3.6\times 10^{-6}) and harm ratings (M=3.12M{=}3.12 vs. 2.782.78; participant level p=.029p{=}.029, r=.25r{=}.25; item level p=3.9×10−5p{=}3.9\times 10^{-5}). Appendix F (Table 5) summarises. Both shifts concentrate at the poles: annotations rated 1 on resonance fall from 21.8% to 8.3%, and clearly harmful judgements rise from 9.5% to 17.3% while not harmful falls from 23.2% to 17.3% (Figure 3). Twenty-five of 30 items are rated more resonant and 25 of 30 more harmful under elicitation, with 20 items higher on both.

The upward harm shift admits two readings. Because every item satisfies C1–C4, it is consistent with elicitation surfacing previously unavailable readings; it is equally consistent with a demand characteristic. The entropy analysis below is the primary evidence against the second.

Figure 3: Response distributions by arm. Left: harm labels; elicitation moves mass toward both ends, with the largest single change at clearly harmful. Right: identity resonance; the proportion of items rated “not at all relevant to my identity or experience” falls by more than half.

### 4.2 Elicitation Increases Plurality

If elicitation simply trained annotators toward a shared reading, agreement would rise. It falls. Mean per-item Shannon entropy of the five-point harm distribution was 2.052.05 bits under elicitation versus 1.881.88 under control (Wilcoxon W=100W{=}100, p=.011p{=}.011; 20 of 30 items higher; Figure 4). Pooled ordinal Krippendorff’s α\alpha was .066.066 for elicitation and .111.111 for control, with the same direction in scenarios B and C (Appendix F).

These α\alpha values are very low and should not be read as reliability estimates: a corpus built to maximise experiential divergence is one on which high agreement is definitionally unattainable, so near-chance α\alpha is a property of the sampling frame rather than a defect of the annotators. Only the between-arm comparison at a fixed item set is interpretable, and it agrees with the entropy result.

Interventions that raise annotator engagement usually raise agreement, because they converge annotators on the guideline’s intended reading. Elicitation raises engagement while lowering agreement: it recruits different readings for different people rather than one better-trained reading. Under a prescriptive objective this is a failure mode; under a perspectivist objective, where the target is the distribution of valid readings (Basile et al., 2023; Plank, 2022), it is the intended behaviour, and it is what separates elicitation from annotator training. Inattention would also raise dispersion, but would shorten rationales and reduce time on item; neither occurs (Appendix F).

Figure 4: Per-item Shannon entropy of the harm label distribution. Points above the diagonal are items on which elicitation produced more dispersed labels.

### 4.3 Effects Are Larger for Non-LE Annotators

Recruitment stratum alone had a limited effect: LE annotators reported higher resonance than non-LE annotators (3.383.38 vs. 2.972.97, p=.026p{=}.026) but did not differ in harm ratings (p=.61p{=}.61). Screening for lived experience changed how relevant annotators felt the content was without changing what they labelled.

Elicitation effects appeared in both strata but were larger among non-LE annotators. At item level, resonance rose 0.510.51 points for non-LE (3.193.19 vs. 2.682.68, p=1.1×10−5p{=}1.1\times 10^{-5}, r=.22r{=}.22) against 0.310.31 for LE (p=.023p{=}.023, r=.11r{=}.11); harm rose 0.400.40 for non-LE (p=.0008p{=}.0008) against 0.280.28 for LE (p=.022p{=}.022). Elicited non-LE annotators (3.193.19) reported resonance level on a level with unelicited LE annotators (3.203.20). Section 5 identifies what they were drawing on.

### 4.4 Domain Effects

Elicitation raised identity resonance in every domain, but the effect on harm ratings took two different forms (Appendix F). For rel and int items it was a uniform shift: mean harm rose (2.53→3.332.53\to 3.33 and 2.91→3.272.91\to 3.27) while label dispersion stayed roughly constant, so annotators moved together toward a harsher reading. For gen items the mean did not move at all (2.94→2.882.94\to 2.88), yet resonance rose sharply (2.54→3.282.54\to 3.28) and entropy rose more than in any other domain (1.74→2.111.74\to 2.11). Annotators engaged with these items more, and moved in opposing directions: the movement cancels in the mean and appears in the variance. Domain cells are small (n=6n{=}6–1010 items), so we report this as descriptive.

### 4.5 Cost

What elicitation adds is a fixed cost: median session time was 51.4 min against 43.8 min (p=.010p{=}.010), and median non-annotation overhead 18.6 min against 7.9 min. Because the marginal per-item cost is flat or slightly negative, that overhead amortises—extrapolating from medians, projected cumulative cost crosses at roughly 48 items (Appendix F). The projection is illustrative rather than measured, resting on a per-item advantage that is not significant and ignoring fatigue.

## 5 Qualitative Analysis

The quantitative results establish that elicitation changes labels and raises dispersion, but not what annotators bring to bear when it does. A reflexive thematic analysis (Braun and Clarke, 2022) of the free-text corpus addresses that.

### 5.1 Sample and Protocol

The analysis covers 276 units from a stratified subsample of 24 participants (six per design cell, two per scenario) comprising 240 rationales, 12 elicitation transcripts and 24 reflexivity responses. Two coders coded the same units independently, then compared codes; disagreements were resolved by discussion and definitions revised. Statistics use the reconciled codebook (Appendix I). Agreement on the construct carrying the central claim below (whether a rationale invokes situated grounding) was near-perfect (κ=.84\kappa{=}.84); per-construct values are in Appendix G (Figure 8).

Figure 5: Left: what the rationale treats as grounds for its reading, by arm (n=240n{=}240); elicitation moves mass out of literal reading and into situated grounding. Right: proportion of rationales invoking any of the seven lived-experience axes, by design cell; the elicitation gain is larger in the non-LE stratum.

### 5.2 Elicitation Shifts the Grounds of Judgement

Every rationale states, explicitly or implicitly, what the annotator treats as evidence for their reading. We coded that: is the judgement grounded in a personal episode, a claim of group membership, a recognised discourse pattern, an abstract principle, the literal wording, guessed-at context, or the author’s presumed state of mind? The first three are grouped as situated grounding, since each asserts that the annotator’s own position bears on the reading.

Situated grounding accounts for 50.8% of elicitation-arm rationales against 20.8% under control (Fisher p=1.9×10−6p{=}1.9\times 10^{-6}; participant-level p=.041p{=}.041), while appeals to the literal wording alone fall from 40.8% to 12.5% (Figure 5, left); claims of group membership are absent from the control arm entirely.

The stance annotators take, by contrast, barely moves. We coded whether each rationale commits to a single reading, names two or more readings attributable to different readers, or withholds judgement for want of context. Commitment to a single reading accounts for 64.2% of control and 70.8% of elicitation rationales, and acknowledged multiplicity is identical at 16.7%. Elicitation does not make annotators more tentative; it makes them differently grounded while remaining equally committed, which is the combination that produces the entropy result. Annotators are not converging on uncertainty but diverging on confident readings reached from different starting points.

The arm-level figure averages over a bimodal distribution: grounding shifts on items where the micro-narrative surfaces in the rationale and not on items where it does not, a pattern that holds within participants rather than between them (Appendix G).

### 5.3 What Non-LE Annotators Draw On

Section 4.3 left open why elicitation effects were larger among annotators not screened for relevant lived experience. Coding which of the seven axes each rationale invokes answers it (Figure 5, right). Among non-LE annotators, axis invocation rises from 10.0% under control to 48.3% under elicitation, against 36.7% to 56.7% among LE annotators (participant-level p=.027p{=}.027). The gain is carried largely by the sociocultural and geographic axis, which rises from 4.2% to 25.8% of all rationales.

The screeners test one axis per scenario while the instrument probes seven, and the axis invoked is frequently not the screened one: non-LE participants in scenario C ground readings in class and regional upbringing rather than gender. Elicitation appears to locate whichever axis is live for a given annotator, which a single-axis screener cannot do.

This does not make elicitation uniformly harm-amplifying. Several annotators ground a lower harm rating in their own position, offering the absence of familiarity with a discourse as the reason a benign reading is correct. In the qualitative analysis, lived experience raises the variance of readings, not their mean severity: the qualitative counterpart of the entropy finding.

## 6 Discussion

#### Positionality as a state.

The dominant operationalisation in NLP is attributive: an annotator has demographic properties, recorded once, treated as stable. These results fit a state-based account better. Screening for lived experience raised resonance but not harm ratings; activating it raised both, and the largest gains in axis invocation appeared in the stratum not screened for it—anomalous under an attributive account, expected under a state account in which every annotator occupies a position on all seven axes and what varies is whether any is engaged. That grounding shifts primarily where the narrative is live at the point of judgement is what a state should do and what an attribute cannot. It would also help explain why annotator-history conditioning beats demographic conditioning (Orlikowski et al., 2025) and why persona prompts recover so little annotator variance (Hu and Collier, 2024): both model the attribute while the interface governs the state.

#### Plurality as the evaluation criterion.

Annotation interventions are conventionally judged by whether they raise agreement, and this one fails that test. If the target is the distribution rather than the mode (Plank, 2022; Basile et al., 2023), the test is wrong: what matters is whether an intervention reshapes the label distribution to better reflect the population of readers.

#### Implications for crowdsourced annotation.

Elicitation is a fixed per-worker cost with no per-item cost, which places it structurally where qualification tests already sit on major crowdsourcing platforms: expensive per worker, negligible per label once batch sizes are realistic. A platform could run it once per worker per domain and reuse the narrative across subsequent tasks, amortising the overhead across hundreds of items rather than the ten measured here. What that reuse requires is coverage: whether a worker completed an elicitation stage is the wrong quality signal, and whether its output is live when they judge a given item is the right one. Interfaces that keep the narrative visible, surface it against thematically matched items, or prompt against it where it has not been invoked all target that directly, as does monitoring per-worker repetition rate, which is cheap to compute and separates engagement from its appearance. Two further consequences follow. Elicitation artefacts are annotator-level, text-valued metadata and a natural conditioning signal for annotator-aware models (Mostafazadeh Davani et al., 2022); unlike demographic vectors they are self-authored and not confined to the categories a screener happened to test. Agreement-based quality assurance penalises the very signal a perspectivist pipeline collects, and would have to give way to rationale quality, coverage and dispersion.

## 7 Conclusion

Knowing that positionality matters does not tell a dataset builder what to do at annotation time. axle raised identity resonance and harm sensitivity, shifted what annotators cite as grounds toward situated knowledge, and increased rather than collapsed label plurality. Annotators not screened for the relevant experience showed the largest gains in resonance and in how often their rationales invoke a lived-experience axis, which suggests the instrument activates positional reasoning rather than selecting for identity.

## Limitations

This is a preliminary study and its results should be read accordingly. The design compares 60 against 44 participants over 30 synthetic items constructed to satisfy C1–C4, so effect sizes are estimated from a small, deliberately hard sample and are best read as an upper bound; cells are unbalanced (56 of 104 participants in scenario A), leaving domain-level comparisons underpowered, and secondary analyses are uncorrected for multiple comparisons. Lived experience was operationalised through coarse Prolific screeners testing one axis per scenario, which is the assumption the non-LE result is most sensitive to. Identity resonance is self-reported by an arm that knows the study concerns lived experience, so some of that gain is plausibly demand, though the harm and entropy results do not depend on self-report. Most consequentially, elicitation is model-mediated: the micro-narrative may align annotators to a model’s rendering of their experience rather than to the experience itself, a risk the fidelity coding bounds but cannot remove (Appendix G), and any positional material axle failed to pursue is invisible here. Participants are English-fluent North American residents and the discourse patterns encoded in C3 are Anglophone. Human-conducted elicitation, larger item batches, and replication on naturally occurring multilingual data would settle most of these.

## Ethical considerations

The study was approved by the authors’ institutional research ethics board. Participants gave informed consent, were told the study concerned annotation of potentially offensive social media content, and could withdraw at any point. Compensation was CAD 15–20/hour prorated by condition, above the platform minimum. The task requires reading content designed to be plausibly hateful, and the elicitation stage invites disclosure of experiences of marginalisation; several participants disclosed discrimination, immigration precarity or religious hostility. This burden is deliberately incurred by the design and corresponds to the tension Arzberger et al. (2026) identify between reflexive engagement and affective demand. It was mitigated with a hard turn cap, a wind-down turn, and no follow-up pressure on thin answers about sensitive axes. Researchers deploying elicitation at scale should treat emotional labour as a cost borne by workers rather than an externality. Prolific IDs are used only for payment and are removed from the released data; the reflexivity stage shows other participants’ labels and rationales without identifiers. Released narratives and rationales are reviewed for identifying detail before publication. Finally, an instrument that reliably shifts harm judgements could be used to manufacture a desired label distribution rather than surface one; the entropy result offers partial protection, since elicitation widens rather than narrows the distribution, but the risk applies to any framing intervention placed upstream of labelling.

## References

- Arzberger et al. (2026) A. Arzberger, C. Offerman, U. Gadiraju, A. Bozzon, and J. Yang  “Label from somewhere”: reflexive annotating for situated AI alignment.  In Proceedings of the 2026 ACM Conference on Fairness, Accountability, and Transparency,  pp. 1656–1680.  External Links: Document  Cited by: §2, Ethical considerations.
- Bardzell (2010) S. Bardzell  Feminist HCI: taking stock and outlining an agenda for design.  In Proceedings of the SIGCHI Conference on Human Factors in Computing Systems,  pp. 1301–1310.  External Links: Document  Cited by: §2.
- Barter and Renold (1999) C. Barter and E. Renold  The use of vignettes in qualitative research.  Social Research Update 25, pp. 1–6.  Cited by: §1, §2, §3.3.
- Basile et al. (2023) V. Basile, F. Cabitza, A. Campagner, and M. Fell  Toward a perspectivist turn in ground truthing for predictive computing.  In Proceedings of the AAAI Conference on Artificial Intelligence,  Vol. 37, pp. 6860–6868.  External Links: Document  Cited by: §1, §4.2, §6.
- Beck et al. (2024) T. Beck, H. Schuff, A. Lauscher, and I. Gurevych  Sensitivity, performance, robustness: deconstructing the effect of sociodemographic prompting.  In Proceedings of the 18th Conference of the European Chapter of the Association for Computational Linguistics (Volume 1: Long Papers),  pp. 2589–2609.  Cited by: §1.
- Braun and Clarke (2022) V. Braun and V. Clarke  Thematic analysis: a practical guide.   SAGE Publications, London.  Cited by: §5.
- Fleisig et al. (2024) E. Fleisig, S. L. Blodgett, D. Klein, and Z. Talat  The perspectivist paradigm shift: assumptions and challenges of capturing human labels.  In Proceedings of the 2024 Conference of the North American Chapter of the Association for Computational Linguistics: Human Language Technologies (Volume 1: Long Papers),  pp. 2279–2292.  External Links: Document  Cited by: §1, §1.
- Fornaciari et al. (2021) T. Fornaciari, A. Uma, S. Paun, B. Plank, D. Hovy, and M. Poesio  Beyond black & white: leveraging annotator disagreement via soft-label multi-task learning.  In Proceedings of the 2021 Conference of the North American Chapter of the Association for Computational Linguistics: Human Language Technologies, K. Toutanova, A. Rumshisky, L. Zettlemoyer, D. Hakkani-Tur, I. Beltagy, S. Bethard, R. Cotterell, T. Chakraborty, and Y. Zhou (Eds.),  Online, pp. 2591–2597.  External Links: Link, Document  Cited by: §1, §2.
- Fréchette et al. (2020) J. Fréchette, V. Bitzas, M. Aubry, K. Kilpatrick, and M. Lavoie-Tremblay  Capturing lived experience: methodological considerations for interpretive phenomenological inquiry.  International Journal of Qualitative Methods 19, pp. 1–12.  External Links: Document  Cited by: §1, §3.3.
- Gautam et al. (2025) S. Gautam, M. Chandra, A. De, T. Chakravorti, G. Malik, and M. De Choudhury  Towards experience-centered AI: a framework for integrating lived experience in design and development.  External Links: 2508.06849, Document  Cited by: §1, §2, §3.3.
- Gordon et al. (2022) M. L. Gordon, M. S. Lam, J. S. Park, K. Patel, J. Hancock, T. Hashimoto, and M. S. Bernstein  Jury learning: integrating dissenting voices into machine learning models.  Proceedings of the 2022 CHI Conference on Human Factors in Computing Systems.  External Links: Document  Cited by: §2.
- Gordon et al. (2021) M. L. Gordon, K. Zhou, K. Patel, T. Hashimoto, and M. S. Bernstein  The disagreement deconvolution: bringing machine learning performance metrics in line with reality.  Proceedings of the 2021 CHI Conference on Human Factors in Computing Systems.  External Links: Document  Cited by: §2.
- Goyal et al. (2022) N. Goyal, I. D. Kivlichan, R. Rosen, and L. Vasserman  Is your toxicity my toxicity? exploring the impact of rater identity on toxicity annotation.  Proc. ACM Hum.-Comput. Interact..  External Links: Document  Cited by: §2.
- Haraway (1988) D. Haraway  Situated knowledges: the science question in feminism and the privilege of partial perspective.  Feminist Studies 14 (3), pp. 575–599.  External Links: Document  Cited by: §2.
- Hu and Collier (2024) T. Hu and N. Collier  Quantifying the persona effect in LLM simulations.  In Proceedings of the 62nd Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers),  pp. 10289–10307.  External Links: Document  Cited by: §1, §6.
- Jacobson and Mustafa (2019) D. Jacobson and N. Mustafa  Social identity mapping: a reflexivity tool for practicing explicit positionality in critical qualitative research.  The International Journal of Qualitative Methods.  External Links: Document  Cited by: §1, §2.
- Krippendorff (2004) K. Krippendorff  Content analysis: an introduction to its methodology.  2nd edition, Sage Publications, Thousand Oaks, CA.  Cited by: §3.5.
- Lameiro et al. (2025) F. Lameiro, L. Dunagan, D. Card, E. Gilbert, and O. Haimson  TIDEs: a transgender and nonbinary community-labeled dataset and model for transphobia identification in digital environments.  Proceedings of the 2025 ACM Conference on Fairness, Accountability, and Transparency.  External Links: Document  Cited by: §2.
- Miceli et al. (2020) M. Miceli, M. Schuessler, and T. Yang  Between subjectivity and imposition: power dynamics in data annotation for computer vision.  Proc. ACM Hum.-Comput. Interact..  External Links: Document  Cited by: §1.
- Mokhberian et al. (2024) N. Mokhberian, M. Marmarelis, F. Hopp, V. Basile, F. Morstatter, and K. Lerman  Capturing perspectives of crowdsourced annotators in subjective learning tasks.  In Proceedings of the 2024 Conference of the North American Chapter of the Association for Computational Linguistics: Human Language Technologies (Volume 1: Long Papers), K. Duh, H. Gomez, and S. Bethard (Eds.),  Mexico City, Mexico, pp. 7337–7349.  External Links: Link, Document  Cited by: §1, §2.
- Mostafazadeh Davani et al. (2022) A. Mostafazadeh Davani, M. Díaz, and V. Prabhakaran  Dealing with disagreements: looking beyond the majority vote in subjective annotations.  Transactions of the Association for Computational Linguistics 10, pp. 92–110.  External Links: Document  Cited by: §1, §2, §6.
- Munir et al. (2026) S. Munir, B. Mah, K. Kalsi, S. Kapania, J. Posada, E. Law, D. Wang, and S. I. Ahmed  The consensus trap: dissecting subjectivity and the “ground truth” illusion in data annotation.  In Proceedings of the 2026 ACM Conference on Fairness, Accountability, and Transparency,  External Links: Document  Cited by: §1.
- Orlikowski et al. (2025) M. Orlikowski, J. Pei, P. Röttger, P. Cimiano, D. Jurgens, and D. Hovy  Beyond demographics: fine-tuning large language models to predict individuals’ subjective text perceptions.  Proceedings of the 63rd Annual Meeting of the Association for Computational Linguistics (Volume 1: Long Papers).  External Links: Document  Cited by: §1, §1, §6.
- Palan and Schitter (2018) S. Palan and C. Schitter  Prolific.ac—a subject pool for online experiments.  Journal of Behavioral and Experimental Finance 17, pp. 22–27.  External Links: Document  Cited by: §3.4.
- Pavlick and Kwiatkowski (2019) E. Pavlick and T. Kwiatkowski  Inherent disagreements in human textual inferences.  Transactions of the Association for Computational Linguistics 7, pp. 677–694.  External Links: Document  Cited by: §2.
- Phutane et al. (2025) M. Phutane, A. Seelam, and A. Vashistha  “Cold, calculated, and condescending”: how ai identifies and explains ableism compared to disabled people.  Proceedings of the 2025 ACM Conference on Fairness, Accountability, and Transparency.  External Links: Document  Cited by: §2.
- Plank (2022) B. Plank  The “problem” of human label variation: on ground truth in data, modeling and evaluation.  In Proceedings of the 2022 Conference on Empirical Methods in Natural Language Processing,  Abu Dhabi, United Arab Emirates, pp. 10671–10682.  External Links: Document  Cited by: §1, §2, §4.2, §6.
- Prabhakaran et al. (2021) V. Prabhakaran, A. Mostafazadeh Davani, and M. Diaz  On releasing annotator-level labels and information in datasets.  In Proceedings of the Joint 15th Linguistic Annotation Workshop (LAW) and 3rd Designing Meaning Representations (DMR) Workshop,  pp. 133–138.  External Links: Document  Cited by: §1.
- Qwen Team (2024) Qwen Team  Qwen2.5 technical report.  arXiv preprint arXiv:2412.15115.  External Links: Document  Cited by: §3.3.
- Qwen Team (2025) Qwen Team  Qwen3 technical report.  arXiv preprint arXiv:2505.09388.  External Links: Document  Cited by: §3.3.
- Röttger et al. (2022) P. Röttger, B. Vidgen, D. Hovy, and J. Pierrehumbert  Two contrasting data annotation paradigms for subjective NLP tasks.  In Proceedings of the 2022 Conference of the North American Chapter of the Association for Computational Linguistics: Human Language Technologies,  Seattle, United States, pp. 175–190.  External Links: Document  Cited by: §1, §3.2.
- Sachdeva et al. (2022) P. S. Sachdeva, R. Barreto, C. von Vacano, and C. J. Kennedy  Assessing annotator identity sensitivity via item response theory: a case study in a hate speech corpus.  Proceedings of the 2022 ACM Conference on Fairness, Accountability, and Transparency.  External Links: Document  Cited by: §2.
- Sambasivan et al. (2021) N. Sambasivan, S. Kapania, H. Highfill, D. Akrong, P. Paritosh, and L. M. Aroyo  “Everyone wants to do the model work, not the data work”: data cascades in high-stakes ai.  Proceedings of the 2021 CHI Conference on Human Factors in Computing Systems.  External Links: Document  Cited by: §1.
- Sap et al. (2019) M. Sap, D. Card, S. Gabriel, Y. Choi, and N. A. Smith  The risk of racial bias in hate speech detection.  In Proceedings of the 57th Annual Meeting of the Association for Computational Linguistics,  pp. 1668–1678.  External Links: Document  Cited by: §1, §2.
- Sap et al. (2022) M. Sap, S. Swayamdipta, L. Vianna, X. Zhou, Y. Choi, and N. A. Smith  Annotators with attitudes: how annotator beliefs and identities bias toxic language detection.  In Proceedings of the 2022 Conference of the North American Chapter of the Association for Computational Linguistics: Human Language Technologies, M. Carpuat, M. de Marneffe, and I. V. Meza Ruiz (Eds.),  Seattle, United States, pp. 5884–5906.  External Links: Link, Document  Cited by: §1.
- Skeggs et al. (2025) A. Skeggs, A. Mehta, V. Yap, S. B. Ibrahim, C. Rhodes, J. J. Gross, S. A. Munson, P. Klasnja, A. Orben, and P. Slovak  Micro-narratives: a scalable method for eliciting stories of people’s lived experience.  Proceedings of the 2025 CHI Conference on Human Factors in Computing Systems.  External Links: Document  Cited by: §1, §2, §3.3.
- Skilling and Stylianides (2020) K. Skilling and G. J. Stylianides  Using vignettes in educational research: a framework for vignette construction.  International Journal of Research & Method in Education 43 (5), pp. 541–556.  External Links: Document  Cited by: §1, §2, §3.3.
- Tang et al. (2026) X. Tang, J. Li, and S. Wu  Disability-first AI dataset annotation: co-designing stuttered speech annotation guidelines with people who stutter.  In Proceedings of the 2026 CHI Conference on Human Factors in Computing Systems,  pp. 1–22.  External Links: Document  Cited by: §2.
- Uma et al. (2021) A. N. Uma, T. Fornaciari, D. Hovy, S. Paun, B. Plank, and M. Poesio  Learning from disagreement: a survey.  Journal of Artificial Intelligence Research 72, pp. 1385–1470.  External Links: Document  Cited by: §1.
- Waseem (2016) Z. Waseem  Are you a racist or am I seeing things? annotator influence on hate speech detection on Twitter.  In Proceedings of the First Workshop on NLP and Computational Social Science,  pp. 138–142.  External Links: Document  Cited by: §1, §2.
- Willig (2013) C. Willig  Introducing qualitative research in psychology.  3rd edition, Open University Press, Maidenhead, UK.  Cited by: §2, §3.3.

## Appendix A Prolific Screener Specifications

Table 2: Stratum screeners. All conditions additionally required: residence in the United States or Canada; English among fluent languages; submission approval rate 95–100; and exclusion of participants enrolled in any other study in this project. Sex was restricted to male or female in scenarios A and B.

## Appendix B Participant Demographics

Table 3: Participant demographics (N=104N{=}104). †Religion and sexual orientation were collected only for scenarios B and C respectively, so those counts sum to 24.

## Appendix C Vignettes

#### Scenario A — Borders, Safety & Who Belongs.

A local community board is holding a heated town hall meeting about a proposed temporary housing facility for undocumented migrants. Outside the building, two groups have gathered. One group holds signs demanding strict border enforcement, shouting that the town must prioritize local safety and resources first. The other group is distributing hot tea and holding banners that read ‘No one is illegal.’ As everyday residents walk past the crowd to get to the grocery store next door, the tension in the air is palpable, forcing everyone to silently choose a side, engage, or just keep their heads down.

#### Scenario B — Religion, Culture & the Politics of Belonging.

A popular local bakery posts a photo celebrating a religious holiday that is not widely observed by the majority of the town. Within hours, a prominent local figure screenshots the post, claiming the bakery is ‘erasing our traditional culture’ and promoting dangerous ideologies. Followers flood the bakery’s page with hostile reviews and calls for a boycott. In response, a coalition of neighbourhood residents organises a ‘buy-out’ day, lining up around the block to purchase pastries, hoping to drown out the hostility with a highly visible show of support and solidarity.

#### Scenario C — Gender, Identity & Whose Experience Counts.

A university student forum erupts after a well-known professor publishes an op-ed arguing that ‘identity politics has gone too far’ and that certain protected categories now receive more institutional sympathy than others. The comments split immediately: some students share personal accounts of discrimination they say went unacknowledged, while others post screenshots of what they describe as reverse bias in hiring and disciplinary processes. Amidst the heated exchanges, one student reflects on their own experiences with marginalization but it drowns out in a sea of opinions.

## Appendix D axle Prompts

#### Axis context (prepended every turn).

You are conducting a qualitative lived-experience elicitation as part of an academic study on annotation and positionality. The participant has just read a scenario. Your job is to draw out their personal relationship to the themes in it — not their opinions about the scenario, but their lived experience that shapes how they would read and interpret it.

The seven lived-experience axes below are lenses. Work through them across the conversation. Do NOT name them or list them — use them invisibly: (A) sociocultural and geographic context — where they grew up, cultural norms, value systems; (B) linguistic background — native language, code-switching, dialect, how they navigate registers; (C) socioeconomic and labour — class, economic precarity, workplace power dynamics; (D) race and ethnicity — racial identity, marginalisation, how others perceive them; (E) gender and sexuality — lived gender/sexuality, how systems categorise them; (F) disability and neurodivergence — physical, cognitive, sensory experience, what ‘normal’ excludes; (G) epistemic proximity — how personally close they are to the people most affected by this scenario.

Core rules, applied every turn: ask exactly ONE question; if you feel the urge to ask two, cut the second. One to two sentences maximum. No affirmations (‘great’, ‘thank you’, ‘I see’). No summaries of what they said. Never paraphrase their answer back to them. Anchor every question to something specific they actually said — never ask generically. If their last answer was thin (fewer than ∼\scriptstyle\sim15 words), do NOT pivot to a new axis; stay with the same thread and ask for a concrete example or memory. Move to a new axis only when you have substantive material on the current one.

#### Turn policy.

Turn 1 (opening): pick the single most specific or emotionally loaded thing they said; ask one question connecting it to their personal history. Repair turn (triggered when the last response is ≤\leq12 words): do not move to a new axis; ask them to ground what they said in a specific moment, memory or example. Turns 2–3 (broaden): open the next untouched axis, bridging naturally from their last utterance without announcing the topic change. Turns 2–3 (deepen), when all axes are touched: go deeper on the richest one, asking what made that experience personally significant. Turn 4 (integration): invite them to connect the threads — how does their background shape the lens through which they read content like this scenario? Emit READY_TO_BUILD if the material supports a coherent narrative covering at least three axes. Turn 5 (final): ask no question; thank them in one sentence and emit READY_TO_BUILD.

#### Synthesis prompt.

Write a first-person narrative (minimum 120 words) that faithfully captures what this participant shared. Rules: use ‘I’ throughout. Preserve the participant’s own specific words and phrases wherever possible — do not sanitise their voice. Do NOT add feelings, interpretations, or experiences they did not express. Cover at least three distinct dimensions of lived experience (e.g. cultural background, personal memory, emotional response, sense of identity or belonging, relationship to the community depicted). The narrative should read as a coherent, flowing piece of personal reflection — not a bullet list or summary. Friendly, natural, warm tone — not clinical or academic. Do not include a title or preamble. Output ONLY the narrative text.

## Appendix E Item Corpus

A01

imm

Our hospitals can’t keep up. At some point we have to ask who this country is actually for.

A02

imm

My grandparents came here legally and waited years. Why should anyone get to skip that line?

A03

imm

When you flood a labor market, wages go down. Economics doesn’t care about feelings.

A04

imm

There’s nothing wrong with wanting your hometown to stay recognizable.

A05

imm

Demographic change at this pace isn’t natural. Someone is choosing this.

A06

imm

Chain migration turns one visa into fifty. That’s not the deal Americans signed up for.

A07

imm

Every nation has the right to exist as a distinct people. Even European ones.

A08

imm

We keep importing poverty and then wonder why poverty doesn’t go away.

A09

imm

Western countries are the only ones expected to dissolve their own majorities.

A10

imm

The people most affected by immigration policy are the working class, not politicians.

B01

rel

I support religious freedom, but some belief systems just aren’t compatible with liberal democracy. That’s not bigotry, it’s observation.

B02

rel

We accommodate every faith’s dietary rules in schools now. At some point you have to ask whose schools these are.

B03

rel

I have no problem with people praying five times a day. I do have a problem when it starts affecting workplace schedules for everyone else.

B04

rel

There’s a reason the Enlightenment happened in one part of the world and not others. That’s not racism, it’s history.

B05

rel

If a Christian baker refusing a gay wedding is front-page news, why isn’t a halal butcher refusing to serve a non-Muslim customer?

B06

rel

Secularism means no religion gets special status. That includes the ones progressives have decided are beyond criticism.

B07

int

Immigrant communities often hold the most conservative views on gender. The left just doesn’t want to say that out loud.

B08

int

Gay rights were won by fighting religious conservatism. Now we’re importing more of it and calling it diversity.

B09

int

Female genital mutilation is illegal here. Calling attention to where it’s practiced is not Islamophobia.

B10

int

The same activists who say believe all women go very quiet when the accused is from a protected group.

C01

gen

I believe women. I also believe due process. These shouldn’t be mutually exclusive.

C02

gen

Calling everything a ’microaggression’ doesn’t empower women. It treats them like they can’t handle everyday life.

C03

gen

There are two genders. I’m sorry if that’s hurtful, but being hurtful isn’t the same as being wrong.

C04

gen

If gender is a social construct, then so is the wage gap. You can’t have it both ways.

C05

gen

Women’s sports existed to give women a fair playing field. That’s it. That’s the whole point.

C06

gen

Men aren’t broken women. Treating masculinity as a pathology isn’t progressivism, it’s prejudice with better vocabulary.

C07

int

When a working-class white man loses a job to a diversity hire, he’s not allowed to be angry. That anger has to go somewhere.

C08

int

Intersectionality is just a hierarchy that puts some victims above others. It’s oppression with extra steps.

C09

int

First-generation immigrant women are often the most opposed to feminism. Nobody ever asks them why.

C10

int

We have a word for communities where women can’t leave the house without permission. We’re just not allowed to use it anymore.

Table 4: The 30 items. All satisfy C1–C4 of the ambiguity codebook. Scenario is given by the ID prefix: A = immigration, B = religion, C = gender/sexuality.

## Appendix F Additional Quantitative Detail

This appendix collects the full results table (Table 5), the design-cell breakdown (Table 6), agreement coefficients (Table 7), the domain-level effects referenced in §4, and the cost projection.

Table 5: Main results; values are means unless noted. Mann–Whitney UU for level comparisons; Wilcoxon signed-rank for the paired per-item comparison. Time on item is item-level (n=600/440n{=}600/440); item-level tests of resonance and harm are both p<.0001p<.0001.

Table 6: Item-level means by design cell (n=300n{=}300, 220220, 300300, 220220).

Table 7: Ordinal Krippendorff’s α\alpha on the five-point harm scale, computed within condition. Absolute values are near chance in both arms, as expected for a corpus selected for experiential divergence; only the between-arm comparison is interpretable.

#### Target attribution.

Elicitation changed which group annotators read as targeted (χ2​(6)=25.45\chi^{2}(6){=}25.45, p=.0003p{=}.0003 at item level). “No one — I don’t read this as targeting anyone” fell from 15.0% to 9.3% of annotations and “multiple overlapping groups” rose from 17.7% to 23.8%. The difference does not reach significance at participant level (p=.38p{=}.38) and is reported as exploratory.

#### Rationale length.

Rationale length did not differ by arm at either level (62.7 vs. 62.5 words; participant p=.89p{=}.89, item p=.52p{=}.52). It is reported because the null result rules out the interpretation that elicitation’s dispersion effect reflects lower-effort responding.

#### Domain effects.

Elicitation effects varied by item domain (Figure 6). Resonance gains were largest for gen (2.54→3.282.54\to 3.28), int (2.60→3.272.60\to 3.27) and rel (2.89→3.472.89\to 3.47) and smallest for imm (3.26→3.363.26\to 3.36), where baseline resonance was already high. Harm gains were largest for rel (2.53→3.332.53\to 3.33) and int (2.91→3.272.91\to 3.27) and absent for gen (2.94→2.882.94\to 2.88).

Figure 6: Elicitation effects by item domain, with standard errors. Harm gains concentrate in rel and int; gen shows a large resonance gain with no mean harm shift.

Figure 7: Projected session time by items annotated, using median fixed overhead and median per-item time in each arm.

## Appendix G Coder Agreement, Carryover and Fidelity

#### Carryover counts.

Of the 120 elicitation-arm rationales, 44.2% showed no detectable relation to the participant’s micro-narrative, 36.7% applied a theme from it to the specific item, 2.5% reused wording near-verbatim, and 16.7% appended a fixed clause irrespective of item content. The last category came from 2 of the 12 elicitation-arm participants, each of whom closed all ten rationales with the same sentence (Figure 9).

#### The grounding effect is conditional on the narrative surfacing.

Situated grounding reaches 72.7% among rationales that apply a theme from the micro-narrative to the item, against 30.2% among those with no detectable relation to it— indistinguishable from the control arm (20.8%, Fisher p=.24p{=}.24), with axis invocation lower than control (15.1% vs. 23.3%). The difference between the two groups is large (Fisher p=3.9×10−5p{=}3.9\times 10^{-5}), and ten of the twelve elicitation-arm participants produce both kinds, so it tracks the item rather than the person. Which items trigger recall was not under experimental control, so the within-participant pattern rules out person-level confounding, not item-level.

#### Narrative fidelity.

Of the 12 transcript–narrative pairs, 7 were faithful and 5 contained at least one unsupported move; 6 of 12 conversations yielded mostly short, general answers and 2 entered a repair loop from which axle never recovered.

Figure 8: Agreement between the two coders on constructs present in both schemes, before reconciliation (n=240n{=}240 rationales). The construct carrying the central claim in §5 is the one agreed on most closely.

Figure 9: Relationship between the micro-narrative and subsequent rationales (n=120n{=}120 elicitation-arm rationales). Formulaic tagging is concentrated in two of twelve participants.

## Appendix H Reflexivity Responses

In the reflexivity stage, 13 of 24 sampled participants explained their divergence from others by reference to their own position, more often in the elicitation arm (8 of 12) than the control arm (5 of 12). The remainder described a general reading procedure instead (6), claimed alignment with others (1), entrenched without explanation (1), or explicitly declined to ground the reading in their own position (1). The last case is instructive: an immigrant participant attributed their readings to education rather than immigration status, having grounded their readings in discourse familiarity throughout their rationales. Self-report about positionality and its operation do not always coincide.

## Appendix I Qualitative Codebook

Coding dimensions in the scheme used for the statistics reported in §5 are: grounding (experiential-specific, identity-categorical, discourse-pattern, abstract-principle, text-literal, speculative-context, author-psychologising); axis (the seven lived-experience axes plus none-invoked); discourse recognition (no engagement, generic subtext, mechanism named, subtext denied); epistemic stance (single-confident, multiplicity-acknowledged, deference, undecided-insufficient, dismissal, generalised-reader); carryover (none, thematic, near-verbatim, formulaic-tag); reflexivity type (positional explanation, method explanation, entrenchment, revision, relativist non-positional, alignment claim, positional disavowal); chat quality (thick-episodic, thin-abstract, repair-loop unrecovered, steering resisted, off-topic drift); and narrative fidelity (faithful, cross-stage import, affective embellishment, tone reversal, epistemic strengthening, lexical drift).
