# Review teaching and gather learner evidence

Use this workflow after authoring, alongside the coverage map and [teaching guidance](teaching.md). Its purpose is to find and repair teaching gaps, then record what was actually checked. A working website and plausible explanations do not establish that students learned.

Copy [the teaching review template](../assets/review/teaching-review-template.md) and [the learner trial template](../assets/review/learner-trial-template.md) into the working review folder. Prepare trial tasks even when no students are available, leaving actual observations marked not run. Keep these authoring records outside the generated website; they add no `course.json` fields, runtime feature, tracking, or build dependency. Start a new record for each reviewed course version and link it to its predecessor.

## Keep three kinds of evidence separate

| Evidence | What to record | What it can establish |
|---|---|---|
| Static and functional checks | Course version, check/browser, language, result and output or reproduction steps | The specific content or interaction checked works under those conditions. |
| Content reviewer judgment | Reviewer or agent role, source pages, exact lesson location, reasoning and unresolved gaps | An identified reviewer judged the explanation and assessment against stated criteria. An agent review is labeled as such. |
| Actual learner observations | Voluntary anonymous participant ID, version/language, exact responses, assistance and timing | What that participant said or did in those conditions. |

Use `not checked`, `gap`, or `reviewed` for content review; reserve `not run`, `observed`, or `missing evidence` for trials. Never prefill success. Synthetic responses, agent simulations, inferred reactions, scrolling and automatic quiz scores are not actual learner observations. If no learner participates, say **learner trial not run; learning effectiveness unverified**. Technical success and reviewer approval cannot fill that evidence gap. A small trial can reveal difficulties; it does not by itself show a learning gain or a general effect.

## Review each core learning objective

1. Make the objective observable: explain a relationship, justify a step, choose an applicable method, or solve a variation. Link its in-scope physical source pages and an explanation at an exact local `page.html#anchor`.
2. Link the worked example, assessment and assessment criterion. Use exact anchors on relevant elements; if absent, add stable IDs to the authored HTML. Include reasoning or applicability in the criterion when a correct choice or number can hide a mistake. For application objectives, check the worked → completion → independent sequence where appropriate, and identify a new situation that checks transfer. Record missing links as gaps; do not invent coverage. Explain genuine exceptions, such as a concept without a numerical worked example.
3. Read the explanation independently of the PDF, then compare it with the source. Find any skipped inference, undefined symbol/unit/reference group, unstated condition, inaccurate equality or approximation, unsupported claim, and misleading analogy. Note exactly where an analogy stops applying. Check that essential reasoning is visible and the learner has an opportunity to explain or apply it beyond the running case.
4. Review each enabled language. Check whether translations preserve reasoning, conditions, questions and hint restraint. Record the first weak sentence or step and its language, rather than only saying a chapter is confusing.
5. Recalculate examples and assessment solutions independently. Check that the criterion would distinguish sound reasoning from a lucky answer or memorized imitation. Record the judgment and its supporting location, not a mastery score.

Prioritize missing or incorrect reasoning that blocks a core objective before optional presentation polish. Reuse existing coverage-map entries by linking them; no second machine-readable schema or arbitrary quota is needed.

## Run a small, voluntary learner trial when available

The author can hand the invitation in the trial template to suitable students. The invitation is a draft for the user to send manually; this workflow does not recruit, message anyone, or assume access to students. Use local anonymous IDs such as `L01`, omit names/contact details/student numbers, and record only what is needed to repair the lesson. Participation and each question are voluntary; participants may stop or skip. Agree what will be recorded before starting, and do not publish identifiable responses.

Before the session, choose the objective, exact course version, language, unseen task and rubric. Prepare a parallel task for a delayed check, with changed numbers or context but the same target reasoning; set the planned interval. Keep solutions hidden until an initial response is recorded. The rubric should ask for an explanation, relevant conditions and application/transfer, as appropriate to that objective.

During the session:

1. Let the participant read and use the course normally. Ask them to point to the **first** sentence or step they cannot follow. Record its exact text, local page/anchor, language and their description of the difficulty. If none is reported, record that; do not infer complete understanding. If they stop or decline, record the missing evidence.
2. Ask for a short explanation in their own words and an initial unassisted answer to the chosen new problem, including why the method applies. Record the response before evaluating or giving help. Note any previous exposure to this task or available solutions. An answer already assisted cannot later be relabeled unassisted.
3. Record every hint, solution reveal or reviewer intervention separately, then record any revised response. Distinguish an independent answer from one reached with assistance.
4. At the planned later time, offer the parallel problem without the earlier solution in view. Record both the planned and actual interval, actual attempt time, response/reasoning, assistance and relevant intervening practice. Record a missed follow-up as missing evidence. An immediate retry cannot substitute for delayed retention evidence.

Evaluate each response against the prewritten rubric with a short explanation. Report what was observed, including uncertainty and absences: “L01 justified the method on this unseen task without a hint,” rather than “students mastered the concept.” Immediate and delayed results support different, limited observations. Do not claim improvement without an appropriate comparison; repeated-task familiarity, assistance and changed course versions limit comparisons.

## Close the feedback loop

For each actionable finding, record **evidence and location → priority → proposed correction → revised version → re-review or retest result**. Check the revised explanation against the source and rerun affected functional checks. For learner-reported problems, offer a new equivalent problem when a participant is available; separately record assisted retries or repeated problems. Do not treat the original observation as evidence for the revised version.

Mark a finding resolved only for the evidence actually collected. For example, “reviewed correction; learner retest not run” is a valid partial outcome. Keep remaining gaps, missing follow-ups and any limits in the delivery note. Delivering a course does not require inventing learner evidence or waiting indefinitely for volunteers.
