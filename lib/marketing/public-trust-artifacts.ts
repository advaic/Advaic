export const PUBLIC_TRUST_SUMMARIES = [
  {
    value: "7",
    title: "öffentliche Prüfobjekte",
    description: "Produkt, Sicherheitslogik, Datenschutz, Anbieterliste, Freigabe, Integrationen und Preis bleiben vor dem ersten Gespräch öffentlich prüfbar.",
  },
  {
    value: "3",
    title: "sichtbare Produktzustände",
    description: "Inbox, Freigabe und Versandchecks sind als anonymisierte Produktzustände öffentlich sichtbar.",
  },
  {
    value: "1",
    title: "klarer Starter-Preis",
    description: "Preis, Testphase und Safe-Start-Rahmen sind öffentlich benannt statt erst im Vertriebsgespräch.",
  },
] as const;

export const PUBLIC_TRUST_ARTIFACTS = [
  {
    id: "product",
    eyebrow: "Produktfluss",
    title: "Produktzustand statt Mock-up",
    text: "Inbox, Freigabe und Checks sind als echte, anonymisierte Produktzustände sichtbar.",
    href: "/produkt",
    cta: "Produkt prüfen",
  },
  {
    id: "security",
    eyebrow: "Sicherheitslogik",
    title: "Auto-Grenzen und Stopp-Regeln",
    text: "Die Sicherheitsseite zeigt, wann Auto erlaubt ist und wann die Freigabe bewusst greifen muss.",
    href: "/sicherheit",
    cta: "Sicherheitsseite",
  },
  {
    id: "privacy",
    eyebrow: "Datenschutz",
    title: "Rollen, Zwecke und Speicherfristen",
    text: "Das Datenschutzdokument erklärt Verarbeitung, Rollenmodell, Speicherfristen und Grenzen automatisierter Antworten.",
    href: "/datenschutz",
    cta: "Datenschutz",
  },
  {
    id: "processors",
    eyebrow: "Anbieterübersicht",
    title: "Unterauftragsverarbeiter offen gelistet",
    text: "Dienstleister, Zwecke und Datenkategorien sind öffentlich aufgeführt statt nur auf Anfrage versteckt.",
    href: "/unterauftragsverarbeiter",
    cta: "Anbieterliste",
  },
  {
    id: "approval",
    eyebrow: "Operativer Pfad",
    title: "Freigabeprozess statt Black Box",
    text: "Der Freigabe-Workflow zeigt, wie fehlende Angaben, Konflikte und sensible Inhalte manuell entschieden werden.",
    href: "/makler-freigabe-workflow",
    cta: "Freigabe prüfen",
  },
  {
    id: "integrations",
    eyebrow: "Go-live",
    title: "Integrationen mit sichtbarem Versandpfad",
    text: "Gmail und Outlook werden nicht nur genannt, sondern mit Setup, Statusfluss und Versandpfad erklärt.",
    href: "/integrationen",
    cta: "Integrationen",
  },
  {
    id: "pricing",
    eyebrow: "Preis & Fit",
    title: "Preis und Testlogik sind öffentlich",
    text: "Starter-Preis, Testphase und Safe-Start-Fit bleiben vor dem ersten Gespräch offen einsehbar.",
    href: "/preise",
    cta: "Preis prüfen",
  },
] as const;
