# Synthetic source coverage

Both self-authored PDFs have two physical pages. All four were visually rechecked for the concept-focused revision; none is omitted. This validates the synthetic examples, not real-world OCR.

| Source / page | Concept and verified evidence | Prerequisite | Learning objective | Destination |
|---|---|---|---|---|
| Lecture 1 / 1 | 100 students; 40 in S; 24 in E ∩ S; question conditions on S | Fractions and subsets | Name the eligible group and explain 24/40 | reference-group |
| Lecture 1 / 2 | P(E given S) = P(E ∩ S)/P(S), P(S) > 0; 0.60 versus 0.24 | Reference group; event notation introduced locally | Derive the count ratio, distinguish joint/conditional, check zero denominator, transfer the rule | calculation; check-understanding |
| Lecture 2 / 1 | Independence product equality and conditional equivalent when P(S) > 0; P(E) = 0.50 | Conditional and joint probability from Lecture 1 | Compare the same event before/after conditioning; test independence | independence-test; independence-quiz |
| Lecture 2 / 2 | Raster-only two-way table: rows 24/16/40 and 26/34/60; totals 50/50/100 | Reading row and column totals | Compute joint and marginal shares and compare 0.24 with 0.20 | read-table |

## Teaching decisions and provenance

- Lecture boundaries and the original running example are retained. The group interpretation precedes the formula; its essential three calculation steps are visible. Independence begins with the prior lesson's reference-group idea before stating the formal condition.
- The new nested-group SVG is original, schematic rather than area-proportional. It depicts E ∩ S inside S, not all of E. Remaining counts 16 and 60 are derived from page 1. The table image remains the visually reviewed original source figure.
- The list-filter explanation rewrites the conditioning concept in the main lesson with its source citation. It does not introduce a new probability rule.
- The library scenario is labeled an author-created exercise: 5/20 = 25%, while 5/80 = 6.25%. The distractor 20/80 also equals 25% but answers the wrong question. The reference-group reasoning, not a numerical coincidence, determines the correct answer.
- Explanation, applicability and transfer are checked through the denominator prompt, zero-group prompt and library exercise. Optional causal background remains explicitly supplementary.
- Independence retains both source tests: 24/40 = 0.60 differs from 50/100 = 0.50; 24/100 = 0.24 differs from (50/100)(40/100) = 0.20.
- No uncertain source claims are tested. Reading position and quiz completion do not establish learning outcomes.

## Question-led sections and learning routes

Lecture 1 keeps its three core sections. Lecture 2 has five, including the overlap exploration and
later clinic retrieval. The bilingual first lecture has five, including its exploration and separate
scaffolded-practice section, followed by a clinic review section in the next lecture. Existing section
IDs remain stable, and the new exploration and primary clinic sections join their learning routes
and transition chains. The bilingual practice section links to its later review, which links back to
the earlier rule. The opening route is optional navigation: its question links show the order and explain
why each step is needed. Every core section has a question heading, a visible section objective, an
opening connection to prior knowledge, and an ending question that motivates the next step. The
prerequisite checks remain optional and separate from this core sequence; no sections were added to
meet a length or count target.

