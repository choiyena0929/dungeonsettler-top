#!/usr/bin/env node
// 检查游戏视觉资产是否从素材清单真正进入页面实现。
//
// 常规用法：
// npm run check:assets
// node scripts/检查素材使用.mjs --site D:\WebProjects\sites\example.com
//
// 模板目录本身允许 phase=template；正式站点必须把素材清单推进到 phase=ready。
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { basename, extname, join, relative, resolve } from "node:path";

const args = process.argv.slice(2);
const ignoredDirectories = new Set([".git", ".next", ".wrangler", "build", "coverage", "dist", "node_modules"]);
const sourceExtensions = new Set([".astro", ".css", ".html", ".jsx", ".js", ".mdx", ".scss", ".tsx", ".ts", ".vue"]);
const allowedPhases = new Set(["template", "draft", "ready"]);
const templateDirectoryName = "data-to-decision-site-starter";
const templateAssetNames = ["file.svg", "globe.svg", "next.svg", "vercel.svg", "window.svg"];

function optionValue(name) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}

function isPlaceholder(value) {
  if (typeof value !== "string") return true;
  const normalized = value.trim();
  return !normalized || /\{\{.+\}\}|待填写|待补|placeholder|todo/i.test(normalized);
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isInsideRoot(root, candidate) {
  const path = relative(root, candidate);
  return path === "" || (!path.startsWith("..") && !path.includes(":"));
}

function collectSourceFiles(directory) {
  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (!ignoredDirectories.has(entry.name)) files.push(...collectSourceFiles(join(directory, entry.name)));
      continue;
    }
    if (entry.isFile() && sourceExtensions.has(extname(entry.name).toLowerCase())) files.push(join(directory, entry.name));
  }
  return files;
}

function normalizePath(value) {
  return value.replaceAll("\\", "/").replace(/\/+$/, "");
}

function publicReference(localPath) {
  const normalized = normalizePath(localPath);
  if (normalized === "public") return "/";
  if (normalized.startsWith("public/")) return "/" + normalized.slice("public/".length);
  return normalized;
}

