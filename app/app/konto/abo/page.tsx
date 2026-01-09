"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CancelSubscriptionDialog } from "@/components/dialogs/CancelSubscriptionDialog";
import { ChangePlanDialog } from "@/components/dialogs/ChangePlanDialog";
import { ChangePaymentDialog } from "@/components/dialogs/ChangePaymentDialog";

export default function AboPage() {
  const [modal, setModal] = useState<"cancel" | "change" | "payment" | null>(
    null
  );

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Abo & Zahlungen</h1>
        <p className="text-muted-foreground text-sm">
          Verwalte deinen aktuellen Plan und deine Zahlungen.
        </p>
      </div>

      {/* Aktueller Plan */}
      <div className="border rounded-lg p-6 bg-muted/30 space-y-2">
        <h2 className="font-semibold text-lg">Aktueller Plan</h2>
        <p className="text-sm">Advaic Pro – 29€/Monat</p>
        <p className="text-sm text-muted-foreground">
          Nächste Verlängerung: 05.08.2025
        </p>
        <div className="mt-4">
          <ChangePlanDialog
            open={modal === "change"}
            onClose={() => setModal(null)}
            onOpen={() => setModal("change")}
          >
            <Button variant="outline">Abo ändern</Button>
          </ChangePlanDialog>
        </div>
      </div>

      {/* Zahlungsmethode */}
      <div className="border rounded-lg p-6 bg-muted/30 space-y-2">
        <h2 className="font-semibold text-lg">Zahlungsmethode</h2>
        <p className="text-sm">Visa •••• 4242 – gültig bis 04/27</p>
        <div className="mt-4">
          <ChangePaymentDialog
            open={modal === "payment"}
            onClose={() => setModal(null)}
            onOpen={() => setModal("payment")}
          >
            <Button variant="outline">Zahlungsmethode ändern</Button>
          </ChangePaymentDialog>
        </div>
      </div>

      {/* Abo kündigen */}
      <div className="border border-red-200 bg-red-50 rounded-lg p-6 space-y-2">
        <h2 className="font-semibold text-lg text-red-700">Abo kündigen</h2>
        <p className="text-sm text-red-700">
          Du kannst dein Abo jederzeit kündigen. Dein Zugang bleibt bis zum Ende
          des aktuellen Abrechnungszeitraums bestehen.
        </p>
        <div className="mt-4">
          <CancelSubscriptionDialog
            open={modal === "cancel"}
            onClose={() => setModal(null)}
            onOpen={() => setModal("cancel")}
          >
            <Button variant="destructive">Abo kündigen</Button>
          </CancelSubscriptionDialog>
        </div>
      </div>
    </div>
  );
}
