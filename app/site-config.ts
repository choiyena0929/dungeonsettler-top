export const siteConfig = {
  name: "Dungeon Settlers Field Guide",
  description: "Practical Dungeon Settlers guides for the current Early Access build: start the settlement, find Clay, and use Research without guessing.",
  domain: "dungeonsettlers.top",
  navigation: [
    { href: "/", label: "Field Guide" },
    { href: "/guides/beginner-guide", label: "Beginner" },
    { href: "/guides/how-to-get-clay", label: "Clay" },
    { href: "/guides/how-to-research", label: "Research" },
    { href: "/tools/first-expedition-planner", label: "Plan first run" },
    { href: "/database", label: "Data reference" },
  ],
};

export function absoluteUrl(path = "/") {
  return new URL(path, `https://${siteConfig.domain}`).toString();
}
