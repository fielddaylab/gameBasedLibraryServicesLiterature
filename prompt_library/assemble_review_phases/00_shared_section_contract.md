# Shared Contract and Limited-Context Protocol

This contract applies to every review phase. It is designed for a model with a
128k-token context window running one fresh invocation at a time.

## Persistent Run State

Never rely on chat history. Persist all cross-invocation state under:

`PROJECT_ROOT/3_article_outputs/run_state/`

Required files:

- `run_status.md`: current phase, completed jobs, next exact command, blockers.
- `structure_manifest.md`: live baseline headings, roles, line spans, targets.
- `source_index.tsv`: one row per summary with citation, key metadata, and
  concise suggested-contribution routing text.
- `section_packets/section_NN/packet.md`: one bounded section packet.
- `section_packets/section_NN/evidence_notes.md`: cumulative batch notes.
- `section_packets/section_NN/draft.md`: completed section.
- `section_packets/section_NN/ledger.md`: baseline and source dispositions.
- `phase_ledgers/phase_NN.md`: changes, checks, and unresolved issues.
- `claim_packets/`: factual-audit batches and completed results.

Every invocation must:

1. read `run_status.md` first;
2. validate that its requested job is the recorded next job or an explicit
   retry;
3. read only the files authorized by that phase prompt;
4. write its artifact and ledger before ending;
5. update `run_status.md` with `COMPLETE`, `BLOCKED`, or the next bounded job;
6. stop after that job. Do not continue into the next phase.

## Context Budget

Treat 80,000 input tokens as the normal ceiling, leaving room for reasoning and
output. Prefer less.

- Never load the complete coded corpus into one context.
- Never load all source texts into one context.
- Never load more than one complete manuscript plus the small control files
  needed for the current editorial pass.
- A source batch may contain at most 12 complete coded summaries or about
  45,000 tokens, whichever comes first.
- Keep each source's cumulative evidence note to 120 words or fewer. Preserve
  claim, method, context, evidence weight, limitation, and citation identity;
  omit general summary prose.
- Keep each section packet plus its cumulative evidence notes below about
  20,000 input tokens. If notes would exceed that ceiling, retain the
  strongest and most discriminating sources, mark the remainder `defer`, and
  preserve them for phase 6's underused-corpus pass.
- A factual-audit batch may contain at most 8 claims and only the source-text
  excerpts or files needed for those claims.
- If an input would exceed the budget, split it and record the remaining batch
  jobs in `run_status.md`.

## Authority and Structure

`0_human_sources/current_manuscript.md` is the sole authority for
manuscript headings, order, annotations, starting prose, and word targets.

For a section job, reread only:

- the complete baseline once when building `structure_manifest.md`; or
- the exact baseline line span recorded for that section when writing it.

Copy H1-H6 headings exactly after removing only trailing drafting
annotations. Never add, remove, rename, relevel, duplicate, merge, split, or
reorder headings.

## Evidence Rules

The coded summaries are the synthesis evidence. The baseline and
`explicit_values.md` guide interpretation but are not empirical evidence.

Use suggested contributions as the primary routing filter. Supplement routing
with structured metadata fields only when a summary has no usable suggested
placement or when a later coverage pass reconsiders it.

Weight evidence by type:

1. empirical studies and evidence syntheses;
2. evaluated implementation cases;
3. frameworks and artifact analyses;
4. practitioner reflections and conceptual arguments;
5. adjacent non-library evidence, explicitly labeled and narrowly used.

Never invent findings, quotations, methods, citations, or bibliography.
Distinguish attendance and enjoyment from learning, transfer, belonging,
equity, wellness, and other outcomes.

## Synthesis Rules

Organize paragraphs around topics, patterns, tensions, mechanisms, contexts,
or service decisions, not around a sequence of papers.

Use this paragraph pattern:

1. state a collective claim or uncertainty;
2. combine applicable evidence;
3. compare context, method, agreement, disagreement, or limitation;
4. interpret the implication for GBLS.

Label a single source as a local case, practitioner proposition, adjacent
finding, or unresolved possibility. Do not give it the grammar of consensus.

## Section Packet Contract

`packet.md` must contain:

- project root and run ID;
- section ID, ordinal, role, baseline line span, and target;
- complete baseline block;
- exact nested heading sequence;
- previous section's final paragraph, if available;
- next section's headings only;
- ordered source-batch manifest;
- compact global terminology and citation notes.

Do not place full summaries in `packet.md`. Each evidence-batch invocation
loads only the summaries named in its batch manifest and appends compact,
source-specific notes to `evidence_notes.md`.

## Ledgers

Record decisions compactly. Do not copy long prose or full summaries into a
ledger.

For each source record:

- filename and bibliographic heading;
- batch number;
- `use`, `consult`, `defer`, or `exclude`;
- destination heading and claim;
- evidence type and limitation;
- citation form.

For each baseline passage record:

- line span;
- retained, revised, relocated, qualified, or omitted;
- short reason.

## Completion Checks

Before completing any job:

- verify the authorized output exists;
- verify heading parity for the material touched;
- verify citations added by the job resolve to coded records;
- record word counts and checksum;
- update the phase ledger and `run_status.md`.

Do not perform the next job in the same invocation.