function localEvidenceExists(root, evidence) {
  if (typeof evidence !== "string" || !evidence.trim()) return false;
  if (/^https?:\/\//i.test(evidence.trim())) return true;
  const resolved = resolve(root, evidence);
  return isInsideRoot(root, resolved) && existsSync(resolved);
}

const siteRoot = resolve(optionValue("--site") ?? ".");
const manifestRelativePath = optionValue("--manifest") ?? "research/素材清单.json";
const manifestPath = resolve(siteRoot, manifestRelativePath);
const errors = [];
const warnings = [];

function error(message) {
  errors.push(message);
}

if (!existsSync(manifestPath)) {
  error("缺少素材清单：" + manifestRelativePath + "。新站、首页重做和视觉改造不能只靠设计合同。");
} else {
  let manifest;
  try {
    manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  } catch (cause) {
    error("素材清单不是有效 JSON：" + cause.message);
  }

  if (manifest) {
    if (manifest.schemaVersion !== 1) error("schemaVersion 必须为 1。");
    if (!allowedPhases.has(manifest.phase)) error("phase 必须为 template、draft 或 ready。");
    if (!manifest.homepage || typeof manifest.homepage !== "object") error("缺少 homepage 对象。");
    if (!Array.isArray(manifest.assets)) error("assets 必须是数组。");

    if (manifest.phase === "template") {
      if (basename(siteRoot) !== templateDirectoryName) {
        error("正式站点不能保留 phase=template。先完成素材清单、页面绑定和截图证据，再设为 ready。");
      }
    } else if (manifest.phase !== "ready") {
      error("当前素材清单仍处于 draft，不能作为 S4 视觉验收证据。");
    } else {
      if (isPlaceholder(manifest.site)) error("site 必须填写真实站点名。");
      if (isPlaceholder(manifest.visualStrategy)) error("visualStrategy 必须说明实际采用的视觉策略。");

      const homepage = manifest.homepage ?? {};
      const requiredIds = asArray(homepage.requiredAssetIds);
      if (requiredIds.length < 2) error("首页至少需要两个不同角色的必需视觉锚点。");
      if (!localEvidenceExists(siteRoot, homepage.desktopScreenshot)) error("首页缺少可回查的桌面截图证据。");
      if (!localEvidenceExists(siteRoot, homepage.mobileScreenshot)) error("首页缺少可回查的移动截图证据。");

      const assetsById = new Map();
      for (const asset of asArray(manifest.assets)) {
        if (!asset || typeof asset !== "object") {
          error("assets 中存在非对象条目。");
          continue;
        }
        if (isPlaceholder(asset.id)) {
          error("存在没有 id 的资产。");
          continue;
        }
        if (assetsById.has(asset.id)) error("资产 id 重复：" + asset.id);
        assetsById.set(asset.id, asset);
      }

      const requiredAssets = [];
      for (const assetId of requiredIds) {
        const asset = assetsById.get(assetId);
        if (!asset) {
          error("首页引用了不存在的资产 id：" + assetId);
          continue;
        }
        requiredAssets.push(asset);
        if (asset.state !== "in-use") error("首页必需资产尚未实际使用：" + assetId);
        if (asset.required !== true) error("首页必需资产必须标记 required=true：" + assetId);
        if (!asArray(asset.renderTargets).some((target) => target && target.route === "/")) {
          error("首页必需资产没有路由 / 的渲染目标：" + assetId);
        }
      }

      const roles = new Set(requiredAssets.map((asset) => asset.role).filter(Boolean));
      if (roles.size < 2) error("首页必需资产至少覆盖两个不同的视觉角色，例如 hero 与 mechanic/icon-system。");
      if (!requiredAssets.some((asset) => asset.gameSpecific === true)) {
        error("首页没有标记为 gameSpecific 的游戏视觉锚点。");
      }

      const sourceFiles = collectSourceFiles(siteRoot);
      const sourceText = sourceFiles.map((file) => {
        try {
          return readFileSync(file, "utf8");
        } catch {
          return "";
        }
      }).join("\n");

      const designContractPath = join(siteRoot, "设计合同.md");
      const benchmarkPath = join(siteRoot, "research", "visual-benchmark.md");
      const designContract = existsSync(designContractPath) ? readFileSync(designContractPath, "utf8") : "";
      const benchmark = existsSync(benchmarkPath) ? readFileSync(benchmarkPath, "utf8") : "";
      if (!existsSync(designContractPath)) error("缺少设计合同.md，无法核对资产落点。");
      if (!existsSync(benchmarkPath)) error("缺少 research/visual-benchmark.md，无法核对对标和素材决策。");

      for (const asset of assetsById.values()) {
        const isInUse = asset.state === "in-use";
        if (isPlaceholder(asset.role)) error("资产缺少 role：" + asset.id);
        if (isPlaceholder(asset.kind)) error("资产缺少 kind：" + asset.id);
        if (!asset.source || isPlaceholder(asset.source.url) || isPlaceholder(asset.source.evidence)) {
          error("资产缺少可回查来源或证据：" + asset.id);
        }
        if (!asset.rights || asset.rights.status !== "confirmed" || isPlaceholder(asset.rights.basis)) {
          error("资产没有确认的权利状态或依据：" + asset.id);
        }
        const targets = asArray(asset.renderTargets);
        if (isInUse && targets.length === 0) error("已使用资产没有 renderTargets：" + asset.id);
        for (const target of targets) {
          if (!target || isPlaceholder(target.route) || isPlaceholder(target.implementation) || isPlaceholder(target.placement)) {
            error("资产 renderTargets 不完整：" + asset.id);
            continue;
          }
          const implementationPath = resolve(siteRoot, target.implementation);
          if (!isInsideRoot(siteRoot, implementationPath) || !existsSync(implementationPath)) {
            error("资产实现文件不存在：" + asset.id + " → " + target.implementation);
          }
        }

        const needsFile = asset.kind !== "mechanic-visual";
        if (needsFile && isPlaceholder(asset.localPath)) error("资产缺少 localPath：" + asset.id);
        if (!isPlaceholder(asset.localPath)) {
          const localPath = resolve(siteRoot, asset.localPath);
          if (!isInsideRoot(siteRoot, localPath)) {
            error("资产 localPath 越出站点目录：" + asset.id);
          } else if (!existsSync(localPath)) {
            error("资产文件或目录不存在：" + asset.id + " → " + asset.localPath);
          } else if (isInUse) {
            const reference = publicReference(asset.localPath);
            if (!sourceText.includes(reference)) {
              error("已使用资产没有在源码中找到路径引用：" + asset.id + " → " + reference);
            }
          }
        }

        if (isInUse && isPlaceholder(asset.alt) && asset.kind !== "mechanic-visual") {
          error("图片或图标资产缺少可读 alt：" + asset.id);
        }
        if (isInUse && isPlaceholder(asset.crop) && asset.kind !== "mechanic-visual") {
          error("图片或图标资产缺少裁切/层级规则：" + asset.id);
        }
        if (asset.required === true) {
          if (!designContract.includes(asset.id)) error("设计合同没有引用必需资产：" + asset.id);
          if (!benchmark.includes(asset.id)) error("视觉基准包没有引用必需资产：" + asset.id);
        }
      }

      for (const assetName of templateAssetNames) {
        if (sourceText.includes("/" + assetName)) {
          error("源码仍引用默认模板素材：/" + assetName);
        }
      }

      if (requiredAssets.length > 0 && !requiredAssets.some((asset) => asset.kind === "gameplay-screenshot" || asset.kind === "official-key-art" || asset.kind === "in-game-capture" || asset.kind === "game-icon-set")) {
        warnings.push("首页没有图片或图标型游戏锚点；请确认这不是用抽象 CSS 替代游戏视觉。");
      }
    }
  }
}

if (errors.length > 0) {
  console.error("素材使用检查失败：");
  for (const message of errors) console.error("- " + message);
  console.error("先补齐素材清单、权利证据、本地路径、页面绑定和截图，再进入视觉验收。");
  process.exit(1);
}

if (warnings.length > 0) {
  for (const message of warnings) console.warn("提示：" + message);
}

if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  if (manifest.phase === "template") {
    console.log("素材使用检查通过：当前是模板目录，已验证素材闭环脚手架。复制为正式站点后必须改为 phase=ready。");
  } else {
    console.log("素材使用检查通过：首页必需资产已完成来源、权利、本地路径、代码引用、合同和截图证据闭环。");
  }
}
