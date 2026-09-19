# Teaching concepts from lecture PDFs

Write for a student taking this subject. Infer the expected depth from the lecture; explain missing prerequisites locally without replacing the course with a beginner overview. The lecture sets the knowledge scope, while the lesson supplies a coherent path to understanding it.

## Map before writing

For each source page record the concept, reliable text/formulas, visual evidence, uncertainties, prerequisite concepts, what the learner should be able to do, and destination chapter. For each core section, also record its guiding question, learning objective, the prior result it depends on, and its next question. Explain omissions such as repeated outlines. Keep this coverage map in the working folder; it is an authoring aid, not a new course JSON schema.

Keep lecture boundaries. Within a lecture, combine pages about the same idea and reorder them when dependencies or motivation justify it. Record the regrouping in the map. Retain significant derivations, assumptions, and key teacher examples, even when a simpler example introduces them first. For an excerpt, state the physical page range and explicitly exclude the rest from coverage claims.

## Connect the questions within a lecture

Give each core teaching section a question to resolve and a clear objective describing what the learner can explain, decide or do afterward. Use that question to choose the section's scope; a slide title or topic label alone rarely makes the learning task clear. Begin with a brief connection to the relevant prerequisite or earlier result. End by stating what has been established and why the next question now matters. The final section can lead to a synthesis or transfer question, or a supported connection to the next lecture; do not invent additional content merely to continue the chain.

Make the relationship specific. “Next: independence” names a topic; “We can now calculate a probability within a group. Does knowing the group change that probability?” explains why comparing conditional and marginal probabilities is the next step. These connections can be ordinary prose and can continue the running case below; avoid duplicating the same transition in several boxes.

Let concepts determine the number and length of sections. Keep one argument, its assumptions and necessary worked steps together instead of splitting every slide, formula or teaching move into a separate section. A short excerpt may need only one core section.

When several dependencies or branches need orientation, add a concise learning route or concept map near the start. Label what each link means, such as “uses the chosen reference group” or “compares with the original population,” and connect it to the relevant section. Keep it readable in both languages and understandable without color. Omit it when the section transitions already make a short lesson's path clear; a second table of contents adds little.

During review, follow the section questions in order: does each objective match the explanation and practice, is the knowledge it relies on available, and does its closing bridge motivate the actual next section? A route must describe the authored lesson, not a broader course that the supplied material does not cover. A working anchor verifies navigation only, not the correctness of a claimed dependency.

## Build an explanation the learner can follow

Start with what the student will learn to explain or do. A useful teaching progression is: a problem worth solving, intuition, a minimal example, formal expression, a likely confusion, and an opportunity to apply the idea. Adapt or combine these moves; they are not mandatory headings or a repeated six-part layout.

Explain why each important step follows. Introduce variables, units and assumptions before using a formula. Keep the core explanation, essential derivation and applicable conditions visible by default. Use expandable sections for alternative derivations, extra practice, reference answers or optional background. Students should not need the original PDF to fill a gap in the main reasoning.

### Connect words, numbers and symbols

For an important formula, make the correspondence between **plain-language meaning → a concrete numerical case → the symbolic expression** visible. A short table or annotated calculation can show what each term counts or measures, where each substituted number came from, and the meaning and units of new symbols. Explain the non-obvious transformations, including why a denominator or reference group is appropriate; naming the formula is not a derivation.

Distinguish definitions, exact algebra, assumptions and approximations beside the steps that use them. State conditions before applying a rule and use ≈ for rounded or approximate results. For example, with uniform selection from a fixed survey, (24/100)/(40/100) = 24/40 = 0.60 is exact and requires P(S) > 0; uniform selection is the interpretation assumption, not a consequence of cancellation, and independence is unnecessary. An estimate for a wider population would need separate justification. Preserve the source's assumptions and mark newly introduced modeling choices as such.

### Let a running case motivate the next concept

For a substantive lesson with related concepts, choose a case that can develop as the learner's tools improve. Begin with a concrete question, use the current concept to solve part of it, then make the remaining difficulty explicit before introducing the next concept. Reusing a name or dataset alone does not establish this connection: the reader should be able to say what the next idea lets them do that they could not do before. State what stays fixed, what new information is introduced, and why a new method is justified.

For example, keep a survey's counts fixed while moving from “which students belong in this fraction?” to “how can we express that restriction for any event?” After conditional probability is available, ask “does knowing the subject change the probability?” That last question needs a marginal probability and an independence test; a comparison of conditional and joint probabilities alone cannot answer it.

In the working coverage map, note **case step → unresolved problem → next concept**, plus whether its scenario/counts come from the source or are author-created. This is a planning aid, not a new JSON schema or a fixed number of steps. Prefer a suitable source case; when it is too demanding as an entry point, introduce a simpler labeled case and explicitly return to the teacher's key worked example. Keep original assumptions, derivations and citations. A running case need not span unrelated lectures or very small excerpts, and a separate transfer exercise can check whether the learner can generalize beyond it.

