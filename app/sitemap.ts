import type { MetadataRoute } from "next";
import { guideEntries } from "./content";
import { absoluteUrl } from "./site-config";

// libraryEntries remains the template data-contract name; guideEntries is the public route source for this site.

export default function sitemap(): MetadataRoute.Sitemap {
  return ["/", "/updates", ...guideEntries.map((entry) => `/guides/${entry.slug}`)].map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date("2026-09-06T00:00:00.000Z"),
  }));
}
