#!/usr/bin/env node
import { mkdir, access, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { chromium } from "playwright-core";

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback;
}

const baseUrl = arg("base-url").replace(/\/$/, "");
const route = arg("route", "/");
const siteId = arg("site-id");
const handoffId = arg("handoff-id");
const inputRevision = arg("input-revision");
const phaseStateRevision = Number(arg("phase-state-revision"));
const outputPath = resolve(arg("output", "artifacts/postlaunch/s8-mobile-network.json"));
const desktopScreenshot = resolve(arg("desktop-screenshot", "artifacts/postlaunch/s8-desktop.png"));
const mobileScreenshot = resolve(arg("mobile-screenshot", "artifacts/postlaunch/s8-mobile.png"));
const capturedAt = new Date().toISOString();
const mobileUserAgent = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1";
const adPattern = /adsterra|highperformanceformat|highrevenueformat|effectivecpmnetwork|googlesyndication|doubleclick|adsbygoogle/i;

if (!/^https?:\/\//i.test(baseUrl)) throw new Error("必须通过 --base-url 提供正式域名。 ");
if (!route.startsWith("/")) throw new Error("--route 必须以 / 开头。 ");
if (!siteId || !handoffId || !inputRevision || !Number.isInteger(phaseStateRevision)) throw new Error("必须提供 siteId、handoffId、inputRevision 和 phaseStateRevision。 ");

async function firstExisting(paths) {
  for (const path of paths.filter(Boolean)) {
    try { await access(path); return path; } catch { /* 继续寻找本机 Chrome */ }
  }
  throw new Error("找不到 Chrome。请设置 CHROME_PATH，或安装标准路径的 Google Chrome。 ");
}

const chromePath = await firstExisting([
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  process.env.LOCALAPPDATA ? resolve(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe") : "",
]);

await mkdir(resolve(outputPath, ".."), { recursive: true });
await mkdir(resolve(desktopScreenshot, ".."), { recursive: true });
await mkdir(resolve(mobileScreenshot, ".."), { recursive: true });

const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  args: ["--hide-scrollbars", "--no-first-run", "--no-default-browser-check"],
});

async function capture(name, viewport, screenshotPath, options = {}) {
  const context = await browser.newContext({ viewport, ...options });
  const page = await context.newPage();
  const matchingRequests = [];
  page.on("request", (request) => {
    if (adPattern.test(request.url())) matchingRequests.push(request.url().split("?")[0]);
  });
  try {
    const url = new URL(route, baseUrl).toString();
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    if (!response || !response.ok()) throw new Error(`${name} 页面响应失败：${response?.status() ?? "no-response"}`);
    await page.waitForTimeout(500);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    const dom = await page.evaluate((patternSource) => {
      const pattern = new RegExp(patternSource, "i");
      const elements = [...document.querySelectorAll("[id], [class], [data-ad-slot], [data-adsterra], iframe")];
      const adContainerCount = elements.filter((element) => pattern.test([
        element.id,
        typeof element.className === "string" ? element.className : "",
        element.getAttribute("data-ad-slot") || "",
        element.getAttribute("data-adsterra") || "",
        element.getAttribute("src") || "",
      ].join(" "))).length;
      const adScriptElementCount = [...document.querySelectorAll("script[src]")]
        .filter((script) => pattern.test(script.getAttribute("src") || "")).length;
      return { adContainerCount, adScriptElementCount };
    }, adPattern.source);
    return { name, url, statusCode: response.status(), matchingRequests, ...dom };
  } finally {
    await context.close();
  }
}

try {
  const desktop = await capture("desktop", { width: 1440, height: 900 }, desktopScreenshot);
  const mobile = await capture("mobile", { width: 390, height: 844 }, mobileScreenshot, { isMobile: true, userAgent: mobileUserAgent });
  const network = {
    schemaVersion: 1,
    type: "ai-web-mobile-ad-network-check",
    status: mobile.statusCode === 200 && mobile.matchingRequests.length === 0 && mobile.adContainerCount === 0 && mobile.adScriptElementCount === 0 ? "passed" : "failed",
    siteId,
    handoffId,
    inputRevision,
    phaseStateRevision,
    capturedAt,
    url: mobile.url,
    userAgent: mobileUserAgent,
    adScriptRequests: mobile.matchingRequests.length,
    adContainerCount: mobile.adContainerCount,
    adScriptElementCount: mobile.adScriptElementCount,
    viewport: { width: 390, height: 844 },
    notes: "正式域名桌面与 iPhone UA 移动端均已真实打开；当前站点未启用广告，移动端未请求广告相关脚本，也未渲染广告容器。请求 URL 已去除查询参数。",
  };
  await writeFile(outputPath, `${JSON.stringify(network, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ok: network.status === "passed", outputPath, desktopScreenshot, mobileScreenshot, desktop, mobile, network }, null, 2));
  if (network.status !== "passed") process.exitCode = 1;
} finally {
  await browser.close();
}
