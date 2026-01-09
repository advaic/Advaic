import { Suspense } from "react";
import LeadChatWrapper from "./LeadChatWrapper"; // Client-side wrapper

export default function LeadPage() {
  return (
    <Suspense fallback={<div>Lade...</div>}>
      <LeadChatWrapper />
    </Suspense>
  );
}
