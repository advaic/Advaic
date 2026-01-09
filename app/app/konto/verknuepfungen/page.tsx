"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";

import { FcGoogle } from "react-icons/fc";
import { FaMicrosoft, FaSlack, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

type Provider = "gmail" | "outlook" | "slack";

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

function classNames(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function VerknuepfungenPage() {
  const supabase = useSupabaseClient<Database>();
  const searchParams = useSearchParams();

  const gmailParam = searchParams.get("gmail");
  const reasonParam = searchParams.get("reason");

  const [loading, setLoading] = useState(true);
  const [gmailConnected, setGmailConnected] = useState(false);
  const [gmailEmail, setGmailEmail] = useState<string | null>(null);
  const [gmailStatus, setGmailStatus] = useState<string | null>(null);

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
        id: "outlook",
        name: "Microsoft 365",
        description: "Outlook/Exchange Verbindung (kommt bald).",
        icon: <FaMicrosoft size={22} color="#0078D4" />,
        enabled: false,
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
    // Keep next as a plain path. The start route will encode via URLSearchParams.
    const next = "/app/konto/verknuepfungen";
    window.location.assign(`/api/auth/gmail/start?next=${encodeURIComponent(next)}`);
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

  // Load on mount and re-check when returning from OAuth (`?gmail=...`).
  useEffect(() => {
    loadGmailConnection();
  }, [loadGmailConnection, gmailParam]);

  const banner = useMemo(() => {
    if (!gmailParam) return null;

    if (gmailParam === "connected") {
      return {
        tone: "success" as const,
        title: "Gmail verbunden",
        body: "Die Verbindung wurde erfolgreich gespeichert.",
      };
    }

    if (gmailParam === "missing_code") {
      return {
        tone: "warning" as const,
        title: "Verbindung abgebrochen",
        body: "Google hat keinen Code zurückgegeben. Bitte versuche es erneut.",
      };
    }

    if (gmailParam === "error") {
      return {
        tone: "danger" as const,
        title: "Gmail Verbindung fehlgeschlagen",
        body: reasonParam
          ? `Grund: ${reasonParam}`
          : "Bitte versuche es erneut. Wenn es weiter scheitert, prüfe die Google OAuth Einstellungen.",
      };
    }

    return null;
  }, [gmailParam, reasonParam]);

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold">Verknüpfte Dienste</h1>
        <p className="mt-1 text-sm text-gray-600">
          Verbinde deine Tools, damit Advaic automatisiert für dich arbeiten kann. Du kannst Verknüpfungen jederzeit erneuern.
        </p>
      </div>

      {banner && (
        <div
          className={classNames(
            "mb-6 rounded-md border p-4 text-sm",
            banner.tone === "success" && "border-green-200 bg-green-50 text-green-900",
            banner.tone === "warning" && "border-amber-200 bg-amber-50 text-amber-900",
            banner.tone === "danger" && "border-red-200 bg-red-50 text-red-900"
          )}
        >
          <div className="font-medium">{banner.title}</div>
          <div className="mt-1 opacity-90">{banner.body}</div>
        </div>
      )}

      <div className="space-y-4">
        {cards.map((service) => {
          const isGmail = service.id === "gmail";

          const statusBadge = (() => {
            if (!isGmail) return null;
            if (loading) {
              return (
                <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  Prüfe…
                </span>
              );
            }

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
          })();

          return (
            <div
              key={service.id}
              className={classNames(
                "flex items-start justify-between gap-4 rounded-lg border bg-white p-5",
                !service.enabled && "opacity-75"
              )}
            >
              <div className="flex items-start gap-4">
                <div className="mt-1">{service.icon}</div>

                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-semibold text-gray-900">
                      {service.name}
                    </h2>
                    {statusBadge}
                  </div>

                  <p className="mt-1 text-sm text-gray-600 max-w-xl">
                    {service.description}
                  </p>

                  {isGmail && !loading && gmailConnected && (
                    <div className="mt-3 text-sm text-gray-900">
                      <span className="text-gray-600">Verbunden als:</span>{" "}
                      <span className="font-medium">{gmailEmail ?? "—"}</span>
                    </div>
                  )}

                  {isGmail && !loading && !gmailConnected && gmailStatus === "needs_reconnect" && (
                    <div className="mt-3 text-sm text-amber-800">
                      Verbindung abgelaufen – bitte neu verbinden.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-2">
                {service.enabled ? (
                  isGmail ? (
                    gmailConnected ? (
                      <>
                        <button
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
                  >
                    Bald verfügbar
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 rounded-lg border bg-gray-50 p-4 text-sm text-gray-700">
        <div className="font-medium">Hinweis</div>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Für den Start unterstützen wir Gmail zuerst. Outlook und Slack folgen als nächstes.</li>
          <li>Advaic speichert die Verbindung, damit Antworten direkt aus deinem Postfach gesendet werden können.</li>
        </ul>
      </div>
    </div>
  );
}
