import test from "node:test";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);
const auditScript = fileURLToPath(new URL("../scripts/审计页面SEO.mjs", import.meta.url));

function page({ path, keyword, title, description, bad = false }) {
  const filler = Array.from({ length: 720 }, (_, index) => `useful${index}`).join(" ");
  return `<!doctype html><html lang="${bad ? "zh-CN" : "en"}"><head><title>${bad ? "Bad" : title}</title><meta name="description" content="${bad ? "short" : description}"><link rel="canonical" href="https://phase-game.test${path}"><script type="application/ld+json">{"@type":"WebPage"}</script></head><body><h1>${keyword}</h1><p>${keyword} gives players a direct answer before the detailed walkthrough begins.</p><nav><a href="/">Home</a><a href="/beginner-guide">Guide</a></nav><img src="/hero.png" alt="${keyword} gameplay"><article>${filler}</article></body></html>`;
}

async function fixture(t, { bad = false } = {}) {
  const root = await mkdtemp(join(tmpdir(), "ai-web-onpage-"));
  t.after(() => rm(root, { recursive: true, force: true, maxRetries: 3 }));
  const contractsPath = join(root, "contracts.json");
  const outPath = join(root, "report.json");
  const contracts = {
    schemaVersion: 1, siteName: "Phase Game", canonicalOrigin: "https://phase-game.test",
    pages: [
      { path: "/", pageType: "homepage", primaryKeyword: "Phase Game", intent: "Players enter the right guide for the problem they need to solve.", acceptance: "The homepage explains the game and sends players to a useful, real answer page.", primaryAction: "Choose a problem", requiredSections: ["Game identity", "Guide entries"], sourceRefs: ["S001"], minWords: 600, minInternalLinks: 2 },
      { path: "/beginner-guide", pageType: "guide", primaryKeyword: "Phase Game beginner guide", intent: "Players follow the starting steps and know what to do next.", acceptance: "The page gives a complete, source-bounded route that players can follow without guessing.", primaryAction: "Start the guide", requiredSections: ["Quick answer", "Step-by-step route"], sourceRefs: ["S001"], minWords: 700, minInternalLinks: 2 },
    ],
  };
  await writeFile(contractsPath, `${JSON.stringify(contracts, null, 2)}\n`, "utf8");
  await writeFile(join(root, "source-manifest.md"), "# Source manifest\n\n- S001: official public reference, https://phase-game.test/source\n", "utf8");
  const pages = new Map([
    ["/", page({ path: "/", keyword: "Phase Game", title: "Phase Game Guides, Answers, and Tools for New Players", description: "Phase Game guides give new players checked answers, practical routes, and useful tools for the current game version.", bad })],
    ["/beginner-guide", page({ path: "/beginner-guide", keyword: "Phase Game beginner guide", title: "Phase Game Beginner Guide: First Steps and Key Choices", description: "Use this Phase Game beginner guide to make the first important choices, avoid common mistakes, and follow a clear starting route." })],
  ]);
  const server = createServer((request, response) => {
    if (["/favicon.ico", "/favicon.svg"].includes(request.url)) { response.writeHead(200, { "content-type": "image/svg+xml" }); response.end("<svg></svg>"); return; }
    const html = pages.get(request.url);
    response.writeHead(html ? 200 : 404, { "content-type": "text/html; charset=utf-8" });
    response.end(html || "missing");
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => server.close());
  const port = server.address().port;
  return { root, contractsPath, outPath, baseUrl: `http://127.0.0.1:${port}` };
}

test("On-page SEO 审计对机器页面合同逐页验收并生成绑定报告", async (t) => {
  const f = await fixture(t);
  await run(process.execPath, [auditScript, "--base-url", f.baseUrl, "--contracts", f.contractsPath, "--source-manifest", join(f.root, "source-manifest.md"), "--out", f.outPath, "--handoff-id", "handoff-test", "--input-revision", "input-test"]);
  const report = JSON.parse(await readFile(f.outPath, "utf8"));
  assert.equal(report.status, "passed");
  assert.equal(report.routes.length, 2);
  assert.equal(report.handoffId, "handoff-test");
});

test("On-page SEO 审计会拒绝错误语言和过短 TDK", async (t) => {
  const f = await fixture(t, { bad: true });
  await assert.rejects(() => run(process.execPath, [auditScript, "--base-url", f.baseUrl, "--contracts", f.contractsPath, "--source-manifest", join(f.root, "source-manifest.md"), "--out", f.outPath, "--handoff-id", "handoff-test", "--input-revision", "input-test"]));
  const report = JSON.parse(await readFile(f.outPath, "utf8"));
  assert.equal(report.status, "failed");
  assert.ok(report.summary.failedChecks.some((item) => item.includes("html-lang")));
  assert.ok(report.summary.failedChecks.some((item) => item.includes("title-length")));
});
