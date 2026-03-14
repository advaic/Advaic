"use client";

export const MARKETING_COOKIE_BANNER_STATE_EVENT =
  "advaic:marketing-cookie-banner-state";
export const MARKETING_MOBILE_MEDIA_QUERY = "(max-width: 767px)";

type MarketingCookieBannerStateDetail = {
  open: boolean;
};

export function emitMarketingCookieBannerState(open: boolean) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent<MarketingCookieBannerStateDetail>(
      MARKETING_COOKIE_BANNER_STATE_EVENT,
      { detail: { open } },
    ),
  );
}

export function subscribeMarketingCookieBannerState(
  onChange: (open: boolean) => void,
) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handler = (event: Event) => {
    const detail = (event as CustomEvent<MarketingCookieBannerStateDetail>)
      .detail;
    onChange(Boolean(detail?.open));
  };

  window.addEventListener(
    MARKETING_COOKIE_BANNER_STATE_EVENT,
    handler as EventListener,
  );

  return () => {
    window.removeEventListener(
      MARKETING_COOKIE_BANNER_STATE_EVENT,
      handler as EventListener,
    );
  };
}

export function isMarketingMobileViewport() {
  if (typeof window === "undefined") return false;
  return window.matchMedia(MARKETING_MOBILE_MEDIA_QUERY).matches;
}
