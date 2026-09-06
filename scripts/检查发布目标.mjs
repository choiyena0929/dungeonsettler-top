import { access, readFile } from "node:fs/promises";
import { relative, resolve } from "node:path";

const forbiddenFiles = [
  ".openai/hosting.json",
  "build/sites-vite-plugin.ts",
  "app/chatgpt-auth.ts",
];
const scanRoots = [resolve("."), resolve("dist")];

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

const violations = [];
for (const scanRoot of scanRoots) {
  for (const file of forbiddenFiles) {
    const candidate = resolve(scanRoot, file);
    if (await exists(candidate)) {
      const relativePath = relative(resolve("."), candidate).replaceAll("\\", "/");
      violations.push(`禁止存在 Sites 托管残留：${relativePath}`);
    }
  }
}

for (const file of ["vite.config.ts", "package.json"]) {
  const text = await readFile(resolve(file), "utf8");
  if (/sites-vite-plugin|\bsites\s*\(|\.openai\/hosting\.json|sites-building|sites-hosting/i.test(text)) {
    violations.push(`${file} 仍引用 ChatGPT Sites 托管链路。`);
  }
}

const lock = await readFile(resolve("PROJECT_LOCK.md"), "utf8");
const isTemplate = /状态：template/.test(lock);
const packageJson = JSON.parse(await readFile(resolve("package.json"), "utf8"));
const scripts = packageJson.scripts || {};
if (await exists(resolve("artifacts/quality/seo-routes-v2.json"))) {
  violations.push("发现非标准 SEO 报告 artifacts/quality/seo-routes-v2.json；必须先对账并移出重复产物。");
}
for (const name of ["audit:onpage", "check:onpage", "verify:release"]) {
  if (typeof scripts[name] !== "string" || !scripts[name].trim()) violations.push(`package.json 缺少正式质量命令：${name}。`);
}
if (!String(scripts["deploy:cloudflare"] || "").includes("verify:release")) {
  violations.push("package.json 的 deploy:cloudflare 必须先执行 verify:release，不能绕过当前 On-page 与页面合同检查。");
}
const contractPath = resolve("artifacts/release/deployment-contract.json");
if (!isTemplate || await exists(contractPath)) {
  const contract = JSON.parse(await readFile(contractPath, "utf8"));
  if (contract.schemaVersion !== 1) violations.push("deployment-contract.json 版本无效。");
  if (contract.platform !== "cloudflare-worker") violations.push("正式部署平台必须是 cloudflare-worker。");
  if (!String(contract.workerName || "").trim()) violations.push("部署合同缺少 Worker 名称。");
  if (contract.publishCommand !== "npm run deploy:cloudflare") violations.push("正式发布命令必须是 npm run deploy:cloudflare。");
  if (!Array.isArray(contract.domains) || contract.domains.length === 0) violations.push("部署合同缺少正式域名。");
}

if (violations.length) {
  console.error(violations.map((item) => `- ${item}`).join("\n"));
  process.exit(1);
}

console.log("发布目标检查通过：仅保留 Cloudflare Worker 正式链路。");
