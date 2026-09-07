"use client";

import { useEffect, useMemo, useState } from "react";
import { gameDataSnapshot } from "../data/dungeon-settlers-db";

type Reference = { key: string; name: string; kind: string };
type BaseRow = { key: string; name: string; [field: string]: unknown };
type CategoryId = "research" | "resources" | "items" | "units" | "buildings" | "drops" | "recipes" | "tradePools";

const categoryMeta: Array<{ id: CategoryId; label: string; description: string }> = [
  { id: "research", label: "Research", description: "Nodes, tiers, workload, prerequisites and unlock references" },
  { id: "resources", label: "Resources", description: "Every item row marked Resource in the source ItemTable" },
  { id: "items", label: "Items", description: "Equipment, consumables and materials with current-build fields" },
  { id: "units", label: "Units and enemies", description: "Player units, NPCs and monsters with stats and drop refs" },
  { id: "buildings", label: "Buildings", description: "Construction, housing, storage and gathering rows" },
  { id: "drops", label: "Drop pools", description: "Three-slot loot pools with source percentages and amounts" },
  { id: "recipes", label: "Recipes", description: "Outputs, ingredients, workstations and workload" },
  { id: "tradePools", label: "Trade pools", description: "Merchant inventory ranges from the current build" },
];

const datasets: Record<CategoryId, readonly BaseRow[]> = {
  research: gameDataSnapshot.research as readonly BaseRow[],
  resources: gameDataSnapshot.resources as readonly BaseRow[],
  items: gameDataSnapshot.items as readonly BaseRow[],
  units: gameDataSnapshot.units as readonly BaseRow[],
  buildings: gameDataSnapshot.buildings as readonly BaseRow[],
  drops: gameDataSnapshot.drops as readonly BaseRow[],
  recipes: gameDataSnapshot.recipes as readonly BaseRow[],
  tradePools: gameDataSnapshot.tradePools as readonly BaseRow[],
};

const statusText = (value: unknown) => value === null || value === undefined || value === "" ? "—" : String(value);
const referencesText = (value: unknown) => Array.isArray(value) && value.length ? value.map((item) => typeof item === "object" && item && "name" in item ? String(item.name) : String(item)).join(", ") : "None listed";
const refWithAmountText = (value: unknown) => Array.isArray(value) && value.length ? value.map((item) => {
  if (!item || typeof item !== "object") return String(item);
  const ref = item as { name?: unknown; amount?: unknown; min?: unknown; max?: unknown };
  const amount = ref.amount !== undefined ? ` ×${String(ref.amount)}` : ref.min !== undefined ? ` (${String(ref.min)}–${String(ref.max)})` : "";
  return `${String(ref.name ?? "Unknown")}${amount}`;
}).join(", ") : "None listed";

function fieldsFor(category: CategoryId, row: BaseRow) {
  if (category === "research") return [
    ["Tier", row.tier], ["Workload", row.workload], ["Prerequisites", referencesText(row.prerequisites)], ["Required item", referencesText(row.requiredItems)], ["Unlocks", referencesText(row.unlocks)],
  ];
  if (category === "resources" || category === "items") return [
    ["Type", row.type], ["Subtype", row.subtype], ["Rarity", row.rarity], ["Weight", row.weight], ["Max stack", row.maxStack], ["Standard price", row.price], ["Durability", row.durability], ["Repair requires", referencesText(row.requiredRepair)],
  ];
  if (category === "units") return [
    ["Faction", row.faction], ["Subtype", row.subtype], ["Behaviour", row.behavior], ["Health", row.health], ["Physical attack", row.physicalAttack], ["Magic attack", row.magicAttack], ["Drops", referencesText(row.drops)],
  ];
  if (category === "buildings") return [
    ["Type", row.type], ["Subtype", row.subtype], ["Category", row.category], ["Housing", row.housing], ["Storage capacity", row.storageCapacity], ["Construction workload", row.constructionWorkload], ["Construction items", referencesText(row.constructionItems)], ["Unlock items", referencesText(row.unlockItems)], ["Gathering", referencesText(row.gathers)],
  ];
  if (category === "drops") return [["Slots", Array.isArray(row.slots) && row.slots.length ? row.slots.map((slot) => {
    if (!slot || typeof slot !== "object") return String(slot);
    const item = slot as { item?: Reference; amount?: unknown; percentage?: unknown };
    return `${item.item?.name ?? "Unknown"} ×${statusText(item.amount)} (${statusText(item.percentage)})`;
  }).join("; ") : "None listed"]];
  if (category === "recipes") return [
    ["Output", `${(row.output as Reference | undefined)?.name ?? "Unknown"} ×${statusText(row.outputAmount)}`], ["Work type", row.workType], ["Workload", row.workload], ["Buildings", refWithAmountText(row.buildings)], ["Ingredients", refWithAmountText(row.ingredients)],
  ];
  return [["Trader gold", row.traderGold], ["Items", refWithAmountText(row.items)]];
}

function countFor(category: CategoryId) {
  return gameDataSnapshot.counts[category];
}

export function DatabaseBrowser() {
  const [category, setCategory] = useState<CategoryId>("research");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get("tab") as CategoryId | null;
      const search = params.get("q");
      if (tab && categoryMeta.some((item) => item.id === tab)) setCategory(tab);
      if (search) setQuery(search);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const rows = datasets[category];
  const normalizedQuery = query.trim().toLowerCase();
  const filtered = useMemo(() => normalizedQuery ? rows.filter((row) => JSON.stringify(row).toLowerCase().includes(normalizedQuery)) : [...rows], [normalizedQuery, rows]);
  const pageSize = 30;
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const activeMeta = categoryMeta.find((item) => item.id === category) || categoryMeta[0];

  return (
    <section className="database-browser" aria-labelledby="database-browser-heading">
      <div className="database-controls">
        <div className="database-tabs" role="tablist" aria-label="Database categories">
          {categoryMeta.map((item) => <button className={`database-tab${category === item.id ? " is-active" : ""}`} key={item.id} type="button" role="tab" aria-selected={category === item.id} onClick={() => { setCategory(item.id); setPage(1); }}>{item.label}<span>{countFor(item.id)}</span></button>)}
        </div>
        <label className="database-search">Filter the current table
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} placeholder="Search names, keys, prerequisites..." />
        </label>
      </div>
      <div className="database-heading-row">
        <div><p className="eyebrow">{activeMeta.label} / {countFor(category)} rows</p><h2 id="database-browser-heading">{activeMeta.description}</h2></div>
        <p className="database-result-count">{filtered.length ? `${(currentPage - 1) * pageSize + 1}–${Math.min(currentPage * pageSize, filtered.length)} of ${filtered.length}` : "No matching rows"}</p>
      </div>
      <div className="database-results">
        {visibleRows.map((row) => <article className="database-row" key={row.key}>
          <div className="database-row-title"><h3>{row.name}</h3><code>{row.key}</code></div>
          <dl>{fieldsFor(category, row).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{statusText(value)}</dd></div>)}</dl>
        </article>)}
      </div>
      <div className="database-pagination" aria-label="Database pagination">
        <button className="button small" type="button" disabled={currentPage <= 1} onClick={() => setPage((value) => Math.max(1, value - 1))}>Previous</button>
        <span>Page {currentPage} / {pageCount}</span>
        <button className="button small" type="button" disabled={currentPage >= pageCount} onClick={() => setPage((value) => Math.min(pageCount, value + 1))}>Next</button>
      </div>
    </section>
  );
}
