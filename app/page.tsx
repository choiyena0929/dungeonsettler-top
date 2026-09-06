import type { Metadata } from "next";
import Link from "next/link";
import { GameLoopDiagram } from "./components/game-loop-diagram";
import { guideEntries } from "./content";
import { JsonLd, itemListStructuredData } from "./structured-data";

export const metadata: Metadata = {
  title: "Dungeon Settlers beginner guide: start here",
  description: "Start with a source-bounded Dungeon Settlers beginner guide for the settlement, first expedition, Clay questions, and Research choices.",
};

const guideBySlug = (slug: string) => guideEntries.find((entry) => entry.slug === slug)!;

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
          <div className="actions"><Link className="button primary" href="/guides/beginner-guide">Start the Beginner Guide <span aria-hidden="true">↗</span></Link><a className="button" href="https://store.steampowered.com/app/2798330/Dungeon_Settlers/" rel="noreferrer">Check the official page</a></div>
          <div className="hero-meta"><span>Current frame: Early Access</span><span>Updated 06 Sep 2026</span></div>
        </div>
        <figure className="hero-visual"><img src="/game/dungeon-settlers-hero.svg" alt="An original editorial field-map illustration of a torchlit settlement preparing a four-person dungeon expedition." width="1200" height="760" /><figcaption>Settlement → route → dungeon / an original field-map illustration</figcaption></figure>
      </section>

      <section className="section start-section" aria-labelledby="start-heading">
        <div className="section-heading"><div><p className="eyebrow">Start here</p><h2 id="start-heading">Choose the problem you actually have.</h2></div><p className="section-intro">The first release stays narrow on purpose. Each page gives the short answer first, then marks what comes from an official page, what comes from a dated secondary report, and what is still unknown.</p></div>
        <div className="guide-grid">
          {[beginner, clay, research].map((entry, index) => <article className={`guide-card guide-card-${index + 1}`} key={entry.slug}><div className="card-topline"><span>0{index + 1}</span><span>{entry.label}</span></div><h3><Link href={`/guides/${entry.slug}`}>{entry.title}</Link></h3><p>{entry.summary}</p><Link className="text-link" href={`/guides/${entry.slug}`}>Read the route <span aria-hidden="true">→</span></Link></article>)}
        </div>
      </section>

      <section className="section loop-section"><GameLoopDiagram /></section>

      <section className="section confirmed-section" aria-labelledby="confirmed-heading">
        <div className="section-heading"><div><p className="eyebrow">What is confirmed right now</p><h2 id="confirmed-heading">Enough to start. Not enough to pretend the tree is fixed.</h2></div><p className="section-intro">The official store page establishes the broad loop. Dated update notes and a secondary Clay report add useful leads, but the site keeps their boundaries visible.</p></div>
        <div className="confirmed-grid">
          <article><span className="status-pill official">Official baseline</span><h3>Settlement to expedition is the core shape.</h3><p>Build and expand a settlement, manage expedition members, explore dungeons, gather resources, craft equipment, and research technologies. The store page also describes real-time action with pause, a party of up to four, and permadeath.</p></article>
          <article><span className="status-pill dated">Version-sensitive</span><h3>Updates can change how a guide reads.</h3><p>A Steam Community update dated September 5, 2026 mentions combat, save compatibility, research-tier display, and inventory guide changes. Recheck dated routes after an update.</p></article>
          <article><span className="status-pill pending">Still bounded</span><h3>Exact research order is not published here.</h3><p>The current public evidence does not prove a complete technology tree or universal best order. Guides use a safe checklist and mark unverified prerequisites as pending.</p></article>
        </div>
      </section>

      <section className="section editorial-section" aria-labelledby="editorial-heading">
        <div className="editorial-note"><p className="eyebrow">How to use this field guide</p><h2 id="editorial-heading">Make one decision, then make the next run observable.</h2><p>Dungeon Settlers is an Early Access game. That changes how a useful guide should behave. It should tell you what the current sources support, give you a route you can test, and leave a clean boundary around everything that still needs confirmation.</p><p>Use the Beginner Guide when the settlement and the first expedition feel disconnected. Use the Clay page when a material is blocking a current building or production question. Use the Research page when you need a way to decide without following an invented tech order.</p><p>For a first pass, read the short answer, write down the next action, and return to the source path when a dated detail affects your run. That small habit keeps a changing game readable without turning an old guide into a promise.</p><p>The site does not publish internal keyword metrics, guessed demand, or video details that could not be verified. The two YouTube references in the research pass were unavailable for analysis, so they are not used to manufacture steps or timestamps.</p></div>
        <aside className="source-card"><p className="eyebrow">Source path</p><h3>Start with the official game page.</h3><p>Then check dated community updates before trusting a quantity, floor, or interface detail.</p><a className="button small" href="https://store.steampowered.com/app/2798330/Dungeon_Settlers/" rel="noreferrer">Open Steam <span aria-hidden="true">↗</span></a><Link className="text-link" href="/updates">See guide updates <span aria-hidden="true">→</span></Link></aside>
      </section>
    </>
  );
}
