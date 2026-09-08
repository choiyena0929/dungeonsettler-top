#!/usr/bin/env node
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const clean = (value) => String(value ?? "").trim();
const list = (value) => Array.isArray(value) ? value : [];
const unique = (values) => [...new Set(values.map(clean).filter(Boolean))];

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

async function readOptionalJson(path) {
  try { return JSON.parse(await readFile(path, "utf8")); } catch { return {}; }
}

export function validateCompleteness({ contract, pageContracts, assetManifest, requireVisitorComplete = false }) {
  const errors = [];
  const fail = (message) => errors.push(message);
  if (contract?.schemaVersion !== 1) fail("站点完整度合同必须使用 schemaVersion 1。");
  if (!["template", "draft", "ready"].includes(contract?.phase)) fail("phase 只能是 template、draft 或 ready。");
  if (contract?.phase === "template") {
    if (requireVisitorComplete) fail("模板状态不能声明 visitor-complete。");
    return { ok: errors.length === 0, status: "template", maturity: "launch-slice", errors };
  }
  if (contract?.phase !== "ready") fail("正式站点的完整度合同必须为 ready。");
  if (!["launch-slice", "visitor-complete"].includes(contract?.maturity)) fail("maturity 只能是 launch-slice 或 visitor-complete。");
  if (!["guide", "tool", "hybrid"].includes(contract?.siteType)) fail("siteType 只能是 guide、tool 或 hybrid。");
  if (clean(contract?.claim).length < 20) fail("claim 必须用访客语言说明本站目前能完成的价值范围。");
  if (pageContracts?.schemaVersion !== 1 || list(pageContracts?.pages).length < 2) fail("机器页面合同至少需要首页和一个承接页。");
  if (assetManifest?.schemaVersion !== 1 || assetManifest?.phase !== "ready") fail("素材清单必须是 ready 的 schemaVersion 1。");

  const routeSet = new Set(list(pageContracts?.pages).map((page) => clean(page?.path)).filter(Boolean));
  const assetById = new Map(list(assetManifest?.assets).map((asset) => [clean(asset?.id), asset]));
  const requireRoute = (route, label) => {
    if (!clean(route) || !routeSet.has(clean(route))) fail(`${label} 未出现在 research/page-contracts.json：${clean(route) || "missing"}`);
  };

  const demandCoverage = list(contract?.demandCoverage);
  for (const item of demandCoverage) {
    if (!clean(item?.id) || !clean(item?.question) || !["P0", "P1", "P2"].includes(item?.priority)) fail("每个需求簇都要有 id、自然用户问题和 P0/P1/P2 优先级。");
    if (!["planned", "implemented", "deferred-evidence-gap", "not-applicable"].includes(item?.status)) fail(`需求簇 ${clean(item?.id) || "missing"} 状态无效。`);
    if (item?.status === "implemented") requireRoute(item?.route, `需求簇 ${item.id}`);
    if (["deferred-evidence-gap", "not-applicable"].includes(item?.status) && (clean(item?.reason).length < 12 || list(item?.evidenceRefs).length === 0)) fail(`延期或不适用的需求簇 ${item?.id || "missing"} 必须写清理由和证据。`);
  }

  const families = list(contract?.pageFamilies);
  for (const family of families) {
    if (!clean(family?.id) || !["hub", "guide", "detail", "tool", "lookup", "comparison", "checklist", "database", "update", "trust"].includes(family?.role)) fail("页面家族缺少有效 id 或 role。");
    if (!["planned", "implemented", "blocked"].includes(family?.status)) fail(`页面家族 ${family?.id || "missing"} 状态无效。`);
    if (family?.status === "implemented") for (const route of list(family?.routes)) requireRoute(route, `页面家族 ${family.id}`);
  }

  const journeys = list(contract?.userJourneys);
  for (const journey of journeys) {
    if (!clean(journey?.id) || !clean(journey?.task) || !clean(journey?.outcome)) fail("用户旅程必须有 id、task 和 outcome。");
    if (!["planned", "implemented", "blocked"].includes(journey?.status)) fail(`用户旅程 ${journey?.id || "missing"} 状态无效。`);
    if (journey?.status === "implemented") {
      requireRoute(journey?.entryRoute, `用户旅程 ${journey.id} 入口`);
      if (list(journey?.steps).length < 2) fail(`用户旅程 ${journey.id} 至少要有两个可执行步骤。`);
      for (const step of list(journey?.steps)) {
        requireRoute(step?.route, `用户旅程 ${journey.id} 步骤`);
        if (!clean(step?.action)) fail(`用户旅程 ${journey.id} 的步骤缺少 action。`);
      }
    }
  }

  const valueUnits = list(contract?.valueUnits);
  for (const unit of valueUnits) {
    if (!clean(unit?.id) || !["guide", "decision-tool", "lookup", "comparison", "checklist", "database", "update-feed"].includes(unit?.type) || !clean(unit?.userOutcome)) fail("价值单元必须有 id、有效 type 和 userOutcome。");
    if (!["planned", "implemented", "blocked"].includes(unit?.status)) fail(`价值单元 ${unit?.id || "missing"} 状态无效。`);
    if (unit?.status === "implemented") requireRoute(unit?.route, `价值单元 ${unit.id}`);
  }

  const visual = contract?.visualVocabulary || {};
  const visualIds = unique([...list(visual.identityAssetIds), ...list(visual.mechanicAssetIds), ...list(visual.entityAssetIds)]);
  for (const id of visualIds) {
    const asset = assetById.get(id);
    if (!asset) fail(`视觉词汇资产未登记在素材清单：${id}`);
    else if (asset.originalOrGenerated !== false) fail(`视觉词汇资产必须是可追溯游戏原素材：${id}`);
  }
  for (const item of list(visual.representativeRoutes)) {
    requireRoute(item?.route, "代表性视觉路由");
    if (list(item?.assetIds).length === 0) fail(`代表性视觉路由 ${item?.route || "missing"} 没有资产映射。`);
    for (const id of list(item?.assetIds)) if (!assetById.has(clean(id))) fail(`代表性视觉路由引用了未知资产：${id}`);
  }

  const implementedJourneys = journeys.filter((item) => item?.status === "implemented");
  const implementedUnits = valueUnits.filter((item) => item?.status === "implemented");
  if (contract?.phase === "ready" && implementedJourneys.length < 1) fail("ready 合同至少需要一条已实现用户旅程。");
  if (contract?.phase === "ready" && implementedUnits.length < 1) fail("ready 合同至少需要一个已实现价值单元。");

  if (contract?.maturity === "visitor-complete" || requireVisitorComplete) {
    if (contract?.maturity !== "visitor-complete") fail("当前仍是 launch-slice，不能声称站点已经完全体。");
    if (implementedJourneys.length < 3) fail("visitor-complete 至少需要三条已实现用户旅程。");
    if (!implementedJourneys.some((item) => item?.repeatable === true)) fail("visitor-complete 至少需要一条可重复使用的旅程。");
    if (implementedUnits.length < 4) fail("visitor-complete 至少需要四个已实现价值单元。");
    const minimumRoutes = contract?.siteType === "tool" ? 3 : 5;
    if (unique(implementedUnits.map((item) => item?.route)).length < minimumRoutes) fail(`visitor-complete 的 ${contract?.siteType || "site"} 至少需要 ${minimumRoutes} 个不同价值路由。`);
    const implementedRoles = new Set(families.filter((item) => item?.status === "implemented").map((item) => item.role));
    if (!implementedRoles.has("hub") || !["guide", "detail"].some((role) => implementedRoles.has(role)) || !["tool", "lookup", "comparison", "checklist", "database", "update"].some((role) => implementedRoles.has(role))) fail("visitor-complete 必须同时覆盖入口、内容承接和可重复价值页面家族。");
    const unresolvedPriority = demandCoverage.filter((item) => ["P0", "P1"].includes(item?.priority) && !["implemented", "deferred-evidence-gap", "not-applicable"].includes(item?.status));
    if (unresolvedPriority.length) fail("visitor-complete 仍有未归类的 P0/P1 需求簇。");
    const requiredEntityIconCount = Math.max(0, Number(visual.requiredEntityIconCount ?? 0) || 0);
    if (list(visual.identityAssetIds).length < 1 || list(visual.mechanicAssetIds).length < 1) fail("visitor-complete 需要身份和玩法两类可追溯的游戏视觉词汇。");
    if (requiredEntityIconCount > 0 && (list(visual.entityAssetIds).length < 1 || Number(visual.entityIconCount) < requiredEntityIconCount)) fail(`visitor-complete 当前产品声明需要实体视觉词汇，至少要有 ${requiredEntityIconCount} 个可辨认游戏实体图标。`);
    if (list(visual.representativeRoutes).length < 3) fail("visitor-complete 至少要为三个代表路由绑定真实游戏素材。");
    if (list(contract?.navigation?.primaryRoutes).length < 4 || contract?.navigation?.deadEndsReviewed !== true || contract?.navigation?.hasReturnPaths !== true) fail("visitor-complete 需要至少四个主导航路由，并完成死路与返回路径检查。");
    for (const route of list(contract?.navigation?.primaryRoutes)) requireRoute(route, "主导航");
    if (contract?.trust?.officialEntry !== true || contract?.trust?.versionBoundary !== true) fail("visitor-complete 必须显示官方入口和版本边界。");
    requireRoute(contract?.trust?.updatePath, "更新入口");
    if (list(contract?.gaps).some((gap) => gap?.severity === "blocking" && gap?.status !== "resolved")) fail("visitor-complete 仍有未解决的 blocking 缺口。");
  }

  return {
    ok: errors.length === 0,
    status: errors.length ? "blocked" : contract?.maturity,
    maturity: contract?.maturity,
    counts: {
      demandClusters: demandCoverage.length,
      implementedJourneys: implementedJourneys.length,
      implementedValueUnits: implementedUnits.length,
      implementedValueRoutes: unique(implementedUnits.map((item) => item?.route)).length,
      visualAssets: visualIds.length,
      entityIconCount: Number(visual.entityIconCount) || 0,
    },
    errors,
  };
}

