import Link from "next/link";
import { GameLoopDiagram } from "./game-loop-diagram";
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

export function GuidePage({ entry }: { entry: GuideEntry }) {
  return (
    <article className="article-shell">
      <JsonLd value={guideStructuredData(entry)} />
      <div className="article-header">
        <Link className="back-link" href="/">← Back to the Field Guide</Link>
        <p className="eyebrow">{entry.category} / {evidenceLabels[entry.evidence]} / updated {entry.updatedAt}</p>
        <h1>{entry.title}</h1>
        <p className="lead">{entry.description}</p>
        <div className="tag-row"><span>{entry.label}</span><span>Early Access</span><span>Source-bounded</span></div>
        <div className="article-actions"><Link className="button primary" href="#quick-answer">{entry.slug === "beginner-guide" ? "Follow the first expedition route" : entry.slug === "how-to-get-clay" ? "Compare the current Clay routes" : "Use the safe research checklist"} <span aria-hidden="true">↓</span></Link><Link className="button" href="/">Choose another problem</Link></div>
      </div>
      <div className="article-body">
        {entry.sections.map((section, index) => (
          <section className="article-section" id={index === 0 ? "quick-answer" : undefined} key={section.heading}>
            <h2>{section.heading}</h2>
            {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets ? <ul>{section.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul> : null}
            {entry.slug === "how-to-research" && index === 2 ? <GameLoopDiagram /> : null}
          </section>
        ))}
        <aside className="guide-callout"><strong>Reading boundary.</strong> This guide keeps official system facts, dated reports, and open questions separate. If your current build disagrees with a dated observation, record the difference and check the official update path before extending the claim.</aside>
        <section className="article-sources" aria-labelledby="sources-heading">
          <p className="eyebrow">Evidence path</p>
          <h2 id="sources-heading">Sources and limits</h2>
          <p>The official pages are the baseline. Secondary pages are leads that need a current-build check. The YouTube references were attempted for this launch but were unavailable for verified analysis, so they are listed as references only and do not supply steps, timestamps, or opinions in this article.</p>
          <ul>{sourceLinks.map((source) => <li key={source.href}><a href={source.href} rel="noreferrer">{source.label} ↗</a></li>)}</ul>
        </section>
        <section className="related-section" aria-labelledby="related-heading">
          <p className="eyebrow">Keep going</p>
          <h2 id="related-heading">Related routes</h2>
          <div className="related-links">{entry.related.map((slug) => { const related = relatedEntry(slug); return <Link className="related-link" href={`/guides/${related.slug}`} key={related.slug}><small>{related.label}</small><strong>{related.title}</strong></Link>; })}</div>
        </section>
      </div>
    </article>
  );
}
