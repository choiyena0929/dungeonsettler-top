import { GameLoopDiagram } from "./game-loop-diagram";
import { EntityIconStrip } from "./entity-icon-strip";
import { evidenceLabels, getGuide, guideEntries, type GuideEntry } from "../content";
import { JsonLd, guideStructuredData } from "../structured-data";

const sourceLinks = [
  { label: "Official Steam store page", href: "https://store.steampowered.com/app/2798330/Dungeon_Settlers/" },
  { label: "Steam Community update path", href: "https://steamcommunity.com/app/2798330/" },
  { label: "Prima Games Clay report", href: "https://primagames.com/tips/how-to-get-clay-in-dungeon-settlers" },
  { label: "Official trailer reference", href: "https://www.youtube.com/watch?v=BkGIa5V39-w" },
  { label: "Recent review reference", href: "https://www.youtube.com/watch?v=FxqGcrey9S8" },
];

function relatedEntry(slug: string) {
  return getGuide(slug) || guideEntries[0];
}

const guideVisuals = {
  "beginner-guide": {
    src: "/game/official/settlement.jpg",
    alt: "Dungeon Settlers party and settlement preparation screen from an official Steam screenshot.",
    eyebrow: "Settlement to party",
    title: "Read the first route from the screen you actually have.",
    text: "The official screenshot shows the settlement toolbar, building categories, and a party ready to be considered together. Use the guide to turn that visible setup into one question for the next run.",
    assetIds: ["dungeon-settlers-party-portrait-03", "dungeon-settlers-workstations-icon"],
  },
  "how-to-get-clay": {
    src: "/game/official/dungeon.jpg",
    alt: "Dungeon Settlers party exploring a dungeon shrine from an official Steam screenshot.",
    eyebrow: "Expedition evidence",
    title: "Keep the material lead tied to a route.",
    text: "Clay evidence is dated and partial. This dungeon image is a real game context marker, not proof of a universal drop table; use the page to compare the currently reported paths and recheck them in your build.",
    assetIds: ["dungeon-settlers-party-portrait-04", "dungeon-settlers-storage-icon"],
  },
  "how-to-research": {
    src: "/game/official/hero.jpg",
    alt: "Dungeon Settlers settlement rooms and central portal from an official Steam screenshot.",
    eyebrow: "Settlement question",
    title: "Research starts with what the settlement needs next.",
    text: "The official store page confirms Research as part of the broader loop. The exact technology tree and best order remain bounded, so this page gives you a safe way to record the next question without inventing prerequisites.",
    assetIds: ["dungeon-settlers-party-portrait-02", "dungeon-settlers-workstations-icon"],
  },
} as const;

export function GuidePage({ entry }: { entry: GuideEntry }) {
  return (
    <article className="article-shell">
      <JsonLd value={guideStructuredData(entry)} />
      <div className="article-header">
        <a className="back-link" href="/">← Back to the Field Guide</a>
        <p className="eyebrow">{entry.category} / {evidenceLabels[entry.evidence]} / updated {entry.updatedAt}</p>
        <h1>{entry.title}</h1>
        <p className="lead">{entry.description}</p>
        <div className="tag-row"><span>{entry.label}</span><span>Early Access</span><span>Dated guide</span></div>
        <div className="article-actions"><a className="button primary" href={entry.slug === "how-to-research" ? "#research-checklist" : "#quick-answer"}>{entry.slug === "beginner-guide" ? "Follow the first expedition route" : entry.slug === "how-to-get-clay" ? "Compare the current Clay routes" : "Use the safe research checklist"} <span aria-hidden="true">↓</span></a><a className="button" href="/">Choose another problem</a></div>
      </div>
      <div className="article-visual-band">
        <figure className="article-visual-image"><img src={guideVisuals[entry.slug as keyof typeof guideVisuals].src} alt={guideVisuals[entry.slug as keyof typeof guideVisuals].alt} width="1920" height="1080" /><figcaption>Traceable game screenshot / official Steam source</figcaption></figure>
        <div className="article-visual-copy">
          <p className="eyebrow">{guideVisuals[entry.slug as keyof typeof guideVisuals].eyebrow}</p>
          <h2>{guideVisuals[entry.slug as keyof typeof guideVisuals].title}</h2>
          <p>{guideVisuals[entry.slug as keyof typeof guideVisuals].text}</p>
          <EntityIconStrip compact assetIds={guideVisuals[entry.slug as keyof typeof guideVisuals].assetIds} />
        </div>
      </div>
      <div className="article-body">
        {entry.sections.map((section, index) => (
          <section className="article-section" id={index === 0 ? "quick-answer" : entry.slug === "how-to-research" && section.heading === "A safe early checklist" ? "research-checklist" : undefined} key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
            {entry.slug === "how-to-research" && section.heading === "How it fits the expedition loop" ? <GameLoopDiagram /> : null}
          </section>
        ))}
        <section className="planner-bridge" aria-labelledby="planner-bridge-heading">
          <div><p className="eyebrow">Next run</p><h2 id="planner-bridge-heading">Carry this question into a repeatable checklist.</h2><p>The first expedition planner keeps the next purpose, preparation, and return observation together. Run it again when the current build or your goal changes.</p></div>
          <a className="button primary" href="/tools/first-expedition-planner">Open the planner <span aria-hidden="true">→</span></a>
        </section>
        <aside className="guide-callout"><strong>Reading boundary.</strong> This guide keeps official system facts, dated reports, and open questions separate. If your current build disagrees with a dated observation, record the difference and check the official update path before extending the claim.</aside>
        <section className="article-sources" aria-labelledby="sources-heading">
          <p className="eyebrow">Evidence path</p>
          <h2 id="sources-heading">Sources and limits</h2>
          <p>Start with the official game and update pages. Treat secondary guides as dated leads, and verify exact routes or quantities in the current build.</p>
          <ul>{sourceLinks.map((source) => <li key={source.href}><a href={source.href} rel="noreferrer">{source.label} ↗</a></li>)}</ul>
        </section>
        <section className="related-section" aria-labelledby="related-heading">
          <p className="eyebrow">Keep going</p>
          <h2 id="related-heading">Related routes</h2>
          <div className="related-links">{entry.related.map((slug) => { const related = relatedEntry(slug); return <a className="related-link" href={`/guides/${related.slug}`} key={related.slug}><small>{related.label}</small><strong>{related.title}</strong></a>; })}</div>
        </section>
      </div>
    </article>
  );
}