## Diagnose only the prerequisites this course needs

When the course relies on prior knowledge, begin with a brief optional check, usually two or three questions. Adapt its size to the actual gaps; omit it when no meaningful prerequisite needs checking. Check existing knowledge rather than asking students to know the new lesson already. Record each question's prerequisite concept, where it is needed in the main lesson, and its focused refresher in the coverage map.

Give every diagnostic question one clear concept target and explain its plausible distractors. A wrong answer offers a link to the corresponding short refresher; opening it must allow a return to the same question for another attempt. Keep refreshers expandable and label added background “Supplementary explanation,” with author-created examples identified. Supply a visible skip link to the first main section, allow direct manual access to refreshers, and keep the entire lesson available regardless of answers. Correct answers do not prove mastery and must not unlock or hide lesson content.

Keep each refresher local to the gap: a definition or small worked step that prepares the student for this lesson. For conditional probability, a part-to-whole fraction and the meaning of an intersection may be enough; do not add an entire foundational mathematics course. Preserve source citations when a refresher uses material from the supplied lectures, and do not imply that newly added prerequisite explanations came from the teacher.

## Separate provenance from the teaching flow

| Content | Treatment |
|---|---|
| A fresh explanation, analogy or diagram of a source concept | Main lesson with the concept's source citation. Identify a redrawn diagram in its caption; state analogy limits where they matter. |
| New numbers or a new scenario applying a source concept | Main lesson with a brief “Author-created example” or “Author-created exercise” label and the rule's citation. Verify the new reasoning independently. |
| Additional background beyond the lecture | Label “Supplementary explanation”; usually put it in optional reading. |
| Unclear, inconsistent or possibly incorrect source content | State the specific issue and the chosen supported interpretation. Keep conditions needed for correctness beside the relevant explanation; do not silently repair or guess. |

Citations identify the source concept, not authorship of new prose or examples. Quotations and transcribed formulas remain faithful. Do not fabricate instructor intent, exam likelihood, theorem conditions or missing numerical values. If an analogy breaks down, explain where; do not let it become an incorrect definition.

## Check understanding

Choose checks that reveal a meaningful difficulty: predict a change, explain a step, identify an applicable condition, distinguish related concepts, or apply the idea in a different situation. Across a substantive lesson, let the student explain in their own words, check applicability and try a variation. Short self-explanation prompts with expandable reference answers can complement multiple-choice questions. Do not force a quiz quota onto title-only or very small excerpts.

For multiple-choice questions, explain why the correct answer follows and why plausible alternatives fail. Cite the supported idea and distinguish author-created scenarios. Validate calculations independently; never test unresolved OCR or uncertain claims. Do not call scrolling or a single correct choice evidence of mastery. Actual learning needs learner feedback.

When a learning objective requires applying a method, reduce support across a **worked example → completion problem → independent problem**. Show the worked reasoning, then leave a meaningful step for the learner to finish with an optional targeted hint. Finally change the numbers or setting and ask the learner to choose the method or reference group without those scaffolds. Keep the core rule and conditions visible; reference solutions may be hidden until requested. Adapt the sequence to the material rather than imposing a quota on every concept.

