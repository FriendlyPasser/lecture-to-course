# Prepared learner trial for the synthetic demos

**Status: prepared, not run.** No participant, response, timing, score, quote or learning gain has been recorded. Questions below are fresh, author-created assessment material; they are not from the synthetic PDFs or a teacher. Codex checked the answer arithmetic and review criteria against the merged `afa88de` lesson baseline, including its overlap explorations and new clinic review. The mugs, counters, tickets and batteries use different contexts and counts from that clinic task. This is a small formative review plan, not a validated measurement instrument or a causal effectiveness study.

Use with [teaching-review.md](teaching-review.md). It identifies gaps the trial should probe; trial questions do not add missing assessments to the built-in lesson. The [reusable trial record](../lecture-to-course/assets/review/learner-trial-template.md) supplies a manual English/Chinese invitation and a versioned feedback → correction → re-review/retest log.

## Facilitator setup

1. Use the [demo setup](../README.md#try-the-demo) and build the primary course from `demo/course.json`. Build `demo/bilingual-course.json` into a separate new/empty output directory using the same builder, for example `python -B lecture-to-course/scripts/build_course.py demo/bilingual-course.json --out .local/trial-bilingual/site`. Launch its generated `launch_course.py` when testing that variant. Record the Git revision, build directory, date, browser, opening method and language before starting. Build/interaction failures belong in a separate technical log.
2. Invite an actual learner familiar with basic fractions and sets but not assumed to know conditional probability. Ask for consent to retain anonymous notes; they may skip any question or stop. Use an anonymous code, not names. Record previous probability study and self-described comfort with fractions/intersections. Optional course prerequisite checks are diagnostics, not a pretest of the new topic.
3. Assign either the primary path (both lessons, including the clinic review, English) or the bilingual path (the conditional lesson and separate clinic review page, English or Chinese chosen by the learner). For an initial small review, seek more than one learner per path if available; report the actual count, never the planned count as a result. If one person tries both paths, record the order and prior exposure; do not treat the second path as an independent comparison. Both paths contain the same clinic question, so its second appearance is repeated exposure.
4. Copy only the relevant learner packet below to a separate sheet. Keep the facilitator key and the delayed packet out of view. Do not send this entire document to a participant. Permit a basic calculator, using the same rule at both sessions; record its use. No notes, lesson, internet, hints or answer key during the first immediate and delayed attempts. These are assessment intervals, not restrictions on normal course access.
5. Plan one reading session with an immediate task (about 20–35 minutes for primary, 15–25 for bilingual, flexible for the learner), and a delayed session **48–72 hours later** (about 10 minutes). The optional overlap probes below cover newly displayed exploration objectives; allow extra time if using them, or record those objectives as not collected. Record actual times and elapsed hours. Do not fabricate follow-up results if a learner does not return. Ask about intervening study or seeing solutions; record it as exposure that limits interpretation.

All fields below start as **pending**. “No difficulty reported” or “no hint used” may be entered only after observation. “Not collected” describes missing evidence; it is different from an incorrect answer.

## Session procedure and assistance record

During normal reading, allow the lesson's optional checks, hints, glossary, language switch, explorations, concept review and voluntary solutions. Record their use, including whether a quiz explanation appeared automatically after a correct attempt. For an exploration, preserve the prediction before slider use where possible and record whether its visible worked explanation was read before the prediction or reflection. For the clinic review, record first response, explanation in the learner's own words if offered, and any hint/solution exposure. Ask the learner to say when a sentence first becomes unclear, without suggesting which sentence should confuse them. Capture that sentence immediately before offering explanation. Do not guide their attention to review findings G2/G3 in advance.

If local concept records are inspected, save their activity IDs, attempt/support history and observation time as supplementary context. Note prior use, resets, or missing history if known. A displayed concept state or stored correct answer does not establish who attempted it, the quality of their reasoning, or an observed time delay. Preserve the actual participant's first responses and assistance record separately; do not substitute app records for the trial or copy technical-test interactions into learner results.

After reading, close the course and collect the relevant immediate packet below. Preserve the first written or spoken response verbatim before giving feedback. Ask for their reasoning even if the number is correct. If they request help, first record their unaided attempt or refusal. Only then offer a targeted hint from the key, followed by a separate second response if they want one. Offer the full answer only after saving prior responses, and record exposure. Do not replace the unaided response with the final corrected response.

For the delayed session, first record the actual delay and any intervening practice, hints or answer exposure, including clinic practice and concept-review links. Give the **new delayed packet**, with the course and previous answers closed. Apply the same assistance procedure. The fresh clinic question in `review.html` is an in-course retrieval opportunity; completing or reopening that page alone is not this timed, observed delayed assessment.

| Assistance code | Meaning and what to record |
|---|---|
| U — unassisted assessment attempt | No lesson, notes, hint, solution or substantive facilitator prompt used for this attempt. Record language, calculator use and prior study exposure separately. Normal earlier lesson reading does not invalidate U, but it must be documented. |
| H — after a hint | Record the exact hint, its source and timestamp, then the separate response. Correct after H is evidence of assisted performance, not unassisted success. |
| R — after answer exposure | Record the solution or answer shown and when, including automatic explanations. Subsequent reproduction of that answer is not independent transfer. |
| S — self-correction without help | Preserve original and revised responses and why the learner changed them. Identify whether revision was before or after submission; do not silently overwrite first-attempt results. |
| N — not attempted / not collected | Record reason if offered; do not assign a zero that suggests a demonstrated misconception. |

## Learner packet P-I: primary demo, immediate

These questions are new examples. Explain your reasoning in your own words; an answer alone is not enough. You can stop or ask for help at any time. First try with the lesson and notes closed.

**P-I1 — Read and apply.** A shop records 120 mugs. One mug is selected uniformly from the group named in each question. B means blue; C means chipped.

| | Chipped C | Not chipped | Total |
|---|---:|---:|---:|
| Blue B | 18 | 12 | 30 |
| Not blue | 42 | 48 | 90 |
| Total | 60 | 60 | 120 |

a. Among blue mugs, what is the probability of a chipped mug? Show the fraction and explain both counts.

b. Among all mugs, what is the probability that a mug is both blue and chipped? Explain why its denominator differs from (a).

c. Are being blue and being chipped independent in this recorded collection? Show a conditional-versus-marginal comparison and a joint-versus-product comparison. Explain why those two tests should give the same decision here.

d. **Optional overlap probe (P6).** In a hypothetical rearrangement, keep all row and column totals fixed but change the blue/chipped cell from 18 to 15. Before calculating, predict how the conditional probability changes. Give the new four cell counts and explain whether the two independence tests now hold.

**P-I2 — Explain the limits.** Imagine another recorded collection has no blue mugs. Can the same conditional formula return P(C given B) = 0? Explain. Also explain why a calculation from the first collection alone does not establish the probability for all future mugs.

## Learner packet P-D: primary demo, delayed

These questions use a different collection. First try with the lesson, notes and your earlier answers closed; explain your steps.

**P-D1 — New table.** There are 160 counters. G means green; M means marked. Selection is uniform within whichever group the question specifies.

| | Marked M | Not marked | Total |
|---|---:|---:|---:|
| Green G | 16 | 48 | 64 |
| Not green | 24 | 72 | 96 |
| Total | 40 | 120 | 160 |

a. Find the probability of being marked among green counters and the probability of being both marked and green among all counters. Explain each denominator.

b. Decide whether G and M are independent. Demonstrate both tests and explain why comparing the answer “among green” only with the answer “both marked and green” is insufficient.

c. **Optional overlap probe (P6).** Keep all row and column totals fixed but change the green/marked cell from 16 to 24. Predict the change in conditional probability, then give the four new cell counts and check both independence tests. Explain why the marginal marked probability stays fixed.

**P-D2 — Reconstruct the reasoning.** Explain in your own words how dividing the joint probability by P(G) gives the conditional probability in this example. State the condition for that division. What would change if the collection contained no green counters? Do the counts alone establish probabilities for future collections?

## Learner packet B-I: bilingual demo, immediate

Give the chosen language version only. Learners may answer in English or Chinese; record any language change. The two versions are the same task, not two trials.

**English.** An event has 72 tickets. Of the 18 tickets booked online, 7 are discounted. One online ticket is selected uniformly at random. Let O mean booked online and D mean discounted.

1. Find P(D given O). Show the exact fraction, then round the probability to three decimal places. Explain the numerator, denominator and which part is approximate.
2. If one ticket is instead selected uniformly from all 72 tickets, what is the probability that it is both online and discounted? Why does this answer a different question?
3. Explain how probabilities measured over all tickets can give your conditional answer. What must be true of P(O)? If there are no online tickets, is the conditional formula's answer zero? Explain.
4. **Optional overlap probe (B4).** Also suppose 24 of all 72 tickets are discounted. Keep 18 online and 24 discounted fixed, but hypothetically increase online discounted tickets from 7 to 9. Predict the change in P(D given O), then give all four online/offline and discounted/not-discounted cell counts. Explain why the overall discounted probability stays fixed.

**简体中文。** 一场活动共有 72 张票，其中 18 张在网上预订，这 18 张中有 7 张是优惠票。从网上预订的票中等可能地随机抽取一张。用 O 表示网上预订，用 D 表示优惠票。

1. 求 P(D given O)，即已知在网上预订时，是优惠票的概率。写出精确分数，再将概率四舍五入到小数点后三位。解释分子、分母，以及哪部分是近似值。
2. 如果改为从全部 72 张票中等可能地随机抽取一张，它既是网上预订又是优惠票的概率是多少？为什么这回答了另一个问题？
3. 解释如何利用以全部票为参照计算的概率，得到条件概率的答案。P(O) 必须满足什么条件？如果没有网上预订的票，这个条件概率公式的结果是零吗？请解释。
4. **可选交集探究（B4）。** 再假设全部 72 张票中有 24 张优惠票。保持网上预订总数 18 和优惠票总数 24 不变，假设网上预订的优惠票由 7 张增加为 9 张。先预测 P(D given O) 如何变化，再写出网上／非网上预订与优惠／非优惠对应的四个格子中的票数。解释为什么全部票中的优惠票比例保持不变。

## Learner packet B-D: bilingual demo, delayed

Give the chosen language version only, without the immediate packet or its solution.

**English.** A lab records 96 batteries. Of the 22 rechargeable batteries, 8 failed a test. One rechargeable battery is selected uniformly at random. Let R mean rechargeable and F mean failed.

1. Find P(F given R). Show the exact fraction and a probability rounded to three decimal places. Explain why your denominator is appropriate and why rounding does not change the exact fraction.
2. For uniform selection from all 96 batteries, find the probability of being both rechargeable and failed. Explain the difference from question 1, and show how dividing probabilities can recover the conditional answer.
3. When would that conditional ratio be undefined? Does the formula require independence? Do these recorded counts alone predict the outcome for every future battery? Explain each answer.
4. **Optional overlap probe (B4).** Also suppose 32 of all 96 batteries failed. Keep 22 rechargeable and 32 failed fixed, but hypothetically increase failed rechargeable batteries from 8 to 11. Predict the change in P(F given R), then give all four rechargeable/non-rechargeable and failed/passed cell counts. Explain why the overall failure probability stays fixed.

**简体中文。** 实验室记录了 96 节电池，其中 22 节可以充电，这 22 节中有 8 节未通过测试。从可充电电池中等可能地随机抽取一节。用 R 表示可充电，用 F 表示未通过测试。

1. 求 P(F given R)，即已知可充电时，未通过测试的概率。写出精确分数，并将概率四舍五入到小数点后三位。解释为什么选择这个分母，以及为什么四舍五入不改变精确分数。
2. 如果从全部 96 节电池中等可能地随机抽取一节，求它既可充电又未通过测试的概率。解释它与第 1 题的区别，并说明如何通过概率相除得到条件概率。
3. 这个条件概率比值在什么情况下没有定义？公式是否要求事件相互独立？仅凭这些电池的记录，能预测每节未来电池的测试结果吗？请分别解释。
4. **可选交集探究（B4）。** 再假设全部 96 节电池中有 32 节未通过测试。保持可充电总数 22 和未通过总数 32 不变，假设未通过的可充电电池由 8 节增加为 11 节。先预测 P(F given R) 如何变化，再写出可充电／不可充电与未通过／通过对应的四个格子中的电池数。解释为什么全部电池中的未通过比例保持不变。

## Observation sheet — all actual observations pending

Copy one sheet per actual participant. Store completed notes privately and share only consented, anonymized excerpts.

| Field | Actual observation |
|---|---|
| Anonymous code / consent / prior probability experience | Pending |
| Revision / build / path / language / device / date | Pending |
| Reading duration / prerequisite checks skipped or attempted | Pending |
| Hints, glossary, solutions and language switches during reading, with times | Pending |
| Exploration prediction / slider use / prior reading of worked explanation | Pending |
| Clinic review first response / denominator explanation / hints and solution exposure | Pending |
| Concept activity records, observation time and known prior use or resets (supplementary only) | Pending |
| First unclear sentence — exact quote, page/fragment + anchor and language | Pending; do not prefill a reviewer candidate |
| Learner's explanation of that difficulty, verbatim; help already received | Pending |
| No unclear sentence reported, if actually observed | Pending |
| Immediate task ID / exact first response / time / assistance code | Pending |
| Learner explanation of key steps, verbatim | Pending |
| New-problem calculation and explanation, scored separately against key | Pending |
| Exact hint or revealed answer, time, and separate post-help response | Pending |
| Delayed appointment / actual elapsed hours / intervening study or answer exposure | Pending |
| Delayed task ID / exact first response / time / assistance code | Pending |
| Delayed explanation and calculation, separately scored | Pending |
| Optional overlap probes used or skipped / additional time / uncollected objective | Pending |
| Missing response or lost follow-up and reason, if known | Pending |
| Resulting content revision / evidence to recheck after revision | Pending |

For every criterion, record **met / partial / not met / not collected** and the evidence supporting that decision. “Partial” means a correct element is present but required reasoning is missing or inconsistent; copy the problematic reasoning. Keep assistance code beside each judgment. Do not collapse correct arithmetic and faulty reference-group reasoning into “passed.”

## Facilitator key — keep separate from learner packets

The key below has been arithmetically checked. Its worked reasoning is assessment guidance, not learner performance. Equivalent fractions and valid explanations in either language are accepted. Where three decimals are requested, distinguish a correct exact fraction from failure to round as instructed; do not mark the underlying concept wrong only for that formatting issue.

| Task | Checked answers and criterion for “met” |
|---|---|
| P-I1a (P1/P2/P3) | 18/30 = 3/5 = 0.6. Names the 30 blue mugs as eligible and the 18 blue/chipped mugs as the successful subset. A bare 0.6 does not meet the explanation criterion. |
| P-I1b (P2/P5) | 18/120 = 3/20 = 0.15; both properties form the numerator but all 120 mugs are eligible. Distinguishes the joint question from the conditional question. |
| P-I1c (P4/P5) | P(C given B) = 0.6 differs from P(C) = 60/120 = 0.5; joint 0.15 differs from P(C)P(B) = (60/120)(30/120) = 0.125. Therefore not independent. For the equivalence explanation, uses P(C given B) = P(C ∩ B)/P(B) and multiplying/dividing by positive P(B) = 1/4. A correct dependence decision without the requested extracted totals/tests is partial. |
| P-I1d, optional (P6) | In table reading order, new cells are 15, 15, 45, 45; all margins stay fixed. Conditional falls to 15/30 = 0.5, matching marginal 60/120 = 0.5. Joint 15/120 = 0.125 equals (30/120)(60/120), so independent. Require the prediction, cell accounting and both tests, not just a correct final decision. |
| P-I2 (P3, assumption check) | No blue mugs means P(B) = 0 and the ratio is 0/0, undefined; not a defined zero probability. Recorded counts describe this finite collection under the stated selection rule; future populations need additional justification. Score these two explanations separately. |
| P-D1a (P1/P2/P3/P5) | Conditional 16/64 = 1/4 = 0.25; joint 16/160 = 1/10 = 0.10. Names green counters versus all counters as the groups. |
| P-D1b (P4/P5) | P(M given G) = 1/4 = P(M) = 40/160, and P(M ∩ G) = 1/10 = (40/160)(64/160) = (1/4)(2/5). Independent in this collection. Comparing 0.25 only with joint 0.10 compares different events/reference questions; independence compares the same event's conditional and marginal probabilities, or joint with the marginal product. |
| P-D1c, optional (P6) | New cells are 24, 40, 16, 80. Conditional rises to 24/64 = 3/8 = 0.375 while marginal remains 40/160 = 0.25. Joint 24/160 = 0.15 differs from (40/160)(64/160) = 0.1, so dependent. Explain that increasing the overlap changes the numerator but preserves the 64 denominator and 40 marked total. |
| P-D2 (P1/P3/P4) | (16/160)/(64/160) = 16/64; the common total cancels and the reference group becomes G. Requires P(G) > 0; with no green counters the conditional ratio is undefined, though the product definition of independence still makes sense. Counts alone do not establish future-collection probabilities. Score reasoning, condition and population limit separately; naming the product's zero-event behavior is acceptable additional detail, not required for P3. |
| B-I1 (B1/B3) | 7/18 ≈ 0.389. Online tickets are the group of 18, with 7 discounted within it. Fraction exact, decimal rounded; probabilities have no units. Require both reasoning and calculation. |
| B-I2 (B1/B2) | 7/72; all tickets are eligible and both online/discounted form the counted subset. No decimal needed. This is joint, not conditional. |
| B-I3 (B2) | (7/72)/(18/72) = 7/18. Requires P(O) > 0; if online count is zero, the ratio is undefined, not zero. Require an explanation of the cancellation or change of reference group. |
| B-I4, optional (B4) | Conditional rises from 7/18 to 9/18 = 0.5. Cells (online discounted, online not discounted, offline discounted, offline not discounted) are 9, 9, 15, 39. Numerator changes, denominator stays 18, and overall discounted probability stays 24/72 = 1/3. Require the prediction, consistent counts and explanation; no independence decision is requested. |
| B-D1 (B1/B3) | 8/22 = 4/11 ≈ 0.364; group is 22 rechargeable batteries. Exact fraction is unchanged; decimal is an approximate representation. |
| B-D2 (B1/B2) | Joint 8/96 = 1/12. Conditional (8/96)/(22/96) = 8/22. Distinguishes all batteries from rechargeable batteries and explains cancellation. |
| B-D3 (B2/B3) | Requires P(R) > 0; zero rechargeable batteries give an undefined ratio. Conditional probability does not require independence. Fixed recorded counts under uniform selection do not by themselves predict each future battery. Score the three explanations separately. |
| B-D4, optional (B4) | Conditional rises from 8/22 to 11/22 = 0.5. Cells (rechargeable failed, rechargeable passed, non-rechargeable failed, non-rechargeable passed) are 11, 11, 21, 53. Numerator changes, denominator stays 22, and overall failure probability stays 32/96 = 1/3. Require prediction, counts and explanation; no independence decision is requested. |

The reference-group explanations in P-I1a/P-D1a also probe P7; B-I1/B-D1 also probe B5. In-course clinic correctness is additional activity evidence, not a substitute for those first explanations. Optional P6/B4 probes may be omitted; mark them **not collected** and avoid claiming those objectives were assessed.

For P-I/P-D, permissible targeted hints are “Which row or column answers the group named in this question?” for a denominator error and “Which probability for the same event should be compared before and after the condition?” for independence. For B-I/B-D, use “Which objects are eligible to be selected in this question?” For a zero-group difficulty, use “What operation would you be asking the formula to perform?” Give only the relevant hint after recording the first response; record its exact wording and any spontaneous extra help. A hint-assisted answer remains H. If a learner asks to see the solution, show the matching key after saving their attempt and mark R. Do not withhold a requested answer to preserve a score.

## Reporting after an actual trial

Report actual participants and follow-ups, lesson revision, language, delay and exposure, then present three separate findings: (1) what learners could explain in their own words, (2) how they handled the immediate new problem, and (3) what they independently reconstructed on the delayed new problem. For each, separate U, H and R; include missing data and the exact evidence behind misconceptions. Report the first unclear sentence verbatim and any corresponding content revision.

At present all three findings are **pending**. Static checks and the completed AI content review may be reported now with their own limitations. This protocol has no randomized comparison and no matched pretest of the new content: even after running it, do not turn a few correct answers into a claim that the course caused improvement. Use observed difficulty to choose the next revision and recheck that revision with new tasks.
