import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { assertPageContracts, extractSourceIds } from "./page-contract-rules.mjs";

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback;
}

const baseUrl = arg("base-url");
const handoffId = arg("handoff-id");
const inputRevision = arg("input-revision");
const contractsPath = resolve(arg("contracts", "research/page-contracts.json"));
const sourceManifestPath = resolve(arg("source-manifest", resolve(dirname(contractsPath), "source-manifest.md")));
const outPath = resolve(arg("out", "artifacts/quality/seo-routes.json"));
if (!/^https?:\/\//i.test(baseUrl)) throw new Error("必须通过 --base-url 提供正在运行的本地或预览站点 URL。");
if (!handoffId || !inputRevision) throw new Error("必须提供 --handoff-id 与 --input-revision，防止复用旧审计结果。");

const contracts = JSON.parse(await readFile(contractsPath, "utf8"));
const sourceManifest = await readFile(sourceManifestPath, "utf8");
assertPageContracts(contracts, { sourceIds: extractSourceIds(sourceManifest) });
if (contracts.schemaVersion !== 1 || !Array.isArray(contracts.pages)) throw new Error("page-contracts.json 结构无效。");
if (!/^https:\/\//i.test(String(contracts.canonicalOrigin || ""))) throw new Error("page-contracts.json 必须填写 HTTPS canonicalOrigin。");
if (contracts.pages.length < 2 || !contracts.pages.some((page) => page.path === "/")) throw new Error("页面合同至少包含首页和一个承接页。");

const defaults = { homepage: 600, guide: 700, tool: 250, hub: 500, legal: 250 };
const clean = (value) => String(value ?? "").trim();
const compact = (value) => clean(value).normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "");
const decode = (value) => clean(value)
  .replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"')
  .replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">");
const textOnly = (html) => decode(html)
  .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
  .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
  .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, " ")
  .replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
const words = (value) => textOnly(value).match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*/g) || [];

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, "i"));
  return decode(match?.[1] ?? match?.[2] ?? match?.[3] ?? "");
}

function tagBy(html, tagName, predicate) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, "gi"))].map((match) => match[0]).find(predicate) || "";
}

function countCompact(text, keyword) {
  const haystack = compact(text);
  const needle = compact(keyword);
  if (!needle) return 0;
  let count = 0;
  let offset = 0;
  while ((offset = haystack.indexOf(needle, offset)) >= 0) {
    count += 1;
    offset += needle.length;
  }
  return count;
}

function add(checks, id, passed, detail) {
  checks.push({ id, status: passed ? "passed" : "failed", detail });
}

