import type { Metadata } from "next";
import { libraryEntries } from "../content";
import { LibrarySearch } from "../components/library-search";
import { JsonLd, itemListStructuredData } from "../structured-data";

export const metadata: Metadata = { title: "Guide library", description: "Search and filter the current Dungeon Settlers guide library." };
export default function LibraryPage() { return <section className="page-shell"><JsonLd value={itemListStructuredData(libraryEntries)} /><p className="eyebrow">Find the next useful route</p><h1>Guide library</h1><p className="lead">Search the current guides by problem or category, then open the route that matches your next settlement or expedition decision.</p><LibrarySearch entries={libraryEntries} /></section>; }
