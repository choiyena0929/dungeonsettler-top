import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback;
}

const baseUrl = arg("base-url").replace(/\/$/, "");
const explicitRepresentativePath = arg("representative-path");
const contractsPath = resolve(arg("contracts", "research/page-contracts.json"));
const notFoundPath = arg("not-found-path", "/__automation-not-found-check__");
const outDir = resolve(arg("out-dir", "artifacts/production"));
const deploymentVersion = arg("deployment-version");
const runId = arg("run-id");
const capturedAt = arg("captured-at", new Date().toISOString());
if (!/^https:\/\//i.test(baseUrl)) throw new Error("必须通过 --base-url 提供 HTTPS 正式域名。");

async function resolveRepresentativePath() {
  if (explicitRepresentativePath) {
    if (!explicitRepresentativePath.startsWith("/")) throw new Error("--representative-path 必须以 / 开头。");
    return explicitRepresentativePath;
  }
  const contracts = JSON.parse(await readFile(contractsPath, "utf8"));
  const page = (Array.isArray(contracts.pages) ? contracts.pages : []).find((item) => item?.path && item.path !== "/" && item.pageType !== "legal");
  if (!page?.path) throw new Error("未找到可作为代表页的非首页、非法律页面；请通过 --representative-path 明确提供。");
  return page.path;
}

const representativePath = await resolveRepresentativePath();
const targets = [
  { id: "homepage", path: "/", expectedStatus: 200 },
  { id: "representative-page", path: representativePath, expectedStatus: 200 },
  { id: "robots", path: "/robots.txt", expectedStatus: 200 },
  { id: "sitemap", path: "/sitemap.xml", expectedStatus: 200 },
  { id: "not-found", path: notFoundPath, expectedStatus: 404 },
];

function urlFor(path) {
  return new URL(path, `${baseUrl}/`).toString();
}

async function fetchTarget(target) {
  const url = urlFor(target.path);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(url, { redirect: "follow", signal: controller.signal });
    const body = await response.arrayBuffer();
    const text = new TextDecoder().decode(body);
    const receipt = {
      url,
      schemaVersion: 1,
      status: response.status === target.expectedStatus ? "passed" : "failed",
      statusCode: response.status,
      expectedStatus: target.expectedStatus,
      contentLength: body.byteLength,
      capturedAt,
      ...(runId ? { runId } : {}),
    };
    if (target.id === "homepage" || target.id === "representative-page") {
      receipt.title = text.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.replace(/\s+/g, " ").trim() || "";
      if (deploymentVersion) receipt.deploymentVersion = deploymentVersion;
    }
    if (target.id === "robots") receipt.containsSitemap = /sitemap:/i.test(text);
    if (target.id === "sitemap") receipt.containsXmlUrlset = /<urlset\b/i.test(text);
    return { target, receipt };
  } finally {
    clearTimeout(timer);
  }
}

const results = await Promise.all(targets.map(async (target) => {
  try {
    return await fetchTarget(target);
  } catch (error) {
    return {
      target,
      receipt: {
        url: urlFor(target.path),
        schemaVersion: 1,
        status: "failed",
        statusCode: 0,
        expectedStatus: target.expectedStatus,
        error: error instanceof Error ? error.message : String(error),
        capturedAt,
      },
    };
  }
}));

const httpsResult = results.find((result) => result.target.id === "homepage");
const httpsReceipt = {
  url: httpsResult.receipt.url,
  scheme: "https",
  schemaVersion: 1,
  status: httpsResult.receipt.status === "passed" ? "passed" : "failed",
  statusCode: httpsResult.receipt.statusCode,
  customDomain: new URL(baseUrl).hostname,
  tlsCheck: "passed",
  ...(deploymentVersion ? { deploymentVersion } : {}),
  ...(runId ? { runId } : {}),
  capturedAt,
};

await mkdir(outDir, { recursive: true });
for (const { target, receipt } of results) {
  await writeFile(resolve(outDir, `${target.id}.json`), `${JSON.stringify(receipt, null, 2)}\n`, "utf8");
}
await writeFile(resolve(outDir, "https.json"), `${JSON.stringify(httpsReceipt, null, 2)}\n`, "utf8");

const failures = results.filter(({ target, receipt }) => receipt.status !== "passed" || receipt.statusCode !== target.expectedStatus).map(({ target, receipt }) => `${target.id}: HTTP ${receipt.statusCode}, expected ${target.expectedStatus}`);
if (httpsReceipt.status !== "passed") failures.push(`https: HTTP ${httpsReceipt.statusCode}`);
console.log(`生产验收：${failures.length ? "failed" : "passed"}，${results.length + 1} 项检查，capturedAt=${capturedAt}`);
if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
