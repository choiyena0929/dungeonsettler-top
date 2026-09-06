"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { LibraryEntry } from "../content";
import { evidenceLabels } from "../content";

export function LibrarySearch({ entries }: { entries: LibraryEntry[] }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const categories = ["全部", ...new Set(entries.map((entry) => entry.category))];
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return entries.filter((entry) => [entry.title, entry.summary, ...entry.tags].join(" ").toLowerCase().includes(term) && (category === "全部" || entry.category === category));
  }, [category, entries, query]);

  return <section className="library-search" aria-label="知识库检索">
    <div className="search-controls">
      <label><span>搜索知识库</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="输入主题、标签或问题" /></label>
      <label><span>按分类筛选</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((item) => <option key={item}>{item}</option>)}</select></label>
    </div>
    <p className="result-count">找到 {filtered.length} 条可用内容</p>
    <div className="entry-grid">{filtered.map((entry) => <article className="entry-card" key={entry.slug}>
      <div className="entry-meta"><span>{entry.category}</span><span>{evidenceLabels[entry.evidence]}</span></div>
      <h2><Link href={`/library/${entry.slug}`}>{entry.title}</Link></h2><p>{entry.summary}</p>
      <div className="tag-row">{entry.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div>
    </article>)}</div>
  </section>;
}
