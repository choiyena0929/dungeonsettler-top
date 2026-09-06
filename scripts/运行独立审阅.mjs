#!/usr/bin/env node
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { dirname, isAbsolute, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import process from "node:process";
import { fileURLToPath } from "node:url";

export const REVIEW_CRITERIA = Object.freeze([
  "visual-hierarchy",
  "game-identity",
  "responsive",
  "usability",
  "content-seo-balance",
]);

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback;
}

function hasArg(name) {
  return process.argv.includes(`--${name}`);
}

const clean = (value) => String(value ?? "").trim();

function safeSiteRef(sitePath, value, label) {
  const reference = clean(value).replaceAll("\\", "/");
  if (!reference || isAbsolute(reference)) throw new Error(`${label} 必须是站点目录内的相对路径。`);
  const path = resolve(sitePath, reference);
  const rest = relative(resolve(sitePath), path);
  if (!rest || rest.startsWith("..") || isAbsolute(rest)) throw new Error(`${label} 不能指向站点目录外。`);
  return path;
}

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`${label} 不存在或不是有效 JSON：${error.message}`);
  }
}

async function readReviewSources(sitePath, packet) {
  const entries = Object.entries(packet.sourceArtifacts || {});
  if (!entries.length) throw new Error("独立审阅交接包没有列出源文件。 ");
  const sections = [];
  for (const [id, reference] of entries) {
    const path = safeSiteRef(sitePath, reference, `审阅来源 ${id}`);
    sections.push(`--- ${id}: ${reference} ---\n${await readFile(path, "utf8")}`);
  }
  return sections.join("\n\n");
}

