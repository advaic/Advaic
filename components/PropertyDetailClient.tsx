"use client";

import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import Image from "next/image";
import { useState, useEffect, useMemo, useCallback } from "react";
import clsx from "clsx";
import { supabase } from "@/lib/supabaseClient";

interface Property {
  id: string;
  city: string;
  neighbourhood?: string | null;
  neighborhood?: string | null;
  street_address: string;
  type: string;
  price: number;
  price_type: string; // we keep Vermarktung stored here
  rooms: number | string | null;
  size_sqm: number | null;
  floor: number | string | null;
  year_built: number | null;
  furnished: boolean | null;
  pets_allowed: boolean | string | null;
  heating: string;
  energy_label: string;
  available_from: string;
  elevator: boolean | null;
  parking: string;
  title: string;
  description: string;
  url?: string | null;
  created_at: string;
  updated_at?: string | null;

  listing_summary?: string | null;
  highlights?: string | null;
  requirements?: string | null;
  contact_instructions?: string | null;
  internal_notes?: string | null;
  status?: string | null;
  image_urls?: string[] | null;

  // ✅ Missing schema fields (added)
  requirements_checklist?: Record<string, any> | null;
  requirements_notes?: string | null;

  rent_min_income?: number | null;
  rent_max_people?: number | null;
  rent_pets_policy?: string | null;
  rent_move_in_from?: string | null;

  sale_financing_required?: boolean | null;
  sale_buyer_commission?: string | null;
  sale_handover_date?: string | null;

  draft_started_at?: string | null;
  last_edit_at?: string | null;
  meta?: Record<string, any> | null;
}

type TriState = "inherit" | "on" | "off";

type PropertyFollowupPolicyRow = {
  enabled: boolean | null;
  max_stage_rent: number | null;
  max_stage_buy: number | null;
  stage1_delay_hours: number | null;
  stage2_delay_hours: number | null;
  updated_at: string | null;
};

type AgentFollowupDefaultsRow = {
  followups_enabled_default: boolean;
  followups_max_stage_rent: number;
  followups_max_stage_buy: number;
  followups_delay_hours_stage1: number;
  followups_delay_hours_stage2: number;
};

function formatCurrencyEUR(value: unknown): string {
  if (typeof value === "number" && !isNaN(value)) {
    return value.toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR",
      minimumFractionDigits: 0,
    });
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "—";
    const num = Number(trimmed);
    if (!isNaN(num)) {
      return num.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 0,
      });
    }
  }
  return "—";
}

function formatDateDE(value: unknown): string {
  if (!value) return "—";
  try {
    const d = new Date(value as string);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString("de-DE");
  } catch {
    return "—";
  }
}

