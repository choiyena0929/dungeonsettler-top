#!/usr/bin/env node
import { createHash } from "node:crypto";
import { spawn } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const clean = (value) => String(value ?? "").trim();
const list = (value) => Array.isArray(value) ? value : [];
const unique = (values) => [...new Set(values.map(clean).filter(Boolean))];

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? clean(process.argv[index + 1]) : fallback;
}

async function readJson(path) {
  try { return JSON.parse(await readFile(path, "utf8")); } catch { return null; }
}

function parseJsonOutput(stdout) {
  const text = clean(stdout);
  if (!text) return null;
  try { return JSON.parse(text); } catch { /* try the outermost JSON object below */ }
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  try { return JSON.parse(text.slice(start, end + 1)); } catch { return null; }
}

function runNodeScript(sitePath, script, args) {
  return new Promise((resolveResult) => {
    const child = spawn(process.execPath, [resolve(sitePath, script), ...args], {
      cwd: sitePath,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.on("data", (chunk) => { stderr += chunk; });
    child.on("error", (error) => resolveResult({ script, args, exitCode: 1, stdout, stderr: `${stderr}\n${error.message}`.trim(), result: parseJsonOutput(stdout) }));
    child.on("close", (exitCode) => resolveResult({
      script,
      args,
      exitCode: Number.isInteger(exitCode) ? exitCode : 1,
      stdout,
      stderr,
      result: parseJsonOutput(stdout),
    }));
  });
}

async function walkInputFiles(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true });
  const ignored = new Set([".git", ".next", "dist", "node_modules", "artifacts"]);
  const files = [];
  for (const entry of entries) {
    if (ignored.has(entry.name)) continue;
    const path = join(current, entry.name);
    if (entry.isDirectory()) files.push(...await walkInputFiles(root, path));
    else if (entry.isFile()) files.push(path);
  }
  return files;
}

export async function fingerprintSite(sitePath) {
  const files = (await walkInputFiles(sitePath)).sort();
  const hash = createHash("sha256");
  for (const path of files) {
    hash.update(relative(sitePath, path).replaceAll("\\", "/"));
    hash.update("\0");
    hash.update(await readFile(path));
    hash.update("\0");
  }
  return hash.digest("hex");
}

function buildGap({ id, stage, kind, problem, evidence, requiredChange, rerun }) {
  return { id, stage, kind, problem, evidence: unique(evidence), requiredChange, rerun };
}

