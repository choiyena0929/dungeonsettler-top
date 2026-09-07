#!/usr/bin/env node
/**
 * Build a small, searchable snapshot from the version-locked Dungeon Settlers
 * table dump. The source is an unofficial, byte-exact parse of the stock game
 * files; it is intentionally kept separate from official Steam claims.
 */
import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

function arg(name, fallback) {
  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? String(process.argv[index + 1] || "").trim() : fallback;
}

const root = resolve(arg("site", "."));
const sourceDir = resolve(root, arg("source", "research/game-data/DS_B.0.4.19"));
const output = resolve(root, arg("output", "app/data/dungeon-settlers-db.ts"));

async function readJson(name) {
  return JSON.parse(await readFile(resolve(sourceDir, `${name}.json`), "utf8"));
}

const [index, text, researchRows, itemRows, unitRows, buildingRows, dropRows, recipeRows, tradePoolRows] = await Promise.all([
  readJson("index"),
  readJson("TextKeyTable_en"),
  readJson("ResearchTable"),
  readJson("ItemTable"),
  readJson("UnitTable"),
  readJson("BuildingTable"),
  readJson("DropTable"),
  readJson("RecipeTable"),
  readJson("TradePoolTable"),
]);

const sourceFiles = ["index", "TextKeyTable_en", "ResearchTable", "ItemTable", "UnitTable", "BuildingTable", "DropTable", "RecipeTable", "TradePoolTable"];
const hashes = {};
for (const name of sourceFiles) {
  const raw = await readFile(resolve(sourceDir, `${name}.json`));
  hashes[name] = createHash("sha256").update(raw).digest("hex");
}

function cleanList(value) {
  return Array.isArray(value) ? value.filter((item) => typeof item === "string" && item && !["NULL", "NOT_USED", "Dev_NotUsed"].includes(item)) : [];
}

function displayName(key) {
  if (!key) return "Unknown";
  const direct = text[`TEXTKEY_${key}_NAME`];
  if (typeof direct === "string" && direct !== "NULL" && direct.trim()) return direct.trim();
  const readable = key.replace(/^(ITEM|BUILDING|UNIT|RESEARCH|DROP|RECIPE|TRADEPOOL)_/, "").replace(/([a-z])([A-Z])/g, "$1 $2").replaceAll("_", " ");
  return readable || key;
}

function reference(key) {
  const kind = key?.split("_")[0] || "UNKNOWN";
  return { key, name: displayName(key), kind: kind.toLowerCase() };
}

function compactItem(row) {
  return {
    key: row.Key,
    name: displayName(row.Key),
    type: row.ItemTypeName,
    subtype: row.ItemSubTypeName,
    rarity: row.RarityName,
    price: row.StandardPrice,
    maxStack: row.MaxStack,
    weight: row.Weight,
    durability: row.Durability,
    hungerRestore: row.HungerRestore,
    edible: row.IsEdible,
    usable: row.IsUsable,
    weapon: row.IsWeapon,
    requiredRepair: cleanList(row.RequiredItemsRepair).map(reference),
  };
}

function compactUnit(row) {
  return {
    key: row.Key,
    name: displayName(row.Key),
    faction: row.FactionName,
    subtype: row.SubFactionName,
    behavior: row.BehaviourTypeName,
    combatPattern: row.CombatPattern,
    health: row.MaxHealthTotal,
    physicalAttack: row.PhysicalAttackPower,
    magicAttack: row.MagicAttackPower,
    attackSpeed: row.AttackSpeed,
    physicalResistance: row.PhysicalResistance,
    magicResistance: row.MagicResistance,
    movementSpeed: row.MovementSpeed,
    drops: [...cleanList(row.OnDeathItemsAndDrops), ...cleanList(row.FirstKillItemsAndDrops)].map(reference),
  };
}

function compactBuilding(row) {
  return {
    key: row.Key,
    name: displayName(row.Key),
    type: row.TypeName,
    subtype: row.SubTypeName,
    category: row.ConstructionCategoryName,
    housing: row.IsHousing,
    storageCapacity: row.StorageCapacity,
    durability: row.Durability,
    constructionWorkload: row.ConstructionWorkloadRequired,
    gatheringWorkload: row.GatheringWorkloadRequired,
    constructionItems: cleanList(row.ConstructionRequiredItems).map(reference),
    unlockItems: cleanList(row.UnlockRequiredItems).map(reference),
    gathers: cleanList(row.OnGatherItemsAndDrops).map(reference),
  };
}

