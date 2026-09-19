# Teaching concepts from lecture PDFs

Write for a student taking this subject. Infer the expected depth from the lecture; explain missing prerequisites locally without replacing the course with a beginner overview. The lecture sets the knowledge scope, while the lesson supplies a coherent path to understanding it.

## Map before writing

For each source page record the concept, reliable text/formulas, visual evidence, uncertainties, prerequisite concepts, what the learner should be able to do, and destination chapter. Explain omissions such as repeated outlines. Keep this coverage map in the working folder; it is an authoring aid, not a new course JSON schema.

Keep lecture boundaries. Within a lecture, combine pages about the same idea and reorder them when dependencies or motivation justify it. Record the regrouping in the map. Retain significant derivations, assumptions, and key teacher examples, even when a simpler example introduces them first. For an excerpt, state the physical page range and explicitly exclude the rest from coverage claims.

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

## Use visuals and terminology purposefully

Prefer diagrams for relationships and processes, paired views for a controlled change, and tables for comparisons. Label what stays fixed in before/after examples. Use readable labels and adjacent text that conveys the essential relationship without relying on color. No visual-percentage requirement, compulsory animation or metaphor.

Glossary entries use the English term as the main label, a conventional Simplified Chinese equivalent, and a short English definition consistent with the lecture. Include specialized abbreviations and symbols when helpful. Avoid confident Chinese translations when terminology is ambiguous; retain alternatives with context.

## Review the teaching and learn from trials

Use [teaching-review.md](teaching-review.md) to turn the coverage map into an objective-level audit: locate the explanation, worked example and assessment, and describe the reasoning a satisfactory response must show. A link to an exercise alone does not show that it tests the objective. Check for skipped steps, undefined notation, misleading analogies and absent application or transfer; record gaps even when every source page is covered.

Report technical checks, content judgments and learner observations separately. A prepared trial can ask where the learner first loses the explanation, then observe a key-step explanation, a new problem and a delayed parallel problem. Preserve the original response before hints or solution access, and use the feedback to revise the precise passage and recheck the affected objective. No trial means no observed learning result; the linked templates support that state without blocking delivery.
