import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import { libraryEntries } from "../../content";
import { absoluteUrl } from "../../site-config";

export function generateStaticParams() { return libraryEntries.map((entry) => ({ slug: entry.slug })); }
export function generateMetadata({ params }: { params: { slug: string } }): Metadata { const entry = libraryEntries.find((item) => item.slug === params.slug); return entry ? { title: entry.title, description: entry.summary, alternates: { canonical: absoluteUrl(`/guides/${entry.slug}`) } } : {}; }
export default function LibraryDetail({ params }: { params: { slug: string } }) {
  const entry = libraryEntries.find((item) => item.slug === params.slug);
  if (!entry) notFound();
  permanentRedirect(`/guides/${entry.slug}`);
}
