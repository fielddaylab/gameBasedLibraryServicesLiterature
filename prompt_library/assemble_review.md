# Master Prompt: Build the Complete GBLS Literature Review

This prompt is self-contained. It must work in a new conversation with no
knowledge of earlier runs, drafts, filenames, section titles, source counts, or
decisions made outside the project files.

## Invocation

Run this prompt file from anywhere. Define `PROJECT_ROOT` as the parent
directory of the `prompt_library` directory containing this file. Resolve all
paths below relative to `PROJECT_ROOT`; do not depend on the current working
directory or a remembered absolute path.

Required paths:

- `0_human_sources/baseline_structure_and_prose.md`
- `0_human_sources/metadata_schema_and_lexicon.md`
- `0_human_sources/explicit_values.md`
- `0_human_sources/publishability_rubric.md`
- `0_human_sources/corpus_source_texts/`
- `1_coded_gbls_corpus_articles/*.md`, excluding `template.md` and hidden files
- `prompt_library/assemble_review_phases/00_shared_section_contract.md`
- `prompt_library/assemble_review_phases/01_runtime_section_writer.md`
- `prompt_library/assemble_review_phases/02_assemble_and_transition.md`
- `prompt_library/assemble_review_phases/03_heading_framing_review.md`
- `prompt_library/assemble_review_phases/04_terminology_introduction_review.md`
- `prompt_library/assemble_review_phases/05_topical_cohesion_review.md`
- `prompt_library/assemble_review_phases/06_corpus_integration_review.md`
- `prompt_library/assemble_review_phases/07_review_and_revision.md`

Canonical outputs:

- Manuscripts: `3_article_outputs/stage_1_initial_assembly_draft.md`, `stage_2_whole_manuscript_integration_draft.md`,
  `stage_3_heading_framing_draft.md`, `stage_4_terminology_introduction_draft.md`, `stage_5_topical_cohesion_draft.md`,
  `stage_6_corpus_integration_draft.md`, `stage_7_first_publishability_review_draft.md`, and
  `stage_8_final_independent_review_draft.md`
- Audits: `3_article_outputs/audits_and_synthetic_reviews/`

Do not use any existing file in `3_article_outputs` as evidence, a structural source,
or draft seed. Do not use prior manuscripts elsewhere in the repository unless
the baseline explicitly identifies one as an input.

## Objective

Produce a cohesive, publishable literature review by developing the current
author-supplied baseline prose through synthesis of the complete coded-summary
corpus. The baseline at run time is the sole authority for manuscript
structure, heading order, starting prose, annotations, and word targets.

The manuscript must explain what the literature collectively examines, where
findings converge or diverge, what evidence is strongest, what lessons matter
for Games-Based Library Services, and what remains uncertain. It must not read
as an annotated bibliography.

## Approval Gate

Before modifying `3_article_outputs`, report:

1. the resolved `PROJECT_ROOT`;
2. the number of eligible coded summaries;
3. the number and levels of headings discovered in the baseline;
4. the exact directories and generated files that will be cleared.

Then ask the user for approval to clear generated contents of `3_article_outputs`.
Do not delete or overwrite anything before approval. After approval, complete
the entire workflow without asking again unless a required input is missing or
an external permission prevents writing.

## Preflight

After approval:

1. Confirm every required path exists and is readable.
2. Read all eight prompt files before synthesis.
3. Empty generated files and directories under `3_article_outputs`.
4. Recreate only `3_article_outputs/audits_and_synthetic_reviews`.
5. Do not create `3_article_outputs/sections`, `3_article_outputs/section-ledgers`, or any
   topic-specific section directory.
6. Create a disposable run-state directory outside `3_article_outputs`, preferably in
   the system temporary directory. Store section drafts, ledgers, manifests,
   and checkpoints there if they cannot safely remain in active context.
7. Record the temporary run-state path in the runtime manifest and delete it
   after successful installation and verification.

Never modify `0_human_sources` or `1_coded_gbls_corpus_articles`.

## Runtime Structure Discovery

Read the baseline directly from disk and parse it into an ordered manifest.
Do not use a heading list, expected count, or order from a previous run.

For every H1 block:

1. Assign an ordinal ID such as `section_01`.
2. retain the complete raw H1;
3. derive the manuscript H1 by removing only a trailing parenthetical drafting
   annotation;
4. capture every nested Markdown heading of level H2 through H6, preserving
   exact level, wording, and order;
5. associate every non-heading passage with its nearest preceding heading;
6. parse word targets and drafting directives from trailing annotations;
7. classify the block as `front matter`, `narrative`, or `reference` from its
   actual content and directives;
8. record its exact ordinal position and source line span.

Text before the first H1 is workflow material unless it explicitly identifies
itself as manuscript prose.

Write the manifest to
`3_article_outputs/audits_and_synthetic_reviews/runtime_structure_manifest.md`.
The baseline remains authoritative: reread it before every section task and
again before final verification.