async function validPng(sitePath, reference, expectedHash, label) {
  const path = safeSiteRef(sitePath, reference, label);
  const bytes = await readFile(path);
  const image = await stat(path);
  if (image.size < 1024 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error(`${label} 不是有效 PNG 或尺寸过小：${reference}`);
  const actualHash = createHash("sha256").update(bytes).digest("hex");
  if (!clean(expectedHash) || actualHash !== expectedHash) throw new Error(`${label} SHA-256 与质量运行记录不一致：${reference}`);
  return path;
}

export async function validateReviewHandoff({ sitePath, packet, run }) {
  if (packet?.schemaVersion !== 1 || packet.type !== "independent-quality-review-handoff" || packet.status !== "ready") throw new Error("独立审阅交接包结构或状态无效。 ");
  if (packet.handoffId !== run.handoffId || packet.inputRevision !== run.inputRevision || packet.implementerId !== run.implementerId) throw new Error("独立审阅交接包与质量运行的 handoff、输入修订或实现者不一致。 ");
  if (packet.reviewerContract?.role !== "independent-quality-reviewer" || packet.reviewerContract?.context !== "fresh" || packet.reviewerContract?.mustDifferFrom !== run.implementerId) throw new Error("独立审阅交接包缺少 fresh 且不同于实现者的审阅约束。 ");
  const latest = run.rounds?.at(-1);
  if (!latest?.id || packet.latestRound?.id !== latest.id || packet.latestRound.desktopSha256 !== latest.desktopSha256 || packet.latestRound.mobileSha256 !== latest.mobileSha256 || packet.latestRound.desktopViewportSha256 !== latest.desktopViewportSha256 || packet.latestRound.mobileViewportSha256 !== latest.mobileViewportSha256) throw new Error("交接包没有绑定质量运行的最新截图轮次。 ");
  const desktop = await validPng(sitePath, latest.desktopScreenshot, latest.desktopSha256, "桌面截图");
  const mobile = await validPng(sitePath, latest.mobileScreenshot, latest.mobileSha256, "移动截图");
  const desktopViewport = await validPng(sitePath, latest.desktopViewportScreenshot, latest.desktopViewportSha256, "桌面首屏视口截图");
  const mobileViewport = await validPng(sitePath, latest.mobileViewportScreenshot, latest.mobileViewportSha256, "移动首屏视口截图");
  return { latest, desktop, mobile, desktopViewport, mobileViewport };
}

export function assertReviewRunStillCurrent(originalRun, currentRun) {
  const originalLatest = originalRun?.rounds?.at(-1);
  const currentLatest = currentRun?.rounds?.at(-1);
  if (!currentLatest || originalRun.handoffId !== currentRun.handoffId || originalRun.inputRevision !== currentRun.inputRevision || originalLatest?.id !== currentLatest.id || originalLatest?.desktopSha256 !== currentLatest.desktopSha256 || originalLatest?.mobileSha256 !== currentLatest.mobileSha256 || originalLatest?.desktopViewportSha256 !== currentLatest.desktopViewportSha256 || originalLatest?.mobileViewportSha256 !== currentLatest.mobileViewportSha256) throw new Error("质量运行在独立审阅期间发生变化；本次结果不会覆盖新截图，请重新生成审阅包并复审。 ");
  return currentRun;
}

export function normalizeReviewPayload(payload) {
  if (!payload || typeof payload !== "object") throw new Error("Codex 审阅结果不是对象。 ");
  const status = clean(payload.status).toLowerCase();
  const verdict = clean(payload.verdict).toLowerCase();
  if (!["needs-fix", "passed"].includes(status) || !["needs-fix", "passed"].includes(verdict) || status !== verdict) throw new Error("Codex 审阅结果必须使用一致的 needs-fix 或 passed。 ");
  const summary = clean(payload.summary);
  if (summary.length < 80) throw new Error("Codex 审阅摘要少于 80 个字符。 ");
  if (!Array.isArray(payload.criteria)) throw new Error("Codex 审阅结果缺少 criteria 数组。 ");
  const criteria = new Map();
  for (const item of payload.criteria) {
    const id = clean(item?.id);
    if (!REVIEW_CRITERIA.includes(id) || criteria.has(id)) throw new Error(`Codex 审阅标准无效或重复：${id || "missing-id"}`);
    const itemStatus = clean(item?.status).toLowerCase();
    const notes = clean(item?.notes);
    if (!["passed", "failed"].includes(itemStatus) || notes.length < 20) throw new Error(`Codex 审阅标准缺少具体判断：${id}`);
    criteria.set(id, { id, status: itemStatus, notes });
  }
  if (criteria.size !== REVIEW_CRITERIA.length) throw new Error("Codex 审阅没有覆盖五项固定标准。 ");
  const orderedCriteria = REVIEW_CRITERIA.map((id) => criteria.get(id));
  const issues = Array.isArray(payload.issues) ? payload.issues : [];
  for (const issue of issues) {
    if (!clean(issue?.id) || !["blocking", "major", "minor"].includes(clean(issue?.severity)) || !["open", "fixed", "accepted"].includes(clean(issue?.status))) throw new Error(`Codex 审阅问题字段无效：${issue?.id || "missing-id"}`);
    if (clean(issue.status) === "accepted" && !clean(issue.acceptanceReason)) throw new Error(`已接受问题缺少 acceptanceReason：${issue.id}`);
  }
  const openMajor = issues.some((issue) => ["blocking", "major"].includes(clean(issue.severity)) && clean(issue.status) === "open");
  if (status === "passed" && (openMajor || orderedCriteria.some((item) => item.status !== "passed"))) throw new Error("Codex 已声明 passed，但仍有未解决的主要问题或失败标准。 ");
  return { status, verdict, summary, criteria: orderedCriteria, issues };
}

function parseJsonResponse(text) {
  const source = clean(text);
  const candidates = [];
  const balanced = [];
  for (let start = 0; start < source.length; start += 1) {
    if (source[start] !== "{") continue;
    let depth = 0;
    let inString = false;
    let escaped = false;
    for (let index = start; index < source.length; index += 1) {
      const character = source[index];
      if (inString) {
        if (escaped) escaped = false;
        else if (character === "\\") escaped = true;
        else if (character === '"') inString = false;
        continue;
      }
      if (character === '"') { inString = true; continue; }
      if (character === "{") depth += 1;
      if (character === "}") depth -= 1;
      if (depth === 0) {
        balanced.push(source.slice(start, index + 1));
        start = index;
        break;
      }
    }
  }
  candidates.push(...balanced.reverse());
  const fenced = source.match(/```(?:json)?\s*[\s\S]*?\s*```/gi) || [];
  candidates.push(...fenced.map((item) => item.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "")));
  candidates.push(source);
  let firstParsed = null;
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (!firstParsed) firstParsed = parsed;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && ["status", "verdict", "summary", "criteria", "issues"].every((key) => Object.hasOwn(parsed, key))) return parsed;
    } catch { /* 继续尝试更窄的 JSON 片段 */ }
  }
  if (firstParsed) return firstParsed;
  throw new Error("Codex 没有返回可解析的 JSON 审阅结果。 ");
}

