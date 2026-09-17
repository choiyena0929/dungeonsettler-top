
"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { shouldRenderDesktopAd } from "../ad-policy";

const AD_KEY = process.env.NEXT_PUBLIC_ADSTERRA_KEY ?? "";
const AD_SCRIPT_SOURCE = AD_KEY ? `https://www.highrevenueformat.com/${AD_KEY}/invoke.js` : "";
const subscribe = () => () => {};

/**
 * Page-level Adsterra slot. The server snapshot stays closed so crawlers and
 * mobile snapshots do not render a container or inject a third-party script.
 */
export function AdsterraAd({ path }: { path: string }) {
  const enabled = useSyncExternalStore(
    subscribe,
    () => Boolean(AD_KEY) && shouldRenderDesktopAd(path, window.navigator.userAgent),
    () => false,
  );
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!enabled || !host || !AD_KEY || !AD_SCRIPT_SOURCE) return;

    const inline = document.createElement("script");
    inline.text = `window.atOptions = ${JSON.stringify({
      key: AD_KEY,
      format: "iframe",
      height: 250,
      width: 300,
      params: {},
    })};`;
    const external = document.createElement("script");
    external.async = true;
    external.src = AD_SCRIPT_SOURCE;
    external.setAttribute("data-adsterra", "true");
    host.append(inline, external);

    return () => {
      inline.remove();
      external.remove();
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <aside className="adsterra-ad" aria-label="Advertisement">
      <span className="adsterra-ad-label">ADVERTISEMENT</span>
      <div className="adsterra-ad-frame" ref={hostRef} />
    </aside>
  );
}
