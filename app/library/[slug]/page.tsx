import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { evidenceLabels, libraryEntries } from "../../content";

export function generateStaticParams() { return libraryEntries.map((entry) => ({ slug: entry.slug })); }
export function generateMetadata({ params }: { params: { slug: string } }): Metadata { const entry = libraryEntries.find((item) => item.slug === params.slug); return entry ? { title: entry.title, description: entry.summary } : {}; }
export default function LibraryDetail({ params }: { params: { slug: string } }) { const entry = libraryEntries.find((item) => item.slug === params.slug); if (!entry) notFound(); return <article className="article-shell"><a className="back-link" href="/library">← Back to the guide library</a><p className="eyebrow">{entry.category} · {evidenceLabels[entry.evidence]}</p><h1>{entry.title}</h1><p className="lead">{entry.summary}</p><div className="tag-row">{entry.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div><div className="article-body">{entry.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><aside className="review-note"><strong>Guide review details</strong><span>Last updated: {entry.updatedAt}</span><span>Evidence level: {evidenceLabels[entry.evidence]}</span></aside></article>; }
