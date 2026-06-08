# Master Prompt: Build the Complete GBLS Literature Review

This prompt orchestrates the complete transformation of coded article summaries into a reviewed full manuscript.

## Project Configuration

- Project root: `/Users/djgagnon/Library/CloudStorage/GoogleDrive-djgagnon@wisc.edu/.shortcut-targets-by-id/1P-yeNAX497qAu3txZnKjZZ1ztx8V2nSJ/Phase I - Research, Needs Assessment, and Lit Review Resources/GBLS Lit Review Working Docs`
- Section prompt directory: `prompt-library/section-prompts`
- Output directory: `2-outputs`
- Section artifact directory: `2-outputs/sections`
- Section source-ledger directory: `2-outputs/section-ledgers`
- Corpus coverage audit: `2-outputs/corpus_coverage_audit.md`
- Baseline prose audit: `2-outputs/baseline_prose_audit.md`
- Narrative target: approximately 12,000 words, excluding references

`2-outputs` is the canonical generated-output location. Do not place generated
files in the project root unless the user explicitly requests an additional
export. A root-level export supplements rather than replaces the canonical
files in `2-outputs`.

## Objective

Produce a cohesive, publishable literature review of Games-Based Library
Services by developing the author-supplied baseline prose through synthesis
with the coded-summary corpus. Use separate section-writing contexts to
maximize depth, then use whole-manuscript integration and reviewer passes to
restore a unified argument and voice.

## Execution Rules

1. Treat files in `0-human-sources` and `1-coded-summaries` as authoritative
   inputs. Treat `baseline_structure_and_prose.md` as both the structural
   authority and the author-supplied starting draft.
2. Read `prompt-library/section-prompts/00_shared_section_contract.md` before every section prompt.
3. Immediately before executing each section prompt, reread
   `0-human-sources/baseline_structure_and_prose.md` from disk. Do not reuse headings
   remembered from an earlier task or run.
4. Execute each prompt as a fresh section-writing task with access to project files and completed neighboring section artifacts.
5. Do not allow one section writer to rewrite another section's artifact.
6. Treat the current baseline file as the sole authority for manuscript H1 and
   H2 headings, word targets, and author-supplied starting prose. Extract them
   at runtime. Preserve heading order and remove only trailing parenthetical
   annotations used as word-count or drafting instructions.
7. Begin each section with the prose currently placed under its H1 and H2
   headings in the baseline. Synthesize, reorganize, qualify, and edit that
   prose as needed, but do not silently discard its substantive ideas.
8. Add citations from the coded summaries where baseline claims are supported,
   contested, limited, or need context. Do not fabricate support for an
   authorial proposition.
9. Never invent evidence or bibliography data.
10. Overwrite generated files from earlier runs. Do not alter human-source files or coded summaries.
11. Treat rubric scores as internal editorial diagnostics, not independent peer
   review or evidence of publication acceptance.

## Preflight

Confirm that these inputs exist:

- `0-human-sources/metadata-schema-and-lexicon.md`
- `0-human-sources/baseline_structure_and_prose.md`
- `0-human-sources/explicit_values.md`
- `0-human-sources/publishability_rubric.md`
- the coded summaries, excluding `template.md`
- every prompt listed below

Create or empty `2-outputs/sections` and `2-outputs/section-ledgers`. Remove
previous generated drafts, reviewer notes, corpus coverage audits, and
baseline prose audits from `2-outputs`.

## Section-Writing Sequence

Execute these prompts in order:

1. `01_introduction.md`
2. `02_scope_definition_method.md`
3. `03_conceptual_terrain.md`
4. `04_service_purposes.md`
5. `05_programming_models.md`
6. `06_cross_cutting_conditions.md`
7. `07_gaps_research_agenda.md`
8. `08_conclusion.md`
9. `09_abstract.md`
10. `10_references.md`

After each section:

- Reread the baseline from disk and verify the artifact against the target H1
  and every H2 currently nested beneath it.
- Fail the section check if an H2 is missing, added, renamed, duplicated, or
  reordered.
- Confirm that every substantive baseline passage assigned to the section has
  been retained, revised, relocated with traceability, or explicitly omitted
  with a reason.
- Count narrative words against its target.
- Confirm that its opening is synthesis-driven.
- Confirm that every H2 opens with a field-level synthesis claim rather than an
  individual study.
- Confirm that evidence limitations and outliers are present where relevant.
- Confirm that author-year citations have corresponding ledger records.
- Save its source ledger to `2-outputs/section-ledgers` using the section
  artifact's basename.
- Revise the section before proceeding if it fails these checks.

After all sections are drafted, create `2-outputs/corpus_coverage_audit.md`.
List every coded summary and classify it as cited, substantively consulted but
not cited, or excluded from synthesis. Give a brief reason for uncited and
excluded records. Use the audit to check whether heavily represented subjects
have displaced relevant minority findings, null results, underrepresented
contexts, or credible outliers. Revise sections where the audit reveals
material imbalance.

Also create `2-outputs/baseline_prose_audit.md`. Inventory each substantive
baseline passage by its source H1/H2 and opening words. Record whether it was
retained substantially, revised and integrated, relocated, or omitted. For
revised or relocated passages, identify the destination section. Permit
omission only for duplication, obsolete drafting instructions, contradiction
with stronger evidence, or material outside the review's scope, and state the
reason. Do not treat text before the first H1 as manuscript prose unless it is
explicitly labeled for inclusion.

## Assembly and Review Sequence

1. Execute `11_assemble_and_transition.md` to produce `FIRST_DRAFT.md` and `SECOND_DRAFT.md`.
2. Execute `12_review_and_revision.md` to produce `reviewer_notes.md`, `THIRD_DRAFT.md`, and `FINAL_DRAFT.md`.

## Final Verification

Before finishing:

- Reread `baseline_structure_and_prose.md` from disk and compare all H1 and H2 headings in
  `FINAL_DRAFT.md` with it after removing only trailing parenthetical
  annotations.
- Verify that narrative word count is close to 12,000, with references excluded.
- Confirm that `baseline_prose_audit.md` accounts for every substantive
  author-supplied passage and that no baseline idea was silently dropped.
- Check the abstract against the word target currently attached to the
  baseline's first H1, using the tolerance defined by the abstract prompt.
- Confirm that reviewer notes include two scored rounds and a final score.
- Label every score as an internal rubric-based editorial assessment.
- Search for placeholders, duplicated headings, accidental repeated phrases, and unresolved citation markers.
- Confirm bidirectional citation integrity: every in-text citation maps to a
  reference or verification note, and every reference is cited in the
  manuscript.
- Normalize references against available approved records or Zotero metadata
  without inventing missing data.
- List unresolved bibliographic records in both the references section and reviewer notes.
- Confirm that `corpus_coverage_audit.md` accounts for every coded summary.
- Confirm that claims inherited from baseline prose are cited where applicable
  and clearly identified as authorial propositions where evidence is absent.
- Confirm that no prompt or generated artifact depends on the deleted
  standalone methodology file.
- Report the output files and their word counts.

Do not stop after section generation. The task is complete only when the assembled, integrated, twice-reviewed final manuscript and reviewer notes have been written and verified.
