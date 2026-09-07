import type { Metadata } from "next";
import Script from "next/script";
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
      <head>
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-GE8ZVMQJ0N"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-GE8ZVMQJ0N');
          `}
        </Script>
        <JsonLd value={siteStructuredData()} />
      </head>
      <body>
        <header className="site-header">
          <a className="brand" href="/" aria-label="Dungeon Settlers Field Guide home"><span className="brand-mark"><img src="/game/official/capsule.jpg" alt="" width="231" height="87" /></span><span>Field Guide</span></a>
          <nav aria-label="Primary navigation">{siteConfig.navigation.map((item) => <a key={item.href} href={item.href}>{item.label}</a>)}</nav>
        </header>
        <main>{children}</main>
        <footer>
          <div className="footer-inner">
            <div><strong>{siteConfig.name}</strong><p>Independent guides for a changing Early Access game.</p></div>
            <div className="footer-links"><a href="https://store.steampowered.com/app/2798330/Dungeon_Settlers/" rel="noreferrer">Official Steam page</a><a href="https://www.youtube.com/watch?v=BkGIa5V39-w" rel="noreferrer">Official trailer</a><a href="/updates">Guide updates</a></div>
          </div>
          <p className="footer-small">Guide details are dated. Check the official game pages after major updates.</p>
        </footer>
      </body>
    </html>
  );
}
