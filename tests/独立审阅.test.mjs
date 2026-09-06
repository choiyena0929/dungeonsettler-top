import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { assertReviewRunStillCurrent, normalizeReviewPayload, REVIEW_CRITERIA, validateReviewHandoff } from "../scripts/运行独立审阅.mjs";

const execFileAsync = promisify(execFile);

function criteria(status = "passed") {
  return REVIEW_CRITERIA.map((id) => ({ id, status, notes: `已在桌面和移动截图中逐项核对 ${id}，记录了具体页面观察和通过依据。` }));
}

test("独立审阅执行器按固定顺序校验五项标准", () => {
  const payload = normalizeReviewPayload({
    status: "passed",
    verdict: "passed",
    summary: "已在 fresh context 中查看真实桌面与移动截图，并对页面层级、游戏识别、响应式、可用性和内容 SEO 平衡逐项记录具体观察；没有沿用实现者的自评理由，也没有把构建通过当成视觉通过。",
    criteria: [...criteria()].reverse(),
    issues: [],
  });
  assert.deepEqual(payload.criteria.map((item) => item.id), REVIEW_CRITERIA);
  assert.equal(payload.status, "passed");
});

test("独立审阅执行器保留 needs-fix 与可复验问题", () => {
  const payload = normalizeReviewPayload({
    status: "needs-fix",
    verdict: "needs-fix",
    summary: "移动端首屏仍有明确的任务阻塞，截图显示核心答案被过长的装饰区推到首屏之外，需要先修复首屏信息层级；当前结论只能是 needs-fix，完成修订后还要重新采集并复审最新截图。",
    criteria: criteria(),
    issues: [{ id: "mobile-first-screen", severity: "major", status: "open", route: "/", viewport: "mobile", evidence: "round-2-mobile.png", target: "把核心答案入口移入首屏并重新采集截图。" }],
  });
  assert.equal(payload.status, "needs-fix");
  assert.equal(payload.issues[0].severity, "major");
});

test("独立审阅执行器拒绝自相矛盾或缺少理由的结果", () => {
  assert.throws(() => normalizeReviewPayload({ status: "passed", verdict: "passed", summary: "x".repeat(100), criteria: criteria("failed"), issues: [] }), /passed/);
  assert.throws(() => normalizeReviewPayload({ status: "needs-fix", verdict: "needs-fix", summary: "x".repeat(100), criteria: criteria(), issues: [{ id: "minor", severity: "minor", status: "accepted" }] }), /acceptanceReason/);
});

test("独立审阅执行器只接受站点内且哈希匹配的四张绑定截图", async (t) => {
  const sitePath = await mkdtemp(join(tmpdir(), "ai-web-review-handoff-"));
  t.after(() => rm(sitePath, { recursive: true, force: true }));
  const qualityPath = join(sitePath, "artifacts", "quality");
  await mkdir(qualityPath, { recursive: true });
  const png = Buffer.alloc(2048);
  png.set(Buffer.from("89504e470d0a1a0a", "hex"));
  await writeFile(join(qualityPath, "desktop.png"), png);
  await writeFile(join(qualityPath, "mobile.png"), png);
  await writeFile(join(qualityPath, "desktop-viewport.png"), png);
  await writeFile(join(qualityPath, "mobile-viewport.png"), png);
  const hash = createHash("sha256").update(png).digest("hex");
  const run = {
    schemaVersion: 2,
    handoffId: "handoff-1",
    inputRevision: "input-1",
    implementerId: "implementer-1",
    rounds: [{ id: "round-1", desktopScreenshot: "artifacts/quality/desktop.png", mobileScreenshot: "artifacts/quality/mobile.png", desktopViewportScreenshot: "artifacts/quality/desktop-viewport.png", mobileViewportScreenshot: "artifacts/quality/mobile-viewport.png", desktopSha256: hash, mobileSha256: hash, desktopViewportSha256: hash, mobileViewportSha256: hash }],
  };
  const packet = {
    schemaVersion: 1,
    type: "independent-quality-review-handoff",
    status: "ready",
    handoffId: "handoff-1",
    inputRevision: "input-1",
    implementerId: "implementer-1",
    reviewerContract: { role: "independent-quality-reviewer", context: "fresh", mustDifferFrom: "implementer-1" },
    latestRound: { id: "round-1", desktopSha256: hash, mobileSha256: hash, desktopViewportSha256: hash, mobileViewportSha256: hash },
  };
  const result = await validateReviewHandoff({ sitePath, packet, run });
  assert.equal(result.latest.id, "round-1");
  await assert.rejects(() => validateReviewHandoff({ sitePath, packet: { ...packet, latestRound: { ...packet.latestRound, desktopSha256: "wrong" } }, run }), /绑定|SHA-256/);
});

test("独立审阅执行器不会用旧结果覆盖新截图轮次", () => {
  const base = { handoffId: "handoff-1", inputRevision: "input-1", rounds: [{ id: "round-1", desktopSha256: "a", mobileSha256: "b" }] };
  assert.throws(() => assertReviewRunStillCurrent(base, { ...base, rounds: [{ id: "round-2", desktopSha256: "c", mobileSha256: "d" }] }), /不会覆盖新截图/);
  assert.doesNotThrow(() => assertReviewRunStillCurrent(base, base));
});

