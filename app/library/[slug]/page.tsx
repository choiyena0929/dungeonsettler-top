import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { evidenceLabels, libraryEntries } from "../../content";

export function generateStaticParams() { return libraryEntries.map((entry) => ({ slug: entry.slug })); }
export function generateMetadata({ params }: { params: { slug: string } }): Metadata { const entry = libraryEntries.find((item) => item.slug === params.slug); return entry ? { title: entry.title, description: entry.summary } : {}; }
export default function LibraryDetail({ params }: { params: { slug: string } }) { const entry = libraryEntries.find((item) => item.slug === params.slug); if (!entry) notFound(); return <article className="article-shell"><Link className="back-link" href="/library">← 返回知识库</Link><p className="eyebrow">{entry.category} · {evidenceLabels[entry.evidence]}</p><h1>{entry.title}</h1><p className="lead">{entry.summary}</p><div className="tag-row">{entry.tags.map((tag) => <span key={tag}>#{tag}</span>)}</div><div className="article-body">{entry.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><aside className="review-note"><strong>内容复核信息</strong><span>最近更新：{entry.updatedAt}</span><span>证据等级：{evidenceLabels[entry.evidence]}</span></aside></article>; }