export function buildCompletenessLoop({
  site,
  runId,
  observedAt,
  iteration = 1,
  inputFingerprint,
  previous = null,
  dataResult = null,
  evidenceResult = null,
  completenessResult = null,
  commandResults = [],
}) {
  const gaps = [];
  const errors = [];
  const add = (gap) => gaps.push(gap);
  const data = dataResult || {};
  const evidence = evidenceResult || {};
  const completeness = completenessResult || {};
  
  if (!clean(site)) errors.push("站点缺少 site，无法绑定本轮闭环。");
  const observedRunIds = unique([runId, data.runId, evidence.runId, completeness.runId]);
  if (observedRunIds.length > 1) add(buildGap({ id: "run-identity-mismatch", stage: "S1", kind: "incomplete-output", problem: "资料、证据和完整度产物的 runId 不一致。", evidence: ["artifacts/research/data-feasibility.json", "artifacts/research/evidence-readiness.json", "artifacts/quality/completeness.json"], requiredChange: "为同一轮所有机器检查使用同一个 runId。", rerun: "重新生成本轮三个门禁产物。" }));
  const observedClocks = unique([observedAt, data.observedAt, evidence.observedAt, completeness.observedAt]);
  if (observedClocks.length > 1) add(buildGap({ id: "run-clock-mismatch", stage: "S1", kind: "incomplete-output", problem: "资料、证据和完整度产物的 observedAt 不一致。", evidence: ["artifacts/research/data-feasibility.json", "artifacts/research/evidence-readiness.json", "artifacts/quality/completeness.json"], requiredChange: "用同一 UTC observedAt 重建本轮验收收据。", rerun: "重新生成本轮三个门禁产物。" }));
  if (!clean(runId)) add(buildGap({
    id: "run-identity",
    stage: "S1",
    kind: "missing-context",
    problem: "资料计划或证据合同没有共同 runId。",
    evidence: ["research/资料可行性.json", "research/证据就绪.json"],
    requiredChange: "为同一轮资料、证据、截图和验收建立唯一 runId。",
    rerun: "重新生成资料门和证据门产物。",
  }));
  if (!clean(observedAt)) add(buildGap({
    id: "run-clock",
    stage: "S1",
    kind: "missing-context",
    problem: "本轮没有可回查的 UTC observedAt，不能证明验收时间属于同一运行。",
    evidence: ["research/资料可行性.json", "research/证据就绪.json"],
    requiredChange: "用同一个 UTC 时间重建本轮所有验收收据。",
    rerun: "补齐同轮时间后重新运行闭环。",
  }));

  if (dataResult && data.status === "template") add(buildGap({
    id: "data-template",
    stage: "S1",
    kind: "missing-context",
    problem: "资料可行性合同仍是模板。",
    evidence: ["research/资料可行性.json"],
    requiredChange: "先填写公开承诺、三条旅程、字段白名单和来源。",
    rerun: "npm run check:completeness-loop",
  }));
  else if (!dataResult || data.readyForVisitorCompletePlan !== true) add(buildGap({
    id: "data-readiness",
    stage: "S1",
    kind: data.status === "blocked" ? "external-blocker" : "collect-evidence",
    problem: `资料门当前为 ${clean(data.status) || "missing"}，不能支持当前 visitor-complete 承诺。`,
    evidence: [...list(data.errors), ...list(data.warnings), "artifacts/research/data-feasibility.json"],
    requiredChange: "补充官方/交叉来源、版本锁定和字段证据，或收窄公开承诺；禁止用占位数据补齐。",
    rerun: "npm run check:data-feasibility -- --write && npm run check:completeness-loop",
  }));

  if (evidenceResult && evidence.status === "template") add(buildGap({
    id: "evidence-template",
    stage: "S1",
    kind: "missing-context",
    problem: "证据就绪合同仍是模板。",
    evidence: ["research/证据就绪.json"],
    requiredChange: "登记实际身份、版本、快照 hash、抽样和 required 素材。",
    rerun: "npm run check:completeness-loop",
  }));
  else if (!evidenceResult || evidence.readyForVisitorComplete !== true) add(buildGap({
    id: "evidence-readiness",
    stage: "S1",
    kind: evidence.status === "blocked" ? "external-blocker" : "collect-evidence",
    problem: `证据门当前为 ${clean(evidence.status) || "missing"}，visitor-complete 证据尚未闭环。`,
    evidence: [...list(evidence.errors), ...list(evidence.visitorGaps), "artifacts/research/evidence-readiness.json"],
    requiredChange: "补齐事实快照、来源回查、真实文件和按合同声明的素材；未知项保持 unknown/out-of-scope。",
    rerun: "npm run check:evidence-readiness -- --write && npm run check:completeness-loop",
  }));

  if (!completenessResult || completeness.status !== "visitor-complete" || completeness.ok !== true) add(buildGap({
    id: "site-completeness",
    stage: "S2-S4",
    kind: "implement-and-retest",
    problem: `严格完整度门当前为 ${clean(completeness.status) || "missing"}。`,
    evidence: [...list(completeness.errors), "artifacts/quality/completeness.json"],
    requiredChange: "按错误责任阶段补页面家族、真实 href、可重复价值、旅程返回、素材职责或信任边界；不要修改状态卡制造通过。",
    rerun: "npm run check:completeness-loop",
  }));

  for (const command of commandResults) {
    if (!command.result && command.exitCode !== 0) errors.push(`${command.script} 没有产生可解析的机器结果：${clean(command.stderr).slice(-300)}`);
  }

  const previousFingerprint = clean(previous?.inputFingerprint);
  const sameInput = Boolean(previousFingerprint && inputFingerprint && previousFingerprint === inputFingerprint);
  const dataReady = ["data-ready", "bounded-scope"].includes(clean(data.status))
    && data.ok !== false
    && data.readyForVisitorCompletePlan === true;
  const evidenceReady = clean(evidence.status) === "visitor-complete-ready"
    && evidence.ok !== false
    && evidence.readyForVisitorComplete === true;
  const allReady = dataReady
    && evidenceReady
    && completeness.status === "visitor-complete"
    && completeness.ok === true
    && gaps.length === 0;
  if (sameInput && !allReady) {
    errors.push("本轮输入指纹与上一轮相同，不能把原样重跑当成调试进展；必须新增证据、修改实现或收窄承诺。");
  }

  const externalBlock = !allReady && (data.status === "blocked" || evidence.status === "blocked" || gaps.some((gap) => gap.kind === "external-blocker"));
  const status = allReady ? "visitor-complete" : externalBlock || sameInput ? "blocked" : "needs-revision";
  const nextIteration = allReady ? null : {
    iteration: Number(iteration) + 1,
    requiredInputChange: true,
    canContinue: !sameInput,
    ownerStages: unique(gaps.map((gap) => gap.stage)),
    requiredChanges: gaps.map((gap) => ({ id: gap.id, stage: gap.stage, kind: gap.kind, change: gap.requiredChange })),
    rerunCommands: unique(gaps.map((gap) => gap.rerun)),
    stopConditions: [
      "新增证据或实现后才进入下一轮；相同 inputFingerprint 不算进展。",
      "外部来源/权利/版本无法取得时保持 blocked，并记录可执行的解除条件。",
      "只有 data、evidence 和严格完整度三道门全部 ready 才能写 visitor-complete。",
    ],
  };

  return {
    schemaVersion: 1,
    type: "visitor-complete-iteration",
    site: clean(site),
    runId: clean(runId),
    observedAt: clean(observedAt),
    iteration: Number(iteration) || 1,
    inputFingerprint: clean(inputFingerprint),
    previousInputFingerprint: previousFingerprint || null,
    retryChanged: previous ? !sameInput : true,
    ok: allReady && errors.length === 0,
    status,
    current: {
      data: { status: clean(data.status) || "missing", readyForVisitorCompletePlan: data.readyForVisitorCompletePlan === true, errors: list(data.errors), warnings: list(data.warnings) },
      evidence: { status: clean(evidence.status) || "missing", readyForLaunchSlice: evidence.readyForLaunchSlice === true, readyForVisitorComplete: evidence.readyForVisitorComplete === true, errors: list(evidence.errors), visitorGaps: list(evidence.visitorGaps) },
      completeness: { status: clean(completeness.status) || "missing", ok: completeness.ok === true, errors: list(completeness.errors), runId: clean(completeness.runId), observedAt: clean(completeness.observedAt) },
    },
    gaps,
    errors,
    nextIteration,
    commandResults: commandResults.map((command) => ({ script: command.script, exitCode: command.exitCode, resultStatus: clean(command.result?.status) || "unparsed" })),
    stopReason: allReady ? "all-strict-gates-passed" : sameInput ? "same-input-no-progress" : externalBlock ? "external-evidence-blocker" : "revision-required",
  };
}

