import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const text = (path) => readFile(new URL(path, root), "utf8");

test("模板保留内容合同、搜索、结构化 SEO、发布与素材闭环门禁", async () => {
  const [content, search, structured, sitemap, packageJson, manifest, assetAudit] = await Promise.all([
    text("app/content.ts"),
    text("app/components/library-search.tsx"),
    text("app/structured-data.tsx"),
    text("app/sitemap.ts"),
    text("package.json"),
    text("research/素材清单.json"),
    text("scripts/检查素材使用.mjs"),
  ]);
  assert.match(content, /EvidenceLevel/);
  assert.match(search, /useMemo/);
  assert.match(structured, /SearchAction/);
  assert.match(structured, /ItemList/);
  assert.match(sitemap, /libraryEntries/);
  assert.match(packageJson, /deploy:cloudflare/);
  assert.match(packageJson, /audit:onpage/);
  assert.match(packageJson, /check:onpage/);
  assert.match(packageJson, /verify:release/);
  assert.match(packageJson, /check:assets/);
  assert.match(manifest, /schemaVersion/);
  assert.match(assetAudit, /requiredAssetIds/);
});

test("模板内置新站治理、来源、阶段证据与页面质量交接文件", async () => {
  const [agents, lock, release, keywords, sources, status, platformQuestions, structuredInput, qualityRun, qualityReview, phaseEvidence] = await Promise.all([
    text("AGENTS.md"), text("PROJECT_LOCK.md"), text("RELEASE_POLICY.md"),
    text("research/keyword-matrix.md"), text("research/source-manifest.md"), text("research/content-status.md"), text("research/platform-questions.md"),
    text("research/research-pack-input.example.json"),
    text("artifacts/quality/quality-run.json"), text("artifacts/quality/quality-review.json"), text("artifacts/phases/phase-evidence.example.json"),
  ]);
  assert.match(agents, /代表页/);
  assert.match(agents, /site-phase\.mjs/);
  assert.match(agents, /ai-web-frontend-system/);
  assert.match(lock, /handoff-id/);
  assert.match(release, /S0-S4/);
  assert.match(keywords, /template/);
  assert.match(sources, /template/);
  assert.match(status, /扩页/);
  assert.match(platformQuestions, /not-queried/);
  const parsedStructuredInput = JSON.parse(structuredInput);
  assert.equal(parsedStructuredInput.schemaVersion, 1);
  assert.equal(parsedStructuredInput.type, "research-pack-input");
  for (const field of ["game", "versionBoundary", "keywordRows", "platformQuestions", "facts"]) assert.ok(parsedStructuredInput[field] !== undefined);
  assert.ok(["not-started", "in-progress", "passed", "blocked"].includes(JSON.parse(qualityRun).status), "质量运行必须处于合同定义的状态");
  assert.deepEqual(JSON.parse(qualityReview).issues, []);
  assert.equal(JSON.parse(phaseEvidence).schemaVersion, 1);
  assert.equal(JSON.parse(phaseEvidence).expectedStateRevision, 1);
});

test("模板不携带原站游戏名、原域名或 Cloudflare 资源名", async () => {
  const files = await Promise.all([text("app/content.ts"), text("app/site-config.ts"), text("README.md")]);
  assert.doesNotMatch(files.join("\n"), /Pass the Fear|passthefearbestbuild|pass-the-fear-feedback/i);
});
