# Master Dispatcher: Build the GBLS Literature Review in Bounded Contexts

This workflow is designed for a model with a 128k-token context window. It
must be run as a sequence of fresh invocations. No invocation should attempt
the whole review, and no step may rely on chat history.

## Project Root

Define `PROJECT_ROOT` as the parent of the `prompt_library` directory
containing this file. Resolve every path relative to it.

Required inputs:

- `0_human_sources/current_manuscript.md`
- `0_human_sources/metadata-schema-and-lexicon.md`
- `0_human_sources/explicit_values.md`
- `0_human_sources/publishability_rubric.md`
- `0_human_sources/source_texts/`
- `1_coded_gbls_corpus_articles/*.md`, excluding hidden files and `template.md`
- all files in `prompt_library/assemble_review_phases/`

Canonical manuscripts:

1. `stage_1_initial_assembly_draft.md`
2. `stage_2_whole_manuscript_integration_draft.md`
3. `stage_3_heading_framing_draft.md`
4. `stage_4_terminology_introduction_draft.md`
5. `stage_5_topical_cohesion_draft.md`
6. `stage_6_corpus_integration_draft.md`
7. `stage_7_first_publishability_review_draft.md`
8. `stage_8_final_independent_review_draft.md`

Canonical audits:

- `runtime_structure_manifest.md`
- `baseline_prose_audit.md`
- `corpus_coverage_audit.md`
- `citation_audit.md`
- `factual_reliability_audit.md`
- `reviewer_notes.md`

## Invocation Syntax

The user or operator supplies one command per fresh conversation:

```text
Run assemble_review.md: INIT
Run phase 01: BUILD_PACKET section_02
Run phase 01: READ_EVIDENCE_BATCH section_02 batch_01
Run phase 01: DRAFT_SECTION section_02
Run phase 02: ASSEMBLE_STAGE_1
Run phase 02: INTEGRATE_STAGE_2
Run phase 03
Run phase 04
Run phase 05
Run phase 06: BUILD_UNDERUSED_INDEX
Run phase 06: READ_UNDERUSED_BATCH batch_01
Run phase 06: APPLY_INTEGRATION
Run phase 07: PUBLISHABILITY_ROUND_1
Run phase 07: FACT_CHECK_BATCH batch_01
Run phase 07: COMBINE_FACT_AUDIT
Run phase 07: PUBLISHABILITY_ROUND_2
Run phase 07: WRITE_REVIEWER_NOTES
Run assemble_review.md: FINAL_VERIFY
```

If no command is supplied, read
`3_article_outputs/run_state/run_status.md`, report the exact next command,
and stop. Never infer permission to execute multiple jobs.

## Non-Negotiable Context Rules

Read `assemble_review_phases/00_shared_section_contract.md` for every job.

- Normal input ceiling: 80,000 tokens.
- Leave at least 25 percent of the context window for reasoning and output.
- Never load the complete coded corpus in one invocation.
- Never load all source texts in one invocation.
- Never read more than 12 complete coded summaries in one source batch.
- Never fact-check more than 8 claims in one invocation.
- Later editorial phases read one manuscript and compact ledgers, not the
  corpus.
- Persist every handoff to disk before stopping.

If a job would exceed these limits, split it, record the subjobs in
`run_status.md`, and perform only the first subjob.

## `INIT`

This is the only initialization job.

### Approval Gate

Before modifying `3_article_outputs`, report:

1. resolved project root;
2. eligible summary count;
3. heading counts by level;
4. exact generated files and directories that would be cleared.

Ask for approval. If approval has not been given in the current or immediately
preceding user message, stop.

### Initialize

After approval:

1. validate all required inputs;
2. clear generated contents under `3_article_outputs`;
3. create:
   - `3_article_outputs/audits_and_synthetic_reviews/`
   - `3_article_outputs/run_state/section_packets/`
   - `3_article_outputs/run_state/phase_ledgers/`
   - `3_article_outputs/run_state/claim_packets/`
4. read the baseline once and create `run_state/structure_manifest.md`;
5. copy the public structural summary to
   `audits_and_synthetic_reviews/runtime_structure_manifest.md`;
