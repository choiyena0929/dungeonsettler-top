export type EvidenceLevel = "official" | "reviewed" | "community";

export type GuideSection = {
  heading: string;
  paragraphs: string[];
  bullets?: string[];
};

export type GuideEntry = {
  slug: string;
  title: string;
  summary: string;
  description: string;
  category: string;
  label: string;
  primaryKeyword: string;
  evidence: EvidenceLevel;
  updatedAt: string;
  sections: GuideSection[];
  related: string[];
};

export type LibraryEntry = {
  slug: string;
  title: string;
  summary: string;
  category: string;
  tags: string[];
  evidence: EvidenceLevel;
  updatedAt: string;
  iconAssetId: string;
  body: string[];
};

const sourceNote = "Source boundary: official Steam information is the baseline. The official v0.4.19 update changes high-difficulty drop handling and item weight, while the Clay report and the DS_B.0.4.19 table extraction remain version-sensitive reviewed references; none establishes a permanent rule for every build.";

export const guideEntries: GuideEntry[] = [
  {
    slug: "beginner-guide",
    title: "Dungeon Settlers beginner guide: the first expedition route",
    summary: "A cautious starting route for the settlement, the first party, Research, and the first dungeon commitment.",
    description: "This Dungeon Settlers beginner guide gives new Early Access players a practical route from settlement setup to the first dungeon expedition.",
    category: "Start here",
    label: "First route",
    primaryKeyword: "Dungeon Settlers beginner guide",
    evidence: "official",
    updatedAt: "2026-09-07",
    sections: [
      {
        heading: "Quick answer",
        paragraphs: [
          "Start by making the settlement loop understandable, not by trying to optimise every building. The official store description frames Dungeon Settlers around building and expanding a settlement, recruiting and managing expedition members, exploring dungeons, gathering resources, crafting equipment, and researching technologies. That gives you a sensible first route: establish the camp, identify the next resource or research question, prepare a party, and only then commit to the dungeon.",
          "The first decision is therefore a preparation decision. Ask what the settlement can currently support, what the party is missing, and what the next expedition is meant to bring home. If the answer is vague, stay in the camp and read the relevant guide before spending scarce time or risking a run.",
        ],
        bullets: [
          "Use the settlement as the planning surface.",
          "Treat Research as a decision aid, not a race through an assumed fixed tree.",
          "Give each expedition one clear purpose: progress, resources, or information.",
        ],
      },
      {
        heading: "Build the settlement loop",
        paragraphs: [
          "The early settlement should answer three practical questions. Where will the next expedition start? Which resources or crafted equipment are currently available? What does the party need before it can return safely? Keeping those questions visible is more useful than copying an advanced build order from a different version.",
          "The store page confirms that settlement building, resource gathering, crafting, and Research belong to the same game loop. It does not prove one universal order for every room, technology, or production chain. So use a small ledger: write down the current bottleneck, the action that could remove it, and the evidence you have for that action. When a guide or update is version-sensitive, keep the date beside it.",
          "A good first camp is legible. You should be able to tell which preparation step is complete, which one is still uncertain, and which resource the next expedition is seeking. That clarity also makes a failed or interrupted run useful: you can distinguish a preparation problem from a dungeon problem instead of changing everything at once.",
        ],
      },
      {
        heading: "Prepare the party",
        paragraphs: [
          "The official game description says a party can include up to four expedition members and that dungeon exploration has real-time action with pause. It also describes permadeath. Those facts make a small pre-expedition check worthwhile: know who is going, know what the party is expected to do, and pause when the next choice needs inspection rather than allowing the route to decide for you.",
          "Do not turn the party limit into a claim that four is always correct. A full party may be appropriate for one route, while a smaller or differently prepared group may be a better learning run. The reliable principle is to match the party to the purpose of the expedition and to the preparation the settlement can actually provide.",
          "Before leaving, write one sentence that begins with ‘This expedition is for…’. If it says Clay, you can compare the early enemy and merchant routes in the Clay guide. If it says Research, use the Research checklist and avoid assuming that an unverified prerequisite is real. If it says ‘see what happens’, treat the run as reconnaissance and keep the expectations low.",
        ],
      },
      {
        heading: "Research before the expedition",
        paragraphs: [
          "Research is one of the confirmed systems in the official description, but the public sources reviewed for this launch do not establish a complete, stable technology order. That is an important boundary. Use Research to choose the next improvement that answers the current bottleneck; do not publish or follow an invented ‘best’ sequence.",
          "A safe early checklist is short. Name the problem, check whether the proposed research directly addresses it, note what resource or building the choice may affect, and keep the old plan visible until the new result is observed. This makes the next expedition a test of a decision rather than a blind commitment.",
        ],
        bullets: [
          "Problem: what is stopping the next useful action?",
          "Evidence: which official or dated source supports the choice?",
          "Result: what will you observe after the research is used?",
        ],
      },
      {
        heading: "When to return and what can change",
        paragraphs: [
          "Dungeon Settlers is an Early Access game, so update notes deserve a place in the route. A Steam Community update dated September 5, 2026 mentions combat changes, save compatibility, research-tier display corrections, and inventory guide controls. Those are exactly the kinds of changes that can alter how a player reads a guide without changing the broad settlement-to-expedition idea.",
          "Return to the settlement when the expedition has answered its question, when the party is no longer safe, or when the next action depends on a system you have not confirmed. The point is to keep the next decision observable. Recheck the official store and community pages after updates, and treat quantities or floor references from secondary guides as dated observations.",
          sourceNote,
        ],
      },
      {
        heading: "Sources",
        paragraphs: [
          "Use the official Steam page for the current game overview and Steam Community for dated update notes. Recheck exact interface details after major patches.",
        ],
      },
    ],
    related: ["how-to-get-clay", "how-to-research"],
  },
  {
    slug: "how-to-get-clay",
    title: "How to get clay in Dungeon Settlers",
    summary: "The current Clay routes, with a clear separation between an early dungeon observation and later fallback options.",
    description: "Learn how to get Clay in Dungeon Settlers through early dungeon encounters, merchants, and later regions while keeping version-sensitive quantities clearly labelled.",
    category: "Resource route",
    label: "Clay answer",
    primaryKeyword: "How to get clay in Dungeon Settlers",
    evidence: "reviewed",
    updatedAt: "2026-09-07",
    sections: [
      {
        heading: "Quick answer",
        paragraphs: [
          "The short answer to how to get clay in Dungeon Settlers is to look for the current dungeon and merchant routes rather than assuming Clay is a settlement-only resource. A September 5, 2026 secondary guide reports Clay from Acid Slogels from Floor 3 onward, with a chance of two Clay, and five Clay from Predatory Frogs. It also describes merchants and a Region 2 fallback. Treat those quantities and floor references as dated observations, not permanent rules.",
          "If you are still building your first settlement loop, do not force a deep run only because a recipe is blocked. First identify whether your current build actually needs Clay now, then choose the safest route you can verify. The beginner guide helps with the preparation decision; this page focuses on comparing the resource paths.",
        ],
      },
      {
        heading: "Early dungeon sources",
        paragraphs: [
          "The most direct early route in the available report is an enemy route. Acid Slogels are reported from Floor 3 onward, with a chance to provide two Clay. Predatory Frogs are reported as a five-Clay source. Because this information comes from a secondary guide rather than an official drop table, use it as a scouting lead. Confirm what appears in your current build before committing a valuable expedition to a precise quantity.",
          "The practical move is to use the first run to learn the route and the second run to collect with a plan. Keep the encounter name, floor, result, and game date together. If the result differs from the report, record the observed result and return to the official update path before declaring the guide outdated. One changed enemy or floor can make a previously clean route misleading.",
          "The official Steam page confirms the larger context: Dungeon Settlers asks players to explore dungeons, gather resources, craft equipment, and research technologies as part of the settlement loop. It does not confirm the Clay quantities above. That distinction is why this page presents the drop information as version-sensitive and reviewed, not official.",
        ],
      },
      {
        heading: "Merchant and Region 2 fallback",
        paragraphs: [
          "If the early enemy route is unsafe or does not fit the party you can currently prepare, check the merchant option described in the same secondary report. A merchant route can trade certainty of location for uncertainty of stock, price, or timing. Do not spend the last of a critical settlement resource on a purchase until you know what the Clay is meant to unlock.",
          "The report also points to Region 2 as a later route. Read that as a progression fallback, not a reason to skip the current settlement problem. Region references are especially sensitive to changes in Early Access, and the public evidence reviewed here does not provide a complete table of every region, enemy, or reward.",
          "A good comparison is simple: early enemy route means risk and a possible direct drop; merchant route means a location or stock check; Region 2 means progression before the resource becomes a reliable target. Choose the route whose uncertainty you can afford to test.",
        ],
      },
      {
        heading: "What Clay is used for",
        paragraphs: [
          "The available report names Clay alongside buildings and production such as Kiln, Ceramics, Farm, Leather Workstation, and Casting Workbench. Those references are useful for spotting the shape of the crafting path, but they are not a complete recipe book and they are not enough to claim that every item requires Clay in every build.",
          "Use the cost as a decision trigger. If Clay is required for a building that answers your current bottleneck, gather it deliberately. If it is part of a later branch, keep the resource question in your ledger and continue preparing the settlement. This prevents a common early mistake: chasing a material because the name is visible, without knowing whether it improves the next expedition.",
        ],
      },
      {
        heading: "Version and evidence note",
        paragraphs: [
          "Dungeon Settlers is in Early Access. Check Steam Community after combat, save, research-display, or inventory changes, and verify exact Clay routes in the current build.",
          sourceNote,
        ],
      },
      {
        heading: "Sources",
        paragraphs: [
          "Use the official Steam page for game identity and the overall settlement-to-dungeon loop. Use Steam Community for update-sensitive checks. Use the dated Prima Games report as a secondary Clay lead and verify it in the current build before relying on an exact enemy, floor, or quantity.",
        ],
      },
    ],
    related: ["beginner-guide", "how-to-research"],
  },
  {
    slug: "how-to-research",
    title: "How to research in Dungeon Settlers",
    summary: "A version-locked Research reference with a complete current-build table and a cautious way to apply it.",
    description: "This guide explains how to research in Dungeon Settlers using a cautious checklist grounded in the official loop and clear version boundaries.",
    category: "System guide",
    label: "Research answer",
    primaryKeyword: "How to research in Dungeon Settlers",
    evidence: "official",
    updatedAt: "2026-09-07",
    sections: [
      {
        heading: "What Research is confirmed to do",
        paragraphs: [
          "The official Dungeon Settlers store description lists researching technologies alongside settlement building, recruitment, dungeon exploration, resource gathering, and equipment crafting. That is enough to establish Research as part of the main loop. It is not enough to publish a complete technology tree, exact prerequisites, or a universal priority order. Those details need direct confirmation in the current build or a source that can be checked against it.",
          "The useful interpretation is that Research turns a settlement problem into a deliberate next question. If the party lacks a preparation option, ask whether the research layer can change that option. If the problem is a resource route, ask whether Research affects the settlement production or the expedition’s ability to reach it. Keep the question narrower than ‘what is the best tech?’.",
        ],
      },
      {
        heading: "Verified starting conditions",
        paragraphs: [
          "The official store page confirms the current Early Access loop: build and expand a settlement, manage expedition members, explore dungeons, gather resources, craft equipment, and research technologies. It also describes up to four party members, permadeath, and the first two dungeon regions. These broad facts support a preparation check; the version-locked table below supplies the current-build node rows separately from those official claims.",
          "Before choosing a Research item, write down the visible settlement bottleneck, the exact label and tier shown in your current build, and the change you expect to observe. The latest official Steam Community update path includes a v0.4.17 correction to the displayed tier for Carapace Processing and a v0.4.19 patch on September 6, 2026. Keep the build date beside your note so an older display is not mistaken for a current prerequisite.",
          "The current-build ResearchTable snapshot records node cost, prerequisite links, Tech Book requirements, and unlock references. It is a reviewed secondary extraction, not an official patch note; if the game or a newer official build disagrees, record the difference and defer the claim until the source is refreshed.",
        ],
        bullets: [
          "Visible bottleneck: what settlement or expedition decision is blocked?",
          "Current display: what exact Research label and tier does the build show?",
          "Observable result: what building, equipment, resource, or party change would confirm the choice helped?",
        ],
      },
      {
        heading: "A safe early checklist",
        paragraphs: [
          "First, name the bottleneck in plain language. ‘I cannot prepare the next expedition’ is more useful than ‘I need the strongest technology’. Open the in-game Research panel, copy the displayed choice and tier into your note, and record the build date. Do not infer a hidden prerequisite from the position of a node or from a screenshot made on another patch.",
          "Next, check the displayed description against the result you expect. Select one choice only when you can name the observable change: a new settlement option, an equipment option, a resource step, or a party preparation change. After using it, compare the before and after screens and record what actually changed. If there is no visible result, keep the choice pending and do not call it a finished route.",
          "Example: if Clay is the current bottleneck, use the dated Clay route for the resource lead, then check the current Research table for the production or preparation unlock you intend to test. The official update notes do not establish a Clay node; the data snapshot only reports the item and unlock references present in DS_B.0.4.19, so a newer build still needs a fresh check.",
        ],
        bullets: [
          "State the current bottleneck and copy the displayed Research label and tier.",
          "Name one expected settlement, equipment, resource, or party change.",
          "Use the choice, compare the before and after screens, and record the result.",
          "Keep the date and build context beside the result; unknown values stay pending verification.",
        ],
      },
      {
        heading: "How it fits the expedition loop",
        paragraphs: [
          "Research is most useful when it changes the next expedition decision. The official system description gives a clear broad loop: build and expand the settlement, manage expedition members, explore dungeons, gather resources, craft equipment, and research technologies. Read that loop as a cycle. Settlement creates a preparation question; Research may change the answer; the expedition tests it; resources and observations return to the settlement.",
          "A research choice should therefore have a next action attached to it. If the expected result is better preparation, prepare and test a route. If the expected result is a new production option, check the resource requirement before leaving. If the expected result is unclear, keep learning rather than spending a risky expedition on a theory you cannot observe.",
          "The game supports real-time dungeon play with pause, and the official page describes a party of up to four plus permadeath. Those facts make observation valuable. Pause before a consequential choice, write down what the research was meant to change, and use the return to the settlement as the point where the decision is reviewed.",
        ],
      },
      {
        heading: "What remains unverified",
        paragraphs: [
          "The table below resolves the current DS_B.0.4.19 node and prerequisite snapshot, but it does not prove a universal best-first route, a permanent relationship between one technology and one resource, or behavior in a later build. Treat those forward-looking claims as pending until the current game and update path agree.",
          "The Steam Community update path is still useful because it shows where version-sensitive corrections may appear. The v0.4.17 official note mentions a Research-tier display correction, while v0.4.19 changes item weights and high-difficulty drop-quantity handling. Those notes are reasons to recheck the interface and preparation context after updates, not evidence of a particular research order.",
        ],
      },
      {
        heading: "Version note",
        paragraphs: [
          "Dungeon Settlers is an Early Access title. A safe Research guide should make its date visible and should keep the official system description separate from observations, community explanations, and reports that may age quickly. When a choice no longer produces the expected result, pause the route, record the difference, and check the official update path before expanding the claim.",
          "When the Research interface changes, compare the result in your current build with the latest official update notes before following an older route.",
        ],
      },
      {
        heading: "Sources",
        paragraphs: [
          "The official Steam page is the baseline for the Research system and the settlement-to-expedition loop. Steam Community is the version-sensitive update path. The version-locked DungeonSettlers.wiki table is a reviewed secondary extraction of the stock game files for DS_B.0.4.19; it is linked for auditability and must be rechecked after a build change. The Clay guide is linked because resource and research decisions often meet at the same settlement bottleneck.",
        ],
      },
    ],
    related: ["beginner-guide", "how-to-get-clay"],
  },
];