function compactDrop(row) {
  const slots = [1, 2, 3].map((slot) => ({
    item: row[`DropItem${slot === 1 ? "One" : slot === 2 ? "Two" : "Three"}_ItemKey`],
    amount: row[`DropItem${slot === 1 ? "One" : slot === 2 ? "Two" : "Three"}_Amount`],
    percentage: row[`DropItem${slot === 1 ? "One" : slot === 2 ? "Two" : "Three"}_Percentage`],
    probabilityWeight: row[`DropItem${slot === 1 ? "One" : slot === 2 ? "Two" : "Three"}_ProbabilityWeight`],
  })).filter((slot) => slot.item && !["NULL", "NOT_USED"].includes(slot.item));
  return { key: row.Key, name: displayName(row.Key), slots: slots.map((slot) => ({ ...slot, item: reference(slot.item) })) };
}

function compactRecipe(row) {
  return {
    key: row.Key,
    name: displayName(row.Key),
    output: reference(row.OutputItem),
    outputAmount: row.OutputItemAmount,
    workType: row.WorkType,
    buildings: cleanList(row.RecipeAvailableBuildings).map(reference),
    workload: row.CraftingWorkloadRequired,
    ingredients: cleanList(row.IngredientKeys).map((key, index) => ({ ...reference(key), amount: row.IngredientAmounts?.[index] ?? null })),
  };
}

const research = researchRows.map((row) => ({
  key: row.Key,
  name: displayName(row.Key),
  tier: row.GridX + 1,
  grid: { x: row.GridX, y: row.GridY },
  workload: row.RequiredWorkload,
  prerequisites: cleanList(row.Prerequisites).map(reference),
  requiredItems: cleanList(row.UnlockRequiredItem).map(reference),
  unlocks: cleanList(row.ResearchResult).map(reference),
}));

const snapshot = {
  schemaVersion: 1,
  game: index.game,
  build: index.build,
  steamBuildId: index.steam_buildid,
  extracted: index.extracted,
  source: {
    page: "https://dungeonsettlers.wiki/",
    researchPage: "https://dungeonsettlers.wiki/research",
    dataGuide: "https://dungeonsettlers.wiki/AGENTS.md",
    manifest: "https://dungeonsettlers.wiki/dbdata/index.json",
    method: "byte-exact parse of stock, unmodded game files (reviewed secondary source)",
    localDirectory: "research/game-data/DS_B.0.4.19",
    hashes,
  },
  counts: {
    research: research.length,
    items: itemRows.length,
    resources: itemRows.filter((row) => row.ItemTypeName === "Resource").length,
    units: unitRows.length,
    buildings: buildingRows.length,
    drops: dropRows.length,
    recipes: recipeRows.length,
    tradePools: tradePoolRows.length,
  },
  research,
  resources: itemRows.filter((row) => row.ItemTypeName === "Resource").map(compactItem),
  items: itemRows.map(compactItem),
  units: unitRows.map(compactUnit),
  buildings: buildingRows.map(compactBuilding),
  drops: dropRows.map(compactDrop),
  recipes: recipeRows.map(compactRecipe),
  tradePools: tradePoolRows.map((row) => ({
    key: row.Key,
    name: displayName(row.Key),
    traderGold: row.TraderGold,
    items: cleanList(row.AvailableItems).map((key, index) => ({ ...reference(key), min: row.MinAmounts?.[index] ?? null, max: row.MaxAmounts?.[index] ?? null })),
  })),
};

await mkdir(dirname(output), { recursive: true });
await writeFile(output, `// Generated by scripts/生成游戏资料快照.mjs from the version-locked source files.\nexport const gameDataSnapshot = ${JSON.stringify(snapshot, null, 2)} as const;\n`, "utf8");
console.log(`游戏资料快照已生成：${output}`);
console.log(JSON.stringify(snapshot.counts));
