"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  useSessionContext,
  useSupabaseClient,
} from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Database } from "@/types/supabase";

const PROPERTY_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PROPERTY_IMAGES_BUCKET || "property-images";

type Property = {
  id: number;
  title: string | null;
  street_address: string | null;
  city: string | null;
  price: number | null;
  size_sqm: number | null;
  year_built: number | null;
  type: string | null;
  image_urls: string[] | null;
  created_at?: string | null;
  agent_id?: string | null;
};

type SortKey =
  | "created_desc"
  | "created_asc"
  | "price_desc"
  | "price_asc"
  | "size_desc"
  | "size_asc";

function safeStr(v: unknown) {
  return String(v ?? "").trim();
}

function formatCurrency(v: number | null | undefined) {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatNumber(v: number | null | undefined, suffix = "") {
  const n = Number(v);
  if (!Number.isFinite(n) || n <= 0) return "—";
  return `${new Intl.NumberFormat("de-DE").format(n)}${suffix}`;
}

function SignedThumb({
  path,
  title,
  supabase,
}: {
  path: string;
  title: string;
  supabase: ReturnType<typeof useSupabaseClient<Database>>;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!path) return;
      setErr(null);

      // createSignedUrl -> benötigt Storage-Policy (die du bereits hast / haben solltest)
      const { data, error } = await supabase.storage
        .from(PROPERTY_IMAGES_BUCKET)
        .createSignedUrl(path, 60 * 30); // 30 min

      if (cancelled) return;

      if (error || !data?.signedUrl) {
        setErr(error?.message ?? "Signed URL fehlgeschlagen");
        setUrl(null);
        return;
      }

      setUrl(data.signedUrl);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [path, supabase]);

  if (!path) {
    return (
      <div className="w-full h-48 bg-[#fbfbfc] border-b border-gray-200 flex items-center justify-center text-gray-400">
        <div className="text-sm">Kein Bild</div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="w-full h-48 bg-[#fbfbfc] border-b border-gray-200 flex items-center justify-center text-gray-500 px-4 text-center">
        <div className="text-xs">
          Bild konnte nicht geladen werden.
          <div className="mt-1 text-[11px] text-gray-400 break-all">{err}</div>
        </div>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="w-full h-48 bg-[#fbfbfc] border-b border-gray-200 flex items-center justify-center text-gray-400">
        <div className="text-sm">Lade Bild…</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-48">
      {/* absichtlich <img> statt next/image => keine Domain/Loader-Probleme */}
      <img
        src={url}
        alt={title}
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
      />
    </div>
  );
}

export default function ImmobilienPage() {
  const [search, setSearch] = useState("");
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("created_desc");

  const { session, isLoading } = useSessionContext();
  const user = session?.user;
  const router = useRouter();
  const supabase = useSupabaseClient<Database>();

  useEffect(() => {
    const fetchProperties = async () => {
      if (isLoading) return;

      if (!user) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      // WICHTIG: kein updated_at!
      const { data, error } = await supabase
        .from("properties")
        .select(
          "id,title,street_address,city,price,size_sqm,year_built,type,image_urls,created_at,agent_id"
        )
        .eq("agent_id", user.id);

      if (error) {
        console.error("Fehler beim Laden:", error.message);
        setProperties([]);
      } else {
        setProperties((data as any) || []);
      }

      setLoading(false);
    };

    void fetchProperties();
  }, [isLoading, user, router, supabase]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const base = (properties ?? []).filter((p) => {
      if (!q) return true;
      const hay = `${safeStr(p.title)} ${safeStr(p.street_address)} ${safeStr(
        p.city
      )}`.toLowerCase();
      return hay.includes(q);
    });

    const sorted = [...base].sort((a, b) => {
      const aCreated = new Date(a.created_at ?? 0).getTime();
      const bCreated = new Date(b.created_at ?? 0).getTime();
      const aPrice = Number(a.price ?? 0);
      const bPrice = Number(b.price ?? 0);
      const aSize = Number(a.size_sqm ?? 0);
      const bSize = Number(b.size_sqm ?? 0);

      switch (sortBy) {
        case "created_asc":
          return aCreated - bCreated;
        case "price_desc":
          return bPrice - aPrice;
        case "price_asc":
          return aPrice - bPrice;
        case "size_desc":
          return bSize - aSize;
        case "size_asc":
          return aSize - bSize;
        case "created_desc":
        default:
          return bCreated - aCreated;
      }
    });

    return sorted;
  }, [properties, search, sortBy]);

  if (isLoading || loading) {
    return <p className="text-muted-foreground">Lade Immobilien…</p>;
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl md:text-2xl font-semibold">Immobilien</h1>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200">
                Advaic
              </span>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                {filtered.length} angezeigt
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              Übersicht aller aktiven Objekte unter deiner Betreuung.
            </p>
          </div>

          <div className="flex flex-col md:flex-row gap-2 md:items-center">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Suche nach Titel oder Adresse"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border px-3 py-2 rounded-lg text-sm w-full md:w-72 bg-white border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
              />
              <Link href="/app/immobilien/hinzufuegen">
                <Button>+ Immobilie hinzufügen</Button>
              </Link>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortKey)}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50"
                title="Sortierung"
              >
                <option value="created_desc">Neueste zuerst</option>
                <option value="created_asc">Älteste zuerst</option>
                <option value="price_desc">Preis: hoch → niedrig</option>
                <option value="price_asc">Preis: niedrig → hoch</option>
                <option value="size_desc">Fläche: groß → klein</option>
                <option value="size_asc">Fläche: klein → groß</option>
              </select>
            </div>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
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
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {filtered.map((property) => {
              const title = safeStr(property.title) || "Ohne Titel";
              const addr = [
                safeStr(property.street_address),
                safeStr(property.city),
              ]
                .filter(Boolean)
                .join(", ");

              const firstPath = property.image_urls?.[0] || "";

              return (
                <div
                  key={property.id}
                  className="rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-md transition-shadow"
                >
                  <SignedThumb
                    path={firstPath}
                    title={title}
                    supabase={supabase}
                  />

                  <div className="p-4 space-y-3">
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

                    <div className="pt-1 flex gap-2">
                      <Link
                        href={`/app/immobilien/${property.id}`}
                        className="w-full"
                      >
                        <Button size="sm" className="w-full">
                          Details
                        </Button>
                      </Link>
                      <Link
                        href={`/app/immobilien/${property.id}/bearbeiten`}
                        className="w-full"
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
