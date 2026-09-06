import type { Metadata } from "next";
import Link from "next/link";
import { updates } from "../content";

export const metadata: Metadata = { title: "更新记录", description: "公开展示内容变化与受影响页面。" };
export default function UpdatesPage() { return <section className="page-shell"><p className="eyebrow">内容变化不靠猜</p><h1>更新记录</h1><p className="lead">每次来源、数据或结论发生变化，都可以在这里说明更新范围和需要复核的页面。</p><div className="update-list">{updates.map((update) => <article key={update.version}><div><span>{update.version}</span><time>{update.date}</time></div><p>{update.summary}</p><strong>受影响页面</strong><ul>{update.affectedRoutes.map((route) => <li key={route}><Link href={route}>{route}</Link></li>)}</ul></article>)}</div></section>; }
