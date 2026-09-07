"use client";

import { useState, type FormEvent } from "react";
import { entityIconVisuals } from "./entity-icon-strip";

const preparationChecks = [
  { id: "settlement", label: "I know what the settlement needs next.", detail: "A building, shelter, food, or another visible settlement question.", iconIndex: 4 },
  { id: "party", label: "I have a party question to answer.", detail: "Who is going, and what will make the run useful to review afterward?", iconIndex: 0 },
  { id: "research", label: "I can name the Research question.", detail: "Use the Research page as a cautious checklist, not an invented tech order.", iconIndex: 2 },
  { id: "return", label: "I know what to bring back or observe.", detail: "A material lead, a route observation, or a clear reason to return.", iconIndex: 5 },
] as const;

const purposes = [
  { value: "first-run", label: "Make the first expedition readable", href: "/guides/beginner-guide", linkLabel: "Open the Beginner Guide" },
  { value: "materials", label: "Investigate a material question", href: "/guides/how-to-get-clay", linkLabel: "Open the Clay route" },
  { value: "research", label: "Choose a safer Research next step", href: "/guides/how-to-research", linkLabel: "Open the Research checklist" },
] as const;

type CheckId = (typeof preparationChecks)[number]["id"];
type PlannerResult = { ready: boolean; missing: string[]; purpose: (typeof purposes)[number] };

const initialChecks: Record<CheckId, boolean> = {
  settlement: false,
  party: false,
  research: false,
  return: false,
};

export function ExpeditionPlanner() {
  const [purpose, setPurpose] = useState<(typeof purposes)[number]["value"]>(purposes[0].value);
  const [checks, setChecks] = useState<Record<CheckId, boolean>>(initialChecks);
  const [result, setResult] = useState<PlannerResult | null>(null);

  function toggleCheck(id: CheckId) {
    setChecks((current) => ({ ...current, [id]: !current[id] }));
    setResult(null);
  }

  function buildPlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedPurpose = purposes.find((item) => item.value === purpose) || purposes[0];
    setResult({
      ready: preparationChecks.every((item) => checks[item.id]),
      missing: preparationChecks.filter((item) => !checks[item.id]).map((item) => item.label),
      purpose: selectedPurpose,
    });
  }

  function clearPlan() {
    setChecks(initialChecks);
    setResult(null);
  }

  return (
    <div className="planner-shell">
      <form className="planner-form" id="planner-form" onSubmit={buildPlan}>
        <div className="planner-form-head">
          <p className="eyebrow">1 / Set the question</p>
          <h2>What should this run make clearer?</h2>
          <p>Pick one purpose, then mark the four things you can actually check before leaving the settlement.</p>
        </div>
        <label className="planner-purpose" htmlFor="planner-purpose">Run purpose
          <select id="planner-purpose" value={purpose} onChange={(event) => { setPurpose(event.target.value as typeof purpose); setResult(null); }}>
            {purposes.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}
          </select>
        </label>
        <fieldset className="planner-checklist">
          <legend>2 / Confirm the preparation</legend>
          {preparationChecks.map((item) => {
            const icon = entityIconVisuals[item.iconIndex];
            return (
              <div className={`planner-check${checks[item.id] ? " is-checked" : ""}`} key={item.id}>
                <input id={`planner-check-${item.id}`} aria-label={item.label} type="checkbox" checked={checks[item.id]} onChange={() => toggleCheck(item.id)} />
                <span className="planner-check-icon"><img src={icon.src} alt="" width="48" height="48" /></span>
                <span><label className="planner-check-label" htmlFor={`planner-check-${item.id}`}><strong>{item.label}</strong><small>{item.detail}</small></label></span>
              </div>
            );
          })}
        </fieldset>
        <div className="planner-form-actions">
          <button className="button primary" type="submit">Build my route <span aria-hidden="true">→</span></button>
          <button className="text-button" type="button" onClick={clearPlan}>Clear checklist</button>
        </div>
        <p className="planner-note" id="planner-note">This first-slice planner is a session checklist. It does not claim a complete technology tree, exact drop table, or universal best order.</p>
      </form>

      {result ? (
        <section className={`planner-result ${result.ready ? "ready" : "hold"}`} aria-live="polite" aria-labelledby="planner-result-heading">
          <p className="eyebrow">3 / Result</p>
          <h2 id="planner-result-heading">{result.ready ? "You have a reviewable first-run plan." : "Hold the run until these questions are visible."}</h2>
          {result.ready ? (
            <>
              <p>Purpose: <strong>{result.purpose.label}</strong>. Keep this order visible while you play:</p>
              <ol>
                <li>Review the settlement question before you leave.</li>
                <li>Use the Research question as a boundary for what you are testing.</li>
                <li>Prepare the party for the chosen purpose.</li>
                <li>Return with the resource lead or observation that answers the question.</li>
              </ol>
              <div className="planner-result-actions"><a className="button primary" href={result.purpose.href}>{result.purpose.linkLabel} <span aria-hidden="true">↗</span></a><a className="text-link" href="/tools/first-expedition-planner">Rebuild this plan <span aria-hidden="true">↻</span></a></div>
            </>
          ) : (
            <>
              <p>The checklist is intentionally conservative. Mark each item you can observe or name before opening a related route.</p>
              <ul>{result.missing.map((item) => <li key={item}>{item}</li>)}</ul>
              <a className="text-link" href="/guides/beginner-guide">Use the Beginner Guide for the first question <span aria-hidden="true">→</span></a>
            </>
          )}
        </section>
      ) : (
        <section className="planner-empty" aria-label="Planner result preview">
          <p className="eyebrow">3 / Result</p>
          <h2>Your route will appear here.</h2>
          <p>Nothing has been submitted yet. Choose a purpose, mark what you can check, then select Build my route. The result will show missing checklist items or a four-step route to a related guide.</p>
        </section>
      )}
    </div>
  );
}
