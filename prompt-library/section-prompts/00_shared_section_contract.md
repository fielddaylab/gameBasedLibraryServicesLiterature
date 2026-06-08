# Shared Contract for GBLS Section Writers

Use this contract for every section prompt in this directory.

## Project Inputs

- Project root: `/Users/djgagnon/Library/CloudStorage/GoogleDrive-djgagnon@wisc.edu/.shortcut-targets-by-id/1P-yeNAX497qAu3txZnKjZZ1ztx8V2nSJ/Phase I - Research, Needs Assessment, and Lit Review Resources/GBLS Lit Review Working Docs`
- Coded summaries: `1-coded-summaries/*.md`, excluding `template.md`
- Metadata schema: `0-human-sources/metadata-schema-and-lexicon.md`
- Baseline structure, word targets, and author-supplied prose: `0-human-sources/baseline_structure_and_prose.md`
- Authorial commitments: `0-human-sources/explicit_values.md`
- Publishability rubric: `0-human-sources/publishability_rubric.md`
- Section artifacts: `2-outputs/sections`
- Section source ledgers: `2-outputs/section-ledgers`
- Corpus coverage audit: `2-outputs/corpus_coverage_audit.md`
- Baseline prose audit: `2-outputs/baseline_prose_audit.md`

## Shared Argument

Treat Games-Based Library Services (GBLS) as a service ecology connecting collections, circulation, discovery, advisory, programs, spaces, staff expertise, technology, policy, partnerships, preservation, assessment, and patrons. Organize analysis around library purposes and the affordances and burdens of game forms. Games are consequential cultural media, but they are not automatic solutions to learning, belonging, misinformation, wellness, or library relevance.

Use `explicit_values.md` as an interpretive orientation, not as evidence. Clearly distinguish established findings, recurring practitioner knowledge, and the authors' aspirational propositions.

## Runtime Heading Protocol

At the start of every section task, read
`0-human-sources/baseline_structure_and_prose.md` directly from disk. The current baseline,
not headings embedded in a section prompt or remembered from a prior task, is
the sole authority for manuscript structure.

Use the section prompt's assigned H1 position to locate the target section.
Copy that H1 and every consecutive H2 beneath it, stopping at the next H1.
Preserve the headings' wording and order exactly, except remove trailing
parenthetical annotations that specify word counts or drafting instructions.
Do not add, omit, rename, merge, split, or reorder H2 headings.

Immediately before writing the artifact, reread the baseline and extract the
headings again. Immediately after writing, reread it once more and compare the
artifact headings with the fresh extraction. Revise before returning if they
differ.

## Baseline Prose Protocol

The baseline file is also the author-supplied starting draft. For the assigned
H1, extract every non-heading passage from that H1 through the line before the
next H1. Associate each passage with the nearest preceding H1 or H2. Ignore
text before the first H1 unless it is explicitly labeled as manuscript prose.
Treat parenthetical word counts, drafting notes, and import instructions as
directives rather than manuscript prose.

Place the extracted baseline prose into the section before adding synthesis.
Use it as the conceptual and rhetorical starting point, not as immutable
verbatim text. You may edit, combine, reorder within the section, qualify, or
expand it to produce cohesive scholarship. Preserve its substantive ideas
unless they are duplicative, obsolete instructions, contradicted by stronger
evidence, or outside scope. Never silently discard an idea.

Search the coded summaries for evidence applicable to each factual,
historical, interpretive, or evaluative claim in the baseline prose. Add
citations when sources support, complicate, or contest the claim. When no
source supports an important authorial proposition, label it as the review
authors' interpretation, recommendation, or proposed framework rather than
presenting it as an established finding. Do not add decorative citations that
do not actually support the claim.

Record each baseline passage in the section ledger using its source heading
and opening words. Mark it retained, revised, relocated, or omitted, and
explain any relocation or omission. This record will feed
`2-outputs/baseline_prose_audit.md`.

## Evidence Rules

Give the greatest weight to experiments, meta-analyses, systematic reviews, surveys, interviews, observations, mixed-methods studies, and well-reported empirical research. Use case studies for contextual and implementation knowledge. Use practitioner reflections, columns, guides, book reviews, and proposals cautiously. Use historical sources to establish precedent and recurring professional tensions, not contemporary outcomes.

Do not convert repetition into proof. Distinguish attendance, enjoyment, motivation, confidence, knowledge, retention, behavior, transfer, belonging, equity, and well-being. Identify null findings and credible outliers. Label adjacent non-library evidence and limit transfer claims.

## Synthesis Rules

- Begin the H1 section with a field-level claim, never an author citation.
- Begin every H2 subsection with a field-level synthesis claim, tension,
  comparison, or interpretive proposition rather than an individual study.
- Organize around themes, patterns, tensions, comparisons, outcomes, or design principles.
- Use multiple sources in each major thematic claim.
- Compare library types, audiences, formats, and evidence types where relevant.
- Do not write one paragraph per article.
- Do not use sources merely because their metadata suggests this section; include only evidence that advances its argument.
- Prefer concise parenthetical citations and grouped support over repetitive author-led sentences.
- Use brief vignettes only to make a field-level claim concrete.
- End with implications for librarians, directors, and governing or leadership bodies.
- Close with a transition that prepares the next H1 section without previewing it mechanically.

## Source Handling

Read the full coded summaries most relevant to the section, including their metadata, evidence limits, suggested contributions, and exclusions. Search the complete summary corpus for the section's headings, service areas, game formats, outcomes, design principles, and named debates. Baseline prose establishes the starting argument but is not evidence by itself.

Maintain a section source ledger while drafting. Save it as
`2-outputs/section-ledgers/<section-artifact-basename>.md`. For every coded
summary reviewed, record the summary filename and classify it as cited,
substantively consulted but not cited, or excluded from the section. Give a
brief reason for uncited and excluded records. For every author-year citation
used, preserve the full citation from the summary heading for later
bibliography assembly. Do not invent missing bibliographic data.

Before completing a section, compare its ledger with the complete corpus.
Check that highly represented topics have not crowded out relevant minority
findings, null results, underrepresented library contexts, or credible
outliers.

## Style and Length

Write analytical, comparative, concise scholarly prose accessible to library
professionals. Use the H1, H2, and word target extracted from the current
baseline at runtime. Omit parenthetical baseline annotations from manuscript
headings. Target the extracted word count within approximately 5 percent.
Word targets exclude the reference ledger.

Return the completed section artifact and its source ledger unless the section
prompt requests additional files.
