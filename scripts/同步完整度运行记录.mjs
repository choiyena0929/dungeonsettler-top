#!/usr/bin/env node
import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const clean = (value) => String(value ?? "").trim();
function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? clean(process.argv[index + 1]) : fallback;
}
async function readJson(path) {
  return JSON.parse((await readFile(path, "utf8")).replace(/^\uFEFF/, ""));
}
async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const sitePath = resolve(arg("site-path", "."));
  const dataPath = resolve(sitePath, "research/资料可行性.json");
  const evidencePath = resolve(sitePath, "research/证据就绪.json");
  const receiptPath = resolve(sitePath, arg("receipt", "artifacts/quality/current-completeness-run.json"));
  if (!existsSync(dataPath) || !existsSync(evidencePath)) throw new Error("缺少 research/资料可行性.json 或 research/证据就绪.json；先完成 S1 资料证据门，不自动创建占位合同。");
  const previous = existsSync(receiptPath) ? await readJson(receiptPath) : {};
  const forceNew = process.argv.includes("--new-run");
  const runId = arg("run-id", !forceNew ? clean(previous.runId) : "") || `completeness-${new Date().toISOString().replace(/[-:.TZ]/g, "").slice(0, 14)}-${randomUUID().slice(0, 8)}`;
  const capturedAt = arg("captured-at", !forceNew ? clean(previous.capturedAt) : "") || new Date().toISOString();
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(capturedAt)) throw new Error("captured-at 必须是 UTC ISO 时间并以 Z 结尾。");
  const data = await readJson(dataPath);
  data.runId = runId;
  data.observedAt = capturedAt;
  await writeJson(dataPath, data);
  const dataHash = createHash("sha256").update(await readFile(dataPath)).digest("hex");
  const evidence = await readJson(evidencePath);
  evidence.runId = runId;
  evidence.observedAt = capturedAt;
  evidence.dataFeasibility ??= { path: "research/资料可行性.json", hash: dataHash };
  evidence.dataFeasibility.path = "research/资料可行性.json";
  evidence.dataFeasibility.hash = dataHash;
  await writeJson(evidencePath, evidence);
  const receipt = { schemaVersion: 1, runId, capturedAt, observedAt: capturedAt, generatedAt: capturedAt, dataPath: "research/资料可行性.json", evidencePath: "research/证据就绪.json", dataHash };
  await writeJson(receiptPath, receipt);
  process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) main().catch((error) => { console.error(error.message); process.exitCode = 1; });