| Lecture / section | Question and section objective | Starting dependency | Ending question / next step |
|---|---|---|---|
| 1 / `reference-group` | Among which students? Identify the eligible group and justify the denominator 40. | Part-to-whole fractions and overlapping groups, optionally reviewed in the precheck. | How can the same restriction be expressed with probabilities? Continue to `calculation`. |
| 1 / `calculation` | How does the formula keep the same reference group? Derive 24/40, distinguish it from 24/100, and state the positive-denominator condition. | The 40 statistics students have already been selected as the reference group. | Can the learner select the group without the worked steps? Continue to `check-understanding`. |
| 1 / `check-understanding` | Can you choose the group in a new problem? Solve the survey and library questions by naming the group first; explain applicability and distinguish exact fractions from rounded decimals. | The numerator counts both events within the group selected by the denominator; completion practice precedes independent calculation and reflection. | Does knowing S change the probability of E? Lecture 2 supplies the missing marginal share. |
| 2 / `independence-test` | Does the information change the probability? Compare P(E given S) with P(E) and interpret the difference. | Lecture 1's distinction between conditional and joint probability; compare the same event before and after learning S. | How can all the counts check the same conclusion? Continue to `read-table`. |
| 2 / `read-table` | How can the table check the same conclusion? Calculate joint and marginal shares from totals and apply the product equality. | The prior conditional comparison and the equivalent product test. | Could another overlap satisfy independence with both subject totals fixed? Continue to `explore-independence`. |
| 2 / `explore-independence` | How much overlap would make the events independent? Predict and explain which overlap satisfies both tests. | The source table and both independence tests, keeping the table margins fixed. | Which comparison justifies the conclusion, and why are subject names insufficient? Return to the original survey in `independence-quiz`. |
| 2 / `independence-quiz` | Which comparison justifies the conclusion? Explain a valid comparison and reject unsupported reasons. | Both numerical checks and the conditional test's applicability condition. | Which probabilities and conditions would another pair of events require? First retrieve the earlier reference-group decision in `cumulative-review`. |
| 2 / `cumulative-review` | Can you retrieve the reference group in a new setting? Choose and justify the conditional denominator in a clinic problem. | The independence comparison still depends on the reference group; retrieve the earlier method in a new setting. | Which group would a new condition select, and how would it affect an independence comparison? Return to `independence-test` if needed. |
| Bilingual / `conditional-intuition` | How does the condition choose the group? Identify the selected group in the source survey and club case. | A fraction compares a part with a chosen whole; optional prerequisite review is available. | Which group should the four members be compared with? Continue to `conditional-practice`. |
| Bilingual / `conditional-practice` | Which group belongs in the denominator? Choose the club denominator and explain why using all members answers a different question. | The selected chess group and intersection idea. | How can probabilities recover the answer 4/10? Continue to `conditional-general-rule`. |
| Bilingual / `conditional-general-rule` | How can probabilities recover the same answer? Derive 4/10 from probability shares and explain the positive denominator. | The club's count ratio, with the reference group held fixed; the visible table connects words, counts, and symbols. | What changes when the overlap varies with group totals fixed? Continue to `conditional-exploration`. |
| Bilingual / `conditional-exploration` | How does changing the overlap change the probability? Predict and explain a changed probability while preserving group totals. | The formula identifies the overlap as numerator and chess group as denominator; the diagram is a labeled hypothetical extension. | Can the learner keep choosing the group as worked steps are removed? Continue to `conditional-transfer`. |
| Bilingual / `conditional-transfer` | Can you choose the group without worked steps? Complete the club calculation, solve the garden problem, explain applicability, and distinguish exact fractions from rounded decimals. | The worked formula and its group interpretation, first with a completed counting step and then without intermediate steps. | For a new condition, which group supplies the denominator and is its probability positive? Try the clinic problem in the later review lecture. |
| Bilingual review / `cumulative-review` | Can you retrieve the reference group in a new setting? Choose and justify the clinic denominator. | Recall the method from the earlier club/garden lesson; optional hint and full reasoning remain available. | With another condition, which group would you use? The return link revisits `conditional-general-rule` in the first lecture. |

The routes, section objectives, dependency explanations, and transition questions are author-created
teaching structure. They retain the source-supported counts, complete worked steps, conditions,
citations, lecture boundaries, and existing quiz answers. The bilingual route, its accessible label,
and all new section prose have matching Chinese translations. These synthetic examples demonstrate
the structure and navigation; they do not establish that shorter sections or route links improve
learning, nor do they validate the approach on unseen teacher PDFs.

## Optional prerequisite checks

The first primary lesson and the bilingual fixture each start with two optional author-created checks. They test needed prior knowledge, not the conditional-probability rule that the lesson will teach. The source does not supply these check scenarios or refreshers; all are explicitly added background. The skip links lead to `reference-group` and `conditional-intuition`, respectively. All main content remains accessible without answering.

