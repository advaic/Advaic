import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

import type { MarketingOgTemplate } from "@/lib/seo/marketing-metadata";

export const runtime = "edge";

const size = {
  width: 1200,
  height: 630,
};

const contentType = "image/png";

type Theme = {
  background: string;
  panel: string;
  border: string;
  accent: string;
  accentSoft: string;
  text: string;
  muted: string;
  chips: string[];
};

const themes: Record<MarketingOgTemplate, Theme> = {
  brand: {
    background: "#0b0f17",
    panel: "#111827",
    border: "rgba(255,255,255,0.12)",
    accent: "#d4a62d",
    accentSoft: "rgba(212,166,45,0.18)",
    text: "#f8f5ef",
    muted: "#c9d1dd",
    chips: ["Für Immobilienmakler", "E-Mail-Autopilot", "Mit klaren Guardrails"],
  },
  home: {
    background: "#0f1723",
    panel: "#121c2a",
    border: "rgba(212,166,45,0.22)",
    accent: "#d4a62d",
    accentSoft: "rgba(212,166,45,0.20)",
    text: "#fffaf1",
    muted: "#d3dae5",
    chips: ["Interessenten-Anfragen", "Freigabe bei Unsicherheit", "Qualitätschecks vor Versand"],
  },
  integration: {
    background: "#111722",
    panel: "#182233",
    border: "rgba(125,211,252,0.18)",
    accent: "#7dd3fc",
    accentSoft: "rgba(125,211,252,0.14)",
    text: "#f8fbff",
    muted: "#d7e0ea",
    chips: ["OAuth-Verbindung", "Gmail & Outlook", "Sicherer Versandpfad"],
  },
  product: {
    background: "#111827",
    panel: "#172234",
    border: "rgba(255,255,255,0.12)",
    accent: "#d4a62d",
    accentSoft: "rgba(212,166,45,0.16)",
    text: "#f8fafc",
    muted: "#d6dce6",
    chips: ["Eingang → Entscheidung → Versand", "Maklerfokus", "Produktlogik sichtbar"],
  },
  pricing: {
    background: "#0d1b18",
    panel: "#132622",
    border: "rgba(110,231,183,0.18)",
    accent: "#6ee7b7",
    accentSoft: "rgba(110,231,183,0.16)",
    text: "#effcf7",
    muted: "#d5ebe2",
    chips: ["199 € / 4 Wochen", "14 Tage testen", "Klarer Einstieg für Maklerteams"],
  },
  trust: {
    background: "#101820",
    panel: "#16222c",
    border: "rgba(148,163,184,0.22)",
    accent: "#7dd3fc",
    accentSoft: "rgba(125,211,252,0.14)",
    text: "#f8fafc",
    muted: "#d6dde7",
    chips: ["Guardrails", "Freigabe als Pflichtpfad", "Nachvollziehbarer Verlauf"],
  },
  compare: {
    background: "#1a1510",
    panel: "#231b13",
    border: "rgba(212,166,45,0.18)",
    accent: "#d4a62d",
    accentSoft: "rgba(212,166,45,0.16)",
    text: "#fff8ef",
    muted: "#e4d8c8",
    chips: ["Klare Kriterien", "Zeit, Risiko, Transparenz", "Kaufentscheidung mit Substanz"],
  },
  guide: {
    background: "#121521",
    panel: "#192033",
    border: "rgba(255,255,255,0.10)",
    accent: "#c4b5fd",
    accentSoft: "rgba(196,181,253,0.14)",
    text: "#f8f7ff",
    muted: "#d9d7ef",
    chips: ["Praxisleitfaden", "Operative Logik", "Sofort verständlich"],
  },
  usecase: {
    background: "#11161d",
    panel: "#17212b",
    border: "rgba(212,166,45,0.16)",
    accent: "#fbbf24",
    accentSoft: "rgba(251,191,36,0.16)",
    text: "#fffaf4",
    muted: "#dde3ea",
    chips: ["Use Cases", "Branchenfit", "Rollout mit Safe-Start"],
  },
};

