import fs from "node:fs/promises";
import vm from "node:vm";

const sourcePath = new URL(
  "../public/2_outputs/metrics/metrics_explorer_synthesized_data.js",
  import.meta.url
);
const outputPath = new URL("../public/data/catalog.json", import.meta.url);
const source = await fs.readFile(sourcePath, "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);
const articles = (context.window.GBLS_METRICS?.articles || []).map((article) => ({
  id: article.article_id,
  citation: String(article.citation || "").replace(/^\d+\.\s*/, "").replace(/[*_]/g, ""),
  year: article.year,
}));
await fs.writeFile(outputPath, JSON.stringify({ articles }, null, 2));
console.log(`Built ${articles.length}-article coding catalog.`);
