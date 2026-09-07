import { gameDataSnapshot } from "../data/dungeon-settlers-db";

function names(items: readonly { name: string }[]) {
  return items.length ? items.map((item) => item.name).join(", ") : "None listed";
}

export function ResearchTree() {
  const rows = [...gameDataSnapshot.research].sort((a, b) => a.tier - b.tier || a.grid.y - b.grid.y || a.grid.x - b.grid.x);
  return (
    <section className="research-tree" aria-labelledby="research-tree-heading">
      <div className="research-tree-heading">
        <p className="eyebrow">Version-locked reference</p>
        <h2 id="research-tree-heading">The complete Research table for DS_B.0.4.19</h2>
        <p>This table is a reviewed secondary extraction from the stock game files, captured on {gameDataSnapshot.extracted} for Steam build {gameDataSnapshot.steamBuildId}. It exposes the current rows, prerequisites, Tech Book requirement, workload, and unlocks; it does not turn an old build into a permanent best order.</p>
        <p><a className="text-link" href={gameDataSnapshot.source.researchPage} rel="noreferrer">Open the source Research table ↗</a> <a className="text-link" href="/database?tab=research">Browse the local data index →</a></p>
      </div>
      <div className="research-tree-list">
        {rows.map((row) => (
          <details className="research-node" key={row.key} open={row.tier <= 2}>
            <summary>
              <span className="research-node-tier">Tier {row.tier}</span>
              <span className="research-node-title"><strong>{row.name}</strong><small>{row.workload.toLocaleString()} workload · {row.unlocks.length} unlocks</small></span>
              <span className="research-node-key">{row.key}</span>
            </summary>
            <div className="research-node-body">
              <dl>
                <div><dt>Prerequisites</dt><dd>{names(row.prerequisites)}</dd></div>
                <div><dt>Required item</dt><dd>{names(row.requiredItems)}</dd></div>
                <div><dt>Unlocks</dt><dd>{names(row.unlocks)}</dd></div>
                <div><dt>Grid position</dt><dd>Column {row.grid.x + 1}, row {row.grid.y}</dd></div>
              </dl>
            </div>
          </details>
        ))}
      </div>
      <p className="research-tree-note">The extraction gives a complete snapshot for this build. Difficulty scaling, future patches, and an in-game display that disagrees with the snapshot still require a fresh check.</p>
    </section>
  );
}