function clampText(value: string, maxLength: number) {
  const cleaned = String(value || "").replace(/\s+/g, " ").trim();
  if (!cleaned) return "";
  if (cleaned.length <= maxLength) return cleaned;
  return `${cleaned.slice(0, maxLength - 1).trim()}…`;
}

function getParam(request: NextRequest, key: string, fallback: string) {
  const value = request.nextUrl.searchParams.get(key);
  return value ? clampText(value, key === "title" ? 110 : 140) : fallback;
}

export async function GET(request: NextRequest) {
  const requestedTemplate = request.nextUrl.searchParams.get("template") as MarketingOgTemplate | null;
  const template = requestedTemplate && requestedTemplate in themes ? requestedTemplate : "brand";
  const theme = themes[template];

  const eyebrow = getParam(request, "eyebrow", "Advaic");
  const title = getParam(request, "title", "E-Mail-Autopilot für Immobilienmakler");
  const proof = getParam(
    request,
    "proof",
    "Guardrails, Freigabe-Logik und Qualitätschecks vor dem Versand.",
  );

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          position: "relative",
          background: theme.background,
          color: theme.text,
          padding: "52px",
          fontFamily:
            'ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at top right, rgba(255,255,255,0.06), transparent 28%), radial-gradient(circle at bottom left, rgba(255,255,255,0.03), transparent 22%)",
          }}
        />

        <div
          style={{
            display: "flex",
            width: "100%",
            height: "100%",
            borderRadius: 34,
            overflow: "hidden",
            border: `1px solid ${theme.border}`,
            background: "rgba(255,255,255,0.03)",
          }}
        >
          <div
            style={{
              flex: 1.2,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              padding: "48px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  fontSize: 28,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color: theme.accent,
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: 999,
                    background: theme.accent,
                    boxShadow: `0 0 0 10px ${theme.accentSoft}`,
                  }}
                />
                {eyebrow}
              </div>

              <div
                style={{
                  display: "flex",
                  fontSize: 70,
                  lineHeight: 1.06,
                  fontWeight: 800,
                  letterSpacing: "-0.04em",
                }}
              >
                {title}
              </div>

              <div
                style={{
                  display: "flex",
                  maxWidth: 720,
                  fontSize: 30,
                  lineHeight: 1.35,
                  color: theme.muted,
                }}
              >
                {proof}
              </div>
            </div>

            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {theme.chips.map((chip) => (
                <div
                  key={chip}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    borderRadius: 999,
                    border: `1px solid ${theme.border}`,
                    background: theme.accentSoft,
                    padding: "12px 18px",
                    fontSize: 22,
                    fontWeight: 600,
                    color: theme.text,
                  }}
                >
                  {chip}
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              width: 320,
              background: theme.panel,
              borderLeft: `1px solid ${theme.border}`,
              padding: "42px 36px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: "20px 22px",
                  borderRadius: 24,
                  border: `1px solid ${theme.border}`,
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    fontSize: 18,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: theme.muted,
                  }}
                >
                  Warum das relevant ist
                </div>
                <div style={{ display: "flex", fontSize: 24, lineHeight: 1.35, fontWeight: 600 }}>
                  Klare Positionierung für Makler und Teams.
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {[
                  "Maklerkontext mit klarer Sprache",
                  "Kontrolle, Guardrails und Freigabe sofort erkennbar",
                  "Stärker für Shares, Suchsnippets und AI-Referenzen",
                ].map((line) => (
                  <div
                    key={line}
                    style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "flex-start",
                      fontSize: 21,
                      lineHeight: 1.35,
                      color: theme.muted,
                    }}
                  >
                    <div
                      style={{
                        width: 10,
                        height: 10,
                        marginTop: 10,
                        borderRadius: 999,
                        background: theme.accent,
                        flexShrink: 0,
                      }}
                    />
                    {line}
                  </div>
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: 22,
                color: theme.muted,
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 999,
                    background: theme.accent,
                  }}
                />
                Advaic
              </div>
              <div style={{ display: "flex" }}>advaic.com</div>
            </div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