| Check / concept | Where it is needed | Matching focused refresher | Verified reasoning |
|---|---|---|---|
| `prerequisite-fractions-check` / part-to-whole fraction | Lecture 1's 24/40 and probability rescaling | `fraction-refresher` | 3/12 = 0.25 = 25%; 36 multiplies counts; 75% describes the complement |
| `prerequisite-overlap-check` / intersection | E ∩ S in Lecture 1's numerator | `overlap-refresher` | 2 people satisfy both descriptions; 6 + 4 double-counts them; 6 + 4 − 2 = 8 counts at least one activity |
| `bilingual-fractions-check` / same fraction concept | The club's 4/10 calculation | `bilingual-fraction-refresher` | Same counter scenario and reasoning, with reviewed Chinese translations |
| `bilingual-overlap-check` / same intersection concept | C ∩ T in the club's numerator | `bilingual-overlap-refresher` | Same activity scenario and reasoning, with reviewed Chinese translations |

Each wrong answer offers its own refresher, with a return to the originating question. Directly opening a refresher is also possible. None of these outcomes is a mastery assessment.

## Hints for plausible wrong choices

Every wrong option in the primary demo and bilingual fixture has a hidden, author-created hint. The hints use the existing concepts without adding source claims or changing the verified answers. They identify a reasoning step to revisit and withhold the correct option and final calculation; full solutions remain in the explanations. The bilingual fixture includes reviewed Chinese translations for all five of its hints.

| Quiz / wrong option index | Misconception addressed by the hint |
|---|---|
| Fraction checks / 1 | Multiplying counts instead of comparing a part with the whole |
| Fraction checks / 2 | Counting the complement instead of the requested color |
| Intersection checks / 0 | Adding group sizes and double-counting the overlap |
| Intersection checks / 2 | Counting at least one activity instead of requiring both |
| `survey-quiz` / 0 | Using all students instead of reconsidering the conditioning group |
| `survey-quiz` / 2 | Measuring the conditioning event alone instead of the event requested within it |
| `transfer-quiz` / 0 | Including books outside the group named in the question |
| `transfer-quiz` / 1 | Counting borrowed books instead of damaged books in the selected group; the matching percentage does not validate the reasoning |
| `independence-quiz-question` / 1 | Treating nonempty events as enough to decide independence |
| `independence-quiz-question` / 2 | Treating different subject labels as evidence of dependence |
| `bilingual-quiz` / 0 | Counting the whole club despite the question's condition |

On an incorrect attempt, only the matching hint is shown; the correct choice and explanation remain hidden until a correct attempt or an explicit reveal. Retry retains the latest hint, and another wrong choice replaces it. Students can reveal the solution before answering without receiving a correct grade. The prerequisite refresher link and return route remain available after a wrong answer and through retry, and clear after a correct answer. These interactions provide another opportunity to reason and do not establish learning outcomes.

## Running-case connections

| Case step | Problem still unresolved | Next concept or action | Source / new provenance |
|---|---|---|---|
| Survey: identify 24 within the 40 statistics students | How can a group restriction be expressed when given probabilities instead of counts? | Conditional probability formula in `calculation` | Source counts on Lecture 1 p. 1; rule and worked example on p. 2 |
| Survey: rescale (24/100)/(40/100) to 60% | Can the learner choose the group without the worked steps? | Survey check, then a transfer exercise | Survey preserved from source; library scenario explicitly author-created |
| Survey: distinguish conditional 60% from joint 24% | Does knowing S change the probability of E? The overall economics share is still missing | Marginal P(E) = 50/100 and the independence comparison | Same 100-student source case; the new count and conditions come from Lecture 2 p. 1 |
| Survey: compare conditional 60% with marginal 50% | How can all counts verify the same conclusion directly? | Read row/column totals and use the equivalent product test | Original raster table on Lecture 2 p. 2; product rule on p. 1 |
| Bilingual club: 40 members, 10 playing chess, 4 playing both | Which group should the club use when asking about chess players? | Reference group and denominator choice in `conditional-practice` | Author-created case; first introduced alongside the source's 100/40/24 example |
| Bilingual club: calculate 4/10 | What if only probabilities are supplied? | (4/40)/(10/40) = 40%, with positive-denominator condition | New counts applying Lecture 1 p. 2; return to original source calculation 24/40 = 60% afterward |

