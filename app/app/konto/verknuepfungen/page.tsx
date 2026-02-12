"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";

import { FcGoogle } from "react-icons/fc";
import {
  FaMicrosoft,
  FaSlack,
  FaCheckCircle,
  FaExclamationTriangle,
  FaHome,
} from "react-icons/fa";

type Provider = "gmail" | "immoscout" | "outlook" | "slack";

type ServiceCard = {
  id: Provider;
  name: string;
  description: string;
  icon: React.ReactNode;
  enabled: boolean;
};

type GmailConnectionRow = {
  email_address: string | null;
  status: string | null;
} | null;

type OutlookConnectionRow = {
  email_address: string | null;
  status: string | null;
} | null;

type ImmoScoutConnectionRow = {
  status: string | null;
  account_label: string | null;
} | null;

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function VerknuepfungenPage() {
  const supabase = useSupabaseClient<Database>();
  const searchParams = useSearchParams();

  const gmailParam = searchParams.get("gmail");
  const outlookParam = searchParams.get("outlook");
  const immoscoutParam = searchParams.get("immoscout");
  const reasonParam = searchParams.get("reason");

  const [loading, setLoading] = useState(true);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [gmailStatus, setGmailStatus] = useState<string | null>(null);

  const [outlookConnected, setOutlookConnected] = useState(false);
  const [outlookEmail, setOutlookEmail] = useState<string | null>(null);
  const [outlookStatus, setOutlookStatus] = useState<string | null>(null);

  const [immoscoutConnected, setImmoscoutConnected] = useState(false);
  const [immoscoutLabel, setImmoscoutLabel] = useState<string | null>(null);
  const [immoscoutStatus, setImmoscoutStatus] = useState<string | null>(null);

  const cards: ServiceCard[] = useMemo(
    () => [
      {
        id: "gmail",
        name: "Gmail",
        description:
          "Verbinde dein Gmail-Postfach, damit Advaic E-Mails direkt in deinem Namen senden und eingehende Nachrichten lesen kann.",
        icon: <FcGoogle size={26} />,
        enabled: true,
      },
      {
        id: "immoscout",
        name: "ImmoScout24",
        description:
          "Sync deiner Listings in (nahezu) Echtzeit (alle 2 Minuten) – damit Advaic immer mit aktuellen Objektdaten antwortet. Aktivierung erfordert ImmoScout API-Zugang.",
        icon: <FaHome size={22} className="text-gray-900" />,
        enabled: true,
      },
      {
        id: "outlook",
        name: "Microsoft 365",
        description:
          "Verbinde dein Microsoft 365/Outlook-Postfach, damit Advaic E-Mails direkt in deinem Namen senden und eingehende Nachrichten lesen kann.",
        icon: <FaMicrosoft size={22} color="#0078D4" />,
        enabled: true,
      },
      {
        id: "slack",
        name: "Slack",
        description: "Benachrichtigungen in Slack (kommt bald).",
        icon: <FaSlack size={22} color="#4A154B" />,
        enabled: false,
      },
    ],
    []
  );

  const startGmailOAuth = useCallback(() => {
    const next = "/app/konto/verknuepfungen";
    window.location.assign(
      `/api/auth/gmail/start?next=${encodeURIComponent(next)}`
    );
  }, []);

  const startOutlookOAuth = useCallback(() => {
    const next = "/app/konto/verknuepfungen";
    window.location.assign(
      `/api/auth/outlook/start?next=${encodeURIComponent(next)}`
    );
  }, []);

  const startImmoScoutOAuth = useCallback(() => {
    const next = "/app/konto/verknuepfungen";
    window.location.assign(
      `/api/auth/immoscout/start?next=${encodeURIComponent(next)}`
    );
  }, []);

  const loadGmailConnection = useCallback(async () => {
    setLoading(true);

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("[verknuepfungen] error getting user:", userError);
    }

    if (!user) {
      setGmailConnected(false);
      setGmailEmail(null);
      setGmailStatus(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("email_connections")
      .select("email_address,status")
      .eq("agent_id", user.id)
      .eq("provider", "gmail")
      .maybeSingle<GmailConnectionRow>();

    if (error) {
      console.error("[verknuepfungen] error loading gmail connection:", error);
      setGmailConnected(false);
      setGmailEmail(null);
      setGmailStatus(null);
      setLoading(false);
      return;
    }

    const status = data?.status ?? null;
    const connected = status === "connected";

    setGmailConnected(connected);
    setGmailEmail(data?.email_address ?? null);
    setGmailStatus(status);
    setLoading(false);
  }, [supabase]);

  const loadOutlookConnection = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("[verknuepfungen] error getting user:", userError);
    }

    if (!user) {
      setOutlookConnected(false);
      setOutlookEmail(null);
      setOutlookStatus(null);
      return;
    }

    const { data, error } = await supabase
      .from("email_connections")
      .select("email_address,status")
      .eq("agent_id", user.id)
      .eq("provider", "outlook")
      .maybeSingle<OutlookConnectionRow>();

    if (error) {
      console.error(
        "[verknuepfungen] error loading outlook connection:",
        error
      );
      setOutlookConnected(false);
      setOutlookEmail(null);
      setOutlookStatus(null);
      return;
    }

    const status = data?.status ?? null;
    const connected = status === "connected" || status === "active";

    setOutlookConnected(connected);
    setOutlookEmail(data?.email_address ?? null);
    setOutlookStatus(status);
  }, [supabase]);

  const loadImmoScoutConnection = useCallback(async () => {
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("[verknuepfungen] error getting user:", userError);
    }

    if (!user) {
      setImmoscoutConnected(false);
      setImmoscoutLabel(null);
      setImmoscoutStatus(null);
      return;
    }

    const { data, error } = await (supabase
      .from("immoscout_connections" as any)
      .select("status,account_label")
      .eq("agent_id", user.id)
      .maybeSingle() as any);

    if (error) {
      console.error(
        "[verknuepfungen] error loading immoscout connection:",
        error
      );
      setImmoscoutConnected(false);
      setImmoscoutLabel(null);
      setImmoscoutStatus(null);
      return;
    }

    const status = (data as any)?.status ?? null;
    const connected = status === "connected" || status === "active";

    setImmoscoutConnected(connected);
    setImmoscoutLabel((data as any)?.account_label ?? null);
    setImmoscoutStatus(status);
  }, [supabase]);

  useEffect(() => {
    loadGmailConnection();
    loadOutlookConnection();
    loadImmoScoutConnection();
  }, [
    loadGmailConnection,
    loadOutlookConnection,
    loadImmoScoutConnection,
    gmailParam,
    outlookParam,
    immoscoutParam,
  ]);

  const banner = useMemo(() => {
    const which = gmailParam
      ? "gmail"
      : outlookParam
      ? "outlook"
      : immoscoutParam
      ? "immoscout"
      : null;

    const value =
      which === "gmail"
        ? gmailParam
        : which === "outlook"
        ? outlookParam
        : which === "immoscout"
        ? immoscoutParam
        : null;

    if (!which || !value) return null;

    if (value === "connected") {
      return {
        tone: "success" as const,
        title: `${
          which === "gmail"
            ? "Gmail"
            : which === "outlook"
            ? "Microsoft 365"
            : "ImmoScout24"
        } verbunden`,
        body: "Die Verbindung wurde erfolgreich gespeichert.",
      };
    }

    if (value === "missing_code") {
      return {
        tone: "warning" as const,
        title: "Verbindung abgebrochen",
        body: "Es wurde kein Code zurückgegeben. Bitte versuche es erneut.",
      };
    }

    if (value === "not_configured") {
      return {
        tone: "warning" as const,
        title: "ImmoScout24 noch nicht konfiguriert",
        body: "Für ImmoScout24 fehlen noch API-Credentials (Consumer Key/Secret). Hinterlege sie in den ENV Variablen und versuche es erneut.",
      };
    }

    if (value === "error") {
      return {
        tone: "danger" as const,
        title: `${
          which === "gmail"
            ? "Gmail"
            : which === "outlook"
            ? "Microsoft 365"
            : "ImmoScout24"
        } Verbindung fehlgeschlagen`,
        body: reasonParam
          ? `Grund: ${reasonParam}`
          : "Bitte versuche es erneut. Wenn es weiter scheitert, prüfe die OAuth Einstellungen.",
      };
    }

    return null;
  }, [gmailParam, outlookParam, immoscoutParam, reasonParam]);

