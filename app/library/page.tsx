import type { Metadata } from "next";
import { libraryEntries } from "../content";
import { LibrarySearch } from "../components/library-search";
import { JsonLd, itemListStructuredData } from "../structured-data";

export const metadata: Metadata = { title: "知识库", description: "可搜索、可筛选的结构化内容目录。" };
export default function LibraryPage() { return <section className="page-shell"><JsonLd value={itemListStructuredData(libraryEntries)} /><p className="eyebrow">可发现、可比较、可进入下一步</p><h1>知识库</h1><p className="lead">这个目录由 <code>app/content.ts</code> 自动驱动。替换条目后，搜索、列表、详情页、结构化数据与站点地图会同步更新。</p><LibrarySearch entries={libraryEntries} /></section>; }
