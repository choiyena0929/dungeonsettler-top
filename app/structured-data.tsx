import { absoluteUrl, siteConfig } from "./site-config";
import type { GuideEntry, LibraryEntry } from "./content";

export function JsonLd({ value }: { value: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(value) }} />;
}

export function siteStructuredData() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", name: siteConfig.name, url: absoluteUrl() },
      {
        "@type": "WebSite",
        name: siteConfig.name,
        url: absoluteUrl(),
        potentialAction: {
          "@type": "SearchAction",
          target: `${absoluteUrl("/library")}?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export function itemListStructuredData(entries: LibraryEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${siteConfig.name} guide list`,
    itemListElement: entries.map((entry, index) => ({ "@type": "ListItem", position: index + 1, name: entry.title, url: absoluteUrl(`/guides/${entry.slug}`) })),
  };
}

export function guideStructuredData(entry: GuideEntry) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: entry.title,
    description: entry.description,
    dateModified: entry.updatedAt,
    author: { "@type": "Organization", name: siteConfig.name, url: absoluteUrl() },
    mainEntityOfPage: absoluteUrl(`/guides/${entry.slug}`),
  };
}

export function toolStructuredData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Dungeon Settlers first expedition planner",
    url: absoluteUrl("/tools/first-expedition-planner"),
    applicationCategory: "GameApplication",
    operatingSystem: "Any",
    isAccessibleForFree: true,
    description: "A session checklist for making a Dungeon Settlers Early Access expedition question visible before leaving the settlement.",
    featureList: ["Purpose selection", "Preparation checklist", "Related guide handoff"],
  };
}
