#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const clean = (value) => String(value ?? "").trim();
const list = (value) => Array.isArray(value) ? value : [];
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/;
const SCHEMA_VERSIONS = new Set([1, 2]);
const SOURCE_CLASSES = new Set([
  "official-store", "official-news", "developer-site", "official-press-kit", "official-wiki", "official-api", "official-discord", "official-sheet",
  "free-demo", "community-api", "community-repository", "community-sheet", "reviewed-guide", "community-wiki",
  "video-observation", "search-discovery",
]);
const SOURCE_STATUSES = new Set(["reachable", "partial", "blocked", "not-queried"]);
const AUTHORITIES = new Set(["official", "first-party", "reviewed-secondary", "community", "community-high-confidence", "observable", "discovery-only"]);
const ACCESS = new Set(["public-web", "public-api", "public-download", "public-video", "public-sheet", "free-demo", "owned-client", "developer-contact"]);
const FORMATS = new Set(["json", "csv", "api", "rss", "html", "media", "repository", "sheet", "video", "none"]);
const NEED_STATUSES = new Set(["covered", "partial", "blocked", "out-of-scope"]);
const USE_MODES = new Set(["bulk-import", "manual-fact-extraction", "normalize-facts", "visual-observation", "official-copy"]);
const DECISIONS = new Set(["data-ready", "bounded-scope", "blocked", "visitor-complete-feasible", "scope-complete-only"]);
const CONFIDENCE = new Set(["high", "medium", "low"]);
const FACT_RIGHTS = new Set(["extract-and-rewrite", "observe-and-rewrite", "cite", "observe", "reuse-permitted", "attribution-required", "unknown", "blocked"]);
const SAFE_DATASET_RIGHTS = new Set(["reuse-permitted", "attribution-required"]);
const SAFE_MEDIA_RIGHTS = new Set(["reuse-permitted", "attribution-required"]);
const SCORE_BANDS = new Set(["data-ready", "bounded-scope", "narrow-scope", "blocked"]);

function isHttp(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function host(value) {
  try { return new URL(value).hostname.toLowerCase().replace(/^www\./, ""); }
  catch { return ""; }
}

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? clean(process.argv[index + 1]) : fallback;
}

function reachable(source) {
  return source && ["reachable", "partial"].includes(clean(source.status));
}

function normalizedDecisionStatus(value) {
  const status = clean(value);
  if (status === "visitor-complete-feasible") return "data-ready";
  if (status === "scope-complete-only") return "bounded-scope";
  return status;
}

function factUse(source) {
  return clean(source?.rights?.facts) || clean(source?.factUse);
}

function factExtractionAllowed(source) {
  return ["extract-and-rewrite", "observe-and-rewrite", "cite", "observe", "reuse-permitted", "attribution-required"].includes(factUse(source));
}

function scoreBand(total) {
  if (total >= 80) return "data-ready";
  if (total >= 60) return "bounded-scope";
  if (total >= 40) return "narrow-scope";
  return "blocked";
}

function clamp(value, max) { return Math.max(0, Math.min(max, Math.round(value))); }

/**
 * Data availability is a planning signal, not a truth score. It measures how
 * cheaply the public evidence can support a declared product scope. Authority,
 * fact extraction and media/dataset reuse are evaluated separately below.
 */