return (
    <div className="max-w-3xl mx-auto p-6" data-tour="links-page">
      <div className="mb-6" data-tour="links-header">
        <h1 className="text-2xl font-semibold" data-tour="links-title">Verknüpfte Dienste</h1>
        <p className="mt-1 text-sm text-gray-600" data-tour="links-subtitle">
          Verbinde deine Tools, damit Advaic automatisiert für dich arbeiten
          kann. Du kannst Verknüpfungen jederzeit erneuern.
        </p>
      </div>

      {banner && (
        <div
          data-tour="links-banner"
          className={classNames(
            "mb-6 rounded-md border p-4 text-sm",
            banner.tone === "success" &&
              "border-green-200 bg-green-50 text-green-900",
            banner.tone === "warning" &&
              "border-amber-200 bg-amber-50 text-amber-900",
            banner.tone === "danger" && "border-red-200 bg-red-50 text-red-900"
          )}
        >
          <div className="font-medium">{banner.title}</div>
          <div className="mt-1 opacity-90">{banner.body}</div>
        </div>
      )}

      <div className="space-y-4" data-tour="links-cards">
        {cards.map((service) => {
          const isGmail = service.id === "gmail";
          const isOutlook = service.id === "outlook";
          const isImmoScout = service.id === "immoscout";

          const statusBadge = (() => {
            if (!isGmail && !isImmoScout && !isOutlook) return null;

            if (loading && isGmail) {
              return (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  Prüfe…
                </span>
              );
            }

            if (isGmail) {
              if (gmailConnected) {
                return (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                    <FaCheckCircle className="mr-1" /> Verbunden
                  </span>
                );
              }

              if (gmailStatus === "needs_reconnect") {
                return (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                    <FaExclamationTriangle className="mr-1" /> Neu verbinden
                  </span>
                );
              }

              return (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  Nicht verbunden
                </span>
              );
            }

            if (isOutlook) {
              if (outlookConnected) {
                return (
                  <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                    <FaCheckCircle className="mr-1" /> Verbunden
                  </span>
                );
              }

              if (outlookStatus === "needs_reconnect") {
                return (
                  <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                    <FaExclamationTriangle className="mr-1" /> Neu verbinden
                  </span>
                );
              }

              return (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  Nicht verbunden
                </span>
              );
            }

            // ImmoScout
            if (immoscoutConnected) {
              return (
                <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                  <FaCheckCircle className="mr-1" /> Verbunden
                </span>
              );
            }

            if (immoscoutStatus === "needs_reconnect") {
              return (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800">
                  <FaExclamationTriangle className="mr-1" /> Neu verbinden
                </span>
              );
            }

            return (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                Nicht verbunden
              </span>
            );
          })();

          return (
            <div
              key={service.id}
              data-tour={`link-card-${service.id}`}
              className={classNames(
                "flex items-start justify-between gap-4 rounded-lg border bg-white p-5",
                !service.enabled && "opacity-75"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1" data-tour={`link-icon-${service.id}`}>{service.icon}</div>

                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold text-gray-900" data-tour={`link-name-${service.id}`}>
                      {service.name}
                    </h2>
                    {statusBadge}
                  </div>

                  <p className="mt-1 text-sm text-gray-600 max-w-xl" data-tour={`link-desc-${service.id}`}>
                    {service.description}
                  </p>

                  {isGmail && !loading && gmailConnected && (
                    <div className="mt-3 text-sm text-gray-900" data-tour="link-gmail-connected-as">
                      <span className="text-gray-600">Verbunden als:</span>{" "}
                      <span className="font-medium">{gmailEmail ?? "—"}</span>
                    </div>
                  )}

                  {isGmail &&
                    !loading &&
                    !gmailConnected &&
                    gmailStatus === "needs_reconnect" && (
                      <div className="mt-3 text-sm text-amber-800">
                        Verbindung abgelaufen – bitte neu verbinden.
                      </div>
                    )}

                  {isOutlook && outlookConnected && (
                    <div className="mt-3 text-sm text-gray-900" data-tour="link-outlook-connected-as">
                      <span className="text-gray-600">Verbunden als:</span>{" "}
                      <span className="font-medium">{outlookEmail ?? "—"}</span>
                    </div>
                  )}

                  {isOutlook &&
                    !outlookConnected &&
                    outlookStatus === "needs_reconnect" && (
                      <div className="mt-3 text-sm text-amber-800">
                        Verbindung abgelaufen – bitte neu verbinden.
                      </div>
                    )}

                  {isImmoScout && (
                    <div className="mt-3 text-sm text-gray-700" data-tour="link-immoscout-info">
                      {immoscoutConnected ? (
                        <>
                          <span className="text-gray-600">Verbunden als:</span>{" "}
                          <span className="font-medium">
                            {immoscoutLabel ?? "ImmoScout Account"}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium">
                            Noch nicht verbunden:
                          </span>{" "}
                          Hinterlege zuerst ImmoScout API Credentials (Consumer
                          Key/Secret) im Backend.
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2" data-tour={`link-actions-${service.id}`}>
                {service.enabled ? (
                  isGmail ? (
                    gmailConnected ? (
                      <>
                        <button
                          data-tour="link-gmail-reconnect"
                          type="button"
                          onClick={startGmailOAuth}
                          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                          title="Falls du die Verbindung erneuern willst"
                        >
                          Neu verbinden
                        </button>
                        <button
                          type="button"
                          onClick={loadGmailConnection}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Status aktualisieren
                        </button>
                      </>
                    ) : (
                      <button
                        data-tour="link-gmail-connect"
                        type="button"
                        onClick={startGmailOAuth}
                        disabled={loading}
                        className={classNames(
                          "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium",
                          loading
                            ? "bg-gray-200 text-gray-500"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                        )}
                      >
                        Gmail verbinden
                      </button>
                    )
                  ) : isImmoScout ? (
                    immoscoutConnected ? (
                      <>
                        <button
                          data-tour="link-immoscout-reconnect"
                          type="button"
                          onClick={startImmoScoutOAuth}
                          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                          title="Falls du die Verbindung erneuern willst"
                        >
                          Neu verbinden
                        </button>
                        <button
                          type="button"
                          onClick={loadImmoScoutConnection}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Status aktualisieren
                        </button>
                      </>
                    ) : (
                      <button
                        data-tour="link-immoscout-connect"
                        type="button"
                        onClick={startImmoScoutOAuth}
                        className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-gray-900 text-amber-200 hover:bg-gray-800"
                      >
                        ImmoScout verbinden
                      </button>
                    )
                  ) : isOutlook ? (
                    outlookConnected ? (
                      <>
                        <button
                          data-tour="link-outlook-reconnect"
                          type="button"
                          onClick={startOutlookOAuth}
                          className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
                          title="Falls du die Verbindung erneuern willst"
                        >
                          Neu verbinden
                        </button>
                        <button
                          type="button"
                          onClick={loadOutlookConnection}
                          className="text-xs text-gray-500 hover:text-gray-700"
                        >
                          Status aktualisieren
                        </button>
                      </>
                    ) : (
                      <button
                        data-tour="link-outlook-connect"
                        type="button"
                        onClick={startOutlookOAuth}
                        className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Microsoft 365 verbinden
                      </button>
                    )
                  ) : (
                    <button
                      type="button"
                      disabled
                      className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400"
                    >
                      Bald verfügbar
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    disabled
                    className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-400"
                    title={
                      service.id === "immoscout"
                        ? "ImmoScout24 OAuth erfordert API Credentials (Consumer Key/Secret)."
                        : undefined
                    }
                  >
                    {service.id === "immoscout"
                      ? "API-Zugang nötig"
                      : "Bald verfügbar"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg border bg-gray-50 p-4 text-sm text-gray-700" data-tour="links-note">
        <div className="font-medium">Hinweis</div>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>
            Gmail und Microsoft 365 sind verfügbar. ImmoScout24 ist vorbereitet
            (Sync alle 2 Minuten), benötigt aber API-Credentials (Consumer
            Key/Secret). Slack folgt danach.
          </li>
          <li>
            Advaic speichert die Verbindung, damit Antworten direkt aus deinem
            Postfach gesendet werden können.
          </li>
        </ul>
      </div>
    </div>
  );
}
