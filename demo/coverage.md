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

Each primary lecture and the bilingual fixture keeps its three existing core sections and stable
section IDs. The opening route is optional navigation: its question links show the order and explain
why each step is needed. Every core section has a question heading, a visible section objective, an
opening connection to prior knowledge, and an ending question that motivates the next step. The
prerequisite checks remain optional and separate from this core sequence; no sections were added to
meet a length or count target.

| Lecture / section | Question and section objective | Starting dependency | Ending question / next step |
|---|---|---|---|
| 1 / `reference-group` | Among which students? Identify the eligible group and justify the denominator 40. | Part-to-whole fractions and overlapping groups, optionally reviewed in the precheck. | How can the same restriction be expressed with probabilities? Continue to `calculation`. |
| 1 / `calculation` | How does the formula keep the same reference group? Derive 24/40, distinguish it from 24/100, and state the positive-denominator condition. | The 40 statistics students have already been selected as the reference group. | Can the learner select the group without the worked steps? Continue to `check-understanding`. |
| 1 / `check-understanding` | Can you choose the group in a new problem? Solve the survey and library questions by naming the group first. | The numerator counts both events within the group selected by the denominator. | Does knowing S change the probability of E? Lecture 2 supplies the missing marginal share. |
| 2 / `independence-test` | Does the information change the probability? Compare P(E given S) with P(E) and interpret the difference. | Lecture 1's distinction between conditional and joint probability; compare the same event before and after learning S. | How can all the counts check the same conclusion? Continue to `read-table`. |
| 2 / `read-table` | How can the table check the same conclusion? Calculate joint and marginal shares from totals and apply the product equality. | The prior conditional comparison and the equivalent product test. | Which comparison is valid evidence, and why are subject names insufficient? Continue to `independence-quiz`. |
| 2 / `independence-quiz` | Which comparison justifies the conclusion? Explain a valid comparison and reject unsupported reasons. | Both numerical checks and the conditional test's applicability condition. | Which probabilities and conditions would another pair of events require? A final transfer prompt, not a new lecture or a scored claim of mastery. |
| Bilingual / `conditional-intuition` | How does the condition choose the group? Identify the selected group in the source survey and club case. | A fraction compares a part with a chosen whole; optional prerequisite review is available. | Which group should the four members be compared with? Continue to `conditional-practice`. |
| Bilingual / `conditional-practice` | Which group belongs in the denominator? Choose the club denominator and explain why using all members answers a different question. | The selected chess group and intersection idea. | How can probabilities recover the answer 4/10? Continue to `conditional-general-rule`. |
| Bilingual / `conditional-general-rule` | How can probabilities recover the same answer? Derive 4/10 from probability shares and explain the positive denominator. | The club's count ratio, with the reference group held fixed. | For a new condition, which group supplies the denominator and is its probability positive? A final application prompt. |

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

The bilingual fixture covers the two pages of the conditional-probability source only and reuses the same fragment for a review page. It does not cover the independence lecture. Its source survey and return calculation preserve the source example; the club case and prerequisite questions are author-created. All substantive new prose and controls have Chinese translations; mathematical notation is preserved.
