#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { chromium } from "playwright-core";

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback;
}

const baseUrl = arg("base-url").replace(/\/$/, "");
if (!/^https?:\/\//i.test(baseUrl)) throw new Error("必须通过 --base-url 提供正在运行的站点 URL。");
const runId = arg("run-id", randomUUID());
const capturedAt = arg("captured-at", new Date().toISOString());
const outPath = resolve(arg("out", "artifacts/production/migration-journey.json"));
const screenshotDir = resolve(arg("screenshot-dir", `artifacts/quality/migration-repair/${runId}`));
const origin = new URL(baseUrl).origin;

function browserExecutable() {
  return arg("browser") || [
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  ].find((path) => {
    try { return existsSync(path); } catch { return false; }
  });
}

const executablePath = browserExecutable();
if (!executablePath) throw new Error("找不到 Chrome 可执行文件；请通过 --browser 指定路径。");
await mkdir(screenshotDir, { recursive: true });

const failures = [];
const hrefChecks = new Map();
const redirectResults = [];

function pathUrl(path) { return new URL(path, `${baseUrl}/`).toString(); }
function fail(scope, detail) { failures.push(`${scope}: ${detail}`); }
function expect(scope, condition, detail) { if (!condition) fail(scope, detail); }

async function inspectPage(page, context, journey, step) {
  const hrefs = await page.locator("a[href]").evaluateAll((anchors) => anchors.map((anchor) => anchor.getAttribute("href") || ""));
  for (const href of hrefs) {
    if (!href.startsWith("/") || href.startsWith("//") || href.startsWith("/#")) continue;
    const url = new URL(href, origin);
    if (url.origin !== origin || url.hash) continue;
    hrefChecks.set(url.pathname, { path: url.pathname, url: url.toString() });
  }
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    viewportWidth: window.innerWidth,
    overflow: document.documentElement.scrollWidth > window.innerWidth + 1,
  }));
  expect(`${journey}/${step}`, !metrics.overflow, `横向溢出 ${metrics.scrollWidth}px > ${metrics.viewportWidth}px`);
  const viewportLabel = page.viewportSize()?.width === 390 ? "mobile" : "desktop";
  await page.screenshot({ path: resolve(screenshotDir, `${journey}-${viewportLabel}-${step}.png`), fullPage: true });
  return metrics;
}

async function goto(page, context, journey, path, step) {
  const response = await page.goto(pathUrl(path), { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(350);
  expect(`${journey}/${step}`, response && response.status() < 400, `HTTP ${response?.status() || 0}`);
  await inspectPage(page, context, journey, step);
  return response;
}

async function runJourney(browser, viewport, journey) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(`pageerror: ${error.message}`));
  page.on("requestfailed", (request) => { if (request.url().startsWith(origin)) runtimeErrors.push(`requestfailed: ${request.url()} ${request.failure()?.errorText || "unknown"}`); });
  const steps = [];
  const record = (path, step) => steps.push({ path, step });
  try {
    if (journey === "clay-search") {
      await goto(page, context, journey, "/library", "library"); record("/library", "search");
      const input = page.locator('input[placeholder="Enter a topic, tag, or problem"]');
      await input.fill("clay");
      const result = page.locator('.entry-card a[href="/guides/how-to-get-clay"]');
      expect(`${journey}/search`, await result.count() === 1, "Clay 搜索没有唯一 canonical guide 结果");
      await result.click();
      await page.waitForURL("**/guides/how-to-get-clay");
      await page.waitForTimeout(350);
      await inspectPage(page, context, journey, "guide"); record("/guides/how-to-get-clay", "guide");
      expect(`${journey}/guide`, await page.locator("h2", { hasText: "Quick answer" }).count() === 1, "缺少 Quick answer");
      expect(`${journey}/guide`, await page.locator('a[href="https://primagames.com/tips/how-to-get-clay-in-dungeon-settlers"]').count() >= 1, "缺少 Clay 来源入口");
      expect(`${journey}/guide`, await page.locator('a[href^="/library/"]').count() === 0, "正文仍有旧 library 内链");
      await page.locator('a[href="/tools/first-expedition-planner"]').first().click();
      await page.waitForURL("**/tools/first-expedition-planner");
      await page.waitForTimeout(350);
      await inspectPage(page, context, journey, "planner"); record("/tools/first-expedition-planner", "next");
      expect(`${journey}/next`, await page.locator("h1").innerText().then((text) => /expedition planner/i.test(text)), "Clay 下一步未进入 planner");
    }

    if (journey === "planner") {
      await goto(page, context, journey, "/tools/first-expedition-planner", "empty");
      await page.evaluate(() => window.sessionStorage.clear());
      await page.reload({ waitUntil: "domcontentloaded" });
      await page.waitForTimeout(450);
      await page.locator('button[type="submit"]').click();
      expect(`${journey}/empty`, await page.locator("#planner-result-heading").innerText().then((text) => /Start with one visible question/i.test(text)), "空提交没有空结果");
      await inspectPage(page, context, journey, "empty-result"); record("/tools/first-expedition-planner", "empty-result");
      await page.locator("#planner-purpose").selectOption("materials");
      for (const id of ["settlement", "party"]) await page.locator(`#planner-check-${id}`).check();
      await page.locator('button[type="submit"]').click();
      expect(`${journey}/partial`, await page.locator("#planner-result-heading").innerText().then((text) => /incomplete/i.test(text)), "部分选择没有部分结果");
      expect(`${journey}/partial`, await page.locator(".planner-result").innerText().then((text) => /2 of 4/.test(text)), "部分结果没有依据性的 2 of 4");
      await inspectPage(page, context, journey, "partial-result"); record("/tools/first-expedition-planner", "partial-result");
      for (const id of ["research", "return"]) await page.locator(`#planner-check-${id}`).check();
      await page.locator('button[type="submit"]').click();
      expect(`${journey}/ready`, await page.locator("#planner-result-heading").innerText().then((text) => /complete/i.test(text)), "完整选择没有完整结果");
      await inspectPage(page, context, journey, "ready-result"); record("/tools/first-expedition-planner", "ready-result");
      await page.locator('.planner-result a[href="/guides/how-to-get-clay"]').click();
      await page.waitForURL("**/guides/how-to-get-clay");
      await page.waitForTimeout(350);
      await page.locator('a[href="/tools/first-expedition-planner"]').first().click();
      await page.waitForURL("**/tools/first-expedition-planner");
      await page.waitForTimeout(700);
      expect(`${journey}/return`, await page.locator("#planner-purpose").inputValue() === "materials", "返回 planner 未保留 purpose");
      expect(`${journey}/return`, await page.locator('input[type="checkbox"]:checked').count() === 4, "返回 planner 未保留四项勾选");
      await inspectPage(page, context, journey, "return"); record("/tools/first-expedition-planner", "return");
      await page.getByRole("button", { name: "Clear checklist" }).click();
      expect(`${journey}/clear`, await page.locator('input[type="checkbox"]:checked').count() === 0, "Clear checklist 不能清空状态");
    }

    if (journey === "research") {
      await goto(page, context, journey, "/guides/how-to-research", "guide"); record("/guides/how-to-research", "guide");
      await page.locator('a[href="#research-checklist"]').click();
      await page.waitForTimeout(250);
      expect(`${journey}/checklist`, await page.locator("#research-checklist").count() === 1, "Research 主按钮没有进入 checklist");
      expect(`${journey}/checklist`, await page.locator("body").innerText().then((text) => /Verified starting conditions/i.test(text) && /Carapace Processing/i.test(text) && /pending/i.test(text)), "Research 缺少已核验前置、示例或 pending 边界");
      await inspectPage(page, context, journey, "checklist"); record("/guides/how-to-research", "checklist");
      await page.locator('a[href="/tools/first-expedition-planner"]').first().click();
      await page.waitForURL("**/tools/first-expedition-planner");
      await page.waitForTimeout(350);
      await inspectPage(page, context, journey, "planner"); record("/tools/first-expedition-planner", "planner");
      await page.locator('a[href="/updates"]').first().click();
      await page.waitForURL("**/updates");
      await page.waitForTimeout(350);
      expect(`${journey}/updates`, await page.locator("body").innerText().then((text) => /v0\.4\.19/i.test(text)), "Research 回查没有 v0.4.19 更新事实");
      await inspectPage(page, context, journey, "updates"); record("/updates", "updates");
    }
  } catch (error) {
    fail(`${journey}/${viewport.width}`, error instanceof Error ? error.message : String(error));
  }
  await context.close();
  return { journey, viewport: `${viewport.width}x${viewport.height}`, steps, runtimeErrors };
}