function invoke(command, args, cwd, timeoutMs, input = "") {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd, windowsHide: true, stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const append = (target, chunk) => `${target}${String(chunk)}`.slice(-12000);
    child.stdout.on("data", (chunk) => { stdout = append(stdout, chunk); });
    child.stderr.on("data", (chunk) => { stderr = append(stderr, chunk); });
    const timer = setTimeout(() => { timedOut = true; child.kill(); }, timeoutMs);
    if (input) child.stdin?.end(input);
    child.on("error", (error) => { clearTimeout(timer); reject(error); });
    child.on("close", (code, signal) => { clearTimeout(timer); resolvePromise({ code, signal, timedOut, stdout, stderr }); });
  });
}

function reviewerId(packet, startedAt) {
  return `codex-fresh-${createHash("sha256").update(`${packet.handoffId}:${packet.inputRevision}:${packet.latestRound.id}:${startedAt}`).digest("hex").slice(0, 12)}`;
}

function reviewPrompt(packet, sourceSnapshot) {
  const criteria = packet.criteria.map((item) => `- ${item.id}: ${item.question}`).join("\n");
  return `你是本次站点的独立质量审阅者。当前审阅必须使用 fresh context，只读检查，不要修改任何文件，不要部署，不要调用外部服务，也不要沿用实现者的自评理由。

你不需要调用任何工具：审阅交接包列出的源文件原文已经附在本提示末尾。只认真查看本消息附带的桌面截图与移动截图，并以真实成品为准，不评价设计意图。不要运行 shell、site-review、npm、git、MCP 或任何外部服务，不要读取交接包之外的历史报告，不要输出中间进度，直接返回最终 JSON。

审阅时同时查看四张图：桌面/移动整页图用于判断整体层级、页面长度和内容组织；桌面/移动首屏视口图用于判断真实字号、导航、触控和首屏可用性。不要把整页图缩放后的显示比例当作页面实际字号。

固定审阅标准：
${criteria}

请把发现的问题写成可复验的 route、viewport、证据和修订目标。只有五项标准都通过、且没有 open 的 blocking/major 问题时，才能使用 passed；否则使用 needs-fix。criteria 必须且只能覆盖上述五个 id，每项 notes 写具体观察。issues 为空时返回 []；issues 不为空时，按 schema 填写每个字段，不适用的字符串字段填空字符串。summary 只能写 80 个字符以上的中文页面观察，不得提及本提示、criteria、schema、JSON、输出格式、模型或审阅合同，也不要夹带任何英文元话语。

只返回符合输出 JSON Schema 的最终 JSON，不要 Markdown，不要解释 JSON 之外的内容。

审阅交接包源文件原文：
${sourceSnapshot}`;
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    console.log("用法：npm run review:run [-- --site-path <站点目录>] [-- --codex-path <codex.exe>] [-- --timeout-ms <毫秒>] [-- --dry-run]");
    return;
  }
  const sitePath = resolve(arg("site-path", "."));
  const packetPath = resolve(sitePath, arg("packet", "artifacts/quality/independent-review-packet.json"));
  const runPath = resolve(sitePath, arg("run", "artifacts/quality/quality-run.json"));
  const reviewPath = resolve(sitePath, arg("out", "artifacts/quality/quality-review.json"));
  const runRecordPath = resolve(sitePath, arg("run-record", "artifacts/quality/independent-review-run.json"));
  const schemaPath = resolve(dirname(fileURLToPath(import.meta.url)), "独立审阅结果.schema.json");
  const timeoutMs = Math.max(30000, Number(arg("timeout-ms", "300000")) || 300000);
  const command = clean(arg("codex-path", process.env.CODEX_PATH || "codex"));
  const reviewerModel = clean(arg("model", process.env.AI_WEB_REVIEW_MODEL || "gpt-5.6-luna"));
  const reviewerReasoning = clean(arg("reasoning-effort", process.env.AI_WEB_REVIEW_REASONING_EFFORT || "medium"));
  const [packet, run] = await Promise.all([readJson(packetPath, "独立审阅交接包"), readJson(runPath, "质量运行")]);
  const { latest, desktop, mobile, desktopViewport, mobileViewport } = await validateReviewHandoff({ sitePath, packet, run });
  const startedAt = new Date().toISOString();
  const id = reviewerId(packet, startedAt);
  if (hasArg("dry-run")) {
    console.log(JSON.stringify({ ok: true, dryRun: true, command, roundId: latest.id, reviewerId: id, criteria: packet.criteria?.map((item) => item.id) || [] }, null, 2));
    return;
  }
  let sourceSnapshot;
  try {
    sourceSnapshot = await readReviewSources(sitePath, packet);
  } catch (error) {
    await writeJson(runRecordPath, { schemaVersion: 1, type: "independent-quality-review-run", status: "failed", runId: id, startedAt, completedAt: new Date().toISOString(), executor: "codex-cli", freshContext: true, roundId: latest.id, error: error instanceof Error ? error.message : String(error), setupFailure: true });
    throw error;
  }
  const tempDir = await mkdtemp(resolve(tmpdir(), "ai-web-independent-review-"));
  const responsePath = resolve(tempDir, "response.json");
  // `-` is the stdin prompt positional; keep all image options before it so every CLI version receives the four attachments.
  const args = ["exec", "--ephemeral", "--ignore-user-config", "--skip-git-repo-check", "--sandbox", "read-only", "--model", reviewerModel, "-c", `model_reasoning_effort=${reviewerReasoning}`, "--color", "never", "--output-schema", schemaPath, "--output-last-message", responsePath, "-C", sitePath, "-i", desktop, "-i", mobile, "-i", desktopViewport, "-i", mobileViewport, "-"];
  const prompt = reviewPrompt(packet, sourceSnapshot);
  try {
    const result = await invoke(command, args, sitePath, timeoutMs, prompt);
    let raw = "";
    try { raw = await readFile(responsePath, "utf8"); } catch { /* 使用子进程输出回退 */ }
    if (!clean(raw)) raw = `${result.stdout}\n${result.stderr}`;
    let payload;
    let responseError = null;
    try { payload = normalizeReviewPayload(parseJsonResponse(raw)); } catch (error) { responseError = error; }
    if (!payload && (result.timedOut || result.code !== 0)) {
      const processError = result.timedOut ? "Codex 独立审阅超时。" : `Codex 独立审阅退出码：${result.code ?? "unknown"}`;
      await writeJson(runRecordPath, { schemaVersion: 1, type: "independent-quality-review-run", status: "failed", runId: id, startedAt, completedAt: new Date().toISOString(), executor: "codex-cli", freshContext: true, roundId: latest.id, error: processError, responseError: responseError?.message || "", stdoutTail: clean(result.stdout), stderrTail: clean(result.stderr) });
      throw new Error(result.timedOut ? "Codex 独立审阅超时，未写入有效审阅结论。" : `Codex 独立审阅失败，退出码：${result.code ?? "unknown"}`);
    }
    if (!payload) throw responseError || new Error("Codex 没有返回有效审阅结果。 ");
    const currentRun = await readJson(runPath, "最新质量运行");
    assertReviewRunStillCurrent(run, currentRun);
    Object.assign(run, currentRun);
    const review = { schemaVersion: 2, type: "quality-review", status: payload.status, verdict: payload.verdict, handoffId: packet.handoffId, inputRevision: packet.inputRevision, reviewedAt: new Date().toISOString(), reviewedRoundId: latest.id, reviewer: { id, role: "independent-quality-reviewer", context: "fresh" }, summary: payload.summary, criteria: payload.criteria, issues: payload.issues, reviewRunId: id };
    const openBlocking = payload.issues.filter((issue) => issue.severity === "blocking" && issue.status === "open").length;
    const openMajor = payload.issues.filter((issue) => issue.severity === "major" && issue.status === "open").length;
    run.status = payload.status === "passed" ? "passed" : "blocked";
    run.blockingOpen = openBlocking;
    run.majorOpen = openMajor;
    run.independentReviewRunId = id;
    await writeJson(reviewPath, review);
    await writeJson(runPath, run);
    await writeJson(runRecordPath, { schemaVersion: 1, type: "independent-quality-review-run", status: payload.status, runId: id, startedAt, completedAt: new Date().toISOString(), executor: "codex-cli", freshContext: true, roundId: latest.id, responseValidated: true, processExitCode: result.code, processTimedOut: result.timedOut, processWarning: result.timedOut || result.code !== 0, reviewArtifact: "artifacts/quality/quality-review.json", qualityRunArtifact: "artifacts/quality/quality-run.json" });
    console.log(JSON.stringify({ ok: true, status: payload.status, reviewPath, runPath, runRecordPath, roundId: latest.id, reviewerId: id }, null, 2));
  } catch (error) {
    if (!error.message.startsWith("Codex 独立审阅")) await writeJson(runRecordPath, { schemaVersion: 1, type: "independent-quality-review-run", status: "failed", runId: id, startedAt, completedAt: new Date().toISOString(), executor: "codex-cli", freshContext: true, roundId: latest.id, error: "返回结果无法通过质量合同校验。" });
    throw error;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && resolve(process.argv[1]) === currentFile) {
  try {
    await main();
  } catch (error) {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  }
}
