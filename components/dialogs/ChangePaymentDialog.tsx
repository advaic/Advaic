"use client";

import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import React from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  onOpen: () => void;
  children: React.ReactElement<any>; // ✅ allows onClick injection
}

export const ChangePaymentDialog = ({
  open,
  onClose,
  onOpen,
  children,
}: Props) => {
  return (
    <>
      {React.cloneElement(children, { onClick: onOpen })}

      <Dialog open={open} onClose={onClose} title="Zahlungsmethode ändern">
        <p className="text-sm text-muted-foreground">
          Diese Funktion ist in Kürze verfügbar.
        </p>
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose}>Schließen</Button>
        </div>
      </Dialog>
    </>
  );
};
