import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GuidePage } from "../../components/guide-page";
import { getGuide, guideEntries } from "../../content";
import { absoluteUrl } from "../../site-config";

export function generateStaticParams() {
  return guideEntries.map((entry) => ({ slug: entry.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const entry = getGuide(params.slug);
  if (!entry) return {};
  return { title: entry.primaryKeyword, description: entry.description, alternates: { canonical: absoluteUrl(`/guides/${entry.slug}`) } };
}

export default function GuideRoute({ params }: { params: { slug: string } }) {
  const entry = getGuide(params.slug);
  if (!entry) notFound();
  return <GuidePage entry={entry} />;
}
