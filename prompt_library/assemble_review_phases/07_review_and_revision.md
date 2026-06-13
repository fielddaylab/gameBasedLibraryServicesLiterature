# Conduct Two Revision Rounds and Simulate Target-Journal Reviews

This prompt can run without conversation history. Resolve `PROJECT_ROOT` and
read:

- the live baseline;
- the runtime manifest and disposable run-state location;
- `0_human_sources/publishability_rubric.md`;
- `3_article_outputs/stage_6_corpus_integration_draft.md`;
- all working ledgers;
- every current audit file.

Do not consult an earlier manuscript as an authority. The revision rounds are
internal editorial work. The final `reviewer_notes.md`, however, must simulate
how reviewers or editors at every target publication named in
`publishability_rubric.md` are likely to assess the manuscript. Clearly label
the reviews as simulations, not actual peer review or editorial decisions.

## Blocking Structural Rule

At the start and end of each round, independently reparse the baseline and
compare every H1-H6 heading with the manuscript after removing only trailing
drafting annotations. A missing, added, renamed, re-leveled, duplicated, or
reordered heading is a blocking defect and must be corrected from the live
baseline, never from memory.

## Round One

Review `stage_6_corpus_integration_draft.md` against every weighted rubric criterion. Evaluate:

- contribution and field-level framing;
- thematic and cross-study synthesis;
- evidence calibration and methodological transparency;
- agreements, disagreements, null findings, and outliers;
- comparison across library contexts and game forms;
- equity, accessibility, and participation;
- practice implications and research agenda;
- organization, transitions, concision, and scholarly voice;
- baseline-prose traceability and word-target adherence;
- complete corpus accounting;
- bidirectional citation integrity.

Keep round-one findings in the disposable run-state ledger. Do not make an
internal process score the primary content of `reviewer_notes.md`.

Revise the complete manuscript, synchronize affected ledgers and audits, and
save `3_article_outputs/stage_7_first_publishability_review_draft.md`. Append a concise revision record. If no text
changes are warranted, state that explicitly and do not claim otherwise.

## Round Two

Conduct a genuinely independent review of
`stage_7_first_publishability_review_draft.md` against the rubric, the
non-destructive factual-reliability audit, and the newly reparsed structure.
Treat quotation-retrieval scores as leads rather than proof. Inspect each
flagged claim semantically and revise only when source evidence warrants a
correction, qualification, citation change, or removal. Look specifically for
residual source-led prose, weak framing paragraphs, repetition, unsupported
generalization, missing counterevidence, equity blind spots, target overruns,
citation problems, traceability gaps, and venue-readiness concerns.

Keep round-two findings in the disposable run-state ledger. Use them to inform
the final venue simulations.

Revise again, synchronize audits, and save `3_article_outputs/stage_8_final_independent_review_draft.md`. If no
further text changes are warranted, document that explicitly.

## Required Reviewer Notes Output

After `stage_8_final_independent_review_draft.md` is complete, overwrite
`3_article_outputs/audits_and_synthetic_reviews/reviewer_notes.md` with a mock
peer-review report driven directly by every target profile in
`publishability_rubric.md`.

Begin with:

- `# Simulated Target-Journal Reviewer Reports`
- a statement that these are synthetic pre-submission reviews;
- the manuscript's exact total word count, narrative word count, reference
  word count, table/figure count, eligible corpus count, and unresolved
  bibliography count;
- any mismatch between the rubric's assumed corpus size and the runtime corpus.

Create one H1 section for every target publication discovered at runtime. Do
not omit a venue and do not collapse venues into a generic recommendation.
For each venue include:

1. **Target Profile Fit:** `PASS` or `FAIL`.
2. **Likely Editorial Recommendation:** choose one of `Reject without review`,
   `Reject and invite resubmission`, `Major revisions`, `Minor revisions`, or
   `Likely acceptable`, with a concise rationale.
3. **Hard Constraint Delta:** show the actual measurement, allowed range, and
   exact amount above or below the limit. For page-based venues, provide a
   transparent estimate and state the assumptions; do not pretend an estimate
   is a typeset page count.
4. **Rubric Score:** a 1–5 score using that venue's qualitative profile. Quote
   or paraphrase the profile criterion that controls the score.
5. **Likely Reviewer Summary:** write in the voice of a knowledgeable,
   constructive journal reviewer assessing contribution, fit, evidence,
   organization, methods, and audience value.
6. **Principal Strengths:** venue-specific, not generic praise.
7. **Major Concerns:** ordered by likely effect on publication.
8. **Required Corrections Checklist:** concrete revisions needed for that
   venue, including what to cut, strengthen, reframe, add, or relocate.
9. **Bottom-Line Fit:** explain whether this venue is a plausible target after
   revision and what manuscript the venue would require.

Apply hard constraints literally. A manuscript that exceeds a stated maximum
cannot receive `PASS` merely because its qualitative score is strong. Evaluate
the manuscript as it exists, not as an imagined shortened version.

End with:

- `# Comparative Submission Assessment`
- a table comparing all venues on hard-constraint fit, qualitative score,
  likely recommendation, revision burden, and substantive alignment;
- a ranked submission recommendation distinguishing best intellectual fit
  from easiest feasible revision;
- `# Cross-Venue Corrections Required Before Submission`;
- unresolved bibliography, corpus-accounting, methods-transparency, and length
  issues that affect every venue.

Do not include internal 90/100-style scores. Do not present a single global
publishability score. Do not claim that a venue reviewed the manuscript.

Finally, compare checksums for `stage_6_corpus_integration_draft.md`,
`stage_7_first_publishability_review_draft.md`, and
`stage_8_final_independent_review_draft.md`, explain any identical stages in
the run-state ledger, and
perform one last H1-H6 parity check against the live baseline.
