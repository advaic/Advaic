export type LandingFamily =
  | "home"
  | "produkt"
  | "prozess"
  | "regeln"
  | "qualitaet"
  | "freigabe"
  | "followups"
  | "vergleich"
  | "fit"
  | "preise"
  | "faq"
  | "trust"
  | "legal"
  | "other";

export type FunnelStage = "orientierung" | "bewertung" | "entscheidung";

export type LandingConversion = {
  family: LandingFamily;
  reportingKey: string;
  stage: FunnelStage;
  primaryHref: string;
  secondaryHref: string;
};

const MAP: Array<{
  match: (pathname: string) => boolean;
  value: LandingConversion;
}> = [
  {
    match: (p) => p === "/",
    value: {
      family: "home",
      reportingKey: "lp_home_v1",
      stage: "orientierung",
      primaryHref: "/signup",
      secondaryHref: "/produkt",
    },
  },
  {
    match: (p) => p.startsWith("/produkt"),
    value: {
      family: "produkt",
      reportingKey: "lp_produkt_v1",
      stage: "bewertung",
      primaryHref: "/signup",
      secondaryHref: "/produkt#simulator",
    },
  },
  {
    match: (p) => p.startsWith("/so-funktionierts"),
    value: {
      family: "prozess",
      reportingKey: "lp_prozess_v1",
      stage: "orientierung",
      primaryHref: "/signup",
      secondaryHref: "/autopilot-regeln",
    },
  },
  {
    match: (p) => p.startsWith("/autopilot") || p.startsWith("/autopilot-regeln"),
    value: {
      family: "regeln",
      reportingKey: "lp_regeln_v1",
      stage: "bewertung",
      primaryHref: "/signup",
      secondaryHref: "/qualitaetschecks",
    },
  },
  {
    match: (p) => p.startsWith("/qualitaetschecks"),
    value: {
      family: "qualitaet",
      reportingKey: "lp_qualitaet_v1",
      stage: "bewertung",
      primaryHref: "/signup",
      secondaryHref: "/freigabe-inbox",
    },
  },
  {
    match: (p) => p.startsWith("/freigabe-inbox") || p.startsWith("/makler-freigabe-workflow"),
    value: {
      family: "freigabe",
      reportingKey: "lp_freigabe_v1",
      stage: "bewertung",
      primaryHref: "/signup",
      secondaryHref: "/produkt#freigabe",
    },
  },
  {
    match: (p) => p.startsWith("/follow-up-logik"),
    value: {
      family: "followups",
      reportingKey: "lp_followups_v1",
      stage: "bewertung",
      primaryHref: "/signup",
      secondaryHref: "/produkt#followups",
    },
  },
  {
    match: (p) => p.startsWith("/manuell-vs-advaic"),
    value: {
      family: "vergleich",
      reportingKey: "lp_vergleich_v1",
      stage: "entscheidung",
      primaryHref: "/signup",
      secondaryHref: "/produkt#safe-start-konfiguration",
    },
  },
  {
    match: (p) =>
      p.startsWith("/use-cases") ||
      p.startsWith("/branchen") ||
      p.startsWith("/email-automatisierung-immobilienmakler"),
    value: {
      family: "fit",
      reportingKey: "lp_fit_v1",
      stage: "bewertung",
      primaryHref: "/signup",
      secondaryHref: "/produkt#safe-start-konfiguration",
    },
  },
  {
    match: (p) => p.startsWith("/preise"),
    value: {
      family: "preise",
      reportingKey: "lp_preise_v1",
      stage: "entscheidung",
      primaryHref: "/signup",
      secondaryHref: "/faq",
    },
  },
  {
    match: (p) => p.startsWith("/faq"),
    value: {
      family: "faq",
      reportingKey: "lp_faq_v1",
      stage: "entscheidung",
      primaryHref: "/signup",
      secondaryHref: "/trust",
    },
  },
  {
    match: (p) => p.startsWith("/sicherheit") || p.startsWith("/dsgvo-email-autopilot") || p.startsWith("/trust"),
    value: {
      family: "trust",
      reportingKey: "lp_trust_v1",
      stage: "bewertung",
      primaryHref: "/signup",
      secondaryHref: "/dsgvo-email-autopilot",
    },
  },
  {
    match: (p) =>
      p.startsWith("/impressum") ||
      p.startsWith("/datenschutz") ||
      p.startsWith("/cookie-und-storage") ||
      p.startsWith("/nutzungsbedingungen"),
    value: {
      family: "legal",
      reportingKey: "lp_legal_v1",
      stage: "orientierung",
      primaryHref: "/produkt",
      secondaryHref: "/trust",
    },
  },
];

function normalizePathname(pathname: string): string {
  if (!pathname) return "/";
  const trimmed = pathname.trim();
  if (!trimmed) return "/";
  if (trimmed === "/") return "/";
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function resolveLandingConversion(pathname: string): LandingConversion {
  const normalized = normalizePathname(pathname);
  const found = MAP.find((entry) => entry.match(normalized));
  if (found) return found.value;

  return {
    family: "other",
    reportingKey: "lp_other_v1",
    stage: "orientierung",
    primaryHref: "/signup",
    secondaryHref: "/produkt",
  };
}
