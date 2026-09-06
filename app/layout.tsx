import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { siteConfig, absoluteUrl } from "./site-config";
import { JsonLd, siteStructuredData } from "./structured-data";

export const metadata: Metadata = {
  title: { default: siteConfig.name, template: "%s | DS Field Guide" },
  description: siteConfig.description,
  metadataBase: new URL(`https://${siteConfig.domain}`),
  alternates: { canonical: absoluteUrl() },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head><JsonLd value={siteStructuredData()} /></head>
      <body>
        <header className="site-header">
          <Link className="brand" href="/" aria-label="Dungeon Settlers Field Guide home"><span className="brand-mark">DS</span><span>{siteConfig.name}</span></Link>
          <nav aria-label="Primary navigation">{siteConfig.navigation.map((item) => <Link key={item.href} href={item.href}>{item.label}</Link>)}</nav>
        </header>
        <main>{children}</main>
        <footer>
          <div className="footer-inner">
            <div><strong>{siteConfig.name}</strong><p>Independent guides for a changing Early Access game.</p></div>
            <div className="footer-links"><a href="https://store.steampowered.com/app/2798330/Dungeon_Settlers/" rel="noreferrer">Official Steam page</a><Link href="/updates">Guide updates</Link></div>
          </div>
          <p className="footer-small">Facts are dated and source-bounded. Check the official game pages after updates.</p>
        </footer>
      </body>
    </html>
  );
}
