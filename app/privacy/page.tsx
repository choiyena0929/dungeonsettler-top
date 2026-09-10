import type { Metadata } from "next";
import { absoluteUrl } from "../site-config";

export const metadata: Metadata = {
  title: "Dungeon Settlers privacy information",
  description: "Privacy information for the independent Dungeon Settlers Field Guide, including analytics, Clarity, planner storage, and advertising boundaries.",
  robots: { index: false, follow: true },
  alternates: { canonical: absoluteUrl("/privacy") },
};

export default function PrivacyPage() {
  return (
    <article className="article-shell legal-page">
      <div className="article-header">
        <a className="back-link" href="/">← Back to the Field Guide</a>
        <p className="eyebrow">Trust / privacy / reviewed 10 Sep 2026</p>
        <h1>Privacy information.</h1>
        <p className="lead">This page explains what the Dungeon Settlers Field Guide uses to understand visits, how the first-expedition planner stores your own history, and where this independent guide stops collecting information.</p>
        <div className="tag-row"><span>Independent guide</span><span>Early Access</span><span>Current boundary</span></div>
      </div>

      <div className="article-body">
        <section className="article-section">
          <h2>What this guide is</h2>
          <p>Dungeon Settlers Field Guide is an independent English guide and planning site for the current Early Access game. It does not provide an account system, comments, payment flow, or a way to submit personal profile information. The game name, screenshots, and official links belong to their respective owners.</p>
          <p>Guide pages are dated because Early Access details can change. The <a href="/updates">guide update record</a> explains which conclusions should be checked again after an official change.</p>
        </section>

        <section className="article-section">
          <h2>Analytics and Clarity</h2>
          <p>The site currently loads Google Analytics 4 and Microsoft Clarity so its owner can understand which pages are visited, whether the guide is useful, and where the reading experience needs attention. These services may receive technical information, device or browser details, and usage events under their own policies and controls.</p>
          <p>The site owner does not use these tools to ask for your name, email address, payment details, or game account credentials. Do not enter personal information into a URL, search field, or planner purpose.</p>
        </section>

        <section className="article-section">
          <h2>Planner history stays in your browser</h2>
          <p>The <a href="/tools/first-expedition-planner">first-expedition planner</a> saves submitted checklist states in your browser&apos;s local storage so you can load and compare previous preparations on that device. This history is not an account or a game save, and this guide does not send it to a server for storage.</p>
          <p>Clearing the site&apos;s local storage or using the browser&apos;s private browsing controls removes or limits that local history. The planner may still send ordinary page-visit events to the analytics services described above.</p>
        </section>

        <section className="article-section">
          <h2>Advertising status</h2>
          <p>This release does not enable third-party advertising. It does not render an Adsterra component, request an Adsterra script, or place an advertising container on the current guide pages.</p>
          <p>If that boundary changes, the site owner must review the desktop and mobile experience, update this notice, and record the change before publishing the new behavior. A future advertising provider may have its own policy and consent requirements.</p>
        </section>

        <section className="article-section">
          <h2>Game sources and external links</h2>
          <p>Pages link to the official Steam store, official video material, dated community updates, and clearly labelled secondary references. Opening an external link takes you to that service, which has its own privacy policy, cookies, and data practices. This guide does not control those external services.</p>
          <p>For the current evidence boundary, start with the <a href="/guides/beginner-guide">Beginner Guide</a> and return to the official update path when a version-sensitive detail affects your run.</p>
        </section>

        <section className="article-section">
          <h2>Your browser choices</h2>
          <p>You can limit cookies, site storage, analytics activity, or third-party requests through your browser and device settings. Those controls can change how the planner, measurement, or external links behave. This page will be updated when the site&apos;s collection or advertising boundary changes.</p>
          <p>Last reviewed: 10 September 2026.</p>
        </section>

        <aside className="guide-callout"><strong>Short version.</strong> There is no account or advertising in this release. Analytics and Clarity help measure the site, while planner history stays in your browser. Use the official links and dated update path for the game&apos;s own policies and changing Early Access details.</aside>

        <section className="article-sources" aria-labelledby="privacy-links-heading">
          <p className="eyebrow">Useful links</p>
          <h2 id="privacy-links-heading">Continue with the guide.</h2>
          <ul>
            <li><a href="/tools/first-expedition-planner">Open the first-expedition planner →</a></li>
            <li><a href="/updates">Read dated guide updates →</a></li>
            <li><a href="https://store.steampowered.com/app/2798330/Dungeon_Settlers/" rel="noreferrer">Open the official Steam page ↗</a></li>
          </ul>
        </section>
      </div>
    </article>
  );
}