const routeResults = [];
for (const page of contracts.pages) {
  const path = clean(page.path);
  const pageType = clean(page.pageType);
  const primaryKeyword = clean(page.primaryKeyword);
  if (!path.startsWith("/") || !defaults[pageType]) throw new Error(`页面合同 path/pageType 无效：${JSON.stringify(page)}`);
  if (pageType !== "legal" && !primaryKeyword) throw new Error(`非法律页缺少 primaryKeyword：${path}`);

  const response = await fetch(new URL(path, baseUrl), { redirect: "follow" });
  const html = await response.text();
  const title = decode(html.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const descriptionTag = tagBy(html, "meta", (tag) => attribute(tag, "name").toLowerCase() === "description");
  const description = attribute(descriptionTag, "content");
  const canonicalTag = tagBy(html, "link", (tag) => attribute(tag, "rel").toLowerCase().split(/\s+/).includes("canonical"));
  const canonical = attribute(canonicalTag, "href");
  const h1s = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)].map((match) => textOnly(match[1]));
  const bodyHtml = html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i)?.[1] || html;
  const bodyText = textOnly(bodyHtml);
  const bodyWords = words(bodyHtml);
  const intro = bodyWords.slice(0, 120).join(" ");
  const htmlTag = html.match(/<html\b[^>]*>/i)?.[0] || "";
  const lang = attribute(htmlTag, "lang");
  const internalLinks = new Set([...html.matchAll(/<a\b[^>]*>/gi)]
    .map((match) => attribute(match[0], "href"))
    .filter((href) => href.startsWith("/") && !href.startsWith("//")));
  const imageTags = [...html.matchAll(/<img\b[^>]*>/gi)].map((match) => match[0]);
  const missingAlt = imageTags.filter((tag) => !/\balt\s*=/i.test(tag)).length;
  const normalizeCanonical = (value) => {
    try { return new URL(value).toString().replace(/\/$/, ""); } catch { return clean(value).replace(/\/$/, ""); }
  };
  const expectedCanonical = new URL(path, contracts.canonicalOrigin).toString();
  const minWords = Number(page.minWords || defaults[pageType]);
  const minInternalLinks = Number(page.minInternalLinks ?? (pageType === "legal" ? 1 : 2));
  const keywordCount = countCompact(bodyText, primaryKeyword);
  const maxKeywordCount = Math.max(8, Math.ceil(bodyWords.length / 50));
  const checks = [];

  add(checks, "http-200", response.status === 200, `HTTP ${response.status}`);
  add(checks, "html-lang", /^en(?:-|$)/i.test(lang), `lang=${lang || "missing"}`);
  add(checks, "title-length", title.length >= 25 && title.length <= 65, `${title.length} chars`);
  add(checks, "description-length", description.length >= 70 && description.length <= 170, `${description.length} chars`);
  add(checks, "single-h1", h1s.length === 1, `${h1s.length} H1`);
  add(checks, "canonical", normalizeCanonical(canonical) === normalizeCanonical(expectedCanonical), canonical || "missing");
  add(checks, "word-count", bodyWords.length >= minWords, `${bodyWords.length}/${minWords} words`);
  add(checks, "internal-links", internalLinks.size >= minInternalLinks, `${internalLinks.size}/${minInternalLinks}`);
  add(checks, "image-alt", missingAlt === 0, `${missingAlt} images missing alt`);
  add(checks, "json-ld", /application\/ld\+json/i.test(html), "JSON-LD present");
  add(checks, "no-internal-research-copy", !/(keyword difficulty|search volume|semrush|keyword matrix|internal priority)/i.test(bodyText), "未公开内部研究术语");
  if (pageType !== "legal") {
    add(checks, "keyword-title", compact(title).includes(compact(primaryKeyword)), primaryKeyword);
    add(checks, "keyword-description", compact(description).includes(compact(primaryKeyword)), primaryKeyword);
    add(checks, "keyword-h1", h1s.length === 1 && compact(h1s[0]).includes(compact(primaryKeyword)), primaryKeyword);
    add(checks, "keyword-intro", compact(intro).includes(compact(primaryKeyword)), "前 120 词点题");
    add(checks, "keyword-natural-frequency", keywordCount >= 2 && keywordCount <= maxKeywordCount, `${keywordCount} 次，上限 ${maxKeywordCount}`);
  }

  routeResults.push({
    path, pageType, primaryKeyword, url: new URL(path, baseUrl).toString(), statusCode: response.status,
    title, description, canonical, h1s, wordCount: bodyWords.length, internalLinkCount: internalLinks.size,
    keywordCount, checks, status: checks.every((check) => check.status === "passed") ? "passed" : "failed",
  });
}

const duplicateChecks = [];
for (const field of ["title", "description"]) {
  const groups = new Map();
  for (const route of routeResults) {
    const value = compact(route[field]);
    if (!groups.has(value)) groups.set(value, []);
    groups.get(value).push(route.path);
  }
  for (const paths of groups.values()) if (paths.length > 1) duplicateChecks.push({ field, paths });
}

let faviconOk = false;
try {
  for (const path of ["/favicon.ico", "/favicon.svg"]) {
    const response = await fetch(new URL(path, baseUrl));
    if (response.ok && (await response.arrayBuffer()).byteLength > 0) faviconOk = true;
  }
} catch { /* route checks already preserve the actionable failure */ }

const failedChecks = routeResults.flatMap((route) => route.checks.filter((check) => check.status === "failed").map((check) => `${route.path}:${check.id}`));
if (!faviconOk) failedChecks.push("site:favicon");
if (duplicateChecks.length) failedChecks.push(...duplicateChecks.map((item) => `site:duplicate-${item.field}`));
const report = {
  schemaVersion: 2,
  status: failedChecks.length ? "failed" : "passed",
  capturedAt: new Date().toISOString(),
  handoffId,
  inputRevision,
  baseUrl,
  canonicalOrigin: contracts.canonicalOrigin,
  contractPath: contractsPath.replaceAll("\\", "/"),
  routes: routeResults,
  siteChecks: { favicon: faviconOk ? "passed" : "failed", duplicateMetadata: duplicateChecks },
  summary: { routesChecked: routeResults.length, failedChecks },
};

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
console.log(`On-page SEO 审计：${report.status}，${routeResults.length} 个页面，${failedChecks.length} 个失败项。`);
if (failedChecks.length) {
  console.error(failedChecks.join("\n"));
  process.exit(1);
}
