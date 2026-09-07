import { access, readFile } from "node:fs/promises";
import { assertPageContracts, extractSourceIds } from "./page-contract-rules.mjs";

const DEFAULT_MIN_WORDS = { homepage: 600, guide: 700, tool: 250, hub: 500, database: 650, legal: 250 };
const DEFAULT_MIN_INTERNAL_LINKS = { homepage: 2, guide: 2, tool: 2, hub: 2, database: 4, legal: 1 };
const BASE_CHECKS = [
  "http-200", "html-lang", "title-length", "description-length", "single-h1", "canonical", "word-count",
  "internal-links", "image-alt", "json-ld", "no-internal-research-copy",
];
const KEYWORD_CHECKS = ["keyword-title", "keyword-description", "keyword-h1", "keyword-intro", "keyword-natural-frequency"];
const clean = (value) => String(value ?? "").trim();
const compact = (value) => clean(value).normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "");
const normalizePath = (value) => {
  try {
    const url = new URL(value, "https://onpage.invalid");
    return url.pathname.replace(/\/+/g, "/").replace(/\/$/, "") || "/";
  } catch {
    return clean(value).replace(/\/+$/, "") || "/";
  }
};
const normalizeOrigin = (value) => {
  try { return new URL(value).origin.toLowerCase(); } catch { return ""; }
};
const isIso = (value) => /^\d{4}-\d{2}-\d{2}T/.test(clean(value));

const lock = await readFile("PROJECT_LOCK.md", "utf8");
if (/状态：template/.test(lock)) {
  console.log("模板阶段跳过正式站 SEO 产物校验；初始化后的正式站发布前必须生成当前 SEO 报告。");
  process.exit(0);
}

const contracts = JSON.parse(await readFile("research/page-contracts.json", "utf8"));
const sourceManifest = await readFile("research/source-manifest.md", "utf8");
assertPageContracts(contracts, { sourceIds: extractSourceIds(sourceManifest) });
const report = JSON.parse(await readFile("artifacts/quality/seo-routes.json", "utf8"));
const errors = [];
const fail = (message) => errors.push(message);
try {
  await access("artifacts/quality/seo-routes-v2.json");
  fail("发现非标准 SEO 报告 seo-routes-v2.json；必须先对账并移出重复产物。");
} catch (error) {
  if (error?.code !== "ENOENT") throw error;
}
const lockValue = (label) => lock.match(new RegExp(`^- ${label}：([^\\r\\n]+)$`, "m"))?.[1]?.trim() || "";
const handoffId = lockValue("交接 ID");
const inputRevision = lockValue("输入修订");
const pages = Array.isArray(contracts.pages) ? contracts.pages : [];
const routes = Array.isArray(report.routes) ? report.routes : [];
const redirects = Array.isArray(contracts.redirects) ? contracts.redirects : [];
const redirectResults = Array.isArray(report.redirects) ? report.redirects : [];
const contractOrigin = normalizeOrigin(contracts.canonicalOrigin);
const reportOrigin = normalizeOrigin(report.canonicalOrigin);