Use the [typed practice components](authoring.md#typed-practice) when a learner should calculate a result or write a short explanation. Specify the expected quantity, units and rounding; configure numeric tolerance consistently with that rounding. Pair numerical answers with a brief explanation or applicability prompt when a correct number can conceal faulty reasoning. Supply a full solution or self-check rubric with source citations, retry and voluntary solution access. Short explanations receive reference points for self-evaluation, never an unsupported automated correctness or mastery score. Record **learning objective → formula or method → worked, completion and independent exercises** in the coverage map, including verified calculations and source/new-example provenance.

Before giving the complete answer after an incorrect choice, help the learner reconsider the specific mistake. Author a short hint for every plausible distractor, including prerequisite checks, using the [quiz-hint contract](authoring.md#hints-before-the-full-answer). A denominator error should prompt the learner to name the eligible group; confusing an intersection with a union should prompt a comparison of “both” with “at least one.” Point to the reasoning step to revisit without naming the correct option or supplying the final calculation. Keep all worked steps and distractor explanations in the separate full explanation.

Students should be able to retry with their latest hint visible or explicitly reveal the full answer whenever they choose. A correct attempt may reveal the explanation automatically; revealing it without answering must not count as answering correctly. This adds an opportunity to reason again, not evidence of mastery or a gate on lesson content. Preserve the prompt's meaning and restraint in Chinese translations, and check that switching languages does not reset an attempt or reveal a hidden solution. Legacy quizzes without authored hints keep their immediate-explanation behavior; use hints for newly authored questions.

## Revisit concepts with evidence and spacing

Keep reading position separate from evidence about doing an activity. When a course has assessable concepts, use the [concept-review contract](authoring.md#concept-evidence-and-cumulative-review) to map questions to learning targets independently of glossary definitions. Distinguish a correct graded response without recorded help, hint use, a correct response with support, an error needing review, voluntary solution viewing and a reflection's self-assessment. A displayed solution, a completed chapter or a correct answer after help does not establish mastery. Even the “independent correct” label only describes interactions that the course could observe; students may have used notes, another person or untracked explanations.

Revisit important earlier concepts in a later lecture with an authored change of setting, numbers or reasoning. Preserve the original concept ID while giving the variant its own activity ID. Ask the learner to retrieve the method before opening optional support; do not put the variant's answer in the preceding paragraph. Supply a focused hint, a complete solution and the earlier rule's source citation, and clearly label author-created scenarios. Verify every answer, assumption and distractor. Record the first and later activities in the coverage map so repetition is purposeful and source coverage remains intact. The website links to these authored variants; it does not create new questions automatically.

Provide a small review entry point throughout the course. Prioritize concepts with recent errors or reliance on support, along with due concepts; prefer an unattempted or different graded question when one exists. The template uses next-day, 3-day and 7-day recommendations after independent successes separated by at least 24 hours. Same-day retries and reloads must not manufacture spaced practice; after a recently seen solution, another correct response on that question is supported evidence. New support use, supported repetitions, self-assessment or an error restarts the sequence. A later attempt on the same question needs a fresh page without new help as well as the 24-hour gap; an answered or helped form left open overnight remains supported. These intervals are implementation heuristics, not a prediction of forgetting or a guarantee of learning. Learners can always open any lesson or practice sooner.

Explain the local-history boundary: browser storage can be unavailable, file origins vary between browsers, and no history is synced to a server. Keep the lesson usable without stored history. Show recent activity evidence rather than claiming a lifetime score, a pass/fail gate or a scientific mastery estimate. Learning effectiveness still requires feedback from learners.

## Use visuals and terminology purposefully

Prefer diagrams for relationships and processes, paired views for a controlled change, and tables for comparisons. Label what stays fixed in before/after examples. Use readable labels and adjacent text that conveys the essential relationship without relying on color. No visual-percentage requirement, compulsory animation or metaphor.

### Make a controlled change worth exploring

Choose an interactive diagram when a learner can predict a meaningful effect of changing one quantity, observe the consequence, then explain it. Give each exploration one clear learning goal. A useful sequence is **predict → operate → explain**: invite a prediction before interaction, let the student change the control freely, and ask for a count-, mechanism- or formula-based explanation afterward. Keep the rule and worked reasoning visible; do not require a written prediction to unlock the diagram or use movement or notes as a mastery score. Use a static diagram when there is no useful parameter to vary; there is no animation quota.

Name the control, permitted values, fixed quantities and assumptions. Show the affected quantities together, so the learner can distinguish what changed from what stayed fixed. In the [overlap component](authoring.md#predict--operate--explain-diagrams), varying the intersection while holding both group totals fixed changes the other three cells too. Check their conservation and nonnegativity, not only a changing probability bar. With uniform selection and a nonempty conditioning group, compare x/B with A/N; equality is an independence test only where that concept is taught and cited. Keep the original evidence intact and label alternative arrangements as author-created what-if examples.

Record **learning question → prediction → control and invariants → explanation prompt** in the coverage map, with source citations and a verified baseline, boundary settings and useful interior comparison. Supply text that conveys the same conclusion when interaction is unavailable, and label bars/tables so color is not required. Check native keyboard operation, reset, offline operation and language switching with notes and a changed slider value. The student's explanation is for reflection; the diagram does not establish learning outcomes.

Glossary entries use the English term as the main label, a conventional Simplified Chinese equivalent, and a short English definition consistent with the lecture. Include specialized abbreviations and symbols when helpful. Avoid confident Chinese translations when terminology is ambiguous; retain alternatives with context.

## Review the teaching and learn from trials

Use [teaching-review.md](teaching-review.md) to turn the coverage map into an objective-level audit: locate the explanation, worked example and assessment, and describe the reasoning a satisfactory response must show. A link to an exercise alone does not show that it tests the objective. Check for skipped steps, undefined notation, misleading analogies and absent application or transfer; record gaps even when every source page is covered.

Report technical checks, content judgments and learner observations separately. A prepared trial can ask where the learner first loses the explanation, then observe a key-step explanation, a new problem and a delayed parallel problem. Preserve the original response before hints or solution access, and use the feedback to revise the precise passage and recheck the affected objective. No trial means no observed learning result; the linked templates support that state without blocking delivery.
