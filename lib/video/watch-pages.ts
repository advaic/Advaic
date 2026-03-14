import { getProductionVideo, getProductionVideoRuntimeMs, type ProductionVideo } from "@/lib/video/production-videos";

export type VideoWatchPageConfig = {
  slug: string;
  videoId: string;
  kicker: string;
  title: string;
  description: string;
  intro: string;
  primaryCtaHref: string;
  primaryCtaLabel: string;
  secondaryCtaHref: string;
  secondaryCtaLabel: string;
  relatedLinks: Array<{
    title: string;
    href: string;
    text: string;
  }>;
};

export const videoWatchPages: VideoWatchPageConfig[] = [
  {
    slug: "tagesgeschaeft",
    videoId: "tagesgeschaeft",
    kicker: "Video-Demo",
    title: "Wie Advaic im Tagesgeschäft arbeitet",
    description:
      "Die Demo zeigt den Ablauf vom Eingang über die Arbeitsqueue bis zur Freigabe und dem kontrollierten Rollout im Makleralltag.",
    intro:
      "Dieses Video zeigt den normalen Tagesablauf mit Advaic: Welche Fälle zuerst sichtbar werden, wie Konversation und Kontext zusammenlaufen und warum Freigabe und Safe-Start operativ wichtig sind.",
    primaryCtaHref: "/signup",
    primaryCtaLabel: "14 Tage testen",
    secondaryCtaHref: "/produkt",
    secondaryCtaLabel: "Produkt ansehen",
    relatedLinks: [
      {
        title: "Produktseite",
        href: "/produkt",
        text: "Die wichtigsten Produktmodule mit echten Screens und Entscheidungslogik.",
      },
      {
        title: "So funktioniert's",
        href: "/so-funktionierts",
        text: "Der Prozess von Eingang, Regeln, Freigabe und Versand Schritt für Schritt.",
      },
      {
        title: "Freigabe-Inbox",
        href: "/freigabe-inbox",
        text: "Wie Freigaben priorisiert, geprüft und dokumentiert werden.",
      },
    ],
  },
  {
    slug: "auto-vs-freigabe",
    videoId: "auto-vs-freigabe",
    kicker: "Video-Demo",
    title: "Wann automatisch gesendet wird und wann nicht",
    description:
      "Die Demo erklärt die Regel- und Qualitätslogik zwischen Auto-Versand und Freigabe mit konkreten Kriterien statt Marketing-Sprache.",
    intro:
      "Dieses Video beantwortet die wichtigste Kauf- und Vertrauensfrage: Wann darf Advaic wirklich senden und wann stoppt das System bewusst wegen fehlender Informationen, Risiko oder Freigabebedarf?",
    primaryCtaHref: "/autopilot-regeln",
    primaryCtaLabel: "Regeln im Detail ansehen",
    secondaryCtaHref: "/signup",
    secondaryCtaLabel: "14 Tage testen",
    relatedLinks: [
      {
        title: "Autopilot-Regeln",
        href: "/autopilot-regeln",
        text: "Die konkrete Logik für Auto, Freigabe und Ignorieren im Detail.",
      },
      {
        title: "Sicherheit",
        href: "/sicherheit",
        text: "Guardrails, Freigabe und Qualitätsgrenzen vor dem Versand.",
      },
      {
        title: "Qualitätschecks",
        href: "/qualitaetschecks",
        text: "Relevanz, Vollständigkeit, Ton und Risiko vor jedem Versand.",
      },
    ],
  },
  {
    slug: "qualitaetschecks-followups",
    videoId: "qualitaetschecks-followups",
    kicker: "Video-Demo",
    title: "Qualitätschecks und Follow-ups im Live-Betrieb",
    description:
      "Die Demo zeigt, wie Stil-Setup, Qualitätschecks und Follow-up-Logik zusammenspielen, damit Antworten konsistent bleiben und Nachfassketten kontrolliert stoppen.",
    intro:
      "Dieses Video zeigt, warum Automatisierung nicht an der ersten Antwort hängt, sondern an sauberem Stil, belastbaren Qualitätschecks und einer Follow-up-Logik, die bei Reaktion oder Risiko stoppt.",
    primaryCtaHref: "/produkt",
    primaryCtaLabel: "Produkt ansehen",
    secondaryCtaHref: "/signup",
    secondaryCtaLabel: "14 Tage testen",
    relatedLinks: [
      {
        title: "Ton & Stil",
        href: "/produkt#stil",
        text: "Wie Tonalität, Länge und Guardrails im Setup gepflegt werden.",
      },
      {
        title: "Follow-up-Logik",
        href: "/follow-up-logik",
        text: "Stop-Regeln, Stufen und Verlauf im echten Betrieb.",
      },
      {
        title: "Qualitätschecks",
        href: "/qualitaetschecks",
        text: "Welche Prüfungen vor dem Versand laufen und warum sie blockieren.",
      },
    ],
  },
];

export function getVideoWatchPage(slug: string) {
  return videoWatchPages.find((item) => item.slug === slug) ?? null;
}

export function getVideoWatchPayload(slug: string): (VideoWatchPageConfig & {
  video: ProductionVideo;
  runtimeMs: number;
}) | null {
  const page = getVideoWatchPage(slug);
  if (!page) return null;
  const video = getProductionVideo(page.videoId);
  if (!video) return null;

  return {
    ...page,
    video,
    runtimeMs: getProductionVideoRuntimeMs(video),
  };
}