6. scan every coded summary without loading all files into model context at
   once and create `run_state/source_index.tsv`.

`source_index.tsv` must contain one row per eligible summary with:

- filename;
- bibliographic heading;
- citation key, year, and Zotero key;
- source type, evidence type, methodology, library context, game format,
  service areas, audience, and intended outcomes;
- a concise suggested-contribution destination and contribution;
- explicit no-addition or exclusion recommendation;
- approximate file token or word count.

Limit suggested-contribution text to 80 words per source. Preserve concrete
destinations, claims, evidence type, and limitations; discard generic summary
language.

This indexing step is extraction, not synthesis. Use scripts or bounded file
loops when available rather than pasting the corpus into the prompt.

Create `run_state/run_status.md` with:

- run ID and date;
- baseline checksum;
- corpus count and index checksum;
- current status;
- completed jobs;
- exact next command;
- blocking issues;
- global unresolved bibliography and terminology notes.

Use this compact template:

```text
# Run Status
Run ID:
Baseline checksum:
Corpus count:
Current phase:
Current job:
Status:
Completed jobs:
Next command:
Blockers:
Bibliography notes:
Terminology notes:
```

Set the next command to `Run phase 01: BUILD_PACKET section_01` and stop.

## Section Sequence

For every H1 block in `structure_manifest.md`, run phase 01 jobs in order:

1. `BUILD_PACKET section_NN`
2. each recorded `READ_EVIDENCE_BATCH section_NN batch_MM`
3. `DRAFT_SECTION section_NN`

Start a fresh conversation for every job. The final section is the
reference-role section if the baseline defines one.

Do not begin phase 02 until `run_status.md` marks every section complete.

## Phase Sequence

After sections, follow only the next command written in `run_status.md`:

1. phase 02 assembly, then integration;
2. phase 03 heading framing;
3. phase 04 terminology;
4. phase 05 topical cohesion;
5. phase 06 underused-corpus batches and integration;
6. phase 07 round one, factual batches, factual merge, round two, reviewer
   notes;
7. `FINAL_VERIFY`.

Each phase prompt defines its own authorized inputs and output. Do not carry
extra files into context "for completeness."

## Audit Ownership

Build audits incrementally rather than at the end:

- baseline passage dispositions accumulate in section ledgers and are merged
  after stage 1;
- corpus dispositions accumulate in section and phase-6 ledgers;
- citation mappings accumulate whenever citations are added;
- factual evidence is produced only in phase-7 claim batches;
- reviewer notes are produced only after stage 8.

Every eligible summary and substantive baseline passage must appear exactly
once in its final audit.

## `FINAL_VERIFY`

Run in a fresh context. Read:

- the shared contract;
- `run_status.md`;
- `structure_manifest.md`;
- all eight manuscripts;
- the six final audits;
- compact phase ledgers.

Do not read coded summaries or source texts.

Verify:

1. all eight manuscripts exist;
2. every H1-H6 heading exactly matches the freshly reparsed baseline after
   removing only trailing drafting annotations;
3. all six audits exist;
4. every baseline passage appears once in the baseline audit;
5. every eligible summary appears once in the corpus audit;
6. citations and references match bidirectionally;
7. every factual claim batch is complete and every flag has a round-two
   disposition;
8. narrative and total word counts and target deviations are current;
9. stage checksums differ or an identical stage is explained;
10. no stale pre-renumbering manuscript or obsolete section directory remains.

Write the final verification result to `run_status.md`. Report output paths,
corpus and heading counts, all stage word counts, unresolved bibliography,
target deviations, and pass/fail status.

If verification passes, mark the run `COMPLETE`. Keep `run_state/` until human
review is finished; it is the reproducible handoff record for limited-context
runs.

## Quality Standard

The final review must remain a thematic, comparative synthesis rather than an
annotated bibliography. Batching is a memory-management technique, not a
license to flatten distinctions. Compact handoffs must preserve evidence type,
context, disagreement, null findings, limitations, baseline traceability, and
exact citation identity.
