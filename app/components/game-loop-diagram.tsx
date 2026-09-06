export function GameLoopDiagram() {
  // Asset implementation: app/components/game-loop-diagram.tsx
  const nodes = [
    { number: "01", title: "Settlement", copy: "Make the starting camp useful before the party leaves.", tone: "loop-node loop-node-settlement" },
    { number: "02", title: "Research", copy: "Use the research layer to choose the next safe improvement.", tone: "loop-node loop-node-research" },
    { number: "03", title: "Expedition", copy: "Send a prepared party into the current dungeon route.", tone: "loop-node loop-node-expedition" },
    { number: "04", title: "Resources", copy: "Bring back what changes the next settlement decision.", tone: "loop-node loop-node-resources" },
  ];

  return (
    <div className="game-loop" aria-label="Dungeon Settlers settlement, research, expedition, and resources loop">
      <div className="game-loop-heading">
        <span className="eyebrow">A useful mental model</span>
        <h2>Prepare the camp. Ask one research question. Then take the route.</h2>
      </div>
      <div className="game-loop-track">
        {nodes.map((node, index) => (
          <div className="game-loop-step" key={node.title}>
            <article className={node.tone}>
              <span className="loop-number">{node.number}</span>
              <h3>{node.title}</h3>
              <p>{node.copy}</p>
            </article>
            {index < nodes.length - 1 ? <span className="loop-arrow" aria-hidden="true">→</span> : null}
          </div>
        ))}
      </div>
      <p className="loop-note">The order is a reading aid, not a promise of a fixed tech tree. Detailed research prerequisites remain version-sensitive.</p>
    </div>
  );
}
