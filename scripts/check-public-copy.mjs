#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";

const args = process.argv.slice(2);
const value = (name, fallback) => {
  const index = args.indexOf(name);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const outputDir = resolve(value("--output", "dist/client"));
const extensions = new Set([".html", ".htm", ".js", ".mjs"]);
const excluded = new Set(["privacy.html", "privacy/index.html", "privacy-policy.html", "privacy-policy/index.html"]);
const forbidden = [
  ["关键词数据", /\b(?:long[-\s]?tail keywords?|keyword (?:matrix|cluster|difficulty|volume|priority|strategy)|search volume|keyword density)\b/i],
  ["找词与分析工具", /\b(?:semrush|ahrefs|google trends|google autocomplete|search console|google analytics|ga4|gsc)\b/i],
  ["SERP 与内部 SEO", /\b(?:serp|crawl budget|crawlability|indexing signal|ranking factor|backlink|bounce rate)\b/i],
  ["采集状态", /\b(?:analysisStatus|verificationStatus|not[-_ ]queried|pending_verification|research pass|pipeline id|input revision|handoff id)\b/i],
  ["视频分析失败", /\b(?:youtube|video)[^.]{0,100}\b(?:unavailable|failed|not analyzed)\b/i],
  ["内部过程说明", /\b(?:internal keyword metrics?|guessed demand|source[- ]bounded|evidence level|used to prioritize pages)\b/i],
  ["本机路径", /\b[A-Z]:\\(?:Users|WebProjects|Obsidian)\\/i],
  ["原始指标", /(?:\bKD\s*[:=]\s*\d+(?:\.\d+)?\b|\b(?:Keyword Difficulty|Search Volume)\s*[:=]\s*\d+(?:\.\d+)?\b)/],
];

function collectFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...collectFiles(path));
    else if (entry.isFile() && extensions.has(extname(entry.name).toLowerCase())) files.push(path);
  }
  return files;
}

if (!existsSync(outputDir)) {
  console.error("未找到构建产物目录：" + outputDir);
  process.exit(1);
}
const files = collectFiles(outputDir);
if (!files.length) {
  console.error("构建产物中没有可扫描的 HTML 或客户端 JS：" + outputDir);
  process.exit(1);
}
const violations = [];
for (const file of files) {
  const path = relative(outputDir, file).replaceAll("\\", "/").toLowerCase();
  if (excluded.has(path)) continue;
  const content = readFileSync(file, "utf8");
  for (const [category, pattern] of forbidden) {
    const match = content.match(pattern);
    if (match) violations.push({ category, path, phrase: match[0] });
  }
}
if (violations.length) {
  console.error("公开文案检查失败：内部找词、采集或模型数据进入了访客页面。");
  for (const item of violations) console.error(`- [${item.category}] ${item.path}: "${item.phrase}"`);
  console.error("只保留自然的用户问题、答案、必要版本日期和来源链接；研究过程留在 research/ 与 artifacts/。");
  process.exit(1);
}
console.log(`公开文案检查通过：已扫描 ${files.length} 个公开构建文件。`);