The bilingual fixture covers the two pages of the conditional-probability source and uses a separate clinic scenario in its later review fragment. It does not cover the independence lecture. Its source survey and return calculation preserve the source example; the club case and prerequisite questions are author-created. All substantive new prose and controls have Chinese translations; mathematical notation is preserved.

## Formula meanings and practice progression

The visible tables in `survey-formula-meaning` and `club-formula-meaning` connect plain-language groups to counts and probability symbols before substitution. They identify every total and overlap, distinguish events from counts, and state that probability has no units. The source formula is a definition with a positive-denominator condition; cancellation and terminating decimal conversions are exact. Uniform selection is an explicit interpretation assumption for these finite-group examples, and neither source counts nor club counts are claimed to predict future populations. No independence assumption is introduced.

| Learning objective | Formula / method and worked example | Completion problem | Independent transfer and explanation | Verified reasoning and provenance |
|---|---|---|---|---|
| Choose a conditional reference group, compute its probability and check applicability | `calculation`: source survey P(E \| S) = (24/100)/(40/100) = 24/40 = 0.60, with P(S) > 0 | `survey-completion`: given the completed complement count 40 − 24 = 16, choose the missing denominator in 16 / ? and enter the final probability; an optional hint names S | `library-independent`: a different library has 90 books, 21 borrowed, 7 borrowed books needing repair; `library-reflection` asks why the denominator applies, when defined and what is rounded | Completion: 16/40 = 0.4 exactly, with 0.4 + 0.6 = 1. Transfer: (7/90)/(21/90) = 7/21 = 1/3 ≈ 0.333. New exercises applying Lecture 1 p. 2; uniform selection stated in the transfer prompt. |
| Apply the same method in both languages and distinguish exact calculation from rounding | `conditional-general-rule`: author-created club P(T \| C) = (4/40)/(10/40) = 4/10 = 0.4, returning to the source's 24/40 example | `club-completion`: given 10 − 4 = 6, choose the denominator in 6 / ? and enter the final probability; an optional hint names C | `garden-independent`: 45 plants, 15 shaded, 5 shaded plants flowering; `garden-reflection` checks group, positive denominator and rounding | Completion: 6/10 = 0.6 exactly, with 0.6 + 0.4 = 1. Transfer: (5/45)/(15/45) = 5/15 = 1/3 ≈ 0.333. All club/garden counts are author-created; the rule and condition cite Lecture 1 p. 2. |

Each completion provides the initial counting step and leaves the choice of group and final calculation to the learner. Independent prompts provide no intermediate steps or hints. Their hidden solutions explain notation, rescaling, the positive denominator and why the whole-population denominator answers a different question. The source worked steps remain visible.

Numeric completion answers use zero absolute tolerance because they are exact terminating values. Independent answers use the numeric target 0.3333333333333333 with absolute tolerance 0.0005, matching rounding to three decimal places: 0.333 and exact 1/3 are accepted, whereas 0.332 and 0.334 are not. Inputs accept equivalent decimals, fractions and percentages; prompts name the unitless probability. Reflection submissions reveal self-check points rather than grading prose. All added bilingual text has reviewed Chinese translations, including labels, hints and full solutions; common control translations come from the template. These synthetic checks verify the examples, not learning outcomes.

## Concept evidence and later retrieval

The concept lists are separate from the glossary. Prerequisite checks remain unmapped because they diagnose supporting knowledge rather than the declared course targets. The mappings below describe authoring, not measured learning outcomes.