const browser = await chromium.launch({ headless: true, executablePath, args: ["--no-first-run", "--no-default-browser-check"] });
const viewports = [{ id: "desktop", width: 1440, height: 900 }, { id: "mobile", width: 390, height: 844 }];
const results = [];
for (const viewport of viewports) for (const journey of ["clay-search", "planner", "research"]) {
  const result = await runJourney(browser, viewport, journey);
  if (result.runtimeErrors.length) fail(`${result.journey}/${result.viewport}`, result.runtimeErrors.join(" | "));
  results.push(result);
}
await browser.close();

const linkResults = [];
for (const item of hrefChecks.values()) {
  try {
    const response = await fetch(item.url, { redirect: "manual" });
    const result = { ...item, statusCode: response.status, location: response.headers.get("location") || "" };
    linkResults.push(result);
    if (response.status >= 400) fail(`href:${item.path}`, `HTTP ${response.status}`);
  } catch (error) {
    linkResults.push({ ...item, statusCode: 0, error: error instanceof Error ? error.message : String(error) });
    fail(`href:${item.path}`, "请求失败");
  }
}

for (const legacy of [
  ["/library/beginner-guide", "/guides/beginner-guide"],
  ["/library/how-to-get-clay", "/guides/how-to-get-clay"],
  ["/library/how-to-research", "/guides/how-to-research"],
]) {
  const response = await fetch(pathUrl(legacy[0]), { redirect: "manual" });
  const location = response.headers.get("location") || "";
  const status = response.status === 308 && new URL(location || origin, origin).pathname === legacy[1] ? "passed" : "failed";
  redirectResults.push({ path: legacy[0], target: legacy[1], statusCode: response.status, location, status });
  expect(`redirect:${legacy[0]}`, status === "passed", `HTTP ${response.status}, location=${location}`);
}

const artifact = {
  schemaVersion: 1,
  runId,
  capturedAt,
  timestampSource: "single migration acceptance run",
  baseUrl,
  status: failures.length ? "failed" : "passed",
  viewports: results,
  links: linkResults,
  redirects: redirectResults,
  screenshots: screenshotDir.replaceAll("\\", "/"),
  failures,
};
await mkdir(resolve(outPath, ".."), { recursive: true });
await writeFile(outPath, `${JSON.stringify(artifact, null, 2)}\n`, "utf8");
console.log(`迁移旅程验收：${artifact.status}，${results.length} 个 viewport journey，${linkResults.length} 条内链，capturedAt=${capturedAt}`);
if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