function formatDateTimeDE(value: unknown): string {
  if (!value) return "—";
  try {
    const d = new Date(String(value));
    if (isNaN(d.getTime())) return "—";
    const date = d.toLocaleDateString("de-DE");
    const time = d.toLocaleTimeString("de-DE", {
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${date} · ${time}`;
  } catch {
    return "—";
  }
}

function firstNonEmpty(...vals: Array<string | null | undefined>): string {
  for (const val of vals) {
    if (val && val.trim() !== "") return val.trim();
  }
  return "";
}

function resolveVermarktung(value: unknown): {
  key: "rent" | "sale" | "unknown";
  label: string;
} {
  const raw = String(value ?? "").trim();
  if (!raw) return { key: "unknown", label: "—" };
  const v = raw.toLowerCase();

  if (v === "rent" || v === "vermietung" || v === "miete")
    return { key: "rent", label: "Vermietung" };
  if (v === "sale" || v === "verkauf" || v === "kauf")
    return { key: "sale", label: "Verkauf" };

  if (raw === "Vermietung") return { key: "rent", label: raw };
  if (raw === "Verkauf") return { key: "sale", label: raw };

  return { key: "unknown", label: raw };
}

function normalizeChecklist(
  input: any,
): Array<{ label: string; checked: boolean }> {
  if (!input || typeof input !== "object") return [];

  if (Array.isArray(input)) {
    return input
      .map((x) => {
        if (!x) return null;
        if (typeof x === "string") return { label: x.trim(), checked: true };
        if (typeof x === "object") {
          const label = String(
            (x as any).label ?? (x as any).name ?? "",
          ).trim();
          const checked = Boolean(
            (x as any).checked ?? (x as any).done ?? (x as any).value ?? true,
          );
          return label ? { label, checked } : null;
        }
        return null;
      })
      .filter(Boolean) as any;
  }

  return Object.entries(input)
    .map(([k, v]) => ({ label: String(k).trim(), checked: Boolean(v) }))
    .filter((x) => x.label);
}

async function fetchSignedUrlMap(params: {
  bucket: string;
  paths: string[];
}): Promise<Record<string, string>> {
  const bucket = String(params.bucket ?? "").trim();
  const paths = Array.isArray(params.paths) ? params.paths.filter(Boolean) : [];
  if (!paths.length) return {};

  const candidates: Array<{ url: string; method: "POST" }> = [
    { url: "/api/storage/signed-url", method: "POST" },
    { url: "/api/storage/signed-urls", method: "POST" },
    { url: "/api/storage/signedUrl", method: "POST" },

    { url: "/app/api/storage/signed-url", method: "POST" },
    { url: "/app/api/storage/signed-urls", method: "POST" },
    { url: "/app/api/storage/signedUrl", method: "POST" },
  ];

  const toMap = (data: any): Record<string, string> => {
    if (data?.signedUrls && typeof data.signedUrls === "object")
      return data.signedUrls;
    if (data?.signed_urls && typeof data.signed_urls === "object")
      return data.signed_urls;
    if (data?.signed_url_map && typeof data.signed_url_map === "object")
      return data.signed_url_map;
    if (data?.data?.signedUrls && typeof data.data.signedUrls === "object")
      return data.data.signedUrls;
    if (data?.data?.signed_urls && typeof data.data.signed_urls === "object")
      return data.data.signed_urls;

    if (typeof data?.signedUrl === "string" && paths.length === 1)
      return { [paths[0]]: data.signedUrl };
    if (typeof data?.signed_url === "string" && paths.length === 1)
      return { [paths[0]]: data.signed_url };

    if (Array.isArray(data?.urls) && data.urls.length === paths.length) {
      return Object.fromEntries(paths.map((p, i) => [p, data.urls[i]]));
    }

    return {};
  };

  const payloadVariants = (b: string, ps: string[]) => {
    const first = ps[0];
    return [
      { bucket: b, paths: ps },
      { bucket: b, image_paths: ps },
      { bucket: b, path: first },
      { bucket: b, image_path: first },
      { paths: ps },
      { image_paths: ps },
      { path: first },
      { image_path: first },
    ];
  };

  for (const c of candidates) {
    for (const body of payloadVariants(bucket, paths)) {
      try {
        const res = await fetch(c.url, {
          method: c.method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = (await res.json().catch(() => ({}))) as any;

        if (!res.ok) {
          if (res.status === 404 || res.status === 405) break;
          continue;
        }

        const mapped = toMap(data);
        if (mapped && Object.keys(mapped).length > 0) return mapped;
      } catch {
        continue;
      }
    }
  }

  return {};
}

export default function PropertyDetailClient({
  propertyId,
}: {
  propertyId: string;
}) {
  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const [resolvedImageUrls, setResolvedImageUrls] = useState<string[]>([]);
  const PROPERTY_IMAGES_BUCKET =
    process.env.NEXT_PUBLIC_SUPABASE_PROPERTY_IMAGES_BUCKET ||
    "property-images";

  const [policyLoading, setPolicyLoading] = useState(false);
  const [policyError, setPolicyError] = useState<string | null>(null);
  const [policyRow, setPolicyRow] = useState<PropertyFollowupPolicyRow | null>(
    null,
  );
  const [defaultsRow, setDefaultsRow] =
    useState<AgentFollowupDefaultsRow | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setLoadError(null);

        const { data, error } = await supabase
          .from("properties")
          .select("*")
          .eq("id", propertyId)
          .single();

        if (error) {
          if (!cancelled) {
            setLoadError(
              error.message || "Immobilie konnte nicht geladen werden.",
            );
            setProperty(null);
          }
          return;
        }

        if (!cancelled) setProperty(data as Property);
      } catch (e: any) {
        if (!cancelled) {
          setLoadError(e?.message ?? "Immobilie konnte nicht geladen werden.");
          setProperty(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const rawImageUrls = useMemo(() => {
    const arr = Array.isArray(property?.image_urls)
      ? (property?.image_urls as string[])
      : [];
    return arr.filter(Boolean);
  }, [property?.image_urls]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!rawImageUrls.length) {
        setResolvedImageUrls([]);
        return;
      }

      const httpUrls = rawImageUrls.filter((u) => u.startsWith("http"));

      const normalizePath = (p: string) => String(p || "").replace(/^\/+/, "");
      const storagePathsRaw = rawImageUrls.filter((u) => !u.startsWith("http"));
      const storagePaths = Array.from(
        new Set(storagePathsRaw.map(normalizePath)),
      ).filter(Boolean);

      let signedMap: Record<string, string> = {};
      if (storagePaths.length > 0) {
        signedMap = await fetchSignedUrlMap({
          bucket: PROPERTY_IMAGES_BUCKET,
          paths: storagePaths,
        });
      }

      const ordered = rawImageUrls
        .map((u) => {
          if (u.startsWith("http")) return u;
          const norm = normalizePath(u);
          return signedMap[u] || signedMap[norm];
        })
        .filter(
          (u): u is string => typeof u === "string" && u.startsWith("http"),
        );

      // Keep any public HTTP urls too (if they existed)
      const finalOrdered = [...ordered];
      for (const u of httpUrls) {
        if (!finalOrdered.includes(u)) finalOrdered.push(u);
      }

      if (!cancelled) setResolvedImageUrls(finalOrdered);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [rawImageUrls, PROPERTY_IMAGES_BUCKET]);

  const hasImages = resolvedImageUrls.length > 0;

  const vermarktung = useMemo(
    () => resolveVermarktung(property?.price_type),
    [property?.price_type],
  );

  const triState: TriState = useMemo(() => {
    if (!policyRow) return "inherit";
    if (policyRow.enabled === null) return "inherit";
    return policyRow.enabled ? "on" : "off";
  }, [policyRow]);

  const triStateLabel = useMemo(() => {
    if (triState === "inherit") return "Standard";
    if (triState === "on") return "An";
    return "Aus";
  }, [triState]);

  const triStateBadgeClasses = useMemo(() => {
    if (triState === "inherit")
      return "border-gray-200 bg-gray-50 text-gray-700";
    if (triState === "on")
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    return "border-red-200 bg-red-50 text-red-800";
  }, [triState]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setPolicyError(null);
        setPolicyLoading(true);

        const { data: auth } = await supabase.auth.getUser();
        const userId = auth?.user?.id ? String(auth.user.id) : "";

        if (!userId) {
          if (!cancelled) {
            setPolicyRow(null);
            setDefaultsRow(null);
          }
          return;
        }

        const { data: defData } = await supabase
          .from("agent_settings")
          .select(
            "followups_enabled_default, followups_max_stage_rent, followups_max_stage_buy, followups_delay_hours_stage1, followups_delay_hours_stage2",
          )
          .eq("agent_id", userId)
          .maybeSingle();

        if (!cancelled) {
          setDefaultsRow((defData as any) ?? null);
        }

        const { data, error } = await supabase
          .from("property_followup_policies")
          .select(
            "enabled, max_stage_rent, max_stage_buy, stage1_delay_hours, stage2_delay_hours, updated_at",
          )
          .eq("agent_id", userId)
          .eq("property_id", propertyId)
          .maybeSingle();

        if (error) {
          if (!cancelled) {
            setPolicyError(
              error.message || "Follow-up-Regeln konnten nicht geladen werden.",
            );
            setPolicyRow(null);
          }
          return;
        }

        if (!cancelled) {
          setPolicyRow((data as any) ?? null);
        }
      } catch (e: any) {
        if (!cancelled) {
          setPolicyError(
            e?.message ?? "Follow-up-Regeln konnten nicht geladen werden.",
          );
          setPolicyRow(null);
        }
      } finally {
        if (!cancelled) setPolicyLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [propertyId]);

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: resolvedImageUrls.length > 1,
    slides: { perView: 1 },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
  });

  useEffect(() => {
    if (resolvedImageUrls.length === 0) {
      setCurrentSlide(0);
      setActiveImage(0);
      return;
    }

    setCurrentSlide((i) => Math.min(i, resolvedImageUrls.length - 1));
    setActiveImage((i) => Math.min(i, resolvedImageUrls.length - 1));
    instanceRef.current?.update();
  }, [resolvedImageUrls, instanceRef]);

  const openLightbox = (index: number) => {
    setActiveImage(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goPrev = useCallback(() => {
    if (instanceRef.current) {
      const prev =
        (currentSlide - 1 + resolvedImageUrls.length) %
        resolvedImageUrls.length;
      instanceRef.current.moveToIdx(prev);
      setActiveImage(prev);
    }
  }, [currentSlide, resolvedImageUrls.length, instanceRef]);

  const goNext = useCallback(() => {
    if (instanceRef.current) {
      const next = (currentSlide + 1) % resolvedImageUrls.length;
      instanceRef.current.moveToIdx(next);
      setActiveImage(next);
    }
  }, [currentSlide, resolvedImageUrls.length, instanceRef]);

  useEffect(() => {
    if (!lightboxOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        closeLightbox();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        goNext();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [lightboxOpen, goPrev, goNext]);

  function renderBool(value: boolean | string | null | undefined): string {
    if (typeof value === "boolean") return value ? "Ja" : "Nein";
    if (typeof value === "string") return value.trim() === "" ? "—" : value;
    return "—";
  }

  function renderNumber(value: number | string | null | undefined): string {
    if (typeof value === "number" && !isNaN(value)) return String(value);
    if (typeof value === "string") {
      const t = value.trim();
      if (!t) return "—";
      const n = Number(t);
      if (!isNaN(n)) return t;
      return t;
    }
    return "—";
  }

  function renderTextWithBullets(text: string | null | undefined) {
    if (!text || text.trim() === "") return null;
    const lines = text
      .trim()
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    const isList = lines.every((l) => /^[-*•‣⁃]\s+/.test(l));
    if (isList) {
      return (
        <ul className="list-disc list-inside space-y-1">
          {lines.map((line, i) => (
            <li key={i}>{line.replace(/^[-*•‣⁃]\s+/, "")}</li>
          ))}
        </ul>
      );
    }
    return <p>{text}</p>;
  }

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <div className="text-sm text-gray-600">Lade Immobilie…</div>
          </div>
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
        <div className="max-w-6xl mx-auto px-4 md:px-6 py-10">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-2">
            <div className="text-sm font-medium text-gray-900">
              Immobilie nicht gefunden
            </div>
            <div className="text-sm text-gray-600">
              {loadError ??
                "Diese Immobilie existiert nicht oder du hast keinen Zugriff."}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900"
      data-tour="property-detail-page"
    >
      <div
        className="max-w-6xl mx-auto px-3 md:px-6 py-5 md:py-6"
        data-tour="property-detail-container"
      >
        {/* IMAGE SLIDER CARD */}
        <section
          className="mb-6 bg-white rounded-2xl border border-gray-200 p-3 max-[375px]:p-2.5 md:p-4"
          data-tour="property-detail-images"
        >
          <h2 className="text-lg font-semibold mb-2 bg-[#fbfbfc] rounded-md px-3 py-1 inline-block">
            Bilder
          </h2>
          <p className="text-xs text-gray-500 mb-3">
            Klicken Sie auf ein Bild, um es zu vergrößern.
          </p>

          {hasImages ? (
            <>
              <div
                ref={sliderRef}
                className="keen-slider rounded-md overflow-hidden"
                style={{ height: "clamp(260px, 52vw, 450px)" }}
                data-tour="property-detail-image-slider"
              >
                {resolvedImageUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="keen-slider__slide flex items-center justify-center"
                  >
                    <button
                      type="button"
                      onClick={() => openLightbox(idx)}
                      className="h-full w-full"
                      title="Bild vergrößern"
                    >
                      <div className="relative h-full w-full">
                        <Image
                          src={url}
                          alt={`Property image ${idx + 1}`}
                          fill
                          sizes="(max-width: 768px) 100vw, 1100px"
                          quality={95}
                          className="object-cover rounded-md"
                          priority={idx === 0}
                          loading={idx === 0 ? "eager" : "lazy"}
                        />
                      </div>
                    </button>
                  </div>
                ))}
              </div>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-2">
                {resolvedImageUrls.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => instanceRef.current?.moveToIdx(idx)}
                    className={clsx(
                      "w-3 h-3 rounded-full transition-colors",
                      currentSlide === idx ? "bg-amber-500" : "bg-gray-300",
                    )}
                    aria-label={`Bild ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Thumbnails below dots - desktop only */}
              <div
                className="hidden md:flex gap-2 overflow-x-auto mt-3"
                data-tour="property-detail-thumbnails"
              >
                {resolvedImageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => instanceRef.current?.moveToIdx(idx)}
                    className={clsx(
                      "flex-shrink-0 rounded-lg border",
                      currentSlide === idx
                        ? "border-amber-500"
                        : "border-transparent",
                      "focus:outline-none focus:ring-2 focus:ring-amber-300/60",
                    )}
                    aria-label={`Thumbnail Bild ${idx + 1}`}
                    type="button"
                  >
                    <div className="relative w-[120px] h-[80px]">
                      <Image
                        src={url}
                        alt={`Thumbnail Bild ${idx + 1}`}
                        fill
                        sizes="120px"
                        quality={90}
                        className="object-cover rounded-lg"
                        loading="lazy"
                      />
                    </div>
                  </button>
                ))}
              </div>

              {/* LIGHTBOX OVERLAY */}
              {lightboxOpen && resolvedImageUrls[activeImage] && (
                <div
                  className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center"
                  onClick={closeLightbox}
                  role="dialog"
                  aria-modal="true"
                  aria-label="Großansicht der Bilder"
                >
                  <div
                    className="relative w-[90%] h-[80%] max-w-5xl"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
                      <a
                        href={resolvedImageUrls[activeImage]}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-white/20 bg-black/40 px-3 py-1.5 text-xs font-medium text-white hover:bg-black/60"
                      >
                        Original öffnen
                      </a>
                    </div>

                    <Image
                      src={resolvedImageUrls[activeImage]}
                      alt={`Großansicht Bild ${activeImage + 1}`}
                      fill
                      sizes="(max-width: 768px) 100vw, 1200px"
                      quality={100}
                      style={{ objectFit: "contain" }}
                    />

                    <button
                      className="absolute top-4 right-4 text-white text-3xl font-bold leading-none p-1 rounded hover:bg-black/40"
                      onClick={closeLightbox}
                      aria-label="Schließen"
                      type="button"
                    >
                      ✕
                    </button>

                    {resolvedImageUrls.length > 1 && (
                      <>
                        <button
                          type="button"
                          onClick={goPrev}
                          className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white"
                          aria-label="Vorheriges Bild"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          onClick={goNext}
                          className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full bg-black/40 p-2 text-white hover:bg-black/60 focus:outline-none focus:ring-2 focus:ring-white"
                          aria-label="Nächstes Bild"
                        >
                          ›
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 rounded-full px-3 py-1 select-none">
                          {activeImage + 1} / {resolvedImageUrls.length}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-72 rounded-2xl border border-gray-200 bg-[#fbfbfc] flex flex-col items-center justify-center gap-2">
              <div className="text-sm font-medium text-gray-900">
                Keine Bilder
              </div>
              <div className="text-xs text-gray-500">
                Für diese Immobilie sind noch keine Fotos hinterlegt.
              </div>
            </div>
          )}
        </section>

        {/* HEADER CARD */}
        <section
          className="mb-6 bg-white rounded-2xl border border-gray-200 p-4 md:p-6"
          data-tour="property-detail-header"
        >
          <h1
            className="text-2xl max-[375px]:text-xl md:text-3xl font-bold mb-2"
            data-tour="property-detail-title"
          >
            {property.title}
          </h1>

          <div className="text-gray-600 mb-3">
            {firstNonEmpty(property.street_address, "")}
            {property.city
              ? `${property.street_address ? ", " : ""}${property.city}`
              : ""}
            {property.neighborhood || property.neighbourhood
              ? `, ${firstNonEmpty(property.neighborhood, property.neighbourhood)}`
              : ""}
          </div>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div
              className="text-2xl max-[375px]:text-xl font-extrabold text-gray-900"
              data-tour="property-detail-price"
            >
              {formatCurrencyEUR(property.price)}
            </div>

            <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-600 select-none rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1">
              {vermarktung.label}
            </div>

            {property.status && (
              <span className="ml-auto inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 select-none">
                {property.status}
              </span>
            )}
          </div>

          <div
            className="flex flex-wrap gap-3 text-sm text-gray-700"
            data-tour="property-detail-quickfacts"
          >
            {property.rooms !== undefined && property.rooms !== null && (
              <div className="bg-gray-100 rounded-full px-3 py-1">
                {renderNumber(property.rooms)} Zimmer
              </div>
            )}
            {property.size_sqm !== undefined && property.size_sqm !== null && (
              <div className="bg-gray-100 rounded-full px-3 py-1">
                {renderNumber(property.size_sqm)} m²
              </div>
            )}
            {property.floor !== undefined && property.floor !== null && (
              <div className="bg-gray-100 rounded-full px-3 py-1">
                Etage {renderNumber(property.floor)}
              </div>
            )}
            {property.year_built !== undefined &&
              property.year_built !== null && (
                <div className="bg-gray-100 rounded-full px-3 py-1">
                  Baujahr {renderNumber(property.year_built)}
                </div>
              )}
            {property.energy_label && (
              <div className="bg-gray-100 rounded-full px-3 py-1">
                Energieklasse {property.energy_label}
              </div>
            )}
          </div>
        </section>

        {/* TWO COLUMN GRID */}
        <section
          className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6"
          data-tour="property-detail-main"
        >
          {/* Left Column - Beschreibung */}
          <article
            className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 prose max-w-full"
            data-tour="property-detail-description"
          >
            <h2>Beschreibung</h2>
            {property.listing_summary && (
              <p className="text-gray-700 mb-4 font-semibold">
                {property.listing_summary}
              </p>
            )}
            <p>{property.description}</p>
          </article>

          {/* Right Column - Details */}
          <article
            className="bg-white rounded-2xl border border-gray-200 p-4 md:p-6 text-sm text-gray-700 space-y-3"
            data-tour="property-detail-details"
          >
            <h2 className="mb-3 text-base font-semibold border-b border-gray-200 pb-2">
              Details
            </h2>

            <div className="grid grid-cols-2 max-[375px]:grid-cols-1 gap-y-2 gap-x-4">
              <div className="font-semibold">Vermarktung:</div>
              <div>{vermarktung.label}</div>

              <div className="font-semibold">Typ:</div>
              <div>{firstNonEmpty(property.type, "—")}</div>

              <div className="font-semibold">Zimmer:</div>
              <div>{renderNumber(property.rooms)}</div>

              <div className="font-semibold">Fläche:</div>
              <div>
                {property.size_sqm != null
                  ? `${renderNumber(property.size_sqm)} m²`
                  : "—"}
              </div>

              <div className="font-semibold">Etage:</div>
              <div>{renderNumber(property.floor)}</div>

              <div className="font-semibold">Baujahr:</div>
              <div>{renderNumber(property.year_built)}</div>

              <div className="font-semibold">Heizung:</div>
              <div>{firstNonEmpty(property.heating, "—")}</div>

              <div className="font-semibold">Energieklasse:</div>
              <div>{firstNonEmpty(property.energy_label, "—")}</div>

              <div className="font-semibold">Möbliert:</div>
              <div>{renderBool(property.furnished)}</div>

              <div className="font-semibold">Haustiere erlaubt:</div>
              <div>{renderBool(property.pets_allowed)}</div>

              <div className="font-semibold">Aufzug:</div>
              <div>{renderBool(property.elevator)}</div>

              <div className="font-semibold">Parken:</div>
              <div>{firstNonEmpty(property.parking, "—")}</div>

              <div className="font-semibold">Verfügbar ab:</div>
              <div>{formatDateDE(property.available_from)}</div>

              <div className="font-semibold">Exposé:</div>
              <div>
                {property.url ? (
                  <a
                    href={property.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-900 underline decoration-amber-300 hover:decoration-amber-500"
                    data-tour="property-detail-expose-link"
                  >
                    Ansehen
                  </a>
                ) : (
                  "—"
                )}
              </div>
            </div>

            {/* ✅ Vermietung / Verkauf – zusätzliche Felder */}
            {vermarktung.key === "rent" && (
              <div
                className="mt-4 rounded-xl border border-gray-200 bg-[#fbfbfc] p-4"
                data-tour="property-detail-rent"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Vermietung
                </div>
                <div className="mt-3 grid grid-cols-2 max-[375px]:grid-cols-1 gap-x-4 gap-y-2 text-xs">
                  <div className="text-gray-500">Mindestnettoeinkommen</div>
                  <div className="text-gray-900 font-medium">
                    {property.rent_min_income != null
                      ? formatCurrencyEUR(property.rent_min_income)
                      : "—"}
                  </div>

                  <div className="text-gray-500">Max. Personen</div>
                  <div className="text-gray-900 font-medium">
                    {property.rent_max_people != null
                      ? String(property.rent_max_people)
                      : "—"}
                  </div>

                  <div className="text-gray-500">Haustiere (Policy)</div>
                  <div className="text-gray-900 font-medium">
                    {firstNonEmpty(property.rent_pets_policy, "—")}
                  </div>

                  <div className="text-gray-500">Einzug ab</div>
                  <div className="text-gray-900 font-medium">
                    {property.rent_move_in_from
                      ? formatDateDE(property.rent_move_in_from)
                      : "—"}
                  </div>
                </div>
              </div>
            )}

            {vermarktung.key === "sale" && (
              <div
                className="mt-4 rounded-xl border border-gray-200 bg-[#fbfbfc] p-4"
                data-tour="property-detail-sale"
              >
                <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Verkauf
                </div>
                <div className="mt-3 grid grid-cols-2 max-[375px]:grid-cols-1 gap-x-4 gap-y-2 text-xs">
                  <div className="text-gray-500">Finanzierung erforderlich</div>
                  <div className="text-gray-900 font-medium">
                    {renderBool(property.sale_financing_required)}
                  </div>

                  <div className="text-gray-500">Käuferprovision</div>
                  <div className="text-gray-900 font-medium">
                    {firstNonEmpty(property.sale_buyer_commission, "—")}
                  </div>

                  <div className="text-gray-500">Übergabe ab</div>
                  <div className="text-gray-900 font-medium">
                    {property.sale_handover_date
                      ? formatDateDE(property.sale_handover_date)
                      : "—"}
                  </div>
                </div>
              </div>
            )}

            {/* ✅ Voraussetzungen (Checkliste + Notizen) */}
            {(() => {
              const checklist = normalizeChecklist(
                property.requirements_checklist,
              );
              const hasChecklist = checklist.length > 0;
              const notes = firstNonEmpty(property.requirements_notes, "");
              if (!hasChecklist && !notes) return null;

              return (
                <div
                  className="mt-4 rounded-xl border border-gray-200 bg-white p-4"
                  data-tour="property-detail-requirements-checklist"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Voraussetzungen (Checkliste)
                    </div>
                    <span className="text-[11px] font-medium rounded-full px-2 py-0.5 border border-gray-200 bg-gray-50 text-gray-700">
                      {hasChecklist
                        ? `${checklist.filter((c) => c.checked).length}/${checklist.length} erfüllt`
                        : "Notizen"}
                    </span>
                  </div>

                  {hasChecklist && (
                    <ul className="mt-3 space-y-2">
                      {checklist.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span
                            className={clsx(
                              "mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full border text-[11px]",
                              item.checked
                                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                : "border-gray-200 bg-gray-50 text-gray-500",
                            )}
                            aria-hidden="true"
                          >
                            {item.checked ? "✓" : "–"}
                          </span>
                          <span
                            className={clsx(
                              "leading-5",
                              item.checked ? "text-gray-900" : "text-gray-700",
                            )}
                          >
                            {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {notes && (
                    <div
                      className={clsx(
                        "mt-3 text-sm text-gray-700",
                        hasChecklist ? "pt-3 border-t border-gray-200" : "",
                      )}
                    >
                      {notes}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Follow-up Regeln */}
            <div
              className="mt-4 pt-4 border-t border-gray-200"
              data-tour="property-detail-followup-policy"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Follow-up Regeln
                  </div>
                  <div className="text-sm text-gray-700 mt-1">
                    Diese Immobilie kann eigene Follow-up-Regeln haben. Wenn
                    nichts gesetzt ist, gilt der Standard des Maklers.
                  </div>
                </div>
                <span
                  className={clsx(
                    "shrink-0 text-xs font-medium rounded-full px-2.5 py-1 border",
                    triStateBadgeClasses,
                  )}
                >
                  {triStateLabel}
                </span>
              </div>

              {policyLoading ? (
                <div className="mt-3 text-xs text-gray-500">Lade Regeln…</div>
              ) : policyError ? (
                <div className="mt-3 text-xs text-red-600">{policyError}</div>
              ) : policyRow ? (
                <div className="mt-3 grid grid-cols-2 max-[375px]:grid-cols-1 gap-x-4 gap-y-2 text-xs">
                  <div className="text-gray-500">Max. Vermietung</div>
                  <div className="text-gray-900 font-medium">
                    {policyRow.max_stage_rent ?? "—"}
                  </div>

                  <div className="text-gray-500">Max. Verkauf</div>
                  <div className="text-gray-900 font-medium">
                    {policyRow.max_stage_buy ?? "—"}
                  </div>

                  <div className="text-gray-500">Delay Stufe 1</div>
                  <div className="text-gray-900 font-medium">
                    {policyRow.stage1_delay_hours != null
                      ? `${policyRow.stage1_delay_hours}h`
                      : "—"}
                  </div>

                  <div className="text-gray-500">Delay Stufe 2</div>
                  <div className="text-gray-900 font-medium">
                    {policyRow.stage2_delay_hours != null
                      ? `${policyRow.stage2_delay_hours}h`
                      : "—"}
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-gray-500">
                  Keine spezifischen Regeln gesetzt.
                </div>
              )}

              {defaultsRow && (
                <div className="mt-4 rounded-xl border border-gray-200 bg-[#fbfbfc] p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Standard (Makler)
                    </div>
                    <span
                      className={clsx(
                        "text-[11px] font-medium rounded-full px-2 py-0.5 border",
                        defaultsRow.followups_enabled_default
                          ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                          : "border-red-200 bg-red-50 text-red-800",
                      )}
                    >
                      {defaultsRow.followups_enabled_default
                        ? "Standard: An"
                        : "Standard: Aus"}
                    </span>
                  </div>

                  <div className="mt-2 grid grid-cols-2 max-[375px]:grid-cols-1 gap-x-4 gap-y-2 text-xs">
                    <div className="text-gray-500">Max. Vermietung</div>
                    <div className="text-gray-900 font-medium">
                      {defaultsRow.followups_max_stage_rent}
                    </div>

                    <div className="text-gray-500">Max. Verkauf</div>
                    <div className="text-gray-900 font-medium">
                      {defaultsRow.followups_max_stage_buy}
                    </div>

                    <div className="text-gray-500">Delay Stufe 1</div>
                    <div className="text-gray-900 font-medium">
                      {defaultsRow.followups_delay_hours_stage1}h
                    </div>

                    <div className="text-gray-500">Delay Stufe 2</div>
                    <div className="text-gray-900 font-medium">
                      {defaultsRow.followups_delay_hours_stage2}h
                    </div>
                  </div>

                  {triState !== "inherit" && (
                    <div className="mt-2 text-[11px] text-gray-500">
                      Hinweis: Diese Immobilie überschreibt den Standard.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ✅ System / Workflow */}
            <div
              className="mt-4 rounded-xl border border-gray-200 bg-[#fbfbfc] p-4"
              data-tour="property-detail-system"
            >
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                System & Workflow
              </div>
              <div className="mt-3 grid grid-cols-2 max-[375px]:grid-cols-1 gap-x-4 gap-y-2 text-xs">
                <div className="text-gray-500">Status</div>
                <div className="text-gray-900 font-medium">
                  {firstNonEmpty(property.status, "—")}
                </div>

                <div className="text-gray-500">Draft gestartet</div>
                <div className="text-gray-900 font-medium">
                  {formatDateTimeDE(property.draft_started_at)}
                </div>

                <div className="text-gray-500">Letzte Bearbeitung</div>
                <div className="text-gray-900 font-medium">
                  {formatDateTimeDE(
                    property.last_edit_at ?? property.updated_at,
                  )}
                </div>

                <div className="text-gray-500">Erstellt am</div>
                <div className="text-gray-900 font-medium">
                  {formatDateTimeDE(property.created_at)}
                </div>
              </div>
            </div>
          </article>
        </section>

        {/* Conditional Additional Cards */}
        {property.highlights && property.highlights.trim() !== "" && (
          <section
            className="mb-6 bg-white rounded-2xl border border-gray-200 p-4 md:p-6 prose max-w-full"
            data-tour="property-detail-highlights"
          >
            <h2>Highlights</h2>
            {renderTextWithBullets(property.highlights)}
          </section>
        )}

        {property.requirements && property.requirements.trim() !== "" && (
          <section
            className="mb-6 bg-white rounded-2xl border border-gray-200 p-4 md:p-6 prose max-w-full"
            data-tour="property-detail-requirements"
          >
            <h2>Voraussetzungen</h2>
            {renderTextWithBullets(property.requirements)}
          </section>
        )}

        {property.contact_instructions &&
          property.contact_instructions.trim() !== "" && (
            <section
              className="mb-6 bg-white rounded-2xl border border-gray-200 p-4 md:p-6 prose max-w-full"
              data-tour="property-detail-contact"
            >
              <h2>Kontakt / Besichtigung</h2>
              <p>{property.contact_instructions}</p>
            </section>
          )}

        {property.internal_notes && property.internal_notes.trim() !== "" && (
          <section
            className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 md:p-6 prose max-w-full relative"
            data-tour="property-detail-internal-notes"
          >
            <h2 className="flex items-center gap-2">
              Interne Notizen
              <span className="inline-block rounded-full bg-amber-300 text-amber-900 text-xs font-semibold px-2 py-0.5 select-none">
                Nur intern
              </span>
            </h2>
            <p>{property.internal_notes}</p>
          </section>
        )}

        {/* Last Updated Footer */}
        <div
          className="text-xs text-gray-400 mt-4 text-right select-none"
          data-tour="property-detail-last-updated"
        >
          Letzte Aktualisierung:{" "}
          {formatDateTimeDE(property.updated_at ?? property.created_at)}
        </div>
      </div>
    </div>
  );
}
