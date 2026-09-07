"use client";

import { useMemo, useState } from "react";
import type { LibraryEntry } from "../content";
import { evidenceLabels } from "../content";
import { entityIconVisuals } from "./entity-icon-strip";

export function LibrarySearch({ entries }: { entries: LibraryEntry[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const categories = ["All", ...new Set(entries.map((entry) => entry.category))];
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return entries.filter((entry) => [entry.title, entry.summary, ...entry.tags].join(" ").toLowerCase().includes(term) && (category === "All" || entry.category === category));
  }, [category, entries, query]);

  return <section className="library-search" aria-label="Guide library search">
    <div className="search-controls">
      <label><span>Search guides</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Enter a topic, tag, or problem" /></label>
      <label><span>Filter by category</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
    </div>
    <p className="result-count">{filtered.length} guide{filtered.length === 1 ? "" : "s"} available</p>
    <div className="entry-grid">{filtered.map((entry) => {
      const icon = entityIconVisuals.find((item) => item.id === entry.iconAssetId) || entityIconVisuals[0];
      return <article className="entry-card" key={entry.slug}>
      <div className="entry-card-visual"><img src={icon.src} alt={icon.alt} width="112" height="112" /></div>
      <div className="entry-meta"><span>{entry.category}</span><span>{evidenceLabels[entry.evidence]}</span></div>
      <h2><a href={`/guides/${entry.slug}`}>{entry.title}</a></h2><p>{entry.summary}</p>
      <div className="tag-row">{entry.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
    </article>;
    })}</div>
  </section>;
}
