"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  children: React.ReactElement<any>; // ✅ FIX HERE
}

export const CancelSubscriptionDialog = ({
  open,
  onClose,
  onOpen,
  children,
}: Props) => {
  const handleConfirm = () => {
    alert("Kündigung eingeleitet");
    onClose();
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
          <Button variant="destructive" onClick={handleConfirm}>
            Kündigen
          </Button>
        </div>
      </Dialog>
    </>
  );
};
