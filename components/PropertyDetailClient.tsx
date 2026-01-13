"use client";

import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import Image from "next/image";
import { useState, useEffect, useMemo, useCallback } from "react";
import clsx from "clsx";

interface Property {
  id: number;
  city: string;
  neighbourhood?: string | null;
  neighborhood?: string | null;
  street_address: string;
  type: string;
  price: number;
  price_type: string;
  rooms: number;
  size_sqm: number;
  floor: number;
  year_built: number;
  furnished: boolean;
  pets_allowed: boolean | string | null;
  heating: string;
  energy_label: string;
  available_from: string;
  elevator: boolean;
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
}

function formatCurrencyEUR(value: unknown): string {
  if (typeof value === "number" && !isNaN(value)) {
    return value.toLocaleString("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0 });
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return "—";
    const num = Number(trimmed);
    if (!isNaN(num)) {
      return num.toLocaleString("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 0 });
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

function firstNonEmpty(...vals: Array<string | null | undefined>): string {
  for (const val of vals) {
    if (val && val.trim() !== "") return val.trim();
  }
  return "";
}

function normalizeVermarktung(value: unknown): string {
  const raw = String(value ?? "").trim();
  if (!raw) return "—";
  const v = raw.toLowerCase();
  if (v === "rent" || v === "vermietung" || v === "miete") return "Vermietung";
  if (v === "sale" || v === "verkauf" || v === "kauf") return "Verkauf";
  // If stored already as proper label, keep it
  if (raw === "Vermietung" || raw === "Verkauf") return raw;
  return raw;
}

export default function PropertyDetailClient({
  property,
  image_urls = [],
}: {
  property: Property;
  image_urls?: string[] | null;
}) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const [resolvedImageUrls, setResolvedImageUrls] = useState<string[]>([]);

  const rawImageUrls = useMemo(() => {
    const arr = Array.isArray(image_urls) ? image_urls : [];
    return arr.filter(Boolean);
  }, [image_urls]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!rawImageUrls.length) {
        setResolvedImageUrls([]);
        return;
      }

      // Already full URLs can be used as-is
      const httpUrls = rawImageUrls.filter((u) => u.startsWith("http"));
      const storagePaths = rawImageUrls.filter((u) => !u.startsWith("http"));

      // Resolve private storage paths via signed-url endpoint
      let signed: string[] = [];
      if (storagePaths.length > 0) {
        try {
          const res = await fetch("/api/storage/signed-url", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ paths: storagePaths }),
          });

          const data = await res.json().catch(() => ({}));
          if (!res.ok) {
            throw new Error(data?.error || "Konnte Bilder nicht laden.");
          }

          // Endpoint should return { urls: string[] } matching order
          signed = Array.isArray(data?.urls) ? data.urls : [];
        } catch (e) {
          console.error(e);
          // Fallback: keep paths (will likely fail if bucket is private)
          signed = storagePaths;
        }
      }

      // Rebuild in original order
      const byPath = new Map<string, string>();
      for (let i = 0; i < storagePaths.length; i++) {
        byPath.set(storagePaths[i], signed[i] ?? storagePaths[i]);
      }

      const ordered = rawImageUrls.map((u) =>
        u.startsWith("http")
          ? u
          : byPath.get(u) ?? u
      );

      if (!cancelled) setResolvedImageUrls(ordered);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [rawImageUrls]);

  const hasImages = resolvedImageUrls.length > 0;

  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: resolvedImageUrls.length > 1,
    slides: { perView: 1 },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
  });

  const openLightbox = (index: number) => {
    setActiveImage(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const goPrev = useCallback(() => {
    if (instanceRef.current) {
      const prev = (currentSlide - 1 + resolvedImageUrls.length) % resolvedImageUrls.length;
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

  // Helper renderers for boolean and numeric fields
  function renderBool(value: boolean | string | null | undefined): string {
    if (typeof value === "boolean") return value ? "Ja" : "Nein";
    if (typeof value === "string") return value.trim() === "" ? "—" : value;
    return "—";
  }

  function renderNumber(value: number | null | undefined): string {
    if (typeof value === "number" && !isNaN(value)) return value.toString();
    return "—";
  }

  // Helper to parse multiline text for bullet list detection
  function renderTextWithBullets(text: string | null | undefined) {
    if (!text || text.trim() === "") return null;
    const lines = text.trim().split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
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

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {/* IMAGE SLIDER CARD */}
        <section className="mb-6 bg-white rounded-2xl border border-gray-200 p-4">
          <h2 className="text-lg font-semibold mb-2 bg-[#fbfbfc] rounded-md px-3 py-1 inline-block">
            Bilder
          </h2>
          <p className="text-xs text-gray-500 mb-3">Klicken Sie auf ein Bild, um es zu vergrößern.</p>
          {hasImages ? (
            <>
              <div
                ref={sliderRef}
                className="keen-slider rounded-md overflow-hidden"
                style={{ height: "450px" }}
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
                      <Image
                        src={url}
                        alt={`Property image ${idx + 1}`}
                        width={1200}
                        height={800}
                        className="object-cover h-full w-full rounded-md"
                      />
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
                      currentSlide === idx ? "bg-gray-800" : "bg-gray-300"
                    )}
                    aria-label={`Bild ${idx + 1}`}
                  ></button>
                ))}
              </div>

              {/* Thumbnails below dots - desktop only */}
              <div className="hidden md:flex gap-2 overflow-x-auto mt-3">
                {resolvedImageUrls.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => instanceRef.current?.moveToIdx(idx)}
                    className={clsx(
                      "flex-shrink-0 rounded-lg border",
                      currentSlide === idx ? "border-blue-600" : "border-transparent",
                      "focus:outline-none focus:ring-2 focus:ring-blue-500"
                    )}
                    aria-label={`Thumbnail Bild ${idx + 1}`}
                    type="button"
                  >
                    <Image
                      src={url}
                      alt={`Thumbnail Bild ${idx + 1}`}
                      width={120}
                      height={80}
                      className="object-cover rounded-lg"
                      unoptimized={false}
                    />
                  </button>
                ))}
              </div>

              {/* LIGHTBOX OVERLAY */}
              {lightboxOpen && (
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
                    <Image
                      src={resolvedImageUrls[activeImage]}
                      alt={`Großansicht Bild ${activeImage + 1}`}
                      fill
                      style={{ objectFit: "contain" }}
                      priority
                    />
                    <button
                      className="absolute top-4 right-4 text-white text-3xl font-bold leading-none p-1 rounded hover:bg-black/40"
                      onClick={closeLightbox}
                      aria-label="Schließen"
                      type="button"
                    >
                      ✕
                    </button>

                    {/* Left/Right navigation buttons if more than 1 image */}
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
              <div className="text-sm font-medium text-gray-900">Keine Bilder</div>
              <div className="text-xs text-gray-500">Für diese Immobilie sind noch keine Fotos hinterlegt.</div>
            </div>
          )}
        </section>

        {/* HEADER CARD */}
        <section className="mb-6 bg-white rounded-2xl border border-gray-200 p-6">
          <h1 className="text-3xl font-bold mb-2">{property.title}</h1>
          <div className="text-gray-600 mb-3">
            {firstNonEmpty(
              property.street_address,
              ""
            )}
            {property.city ? `, ${property.city}` : ""}
            {(property.neighborhood || property.neighbourhood) ? `, ${firstNonEmpty(property.neighborhood, property.neighbourhood)}` : ""}
          </div>
          <div className="flex flex-wrap items-baseline gap-4 mb-4">
            <div className="text-2xl font-extrabold text-blue-700">
              {formatCurrencyEUR(property.price)}
            </div>
            <div className="text-sm font-medium uppercase text-gray-500 select-none">
              {normalizeVermarktung(property.price_type)}
            </div>
            {property.status && (
              <span className="ml-auto inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-800 select-none">
                {property.status}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-sm text-gray-700">
            {property.rooms !== undefined && property.rooms !== null && (
              <div className="bg-gray-100 rounded-full px-3 py-1">{property.rooms} Zimmer</div>
            )}
            {property.size_sqm !== undefined && property.size_sqm !== null && (
              <div className="bg-gray-100 rounded-full px-3 py-1">{property.size_sqm} m²</div>
            )}
            {property.floor !== undefined && property.floor !== null && (
              <div className="bg-gray-100 rounded-full px-3 py-1">Etage {property.floor}</div>
            )}
            {property.year_built !== undefined && property.year_built !== null && (
              <div className="bg-gray-100 rounded-full px-3 py-1">Baujahr {property.year_built}</div>
            )}
            {property.energy_label && (
              <div className="bg-gray-100 rounded-full px-3 py-1">Energieklasse {property.energy_label}</div>
            )}
          </div>
        </section>

        {/* TWO COLUMN GRID */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Left Column - Beschreibung */}
          <article className="bg-white rounded-2xl border border-gray-200 p-6 prose max-w-full">
            <h2>Beschreibung</h2>
            {property.listing_summary && (
              <p className="text-gray-700 mb-4 font-semibold">{property.listing_summary}</p>
            )}
            <p>{property.description}</p>
          </article>

          {/* Right Column - Details */}
          <article className="bg-white rounded-2xl border border-gray-200 p-6 text-sm text-gray-700 space-y-3">
            <h2 className="mb-3 text-base font-semibold border-b border-gray-200 pb-2">Details</h2>
            <div className="grid grid-cols-2 gap-y-2 gap-x-4">
              <div className="font-semibold">Vermarktung:</div>
              <div>{normalizeVermarktung(property.price_type)}</div>

              <div className="font-semibold">Typ:</div>
              <div>{firstNonEmpty(property.type, "—")}</div>

              <div className="font-semibold">Zimmer:</div>
              <div>{renderNumber(property.rooms)}</div>

              <div className="font-semibold">Fläche:</div>
              <div>{property.size_sqm ? `${property.size_sqm} m²` : "—"}</div>

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
                    className="text-blue-600 underline"
                  >
                    Ansehen
                  </a>
                ) : (
                  "—"
                )}
              </div>
            </div>
          </article>
        </section>

        {/* Conditional Additional Cards */}
        {property.highlights && property.highlights.trim() !== "" && (
          <section className="mb-6 bg-white rounded-2xl border border-gray-200 p-6 prose max-w-full">
            <h2>Highlights</h2>
            {renderTextWithBullets(property.highlights)}
          </section>
        )}

        {property.requirements && property.requirements.trim() !== "" && (
          <section className="mb-6 bg-white rounded-2xl border border-gray-200 p-6 prose max-w-full">
            <h2>Voraussetzungen</h2>
            {renderTextWithBullets(property.requirements)}
          </section>
        )}

        {property.contact_instructions && property.contact_instructions.trim() !== "" && (
          <section className="mb-6 bg-white rounded-2xl border border-gray-200 p-6 prose max-w-full">
            <h2>Kontakt / Besichtigung</h2>
            <p>{property.contact_instructions}</p>
          </section>
        )}

        {property.internal_notes && property.internal_notes.trim() !== "" && (
          <section className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 p-6 prose max-w-full relative">
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
        <div className="text-xs text-gray-400 mt-4 text-right select-none">
          Letzte Aktualisierung: {formatDateDE(property.updated_at ?? property.created_at)}{" "}
          {property.updated_at ? `um ${new Date(property.updated_at).toLocaleTimeString("de-DE")}` : ""}
        </div>
      </div>
    </div>
  );
}
