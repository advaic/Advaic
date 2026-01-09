"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";

export default function NotificationSettingsPage() {
  const [notifications, setNotifications] = useState({
    newLeads: true,
    escalations: true,
    followUps: true,
    systemMessages: true,
  });

  const [delivery, setDelivery] = useState({
    email: true,
    whatsapp: true,
    dashboard: true,
    slack: true,
  });

  const [contactInfo, setContactInfo] = useState({
    email: "",
    phone: "",
  });

  const [timeWindow, setTimeWindow] = useState({
    start: "08:00",
    end: "20:00",
  });

  const [note, setNote] = useState("");

  const router = useRouter();

  const handleToggle = (key: string, group: "notifications" | "delivery") => {
    if (group === "notifications") {
      setNotifications({
        ...notifications,
        [key]: !notifications[key as keyof typeof notifications],
      });
    } else {
      setDelivery({
        ...delivery,
        [key]: !delivery[key as keyof typeof delivery],
      });
    }
  };

  const connectSlack = () => {
    const clientId = "8782700628515.9149893466422";
    const redirectUri = encodeURIComponent(
      `${window.location.origin}/api/slack/callback`
    );
    const scopes = encodeURIComponent("chat:write,users:read,channels:read");

    window.location.href =
      `https://slack.com/oauth/v2/authorize?client_id=${clientId}` +
      `&scope=${scopes}&redirect_uri=${redirectUri}`;
  };

  return (
    <main className="flex-1 p-6 overflow-y-auto">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-2">
          Benachrichtigungen verwalten
        </h1>
        <p className="text-muted-foreground mb-6">
          Steuern Sie, wann und wie Sie über neue Ereignisse informiert werden.
          So verpassen Sie keine wichtigen Updates – und behalten trotzdem die
          Kontrolle.
        </p>

        <h2 className="text-lg font-semibold mb-1">Benachrichtigungsarten</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Für welche Ereignisse möchten Sie benachrichtigt werden?
        </p>

        <div className="space-y-4 mb-6">
          {Object.entries(notifications).map(([key, value]) => (
            <div className="flex items-center justify-between" key={key}>
              <span>
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
                onCheckedChange={() => handleToggle(key, "notifications")}
              />
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        <h2 className="text-lg font-semibold mb-1">Empfangskanäle</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Auf welchen Wegen möchten Sie Benachrichtigungen erhalten?
        </p>

        <div className="space-y-4 mb-6">
          {Object.entries(delivery).map(([key, value]) => (
            <div className="flex items-center justify-between" key={key}>
              <span>
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
                onCheckedChange={() => handleToggle(key, "delivery")}
              />
            </div>
          ))}
        </div>

        <Separator className="my-6" />

        <h2 className="text-lg font-semibold mb-1">Kontaktinformationen</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Wohin sollen wir Ihre Benachrichtigungen senden?
        </p>
        <div className="grid grid-cols-1 gap-4 mb-6">
          <Input
            placeholder="E-Mail-Adresse"
            value={contactInfo.email}
            onChange={(e) =>
              setContactInfo({ ...contactInfo, email: e.target.value })
            }
          />
          <Input
            placeholder="Telefonnummer für WhatsApp"
            value={contactInfo.phone}
            onChange={(e) =>
              setContactInfo({ ...contactInfo, phone: e.target.value })
            }
          />

          <button
            onClick={connectSlack}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-md bg-[#4A154B] text-white font-medium hover:brightness-110 transition"
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
            Mit Slack verbinden
          </button>
        </div>

        <Separator className="my-6" />

        <h2 className="text-lg font-semibold mb-1">
          Benachrichtigungszeitfenster
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          Innerhalb welcher Zeiten möchten Sie benachrichtigt werden?
        </p>
        <div className="flex items-center gap-4 mb-6">
          <Input
            type="time"
            value={timeWindow.start}
            onChange={(e) =>
              setTimeWindow({ ...timeWindow, start: e.target.value })
            }
          />
          <span>bis</span>
          <Input
            type="time"
            value={timeWindow.end}
            onChange={(e) =>
              setTimeWindow({ ...timeWindow, end: e.target.value })
            }
          />
        </div>

        <h2 className="text-lg font-semibold mb-1">Zusätzliche Hinweise</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Wenn es spezielle Wünsche für die Kommunikation gibt (z. B. nachts nur
          bei Eskalationen).
        </p>
        <Textarea
          placeholder="Z. B. 'Nach 20 Uhr nur bei dringenden Eskalationen benachrichtigen.'"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />

        <Separator className="my-6" />

        <h2 className="text-lg font-semibold mb-1">
          Beispiel-Benachrichtigung
        </h2>
        <p className="text-sm text-muted-foreground mb-4">
          So könnte eine typische Nachricht bei einem neuen Lead aussehen:
        </p>

        <div className="bg-muted text-sm rounded-md border px-4 py-3">
          <p className="font-semibold mb-1">📩 Neuer Interessent!</p>
          <p className="text-muted-foreground">
            Max Mustermann hat gerade auf das Inserat „Modernes Penthouse mit
            Blick“ geantwortet.
            <br />
            Nachricht: „Guten Tag, ist die Wohnung noch verfügbar?“
            <br />
            <span className="text-xs text-muted-foreground">
              Erhalten via WhatsApp • 14:36 Uhr
            </span>
          </p>
        </div>

        <Button className="mt-6">Einstellungen speichern</Button>
      </div>
    </main>
  );
}