if (contracts.schemaVersion !== 1 || !clean(contracts.siteName) || !/^https:\/\//i.test(clean(contracts.canonicalOrigin)) || !contractOrigin || !Array.isArray(contracts.pages)) fail("页面合同结构无效。");
if (report.schemaVersion !== 2 || report.status !== "passed" || !isIso(report.capturedAt)) fail("SEO 报告必须是带时间的 v2 passed 产物。");
if (!handoffId || report.handoffId !== handoffId) fail("SEO 报告 handoffId 与 PROJECT_LOCK.md 不一致。");
if (!inputRevision || report.inputRevision !== inputRevision) fail("SEO 报告 inputRevision 与 PROJECT_LOCK.md 不一致。");
if (!contractOrigin || reportOrigin !== contractOrigin) fail("SEO 报告 canonicalOrigin 与页面合同不一致。");
let baseUrl;
try {
  baseUrl = new URL(report.baseUrl);
  if (!["http:", "https:"].includes(baseUrl.protocol)) throw new Error("protocol");
} catch {
  fail("SEO 报告 baseUrl 不是有效 HTTP(S) 地址。");
}
if (pages.length < 2 || !pages.some((page) => clean(page.path) === "/")) fail("页面合同至少需要首页和一个承接页。");
if (routes.length !== pages.length) fail(`SEO 报告没有逐页覆盖页面合同：报告 ${routes.length} 页，合同 ${pages.length} 页。`);
if (report.summary?.routesChecked !== routes.length || !Array.isArray(report.summary?.failedChecks) || report.summary.failedChecks.length) fail("SEO 报告 summary 与 routes 不一致，或仍有失败项。");
if (report.siteChecks?.favicon !== "passed" || !Array.isArray(report.siteChecks?.duplicateMetadata) || report.siteChecks.duplicateMetadata.length) fail("SEO 报告站点级 favicon/重复元信息检查未通过。");
if (redirectResults.length !== redirects.length || report.summary?.redirectsChecked !== redirectResults.length) fail(`SEO 报告没有覆盖合同中的旧路径重定向：报告 ${redirectResults.length} 条，合同 ${redirects.length} 条。`);
const redirectByPath = new Map(redirectResults.map((item) => [clean(item?.path), item]));
for (const redirect of redirects) {
  const path = clean(redirect?.path);
  const result = redirectByPath.get(path);
  if (!result || result.status !== "passed" || Number(result.statusCode) !== Number(redirect.status || 308) || normalizePath(result.location) !== normalizePath(redirect.target)) fail(`${path} legacy redirect 未通过。`);
}

const contractByPath = new Map(pages.map((page) => [clean(page.path), page]));
if (contractByPath.size !== pages.length) fail("页面合同存在重复 path。");
const seenPaths = new Set();
for (const route of routes) {
  const path = clean(route?.path);
  const page = contractByPath.get(path);
  if (!path || seenPaths.has(path)) { fail(`SEO 报告 path 缺失或重复：${path || "缺失"}。`); continue; }
  seenPaths.add(path);
  if (!page) { fail(`SEO 报告包含合同之外的 URL：${path}。`); continue; }
  if (route.status !== "passed" || route.statusCode !== 200) fail(`${path} route 没有以 HTTP 200 通过。`);
  if (clean(route.pageType) !== clean(page.pageType)) fail(`${path} pageType 与页面合同不一致。`);
  if (page.pageType !== "legal" && compact(route.primaryKeyword) !== compact(page.primaryKeyword)) fail(`${path} primaryKeyword 与页面合同不一致。`);
  if (baseUrl) {
    try {
      const routeUrl = new URL(route.url);
      if (routeUrl.origin.toLowerCase() !== baseUrl.origin.toLowerCase() || normalizePath(routeUrl.pathname) !== normalizePath(path)) fail(`${path} route.url 与报告 baseUrl/path 不一致。`);
    } catch { fail(`${path} route.url 无效。`); }
  }
  const expectedCanonical = `${contractOrigin}${path === "/" ? "" : path}`;
  if (normalizeOrigin(route.canonical) !== contractOrigin || normalizePath(route.canonical) !== normalizePath(expectedCanonical)) fail(`${path} canonical 与页面合同不一致。`);
  if (!clean(route.title) || !clean(route.description) || !Array.isArray(route.h1s) || route.h1s.length !== 1 || !clean(route.h1s[0])) fail(`${path} 缺少有效 Title、Description 或唯一 H1。`);
  const minWords = Number(page.minWords) > 0 ? Math.ceil(Number(page.minWords)) : DEFAULT_MIN_WORDS[page.pageType] || 0;
  const minLinks = Number(page.minInternalLinks) >= 0 ? Math.floor(Number(page.minInternalLinks)) : DEFAULT_MIN_INTERNAL_LINKS[page.pageType] || 0;
  if (!Number.isInteger(route.wordCount) || route.wordCount < minWords) fail(`${path} 正文词数不足：${route.wordCount}/${minWords}。`);
  if (!Number.isInteger(route.internalLinkCount) || route.internalLinkCount < minLinks) fail(`${path} 内链数不足：${route.internalLinkCount}/${minLinks}。`);
  if (page.pageType !== "legal" && (!Number.isInteger(route.keywordCount) || route.keywordCount < 2)) fail(`${path} 主关键词有效出现次数不足。`);
  const checks = Array.isArray(route.checks) ? route.checks : [];
  const checkById = new Map(checks.map((check) => [clean(check?.id), check]));
  for (const id of [...BASE_CHECKS, ...(page.pageType === "legal" ? [] : KEYWORD_CHECKS)]) if (checkById.get(id)?.status !== "passed") fail(`${path} 缺少通过检查：${id}。`);
  if (checks.some((check) => check?.status !== "passed")) fail(`${path} 存在未通过检查项。`);
}
for (const path of contractByPath.keys()) if (!seenPaths.has(path)) fail(`SEO 报告缺少页面合同 URL：${path}。`);

if (errors.length) {
  console.error(errors.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}
console.log(`SEO 产物合同检查通过：${routes.length} 个 URL，正文/关键词/页面合同指标均已绑定。`);
