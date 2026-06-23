const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function cleanUsercode(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function safeKeyPart(value) {
  return encodeURIComponent(String(value).toLowerCase());
}

function parseRubric(markdown) {
  const match = markdown.match(/```json rubric\s*([\s\S]*?)```/);
  if (!match) throw new Error("Summary quality rubric definition is missing.");
  const rubric = JSON.parse(match[1]);
  if (!rubric.id || !rubric.version || !Array.isArray(rubric.dimensions) || !rubric.dimensions.length) {
    throw new Error("Summary quality rubric definition is invalid.");
  }
  return rubric;
}

async function loadRubric(request, env) {
  const url = new URL("/summary_quality_rubric.md", request.url);
  const response = await env.ASSETS.fetch(new Request(url));
  if (!response.ok) throw new Error("Summary quality rubric could not be loaded.");
  return parseRubric(await response.text());
}

async function listAll(namespace, prefix) {
  const values = [];
  let cursor;
  do {
    const page = await namespace.list({ prefix, cursor, limit: 1000 });
    const records = await Promise.all(
      page.keys.map((key) => namespace.get(key.name, "json"))
    );
    values.push(...records.filter(Boolean));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return values;
}

function validCoding(body, rubricDefinition) {
  if (!body || typeof body !== "object") return "Missing coding data.";
  if (!/^[A-Za-z0-9][A-Za-z0-9 _.-]{0,39}$/.test(cleanUsercode(body.usercode))) {
    return "Usercode must be 1-40 characters and use letters, numbers, spaces, dots, dashes, or underscores.";
  }
  if (!/^[A-Z0-9]{8}$/.test(String(body.articleId || ""))) {
    return "Invalid article identifier.";
  }
  const metadataOnly = ["prior_prompt_metadata", "human_metadata_only"].includes(body.recordType);
  const codingFunction = body.codingFunction || (metadataOnly ? "metadata" : "combined");
  if (!["summary", "metadata", "combined"].includes(codingFunction)) {
    return "Coding function must be summary or metadata.";
  }
  const rubricKeys = rubricDefinition.dimensions.map((dimension) => dimension.id);
  const validScores = new Set(
    Array.from(
      { length: rubricDefinition.scoreMaximum - rubricDefinition.scoreMinimum + 1 },
      (_, index) => rubricDefinition.scoreMinimum + index,
    ),
  );
  if (codingFunction !== "metadata" && !metadataOnly && (
    body.rubricId !== rubricDefinition.id
    || body.rubricVersion !== rubricDefinition.version
  )) {
    return `Rubric version changed. Reload and use ${rubricDefinition.id} v${rubricDefinition.version}.`;
  }
  if (codingFunction !== "metadata" && !metadataOnly
    && (!body.rubric || rubricKeys.some((key) => !validScores.has(body.rubric[key])))) {
    return "Every summary rubric dimension must be scored.";
  }
  if (codingFunction !== "summary" && (!body.lexicon || typeof body.lexicon !== "object")) {
    return "Lexicon selections are required.";
  }
  return null;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/health") {
      return json({ ok: true });
    }

    if (url.pathname === "/api/usercodes" && request.method === "GET") {
      const users = await listAll(env.ARTICLE_CODING, "user:");
      return json(users.map((record) => record.usercode).sort());
    }

    if (url.pathname === "/api/codings" && request.method === "GET") {
      const articleId = url.searchParams.get("articleId");
      const prefix = articleId ? `coding:${articleId}:` : "coding:";
      return json(await listAll(env.ARTICLE_CODING, prefix));
    }

    if (url.pathname === "/api/codings" && request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Request body must be JSON." }, 400);
      }
      let rubricDefinition;
      try {
        rubricDefinition = await loadRubric(request, env);
      } catch (error) {
        return json({ error: error.message }, 500);
      }
      const error = validCoding(body, rubricDefinition);
      if (error) return json({ error }, 400);

      const usercode = cleanUsercode(body.usercode);
      const codingFunction = body.codingFunction
        || (["prior_prompt_metadata", "human_metadata_only"].includes(body.recordType) ? "metadata" : "combined");
      const codingKey = `coding:${body.articleId}:${safeKeyPart(usercode)}`;
      const existing = await env.ARTICLE_CODING.get(codingKey, "json") || {};
      const savedAt = new Date().toISOString();
      const saved = {
        ...existing,
        articleId: body.articleId,
        usercode,
        rubric: codingFunction === "metadata" ? existing.rubric || null : body.rubric || null,
        rubricId: codingFunction === "metadata" ? existing.rubricId || null : body.rubricId || null,
        rubricVersion: codingFunction === "metadata" ? existing.rubricVersion || null : body.rubricVersion || null,
        lexicon: codingFunction === "summary" ? existing.lexicon || null : body.lexicon,
        summarySavedAt: codingFunction === "metadata" ? existing.summarySavedAt || null : savedAt,
        metadataSavedAt: codingFunction === "summary" ? existing.metadataSavedAt || null : savedAt,
        savedAt,
        recordType: body.recordType || "human_coding",
        source: body.source ?? existing.source ?? null,
        version: 2,
      };
      await Promise.all([
        env.ARTICLE_CODING.put(codingKey, JSON.stringify(saved)),
        env.ARTICLE_CODING.put(
          `user:${safeKeyPart(usercode)}`,
          JSON.stringify({ usercode, lastSeenAt: savedAt })
        ),
      ]);
      return json(saved, 201);
    }

    if (url.pathname.startsWith("/api/")) {
      return json({ error: "Not found." }, 404);
    }

    return env.ASSETS.fetch(request);
  },
};
