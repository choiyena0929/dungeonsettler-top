#!/usr/bin/env node
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { chromium } from "playwright-core";

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback;
}

const baseUrl = arg("base-url");
const route = arg("route", "/");
const roundId = arg("round-id");
const handoffId = arg("handoff-id");
const inputRevision = arg("input-revision");
const implementerId = arg("implementer-id");
const runPath = resolve(arg("run", "artifacts/quality/quality-run.json"));
if (!/^https?:\/\//i.test(baseUrl)) throw new Error("必须通过 --base-url 提供本地、预览或正式站 URL。");
if (!route.startsWith("/")) throw new Error("--route 必须是以 / 开头的站内路径。");
if (!roundId || !handoffId || !inputRevision || !implementerId) throw new Error("必须提供 --round-id、--handoff-id、--input-revision 和 --implementer-id。");

const safeRoundId = roundId.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/^-|-$/g, "");
if (!safeRoundId) throw new Error("--round-id 无法生成安全文件名。");
const qualityDirectory = dirname(runPath);
const desktopPath = resolve(qualityDirectory, `${safeRoundId}-desktop.png`);
const mobilePath = resolve(qualityDirectory, `${safeRoundId}-mobile.png`);
const desktopViewportPath = resolve(qualityDirectory, `${safeRoundId}-desktop-viewport.png`);
const mobileViewportPath = resolve(qualityDirectory, `${safeRoundId}-mobile-viewport.png`);
const relativeRef = (path) => `artifacts/quality/${path.split(/[\\/]/).at(-1)}`;
const sha256 = (value) => createHash("sha256").update(value).digest("hex");
const MAX_SAFE_FULL_PAGE_HEIGHT = 16_000;

async function firstExisting(paths) {
  for (const path of paths.filter(Boolean)) {
    try { await access(path); return path; } catch { /* 继续检查下一个路径 */ }
  }
  throw new Error("找不到 Chrome。请设置 CHROME_PATH，或安装标准路径的 Google Chrome。");
}

const chromePath = await firstExisting([
  process.env.CHROME_PATH,
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  process.env.LOCALAPPDATA ? resolve(process.env.LOCALAPPDATA, "Google", "Chrome", "Application", "chrome.exe") : "",
]);

const run = JSON.parse(await readFile(runPath, "utf8"));
if (run.schemaVersion !== 2 || !Array.isArray(run.rounds)) throw new Error("quality-run.json 必须使用 schemaVersion 2。");
if (![handoffId, "{{handoff-id}}"].includes(String(run.handoffId || ""))) throw new Error("handoffId 与当前质量运行不一致。");
if (![inputRevision, "{{input-revision}}"].includes(String(run.inputRevision || ""))) throw new Error("inputRevision 与当前质量运行不一致。");
if (run.implementerId && run.implementerId !== implementerId) throw new Error("implementerId 与已有质量运行不一致。");

await mkdir(qualityDirectory, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  executablePath: chromePath,
  args: ["--hide-scrollbars", "--no-first-run", "--no-default-browser-check"],
});

