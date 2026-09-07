export const PAGE_CONTRACT_RULES_VERSION = 1;

export const PAGE_TYPES = Object.freeze(["homepage", "guide", "tool", "hub", "database", "legal"]);

export const PAGE_CONTRACT_LIMITS = Object.freeze({
  minWords: Object.freeze({ homepage: 600, guide: 700, tool: 250, hub: 500, database: 650, legal: 250 }),
  minInternalLinks: Object.freeze({ homepage: 2, guide: 2, tool: 2, hub: 2, database: 4, legal: 1 }),
});

const MIN_WORDS = PAGE_CONTRACT_LIMITS.minWords;
const MIN_INTERNAL_LINKS = PAGE_CONTRACT_LIMITS.minInternalLinks;
const clean = (value) => String(value ?? "").trim();

function issue(errors, code, path, message) {
  errors.push({ code, path, message });
}

function validInteger(value, minimum = 0) {
  return Number.isInteger(value) && value >= minimum;
}

function normalizeOrigin(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.origin === value.replace(/\/$/, "") ? url.origin : "";
  } catch {
    return "";
  }
}

function validatePage(page, index, errors, sourceIds) {
  const path = clean(page?.path) || `#${index + 1}`;
  const pageType = clean(page?.pageType);
  if (!(path === "/" || (path.startsWith("/") && !/[?#\s]/.test(path) && !path.endsWith("/")))) issue(errors, "invalid-page-path", path, `页面合同 path 无效：${path}。`);
  if (!PAGE_TYPES.includes(pageType)) issue(errors, "invalid-page-type", path, `页面合同 pageType 无效：${path}。`);

  const isLegal = pageType === "legal";
  if (!isLegal && !clean(page?.primaryKeyword)) issue(errors, "missing-page-keyword", path, `页面合同缺少主关键词：${path}。`);
  if (clean(page?.intent).length < 12) issue(errors, "thin-page-intent", path, `页面合同 intent 过短：${path}。`);
  if (clean(page?.acceptance).length < 20) issue(errors, "thin-page-acceptance", path, `页面合同 acceptance 过短：${path}。`);

  const minimumWords = MIN_WORDS[pageType];
  if (!validInteger(page?.minWords, minimumWords)) issue(errors, "invalid-min-words", path, `页面合同 minWords 必须是至少 ${minimumWords} 的整数：${path}。`);
  const minimumLinks = MIN_INTERNAL_LINKS[pageType];
  if (!validInteger(page?.minInternalLinks, minimumLinks)) issue(errors, "invalid-min-internal-links", path, `页面合同 minInternalLinks 必须是至少 ${minimumLinks} 的整数：${path}。`);

  const sections = Array.isArray(page?.requiredSections) ? page.requiredSections.map(clean).filter(Boolean) : [];
  const minimumSections = isLegal ? 1 : 2;
  if (sections.length < minimumSections || new Set(sections).size !== sections.length) issue(errors, "invalid-required-sections", path, `页面合同 requiredSections 至少需要 ${minimumSections} 个不重复章节：${path}。`);

  if (!isLegal && clean(page?.primaryAction).length < 4) issue(errors, "missing-primary-action", path, `页面合同缺少可执行的 primaryAction：${path}。`);
  const sourceRefs = Array.isArray(page?.sourceRefs) ? page.sourceRefs.map(clean).filter(Boolean) : [];
  if (!isLegal && sourceRefs.length === 0) issue(errors, "missing-page-sources", path, `非法律页必须绑定至少一个 sourceRefs：${path}。`);
  if (sourceRefs.some((sourceId) => !/^S\d{2,4}$/.test(sourceId)) || new Set(sourceRefs).size !== sourceRefs.length) issue(errors, "invalid-page-sources", path, `页面合同 sourceRefs 必须是不重复的 S 编号：${path}。`);
  if (sourceIds.size && sourceRefs.some((sourceId) => !sourceIds.has(sourceId))) issue(errors, "unknown-page-source", path, `页面合同引用了来源清单中不存在的 sourceRefs：${path}。`);
}

export function inspectPageContracts(value, { sourceIds = [] } = {}) {
  const errors = [];
  if (!value || typeof value !== "object" || Array.isArray(value)) return { ok: false, errors: [{ code: "invalid-page-contract", path: "", message: "机器页面合同必须是对象。" }], value: null };
  if (value.schemaVersion !== 1 || !clean(value.siteName) || !normalizeOrigin(clean(value.canonicalOrigin)) || !Array.isArray(value.pages)) {
    issue(errors, "invalid-page-contract", "", "机器页面合同缺少 schemaVersion、站名、HTTPS canonicalOrigin 或 pages。");
    return { ok: false, errors, value };
  }
  if (value.pages.length < 2 || !value.pages.some((page) => clean(page?.path) === "/")) issue(errors, "insufficient-pages", "", "页面合同至少需要首页和一个承接页。");
  const paths = new Set();
  const knownSourceIds = sourceIds instanceof Set ? sourceIds : new Set(sourceIds);
  for (const [index, page] of value.pages.entries()) {
    const path = clean(page?.path);
    if (paths.has(path)) issue(errors, "duplicate-page-path", path, `页面合同 path 重复：${path || `#${index + 1}`}。`);
    paths.add(path);
    validatePage(page, index, errors, knownSourceIds);
  }
  return { ok: errors.length === 0, errors, value };
}

export function assertPageContracts(value, options = {}) {
  const result = inspectPageContracts(value, options);
  if (!result.ok) throw new Error(`机器页面合同不通过：${result.errors.slice(0, 8).map((error) => error.message).join("；")}${result.errors.length > 8 ? `；另有 ${result.errors.length - 8} 项` : ""}`);
  return result.value;
}

export function extractSourceIds(content) {
  return new Set([...String(content ?? "").matchAll(/\bS\d{2,4}\b/g)].map((match) => match[0]));
}