async function main() {
  const sitePath = resolve(arg("site-path", "."));
  const plan = await readJson(resolve(sitePath, "research/资料可行性.json"));
  const evidence = await readJson(resolve(sitePath, "research/证据就绪.json"));
  const previousPath = resolve(sitePath, arg("previous", "artifacts/quality/completeness-loop.json"));
  const previous = await readJson(previousPath);
  const inputFingerprint = await fingerprintSite(sitePath);
  const runId = arg("run-id", clean(plan?.runId) || clean(evidence?.runId));
  const observedAt = arg("captured-at", clean(plan?.observedAt) || clean(evidence?.observedAt));
  const iteration = Number(arg("iteration", previous?.iteration ? Number(previous.iteration) + 1 : 1)) || 1;
  const commandResults = [];
  const dataRun = await runNodeScript(sitePath, "scripts/检查资料可行性.mjs", ["--site-path", sitePath, "--write"]);
  commandResults.push(dataRun);
  const evidenceRun = await runNodeScript(sitePath, "scripts/检查证据就绪.mjs", ["--site-path", sitePath, "--write"]);
  commandResults.push(evidenceRun);
  const completenessRun = await runNodeScript(sitePath, "scripts/检查站点完整度.mjs", ["--site", sitePath, "--write", "--require-visitor-complete", "--run-id", runId, "--captured-at", observedAt]);
  commandResults.push(completenessRun);
  const report = buildCompletenessLoop({
    site: clean(plan?.site) || clean(evidence?.site),
    runId,
    observedAt,
    iteration,
    inputFingerprint,
    previous,
    dataResult: dataRun.result,
    evidenceResult: evidenceRun.result,
    completenessResult: completenessRun.result,
    commandResults,
  });
  const out = resolve(sitePath, arg("out", "artifacts/quality/completeness-loop.json"));
  if (process.argv.includes("--write")) {
    const persisted = { ...report, generatedAt: new Date().toISOString() };
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, `${JSON.stringify(persisted, null, 2)}\n`, "utf8");
    const historyPath = resolve(sitePath, `artifacts/quality/completeness-loop/iteration-${String(report.iteration).padStart(3, "0")}.json`);
    await mkdir(dirname(historyPath), { recursive: true });
    await writeFile(historyPath, `${JSON.stringify(persisted, null, 2)}\n`, "utf8");
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (!report.ok) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
