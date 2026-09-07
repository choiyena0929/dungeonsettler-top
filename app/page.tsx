import type { Metadata } from "next";
import { EntityIconStrip } from "./components/entity-icon-strip";
import { GameLoopDiagram } from "./components/game-loop-diagram";
import { guideEntries } from "./content";
import { JsonLd, itemListStructuredData } from "./structured-data";

export const metadata: Metadata = {
  title: "Dungeon Settlers beginner guide: start here",
  description: "Start with a practical Dungeon Settlers beginner guide for the settlement, first expedition, Clay questions, and Research choices.",
};

const guideBySlug = (slug: string) => guideEntries.find((entry) => entry.slug === slug)!;
const guideVisuals = [
  { src: "/game/official/settlement.jpg", alt: "Dungeon Settlers party and settlement preparation screen." },
  { src: "/game/official/dungeon.jpg", alt: "Dungeon Settlers party exploring a dungeon shrine." },
  { src: "/game/official/hero.jpg", alt: "Dungeon Settlers settlement rooms and central portal." },
];

export default function Home() {
  const beginner = guideBySlug("beginner-guide");
  const clay = guideBySlug("how-to-get-clay");
  const research = guideBySlug("how-to-research");
  const listEntries = guideEntries.map((entry) => ({ slug: entry.slug, title: entry.title, summary: entry.summary, category: entry.category, tags: [], evidence: entry.evidence, updatedAt: entry.updatedAt, body: [] }));
  return (
    <>
      <JsonLd value={itemListStructuredData(listEntries)} />
      <section className="hero home-hero">
        <div className="hero-copy">
          <p className="eyebrow">Dungeon Settlers / Early Access field notes</p>
          <h1>Dungeon Settlers beginner guide, built around the next decision.</h1>
          <p className="hero-lead">A practical starting point for the settlement, the first dungeon route, Clay questions, and Research choices that need a little more evidence.</p>
          <div className="actions"><a className="button primary" href="/tools/first-expedition-planner">Build a first expedition plan <span aria-hidden="true">↗</span></a><a className="button" href="/guides/beginner-guide">Start the Beginner Guide</a></div>
          <div className="hero-meta"><span>Current frame: Early Access</span><span>Updated 06 Sep 2026</span></div>
        </div>
        <figure className="hero-visual"><img src="/game/official/hero.jpg" alt="Dungeon Settlers settlement with rooms, work areas, crops, and a central portal." width="1920" height="1080" /><figcaption>Settlement planning / official Dungeon Settlers screenshot from Steam</figcaption></figure>
      </section>

      <section className="section start-section" aria-labelledby="start-heading">
        <div className="section-heading"><div><p className="eyebrow">Start here</p><h2 id="start-heading">Choose the problem you actually have.</h2></div><p className="section-intro">The first release stays narrow on purpose. Each page gives the short answer first, then marks what comes from an official page, what comes from a dated secondary report, and what is still unknown.</p></div>
        <div className="guide-grid">
          {[beginner, clay, research].map((entry, index) => <article className={`guide-card guide-card-${index + 1}`} key={entry.slug}><div className="card-topline"><span className="card-identity"><img src={guideVisuals[index].src} alt={guideVisuals[index].alt} width="64" height="64" /><small>0{index + 1}</small></span><span>{entry.label}</span></div><h3><a href={`/guides/${entry.slug}`}>{entry.title}</a></h3><p>{entry.summary}</p><a className="text-link" href={`/guides/${entry.slug}`}>Read the route <span aria-hidden="true">→</span></a></article>)}
        </div>
      </section>

      <section className="section planner-section" aria-labelledby="planner-section-heading">
        <div className="planner-section-copy">
          <p className="eyebrow">A repeatable first step</p>
          <h2 id="planner-section-heading">Turn the next run into a visible plan.</h2>
          <p>Choose the question you want the expedition to answer, check the preparation you can see, and get the related route. The planner stays useful after a failed run because it is easy to clear and run again.</p>
          <a className="button primary" href="/tools/first-expedition-planner">Open the first expedition planner <span aria-hidden="true">→</span></a>
        </div>
        <div className="planner-preview">
          <div className="planner-preview-route"><span>Settlement</span><span aria-hidden="true">→</span><span>Research question</span><span aria-hidden="true">→</span><span>Party</span><span aria-hidden="true">→</span><span>Return with an observation</span></div>
          <EntityIconStrip compact />
        </div>
      </section>

      <section className="section loop-section"><GameLoopDiagram /></section>

      <section className="section trailer-section" aria-labelledby="trailer-heading">
        <a className="trailer-card" href="https://www.youtube.com/watch?v=BkGIa5V39-w" target="_blank" rel="noreferrer">
          <figure className="trailer-visual"><img src="/game/official/youtube-trailer.jpg" alt="Dungeon Settlers official gameplay trailer thumbnail from CanOpener." width="480" height="360" /><span className="trailer-play" aria-hidden="true">▶</span></figure>
          <div><p className="eyebrow">Official video / CanOpener</p><h2 id="trailer-heading">Watch the official gameplay trailer.</h2><p>See the game&apos;s settlement building, party preparation, and dungeon exploration before choosing a guide.</p><span className="text-link">Open on YouTube <span aria-hidden="true">↗</span></span></div>
        </a>
      </section>

      <section className="section confirmed-section" aria-labelledby="confirmed-heading">
        <div className="section-heading"><div><p className="eyebrow">What is confirmed right now</p><h2 id="confirmed-heading">Enough to start. Not enough to pretend the tree is fixed.</h2></div><p className="section-intro">The official store page establishes the broad loop. Dated update notes and a secondary Clay report add useful leads, but the site keeps their boundaries visible.</p></div>
        <div className="confirmed-grid">
          <article><span className="status-pill official">Official baseline</span><h3>Settlement to expedition is the core shape.</h3><p>Build and expand a settlement, manage expedition members, explore dungeons, gather resources, craft equipment, and research technologies. The store page also describes real-time action with pause, a party of up to four, and permadeath.</p></article>
          <article><span className="status-pill dated">Version-sensitive</span><h3>Updates can change how a guide reads.</h3><p>A Steam Community update dated September 5, 2026 mentions combat, save compatibility, research-tier display, and inventory guide changes. Recheck dated routes after an update.</p></article>
          <article><span className="status-pill pending">Still bounded</span><h3>Exact research order is not published here.</h3><p>The current public evidence does not prove a complete technology tree or universal best order. Guides use a safe checklist and mark unverified prerequisites as pending.</p></article>
        </div>
      </section>

      <section className="section editorial-section" aria-labelledby="editorial-heading">
        <div className="editorial-note"><p className="eyebrow">How to use this field guide</p><h2 id="editorial-heading">Make one decision, then make the next run observable.</h2><p>Dungeon Settlers is an Early Access game. Start with a route you can test, and recheck dated details after major updates.</p><p>Use the Beginner Guide when the settlement and the first expedition feel disconnected. Use the Clay page when a material is blocking a current building or production question. Use the Research page when you need a way to decide without following an invented tech order.</p><p>Before leaving the settlement, check the party, the resource target, and the reason for the expedition. A run for materials needs a different stopping point from a run for map knowledge. Keeping that purpose visible makes it easier to decide when to return, what to change, and which guide to open next.</p><p>For a first pass, read the short answer, write down the next action, and return to the official update path when a dated detail affects your run.</p></div>
        <aside className="source-card"><p className="eyebrow">Source path</p><h3>Start with the official game page.</h3><p>Then check dated community updates before trusting a quantity, floor, or interface detail.</p><a className="button small" href="https://store.steampowered.com/app/2798330/Dungeon_Settlers/" rel="noreferrer">Open Steam <span aria-hidden="true">↗</span></a><a className="text-link" href="/updates">See guide updates <span aria-hidden="true">→</span></a></aside>
      </section>
    </>
  );
}
