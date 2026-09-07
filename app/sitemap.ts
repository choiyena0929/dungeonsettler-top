import type { MetadataRoute } from "next";
import { guideEntries } from "./content";
import { absoluteUrl } from "./site-config";

// libraryEntries remains the template data-contract name; guideEntries is the public route source for this site.

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-09-07T00:00:00.000Z");
  return ["/", "/library", "/updates", "/database", "/tools/first-expedition-planner", ...guideEntries.map((entry) => `/guides/${entry.slug}`)].map((path) => ({
    url: absoluteUrl(path),
    lastModified,
  }));
}
