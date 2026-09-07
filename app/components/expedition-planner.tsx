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
type PurposeValue = (typeof purposes)[number]["value"];
type PlannerStatus = "empty" | "partial" | "ready";
type PlannerResult = {
  status: PlannerStatus;
  selected: string[];
  missing: string[];
  purpose: (typeof purposes)[number];
};
type SavedPlan = {
  id: string;
  savedAt: string;
  purpose: PurposeValue;
  checks: Record<CheckId, boolean>;
  status: PlannerStatus;
  selected: string[];
  missing: string[];
};

const initialChecks: Record<CheckId, boolean> = {
  settlement: false,
  party: false,
  research: false,
  return: false,
};
const storageKey = "ds-first-expedition-planner-v2";
const historyKey = "ds-first-expedition-planner-history-v1";
const maxSavedPlans = 12;

function isStatus(value: unknown): value is PlannerStatus {
  return value === "empty" || value === "partial" || value === "ready";
}

function purposeFor(value: unknown) {
  return purposes.find((item) => item.value === value) || purposes[0];
}

function newPlanId() {
  if (typeof window !== "undefined" && window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function statusLabel(status: PlannerStatus) {
  return status === "empty" ? "Empty" : status === "partial" ? "Partial" : "Ready";
}

export function ExpeditionPlanner() {
  const [purpose, setPurpose] = useState<PurposeValue>(purposes[0].value);
  const [checks, setChecks] = useState<Record<CheckId, boolean>>(initialChecks);
  const [result, setResult] = useState<PlannerResult | null>(null);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [hasHydrated, setHasHydrated] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      try {
        const saved = JSON.parse(window.sessionStorage.getItem(storageKey) || "null") as { purpose?: string; checks?: Partial<Record<CheckId, boolean>>; result?: PlannerResult | null } | null;
        if (saved?.purpose && purposes.some((item) => item.value === saved.purpose)) setPurpose(saved.purpose as PurposeValue);
        if (saved?.checks) setChecks({ ...initialChecks, ...Object.fromEntries(preparationChecks.map((item) => [item.id, saved.checks?.[item.id] === true])) } as Record<CheckId, boolean>);
        if (saved?.result?.status && isStatus(saved.result.status)) setResult({ ...saved.result, purpose: purposeFor(saved.result.purpose?.value) });
        const history = JSON.parse(window.localStorage.getItem(historyKey) || "[]") as SavedPlan[];
        if (Array.isArray(history)) setSavedPlans(history.filter((item) => item && typeof item.id === "string" && isStatus(item.status) && purposes.some((purposeItem) => purposeItem.value === item.purpose)).slice(0, maxSavedPlans));
      } catch {
        // Browser storage is a convenience; the checklist remains usable when it is unavailable.
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

  useEffect(() => {
    if (!hasHydrated) return;
    try {
      window.localStorage.setItem(historyKey, JSON.stringify(savedPlans));
    } catch {
      // History is optional; the current plan still works when storage is unavailable.
    }
  }, [hasHydrated, savedPlans]);

  function toggleCheck(id: CheckId) {
    setChecks((current) => ({ ...current, [id]: !current[id] }));
    setResult(null);
  }

  function rememberPlan(nextResult: PlannerResult, nextChecks: Record<CheckId, boolean>) {
    if (!hasHydrated) return;
    const saved: SavedPlan = {
      id: newPlanId(),
      savedAt: new Date().toISOString(),
      purpose: nextResult.purpose.value,
      checks: { ...nextChecks },
      status: nextResult.status,
      selected: [...nextResult.selected],
      missing: [...nextResult.missing],
    };
    const nextSavedPlans = [saved, ...savedPlans].slice(0, maxSavedPlans);
    setSavedPlans(nextSavedPlans);
    try {
      window.localStorage.setItem(historyKey, JSON.stringify(nextSavedPlans));
    } catch {
      // History is optional; the current plan still works when storage is unavailable.
    }
    setCompareIds((current) => current.filter((id) => id !== saved.id).slice(0, 2));
  }

  function reviewPreparation(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedPurpose = purposeFor(purpose);
    const selected = preparationChecks.filter((item) => checks[item.id]).map((item) => item.label);
    const missing = preparationChecks.filter((item) => !checks[item.id]).map((item) => item.label);
    const nextResult: PlannerResult = { status: selected.length === 0 ? "empty" : missing.length === 0 ? "ready" : "partial", selected, missing, purpose: selectedPurpose };
    setResult(nextResult);
    rememberPlan(nextResult, checks);
  }

  function clearPlan() {
    setChecks({ ...initialChecks });
    setResult(null);
  }

  function loadPlan(saved: SavedPlan) {
    setPurpose(saved.purpose);
    setChecks({ ...initialChecks, ...saved.checks });
    setResult({ status: saved.status, selected: [...saved.selected], missing: [...saved.missing], purpose: purposeFor(saved.purpose) });
  }

  function toggleCompare(id: string) {
    setCompareIds((current) => current.includes(id) ? current.filter((value) => value !== id) : current.length < 2 ? [...current, id] : [current[1], id]);
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
          <select id="planner-purpose" value={purpose} onChange={(event) => { setPurpose(event.target.value as PurposeValue); setResult(null); }}>
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
              <a className="text-link" href={result.purpose.href}>Open the related route <span aria-hidden="true">→</span></a>
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

      <section className="planner-history" aria-labelledby="planner-history-heading">
        <div className="planner-history-heading"><div><p className="eyebrow">Across sessions</p><h2 id="planner-history-heading">Saved preparation runs</h2></div><p>Select up to two saved runs to compare what was confirmed and what was still missing.</p></div>
        {savedPlans.length ? <div className="planner-history-list">{savedPlans.map((saved) => <div className="planner-history-item" key={saved.id}>
          <input aria-label={`Compare ${statusLabel(saved.status)} preparation run from ${saved.savedAt.slice(0, 10)}`} type="checkbox" checked={compareIds.includes(saved.id)} onChange={() => toggleCompare(saved.id)} /><span className="planner-history-copy"><strong>{statusLabel(saved.status)} · {purposeFor(saved.purpose).label}</strong><small>{saved.savedAt.slice(0, 10)} · {saved.selected.length}/4 confirmed</small></span>
          <button className="text-button" type="button" onClick={() => loadPlan(saved)}>Load</button>
        </div>)}</div> : <p className="planner-history-empty">No saved runs yet. Submit a result and it will remain available in this browser for a later comparison.</p>}
        {compareIds.length >= 2 ? <div className="planner-compare" aria-live="polite"><p className="eyebrow">Comparison</p><div className="planner-compare-grid">{compareIds.map((id) => { const saved = savedPlans.find((item) => item.id === id); if (!saved) return null; return <article key={saved.id}><h3>{statusLabel(saved.status)}</h3><p>{purposeFor(saved.purpose).label}</p><strong>{saved.selected.length}/4 confirmed</strong><ul>{saved.missing.length ? saved.missing.map((item) => <li key={item}>{item}</li>) : <li>All visible checks confirmed.</li>}</ul></article>; })}</div></div> : null}
        {savedPlans.length ? <button className="text-button planner-history-clear" type="button" onClick={() => { setSavedPlans([]); setCompareIds([]); try { window.localStorage.removeItem(historyKey); } catch { /* optional history */ } }}>Clear saved runs</button> : null}
      </section>
    </div>
  );
}