## Source Rules

1. The coded summaries are the evidence corpus. Search the complete corpus for
   each section, not only filenames or metadata suggestions.
2. The baseline is author-supplied prose and interpretation, not evidence by
   itself. Support, qualify, relocate, or label its claims appropriately.
3. `explicit_values.md` supplies declared interpretive commitments, not
   empirical evidence.
4. `metadata_schema_and_lexicon.md` guides consistent terminology and metadata
   interpretation.
5. Give greatest weight to empirical studies, systematic reviews,
   meta-analyses, surveys, interviews, observations, and experiments.
6. Use practitioner reflections, columns, reviews, and opinion pieces
   cautiously and identify their evidentiary limits.
7. Use historical sources for origins and continuity, not contemporary outcome
   claims.
8. Never invent findings, methods, quotations, citations, dates, page numbers,
   DOI data, or reference details.
9. Treat baseline citations not represented in the coded corpus as unresolved
   until independently matched to an approved bibliographic record. Preserve
   the claim only with appropriate qualification and list the record in the
   citation audit.

## Section Execution

Iterate through the live runtime manifest.

For each non-reference H1 block:

1. Reread the baseline and extract the block by ordinal position.
2. Build the complete runtime packet required by
   `01_runtime_section_writer.md`.
3. Apply `00_shared_section_contract.md`.
4. Search the full coded corpus and write the section in thematic,
   cross-source scholarly prose.
5. Preserve all nested headings exactly after removing only drafting
   annotations.
6. Produce a working ledger with passage dispositions, sources consulted,
   citations, evidence limits, and unresolved records.
7. Save the section and ledger only in active context or the disposable
   run-state directory.
8. Verify structure and traceability before continuing.

After all citation-bearing blocks are complete, process every reference-role
block in baseline order using reference mode. If the baseline has no reference
block, do not invent one; record that fact in the citation audit.

## Required Audits

Create these files in `3_article_outputs/audits_and_synthetic_reviews`:

- `runtime_structure_manifest.md`
- `baseline_prose_audit.md`
- `corpus_coverage_audit.md`
- `citation_audit.md`
- `reviewer_notes.md`
- `factual_reliability_audit.md`

Requirements:

- The baseline audit accounts for every substantive passage and records
  retained, revised, relocated, qualified, or omitted status with a reason.
- The corpus audit lists every eligible summary exactly once as cited,
  substantively consulted but not cited, or excluded from synthesis, with a
  defensible reason. Do not infer citation status from filename text alone.
- The citation audit checks every in-text citation against references and every
  reference against the manuscript. List unmatched and ambiguous records.
- `reviewer_notes.md` must contain a separate simulated reviewer report for
  every publication profile in `publishability_rubric.md`, including hard
  constraint fit, exact delta, 1–5 venue score, likely recommendation,
  strengths, major concerns, and required revisions. It must not be primarily
  an internal process audit or use a single global score.
- Audit counts must be calculated from current files, never copied from an
  earlier run.

## Assembly And Review

1. Execute `02_assemble_and_transition.md`.
2. Save the literal first assembly as `stage_1_initial_assembly_draft.md`.
3. Perform a whole-manuscript integration pass and save a materially reviewed
   `stage_2_whole_manuscript_integration_draft.md`.
4. Execute `03_heading_framing_review.md`. Ensure every substantive narrative
   heading begins with a framing paragraph that defines the heading's scope,
   central question, and topics developed beneath it; save `stage_3_heading_framing_draft.md`.
5. Execute `04_terminology_introduction_review.md`. Define specialized terms,
   named concepts, frameworks, and acronyms before or at first use; save
   `stage_4_terminology_introduction_draft.md`.
6. Execute `05_topical_cohesion_review.md`. Critique every section for
   author-centered or paper-by-paper narration, revise toward topic-led
   synthesis, and save `stage_5_topical_cohesion_draft.md`.
7. Execute `06_corpus_integration_review.md`. Reconsider every uncited eligible
   summary, integrate sources that substantively improve or qualify existing
   synthesis, and save `stage_6_corpus_integration_draft.md`.
8. Execute `07_review_and_revision.md`.
9. Conduct publishability review round one, revise, and save `stage_7_first_publishability_review_draft.md`.
10. Conduct the non-destructive quotation-backed factual reliability audit
   below against `stage_7_first_publishability_review_draft.md`. Do not create
   a fact-check rewrite stage.
11. Conduct an independent publishability review round two using
   `stage_7_first_publishability_review_draft.md` and the factual audit as
   inputs. Revise only where semantic review warrants a correction,
   qualification, citation change, or removal, and save
   `stage_8_final_independent_review_draft.md`.
12. If a revision round finds no textual change is warranted, document that in
   the disposable run-state ledger; do not falsely claim a revision occurred.

Venue reviews are synthetic pre-submission simulations, not actual peer review
or publication decisions. They must nevertheless use the target profiles and
hard constraints literally.

