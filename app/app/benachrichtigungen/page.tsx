"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import type { Database } from "@/types/supabase";

import {
  PageHeader,
  PrimaryActionBar,
  SectionCard,
  StatCard,
  StatusBadge,
} from "@/components/app-ui";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import {
  trackSettingsToggleAttempt,
  trackSettingsToggleSuccess,
  useUiRouteMetric,
} from "@/lib/funnel/ui-metrics";
import { BellRing, Clock3, Loader2, Mail, Save, ShieldCheck } from "lucide-react";

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

function buildNotificationsFingerprint(input: {
  notifications: NotificationToggles;
  delivery: DeliveryToggles;
  contactInfo: ContactInfo;
  timeWindow: TimeWindow;
  note: string;
}) {
  return JSON.stringify({
    notifications: input.notifications,
    delivery: input.delivery,
    contact_email: safeStr(input.contactInfo.email),
    contact_phone: safeStr(input.contactInfo.phone),
    window_start: clampTime(input.timeWindow.start) || "",
    window_end: clampTime(input.timeWindow.end) || "",
    note: safeStr(input.note),
  });
}

function notificationLabel(key: keyof NotificationToggles) {
  if (key === "newLeads") return "Neue Interessenten";
  if (key === "escalations") return "Eskalationen / Übergaben";
  if (key === "followUps") return "Follow-up Erinnerungen";
  return "Systemhinweise";
}

function deliveryLabel(key: keyof DeliveryToggles) {
  if (key === "email") return "E-Mail";
  if (key === "whatsapp") return "WhatsApp";
  if (key === "dashboard") return "Dashboard";
  return "Slack";
}

function getChangedBooleanKeys<T extends Record<string, boolean>>(
  current: T,
  previous: T,
) {
  return (Object.keys(current) as Array<keyof T>)
    .filter((key) => current[key] !== previous[key])
    .map((key) => String(key));
}

