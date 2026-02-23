"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";

import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Save } from "lucide-react";

// =========================
// Types
// =========================

type NotificationToggles = {
  newLeads: boolean;
  escalations: boolean;
  followUps: boolean;
  systemMessages: boolean;
};

type DeliveryToggles = {
  email: boolean;
  whatsapp: boolean;
  dashboard: boolean;
  slack: boolean;
};

type ContactInfo = {
  email: string;
  phone: string;
};

type TimeWindow = {
  start: string; // HH:MM
  end: string; // HH:MM
};

type SettingsRow = {
  agent_id: string;
  notifications: NotificationToggles;
  delivery: DeliveryToggles;
  contact_email: string | null;
  contact_phone: string | null;
  window_start: string | null;
  window_end: string | null;
  note: string | null;
  // Slack (optional)
  slack_connected: boolean | null;
  slack_team_name: string | null;
  slack_team_id: string | null;
  slack_authed_at: string | null;
};

// =========================
// Defaults
// =========================

const DEFAULT_NOTIFICATIONS: NotificationToggles = {
  newLeads: true,
  escalations: true,
  followUps: true,
  systemMessages: true,
};

const DEFAULT_DELIVERY: DeliveryToggles = {
  email: true,
  whatsapp: true,
  dashboard: true,
  slack: false,
};

const DEFAULT_CONTACT: ContactInfo = {
  email: "",
  phone: "",
};

const DEFAULT_WINDOW: TimeWindow = {
  start: "08:00",
  end: "20:00",
};

function clampTime(v: string): string {
  // very small guard; if invalid, fallback
  if (!/^\d{2}:\d{2}$/.test(v)) return "";
  return v;
}

function safeStr(v: unknown): string {
  return String(v ?? "").trim();
}