export function calculateDataAvailabilityScore(plan) {
  const sources = list(plan?.sourceCandidates);
  const usable = sources.filter(reachable);
  const official = usable.filter((source) => ["official", "first-party"].includes(clean(source.authority)));
  const community = usable.filter((source) => ["community", "community-high-confidence", "reviewed-secondary", "observable"].includes(clean(source.authority)));
  const structured = usable.filter((source) => ["json", "csv", "api", "repository", "sheet"].includes(clean(source.format)));
  const observable = usable.filter((source) => ["free-demo", "video-observation"].includes(clean(source.sourceClass)) || clean(source.access) === "free-demo");
  const patches = usable.filter((source) => clean(source.sourceClass) === "official-news");
  const videos = usable.filter((source) => clean(source.sourceClass) === "video-observation");
  const needs = list(plan?.dataNeeds);
  const coveredNeeds = needs.filter((need) => clean(need.status) === "covered").length;
  const versioned = usable.filter((source) => clean(source.versionBoundary)).length;
  const media = usable.filter((source) => SAFE_MEDIA_RIGHTS.has(clean(source?.rights?.media))).length;
  const components = {
    officialSources: clamp(official.length * 10, 20),
    communitySources: clamp(community.length * 5, 15),
    structuredData: clamp(structured.length * 5, 15),
    observableEvidence: clamp(observable.length * 5, 10),
    patchHistory: clamp(patches.length * 5, 10),
    videoEvidence: clamp(videos.length * 5, 10),
    journeyCoverage: needs.length ? clamp((coveredNeeds / needs.length) * 15, 15) : 0,
    versionClarity: usable.length ? clamp((versioned / usable.length) * 5, 5) : 0,
    mediaAvailability: clamp(media * 2, 5),
  };
  const total = Object.values(components).reduce((sum, value) => sum + value, 0);
  return {
    total,
    band: scoreBand(total),
    components,
    basis: { usableSourceCount: usable.length, coveredNeedCount: coveredNeeds, totalNeedCount: needs.length },
    method: "public-fact-acquisition-v1",
  };
}

function validateScore(plan, fail) {
  const score = plan?.dataAvailabilityScore;
  if (!score || typeof score !== "object" || Array.isArray(score)) {
    fail("缺少 dataAvailabilityScore；必须在买域名前量化公开资料可得性。");
    return null;
  }
  const computed = calculateDataAvailabilityScore(plan);
  if (!Number.isInteger(Number(score.total)) || Number(score.total) < 0 || Number(score.total) > 100) fail("dataAvailabilityScore.total 必须是 0–100 整数。");
  if (Number(score.total) !== computed.total) fail(`dataAvailabilityScore.total 与来源/字段计算结果不一致：应为 ${computed.total}。`);
  if (!SCORE_BANDS.has(clean(score.band))) fail("dataAvailabilityScore.band 无效。");
  if (clean(score.band) !== computed.band) fail(`dataAvailabilityScore.band 与 total 不一致：应为 ${computed.band}。`);
  if (clean(score.method) !== computed.method) fail("dataAvailabilityScore.method 必须使用 public-fact-acquisition-v1。");
  if (!score.components || typeof score.components !== "object" || Array.isArray(score.components)) fail("dataAvailabilityScore.components 必须记录可复核的分项。");
  for (const [key, value] of Object.entries(computed.components)) if (Number(score.components?.[key]) !== value) fail(`dataAvailabilityScore.components.${key} 与计算结果不一致：应为 ${value}。`);
  return computed;
}

