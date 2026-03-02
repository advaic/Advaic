import Link from "next/link";
import DeliverabilityStatusCard from "@/components/admin/DeliverabilityStatusCard";

export const dynamic = "force-dynamic";

export default function AdminDeliverabilityPage() {
  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="mx-auto max-w-6xl px-4 py-6 md:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Admin · Deliverability</h1>
            <p className="mt-1 text-sm text-gray-600">
              DNS-Baseline (SPF, DKIM, DMARC) plus Versandfehler-Signale der letzten 24 Stunden.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/app/admin/overview"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Overview
            </Link>
            <Link
              href="/app/admin/ops"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Ops
            </Link>
            <Link
              href="/app/admin/outbox"
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm hover:bg-gray-50"
            >
              Outbox
            </Link>
          </div>
        </div>

        <div className="mt-5">
          <DeliverabilityStatusCard />
        </div>
      </div>
    </div>
  );
}

