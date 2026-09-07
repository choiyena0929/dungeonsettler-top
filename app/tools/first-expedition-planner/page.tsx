import type { Metadata } from "next";
import { EntityIconStrip } from "../../components/entity-icon-strip";
import { ExpeditionPlanner } from "../../components/expedition-planner";
import { JsonLd, toolStructuredData } from "../../structured-data";
import { absoluteUrl } from "../../site-config";

export const metadata: Metadata = {
  title: "Dungeon Settlers expedition planner | First run",
  description: "Use a Dungeon Settlers expedition planner to turn the settlement, Research, party, and first dungeon question into a clear Early Access checklist.",
  alternates: { canonical: absoluteUrl("/tools/first-expedition-planner") },
};

export default function FirstExpeditionPlannerPage() {
  return (
    <section className="tool-shell">
      <JsonLd value={toolStructuredData()} />
      <div className="tool-header">
        <a className="back-link" href="/">← Back to the Field Guide</a>
        <p className="eyebrow">Decision tool / first expedition</p>
        <h1>Dungeon Settlers expedition planner: build a first-run checklist.</h1>
        <p className="lead">Use this Dungeon Settlers expedition planner when the settlement, the party, and the next dungeon question are pulling in different directions. It turns the next run into a short list you can observe and review.</p>
        <div className="tool-header-actions"><a className="button primary" href="#planner-form">Start planning <span aria-hidden="true">↓</span></a></div>
        <div className="tag-row"><span>Session tool</span><span>Early Access</span><span>Updated 07 Sep 2026</span></div>
      </div>

      <div className="tool-layout">
        <ExpeditionPlanner />
        <aside className="tool-context">
          <figure className="tool-context-visual"><img src="/game/official/settlement.jpg" alt="Dungeon Settlers settlement preparation screen from an official Steam screenshot." width="1920" height="1080" /><figcaption>Settlement preparation / official Steam screenshot</figcaption></figure>
          <p className="eyebrow">Why this route exists</p>
          <h2>Keep the loop visible.</h2>
          <p>The official store page describes a settlement-to-dungeon loop with building, gathering, crafting, research, party preparation, and real-time combat with pause. The planner stays at that evidence level.</p>
          <p>It does not fill in hidden values. If the current build shows a different prerequisite, quantity, or route, keep that observation separate and check the dated update path.</p>
          <EntityIconStrip compact />
          <div className="tool-route-links"><a className="text-link" href="/guides/beginner-guide">Need the first route? Read Beginner <span aria-hidden="true">→</span></a><a className="text-link" href="/updates">Check dated guide updates <span aria-hidden="true">→</span></a></div>
        </aside>
      </div>

      <section className="tool-notes" aria-labelledby="planner-notes-heading">
        <p className="eyebrow">Use the result in play</p>
        <h2 id="planner-notes-heading">A small plan is useful when it can be checked.</h2>
        <p>Start with the question that is blocking the next decision. If the settlement is missing a visible preparation step, write that down before asking the party to solve a dungeon problem. If the party is ready but the purpose is unclear, select one observation that would make the return meaningful.</p>
        <p>The result page gives you a related guide instead of pretending that one checklist answers every build. Beginner covers the first route, Clay covers a dated material lead, and Research explains how to hold an unknown technology order at the right boundary.</p>
        <p>Run the planner again after an update or after a failed expedition. The page does not save a profile or compare runs yet. That limitation is part of the current migration slice and remains visible until a stronger data source supports a larger tool.</p>
      </section>
    </section>
  );
}
