# Shared Contract for Runtime GBLS Section Writing

This contract is self-contained. Resolve `PROJECT_ROOT` as the project
directory containing `0-human-sources`, `1-coded-summaries`, and
`prompt-library`. If it cannot be resolved unambiguously, stop and report the
candidate paths.

## Authority

At the time of each task, reread
`PROJECT_ROOT/0-human-sources/baseline_structure_and_prose.md`.
It is the sole authority for section count, heading levels and titles, order,
word targets, drafting annotations, and author-supplied starting prose.

Do not infer structure or content from earlier drafts, outputs, prompt
filenames, remembered headings, or topic expectations.

## Required Runtime Packet

Each section task must receive:

- `PROJECT_ROOT`
- `RUNTIME_SECTION_ID`
- `RUNTIME_SECTION_POSITION`
- `RUNTIME_SECTION_ROLE`: `front matter`, `narrative`, or `reference`
- `RUNTIME_SECTION_BLOCK`: complete freshly extracted H1 block
- `RUNTIME_SOURCE_LINE_SPAN`
- `RUNTIME_WORD_TARGET` and directives, if any
- `PRECEDING_SECTION_CONTEXT`, when available
- `FOLLOWING_SECTION_METADATA`: only its headings, position, and directives

If the packet is absent, stale, or disagrees with the baseline, rebuild it
before writing. Never guess a missing section identity.

## Heading Rules

Copy the H1 and every nested H2-H6 exactly and in order. Remove only trailing
parenthetical drafting annotations. Do not add, omit, rename, merge, split,
relevel, or reorder headings.

Text before the first H1 is workflow material unless explicitly labeled as
manuscript prose.

## Baseline Prose

Associate each non-heading passage with the nearest preceding heading. Treat
it as author-supplied starting prose, not immutable wording and not evidence.

Preserve each substantive idea unless it is duplicative, an editorial
instruction, contradicted by stronger evidence, or outside the declared
scope. Revise, synthesize, qualify, or relocate it when needed. Record every
passage and disposition in the ledger. Never silently discard baseline prose.

Search the coded summaries for support, disagreement, limits, and stronger
formulations. Label unsupported authorial claims as interpretations,
recommendations, or proposed frameworks.

## Evidence And Synthesis

Use all eligible Markdown summaries in
`PROJECT_ROOT/1-coded-summaries`, excluding `template.md` and hidden files.
Search the complete corpus for each section.

Give greatest weight to empirical studies, systematic reviews, meta-analyses,
surveys, interviews, observations, mixed methods, and experiments. Use case
studies for implementation knowledge; use practitioner and opinion sources
cautiously; use historical sources for precedent rather than outcome evidence.

Organize around field-level themes, patterns, debates, service models, design
principles, outcomes, tensions, and historical developments. Avoid
article-by-article paragraphs. Begin substantive sections and subsections with
synthesis claims rather than author citations. Compare contexts, methods, game
forms, agreements, disagreements, null findings, and outliers.

Distinguish attendance and enjoyment from learning, transfer, belonging,
equity, wellness, and other outcomes. Use `explicit_values.md` as declared
orientation, not evidence.

## Citations

Use only citations supported by a coded summary or an explicitly approved
bibliographic record. Match citations to the bibliographic heading stored in
the summary whenever possible. Do not fabricate missing metadata.

Record baseline-only, ambiguous, or unmatched citations as unresolved. Do not
hide them by creating plausible reference entries.

## Working Ledger

Maintain a structured ledger in active context or the disposable run-state
directory. Record:

- every baseline passage and disposition;
- summaries cited;
- summaries substantively consulted but not cited;
- candidate sources rejected for this section and why;
- each author-year citation and matched bibliographic heading;
- unresolved records;
- evidence limitations, null findings, and outliers;
- section word target and actual narrative word count.

Do not write standalone section or ledger files under `2-outputs`.

## Style And Completion

Write analytical, comparative, concise scholarly prose accessible to library
professionals. Use claims followed by evidence and interpretation. Avoid
excessive quotations and repetitive citation chains.

Meet the runtime target where feasible. If adequate synthesis requires a
material deviation, record the amount and reason rather than silently ignoring
the target.

Before returning, reread the live baseline block, verify every H1-H6 heading,
check prose traceability and citations, calculate the section word count, and
return both the completed section and ledger.
