export const entityIconVisuals = [
  {
    id: "dungeon-settlers-party-portrait-01",
    src: "/game/official/icons/party-portrait-01.jpg",
    label: "Party portrait 01",
    alt: "Cropped Dungeon Settlers party portrait from an official Steam screenshot.",
  },
  {
    id: "dungeon-settlers-party-portrait-02",
    src: "/game/official/icons/party-portrait-02.jpg",
    label: "Party portrait 02",
    alt: "Cropped Dungeon Settlers party portrait from an official Steam screenshot.",
  },
  {
    id: "dungeon-settlers-party-portrait-03",
    src: "/game/official/icons/party-portrait-03.jpg",
    label: "Party portrait 03",
    alt: "Cropped Dungeon Settlers party portrait from an official Steam screenshot.",
  },
  {
    id: "dungeon-settlers-party-portrait-04",
    src: "/game/official/icons/party-portrait-04.jpg",
    label: "Party portrait 04",
    alt: "Cropped Dungeon Settlers party portrait from an official Steam screenshot.",
  },
  {
    id: "dungeon-settlers-workstations-icon",
    src: "/game/official/icons/workstations.jpg",
    label: "Workstations",
    alt: "Cropped Dungeon Settlers Workstations icon from an official Steam screenshot.",
  },
  {
    id: "dungeon-settlers-storage-icon",
    src: "/game/official/icons/storage.jpg",
    label: "Storage",
    alt: "Cropped Dungeon Settlers Storage icon from an official Steam screenshot.",
  },
] as const;

export function EntityIconStrip({ compact = false }: { compact?: boolean }) {
  return (
    <section className={`entity-strip${compact ? " entity-strip-compact" : ""}`} aria-label="Visible game markers from official screenshots">
      <div className="entity-strip-heading">
        <span className="eyebrow">Visible game markers</span>
        <span>Official screenshot crops</span>
      </div>
      <div className="entity-icons">
        {entityIconVisuals.map((item) => (
          <figure className="entity-icon" key={item.id}>
            <img src={item.src} alt={item.alt} width="112" height="112" />
            <figcaption>{item.label}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
