#!/usr/bin/env node
import { createHash } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";

const root = resolve(process.argv.includes("--site") ? process.argv[process.argv.indexOf("--site") + 1] : ".");
const sourceDir = join(root, "research", "game-data", "DS_B.0.4.19");
const snapshotPath = join(root, "app", "data", "dungeon-settlers-db.ts");
const errors = [];

function readJson(name) {
  const path = join(sourceDir, `${name}.json`);
  if (!existsSync(path)) { errors.push(`缺少资料源文件：${name}.json`); return null; }
  try { return JSON.parse(readFileSync(path, "utf8")); } catch (error) { errors.push(`${name}.json 不是有效 JSON：${error.message}`); return null; }
}

const index = readJson("index");
const research = readJson("ResearchTable");
const items = readJson("ItemTable");
const units = readJson("UnitTable");
const buildings = readJson("BuildingTable");
const drops = readJson("DropTable");
const recipes = readJson("RecipeTable");
const tradePools = readJson("TradePoolTable");
const snapshotSource = existsSync(snapshotPath) ? readFileSync(snapshotPath, "utf8") : "";
let snapshot;
if (snapshotSource) {
  try {
    const marker = "export const gameDataSnapshot = ";
    const jsonText = snapshotSource.slice(snapshotSource.indexOf(marker) + marker.length).replace(/\s+as const;\s*$/, "");
    snapshot = JSON.parse(jsonText);
  } catch (error) {
    errors.push(`生成后的资料快照无法解析：${error.message}`);
  }
}

if (!snapshotSource) errors.push("缺少生成后的资料快照：app/data/dungeon-settlers-db.ts");
if (index && index.game !== "Dungeon Settlers") errors.push("资料源游戏身份不是 Dungeon Settlers。");
if (index && index.build !== "DS_B.0.4.19") errors.push(`资料源版本不是 DS_B.0.4.19：${index.build}`);
if (index && String(index.steam_buildid) !== "25154317") errors.push(`Steam build id 不匹配：${index.steam_buildid}`);

const expected = {
  research: research?.length,
  items: items?.length,
  resources: items?.filter((row) => row.ItemTypeName === "Resource").length,
  units: units?.length,
  buildings: buildings?.length,
  drops: drops?.length,
  recipes: recipes?.length,
  tradePools: tradePools?.length,
};
for (const [name, count] of Object.entries(expected)) {
  if (!Number.isInteger(count) || !snapshot || snapshot.counts?.[name] !== count || !Array.isArray(snapshot[name]) || snapshot[name].length !== count) errors.push(`快照没有完整登记 ${name}=${count}。`);
}

const sentinelPattern = /"(NULL|NOT_USED|Dev_NotUsed)"/;
if (sentinelPattern.test(snapshotSource)) errors.push("公开快照不应保留空值哨兵字符串。");
const sourceFiles = ["index", "ResearchTable", "ItemTable", "UnitTable", "BuildingTable", "DropTable", "RecipeTable", "TradePoolTable", "TextKeyTable_en"];
if (index && snapshotSource) {
  for (const name of sourceFiles) {
    const raw = readFileSync(join(sourceDir, `${name}.json`));
    const hash = createHash("sha256").update(raw).digest("hex");
    if (!snapshotSource.includes(`"${name}": "${hash}"`)) errors.push(`快照缺少 ${name}.json 的 SHA-256 收据。`);
  }
}

if (errors.length) {
  console.error("游戏资料快照检查失败：");
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}
console.log(`游戏资料快照检查通过：DS_B.0.4.19 / Steam build 25154317，Research ${expected.research}，资源 ${expected.resources}，物品 ${expected.items}，单位 ${expected.units}，建筑 ${expected.buildings}，掉落 ${expected.drops}，配方 ${expected.recipes}。`);
