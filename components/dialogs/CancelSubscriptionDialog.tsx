"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React, { useState } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  onConfirm?: () => void | Promise<void>;
  children: React.ReactElement<any>;
}

export const CancelSubscriptionDialog = ({
  open,
  onClose,
  onOpen,
  onConfirm,
  children,
}: Props) => {
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    try {
      await onConfirm?.();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {React.cloneElement(children, { onClick: onOpen })}

      <Dialog open={open} onClose={onClose} title="Abo kündigen">
        <p className="text-sm text-muted-foreground">
          Bist du sicher? Du wirst den Zugang zu allen Funktionen verlieren.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Abbrechen
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={busy}>
            {busy ? "Wird gekündigt..." : "Kündigen"}
          </Button>
        </div>
      </Dialog>
    </>
  );
};
