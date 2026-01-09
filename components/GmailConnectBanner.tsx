"use client";

import Link from "next/link";
import { useGmailConnection } from "app/app/hooks/useGmailConnection";

export default function GmailConnectBanner({ agentId }: { agentId: string }) {
  const { loading, connected } = useGmailConnection(agentId);
  if (loading || connected) return null;

  return (
    <div className="mb-4 rounded-xl border bg-white p-4 flex items-center justify-between">
      <div>
        <div className="font-semibold">Gmail verbinden</div>
        <div className="text-sm text-muted-foreground">
          Damit Advaic direkt aus Ihrem Postfach antworten kann.
        </div>
      </div>
      <Link
        href={`/api/auth/gmail/start?next=/app/konto&agent_id=${agentId}`}
        className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm"
      >
        Gmail verbinden
      </Link>
    </div>
  );
}
