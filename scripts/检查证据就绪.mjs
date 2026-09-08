#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { validateDataFeasibility } from "./检查资料可行性.mjs";

const clean = (value) => String(value ?? "").trim();
const list = (value) => Array.isArray(value) ? value : [];
const STATES = new Set(["confirmed", "partial", "unknown", "missing", "deferred-evidence-gap", "blocked"]);
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? clean(process.argv[index + 1]) : fallback;
}

async function readJson(path, label) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`${label} 不存在或不是有效 JSON：${error.message}`);
  }
}

function isHttp(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function normalizedHash(value) {
  return clean(value).toLowerCase().replace(/^sha256:/, "");
}

function sourceRefExists(sourceManifestText, ref) {
  const escaped = clean(ref).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return Boolean(escaped) && new RegExp(`(^|[^A-Za-z0-9_-])${escaped}([^A-Za-z0-9_-]|$)`, "m").test(sourceManifestText);
}

function validateEvidenceReadiness({ evidence, assetManifest, sourceManifestText = "", fileEvidence = {}, feasibilityResult = null }) {
  const errors = [];
  const visitorGaps = [];
  const fail = (message) => errors.push(message);
  const gap = (message) => visitorGaps.push(message);

  if (![1, 2].includes(Number(evidence?.schemaVersion))) fail("证据就绪合同必须使用 schemaVersion 1 或 2。");
  if (evidence?.phase === "template") {
    return {
      ok: false,
      status: "template",
      readyForLaunchSlice: false,
      readyForVisitorComplete: false,
      counts: { factRows: 0, identityAssets: 0, mechanicAssets: 0, entityAssets: 0 },
      errors: ["证据就绪合同仍是模板，必须在 S2 前填写并复跑。"],
      visitorGaps: [],
    };
  }
  if (evidence?.phase !== "ready") fail("证据就绪合同的 phase 必须为 ready。");
  if (!clean(evidence?.site)) fail("证据就绪合同缺少 site。");
  if (!clean(evidence?.runId)) fail("证据就绪合同缺少 runId。");
  if (!ISO.test(clean(evidence?.observedAt))) fail("observedAt 必须是 UTC ISO 时间（以 Z 结尾）。");
  if (sourceManifestText.trim().length < 40) fail("research/source-manifest.md 缺失或内容过短，不能核验来源。");

  const identity = evidence?.gameIdentity ?? {};
  if (!STATES.has(clean(identity.status))) fail("gameIdentity.status 无效。");
  if (!clean(identity.name) || !clean(identity.id)) fail("gameIdentity 必须有 name 和 id。");
  if (!clean(identity.versionBoundary)) fail("gameIdentity 必须写明精确版本或预发布边界。");
  if (list(identity.sourceRefs).length === 0 || list(identity.sourceUrls).length === 0) fail("gameIdentity 必须有 sourceRefs 和 sourceUrls。");
  if (list(identity.sourceUrls).some((url) => !isHttp(url))) fail("gameIdentity.sourceUrls 必须全部是 HTTP(S) URL。");
  for (const url of list(identity.sourceUrls)) if (!sourceManifestText.includes(url)) fail(`gameIdentity.sourceUrl 未出现在 source-manifest.md：${url}`);
  for (const ref of list(identity.sourceRefs)) if (!sourceRefExists(sourceManifestText, ref)) fail(`gameIdentity.sourceRef 未出现在 source-manifest.md：${ref}`);
  if (identity.status !== "confirmed") gap("游戏身份或版本仍是 partial/unknown，不能升级 visitor-complete。");

  const facts = list(evidence?.factCoverage);
  if (facts.length === 0) fail("factCoverage 至少需要一条用户问题证据记录。");
  for (const fact of facts) {
    if (!clean(fact?.id) || !clean(fact?.question)) fail("每条 factCoverage 必须有 id 和 question。");
    if (!STATES.has(clean(fact?.status))) fail(`事实 ${fact?.id || "missing"} 的 status 无效。`);
    if (list(fact?.sourceRefs).length === 0) fail(`事实 ${fact?.id || "missing"} 缺少 sourceRefs。`);
    for (const ref of list(fact?.sourceRefs)) if (!sourceRefExists(sourceManifestText, ref)) fail(`事实 ${fact?.id || "missing"} 引用了来源清单中不存在的 sourceRef：${ref}`);
    if (["confirmed", "partial"].includes(fact?.status) && list(fact?.allowedRoutes).length === 0) fail(`事实 ${fact?.id || "missing"} 需要 allowedRoutes。`);
  }
  if (!facts.some((fact) => ["confirmed", "partial"].includes(fact?.status))) fail("factCoverage 没有任何 confirmed 或 partial 事实，不能进入 launch-slice。");
  if (facts.some((fact) => fact?.status === "unknown")) gap("仍有用户问题只有 unknown 证据，必须延期或保留未知边界。");

  const snapshot = evidence?.dataSnapshot ?? {};
  if (!STATES.has(clean(snapshot.status))) fail("dataSnapshot.status 无效。");
  if (!clean(snapshot.scope) || list(snapshot.sourceRefs).length === 0) fail("dataSnapshot 必须写明 scope 和 sourceRefs。");
  for (const ref of list(snapshot.sourceRefs)) if (!sourceRefExists(sourceManifestText, ref)) fail(`dataSnapshot 引用了来源清单中不存在的 sourceRef：${ref}`);
  if (snapshot.status === "confirmed" && (!clean(snapshot.path) || !clean(snapshot.hash))) fail("confirmed 数据快照必须有 path 和 hash。");
  if (snapshot.status === "confirmed") {
    if (!fileEvidence?.snapshot?.exists) fail("confirmed 数据快照的实际文件不存在。");
    if (fileEvidence?.snapshot?.exists && normalizedHash(snapshot.hash) !== normalizedHash(fileEvidence.snapshot.hash)) fail("dataSnapshot.hash 与实际文件 SHA-256 不一致。");
    if (!clean(snapshot.generator) || !fileEvidence?.generator?.exists) fail("confirmed 数据快照必须登记且实际存在可重复运行的 generator。");
    const counts = Object.values(snapshot.recordCounts ?? {}).map(Number).filter((value) => Number.isFinite(value) && value > 0);
    if (!counts.length) fail("confirmed 数据快照必须登记至少一个非零 recordCounts。");
    const total = counts.reduce((sum, value) => sum + value, 0);
    const samples = list(snapshot.samples).filter((sample) => clean(sample?.recordId) && sample?.result === "passed" && ISO.test(clean(sample?.verifiedAt)) && list(sample?.sourceRefs).length);
    if (samples.length < Math.min(5, total)) fail("confirmed 数据快照必须保存至少 5 条通过的抽样核验；总记录少于 5 时需要全部核验。");
    for (const sample of samples) for (const ref of list(sample.sourceRefs)) if (!sourceRefExists(sourceManifestText, ref)) fail(`数据抽样 ${sample.recordId} 引用了未知 sourceRef：${ref}`);
  }
  const boundedFactSnapshot = snapshot.status === "partial"
    && ["fact-reconstruction", "manual-normalization", "observation-led"].includes(clean(snapshot.evidenceMode));
  if (snapshot.status !== "confirmed" && !boundedFactSnapshot) gap("没有完整、版本锁定或明确标注为事实重建的数据快照，数据库范围只能保持 partial/延期。");
  if (boundedFactSnapshot && evidence?.scopeDecision?.visitorComplete?.status === "ready") {
    if (clean(snapshot.scopeMode) !== "bounded") gap("事实重建快照必须明确 scopeMode=bounded，不能暗示全游戏数据库。");
    if (list(snapshot.unknowns).length === 0 && list(snapshot.outOfScope).length === 0) gap("事实重建快照需要列出 unknowns 或 outOfScope，避免把未覆盖字段伪装成完整数据。");
  }

  if (assetManifest?.schemaVersion !== 1 || assetManifest?.phase !== "ready") fail("素材清单必须是 ready 的 schemaVersion 1。");
  const assetById = new Map(list(assetManifest?.assets).map((asset) => [clean(asset?.id), asset]));
  const coverage = evidence?.assetCoverage ?? {};
  const assetCounts = {};
  for (const kind of ["identity", "mechanics", "entities"]) {
    const item = coverage[kind] ?? {};
    if (!STATES.has(clean(item.status))) fail(`assetCoverage.${kind}.status 无效。`);
    const ids = list(item.assetIds).map(clean).filter(Boolean);
    assetCounts[`${kind}Assets`] = ids.length;
    if (ids.length === 0 && clean(item.status) !== "missing" && clean(item.status) !== "unknown") fail(`assetCoverage.${kind} 没有 assetIds。`);
    if (ids.length === 0 && ["missing", "unknown", "blocked"].includes(clean(item.status)) && clean(item.reason).length < 12) fail(`assetCoverage.${kind} 缺少证据缺口说明。`);
    for (const id of ids) {
      const asset = assetById.get(id);
      if (!asset) fail(`assetCoverage.${kind} 引用了未知资产：${id}`);
      else {
        if (asset.originalOrGenerated !== false) fail(`assetCoverage.${kind} 不能使用原创或生成资产：${id}`);
        if (!clean(asset.localPath) || !clean(asset.source?.url)) fail(`资产 ${id} 缺少 localPath 或 source.url。`);
        if (!fileEvidence?.assets?.[id]?.exists) fail(`资产 ${id} 的实际 localPath 不存在。`);
      }
    }
    const requiredForVisitorComplete = item.requiredForVisitorComplete !== false;
    const explicitRequiredCount = Number(item.requiredDistinctAssetCount ?? item.minimumDistinctAssets);
    const requiredDistinctAssetCount = kind === "entities"
      ? Math.max(0, Number.isFinite(explicitRequiredCount) ? explicitRequiredCount : (requiredForVisitorComplete ? (Number(evidence?.schemaVersion) === 1 ? 6 : 1) : 0))
      : 0;
    if (requiredForVisitorComplete && kind === "entities" && ids.length < requiredDistinctAssetCount) gap(`当前产品声明需要实体素材，但少于 ${requiredDistinctAssetCount} 个可辨认资产，不能升级 visitor-complete。`);
    if (requiredForVisitorComplete && kind !== "entities" && clean(item.status) !== "confirmed") gap(`${kind} 视觉词汇尚未 confirmed，不能升级 visitor-complete。`);
    if (requiredForVisitorComplete && kind === "entities" && requiredDistinctAssetCount > 0 && clean(item.status) !== "confirmed") gap("当前产品声明需要实体视觉词汇，但尚未 confirmed，不能升级 visitor-complete。");
  }

  const decision = evidence?.scopeDecision ?? {};
  if (decision?.launchSlice?.status !== "ready") fail("scopeDecision.launchSlice.status 必须为 ready 才能进入页面合同。");
  if (clean(decision?.visitorComplete?.status) !== "ready") gap("资料门尚未支持 visitor-complete，继续保持 launch-slice。");
  if (clean(decision?.visitorComplete?.status) === "ready") {
    if (!feasibilityResult?.ok || !feasibilityResult?.readyForVisitorCompletePlan) fail("visitor-complete 必须先通过 research/资料可行性.json 的机器检查。");
    const entityCoverage = coverage?.entities ?? {};
    const explicitRequiredCount = Number(entityCoverage.requiredDistinctAssetCount ?? entityCoverage.minimumDistinctAssets);
    const requiredEntityIconCount = Math.max(0, Number.isFinite(explicitRequiredCount) ? explicitRequiredCount : (entityCoverage.requiredForVisitorComplete === false ? 0 : (Number(evidence?.schemaVersion) === 1 ? 6 : 1)));
    if (requiredEntityIconCount > 0) {
      const entityHashes = list(entityCoverage.assetIds).map((id) => fileEvidence?.assets?.[clean(id)]?.hash).filter(Boolean);
      if (new Set(entityHashes).size < requiredEntityIconCount) fail(`visitor-complete 声明需要 ${requiredEntityIconCount} 个实体素材，但它们必须来自不同文件，不能用同图复制或重复裁切充数。`);
    }
  }

  const readyForLaunchSlice = errors.length === 0;
  const readyForVisitorComplete = readyForLaunchSlice && visitorGaps.length === 0 && decision?.visitorComplete?.status === "ready";
  return {
    ok: readyForLaunchSlice,
    status: readyForVisitorComplete ? "visitor-complete-ready" : readyForLaunchSlice ? "launch-slice-ready" : "blocked",
    readyForLaunchSlice,
    readyForVisitorComplete,
    counts: { factRows: facts.length, ...assetCounts },
    errors,
    visitorGaps,
  };
}

async function main() {
  const sitePath = resolve(arg("site-path", "."));
  const evidence = await readJson(resolve(sitePath, arg("evidence", "research/证据就绪.json")), "证据就绪合同");
  const assets = await readJson(resolve(sitePath, arg("assets", "research/素材清单.json")), "素材清单");
  const sourceManifestPath = resolve(sitePath, clean(evidence?.sourceManifest) || "research/source-manifest.md");
  let sourceManifestText = "";
  try { sourceManifestText = await readFile(sourceManifestPath, "utf8"); } catch { sourceManifestText = ""; }
  const hashFile = async (path) => {
    try {
      const bytes = await readFile(path);
      return { exists: true, hash: createHash("sha256").update(bytes).digest("hex") };
    } catch { return { exists: false, hash: "" }; }
  };
  const snapshotPath = clean(evidence?.dataSnapshot?.path) ? resolve(sitePath, evidence.dataSnapshot.path) : "";
  const generatorPath = clean(evidence?.dataSnapshot?.generator) ? resolve(sitePath, evidence.dataSnapshot.generator) : "";
  const fileEvidence = {
    snapshot: snapshotPath ? await hashFile(snapshotPath) : { exists: false, hash: "" },
    generator: generatorPath ? await hashFile(generatorPath) : { exists: false, hash: "" },
    assets: {},
  };
  for (const asset of list(assets?.assets)) {
    const id = clean(asset?.id);
    if (id && clean(asset?.localPath)) fileEvidence.assets[id] = await hashFile(resolve(sitePath, asset.localPath));
  }
  let feasibilityResult = null;
  try {
    const feasibility = JSON.parse(await readFile(resolve(sitePath, clean(evidence?.dataFeasibility?.path) || "research/资料可行性.json"), "utf8"));
    feasibilityResult = validateDataFeasibility(feasibility);
    const expected = normalizedHash(evidence?.dataFeasibility?.hash);
    const actual = (await hashFile(resolve(sitePath, clean(evidence?.dataFeasibility?.path) || "research/资料可行性.json"))).hash;
    if (expected && expected !== actual) feasibilityResult = { ...feasibilityResult, ok: false, readyForVisitorCompletePlan: false, errors: [...list(feasibilityResult.errors), "dataFeasibility.hash 与实际文件不一致。"] };
  } catch { feasibilityResult = null; }
  const result = validateEvidenceReadiness({ evidence, assetManifest: assets, sourceManifestText, fileEvidence, feasibilityResult });
  const output = { ...result, site: evidence?.site ?? "", runId: evidence?.runId ?? "", observedAt: evidence?.observedAt ?? "" };
  const outputPath = resolve(sitePath, arg("out", "artifacts/research/evidence-readiness.json"));
  if (process.argv.includes("--write")) {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (!result.ok || (process.argv.includes("--require-visitor-complete") && !result.readyForVisitorComplete)) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}

export { validateEvidenceReadiness };