export function validateDataFeasibility(plan) {
  const errors = [];
  const warnings = [];
  const fail = (message) => errors.push(message);
  const warn = (message) => warnings.push(message);

  if (!SCHEMA_VERSIONS.has(Number(plan?.schemaVersion))) fail("资料可行性合同必须使用 schemaVersion 1 或 2。");
  if (plan?.phase === "template") {
    return {
      ok: false,
      status: "template",
      decisionStatus: "blocked",
      readyForVisitorCompletePlan: false,
      readyForBoundedScope: false,
      purchaseFree: false,
      dataAvailabilityScore: { total: 0, band: "blocked" },
      errors: ["资料可行性合同仍是模板；必须先定义产品承诺、P0/P1 任务和来源。"],
      warnings: [],
      counts: { sources: 0, dataNeeds: 0, coveredDemands: 0, plannedAssets: 0 },
    };
  }
  if (plan?.phase !== "ready") fail("资料可行性合同的 phase 必须为 ready。");
  if (!clean(plan?.site)) fail("资料可行性合同缺少 site。");
  if (!clean(plan?.runId)) fail("资料可行性合同缺少 runId。");
  if (!ISO.test(clean(plan?.observedAt))) fail("observedAt 必须是 UTC ISO 时间（以 Z 结尾）。");
  if (plan?.targetMaturity !== "visitor-complete") fail("targetMaturity 必须为 visitor-complete。");

  const scope = plan?.productScope ?? {};
  if (!["full-database", "bounded-complete-product", "pre-release-status-product"].includes(clean(scope.mode))) fail("productScope.mode 无效。");
  if (clean(scope.promise).length < 30) fail("productScope.promise 必须具体说明访客能完成什么，至少 30 字。瞄准任务结果，不写全游戏愿望。");
  const demandIds = list(scope.p0p1DemandIds).map(clean).filter(Boolean);
  const journeyIds = list(scope.requiredJourneyIds).map(clean).filter(Boolean);
  const plannedDecisionStatus = normalizedDecisionStatus(plan?.decision?.status);
  const blockedPlan = plannedDecisionStatus === "blocked";
  if (new Set(demandIds).size !== demandIds.length) fail("productScope.p0p1DemandIds 不能重复。");
  if (demandIds.length < 3) fail("visitor-complete 计划至少需要 3 个 P0/P1 用户问题。");
  if (new Set(journeyIds).size !== journeyIds.length) fail("productScope.requiredJourneyIds 不能重复。");
  if (journeyIds.length < 3) fail("visitor-complete 计划至少需要 3 条用户旅程。");

  const sources = list(plan?.sourceCandidates);
  const sourceById = new Map();
  for (const source of sources) {
    const id = clean(source?.id);
    if (!id) { fail("每个 sourceCandidate 必须有 id。"); continue; }
    if (sourceById.has(id)) fail(`sourceCandidate id 重复：${id}`);
    sourceById.set(id, source);
    if (!SOURCE_CLASSES.has(clean(source?.sourceClass))) fail(`来源 ${id} 的 sourceClass 无效。`);
    if (!SOURCE_STATUSES.has(clean(source?.status))) fail(`来源 ${id} 的 status 无效。`);
    if (!AUTHORITIES.has(clean(source?.authority))) fail(`来源 ${id} 的 authority 无效。`);
    if (!ACCESS.has(clean(source?.access))) fail(`来源 ${id} 的 access 无效。`);
    if (!FORMATS.has(clean(source?.format))) fail(`来源 ${id} 的 format 无效。`);
    if (!isHttp(source?.url)) fail(`来源 ${id} 缺少有效 HTTP(S) URL。`);
    if (!clean(source?.versionBoundary)) fail(`来源 ${id} 缺少版本或预发布边界。`);
    if (clean(source?.rights?.basis).length < 12) fail(`来源 ${id} 缺少权利/引用依据说明。`);
    const rights = source?.rights ?? {};
    if (!FACT_RIGHTS.has(clean(rights.facts))) fail(`来源 ${id} 的 rights.facts 必须明确事实处理方式（可 extract-and-rewrite，不能留空）。`);
    if (source?.authority === "discovery-only" && (list(source?.supportsFactIds).length || list(source?.supportsAssetRoles).length)) {
      fail(`发现线索 ${id} 不能直接声明事实或素材覆盖。`);
    }
    if (source?.authority === "discovery-only" && clean(rights.facts) !== "unknown") fail(`发现线索 ${id} 只能保持 rights.facts=unknown。`);
  }
  if (sources.length < 2) fail("至少登记两个来源候选，避免单源自证。");

  const identityRefs = list(scope.identitySourceRefs).map(clean).filter(Boolean);
  if (!identityRefs.length) fail("productScope.identitySourceRefs 不能为空。");
  const identitySources = identityRefs.map((id) => sourceById.get(id)).filter(Boolean);
  for (const id of identityRefs) if (!sourceById.has(id)) fail(`身份来源不存在：${id}`);
  if (!identitySources.some((source) => ["official", "first-party"].includes(clean(source?.authority)) && reachable(source))) {
    fail("游戏身份和版本至少需要一个可访问的一手或官方来源。");
  }

  const needs = list(plan?.dataNeeds);
  const needIds = new Set();
  const coveredDemandIds = new Set();
  for (const need of needs) {
    const id = clean(need?.id);
    if (!id) { fail("每个 dataNeed 必须有 id。"); continue; }
    if (needIds.has(id)) fail(`dataNeed id 重复：${id}`);
    needIds.add(id);
    const demandId = clean(need?.demandId);
    if (!demandIds.includes(demandId)) fail(`资料需求 ${id} 的 demandId 不在 P0/P1 清单：${demandId || "缺失"}`);
    if (clean(need?.userQuestion).length < 12) fail(`资料需求 ${id} 的 userQuestion 过短。`);
    if (clean(need?.visitorOutcome).length < 12) fail(`资料需求 ${id} 缺少具体访客结果。`);
    if (list(need?.publicFields).map(clean).filter(Boolean).length === 0) fail(`资料需求 ${id} 缺少公开字段白名单。`);
    if (!NEED_STATUSES.has(clean(need?.status))) fail(`资料需求 ${id} 的 status 无效。`);
    if (!USE_MODES.has(clean(need?.useMode))) fail(`资料需求 ${id} 的 useMode 无效。`);
    if (need?.confidence !== undefined && !CONFIDENCE.has(clean(need.confidence))) fail(`资料需求 ${id} 的 confidence 无效。`);
    const refs = list(need?.sourceRefs).map(clean).filter(Boolean);
    if (!refs.length) fail(`资料需求 ${id} 缺少 sourceRefs。`);
    const usable = refs.map((ref) => sourceById.get(ref)).filter((source) => reachable(source) && source.authority !== "discovery-only");
    for (const ref of refs) if (!sourceById.has(ref)) fail(`资料需求 ${id} 引用了未知来源：${ref}`);
    if (need?.status === "covered") {
      coveredDemandIds.add(demandId);
      if (!usable.length) fail(`已覆盖资料需求 ${id} 没有可访问的有效来源。`);
      if (!usable.some((source) => list(source?.supportsFactIds).map(clean).includes(demandId) || list(source?.supportsFactIds).map(clean).includes(id))) {
        fail(`已覆盖资料需求 ${id} 没有来源明确声明支持该 demandId/factId。`);
      }
      const authorities = new Set(usable.map((source) => source.authority));
      const independentHosts = new Set(usable.map((source) => host(source.url)).filter(Boolean));
      if (!authorities.has("official") && !authorities.has("first-party") && independentHosts.size < 2) {
        warn(`资料需求 ${id} 没有一手来源；当前仅有 ${independentHosts.size} 个独立域名，建议补充交叉核验。`);
      }
      if (need?.confidence === "low" && need?.critical !== false) fail(`核心资料需求 ${id} 不能使用 low confidence。`);
      if (["manual-fact-extraction", "normalize-facts", "visual-observation"].includes(need?.useMode)) {
        if (!usable.some(factExtractionAllowed)) fail(`资料需求 ${id} 没有允许“提取后重述/观察”的事实依据；这不等同于要求整包数据 License。`);
      }
      if (need?.useMode === "bulk-import") {
        if (!usable.some((source) => ["json", "csv", "api", "repository", "sheet"].includes(source.format) && SAFE_DATASET_RIGHTS.has(clean(source?.rights?.dataset)))) {
          fail(`资料需求 ${id} 计划批量导入，但没有结构化且明确允许复用的数据源；请改为 normalize-facts，或补充数据授权。`);
        }
      }
      if (need?.useMode === "official-copy" && !usable.some((source) => ["reuse-permitted", "attribution-required"].includes(clean(source?.rights?.facts)))) {
        fail(`资料需求 ${id} 计划复制具体文字，但没有文字复用授权。`);
      }
    }
  }
  if (!needs.length) fail("dataNeeds 不能为空。");
  for (const demandId of demandIds) if (!coveredDemandIds.has(demandId) && !blockedPlan) fail(`P0/P1 用户问题尚未完整覆盖：${demandId}`);

  const assetNeeds = list(plan?.assetNeeds);
  let plannedAssets = 0;
  for (const row of assetNeeds) {
    const role = clean(row?.role);
    if (!role) { fail("assetNeeds 中存在缺少 role 的条目。"); continue; }
    const requiredForPromise = row?.requiredForPromise !== false;
    const status = clean(row?.status);
    if (!requiredForPromise && ["blocked", "unknown", "out-of-scope", "optional"].includes(status)) continue;
    if (!requiredForPromise && status === "covered") {
      plannedAssets += new Set(list(row.assetIds).map(clean).filter(Boolean)).size;
      continue;
    }
    if (status !== "covered" && !blockedPlan) { fail(`assetNeeds.${role} 尚未 covered，或必须明确 requiredForPromise=false。`); continue; }
    const assetIds = list(row.assetIds).map(clean).filter(Boolean);
    const minimum = Math.max(0, Number(row.minimumDistinctAssets) || 0);
    if (new Set(assetIds).size < minimum && !blockedPlan) fail(`assetNeeds.${role} 需要至少 ${minimum} 个不同资产候选。`);
    plannedAssets += new Set(assetIds).size;
    const refs = list(row.sourceRefs).map(clean).filter(Boolean);
    const usableMedia = refs.map((ref) => sourceById.get(ref)).filter((source) => reachable(source) && SAFE_MEDIA_RIGHTS.has(clean(source?.rights?.media)));
    for (const ref of refs) if (!sourceById.has(ref)) fail(`assetNeeds.${role} 引用了未知来源：${ref}`);
    if (!usableMedia.length && !blockedPlan) fail(`assetNeeds.${role} 没有可访问且允许使用的媒体来源；事实资料仍可继续使用，但不能用未授权素材补视觉缺口。`);
    if (!usableMedia.some((source) => list(source?.supportsAssetRoles).map(clean).includes(role)) && !blockedPlan) fail(`assetNeeds.${role} 没有来源明确声明支持该素材职责。`);
  }

  const decision = plan?.decision ?? {};
  if (!DECISIONS.has(clean(decision.status))) fail("decision.status 无效。");
  if (clean(decision.reason).length < 20) fail("decision.reason 必须说明可行或阻塞依据。");
  const decisionStatus = normalizedDecisionStatus(decision.status);
  if (!["data-ready", "bounded-scope", "blocked"].includes(decisionStatus)) fail("decision.status 必须归一为 data-ready、bounded-scope 或 blocked。");
  const score = validateScore(plan, fail);
  if (score && score.band === "blocked" && decisionStatus === "data-ready") fail("资料可得性分数低于 40 时不能声明 data-ready；请缩小范围或阻塞。");
  if (scope.mode === "full-database" && decisionStatus === "data-ready" && score && score.total < 80) fail("full-database 只有在资料可得性分数达到 80 时才能声明 data-ready；否则必须改成 bounded-scope。");
  const planReady = errors.length === 0 && decisionStatus !== "blocked";
  const readyForVisitorCompletePlan = planReady;
  const purchaseFree = plan?.cost?.purchaseRequired === false;
  if (decision.pilotEligible === true && (!planReady || !purchaseFree)) fail("pilotEligible 只能用于资料计划已通过且无需购买游戏的候选。");
  if (scope.mode === "pre-release-status-product" && decisionStatus === "data-ready") warn("预发布站只能对明确的状态/发售信息产品宣称 data-ready，不能据此生成未经观察的玩法数据库。");
  if (decisionStatus === "bounded-scope") warn("当前是 bounded-scope：可以做一个范围诚实、任务完整的工具或攻略产品，不能在公开文案中暗示全游戏数据库。");
  if (sources.some((source) => clean(source?.rights?.dataset) === "unknown") && sources.some((source) => ["json", "csv", "repository", "sheet"].includes(clean(source.format)))) {
    warn("存在结构化来源但 dataset 复用权利未知；只能 normalize-facts，不能直接发布原始 CSV/JSON 或整包数据库。");
  }

  return {
    ok: errors.length === 0,
    status: errors.length ? "blocked" : decisionStatus,
    decisionStatus,
    readyForVisitorCompletePlan,
    readyForBoundedScope: planReady,
    purchaseFree,
    dataAvailabilityScore: score ?? { total: 0, band: "blocked" },
    errors,
    warnings,
    counts: { sources: sources.length, dataNeeds: needs.length, coveredDemands: coveredDemandIds.size, plannedAssets },
  };
}

async function main() {
  const sitePath = resolve(arg("site-path", "."));
  const planPath = resolve(sitePath, arg("plan", "research/资料可行性.json"));
  let plan;
  try { plan = JSON.parse(await readFile(planPath, "utf8")); }
  catch (error) { throw new Error(`资料可行性合同不存在或不是有效 JSON：${error.message}`); }
  const result = validateDataFeasibility(plan);
  const output = { ...result, site: plan?.site ?? "", runId: plan?.runId ?? "", observedAt: plan?.observedAt ?? "" };
  const outputPath = resolve(sitePath, arg("out", "artifacts/research/data-feasibility.json"));
  if (process.argv.includes("--write")) {
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (!result.ok || (process.argv.includes("--require-visitor-complete-plan") && !result.readyForVisitorCompletePlan)) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
