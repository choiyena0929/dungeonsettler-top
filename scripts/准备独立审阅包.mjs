#!/usr/bin/env node
import { access, mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";

function arg(name, fallback = "") {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback;
}

const sitePath = resolve(arg("site-path", "."));
const runPath = resolve(sitePath, arg("run", "artifacts/quality/quality-run.json"));
const contractsPath = resolve(sitePath, arg("contracts", "research/page-contracts.json"));
const outPath = resolve(sitePath, arg("out", "artifacts/quality/independent-review-packet.json"));
const run = JSON.parse(await readFile(runPath, "utf8"));
const contracts = JSON.parse(await readFile(contractsPath, "utf8"));
if (run.schemaVersion !== 2 || !Array.isArray(run.rounds) || !run.rounds.length) throw new Error("quality-run.json 必须先有至少一轮 v2 真实截图。 ");
if (!String(run.handoffId || "").trim() || !String(run.inputRevision || "").trim() || !String(run.implementerId || "").trim()) throw new Error("质量运行缺少 handoffId、inputRevision 或 implementerId。 ");
if (contracts.schemaVersion !== 1 || !Array.isArray(contracts.pages) || contracts.pages.length < 2) throw new Error("机器页面合同结构无效，不能生成独立审阅包。 ");

const latestRound = run.rounds.at(-1);
const cleanRef = (value) => String(value || "").replaceAll("\\", "/").trim();
const hash = async (relative) => {
  const path = resolve(sitePath, relative);
  await access(path);
  const bytes = await readFile(path);
  const image = await stat(path);
  if (image.size < 1024 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") throw new Error(`截图不是有效 PNG 或尺寸过小：${relative}`);
  return createHash("sha256").update(bytes).digest("hex");
};
const desktop = cleanRef(latestRound.desktopScreenshot);
const mobile = cleanRef(latestRound.mobileScreenshot);
const desktopViewport = cleanRef(latestRound.desktopViewportScreenshot);
const mobileViewport = cleanRef(latestRound.mobileViewportScreenshot);
if (!desktop || !mobile || !desktopViewport || !mobileViewport || !latestRound.desktopSha256 || !latestRound.mobileSha256 || !latestRound.desktopViewportSha256 || !latestRound.mobileViewportSha256) throw new Error("最近一轮缺少桌面/移动整页与首屏视口截图或 SHA-256。 ");
const screenshotChecks = [
  [desktop, latestRound.desktopSha256],
  [mobile, latestRound.mobileSha256],
  [desktopViewport, latestRound.desktopViewportSha256],
  [mobileViewport, latestRound.mobileViewportSha256],
];
for (const [reference, expectedHash] of screenshotChecks) {
  if (await hash(reference) !== expectedHash) throw new Error(`最近一轮截图哈希与质量运行记录不一致：${reference}`);
}

const packet = {
  schemaVersion: 1,
  type: "independent-quality-review-handoff",
  status: "ready",
  createdAt: new Date().toISOString(),
  handoffId: run.handoffId,
  inputRevision: run.inputRevision,
  implementerId: run.implementerId,
  reviewerContract: {
    id: "",
    role: "independent-quality-reviewer",
    context: "fresh",
    mustDifferFrom: run.implementerId,
  },
  sourceArtifacts: {
    pageContracts: cleanRef(arg("contracts", "research/page-contracts.json")),
    designContract: "设计合同.md",
    visualBenchmark: "research/visual-benchmark.md",
    assetManifest: "research/素材清单.json",
    qualityRun: cleanRef(arg("run", "artifacts/quality/quality-run.json")),
  },
  latestRound: {
    id: latestRound.id,
    completedAt: latestRound.completedAt,
    route: latestRound.route || "/",
    desktopScreenshot: desktop,
    mobileScreenshot: mobile,
    desktopViewportScreenshot: desktopViewport,
    mobileViewportScreenshot: mobileViewport,
    desktopSha256: latestRound.desktopSha256,
    mobileSha256: latestRound.mobileSha256,
    desktopViewportSha256: latestRound.desktopViewportSha256,
    mobileViewportSha256: latestRound.mobileViewportSha256,
  },
  criteria: [
    { id: "visual-hierarchy", question: "首屏、正文、工具、来源和内链是否有明确主次？" },
    { id: "game-identity", question: "遮住站名后，页面是否仍能辨认具体游戏及其玩法身份？" },
    { id: "responsive", question: "桌面和移动端的主要任务、长标题、触控和导航是否可用？" },
    { id: "usability", question: "玩家能否在几秒内找到核心答案并完成主要动作？" },
    { id: "content-seo-balance", question: "真实内容、来源边界、关键词和页面体验是否自然平衡？" },
  ],
  reviewerInstructions: [
    "只使用本审阅包列出的合同、来源和真实截图；不要沿用实现者的自评理由。",
    "逐项填写 quality-review.json 的 criteria notes；每项至少写具体观察和通过/不通过依据，并把 reviewedRoundId 填为 latestRound.id。",
    "审阅四张图：桌面/移动整页图用于判断整体层级和页面长度，桌面/移动首屏视口图用于判断真实字号、导航、触控和首屏可用性；不能把整页图缩放后的显示比例当作页面实际字号。",
    "发现问题时保留 route、viewport、截图证据、责任阶段和可复验修订目标。",
    "不要把“看起来不错”当作通过，也不要用总分替代五项判断。",
  ],
  returnArtifact: "artifacts/quality/quality-review.json",
};

await mkdir(dirname(outPath), { recursive: true });
await writeFile(outPath, `${JSON.stringify(packet, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ ok: true, outPath, roundId: latestRound.id, reviewerMustDifferFrom: run.implementerId }, null, 2));
