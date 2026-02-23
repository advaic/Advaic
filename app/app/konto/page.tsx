"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { supabase } from "@/lib/supabase/browserClient";

type BillingSummaryResponse = {
  ok: boolean;
  summary?: {
    plan: {
      key: string;
      name: string;
      status: string;
      current_period_end: string | null;
    };
  };
};

function formatDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  if (!Number.isFinite(d.getTime())) return "—";
  return d.toLocaleDateString("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function KontoUebersichtPage() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("—");
  const [owner, setOwner] = useState("—");
  const [planName, setPlanName] = useState("Advaic Free");
  const [nextBilling, setNextBilling] = useState("—");

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getUser();
      const user = data?.user;

      const mail = String(user?.email || "").trim();
      const nameFromMeta = String(
        user?.user_metadata?.full_name || user?.user_metadata?.name || "",
      ).trim();

      setEmail(mail || "—");
      setOwner(nameFromMeta || (mail ? mail.split("@")[0] : "—"));

      const billingRes = await fetch("/api/billing/summary", { cache: "no-store" });
      const billingData = (await billingRes.json().catch(() => ({}))) as BillingSummaryResponse;

      if (billingRes.ok && billingData?.ok && billingData.summary?.plan) {
        setPlanName(String(billingData.summary.plan.name || "Advaic Free"));
        setNextBilling(formatDate(billingData.summary.plan.current_period_end || null));
      }

      setLoading(false);
    })();
  }, []);

  return (
    <div className="space-y-8" data-tour="account-page">
      <div>
        <h1 className="text-2xl font-bold" data-tour="account-header">
          Konto-Übersicht
        </h1>
        <p className="text-muted-foreground text-sm">
          Hier findest du alle wichtigen Informationen zu deinem Konto.
        </p>
      </div>

      <div
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
        data-tour="account-overview-cards"
      >
        <div className="border p-4 rounded-lg" data-tour="account-owner">
          <p className="text-sm text-muted-foreground">Kontoinhaber</p>
          <p className="font-medium">{loading ? "Lädt..." : owner}</p>
        </div>
        <div className="border p-4 rounded-lg" data-tour="account-email">
          <p className="text-sm text-muted-foreground">E-Mail</p>
          <p className="font-medium">{loading ? "Lädt..." : email}</p>
        </div>
        <div className="border p-4 rounded-lg" data-tour="account-plan">
          <p className="text-sm text-muted-foreground">Aktiver Plan</p>
          <p className="font-medium">{loading ? "Lädt..." : planName}</p>
        </div>
        <div className="border p-4 rounded-lg" data-tour="account-billing">
          <p className="text-sm text-muted-foreground">Nächste Abrechnung</p>
          <p className="font-medium">{loading ? "Lädt..." : nextBilling}</p>
        </div>
      </div>

      <div className="space-y-4" data-tour="account-actions">
        <Link href="/app/konto/abo" data-tour="account-change-plan">
          <Button variant="secondary">Plan & Zahlungen verwalten</Button>
        </Link>
        <Link href="/app/konto/persoenliche-daten" data-tour="account-personal-data">
          <Button variant="outline">Persönliche Daten anzeigen</Button>
        </Link>
        <Link href="/app/konto/loeschen" data-tour="account-delete">
          <Button variant="destructive">Konto löschen</Button>
        </Link>
      </div>
    </div>
  );
}