export const libraryEntries: LibraryEntry[] = guideEntries.map((entry) => ({
  slug: entry.slug,
  title: entry.title,
  summary: entry.summary,
  category: entry.category,
  tags: [entry.label, "Early Access", "dated guide"],
  evidence: entry.evidence,
  updatedAt: entry.updatedAt,
  iconAssetId: entry.slug === "beginner-guide"
    ? "dungeon-settlers-party-portrait-01"
    : entry.slug === "how-to-get-clay"
      ? "dungeon-settlers-storage-icon"
      : "dungeon-settlers-workstations-icon",
  body: entry.sections.flatMap((section) => section.paragraphs),
}));

export const updates = [
  {
    version: "Official feedback status",
    date: "2026-09-06",
    summary: "The latest official feedback post says three updates shipped during the first three days of Early Access and links v0.4.12, v0.4.17, and v0.4.19. It also lists future improvements that are still being reviewed, so it does not create a new numbered version or a new Clay or Research conclusion.",
    affectedRoutes: ["/", "/guides/beginner-guide", "/tools/first-expedition-planner"],
    sourceLabel: "Steam Community official feedback announcement",
    sourceHref: "https://steamcommunity.com/games/2798330/announcements/detail/1842846814451295",
  },
  {
    version: "Official Steam v0.4.19",
    date: "2026-09-06",
    summary: "The official update removed the item-drop quantity penalty on Very Hard and Devastation Management and reduced the weight of several items, including Clay. These changes affect high-difficulty collection and carry context; they do not establish a new Clay route or a Research prerequisite.",
    affectedRoutes: ["/guides/how-to-get-clay", "/guides/how-to-research", "/tools/first-expedition-planner"],
    sourceLabel: "Steam Community update path",
    sourceHref: "https://steamcommunity.com/app/2798330/",
  },
  {
    version: "Field Guide 0.1",
    date: "2026-09-07",
    summary: "The first release covers the first expedition route, Clay routes, and a conservative Research checklist for the current Early Access context.",
    affectedRoutes: ["/", "/guides/beginner-guide", "/guides/how-to-get-clay", "/guides/how-to-research"],
    sourceLabel: "Dungeon Settlers Field Guide release",
    sourceHref: "/",
  },
];

export const evidenceLabels: Record<EvidenceLevel, string> = {
  official: "Official baseline",
  reviewed: "Reviewed secondary source",
  community: "Community reference",
};

export function getGuide(slug: string) {
  return guideEntries.find((entry) => entry.slug === slug);
}
