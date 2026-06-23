# GBL Corpus Coder

A deliberately small public web application for independent human coding of the
Games-Based Library Services corpus.

## Coding functions

The coding interface is divided into two independent functions:

- **Summary quality** shows the full article on the left, the generated summary
  at upper right, and the versioned quality rubric at lower right.
- **Metadata coding** shows the full article on the left and the controlled
  metadata selections on the right. Hovering or focusing any metadata term
  displays its definition.

Each function can be completed and saved separately. The Worker merges both
submissions into the same article-and-usercode record and stores
`summarySavedAt` and `metadataSavedAt` timestamps, so one function does not
overwrite the other.

## Current corpus build

The checked-in catalog contains all 200 articles represented in the Metrics
Explorer. Articles whose Google Drive source and summary files hydrated during
local verification include full text, summaries, and evidence suggestions.
Other catalog articles still open a metadata-only coding form. Run
`npm run build:corpus` after the Drive folder is fully available offline to add
full content for every matched article.

## Metrics Explorer integration

The Metrics Explorer is bundled at `/metrics_explorer/`. Its article citations
and **Code metadata** buttons link to `/?article=ZOTERO_ITEM_KEY`, which opens
that exact article in the coder. Explorer-launched links also include a
validated return URL. In that mode, the coder shows a top-left **Back to
metrics explorer** link and changes the save action to **Save and return to
metrics explorer**.

`Coding_Confidence` is AI workflow metadata. The human coder excludes that
group from its assignment form, reliability view, saved human records, and
review tables.

The matching files in the original Google Drive `metrics_explorer/` directory
use `http://localhost:8787/` when opened directly as local files. When hosted
under this Worker, they use the Worker root automatically.

To recreate the complete article-link catalog:

```sh
npm run build:catalog
```

To import metadata previously assigned in the coded summaries as independent
records under usercode `gpt5.5-i1`:

```sh
npm run seed:prior-metadata
```

Pass another API base URL as the final argument when seeding a deployed Worker:

```sh
npm run seed:prior-metadata -- https://your-worker.workers.dev
```

These imported records intentionally have blank summary rubric scores because
the prior prompts assigned metadata rather than evaluating summary quality.

## Architecture

- Vanilla HTML, CSS, and JavaScript. No frontend build step or framework.
- Corpus content is generated as static JSON from the existing source-text and
  coded-summary folders.
- One Cloudflare Worker serves the static app and a four-route JSON API.
- Cloudflare Workers KV stores one record per article and usercode. There is no
  database server, schema migration, account system, or password handling.

The "login" is identification only. Anyone who knows a usercode can overwrite
that usercode's coding for an article. This matches the requested lightweight
workflow but is not authentication.

## Build the corpus

From this directory:

```sh
npm run build:corpus
```

The script defaults to the current Google Drive corpus path. To use another
checkout:

```sh
GBLS_CORPUS_ROOT="/path/to/GBLS Lit Review Working Docs" npm run build:corpus
```

Only records with both a `.txt` extracted source and a matching `.md` summary
are published. The identifier in parentheses, such as `R55LL85J`, is the join
key. The script reports unmatched summaries.

The generated `public/data/` files include source text and therefore should only
be deployed when public redistribution of the corpus is permitted.

## Run locally

```sh
npm install
npm run dev
```

Wrangler provides a persistent local KV namespace. Open the URL printed by
Wrangler.

## Deploy free on Cloudflare

```sh
npm install
npx wrangler login
npm run build:corpus
npm run deploy
```

Wrangler can automatically provision the `ARTICLE_CODING` KV binding declared
without an ID in `wrangler.jsonc`. The Worker and static assets deploy together.

For continuous deployment, connect the repository in the Cloudflare dashboard
and use:

- Build command: `npm run build:corpus`
- Deploy command: `npx wrangler deploy`

The hosted build environment will not have access to the local Google Drive
path. Commit the generated `public/data/` directory, or copy the corpus into the
repository and set `GBLS_CORPUS_ROOT` in the build environment.

## Data model

KV key:

```text
coding:{articleId}:{normalized-usercode}
```

Record:

```json
{
  "articleId": "R55LL85J",
  "usercode": "coder-01",
  "rubric": {
    "accuracy": 3,
    "coverage": 2,
    "clarity": 3
  },
  "rubricId": "gbls_summary_quality",
  "rubricVersion": "1.0.0",
  "lexicon": {
    "Source_Type": {
      "peer_reviewed_journal_article": false
    }
  },
  "summarySavedAt": "2026-06-09T00:00:00.000Z",
  "metadataSavedAt": "2026-06-09T00:03:00.000Z",
  "savedAt": "2026-06-09T00:03:00.000Z",
  "version": 2
}
```

Saving either coding function again with the same article and usercode updates
that portion of the independent coding while retaining the other portion.

## Back Up Coding Records

Cloudflare KV is external to this repository. On the review screen, use
**Export JSON** after each coding session. The download contains all records
returned by `GET /api/codings` and is named
`gbl-article-codings-YYYY-MM-DD.json`.

Store exports in an access-controlled shared location. Do not commit them
without first reviewing whether coder identities or source-derived data require
restricted handling. Cloning this repository does not restore KV records.

## Metrics

For the selected article, the review screen reports:

- Number of distinct saved usercodes
- Mean score for each rubric dimension
- Population standard deviation for each rubric dimension
- Every individual coding record

For each binary lexicon item, it reports a Fleiss-style kappa calculated across
articles with at least two codings. It supports varying numbers of coders per
article by using pairwise observed agreement and pooled category prevalence.
Kappa is omitted when fewer than two multiply-coded articles exist or expected
agreement is 1.

## Adjust the rubric

The authoritative rubric is
`public/summary_quality_rubric.md`. Its `json rubric` code block is loaded by
both the browser and the Worker. Every human summary coding stores the rubric
ID and version used when it was created.

Increment the semantic version whenever a dimension, description, score label,
or scoring range changes. The Worker rejects saves from browser pages using an
older version, requiring the coder to reload. Existing records without rubric
metadata remain readable and are labeled `Legacy / unversioned`; review
averages include only records made with the current rubric version.
