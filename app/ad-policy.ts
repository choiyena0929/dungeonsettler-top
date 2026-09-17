const MOBILE_OR_TABLET_USER_AGENT = /Android|iPhone|iPad|iPod|Windows Phone|webOS|BlackBerry|IEMobile|Opera Mini|Mobile|Tablet/i;
const BOT_USER_AGENT = /bot|crawler|spider|slurp|bingpreview|headless/i;

export const DESKTOP_AD_PATHS = new Set(["/"]);

function normalizePathname(pathname: string): string {
  const withoutQuery = pathname.split("?", 1)[0].split("#", 1)[0];
  if (withoutQuery === "/") return "/";
  return withoutQuery.replace(/\/+$/, "");
}

export function shouldRenderDesktopAd(pathname: string, userAgent: string): boolean {
  return DESKTOP_AD_PATHS.has(normalizePathname(pathname))
    && Boolean(userAgent)
    && !MOBILE_OR_TABLET_USER_AGENT.test(userAgent)
    && !BOT_USER_AGENT.test(userAgent);
}
