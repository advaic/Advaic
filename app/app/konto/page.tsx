"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function KontoUebersichtPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Konto-Übersicht</h1>
        <p className="text-muted-foreground text-sm">
          Hier findest du alle wichtigen Informationen zu deinem Konto.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="border p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Kontoinhaber</p>
          <p className="font-medium">Max Mustermann</p>
        </div>
        <div className="border p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">E-Mail</p>
          <p className="font-medium">max@example.com</p>
        </div>
        <div className="border p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Aktiver Plan</p>
          <p className="font-medium">Advaic Pro (Monatlich)</p>
        </div>
        <div className="border p-4 rounded-lg">
          <p className="text-sm text-muted-foreground">Nächste Abrechnung</p>
          <p className="font-medium">15. Juli 2025</p>
        </div>
      </div>

      <div className="space-y-4">
        <Link href="/abo">
          <Button variant="secondary">Plan ändern</Button>
        </Link>
        <Link href="/daten">
          <Button variant="outline">Persönliche Daten anzeigen</Button>
        </Link>
        <Link href="/konto-loeschen">
          <Button variant="destructive">Konto löschen</Button>
        </Link>
      </div>
    </div>
  );
}