export default function NotificationSettingsPage() {
  const supabase = useSupabaseClient<Database>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const [notifications, setNotifications] = useState<NotificationToggles>(
    DEFAULT_NOTIFICATIONS
  );
  const [delivery, setDelivery] = useState<DeliveryToggles>(DEFAULT_DELIVERY);
  const [contactInfo, setContactInfo] = useState<ContactInfo>(DEFAULT_CONTACT);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>(DEFAULT_WINDOW);
  const [note, setNote] = useState<string>("");

  const [slackConnected, setSlackConnected] = useState(false);
  const [slackTeamName, setSlackTeamName] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Used to avoid overwriting user edits if realtime/refresh ever gets added later
  const [loadedOnce, setLoadedOnce] = useState(false);

  const isDirty = useMemo(() => {
    // basic dirty detection (not perfect, but good UX)
    if (!loadedOnce) return false;
    return true;
  }, [loadedOnce]);

  async function requireUserId(): Promise<string | null> {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user?.id) {
      showToast("Nicht eingeloggt. Bitte neu einloggen.");
      return null;
    }
    return user.id;
  }

  // Slack connect
  const connectSlack = () => {
    // NOTE: This is the only piece that is still "plumbing".
    // The callback route is expected to persist Slack connection fields server-side.
    const clientId = "8782700628515.9149893466422";
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/api/slack/callback`
    );
    const scopes = encodeURIComponent("chat:write,users:read,channels:read");

    window.location.href =
      `https://slack.com/oauth/v2/authorize?client_id=${clientId}` +
      `&scope=${scopes}&redirect_uri=${redirectUri}`;
  };

  // Load
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const userId = await requireUserId();
        if (!userId || cancelled) return;

        // Optional: show toast after Slack connect redirect
        const slack = searchParams?.get("slack") ?? "";
        if (slack === "connected") {
          showToast("Slack ist verbunden.");
          // clean URL param
          const sp = new URLSearchParams(searchParams?.toString() ?? "");
          sp.delete("slack");
          router.replace(sp.toString() ? `?${sp}` : "?");
        }

        const { data, error } = await supabase
          .from("agent_notification_settings" as any)
          .select(
            "agent_id, notifications, delivery, contact_email, contact_phone, window_start, window_end, note, slack_connected, slack_team_name, slack_team_id, slack_authed_at"
          )
          .eq("agent_id", userId)
          .maybeSingle();

        if (error) {
          console.error("[notifications] load error", error);
          // fall back to defaults (page should still work)
          return;
        }

        if (!cancelled && data) {
          const row = data as unknown as SettingsRow;
          setNotifications((row.notifications as any) ?? DEFAULT_NOTIFICATIONS);
          setDelivery((row.delivery as any) ?? DEFAULT_DELIVERY);
          setContactInfo({
            email: safeStr(row.contact_email),
            phone: safeStr(row.contact_phone),
          });
          setTimeWindow({
            start: clampTime(safeStr(row.window_start)) || DEFAULT_WINDOW.start,
            end: clampTime(safeStr(row.window_end)) || DEFAULT_WINDOW.end,
          });
          setNote(safeStr(row.note));

          setSlackConnected(!!row.slack_connected);
          setSlackTeamName(row.slack_team_name ?? null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setLoadedOnce(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = (key: string, group: "notifications" | "delivery") => {
    if (group === "notifications") {
      setNotifications((prev) => ({
        ...prev,
        [key]: !prev[key as keyof NotificationToggles],
      }));
    } else {
      setDelivery((prev) => ({
        ...prev,
        [key]: !prev[key as keyof DeliveryToggles],
      }));
    }
  };

  const validate = () => {
    // minimal validation: if a channel is enabled, ensure contact exists
    if (delivery.email && !safeStr(contactInfo.email)) {
      showToast("Bitte eine E-Mail-Adresse hinterlegen (für E-Mail-Benachrichtigungen).");
      return false;
    }

    if (delivery.whatsapp && !safeStr(contactInfo.phone)) {
      showToast(
        "Bitte eine Telefonnummer hinterlegen (für WhatsApp-Benachrichtigungen)."
      );
      return false;
    }

    const start = clampTime(timeWindow.start);
    const end = clampTime(timeWindow.end);
    if (!start || !end) {
      showToast("Bitte ein gültiges Zeitfenster einstellen.");
      return false;
    }

    return true;
  };

  const saveSettings = async () => {
    if (!validate()) return;

    const userId = await requireUserId();
    if (!userId) return;

    setSaving(true);
    try {
      const payload: Partial<SettingsRow> = {
        agent_id: userId,
        notifications,
        delivery,
        contact_email: safeStr(contactInfo.email) || null,
        contact_phone: safeStr(contactInfo.phone) || null,
        window_start: clampTime(timeWindow.start) || null,
        window_end: clampTime(timeWindow.end) || null,
        note: safeStr(note) || null,
      };

      const { error } = await supabase
        .from("agent_notification_settings" as any)
        .upsert(payload as any, { onConflict: "agent_id" });

      if (error) {
        console.error("[notifications] save error", error);
        showToast("Konnte Einstellungen nicht speichern.");
        return;
      }

      showToast("Einstellungen gespeichert.");
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <main
      className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900"
      data-tour="notifications-page"
    >
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6" data-tour="notifications-container">
        <div className="flex items-start justify-between gap-3" data-tour="notifications-header">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-semibold">Benachrichtigungen</h1>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200">
                Advaic
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Steuern Sie, wann und wie Sie über neue Ereignisse informiert werden.
              So verpassen Sie keine wichtigen Updates – und behalten trotzdem die Kontrolle.
            </p>
          </div>

          <div className="shrink-0">
            <Button
              onClick={saveSettings}
              disabled={saving || loading}
              className="rounded-lg bg-gray-900 text-amber-200 hover:bg-gray-800 gap-2"
              data-tour="notifications-save"
              title="Einstellungen speichern"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Speichern
            </Button>
          </div>
        </div>

        <div className="h-4" />

        {loading ? (
          <Card className="rounded-2xl border border-gray-200 bg-white p-5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Einstellungen werden geladen…
            </div>
          </Card>
        ) : (
          <>
            {/* Types */}
            <Card className="rounded-2xl border border-gray-200 bg-white p-5" data-tour="notifications-types">
              <h2 className="text-sm font-semibold">Benachrichtigungsarten</h2>
              <p className="text-sm text-gray-600 mt-1">
                Für welche Ereignisse möchten Sie benachrichtigt werden?
              </p>

              <div className="mt-4 space-y-4" data-tour="notifications-types-toggles">
                {(
                  Object.entries(notifications) as Array<
                    [keyof NotificationToggles, boolean]
                  >
                ).map(([key, value]) => (
                  <div className="flex items-center justify-between" key={key}>
                    <span className="text-sm text-gray-900">
                      {key === "newLeads"
                        ? "Neue Interessenten"
                        : key === "escalations"
                        ? "Eskalationen / Übergaben"
                        : key === "followUps"
                        ? "Follow-up Erinnerungen"
                        : "Systemhinweise"}
                    </span>
                    <Switch
                      checked={value}
                      onCheckedChange={() => handleToggle(String(key), "notifications")}
                    />
                  </div>
                ))}
              </div>
            </Card>

            <Separator className="my-6" />

            {/* Channels */}
            <Card className="rounded-2xl border border-gray-200 bg-white p-5" data-tour="notifications-channels">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-semibold">Empfangskanäle</h2>
                  <p className="text-sm text-gray-600 mt-1">
                    Auf welchen Wegen möchten Sie Benachrichtigungen erhalten?
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {slackConnected ? (
                    <Badge className="bg-emerald-50 text-emerald-800 border border-emerald-200" variant="outline">
                      Slack verbunden{slackTeamName ? `: ${slackTeamName}` : ""}
                    </Badge>
                  ) : (
                    <Badge className="bg-white border border-gray-200 text-gray-700" variant="outline">
                      Slack nicht verbunden
                    </Badge>
                  )}
                </div>
              </div>

              <div className="mt-4 space-y-4" data-tour="notifications-channels-toggles">
                {(
                  Object.entries(delivery) as Array<[keyof DeliveryToggles, boolean]>
                ).map(([key, value]) => (
                  <div className="flex items-center justify-between" key={key}>
                    <span className="text-sm text-gray-900">
                      {key === "email"
                        ? "E-Mail"
                        : key === "whatsapp"
                        ? "WhatsApp"
                        : key === "dashboard"
                        ? "Dashboard"
                        : "Slack"}
                    </span>
                    <Switch
                      checked={value}
                      onCheckedChange={() => handleToggle(String(key), "delivery")}
                    />
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-gray-200 bg-[#fbfbfc] p-4">
                <div className="text-sm font-medium text-gray-900">Slack</div>
                <div className="text-sm text-gray-600 mt-1">
                  Optional: Slack verbindet sich direkt mit Ihrem Workspace. Advaic kann dort Hinweise
                  zu Eskalationen, Follow-ups und neuen Interessenten senden.
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={connectSlack}
                    className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#4A154B] text-white font-medium hover:brightness-110 transition"
                    data-tour="notifications-connect-slack"
                    type="button"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="20"
                      height="20"
                      viewBox="0 0 122.8 122.8"
                      fill="none"
                    >
                      <path
                        d="M30.3 77.2c0 8.4-6.8 15.2-15.2 15.2S0 85.6 0 77.2s6.8-15.2 15.2-15.2h15.1v15.2z"
                        fill="#E01E5A"
                      />
                      <path
                        d="M37.9 77.2c0-8.4 6.8-15.2 15.2-15.2s15.2 6.8 15.2 15.2v37.9c0 8.4-6.8 15.2-15.2 15.2s-15.2-6.8-15.2-15.2V77.2z"
                        fill="#E01E5A"
                      />
                      <path
                        d="M45.5 30.3c-8.4 0-15.2-6.8-15.2-15.2S37.1 0 45.5 0s15.2 6.8 15.2 15.2v15.1H45.5z"
                        fill="#36C5F0"
                      />
                      <path
                        d="M45.5 37.9c8.4 0 15.2 6.8 15.2 15.2S53.9 68.3 45.5 68.3H7.6c-8.4 0-15.2-6.8-15.2-15.2S-0.8 37.9 7.6 37.9h37.9z"
                        fill="#36C5F0"
                      />
                      <path
                        d="M92.5 45.5c0-8.4 6.8-15.2 15.2-15.2s15.2 6.8 15.2 15.2-6.8 15.2-15.2 15.2H92.5V45.5z"
                        fill="#2EB67D"
                      />
                      <path
                        d="M84.9 45.5c0 8.4-6.8 15.2-15.2 15.2S54.5 53.9 54.5 45.5V7.6c0-8.4 6.8-15.2 15.2-15.2s15.2 6.8 15.2 15.2v37.9z"
                        fill="#2EB67D"
                      />
                      <path
                        d="M77.2 92.5c8.4 0 15.2 6.8 15.2 15.2s-6.8 15.2-15.2 15.2-15.2-6.8-15.2-15.2V92.5h15.2z"
                        fill="#ECB22E"
                      />
                      <path
                        d="M77.2 84.9c-8.4 0-15.2-6.8-15.2-15.2s6.8-15.2 15.2-15.2h37.9c8.4 0 15.2 6.8 15.2 15.2s-6.8 15.2-15.2 15.2H77.2z"
                        fill="#ECB22E"
                      />
                    </svg>
                    {slackConnected ? "Neu verbinden" : "Mit Slack verbinden"}
                  </button>

                  <div className="text-xs text-gray-500">
                    {slackConnected
                      ? "Slack ist verbunden. Sie können jederzeit neu verbinden."
                      : "Noch nicht verbunden. (Optional)"}
                  </div>
                </div>
              </div>
            </Card>

            <Separator className="my-6" />

            {/* Contact */}
            <Card className="rounded-2xl border border-gray-200 bg-white p-5" data-tour="notifications-contact">
              <h2 className="text-sm font-semibold">Kontaktinformationen</h2>
              <p className="text-sm text-gray-600 mt-1">
                Wohin sollen wir Ihre Benachrichtigungen senden?
              </p>

              <div className="grid grid-cols-1 gap-4 mt-4">
                <Input
                  placeholder="E-Mail-Adresse"
                  value={contactInfo.email}
                  onChange={(e) =>
                    setContactInfo((p) => ({ ...p, email: e.target.value }))
                  }
                  data-tour="notifications-contact-email"
                />
                <Input
                  placeholder="Telefonnummer für WhatsApp"
                  value={contactInfo.phone}
                  onChange={(e) =>
                    setContactInfo((p) => ({ ...p, phone: e.target.value }))
                  }
                  data-tour="notifications-contact-phone"
                />
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Hinweis: WhatsApp/Slack-Versand kann je nach Setup (Onboarding) schrittweise aktiviert werden.
              </div>
            </Card>

            <Separator className="my-6" />

            {/* Time window */}
            <Card className="rounded-2xl border border-gray-200 bg-white p-5" data-tour="notifications-time-window">
              <h2 className="text-sm font-semibold">Benachrichtigungszeitfenster</h2>
              <p className="text-sm text-gray-600 mt-1">
                Innerhalb welcher Zeiten möchten Sie benachrichtigt werden?
              </p>

              <div className="flex items-center gap-4 mt-4">
                <Input
                  type="time"
                  value={timeWindow.start}
                  onChange={(e) =>
                    setTimeWindow((p) => ({ ...p, start: e.target.value }))
                  }
                  data-tour="notifications-time-start"
                />
                <span className="text-sm text-gray-600">bis</span>
                <Input
                  type="time"
                  value={timeWindow.end}
                  onChange={(e) => setTimeWindow((p) => ({ ...p, end: e.target.value }))}
                  data-tour="notifications-time-end"
                />
              </div>

              <div className="mt-3 text-xs text-gray-500">
                Außerhalb dieses Fensters werden Benachrichtigungen standardmäßig nicht gesendet.
              </div>
            </Card>

            <Separator className="my-6" />

            {/* Note */}
            <Card className="rounded-2xl border border-gray-200 bg-white p-5" data-tour="notifications-note">
              <h2 className="text-sm font-semibold">Zusätzliche Hinweise</h2>
              <p className="text-sm text-gray-600 mt-1">
                Wenn es spezielle Wünsche für die Kommunikation gibt (z. B. nachts nur bei Eskalationen).
              </p>

              <Textarea
                placeholder="Z. B. 'Nach 20 Uhr nur bei dringenden Eskalationen benachrichtigen.'"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                data-tour="notifications-note-textarea"
                className="mt-4"
              />
            </Card>

            <Separator className="my-6" />

            {/* Example */}
            <Card className="rounded-2xl border border-gray-200 bg-white p-5" data-tour="notifications-example">
              <h2 className="text-sm font-semibold">Beispiel-Benachrichtigung</h2>
              <p className="text-sm text-gray-600 mt-1">
                So könnte eine typische Nachricht bei einem neuen Interessenten aussehen:
              </p>

              <div className="mt-4 rounded-xl border border-gray-200 bg-[#fbfbfc] px-4 py-3">
                <p className="font-semibold mb-1">📩 Neuer Interessent!</p>
                <p className="text-sm text-gray-600">
                  Max Mustermann hat gerade auf das Inserat „Modernes Penthouse mit Blick“ geantwortet.
                  <br />
                  Nachricht: „Guten Tag, ist die Wohnung noch verfügbar?“
                  <br />
                  <span className="text-xs text-gray-500">Erhalten via WhatsApp • 14:36 Uhr</span>
                </p>
              </div>
            </Card>

            <div className="h-6" />

            {/* Bottom save */}
            <div className="flex justify-end">
              <Button
                onClick={saveSettings}
                disabled={saving || loading}
                className="rounded-lg bg-gray-900 text-amber-200 hover:bg-gray-800 gap-2"
                data-tour="notifications-save-bottom"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Speichern
              </Button>
            </div>

            <div className="h-4" />
          </>
        )}
      </div>
    </main>
  );
}
