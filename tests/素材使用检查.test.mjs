import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import test from "node:test";

const execute = promisify(execFile);
const scriptPath = fileURLToPath(new URL("../scripts/检查素材使用.mjs", import.meta.url));

async function writeFixture(root, { includeIconReference = true } = {}) {
  await Promise.all([
    mkdir(join(root, "app"), { recursive: true }),
    mkdir(join(root, "artifacts", "visual"), { recursive: true }),
    mkdir(join(root, "public", "game", "icons"), { recursive: true }),
    mkdir(join(root, "research"), { recursive: true }),
  ]);

  const source = 'const hero = "/game/hero.webp";\n' + (includeIconReference ? 'const icons = "/game/icons/";\n' : "");
  const manifest = {
    schemaVersion: 1,
    phase: "ready",
    site: "Fixture Game Guide",
    visualStrategy: "approved-game-assets",
    homepage: {
      requiredAssetIds: ["hero-gameplay-01", "inventory-icon-set"],
      desktopScreenshot: "artifacts/visual/home-desktop.png",
      mobileScreenshot: "artifacts/visual/home-mobile.png",
    },
    assets: [
      {
        id: "hero-gameplay-01",
        role: "hero",
        kind: "gameplay-screenshot",
        gameSpecific: true,
        state: "in-use",
        required: true,
        source: { url: "https://example.com/media", evidence: "research/source-manifest.md#M001" },
        rights: { status: "confirmed", basis: "fixture approval" },
        localPath: "public/game/hero.webp",
        renderTargets: [{ route: "/", implementation: "app/page.tsx", placement: "首页首屏" }],
        crop: "保留角色和玩法 UI。",
        alt: "游戏中的背包与角色。",
      },
      {
        id: "inventory-icon-set",
        role: "icon-system",
        kind: "game-icon-set",
        gameSpecific: true,
        state: "in-use",
        required: true,
        source: { url: "https://example.com/media", evidence: "research/source-manifest.md#M002" },
        rights: { status: "confirmed", basis: "fixture approval" },
        localPath: "public/game/icons/",
        renderTargets: [{ route: "/", implementation: "app/page.tsx", placement: "核心玩法入口" }],
        crop: "图标与对应玩法并列。",
        alt: "背包物品图标。",
      },
    ],
  };

  await Promise.all([
    writeFile(join(root, "app", "page.tsx"), source),
    writeFile(join(root, "artifacts", "visual", "home-desktop.png"), ""),
    writeFile(join(root, "artifacts", "visual", "home-mobile.png"), ""),
    writeFile(join(root, "public", "game", "hero.webp"), ""),
    writeFile(join(root, "research", "素材清单.json"), JSON.stringify(manifest, null, 2)),
    writeFile(join(root, "research", "visual-benchmark.md"), "# 视觉基准\nhero-gameplay-01\ninventory-icon-set\n"),
    writeFile(join(root, "设计合同.md"), "# 设计合同\nhero-gameplay-01\ninventory-icon-set\n"),
  ]);
}

async function runAudit(root) {
  try {
    const result = await execute(process.execPath, [scriptPath, "--site", root]);
    return { code: 0, stdout: result.stdout, stderr: result.stderr };
  } catch (error) {
    return { code: error.code, stdout: error.stdout, stderr: error.stderr };
  }
}

test("素材检查接受已闭环的首页游戏视觉资产", async () => {
  const root = await mkdtemp(join(tmpdir(), "素材检查-"));
  try {
    await writeFixture(root);
    const result = await runAudit(root);
    assert.equal(result.code, 0, result.stderr);
    assert.match(result.stdout, /素材使用检查通过/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("素材检查拒绝已声明却没有源码引用的必需资产", async () => {
  const root = await mkdtemp(join(tmpdir(), "素材检查-"));
  try {
    await writeFixture(root, { includeIconReference: false });
    const result = await runAudit(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /没有在源码中找到路径引用/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("素材检查拒绝正式站保留模板阶段", async () => {
  const root = await mkdtemp(join(tmpdir(), "素材检查-"));
  try {
    await writeFixture(root);
    const manifestPath = join(root, "research", "素材清单.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
    manifest.phase = "template";
    await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    const result = await runAudit(root);
    assert.equal(result.code, 1);
    assert.match(result.stderr, /正式站点不能保留 phase=template/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
