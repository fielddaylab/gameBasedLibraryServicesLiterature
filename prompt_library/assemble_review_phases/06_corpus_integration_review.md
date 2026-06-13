# Integrate Underused Corpus Sources

This prompt can run without conversation history. Resolve `PROJECT_ROOT` and
read:

- the live baseline and runtime structure manifest;
- `00_shared_section_contract.md`;
- `3_article_outputs/stage_5_topical_cohesion_draft.md`;
- every eligible coded summary in `1_coded_gbls_corpus_articles`;
- the current corpus-coverage and citation audits; and
- all working ledgers.

This pass occurs after topical cohesion and before publishability review. Its
purpose is to increase substantive use of the eligible GBLS corpus without
turning the manuscript into an annotated bibliography, citation inventory, or
collection of weakly related claims.

## Blocking Structural Rule

Before and after editing, independently compare every H1-H6 heading with the
live baseline after removing only trailing drafting annotations. Do not add,
remove, rename, relevel, duplicate, merge, split, or reorder headings.

## Source Priority

Classify every eligible summary from the current corpus audit:

1. already cited;
2. substantively consulted but not cited;
3. excluded from synthesis.

Prioritize category 2. Reconsider category 3 only when the summary contains a
substantive, evidence-calibrated contribution that clearly matches a live
heading. Do not integrate resource lists, duplicate records, insubstantial web
pages, non-library evidence without a bounded transferable contribution, or
sources whose own summary recommends exclusion unless semantic review shows
that the prior disposition was mistaken.

## Section Matching

For each uncited summary:

1. read its complete metadata, contributions, summary, and limitations;
2. identify the strongest matching live heading from its suggested
   contribution, service area, game format, intended outcome, and substantive
   findings;
3. inspect the existing paragraph or paragraph group under that heading;
4. integrate the source only when it contributes at least one of:
   - corroborating evidence for an existing synthesis claim;
   - a meaningful disagreement, null finding, or limitation;
   - a distinct library context, audience, game form, or service model;
   - implementation detail needed to bound or operationalize a claim;
   - stronger empirical support than the source currently cited; or
   - evidence for a gap or research priority;
5. prefer adding the citation and the minimum necessary comparison or
   qualification to an existing topic-led paragraph;
6. create new prose only when the source adds a genuinely new distinction that
   the live heading needs.

Do not add a citation merely because a source shares a keyword with a
paragraph. Every added source must support the exact claim to which it is
attached. Preserve source-type and evidence-strength distinctions.

## Cohesion Safeguards

- Keep paragraph subjects topical rather than author-centered.
- Avoid citation chains that combine unrelated findings.
- Do not add one sentence per source.
- When several sources make the same contribution, synthesize them in one
  claim and cite them together.
- Identify practitioner propositions, adjacent evidence, local cases, null
  findings, and conceptual sources as such.
- Remove redundant detail when adding broader or stronger evidence.
- Do not exceed a heading's useful evidentiary density merely to improve a
  coverage count.

## References And Audits

For every newly cited source:

1. add the exact bibliographic heading from its coded summary to References;
2. deduplicate and alphabetize the reference list;
3. update the corpus audit disposition and counts;
4. update the citation audit in both directions;
5. record the heading, paragraph claim, reason for inclusion, and evidence
   limitation in the working ledger.

For every uncited source that remains unused, record a specific reason. Do not
use the generic explanation that it was unnecessary when a more precise reason
is available.

## Output And Verification

Save the revised manuscript as
`3_article_outputs/stage_6_corpus_integration_draft.md`.

Record:

- cited-source count before and after the pass;
- every newly integrated source and destination heading;
- every still-uncited source and its reason;
- sources reconsidered from the excluded category;
- references added or removed;
- narrative and total word-count change; and
- checksums for stages 5 and 6.

Verify exact heading parity, topic-led prose, evidence calibration, baseline
traceability, complete one-row-per-summary corpus accounting, and
bidirectional citation/reference integrity. A higher citation count is not by
itself a successful result; the stage succeeds only when added sources improve
or responsibly qualify the synthesis.