async function capture(name, viewport, outputPath, viewportOutputPath, isMobile = false) {
  const context = await browser.newContext({ viewport, deviceScaleFactor: 1, isMobile });
  const page = await context.newPage();
  const targetOrigin = new URL(baseUrl).origin;
  const isSameOrigin = (candidate) => {
    try { return new URL(candidate).origin === targetOrigin; } catch { return false; }
  };
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on("response", (response) => {
    if (isSameOrigin(response.url()) && response.status() >= 400 && ["document", "script", "fetch", "xhr"].includes(response.request().resourceType())) runtimeErrors.push(`http ${response.status()}: ${response.url()}`);
  });
  page.on("requestfailed", (request) => {
    if (isSameOrigin(request.url()) && ["document", "script", "fetch", "xhr"].includes(request.resourceType())) runtimeErrors.push(`requestfailed: ${request.url()} (${request.failure()?.errorText || "unknown"})`);
  });
  try {
    const url = new URL(route, baseUrl).toString();
    const response = await page.goto(url, { waitUntil: "networkidle", timeout: 45000 });
    if (!response || !response.ok()) throw new Error(`${name} 页面响应失败：${response?.status() ?? "no-response"}`);
    await page.evaluate(() => {
      for (const image of document.images) {
        image.loading = "eager";
        image.setAttribute("fetchpriority", "low");
      }
    });
    const initialHeight = await page.evaluate(() => document.documentElement.scrollHeight);
    const step = Math.max(320, Math.floor(viewport.height * 0.8));
    for (let y = 0; y <= initialHeight; y += step) {
      await page.evaluate((position) => window.scrollTo(0, position), y);
      await page.waitForTimeout(90);
    }
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await page.waitForTimeout(300);
    await page.waitForFunction(
      () => [...document.images].every((image) => image.complete && image.naturalWidth > 0),
      { timeout: 30000 },
    );
    await page.evaluate(async () => {
      await Promise.all([...document.images].map((image) => image.decode().catch(() => undefined)));
      window.scrollTo(0, document.documentElement.scrollHeight);
    });
    await page.waitForTimeout(150);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(150);
    const html = await page.content();
    const metrics = await page.evaluate(() => ({
      title: document.title,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth,
      h1Count: document.querySelectorAll("h1").length,
      bodyTextLength: document.body?.innerText?.trim().length || 0,
    }));
    if (metrics.documentHeight > MAX_SAFE_FULL_PAGE_HEIGHT) {
      throw new Error(`${name} 全页高度 ${metrics.documentHeight}px 超过 PNG 截图安全上限 ${MAX_SAFE_FULL_PAGE_HEIGHT}px；请先拆分页面或降低首屏后的重复内容。`);
    }
    await page.screenshot({ path: outputPath, fullPage: true });
    await page.screenshot({ path: viewportOutputPath, fullPage: false });
    const screenshot = await readFile(outputPath);
    const viewportScreenshot = await readFile(viewportOutputPath);
    const linkCandidate = await page.evaluate(() => {
      const current = new URL(location.href);
      return [...document.querySelectorAll("a[href]")].map((link, index) => {
        const rect = link.getBoundingClientRect();
        const style = getComputedStyle(link);
        let target;
        try { target = new URL(link.href, location.href); } catch { return null; }
        const visible = rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
        const differentRoute = target.pathname !== current.pathname || target.search !== current.search;
        return visible && target.origin === current.origin && differentRoute && !link.hasAttribute("download") && link.target !== "_blank"
          ? { index, href: link.getAttribute("href"), expected: target.toString() }
          : null;
      }).find(Boolean) || null;
    });
    if (!linkCandidate) throw new Error(`${name} 页面没有可用于交互验证的可见站内子页链接。`);
    const beforeClick = page.url();
    await page.locator("a[href]").nth(linkCandidate.index).click({ timeout: 10000 });
    await page.waitForTimeout(500);
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => undefined);
    const afterClick = page.url();
    if (afterClick === beforeClick) throw new Error(`${name} 站内链接点击后 URL 没有变化：${linkCandidate.href}`);
    if (new URL(afterClick).origin !== new URL(url).origin) throw new Error(`${name} 交互验证意外离开站点：${afterClick}`);
    if (runtimeErrors.length) throw new Error(`${name} 页面或站内跳转出现脚本错误：${runtimeErrors.slice(0, 3).join(" | ")}`);
    return {
      name,
      url,
      viewport,
      ...metrics,
      domSha256: sha256(html),
      screenshotSha256: sha256(screenshot),
      viewportScreenshotSha256: sha256(viewportScreenshot),
      interaction: { status: "passed", href: linkCandidate.href, expectedUrl: linkCandidate.expected, finalUrl: afterClick, runtimeErrors: [] },
    };
  } finally {
    await context.close();
  }
}

try {
  const desktop = await capture("desktop", { width: 1440, height: 1000 }, desktopPath, desktopViewportPath);
  const mobile = await capture("mobile", { width: 390, height: 844 }, mobilePath, mobileViewportPath, true);
  if (desktop.horizontalOverflow || mobile.horizontalOverflow) {
    throw new Error(`检测到横向溢出：desktop=${desktop.horizontalOverflow}, mobile=${mobile.horizontalOverflow}`);
  }
  const round = {
    id: roundId,
    completedAt: new Date().toISOString(),
    route,
    url: new URL(route, baseUrl).toString(),
    desktopScreenshot: relativeRef(desktopPath),
    mobileScreenshot: relativeRef(mobilePath),
    desktopViewportScreenshot: relativeRef(desktopViewportPath),
    mobileViewportScreenshot: relativeRef(mobileViewportPath),
    desktopSha256: desktop.screenshotSha256,
    mobileSha256: mobile.screenshotSha256,
    desktopViewportSha256: desktop.viewportScreenshotSha256,
    mobileViewportSha256: mobile.viewportScreenshotSha256,
    desktopDomSha256: desktop.domSha256,
    mobileDomSha256: mobile.domSha256,
    capture: { desktop, mobile },
  };
  run.handoffId = handoffId;
  run.inputRevision = inputRevision;
  run.implementerId = implementerId;
  run.status = ["", "not-started", "passed"].includes(String(run.status || "")) ? "in-progress" : run.status;
  run.rounds = [...run.rounds.filter((item) => item.id !== roundId), round];
  await writeFile(runPath, `${JSON.stringify(run, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ok: true, runPath, round }, null, 2));
} finally {
  await browser.close();
}
