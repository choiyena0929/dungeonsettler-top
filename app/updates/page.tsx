import type { Metadata } from "next";
import { updates } from "../content";
import { absoluteUrl } from "../site-config";

export const metadata: Metadata = {
  title: "Dungeon Settlers guide updates | v0.4.23",
  description: "Track Dungeon Settlers guide updates, the official v0.4.23 boundary, dated balance announcements, and the guide pages that need a recheck.",
  alternates: { canonical: absoluteUrl("/updates") },
};

export default function UpdatesPage() {
  return (
    <section className="page-shell">
      <a className="back-link" href="/">← Back to the Field Guide</a>
      <p className="eyebrow">Dated changes / current boundary v0.4.23</p>
      <h1>Dungeon Settlers guide updates</h1>
      <p className="lead">Dungeon Settlers guide updates record meaningful changes to guide sources, conclusions, and affected routes as the Early Access build develops. The current numbered boundary is v0.4.23; the later Archer and Tokyo announcements are recorded separately because neither creates a newer numbered build.</p>
      <div className="page-actions"><a className="button primary" href="/tools/first-expedition-planner">Recheck a first run <span aria-hidden="true">→</span></a></div>
      <div className="update-list">
        {updates.map((update) => (
          <article key={update.version}>
            <div><span>{update.version}</span><time>{update.date}</time></div>
            <p>{update.summary}</p>
            <strong>Affected pages</strong>
            <ul>{update.affectedRoutes.map((route) => <li key={route}><a href={route}>{route}</a></li>)}</ul>
            <a className="text-link" href={update.sourceHref} rel={update.sourceHref.startsWith("http") ? "noreferrer" : undefined}>Read the source path <span aria-hidden="true">↗</span></a>
          </article>
        ))}
      </div>
      <div className="hub-note">
        <h2>How to read this record.</h2>
        <p>The Field Guide is intentionally dated. Dungeon Settlers is in Early Access, so the same interface, combat behavior, research display, or save expectation can change between builds. This page records the public revision we have actually made; it does not manufacture a complete developer changelog.</p>
        <p>The official v0.4.23 note is the current numbered boundary. It raises the maximum expedition size to 6 members at Rank 2 and 8 at Rank 3, disables Auto Use by default for skills that can damage allies, reduces Active Skill Energy on Normal and Easy, briefly reveals an enemy tile attacked from outside vision, and changes Research Work Amount to 1.15× on Very Hard and 1.30× on Devastation. The page only carries these verified facts into the affected routes.</p>
        <p>The Archer Balance Reverted announcement changes the listed Rapid Fire, Arrow Rain, Sniping Shot, and Sharp Shooter values after v0.4.23 feedback. It is a balance correction rather than a new version. The latest dated Tokyo Game Show announcement is event-only and does not establish a gameplay change.</p>
        <p>The full Research database remains a DS_B.0.4.19 reviewed snapshot. It is useful for auditability, but it is not silently upgraded to v0.4.23. If the current game disagrees with a row, record the difference and keep the newer value pending until a traceable re-extraction supports it.</p>
        <p>The earlier v0.4.19 note still matters for high-difficulty drop handling and item weight, including Clay, while the v0.4.17 note records a Research-tier display correction. Those historical facts are reasons to recheck the interface and preparation context, not evidence of a fixed Clay route or universal Research order.</p>
        <p>After reading an update, return to the <a href="/tools/first-expedition-planner">first expedition planner</a> and rebuild the question you want to test. The <a href="/library">guide library</a> keeps the affected pages searchable. Future Research behavior, universal best order, and values outside the DS_B.0.4.19 snapshot stay pending until a traceable source supports them.</p>
        <p>A dated note is useful only when it changes what a visitor should do. The current revision therefore records the affected routes next to the source boundary, keeps the old page URLs stable, and points the next action back to a real checklist. If evidence changes without enough detail to support a new conclusion, the page remains a warning to recheck rather than a new guide claim.</p>
        <p>The page is a small operational record for visitors, not an internal status dashboard. It names only public source paths and page effects, so a reader can decide what to reopen without seeing search metrics, collection logs, or release machinery.</p>
        <p>Use the affected route list as a review queue, and verify the listed route in your own current build before reusing a detail.</p>
      </div>
    </section>
  );
}
