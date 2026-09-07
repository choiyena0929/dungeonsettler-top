import type { Metadata } from "next";
import { updates } from "../content";

export const metadata: Metadata = { title: "Guide updates", description: "Track public guide changes and the pages affected by them." };
export default function UpdatesPage() { return <section className="page-shell"><p className="eyebrow">Dated changes</p><h1>Guide updates</h1><p className="lead">This page records meaningful changes to guide sources, conclusions, and affected routes as the Early Access build develops.</p><div className="update-list">{updates.map((update) => <article key={update.version}><div><span>{update.version}</span><time>{update.date}</time></div><p>{update.summary}</p><strong>Affected pages</strong><ul>{update.affectedRoutes.map((route) => <li key={route}><a href={route}>{route}</a></li>)}</ul></article>)}</div></section>; }
