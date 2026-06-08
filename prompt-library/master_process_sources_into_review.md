# Master Prompt: Build the Complete GBLS Literature Review

This prompt is self-contained. It must work in a new conversation with no
knowledge of earlier runs, drafts, filenames, section titles, source counts, or
decisions made outside the project files.

## Invocation

Run this prompt file from anywhere. Define `PROJECT_ROOT` as the parent
directory of the `prompt-library` directory containing this file. Resolve all
paths below relative to `PROJECT_ROOT`; do not depend on the current working
directory or a remembered absolute path.

Required paths:

- `0-human-sources/baseline_structure_and_prose.md`
- `0-human-sources/metadata-schema-and-lexicon.md`
- `0-human-sources/explicit_values.md`
- `0-human-sources/publishability_rubric.md`
- `1-coded-summaries/*.md`, excluding `template.md` and hidden files
- `prompt-library/section-prompts/00_shared_section_contract.md`
- `prompt-library/section-prompts/01_runtime_section_writer.md`
- `prompt-library/section-prompts/02_assemble_and_transition.md`
- `prompt-library/section-prompts/03_review_and_revision.md`

Canonical outputs:

- Manuscripts: `2-outputs/FIRST_DRAFT.md`, `SECOND_DRAFT.md`,
  `THIRD_DRAFT.md`, and `FINAL_DRAFT.md`
- Audits: `2-outputs/audits_and_synthetic_reviews/`

Do not use any existing file in `2-outputs` as evidence, a structural source,
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

Before modifying `2-outputs`, report:

1. the resolved `PROJECT_ROOT`;
2. the number of eligible coded summaries;
3. the number and levels of headings discovered in the baseline;
4. the exact directories and generated files that will be cleared.

Then ask the user for approval to clear generated contents of `2-outputs`.
Do not delete or overwrite anything before approval. After approval, complete
the entire workflow without asking again unless a required input is missing or
an external permission prevents writing.

## Preflight

After approval:

1. Confirm every required path exists and is readable.
2. Read all four prompt files before synthesis.
3. Empty generated files and directories under `2-outputs`.
4. Recreate only `2-outputs/audits_and_synthetic_reviews`.
5. Do not create `2-outputs/sections`, `2-outputs/section-ledgers`, or any
   topic-specific section directory.
6. Create a disposable run-state directory outside `2-outputs`, preferably in
   the system temporary directory. Store section drafts, ledgers, manifests,
   and checkpoints there if they cannot safely remain in active context.
7. Record the temporary run-state path in the runtime manifest and delete it
   after successful installation and verification.

Never modify `0-human-sources` or `1-coded-summaries`.

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
`2-outputs/audits_and_synthetic_reviews/runtime_structure_manifest.md`.
The baseline remains authoritative: reread it before every section task and
again before final verification.

## Source Rules

1. The coded summaries are the evidence corpus. Search the complete corpus for
   each section, not only filenames or metadata suggestions.
2. The baseline is author-supplied prose and interpretation, not evidence by
   itself. Support, qualify, relocate, or label its claims appropriately.
3. `explicit_values.md` supplies declared interpretive commitments, not
   empirical evidence.
4. `metadata-schema-and-lexicon.md` guides consistent terminology and metadata
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

Create these files in `2-outputs/audits_and_synthetic_reviews`:

- `runtime_structure_manifest.md`
- `baseline_prose_audit.md`
- `corpus_coverage_audit.md`
- `citation_audit.md`
- `reviewer_notes.md`

Requirements:

- The baseline audit accounts for every substantive passage and records
  retained, revised, relocated, qualified, or omitted status with a reason.
- The corpus audit lists every eligible summary exactly once as cited,
  substantively consulted but not cited, or excluded from synthesis, with a
  defensible reason. Do not infer citation status from filename text alone.
- The citation audit checks every in-text citation against references and every
  reference against the manuscript. List unmatched and ambiguous records.
- Audit counts must be calculated from current files, never copied from an
  earlier run.

## Assembly And Review

1. Execute `02_assemble_and_transition.md`.
2. Save the literal first assembly as `FIRST_DRAFT.md`.
3. Perform a whole-manuscript integration pass and save a materially reviewed
   `SECOND_DRAFT.md`.
4. Execute `03_review_and_revision.md`.
5. Conduct review round one, revise, and save `THIRD_DRAFT.md`.
6. Conduct an independent review round two, revise, and save
   `FINAL_DRAFT.md`.
7. If a review finds no textual change is warranted, document that explicitly
   in `reviewer_notes.md`; do not falsely claim a revision occurred.

Rubric scores are internal editorial diagnostics, not peer review or
publication decisions.

## Final Verification

Before reporting completion:

1. Reparse the baseline independently from disk.
2. Compare every H1-H6 heading in `FINAL_DRAFT.md` with the fresh manifest,
   removing only trailing drafting annotations from baseline headings.
3. Fail verification for any missing, added, renamed, level-changed,
   duplicated, or reordered heading.
4. Calculate narrative and total word counts for all four drafts.
5. Evaluate every baseline word target and report deviations.
6. Confirm every baseline passage and eligible coded summary appears exactly
   once in its audit.
7. Perform bidirectional citation/reference verification.
8. Confirm drafts represent the documented stages; compare checksums and
   explain any identical stages.
9. Confirm the installed outputs match the verified run-state artifacts.
10. Confirm no obsolete section or ledger directories exist.
11. Delete the disposable run-state directory only after successful output
    installation.

Report the output paths, summary count, heading count by level, manuscript word
counts, unresolved bibliography count, target deviations, and verification
result.

The task is complete only when the four manuscripts, five audits, and two
documented review rounds are installed and verified against the current files.