export default function NotificationSettingsPage() {
  const supabase = useSupabaseClient<Database>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  useUiRouteMetric({
    routeKey: "notifications_settings",
    source: "notifications_settings",
    path: "/app/benachrichtigungen",
  });

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
  const [lastSavedFingerprint, setLastSavedFingerprint] = useState<string>(
    buildNotificationsFingerprint({
      notifications: DEFAULT_NOTIFICATIONS,
      delivery: DEFAULT_DELIVERY,
      contactInfo: DEFAULT_CONTACT,
      timeWindow: DEFAULT_WINDOW,
      note: "",
    })
  );
  const [lastSavedToggleSnapshot, setLastSavedToggleSnapshot] = useState<{
    notifications: NotificationToggles;
    delivery: DeliveryToggles;
  }>({
    notifications: DEFAULT_NOTIFICATIONS,
    delivery: DEFAULT_DELIVERY,
  });

  // Used to avoid overwriting user edits if realtime/refresh ever gets added later
  const [loadedOnce, setLoadedOnce] = useState(false);

  const currentFingerprint = useMemo(
    () =>
      buildNotificationsFingerprint({
        notifications,
        delivery,
        contactInfo,
        timeWindow,
        note,
      }),
    [notifications, delivery, contactInfo, timeWindow, note]
  );

  const isDirty = useMemo(() => {
    if (!loadedOnce) return false;
    return currentFingerprint !== lastSavedFingerprint;
  }, [currentFingerprint, lastSavedFingerprint, loadedOnce]);

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
          const nextNotifications =
            (row.notifications as any) ?? DEFAULT_NOTIFICATIONS;
          const nextDelivery = (row.delivery as any) ?? DEFAULT_DELIVERY;
          const nextContactInfo = {
            email: safeStr(row.contact_email),
            phone: safeStr(row.contact_phone),
          };
          const nextTimeWindow = {
            start: clampTime(safeStr(row.window_start)) || DEFAULT_WINDOW.start,
            end: clampTime(safeStr(row.window_end)) || DEFAULT_WINDOW.end,
          };
          const nextNote = safeStr(row.note);

          setNotifications(nextNotifications);
          setDelivery(nextDelivery);
          setContactInfo(nextContactInfo);
          setTimeWindow(nextTimeWindow);
          setNote(nextNote);
          setLastSavedFingerprint(
            buildNotificationsFingerprint({
              notifications: nextNotifications,
              delivery: nextDelivery,
              contactInfo: nextContactInfo,
              timeWindow: nextTimeWindow,
              note: nextNote,
            })
          );
          setLastSavedToggleSnapshot({
            notifications: nextNotifications,
            delivery: nextDelivery,
          });

          setSlackConnected(!!row.slack_connected);
          setSlackTeamName(row.slack_team_name ?? null);
        } else if (!cancelled) {
          setLastSavedFingerprint(
            buildNotificationsFingerprint({
              notifications: DEFAULT_NOTIFICATIONS,
              delivery: DEFAULT_DELIVERY,
              contactInfo: DEFAULT_CONTACT,
              timeWindow: DEFAULT_WINDOW,
              note: "",
            })
          );
          setLastSavedToggleSnapshot({
            notifications: DEFAULT_NOTIFICATIONS,
            delivery: DEFAULT_DELIVERY,
          });
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

    const changedToggleKeys = [
      ...getChangedBooleanKeys(notifications, lastSavedToggleSnapshot.notifications),
      ...getChangedBooleanKeys(delivery, lastSavedToggleSnapshot.delivery),
    ];
    if (changedToggleKeys.length > 0) {
      trackSettingsToggleAttempt({
        source: "notifications_settings",
        path: "/app/benachrichtigungen",
        routeKey: "notifications_settings",
        settingKey: "notifications_batch",
        nextValue: null,
        surface: "notifications_page",
        meta: {
          changed_toggle_keys: changedToggleKeys,
        },
      });
    }

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
      setLastSavedFingerprint(currentFingerprint);
      setLastSavedToggleSnapshot({ notifications, delivery });
      if (changedToggleKeys.length > 0) {
        trackSettingsToggleSuccess({
          source: "notifications_settings",
          path: "/app/benachrichtigungen",
          routeKey: "notifications_settings",
          settingKey: "notifications_batch",
          nextValue: null,
          surface: "notifications_page",
          meta: {
            changed_toggle_keys: changedToggleKeys,
          },
        });
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  const enabledNotificationLabels = useMemo(
    () =>
      (Object.entries(notifications) as Array<[keyof NotificationToggles, boolean]>)
        .filter(([, value]) => value)
        .map(([key]) => notificationLabel(key)),
    [notifications]
  );

  const enabledDeliveryLabels = useMemo(
    () =>
      (Object.entries(delivery) as Array<[keyof DeliveryToggles, boolean]>)
        .filter(([, value]) => value)
        .map(([key]) => deliveryLabel(key)),
    [delivery]
  );

  const configuredDestinations = useMemo(
    () => [safeStr(contactInfo.email), safeStr(contactInfo.phone)].filter(Boolean).length,
    [contactInfo.email, contactInfo.phone]
  );

  const activeWindowLabel = `${timeWindow.start || DEFAULT_WINDOW.start} – ${timeWindow.end || DEFAULT_WINDOW.end}`;

  return (
    <main
      className="min-h-[calc(100vh-80px)] app-shell text-gray-900"
      data-tour="notifications-page"
    >
      <div
        className="mx-auto w-full max-w-6xl px-4 md:px-6 app-page-section"
        data-tour="notifications-container"
      >
        <PageHeader
          sticky={false}
          dataTour="notifications-header"
          title={
            <h1 className="app-text-page-title" data-tour="notifications-title">
              Benachrichtigungen
            </h1>
          }
          meta={
            <>
              <StatusBadge tone={isDirty ? "warning" : "success"}>
                {isDirty ? "Änderungen offen" : "Gespeichert"}
              </StatusBadge>
              <StatusBadge tone="brand">
                {enabledNotificationLabels.length} Ereignisse aktiv
              </StatusBadge>
              <StatusBadge tone={slackConnected ? "success" : "neutral"}>
                {slackConnected
                  ? `Slack ${slackTeamName ? `· ${slackTeamName}` : "verbunden"}`
                  : "Slack optional"}
              </StatusBadge>
            </>
          }
          description="Lege fest, welche Ereignisse wichtig sind, über welche Kanäle du sie erhältst und in welchem Zeitfenster Advaic dich informieren darf."
          actions={
            <Button
              onClick={saveSettings}
              disabled={saving || loading}
              className="w-full sm:w-auto gap-2"
              data-tour="notifications-save"
              title="Einstellungen speichern"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "Speichert…" : "Einstellungen speichern"}
            </Button>
          }
        />

        {loading ? (
          <SectionCard
            surface="panel"
            data-tour="notifications-loading"
            title="Benachrichtigungen werden geladen"
            description="Wir lesen gerade deine aktuellen Präferenzen und Zustellwege."
          >
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              Einstellungen werden geladen…
            </div>
          </SectionCard>
        ) : (
          <>
            <div
              className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4"
              data-tour="notifications-stats"
            >
              <StatCard
                title="Aktive Ereignisse"
                value={enabledNotificationLabels.length}
                hint={
                  enabledNotificationLabels.length > 0
                    ? enabledNotificationLabels.slice(0, 2).join(" · ")
                    : "Noch kein Ereignis aktiviert."
                }
                icon={<BellRing className="h-4 w-4" />}
              />
              <StatCard
                title="Aktive Kanäle"
                value={enabledDeliveryLabels.length}
                hint={
                  enabledDeliveryLabels.length > 0
                    ? enabledDeliveryLabels.join(" · ")
                    : "Noch kein Kanal aktiviert."
                }
                icon={<Mail className="h-4 w-4" />}
              />
              <StatCard
                title="Kontaktwege bereit"
                value={configuredDestinations}
                hint="E-Mail und Telefonnummer werden für externe Zustellung genutzt."
                icon={<ShieldCheck className="h-4 w-4" />}
              />
              <StatCard
                title="Zeitfenster"
                value={activeWindowLabel}
                hint="Außerhalb dieses Fensters werden Hinweise standardmäßig zurückgehalten."
                icon={<Clock3 className="h-4 w-4" />}
              />
            </div>

            <div
              className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
              data-tour="notifications-layout"
            >
              <div className="space-y-6">
                <SectionCard
                  data-tour="notifications-types"
                  title="1. Benachrichtigungsarten"
                  description="Lege fest, welche Ereignisse wirklich Aufmerksamkeit verdienen."
                >
                  <div className="space-y-3" data-tour="notifications-types-toggles">
                    {(
                      Object.entries(notifications) as Array<
                        [keyof NotificationToggles, boolean]
                      >
                    ).map(([key, value]) => (
                      <div
                        className="flex items-center justify-between gap-3 rounded-xl border app-surface-muted px-4 py-4"
                        key={key}
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {notificationLabel(key)}
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            {key === "newLeads"
                              ? "Sobald neue Interessenten in deiner Inbox auftauchen."
                              : key === "escalations"
                                ? "Wenn Advaic einen Fall nicht sicher automatisch bearbeiten darf."
                                : key === "followUps"
                                  ? "Wenn ein Follow-up fällig wird oder manuelle Aufmerksamkeit braucht."
                                  : "Für relevante Systemhinweise und Statusänderungen."}
                          </div>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={() => handleToggle(String(key), "notifications")}
                        />
                      </div>
                    ))}
                  </div>
                </SectionCard>

                <SectionCard
                  data-tour="notifications-channels"
                  title="2. Empfangskanäle"
                  description="Wähle, auf welchen Wegen du Benachrichtigungen erhalten möchtest."
                  meta={
                    <StatusBadge tone={slackConnected ? "success" : "neutral"} size="sm">
                      {slackConnected
                        ? `Slack verbunden${slackTeamName ? ` · ${slackTeamName}` : ""}`
                        : "Slack nicht verbunden"}
                    </StatusBadge>
                  }
                >
                  <div className="space-y-3" data-tour="notifications-channels-toggles">
                    {(
                      Object.entries(delivery) as Array<[keyof DeliveryToggles, boolean]>
                    ).map(([key, value]) => (
                      <div
                        className="flex items-center justify-between gap-3 rounded-xl border app-surface-muted px-4 py-4"
                        key={key}
                      >
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {deliveryLabel(key)}
                          </div>
                          <div className="mt-1 text-xs text-gray-600">
                            {key === "email"
                              ? "Für strukturierte Hinweise und längere Statusupdates."
                              : key === "whatsapp"
                                ? "Für schnelle, direkte Hinweise unterwegs."
                                : key === "dashboard"
                                  ? "Bleibt immer als sicherer Standardkanal in der App sichtbar."
                                  : "Für Team- oder Kanalbenachrichtigungen in Slack."}
                          </div>
                        </div>
                        <Switch
                          checked={value}
                          onCheckedChange={() => handleToggle(String(key), "delivery")}
                        />
                      </div>
                    ))}
                  </div>

                  <div className="mt-5 rounded-xl border app-surface-panel px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">Slack</div>
                    <div className="mt-1 text-sm text-gray-600">
                      Optional: Slack verbindet sich direkt mit deinem Workspace. Advaic kann dort Hinweise
                      zu Eskalationen, Follow-ups und neuen Interessenten senden.
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <button
                        onClick={connectSlack}
                        className="inline-flex items-center justify-center gap-2 rounded-md bg-[#4A154B] px-4 py-2 font-medium text-white transition hover:brightness-110"
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
                          <path d="M30.3 77.2c0 8.4-6.8 15.2-15.2 15.2S0 85.6 0 77.2s6.8-15.2 15.2-15.2h15.1v15.2z" fill="#E01E5A" />
                          <path d="M37.9 77.2c0-8.4 6.8-15.2 15.2-15.2s15.2 6.8 15.2 15.2v37.9c0 8.4-6.8 15.2-15.2 15.2s-15.2-6.8-15.2-15.2V77.2z" fill="#E01E5A" />
                          <path d="M45.5 30.3c-8.4 0-15.2-6.8-15.2-15.2S37.1 0 45.5 0s15.2 6.8 15.2 15.2v15.1H45.5z" fill="#36C5F0" />
                          <path d="M45.5 37.9c8.4 0 15.2 6.8 15.2 15.2S53.9 68.3 45.5 68.3H7.6c-8.4 0-15.2-6.8-15.2-15.2S-0.8 37.9 7.6 37.9h37.9z" fill="#36C5F0" />
                          <path d="M92.5 45.5c0-8.4 6.8-15.2 15.2-15.2s15.2 6.8 15.2 15.2-6.8 15.2-15.2 15.2H92.5V45.5z" fill="#2EB67D" />
                          <path d="M84.9 45.5c0 8.4-6.8 15.2-15.2 15.2S54.5 53.9 54.5 45.5V7.6c0-8.4 6.8-15.2 15.2-15.2s15.2 6.8 15.2 15.2v37.9z" fill="#2EB67D" />
                          <path d="M77.2 92.5c8.4 0 15.2 6.8 15.2 15.2s-6.8 15.2-15.2 15.2-15.2-6.8-15.2-15.2V92.5h15.2z" fill="#ECB22E" />
                          <path d="M77.2 84.9c-8.4 0-15.2-6.8-15.2-15.2s6.8-15.2 15.2-15.2h37.9c8.4 0 15.2 6.8 15.2 15.2s-6.8 15.2-15.2 15.2H77.2z" fill="#ECB22E" />
                        </svg>
                        {slackConnected ? "Neu verbinden" : "Mit Slack verbinden"}
                      </button>

                      <div className="text-xs text-gray-500">
                        {slackConnected
                          ? "Slack ist verbunden. Du kannst den Workspace jederzeit neu verbinden."
                          : "Noch nicht verbunden. Optional, aber praktisch für schnelle Team-Hinweise."}
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  data-tour="notifications-contact"
                  title="3. Kontaktinformationen"
                  description="Wohin sollen wir externe Benachrichtigungen senden?"
                >
                  <div className="grid grid-cols-1 gap-4">
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
                    WhatsApp- und Slack-Versand können je nach Setup schrittweise aktiviert werden.
                  </div>
                </SectionCard>

                <SectionCard
                  data-tour="notifications-time-window"
                  title="4. Benachrichtigungszeitfenster"
                  description="Innerhalb welcher Zeiten darf Advaic dich standardmäßig informieren?"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
                </SectionCard>

                <SectionCard
                  data-tour="notifications-note"
                  title="5. Zusätzliche Hinweise"
                  description="Spezielle Wünsche für Ausnahmefälle, z. B. nachts nur bei Eskalationen."
                >
                  <Textarea
                    placeholder="Z. B. 'Nach 20 Uhr nur bei dringenden Eskalationen benachrichtigen.'"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    data-tour="notifications-note-textarea"
                    className="min-h-[140px]"
                  />
                </SectionCard>
              </div>

              <div className="space-y-4" data-tour="notifications-right">
                <SectionCard
                  data-tour="notifications-summary"
                  title="Aktueller Benachrichtigungsplan"
                  description="So liest Advaic deine aktuelle Kombination aus Ereignissen, Kanälen und Guardrails."
                >
                  <div className="space-y-3">
                    <div className="rounded-xl border app-surface-muted px-4 py-4">
                      <div className="app-text-meta-label">Aktive Ereignisse</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {enabledNotificationLabels.length > 0 ? (
                          enabledNotificationLabels.map((label) => (
                            <StatusBadge key={label} tone="brand" size="sm">
                              {label}
                            </StatusBadge>
                          ))
                        ) : (
                          <StatusBadge tone="neutral" size="sm">
                            Noch kein Ereignis aktiv
                          </StatusBadge>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border app-surface-muted px-4 py-4">
                      <div className="app-text-meta-label">Zustellwege</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {enabledDeliveryLabels.length > 0 ? (
                          enabledDeliveryLabels.map((label) => (
                            <StatusBadge key={label} tone="neutral" size="sm">
                              {label}
                            </StatusBadge>
                          ))
                        ) : (
                          <StatusBadge tone="neutral" size="sm">
                            Noch kein Kanal aktiv
                          </StatusBadge>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl border app-surface-muted px-4 py-4 text-sm text-gray-700">
                      <div className="app-text-meta-label">Zeit & Kontakt</div>
                      <div className="mt-2">Zeitfenster: {activeWindowLabel}</div>
                      <div className="mt-1">
                        Ziele: {configuredDestinations > 0 ? configuredDestinations : "Noch keine"} hinterlegt
                      </div>
                    </div>
                  </div>
                </SectionCard>

                <SectionCard
                  data-tour="notifications-example"
                  title="Beispiel-Benachrichtigung"
                  description="So könnte ein typischer Hinweis bei einem neuen Interessenten aussehen."
                >
                  <div className="rounded-xl border app-surface-panel px-4 py-4">
                    <p className="font-semibold text-gray-900">📩 Neuer Interessent!</p>
                    <p className="mt-2 text-sm text-gray-600">
                      Max Mustermann hat gerade auf das Inserat „Modernes Penthouse mit Blick“ geantwortet.
                      <br />
                      Nachricht: „Guten Tag, ist die Wohnung noch verfügbar?“
                      <br />
                      <span className="text-xs text-gray-500">
                        Erhalten via {enabledDeliveryLabels[0] || "Dashboard"} · 14:36 Uhr
                      </span>
                    </p>
                  </div>
                </SectionCard>

                <PrimaryActionBar
                  data-tour="notifications-save-bottom"
                  leading={
                    <>
                      <StatusBadge tone={isDirty ? "warning" : "success"}>
                        {isDirty ? "Änderungen offen" : "Alles gespeichert"}
                      </StatusBadge>
                      <span className="text-sm text-gray-700">
                        Speichere erst, wenn Ereignisse, Kanäle und Zeitfenster sauber zusammenpassen.
                      </span>
                    </>
                  }
                  trailing={
                    <Button
                      onClick={saveSettings}
                      disabled={saving || loading}
                      className="w-full sm:w-auto gap-2"
                      data-tour="notifications-save-bottom-btn"
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {saving ? "Speichert…" : "Einstellungen speichern"}
                    </Button>
                  }
                />
              </div>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