test("review:run 的 dry-run 命令会生成可追踪的 fresh 派发计划", async (t) => {
  const sitePath = await mkdtemp(join(tmpdir(), "ai-web-review-dry-run-"));
  t.after(() => rm(sitePath, { recursive: true, force: true }));
  const qualityPath = join(sitePath, "artifacts", "quality");
  await mkdir(qualityPath, { recursive: true });
  const png = Buffer.alloc(2048);
  png.set(Buffer.from("89504e470d0a1a0a", "hex"));
  await writeFile(join(qualityPath, "desktop.png"), png);
  await writeFile(join(qualityPath, "mobile.png"), png);
  await writeFile(join(qualityPath, "desktop-viewport.png"), png);
  await writeFile(join(qualityPath, "mobile-viewport.png"), png);
  const hash = createHash("sha256").update(png).digest("hex");
  await writeFile(join(qualityPath, "quality-run.json"), JSON.stringify({ schemaVersion: 2, handoffId: "handoff-dry", inputRevision: "input-dry", implementerId: "implementer-dry", rounds: [{ id: "round-dry", desktopScreenshot: "artifacts/quality/desktop.png", mobileScreenshot: "artifacts/quality/mobile.png", desktopViewportScreenshot: "artifacts/quality/desktop-viewport.png", mobileViewportScreenshot: "artifacts/quality/mobile-viewport.png", desktopSha256: hash, mobileSha256: hash, desktopViewportSha256: hash, mobileViewportSha256: hash }] }));
  await writeFile(join(qualityPath, "independent-review-packet.json"), JSON.stringify({ schemaVersion: 1, type: "independent-quality-review-handoff", status: "ready", handoffId: "handoff-dry", inputRevision: "input-dry", implementerId: "implementer-dry", reviewerContract: { role: "independent-quality-reviewer", context: "fresh", mustDifferFrom: "implementer-dry" }, latestRound: { id: "round-dry", desktopSha256: hash, mobileSha256: hash, desktopViewportSha256: hash, mobileViewportSha256: hash }, criteria: [] }));
  const scriptPath = fileURLToPath(new URL("../scripts/运行独立审阅.mjs", import.meta.url));
  const { stdout } = await execFileAsync(process.execPath, [scriptPath, "--site-path", sitePath, "--dry-run"], { cwd: sitePath });
  const result = JSON.parse(stdout);
  assert.equal(result.ok, true);
  assert.equal(result.dryRun, true);
  assert.equal(result.roundId, "round-dry");
  assert.match(result.reviewerId, /^codex-fresh-/);
});

test("review:run 在 Codex CLI 不可用时保留失败收据而不伪造通过", async (t) => {
  const sitePath = await mkdtemp(join(tmpdir(), "ai-web-review-cli-missing-"));
  t.after(() => rm(sitePath, { recursive: true, force: true }));
  const qualityPath = join(sitePath, "artifacts", "quality");
  await mkdir(qualityPath, { recursive: true });
  const png = Buffer.alloc(2048);
  png.set(Buffer.from("89504e470d0a1a0a", "hex"));
  await writeFile(join(qualityPath, "desktop.png"), png);
  await writeFile(join(qualityPath, "mobile.png"), png);
  await writeFile(join(qualityPath, "desktop-viewport.png"), png);
  await writeFile(join(qualityPath, "mobile-viewport.png"), png);
  await mkdir(join(sitePath, "research"), { recursive: true });
  await writeFile(join(sitePath, "research", "source.md"), "# Fixture source\n");
  const hash = createHash("sha256").update(png).digest("hex");
  await writeFile(join(qualityPath, "quality-run.json"), JSON.stringify({ schemaVersion: 2, status: "in-progress", handoffId: "handoff-missing", inputRevision: "input-missing", implementerId: "implementer-missing", rounds: [{ id: "round-missing", completedAt: "2026-09-03T00:00:00.000Z", desktopScreenshot: "artifacts/quality/desktop.png", mobileScreenshot: "artifacts/quality/mobile.png", desktopViewportScreenshot: "artifacts/quality/desktop-viewport.png", mobileViewportScreenshot: "artifacts/quality/mobile-viewport.png", desktopSha256: hash, mobileSha256: hash, desktopViewportSha256: hash, mobileViewportSha256: hash }], blockingOpen: 0, majorOpen: 0 }));
  await writeFile(join(qualityPath, "independent-review-packet.json"), JSON.stringify({ schemaVersion: 1, type: "independent-quality-review-handoff", status: "ready", handoffId: "handoff-missing", inputRevision: "input-missing", implementerId: "implementer-missing", reviewerContract: { role: "independent-quality-reviewer", context: "fresh", mustDifferFrom: "implementer-missing" }, latestRound: { id: "round-missing", desktopSha256: hash, mobileSha256: hash, desktopViewportSha256: hash, mobileViewportSha256: hash }, sourceArtifacts: { fixture: "research/source.md" }, criteria: [] }));
  const scriptPath = fileURLToPath(new URL("../scripts/运行独立审阅.mjs", import.meta.url));
  const missingCodex = join(sitePath, "codex-not-installed.exe");
  await assert.rejects(execFileAsync(process.execPath, [scriptPath, "--site-path", sitePath, "--codex-path", missingCodex]), /Codex|审阅|ENOENT/);
  const record = JSON.parse(await readFile(join(qualityPath, "independent-review-run.json"), "utf8"));
  assert.equal(record.status, "failed");
  assert.equal(record.freshContext, true);
  await assert.rejects(readFile(join(qualityPath, "quality-review.json"), "utf8"));
});