async function main() {
  const sitePath = resolve(arg("site-path", "."));
  const [contract, pageContracts, assetManifest] = await Promise.all([
    readJson(resolve(sitePath, arg("contract", "research/站点完整度.json")), "站点完整度合同"),
    readJson(resolve(sitePath, arg("pages", "research/page-contracts.json")), "机器页面合同"),
    readJson(resolve(sitePath, arg("assets", "research/素材清单.json")), "素材清单"),
  ]);
  const result = validateCompleteness({ contract, pageContracts, assetManifest, requireVisitorComplete: process.argv.includes("--require-visitor-complete") });
  const [planContext, evidenceContext] = await Promise.all([
    readOptionalJson(resolve(sitePath, "research/资料可行性.json")),
    readOptionalJson(resolve(sitePath, "research/证据就绪.json")),
  ]);
  const output = {
    ...result,
    site: clean(contract?.site),
    runId: arg("run-id", clean(planContext?.runId) || clean(evidenceContext?.runId)),
    observedAt: arg("captured-at", clean(planContext?.observedAt) || clean(evidenceContext?.observedAt)),
  };
  if (process.argv.includes("--write")) {
    const outputPath = resolve(sitePath, arg("out", "artifacts/quality/completeness.json"));
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  }
  process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  if (!output.ok) process.exitCode = 1;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 1;
  });
}
