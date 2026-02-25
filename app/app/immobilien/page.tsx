"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useSessionContext,
  useSupabaseClient,
} from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import {
  getPropertyStartklarMissingFields,
  PROPERTY_STARTKLAR_FIELDS,
} from "@/lib/properties/readiness";
import Link from "next/link";
import type { Database } from "@/types/supabase";

const PROPERTY_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PROPERTY_IMAGES_BUCKET || "property-images";

type Property = {
  id: string; // ✅ UUID
  title: string | null;
  street_address: string | null;
  city: string | null;
  price_type: string | null;
  price: number | null;
  size_sqm: number | null;
  rooms: number | null;
  listing_summary: string | null;
  url: string | null;
  year_built: number | null;
  type: string | null;
  image_urls: string[] | null; // ✅ storage paths, not URLs
  created_at?: string | null;
  updated_at?: string | null;
  agent_id?: string | null;
  status?: string | null;
};

type SortKey =
  | "updated_desc"
  | "updated_asc"
  | "price_desc"
  | "price_asc"
  | "size_desc"
  | "size_asc";

export default function ImmobilienPage() {
  const [search, setSearch] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("updated_desc");
  const [onlyNeedsSetup, setOnlyNeedsSetup] = useState(false);

  // Removed thumbs state and effect as per instructions

  const { session, isLoading } = useSessionContext();
  const userId = session?.user?.id ?? null;
  const router = useRouter();
  const supabase = useSupabaseClient<Database>();

  const refreshProperties = useCallback(async () => {
    if (isLoading) return;

    if (!userId) {
      setLoading(false);
      router.replace("/login");
      return;
    }

    setLoading(true);

    const { data: propertyData, error: propError } = await supabase
      .from("properties")
      .select(
        "id,title,street_address,city,price_type,price,size_sqm,rooms,listing_summary,url,year_built,type,image_urls,created_at,updated_at,agent_id,status"
      )
      .eq("agent_id", userId)
      .neq("status", "archived")
      .order("updated_at", { ascending: false, nullsFirst: false });

    if (propError) {
      console.error("Fehler beim Laden:", propError?.message, propError);
      setProperties([]);
    } else {
      setProperties((propertyData as any) || []);
    }

    setLoading(false);
  }, [isLoading, userId, router, supabase]);

  useEffect(() => {
    void refreshProperties();
  }, [refreshProperties]);

  const safeStr = (v: unknown) => String(v ?? "").trim();
  const formatCurrency = (v: number | null | undefined) => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return "—";
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(n);
  };
  const formatNumber = (v: number | null | undefined, suffix = "") => {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0) return "—";
    return `${new Intl.NumberFormat("de-DE").format(n)}${suffix}`;
  };

  const readinessForProperty = (p: Property) => {
    const missingFields = getPropertyStartklarMissingFields(p as any);
    const missing = missingFields.map((f) => f.label);
    const passed = PROPERTY_STARTKLAR_FIELDS.length - missing.length;
    const score = Math.round((passed / PROPERTY_STARTKLAR_FIELDS.length) * 100);
    const ready = missing.length === 0;
    return { score, missing, ready };
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = (properties ?? []).filter((p) => {
      const hay = `${safeStr(p.title)} ${safeStr(p.street_address)} ${safeStr(
        p.city
      )}`.toLowerCase();
      const matchesSearch = !q || hay.includes(q);
      if (!matchesSearch) return false;
      if (onlyNeedsSetup && readinessForProperty(p).ready) return false;
      return true;
    });

    const sorted = [...base].sort((a, b) => {
      const aUpd = new Date(a.updated_at ?? a.created_at ?? 0).getTime();
      const bUpd = new Date(b.updated_at ?? b.created_at ?? 0).getTime();
      const aPrice = Number(a.price ?? 0);
      const bPrice = Number(b.price ?? 0);
      const aSize = Number(a.size_sqm ?? 0);
      const bSize = Number(b.size_sqm ?? 0);

      switch (sortBy) {
        case "updated_asc":
          return aUpd - bUpd;
        case "price_desc":
          return bPrice - aPrice;
        case "price_asc":
          return aPrice - bPrice;
        case "size_desc":
          return bSize - aSize;
        case "size_asc":
          return aSize - bSize;
        case "updated_desc":
        default:
          return bUpd - aUpd;
      }
    });

    return sorted;
  }, [properties, search, sortBy, onlyNeedsSetup]);

  const readinessStats = useMemo(() => {
    const all = properties ?? [];
    let readyCount = 0;
    let missingLinkCount = 0;
    let avgScoreTotal = 0;
    for (const p of all) {
      const r = readinessForProperty(p);
      avgScoreTotal += r.score;
      if (r.ready) readyCount += 1;
      if (r.missing.includes("Listing-Link")) missingLinkCount += 1;
    }
    const avgScore =
      all.length > 0 ? Math.round(avgScoreTotal / all.length) : 0;
    return {
      total: all.length,
      readyCount,
      notReadyCount: Math.max(0, all.length - readyCount),
      missingLinkCount,
      avgScore,
    };
  }, [properties]);

  if (isLoading || loading) {
    return <p className="text-muted-foreground">Lade Immobilien…</p>;
  }

  return (
    <div
      className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900"
      data-tour="properties-page"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div
          className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between"
          data-tour="properties-header"
        >
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-semibold">Immobilien</h1>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200">
                Advaic
              </span>
              <span
                className="text-xs font-medium px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700"
                data-tour="properties-count"
              >
                {filtered.length} angezeigt
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Übersicht aller Immobilien unter deiner Betreuung.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Suche nach Titel oder Adresse"
                data-tour="properties-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border px-3 py-2 rounded-lg text-sm w-full md:w-72 bg-white border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
              />
              <Link href="/app/immobilien/hinzufuegen" data-tour="properties-add">
                <Button>+ Immobilie hinzufügen</Button>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                data-tour="properties-sort"
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                title="Sortierung"
              >
                <option value="updated_desc">Neueste zuerst</option>
                <option value="updated_asc">Älteste zuerst</option>
                <option value="price_desc">Preis: hoch → niedrig</option>
                <option value="price_asc">Preis: niedrig → hoch</option>
                <option value="size_desc">Fläche: groß → klein</option>
                <option value="size_asc">Fläche: klein → groß</option>
              </select>

              <Button
                type="button"
                variant="outline"
                onClick={() => void refreshProperties()}
                className="border-gray-200"
                data-tour="properties-refresh"
              >
                Aktualisieren
              </Button>

              <Button
                type="button"
                variant={onlyNeedsSetup ? "default" : "outline"}
                onClick={() => setOnlyNeedsSetup((v) => !v)}
                className={
                  onlyNeedsSetup
                    ? "bg-gray-900 text-amber-200 border-gray-900"
                    : "border-gray-200"
                }
                title="Nur nicht startklare Immobilien anzeigen"
              >
                {onlyNeedsSetup ? "Nur nicht startklar: AN" : "Nur nicht startklar"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Durchschnitt Readiness</div>
            <div className="text-lg font-semibold text-gray-900">
              {readinessStats.avgScore}%
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Startklar</div>
            <div className="text-lg font-semibold text-gray-900">
              {readinessStats.readyCount}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Nicht startklar</div>
            <div className="text-lg font-semibold text-gray-900">
              {readinessStats.notReadyCount}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <div className="text-xs text-gray-500">Ohne Listing-Link</div>
            <div className="text-lg font-semibold text-gray-900">
              {readinessStats.missingLinkCount}
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div
            className="rounded-2xl border border-gray-200 bg-white p-6 text-center"
            data-tour="properties-empty"
          >
            <div className="text-gray-900 font-medium">
              Keine Immobilien gefunden.
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {search.trim()
                ? "Keine Treffer für deine Suche."
                : "Füge deine erste Immobilie hinzu, um hier eine Übersicht zu sehen."}
            </div>
            <div className="mt-4 inline-flex">
              <Link href="/app/immobilien/hinzufuegen">
                <Button>+ Immobilie hinzufügen</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
            data-tour="properties-grid"
          >
            {filtered.map((property) => {
              const title = safeStr(property.title) || "Ohne Titel";
              const addr = [
                safeStr(property.street_address),
                safeStr(property.city),
              ]
                .filter(Boolean)
                .join(", ");
              const readiness = readinessForProperty(property);

              const firstPath = property.image_urls?.[0];
              // Compute imgSrc using API redirect for signed URL
              const imgSrc =
                firstPath && !firstPath.startsWith("http")
                  ? `/api/storage/signed-url?bucket=${encodeURIComponent(
                      PROPERTY_IMAGES_BUCKET
                    )}&path=${encodeURIComponent(firstPath)}`
                  : firstPath || "";

              return (
                <div
                  key={property.id}
                  className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
                  data-tour="property-card"
                >
                  {imgSrc ? (
                    <div className="relative w-full h-48">
                      {/* Use regular img to avoid next/image issues */}
                      <img
                        src={imgSrc}
                        alt={title}
                        loading="lazy"
                        decoding="async"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          // If the signed URL endpoint fails, fall back to the placeholder
                          (e.currentTarget as HTMLImageElement).src = "";
                        }}
                        className="object-cover w-full h-48"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-48 bg-[#fbfbfc] border-b border-gray-200 flex items-center justify-center text-gray-400">
                      <div className="text-sm">Kein Bild</div>
                    </div>
                  )}

                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[11px] font-medium px-2 py-1 rounded-full border ${
                          readiness.ready
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-amber-50 border-amber-200 text-amber-900"
                        }`}
                      >
                        Readiness {readiness.score}%
                      </span>
                      {safeStr((property as any).status) && (
                        <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-900">
                          {safeStr((property as any).status)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-base font-semibold truncate">
                        {title}
                      </h2>
                      <p className="text-sm text-gray-600 truncate">
                        {addr || "Adresse fehlt"}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] px-3 py-2">
                        <div className="text-[11px] text-gray-500">Preis</div>
                        <div className="font-medium text-gray-900">
                          {formatCurrency(property.price)}
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] px-3 py-2">
                        <div className="text-[11px] text-gray-500">Fläche</div>
                        <div className="font-medium text-gray-900">
                          {formatNumber(property.size_sqm, " m²")}
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] px-3 py-2">
                        <div className="text-[11px] text-gray-500">Baujahr</div>
                        <div className="font-medium text-gray-900">
                          {property.year_built ?? "—"}
                        </div>
                      </div>
                      <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] px-3 py-2">
                        <div className="text-[11px] text-gray-500">Typ</div>
                        <div className="font-medium text-gray-900 truncate">
                          {safeStr(property.type) || "—"}
                        </div>
                      </div>
                    </div>

                    {readiness.missing.length > 0 && (
                      <div className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-2">
                        <div className="text-[11px] text-gray-500">
                          Für Autopilot noch sinnvoll:
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {readiness.missing.slice(0, 4).map((item) => (
                            <span
                              key={item}
                              className="text-[11px] px-2 py-0.5 rounded-full border border-gray-200 bg-white text-gray-700"
                            >
                              {item}
                            </span>
                          ))}
                          {readiness.missing.length > 4 && (
                            <span className="text-[11px] text-gray-500 px-1 py-0.5">
                              +{readiness.missing.length - 4} weitere
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="pt-1 flex gap-2">
                      {/* ✅ details route will work once [id]/page.tsx exists */}
                      <Link
                        href={`/app/immobilien/${property.id}`}
                        className="w-full"
                        data-tour="property-details"
                      >
                        <Button size="sm" className="w-full">
                          Details
                        </Button>
                      </Link>
                      <Link
                        href={`/app/immobilien/${property.id}/bearbeiten`}
                        className="w-full"
                        data-tour="property-edit"
                      >
                        <Button size="sm" variant="outline" className="w-full">
                          Bearbeiten
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
