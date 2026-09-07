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
      <div className="game-loop-gallery">
        <figure><img src="/game/official/settlement.jpg" alt="Dungeon Settlers expedition camp with party portraits, building controls, and a quest panel." width="1920" height="1080" /><figcaption>Prepare the party and settlement.</figcaption></figure>
        <figure><img src="/game/official/dungeon.jpg" alt="Dungeon Settlers party standing before a dungeon shrine after combat." width="1920" height="1080" /><figcaption>Take the prepared party into the dungeon.</figcaption></figure>
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
      <p className="loop-note">Use this loop to decide what the next expedition must accomplish. Exact research prerequisites can change during Early Access.</p>
    </div>
  );
}
