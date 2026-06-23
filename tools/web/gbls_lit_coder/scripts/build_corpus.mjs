import fs from "node:fs/promises";
import path from "node:path";

const DEFAULT_ROOT =
  "/Users/djgagnon/Library/CloudStorage/GoogleDrive-djgagnon@wisc.edu/.shortcut-targets-by-id/1P-yeNAX497qAu3txZnKjZZ1ztx8V2nSJ/Phase I - Research, Needs Assessment, and Lit Review Resources/GBLS Lit Review Working Docs";
const root = process.argv[2] || process.env.GBLS_CORPUS_ROOT || DEFAULT_ROOT;
const sourcesDir = path.join(root, "0_human_sources", "corpus_source_texts");
const summariesDir = path.join(root, "1_coded_gbls_corpus_articles");
const lexiconPath = path.join(root, "0_human_sources", "metadata_schema_and_lexicon.md");
const outDir = path.resolve("public/data");
const articleDir = path.join(outDir, "articles");

const idFromName = (name) => name.match(/\(([A-Z0-9]{8})\)/)?.[1];
const normalizeSpace = (value) => value.replace(/\r/g, "").replace(/[ \t]+\n/g, "\n");

function parseLexicon(markdown) {
  const groups = [];
  let group;
  for (const raw of markdown.split(/\r?\n/)) {
    const heading = raw.match(/^#\s+(.+?)\s*:?\s*$/);
    if (heading && heading[1] !== "Controlled Lexicon") {
      group = { id: heading[1].replace(/:$/, ""), label: heading[1].replace(/_/g, " "), items: [] };
      groups.push(group);
      continue;
    }
    const item = raw.match(/^-\s+([a-z0-9_]+)(?::\s*(.*))?$/);
    if (group && item) {
      group.items.push({
        id: item[1],
        label: item[1].replace(/_/g, " "),
        description: item[2] || "",
      });
    }
  }
  return groups.filter((g) => g.items.length);
}

function parseSummary(markdown, fallbackId) {
  const beforeSummary = markdown.split(/^### Summary\s*$/m)[0];
  const metadata = {};
  for (const match of beforeSummary.matchAll(/^([A-Za-z_]+):\s*(.+)$/gm)) {
    metadata[match[1]] = match[2].trim();
  }
  const summarySection = markdown.split(/^### Summary\s*$/m)[1] || markdown;
  const lines = summarySection.trim().split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => /^#\s+/.test(line));
  const citationLine =
    lines[headingIndex]?.replace(/^#\s+/, "").replace(/^\*\*|\*\*$/g, "") ||
    markdown.match(/^##\s+\d+\.\s+(.+)$/m)?.[1] ||
    fallbackId;
  const body = lines.slice(headingIndex >= 0 ? headingIndex + 1 : 0).join("\n").trim();
  return {
    citation: citationLine.replace(/[*_]/g, ""),
    summary: body,
    referenceMetadata: metadata,
  };
}

const stopwords = new Set(
  "a an and are as at be by for from has in includes into is it of on or other rather such than that the their this through to used using where which with without work".split(" ")
);

function keywordsFor(item) {
  return [...new Set(`${item.label} ${item.description}`.toLowerCase().match(/[a-z][a-z-]{2,}/g) || [])]
    .filter((word) => !stopwords.has(word))
    .slice(0, 18);
}

function sentenceSpans(text) {
  const spans = [];
  const regex = /[^.!?\n]+(?:[.!?]+|(?=\n)|$)/g;
  for (const match of text.matchAll(regex)) {
    const value = match[0].trim();
    if (value.length >= 45 && value.length <= 700) {
      const leading = match[0].indexOf(value);
      spans.push({ text: value, start: match.index + leading, end: match.index + leading + value.length });
    }
  }
  return spans;
}

function evidenceFor(text, groups) {
  const spans = sentenceSpans(text);
  const lowerSpans = spans.map((span) => ({ ...span, lower: span.text.toLowerCase() }));
  const result = {};
  for (const group of groups) {
    for (const item of group.items) {
      const words = keywordsFor(item);
      const ranked = lowerSpans
        .map((span) => {
          const hits = words.filter((word) => span.lower.includes(word));
          const negative = /\b(no|not|neither|without|lack(?:s|ed|ing)?|limited|unclear|unknown)\b/.test(span.lower);
          return { ...span, score: hits.length + (span.lower.includes(item.label.replace(/ /g, "-")) ? 2 : 0), negative };
        })
        .filter((span) => span.score > 0)
        .sort((a, b) => b.score - a.score || a.start - b.start);
      const chosen = [];
      for (const span of ranked) {
        if (chosen.every((prior) => Math.abs(prior.start - span.start) > 250)) chosen.push(span);
        if (chosen.length === 3) break;
      }
      result[`${group.id}.${item.id}`] = chosen.map(({ text: quote, start, end, negative }) => ({
        quote,
        start,
        end,
        signal: negative ? "questions" : "supports",
      }));
    }
  }
  return result;
}

await fs.mkdir(articleDir, { recursive: true });
const [sourceNames, summaryNames, lexiconMarkdown] = await Promise.all([
  fs.readdir(sourcesDir),
  fs.readdir(summariesDir),
  fs.readFile(lexiconPath, "utf8"),
]);
const lexicon = parseLexicon(lexiconMarkdown);
const sourceById = new Map(
  sourceNames.filter((name) => name.endsWith(".txt")).map((name) => [idFromName(name), name]).filter(([id]) => id)
);
const summaries = summaryNames.filter((name) => name.endsWith(".md"));
const manifest = [];
const warnings = [];

async function buildArticle(summaryName) {
  const id = idFromName(summaryName);
  const sourceName = sourceById.get(id);
  if (!id || !sourceName) {
    warnings.push(`No extracted .txt source for ${summaryName}`);
    return;
  }
  const [sourceRaw, summaryRaw] = await Promise.all([
    fs.readFile(path.join(sourcesDir, sourceName), "utf8"),
    fs.readFile(path.join(summariesDir, summaryName), "utf8"),
  ]);
  const sourceText = normalizeSpace(sourceRaw).trim();
  const parsed = parseSummary(summaryRaw, id);
  const article = {
    id,
    citation: parsed.citation,
    summary: parsed.summary,
    sourceText,
    evidence: evidenceFor(sourceText, lexicon),
    referenceMetadata: parsed.referenceMetadata,
  };
  await fs.writeFile(path.join(articleDir, `${id}.json`), JSON.stringify(article));
  manifest.push({ id, citation: parsed.citation, wordCount: sourceText.split(/\s+/).length });
}

let nextSummary = 0;
const workers = Array.from({ length: Math.min(40, summaries.length) }, async () => {
  while (nextSummary < summaries.length) {
    const summaryName = summaries[nextSummary++];
    await buildArticle(summaryName);
  }
});
await Promise.all(workers);

manifest.sort((a, b) => a.citation.localeCompare(b.citation));
await Promise.all([
  fs.writeFile(path.join(outDir, "manifest.json"), JSON.stringify({ generatedAt: new Date().toISOString(), articles: manifest }, null, 2)),
  fs.writeFile(path.join(outDir, "lexicon.json"), JSON.stringify(lexicon, null, 2)),
]);
console.log(`Built ${manifest.length} articles and ${lexicon.reduce((n, g) => n + g.items.length, 0)} lexicon items.`);
if (warnings.length) console.warn(warnings.join("\n"));
