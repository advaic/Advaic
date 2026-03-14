import { Suspense } from "react";
import { ConversationLoadingState } from "@/components/app-ui";
import LeadChatWrapper from "./LeadChatWrapper"; // Client-side wrapper

export default function LeadPage() {
  return (
    <Suspense fallback={<ConversationLoadingState />}>
      <LeadChatWrapper />
    </Suspense>
  );
}
