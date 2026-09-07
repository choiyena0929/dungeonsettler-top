"use client";

import { useEffect, useState, type FormEvent } from "react";
import { entityIconVisuals } from "./entity-icon-strip";

const preparationChecks = [
  { id: "settlement", label: "I know what the settlement needs next.", detail: "A building, shelter, food, or another visible settlement question.", iconId: "dungeon-settlers-workstations-icon" },
  { id: "party", label: "I have a party question to answer.", detail: "Who is going, and what will make the run useful to review afterward?", iconId: "dungeon-settlers-party-portrait-01" },
  { id: "research", label: "I can name the Research question.", detail: "Use the Research page as a cautious checklist, not an invented tech order.", iconId: "dungeon-settlers-party-portrait-02" },
  { id: "return", label: "I know what to bring back or observe.", detail: "A material lead, a route observation, or a clear reason to return.", iconId: "dungeon-settlers-storage-icon" },
] as const;

const purposes = [
  { value: "first-run", label: "Make the first expedition readable", href: "/guides/beginner-guide", linkLabel: "Open the Beginner Guide" },
  { value: "materials", label: "Investigate a material question", href: "/guides/how-to-get-clay", linkLabel: "Open the Clay route" },
  { value: "research", label: "Choose a safer Research next step", href: "/guides/how-to-research", linkLabel: "Open the Research checklist" },
] as const;

type CheckId = (typeof preparationChecks)[number]["id"];
type PlannerStatus = "empty" | "partial" | "ready";
type PlannerResult = {
  status: PlannerStatus;
  selected: string[];
  missing: string[];
  purpose: (typeof purposes)[number];
};

const initialChecks: Record<CheckId, boolean> = {
  settlement: false,
  party: false,
  research: false,
  return: false,
};
const storageKey = "ds-first-expedition-planner-v2";

export function ExpeditionPlanner() {
  const [purpose, setPurpose] = useState<(typeof purposes)[number]["value"]>(purposes[0].value);
  const [checks, setChecks] = useState<Record<CheckId, boolean>>(initialChecks);
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      try {
        const saved = JSON.parse(window.sessionStorage.getItem(storageKey) || "null") as { purpose?: string; checks?: Partial<Record<CheckId, boolean>>; result?: PlannerResult | null } | null;
        if (saved?.purpose && purposes.some((item) => item.value === saved.purpose)) setPurpose(saved.purpose as typeof purpose);
        if (saved?.checks) setChecks({ ...initialChecks, ...Object.fromEntries(preparationChecks.map((item) => [item.id, saved.checks?.[item.id] === true])) } as Record<CheckId, boolean>);
        if (saved?.result?.status && ["empty", "partial", "ready"].includes(saved.result.status)) {
          const savedPurpose = purposes.find((item) => item.value === saved.result?.purpose?.value) || purposes[0];
          setResult({ ...saved.result, purpose: savedPurpose });
        }
      } catch {
        // Session storage is a convenience; the checklist remains usable when it is unavailable.
      } finally {
        setHasHydrated(true);
      }
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify({ purpose, checks, result }));
    } catch {
      // Do not block a preparation check because storage is disabled or full.
    }
  }, [checks, hasHydrated, purpose, result]);

  function toggleCheck(id: CheckId) {
    setChecks((current) => ({ ...current, [id]: !current[id] }));
    setResult(null);
  }

  function reviewPreparation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedPurpose = purposes.find((item) => item.value === purpose) || purposes[0];
    const selected = preparationChecks.filter((item) => checks[item.id]).map((item) => item.label);
    const missing = preparationChecks.filter((item) => !checks[item.id]).map((item) => item.label);
    setResult({ status: selected.length === 0 ? "empty" : missing.length === 0 ? "ready" : "partial", selected, missing, purpose: selectedPurpose });
  }

  function clearPlan() {
    setChecks({ ...initialChecks });
    setResult(null);
  }

  return (
    <div className="planner-shell">
      <form className="planner-form" id="planner-form" onSubmit={reviewPreparation}>
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
            const icon = entityIconVisuals.find((asset) => asset.id === item.iconId) || entityIconVisuals[0];
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
          <button className="button primary" type="submit">Review preparation <span aria-hidden="true">→</span></button>
          <button className="text-button" type="button" onClick={clearPlan}>Clear checklist</button>
        </div>
        <p className="planner-note" id="planner-note">This is a preparation checklist for the current session. It does not claim a complete expedition route, technology tree, exact drop table, or universal best order.</p>
      </form>

      {result ? (
        <section className={`planner-result ${result.status}`} aria-live="polite" aria-labelledby="planner-result-heading">
          <p className="eyebrow">3 / Result</p>
          <h2 id="planner-result-heading">{result.status === "empty" ? "Start with one visible question." : result.status === "partial" ? "Preparation checklist is incomplete." : "Preparation checklist is complete."}</h2>
          {result.status === "empty" ? (
            <>
              <p>No preparation checks are confirmed yet. Choose a purpose and mark what you can observe before opening a related route.</p>
              <a className="text-link" href="/guides/beginner-guide">Use the Beginner Guide for the first question <span aria-hidden="true">→</span></a>
            </>
          ) : result.status === "partial" ? (
            <>
              <p><strong>{result.selected.length} of {preparationChecks.length}</strong> preparation checks are confirmed for “{result.purpose.label}”. Resolve the remaining visible questions before treating the run as ready.</p>
              <ul>{result.missing.map((item) => <li key={item}>{item}</li>)}</ul>
              <a className="text-link" href="/guides/beginner-guide">Use the Beginner Guide for the first question <span aria-hidden="true">→</span></a>
            </>
          ) : (
            <>
              <p>All four preparation checks are confirmed for “{result.purpose.label}”. This is a reviewable checklist, not a generated route; keep the actual dungeon path and result tied to what the current build shows.</p>
              <ol>
                <li>Review the settlement question before you leave.</li>
                <li>Use the Research question as a boundary for what you are testing.</li>
                <li>Prepare the party for the chosen purpose.</li>
                <li>Return with the resource lead or observation that answers the question.</li>
              </ol>
              <div className="planner-result-actions"><a className="button primary" href={result.purpose.href}>{result.purpose.linkLabel} <span aria-hidden="true">↗</span></a><a className="text-link" href="/tools/first-expedition-planner">Review this checklist again <span aria-hidden="true">↻</span></a></div>
            </>
          )}
        </section>
      ) : (
        <section className="planner-empty" aria-label="Planner result preview">
          <p className="eyebrow">3 / Result</p>
          <h2>Your preparation result will appear here.</h2>
          <p>Nothing has been submitted yet. Choose a purpose, mark what you can check, then select Review preparation. The result distinguishes an empty, partial, or complete checklist and hands you to a related guide.</p>
        </section>
      )}
    </div>
  );
}