## Non-Destructive Quotation-Backed Factual Reliability Audit

Treat `0_human_sources/corpus_source_texts` as the authority for claims about
what an article reports, argues, finds, describes, recommends, or concludes.
The coded summaries may locate likely evidence, but they are not sufficient
verification for this pass.

Audit every substantial manuscript claim that attributes content to one or
more corpus sources. This includes:

- reported findings, effects, outcomes, prevalence, frequencies, or trends;
- descriptions of methods, samples, settings, interventions, or limitations;
- statements of an author's argument, definition, framework, recommendation,
  interpretation, or historical account;
- comparative or synthetic claims supported by a group of citations; and
- quantitative claims, including percentages, counts, dates, and market or
  survey estimates attributed to a source.

Purely authorial transitions, explicitly labeled interpretations, and
uncontroversial manuscript-organization statements do not require quotation
evidence. Bibliographic facts still require citation/reference verification.

For each auditable claim:

1. Record a stable claim ID, manuscript heading, and the complete claim text.
2. Record every citation attached to the claim.
3. Resolve each citation to one or more files in `corpus_source_texts` using
   bibliographic metadata, author, year, title, and item key. Do not rely on
   filename resemblance alone.
4. Read only `.txt` source texts. Do not read or extract PDF files during this
   pass. When a cited work has no matching `.txt` extraction, assign
   `source_text_missing`.
5. Preserve one or more exact, contiguous quotations that directly support or
   contradict the claim. Keep quotations only as long as needed for the audit.
6. Record the source filename and a stable locator: printed page when
   available, otherwise PDF page, section heading, paragraph number, or text
   line span.
7. Assign one status:
   - `verified`: the quotation directly supports the claim as written;
   - `verified_with_scope_change`: the source supports a narrower or more
     qualified claim;
   - `partially_verified`: only part of a compound claim is supported;
   - `contradicted`: the source materially conflicts with the claim;
   - `source_text_missing`: the cited work cannot be found in
     `corpus_source_texts`;
   - `not_located`: the source exists but no direct supporting passage was
     found after a reasonable full-text search; or
   - `not_applicable`: the passage is not an article-content claim, with a
     reason.
8. For multi-source synthesis, require quotation evidence from enough cited
   sources to justify the breadth of the wording. A single source cannot
   verify claims framed as a broad convergence unless the sentence is revised
   to match that source's scope.
9. Record a recommended disposition whenever a claim is not `verified`:
   inspect semantically, narrow, qualify, split, correct, add an available
   supporting citation, label as interpretation, or remove only when the
   evidence warrants that action. Lexical retrieval scores are leads, not
   semantic judgments.
10. Do not automatically modify the manuscript. The independent second review
    must adjudicate each flagged claim in context and record any resulting
    revision.

Write
`3_article_outputs/audits_and_synthetic_reviews/factual_reliability_audit.md`.
It must include:

- method and corpus-source inventory;
- counts by audit status;
- source texts missing or unreadable;
- a claim-by-claim table or consistently structured entries containing claim
  ID, original claim, citations, status, exact quotation, locator, source
  filename, and revision disposition;
- a list of claims recommended for semantic review, narrowing, correction, or
  possible removal;
- unresolved risks; and
- final confirmation that the audit did not automatically rewrite or delete
  manuscript prose.

The audit is an evidence ledger, not a collection of quotations inserted into
the manuscript. Keep direct quotations in the audit unless a quotation is
independently warranted in the review prose.

Flag unresolved claims rather than silently treating them as verified.
Missing source text is not permission to treat a claim as verified, but it is
also not sufficient reason for automatic deletion.

## Final Verification

Before reporting completion:

1. Reparse the baseline independently from disk.
2. Compare every H1-H6 heading in `stage_8_final_independent_review_draft.md` with the fresh manifest,
   removing only trailing drafting annotations from baseline headings.
3. Fail verification for any missing, added, renamed, level-changed,
   duplicated, or reordered heading.
4. Calculate narrative and total word counts for all eight drafts.
5. Evaluate every baseline word target and report deviations.
6. Confirm every baseline passage and eligible coded summary appears exactly
   once in its audit.
7. Confirm every factual-audit flag has a recorded disposition from the
   independent second review. Do not require automatic deletion of unresolved
   prose.
8. Perform bidirectional citation/reference verification.
9. Confirm drafts represent the documented stages; compare checksums and
   explain any identical stages.
10. Confirm the installed outputs match the verified run-state artifacts.
11. Confirm no obsolete section or ledger directories exist.
12. Delete the disposable run-state directory only after successful output
    installation.

Report the output paths, summary count, heading count by level, manuscript word
counts, unresolved bibliography count, target deviations, and verification
result.

The task is complete only when the eight manuscripts, six audits, heading
framing pass, terminology-introduction pass, topical-cohesion pass, and two
documented publishability review rounds are installed and verified against the
current files.