| Course / concept | First-lecture activities | Later-lecture activities | Purpose and verified reasoning |
|---|---|---|---|
| Primary / `reference-denominator` | `survey-quiz`, `survey-completion`, `library-independent`, `library-reflection`, `transfer-quiz` in `conditional-probability` | `clinic-review` in `independence` | Retrieve the earlier conditional reference-group decision while studying independence. New clinic counts: 120 appointments, 30 in the morning, 9 morning follow-ups. P(F \| M) = (9/120)/(30/120) = 9/30 = 0.3 = 30%, exact; P(M) > 0. Uniform selection is stated. Neither the joint share 9/120 nor the marginal morning share 30/120 answers the question. |
| Primary / `independence` | None: introduced in Lecture 2 | `independence-quiz-question` in `independence` | Preserve the source comparison P(E \| S) = 0.60 ≠ P(E) = 0.50 with P(S) > 0. This concept has one authored graded question, so the review panel may recommend it again; it has no claimed extra variant. |
| Bilingual / `reference-denominator` | `bilingual-quiz`, `club-completion`, `garden-independent`, `garden-reflection` in `conditional` | `bilingual-clinic-review` in `review`, from separate `bilingual-review.html` | Move from club/garden to the new clinic setting rather than repeat the same lesson fragment. The clinic calculation and conditions match the primary course's verified new scenario; the prompt, optional hint, exact-answer label and complete reasoning have Chinese translations. |

The clinic exercises are labeled “Author-created cumulative review · New setting and numbers.” Both cite Lecture 1 physical page 2 for the conditional-probability rule; their appointment counts are newly authored, not attributed to the source. The optional hint asks which appointments can be selected and directs attention to the eligible denominator without giving its numerical size or the final probability. No intermediate calculation is supplied in the prompt. The numeric target is `0.3` with zero absolute tolerance, matching the exact-answer request; decimal `0.3`, fraction `9/30` and percentage `30%` represent the same value.

Mapped reflection activities record self-assessment, not correctness. The concept-review panel distinguishes recorded hints, wrong answers, voluntary solution views, supported correct answers and answers correct without recorded support. It links back to authored activities; it does not invent variants. The later question is immediately available, so its location alone does not prove a time interval or independent recall. Reading progress remains separate. The 1/3/7-day recommendations use activity evidence and elapsed time as a simple heuristic, with recent history kept in browser storage when available; they make no mastery or learning-effect claim.

## Predict → operate → explain explorations

The source table remains unchanged. The new diagram in Lecture 2 follows the table with an author-created what-if activity; its initial counts exactly reproduce the source. Prediction and reflection fields are optional, ungraded notes. The visible explanation includes the complete baseline and comparison reasoning even without JavaScript; operating the diagram does not gate any content.

| Activity and learning question | Prediction and control | Invariants and verified settings | Explanation prompt and provenance |
|---|---|---|---|
| `survey-overlap`: which overlap makes the conditional and marginal probabilities equal? | Predict the effect of reducing overlap 24; vary x from 0 to 40 | N=100, A=economics=50, B=statistics=40. Cells (both, B-only, A-only, neither) are (x,40−x,50−x,10+x). At x=24: (24,16,26,34), conditional 60%, marginal 50%. At x=20: (20,20,30,30), both probabilities 50%, and joint 20% equals the product. Endpoints x=0 and 40 give conditional 0% and 100%, with nonnegative cells and unchanged margins. | Explain the numerator change and compensating cell counts. Baseline counts: Lecture 2 p. 2; independence tests: p. 1. Every alternate setting is hypothetical, not revised source evidence. |
| `club-overlap`: how does changing overlap affect the probability within a fixed reference group? | Predict moving from 4 to 6 members doing both; vary x from 0 to 10 | N=40, A=tennis=16, B=chess=10. Cells are (x,10−x,16−x,14+x). At x=4: (4,6,12,18), conditional 40%; at x=6: (6,4,10,20), conditional 60%; marginal remains 40%. Endpoints give conditional 0% and 100%. | Explain counts, denominator and fixed whole-club share. The entire club scenario is author-created; the new total of 16 tennis players is explicitly added for this activity. Conditional rule: Lecture 1 p. 2. No independence claim or new source coverage is introduced. |

Both activities state uniform selection and a positive fixed conditioning group, so count ratios represent probabilities. All row/column margins are conserved, and the displayed values are exact for these chosen counts. The bilingual activity translates every new authored text node; generated labels/status come from the shared template. Reset restores the starting overlap while preserving both notes, and language changes preserve the current overlap and notes. These are interface and reasoning checks, not evidence of learning or validation on teacher PDFs.
