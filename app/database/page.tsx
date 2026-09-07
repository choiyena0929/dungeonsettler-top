import type { Metadata } from "next";
import { DatabaseBrowser } from "../components/database-browser";
import { EntityIconStrip } from "../components/entity-icon-strip";
import { gameDataSnapshot } from "../data/dungeon-settlers-db";
import { absoluteUrl } from "../site-config";

export const metadata: Metadata = {
  title: "Dungeon Settlers database | DS_B.0.4.19",
  description: "Browse the Dungeon Settlers database for the version-locked DS_B.0.4.19 Research, resources, items, units, buildings, drops and recipes.",
  alternates: { canonical: absoluteUrl("/database") },
};

export default function DatabasePage() {
  return (
    <div className="page-shell database-page">
      <a className="back-link" href="/">← Back to the Field Guide</a>
      <p className="eyebrow">Version-locked data / DS_B.0.4.19</p>
      <h1>Dungeon Settlers database reference</h1>
      <p className="lead">Browse the current-build Dungeon Settlers database behind the Research, Clay, settlement and expedition questions. This is a searchable reference snapshot with explicit source and version boundaries, not a promise that a future Early Access build will keep the same values.</p>
      <div className="page-actions"><a className="button primary" href="/guides/how-to-research">Read the Research guide <span aria-hidden="true">→</span></a><a className="button" href="/guides/how-to-get-clay">Check the Clay route</a><a className="button" href="/tools/first-expedition-planner">Plan a first run</a></div>
      <div className="database-source-card">
        <div><p className="eyebrow">Evidence boundary</p><h2>Stock game file extraction, dated {gameDataSnapshot.extracted}</h2><p>DungeonSettlers.wiki identifies this as a byte-exact parse of the unmodded game files for Steam build {gameDataSnapshot.steamBuildId}. It is a reviewed secondary source. Official Steam pages remain the authority for the game identity and patch notes; use the source links to audit the snapshot and recheck it after updates.</p><div className="database-source-links"><a href={gameDataSnapshot.source.page} rel="noreferrer">Source home ↗</a><a href={gameDataSnapshot.source.manifest} rel="noreferrer">Source manifest ↗</a><a href={gameDataSnapshot.source.dataGuide} rel="noreferrer">Data schema notes ↗</a><a href="https://steamcommunity.com/app/2798330/" rel="noreferrer">Official update path ↗</a></div></div>
        <EntityIconStrip compact assetIds={["dungeon-settlers-workstations-icon", "dungeon-settlers-storage-icon"]} />
      </div>
      <DatabaseBrowser />
      <section className="database-next" aria-labelledby="database-next-heading"><p className="eyebrow">Use the reference carefully</p><h2 id="database-next-heading">Turn a row into a checkable next action.</h2><p>For Research, copy the node, prerequisite and unlock into your current-build note. For Clay or another material, compare the item and drop rows with what you see in the game. If the screen and the snapshot disagree, record the difference and stop extending the claim until the source is refreshed.</p><div className="related-links"><a className="related-link" href="/guides/how-to-research"><small>Research</small><strong>Apply the safe checklist →</strong></a><a className="related-link" href="/guides/how-to-get-clay"><small>Materials</small><strong>Compare the Clay route →</strong></a></div></section>
    </div>
  );
}
