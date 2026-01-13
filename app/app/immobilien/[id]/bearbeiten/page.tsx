/*
  Page: immobilien/[id]/bearbeiten/page.tsx
  Purpose: Edit existing property (all fields + images), styled to match the modern Hinzufügen page.
  Notes:
  - Uses private storage paths in `properties.image_urls`.
  - Uses signed URL previews for images (private bucket).
  - Uses SortablePreviewList for reordering, preview, deletion.
  - API-based deletion of images (RLS-safe).
  - Adds support for new fields: listing_summary, highlights, requirements, internal_notes, contact_instructions, status.
*/

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  CloudUpload,
  Image as ImageIcon,
  Loader2,
  Save,
  Sparkles,
  Trash2,
} from "lucide-react";

import SortablePreviewList from "@/components/SortablePreviewList";
import { supabase } from "@/lib/supabaseClient";

const PROPERTY_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PROPERTY_IMAGES_BUCKET || "property-images";

/**
 * Remove private storage objects via server route (RLS-safe)
 * Expects /api/storage/remove to exist.
 */
async function removeStoragePathsViaApi(bucket: string, paths: string[]) {
  const cleaned = (paths || [])
    .filter(Boolean)
    .filter((p) => typeof p === "string" && !p.startsWith("http"));

  if (cleaned.length === 0) return;

  // 1) Try batch delete first (preferred)
  try {
    const res = await fetch("/api/storage/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket, paths: cleaned }),
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok) return;

    // fall through to per-path retry
    console.warn("/api/storage/remove batch failed, retrying per file", data);
  } catch (e) {
    console.warn("/api/storage/remove batch threw, retrying per file", e);
  }

  // 2) Retry per file (compat with `{ bucket, path }`)
  for (const p of cleaned) {
    const res = await fetch("/api/storage/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket, path: p }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error((data as any)?.error || "Konnte Dateien nicht löschen.");
    }
  }
}

/**
 * Be tolerant to different signed-url response shapes and return a map {path -> signedUrl}
 */
function extractSignedUrlMap(
  payload: any,
  paths: string[]
): Record<string, string> {
  const root = payload ?? {};
  const candidate =
    root.signedUrls ??
    root.signed_urls ??
    root.urls ??
    root.urlMap ??
    root.data;

  const map: Record<string, string> = {};
  if (!candidate) return map;

  // object map: { "path": "https://signed..." }
  if (typeof candidate === "object" && !Array.isArray(candidate)) {
    for (const [k, v] of Object.entries(candidate)) {
      if (typeof v === "string" && v.startsWith("http")) map[String(k)] = v;
    }
    return map;
  }

  // list of {path,url} objects
  if (
    Array.isArray(candidate) &&
    candidate.length > 0 &&
    typeof candidate[0] === "object"
  ) {
    for (const item of candidate) {
      const p = String(
        (item as any)?.path ?? (item as any)?.filePath ?? ""
      ).trim();
      const u = String(
        (item as any)?.url ??
          (item as any)?.signedUrl ??
          (item as any)?.signed_url ??
          ""
      ).trim();
      if (p && u && u.startsWith("http")) map[p] = u;
    }
    return map;
  }

  // legacy array aligned with paths: ["https://...","https://..."]
  if (Array.isArray(candidate)) {
    for (let i = 0; i < paths.length; i++) {
      const u = candidate[i];
      if (typeof u === "string" && u.startsWith("http")) map[paths[i]] = u;
    }
  }

  return map;
}

type PropertyEdit = {
  // id is numeric in your add page; here we keep it flexible (string|number) because route param is string
  id: string | number;

  title: string;
  city: string;
  neighborhood: string;
  street_address: string;
  type: string;
  price: string;

  /**
   * DB column stays `price_type` for compatibility,
   * but UI meaning is: Vermarktung (Vermietung/Verkauf)
   */
  price_type: string;

  size_sqm: string;
  rooms: string;
  floor: string;
  year_built: string;
  pets_allowed: boolean;
  heating: string;
  energy_label: string;
  available_from: string;
  parking: string;
  url: string;
  furnished: boolean;
  elevator: boolean;
  listing_summary: string;
  description: string;

  /** New fields (must exist in Supabase) */
  requirements: string;
  highlights: string;
  internal_notes: string;
  contact_instructions: string;

  status: "draft" | "published";

  /** private storage paths */
  image_urls: string[];
};

function safeTrim(v: unknown): string {
  return String(v ?? "").trim();
}

function isProbablyUrl(v: string): boolean {
  try {
    const u = new URL(v);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const idParam = params?.id as string | undefined;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [property, setProperty] = useState<PropertyEdit | null>(null);

  /**
   * IMPORTANT:
   * - `files` is CANONICAL and should contain (File | storagePath)
   * - The UI list uses signed URLs for preview, but we always convert back to storage paths for DB.
   */
  const [files, setFiles] = useState<(File | string)[]>([]);

  // For private buckets: resolve storage paths to signed preview URLs
  const [signedUrlMap, setSignedUrlMap] = useState<Record<string, string>>({});

  const signedUrlToPath = useMemo<Record<string, string>>(() => {
    const rev: Record<string, string> = {};
    for (const [path, url] of Object.entries(signedUrlMap)) {
      if (url) rev[url] = path;
    }
    return rev;
  }, [signedUrlMap]);

  const uiFiles = useMemo<(File | string)[]>(() => {
    return files.map((f) => {
      if (typeof f !== "string") return f;
      return signedUrlMap[f] ?? f;
    });
  }, [files, signedUrlMap]);

  const setUiFiles = useCallback(
    (next: (File | string)[]) => {
      const canonical = next.map((item) => {
        if (typeof item !== "string") return item;
        return signedUrlToPath[item] ?? item;
      });
      setFiles(canonical);
    },
    [signedUrlToPath]
  );

  // Track previous canonical paths so we can delete removed images from storage
  const prevImagePathsRef = useRef<string[]>([]);
  const authedUserIdRef = useRef<string | null>(null);

  const statusBadge = useMemo(() => {
    if (deleting)
      return {
        label: "Löschen…",
        cls: "bg-red-50 border-red-200 text-red-800",
      };
    if (uploadingImages)
      return {
        label: "Bilder…",
        cls: "bg-amber-50 border-amber-200 text-amber-800",
      };
    if (saving)
      return {
        label: "Speichern…",
        cls: "bg-white border-gray-200 text-gray-700",
      };
    if (lastSavedAt)
      return {
        label: "Gespeichert",
        cls: "bg-emerald-50 border-emerald-200 text-emerald-800",
      };
    return {
      label: "Bearbeiten",
      cls: "bg-white border-gray-200 text-gray-700",
    };
  }, [saving, lastSavedAt, uploadingImages, deleting]);

  // Fetch property
  useEffect(() => {
    if (!idParam) return;

    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .eq("id", idParam)
        .single();

      if (error || !data) {
        console.error("Fehler beim Laden der Immobilie:", error);
        toast.error("Konnte Immobilie nicht laden.");
        setLoading(false);
        return;
      }

      // Normalize legacy column names if needed
      const normalized: PropertyEdit = {
        id: data.id,
        title: data.title ?? "",
        city: data.city ?? "",
        neighborhood:
          (data as any).neighborhood ?? (data as any).neighbourhood ?? "",
        street_address: data.street_address ?? "",
        type: data.type ?? "",
        price: String(data.price ?? ""),
        price_type: data.price_type ?? "",
        size_sqm: String(data.size_sqm ?? ""),
        rooms: String(data.rooms ?? ""),
        floor: String(data.floor ?? ""),
        year_built: String(data.year_built ?? ""),
        pets_allowed: Boolean(data.pets_allowed ?? false),
        heating: data.heating ?? "",
        energy_label: data.energy_label ?? "",
        available_from: data.available_from ?? "",
        parking: data.parking ?? "",
        url: (data as any).url ?? (data as any).uri ?? "",
        furnished: Boolean(data.furnished ?? false),
        elevator: Boolean(data.elevator ?? false),
        listing_summary: data.listing_summary ?? "",
        description: data.description ?? "",

        requirements: (data as any).requirements ?? "",
        highlights: (data as any).highlights ?? "",
        internal_notes: (data as any).internal_notes ?? "",
        contact_instructions: (data as any).contact_instructions ?? "",

        status: (data.status as any) === "published" ? "published" : "draft",
        image_urls: (data.image_urls ?? []) as string[],
      };

      setProperty(normalized);
      setFiles((normalized.image_urls ?? []) as string[]);
      prevImagePathsRef.current = (normalized.image_urls ?? []) as string[];
      setLoading(false);
    };

    void fetchData();
  }, [idParam]);

  const persistUpdate = useCallback(
    async (updatedFields: Partial<PropertyEdit>) => {
      if (!property) return;
      setSaving(true);
      try {
        // keep DB columns consistent (neighborhood/url)
        const payload: any = { ...updatedFields };
        if ("neighborhood" in payload) {
          payload.neighborhood = payload.neighborhood;
          delete payload.neighbourhood;
        }
        if ("url" in payload) {
          payload.url = payload.url;
          delete payload.uri;
        }

        const { error } = await supabase
          .from("properties")
          .update(payload)
          .eq("id", property.id);

        if (error) {
          console.error("❌ Update error:", error);
          toast.error("Speichern fehlgeschlagen.");
          return;
        }

        setLastSavedAt(new Date().toISOString());
        setProperty((p) => (p ? { ...p, ...updatedFields } : p));
      } finally {
        setSaving(false);
      }
    },
    [property]
  );

  const schedulePersist = useCallback(
    (updatedFields: Partial<PropertyEdit>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persistUpdate(updatedFields);
      }, 500);
    },
    [persistUpdate]
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    if (!property) return;
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setProperty((prev) => (prev ? { ...prev, [name]: newValue } : prev));
    schedulePersist({ [name]: newValue } as any);
  };

  const uploadImageToSupabase = useCallback(
    async (file: File, propertyId: string | number) => {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");

      // Cache authed user id (needed for secure folder structure)
      if (!authedUserIdRef.current) {
        const {
          data: { user },
          error: userErr,
        } = await supabase.auth.getUser();

        if (userErr || !user) {
          throw new Error("Nicht eingeloggt. Bitte neu einloggen.");
        }

        authedUserIdRef.current = user.id;
      }

      const userId = authedUserIdRef.current;
      const filePath = `agents/${userId}/properties/${propertyId}/${Date.now()}-${safeName}`;

      const { error } = await supabase.storage
        .from(PROPERTY_IMAGES_BUCKET)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || undefined,
        });

      if (error) {
        console.error("❌ Upload error:", error);
        throw new Error(error.message || "Upload fehlgeschlagen");
      }

      return filePath; // private storage path
    },
    []
  );

  /**
   * Fetch signed preview URLs for the current storage paths (private bucket)
   */
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const paths = files
        .filter((f): f is string => typeof f === "string")
        .filter((p) => !!p && !p.startsWith("http"));

      if (paths.length === 0) {
        setSignedUrlMap({});
        return;
      }

      try {
        const res = await fetch("/api/storage/signed-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bucket: PROPERTY_IMAGES_BUCKET,
            paths,
            path: paths[0],
          }),
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          console.warn("signed-url failed", data);
          return;
        }

        const map = extractSignedUrlMap(data, paths);
        if (!cancelled) setSignedUrlMap(map);
      } catch (e) {
        console.warn("signed-url fetch error", e);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  // Robust upload + sync (same approach as Hinzufügen)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!property) return;

      // Upload new files, preserve ordering
      const hasNew = files.some((f) => typeof f !== "string");
      let nextFiles = files;

      if (hasNew) {
        setUploadingImages(true);
        try {
          const out: (File | string)[] = [];
          for (const item of files) {
            if (typeof item === "string") {
              out.push(item);
              continue;
            }
            const path = await uploadImageToSupabase(item, property.id);
            out.push(path);
          }
          nextFiles = out;
          if (!cancelled) setFiles(out);
        } catch (e: any) {
          console.error(e);
          toast.error(e?.message ?? "Bild-Upload fehlgeschlagen.");
        } finally {
          if (!cancelled) setUploadingImages(false);
        }
      }

      // Sync order to DB (strings only)
      const orderedPaths = nextFiles
        .map((f) => {
          if (typeof f !== "string") return null;
          // Convert any signed preview URLs back to storage paths (defensive)
          return signedUrlToPath[f] ?? f;
        })
        .filter((p): p is string => !!p && !p.startsWith("http"));

      const current = property.image_urls || [];
      const sameLen = current.length === orderedPaths.length;
      const same =
        sameLen &&
        current.every((v, i) => String(v) === String(orderedPaths[i]));

      if (!same && !cancelled) {
        setProperty((p) => (p ? { ...p, image_urls: orderedPaths } : p));
        prevImagePathsRef.current = orderedPaths;
        await persistUpdate({ image_urls: orderedPaths } as any);
      } else {
        prevImagePathsRef.current = orderedPaths;
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  /**
   * Delete removed images from private storage via /api/storage/remove
   * whenever the UI list changes (remove + reorder).
   */
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      const currentPaths = files
        .filter((f): f is string => typeof f === "string")
        .map((s) => signedUrlToPath[s] ?? s)
        .filter((p) => !!p && !p.startsWith("http"));

      const prev = prevImagePathsRef.current || [];
      const removed = prev.filter((p) => !currentPaths.includes(p));

      // Update ref early to prevent double deletes
      prevImagePathsRef.current = currentPaths;

      if (removed.length === 0) return;

      try {
        await removeStoragePathsViaApi(PROPERTY_IMAGES_BUCKET, removed);

        // Clean preview map as well
        setSignedUrlMap((prevMap) => {
          const next = { ...prevMap };
          for (const p of removed) delete next[p];
          return next;
        });
      } catch (e: any) {
        console.error(e);
        if (!cancelled)
          toast.error(e?.message ?? "Bild löschen fehlgeschlagen.");
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files]);

  const forceSaveNow = async () => {
    if (!property) return;
    await persistUpdate({
      title: property.title,
      city: property.city,
      neighborhood: property.neighborhood,
      street_address: property.street_address,
      type: property.type,
      price: property.price,
      price_type: property.price_type,
      size_sqm: property.size_sqm,
      rooms: property.rooms,
      floor: property.floor,
      year_built: property.year_built,
      pets_allowed: property.pets_allowed,
      heating: property.heating,
      energy_label: property.energy_label,
      available_from: property.available_from,
      parking: property.parking,
      url: property.url,
      furnished: property.furnished,
      elevator: property.elevator,
      listing_summary: property.listing_summary,
      description: property.description,

      requirements: property.requirements,
      highlights: property.highlights,
      internal_notes: property.internal_notes,
      contact_instructions: property.contact_instructions,

      status: property.status,
      image_urls:
        (files
          .filter((f) => typeof f === "string")
          .map((s) => (typeof s === "string" ? signedUrlToPath[s] ?? s : s))
          .filter(
            (p) => typeof p === "string" && p && !p.startsWith("http")
          ) as string[]) || [],
    } as any);

    toast.success("Änderungen gespeichert.");
  };

  const publishNow = async () => {
    if (!property) return;

    const requiredOk =
      safeTrim(property.title) &&
      safeTrim(property.city) &&
      safeTrim(property.type) &&
      safeTrim(property.price_type) &&
      safeTrim(property.price);

    if (!requiredOk) {
      toast.error(
        "Bitte fülle mindestens Titel, Stadt, Typ, Preis & Vermarktung aus."
      );
      return;
    }

    await persistUpdate({ status: "published" } as any);
    toast.success("Immobilie veröffentlicht.");
    router.push("/app/immobilien");
  };

  const discardAndDelete = async () => {
    if (!property) return;

    const ok = confirm(
      "Eintrag wirklich löschen? Der Eintrag und alle gespeicherten Bilder werden entfernt."
    );
    if (!ok) return;

    setDeleting(true);
    try {
      const paths = (property.image_urls || [])
        .filter(Boolean)
        .filter((p) => typeof p === "string" && !p.startsWith("http"));

      if (paths.length > 0) {
        try {
          await removeStoragePathsViaApi(PROPERTY_IMAGES_BUCKET, paths);
        } catch (e) {
          console.warn("⚠️ Could not remove images via API:", e);
        }
      }

      const { error } = await supabase
        .from("properties")
        .delete()
        .eq("id", property.id);
      if (error) {
        console.error(error);
        toast.error("Konnte Immobilie nicht löschen.");
        return;
      }

      toast.success("Immobilie gelöscht.");
      router.push("/app/immobilien");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Konnte Immobilie nicht löschen.");
    } finally {
      setDeleting(false);
    }
  };

  if (!idParam) return <div className="p-4">❌ Keine ID angegeben.</div>;
  if (loading || !property) {
    return (
      <div className="flex items-center justify-center h-40 gap-2 text-gray-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Lade Immobilie…</span>
      </div>
    );
  }

  const disabledHeaderActions = saving || uploadingImages || deleting;

  return (
    <div className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Sticky header */}
        <div className="sticky top-0 z-30 pt-4 bg-[#f7f7f8]/90 backdrop-blur border-b border-gray-200">
          <div className="flex items-start justify-between gap-4 pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-semibold">
                  Immobilie bearbeiten
                </h1>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200">
                  Advaic
                </span>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full border ${statusBadge.cls}`}
                >
                  {statusBadge.label}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                  ID: {property.id}
                </span>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                  Status:{" "}
                  {property.status === "published"
                    ? "Veröffentlicht"
                    : "Entwurf"}
                </span>
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Änderungen werden automatisch gespeichert. Bilder werden privat
                gespeichert (signed URLs im Frontend).
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push("/app/immobilien")}
                disabled={deleting}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
              >
                Zurück
              </button>

              <button
                type="button"
                onClick={discardAndDelete}
                disabled={deleting}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
                title="Immobilie löschen"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 inline-block mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 inline-block mr-2" />
                )}
                Löschen
              </button>

              <button
                type="button"
                onClick={forceSaveNow}
                disabled={disabledHeaderActions}
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
                title="Speichern"
              >
                <Save className="h-4 w-4 inline-block mr-2" />
                Speichern
              </button>

              <button
                type="button"
                onClick={publishNow}
                disabled={disabledHeaderActions}
                className="px-3 py-2 text-sm rounded-lg bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800 disabled:opacity-50"
                title="Veröffentlichen"
              >
                <CheckCircle2 className="h-4 w-4 inline-block mr-2" />
                Veröffentlichen
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main form */}
            <div className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white overflow-hidden">
              <div className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between">
                <div className="text-sm text-gray-700 font-medium">Details</div>
                <div className="text-xs text-gray-500">
                  {lastSavedAt
                    ? `Zuletzt gespeichert: ${new Date(
                        lastSavedAt
                      ).toLocaleTimeString("de-DE", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}`
                    : "Noch nicht gespeichert"}
                </div>
              </div>

              <div className="p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Field
                    label="Kurztitel"
                    hint="z.B. Moderne Wohnung mit Balkon"
                  >
                    <input
                      name="title"
                      placeholder="Kurztitel"
                      onChange={handleChange}
                      value={property.title}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                  </Field>

                  <Field label="Stadt" hint="z.B. Hamburg">
                    <input
                      name="city"
                      placeholder="Stadt"
                      onChange={handleChange}
                      value={property.city}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                  </Field>

                  <Field label="Stadtteil" hint="z.B. Eimsbüttel">
                    <input
                      name="neighborhood"
                      placeholder="Stadtteil"
                      onChange={handleChange}
                      value={property.neighborhood}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                  </Field>

                  <Field label="Straße" hint="z.B. Osterstraße 12a">
                    <input
                      name="street_address"
                      placeholder="Straße"
                      onChange={handleChange}
                      value={property.street_address}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                  </Field>

                  <Field label="Typ" hint="z.B. Wohnung, Haus, Grundstück">
                    <input
                      name="type"
                      placeholder="Typ"
                      onChange={handleChange}
                      value={property.type}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                  </Field>

                  <Field label="Preis" hint="z.B. 1250">
                    <input
                      name="price"
                      type="number"
                      placeholder="Preis"
                      onChange={handleChange}
                      value={property.price}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                  </Field>

                  <Field label="Vermarktung" hint="Vermietung oder Verkauf">
                    <div className="space-y-1">
                      <select
                        name="price_type"
                        onChange={handleChange}
                        value={property.price_type}
                        className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                      >
                        <option value="">Bitte wählen…</option>
                        <option value="Vermietung">Vermietung</option>
                        <option value="Verkauf">Verkauf</option>
                      </select>
                      <div className="text-[11px] text-gray-500">
                        „Vermietung“ = Miete · „Verkauf“ = Kauf
                      </div>
                    </div>
                  </Field>

                  <Field label="Fläche (m²)" hint="z.B. 85">
                    <input
                      name="size_sqm"
                      type="number"
                      placeholder="Fläche"
                      onChange={handleChange}
                      value={property.size_sqm}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                  </Field>

                  <Field label="Zimmer" hint="z.B. 3">
                    <input
                      name="rooms"
                      type="number"
                      placeholder="Zimmer"
                      onChange={handleChange}
                      value={property.rooms}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                  </Field>

                  <Field label="Etage" hint="z.B. 2">
                    <input
                      name="floor"
                      type="number"
                      placeholder="Etage"
                      onChange={handleChange}
                      value={property.floor}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                  </Field>

                  <Field label="Baujahr" hint="z.B. 1995">
                    <input
                      name="year_built"
                      type="number"
                      placeholder="Baujahr"
                      onChange={handleChange}
                      value={property.year_built}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                  </Field>

                  <Field label="Heizung" hint="z.B. Zentralheizung">
                    <input
                      name="heating"
                      placeholder="Heizung"
                      onChange={handleChange}
                      value={property.heating}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                  </Field>

                  <Field label="Energieklasse" hint="z.B. B">
                    <input
                      name="energy_label"
                      placeholder="Energieklasse"
                      onChange={handleChange}
                      value={property.energy_label}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                  </Field>

                  <Field label="Verfügbar ab" hint="">
                    <input
                      name="available_from"
                      type="date"
                      onChange={handleChange}
                      value={property.available_from}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                  </Field>

                  <Field label="Parkmöglichkeiten" hint="z.B. Tiefgarage">
                    <input
                      name="parking"
                      placeholder="Parkmöglichkeiten"
                      onChange={handleChange}
                      value={property.parking}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                  </Field>

                  <Field label="Listing-Link" hint="z.B. https://...">
                    <input
                      name="url"
                      placeholder="Listing-Link"
                      onChange={handleChange}
                      value={property.url}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                    {property.url && !isProbablyUrl(property.url) && (
                      <div className="mt-1 text-xs text-amber-700">
                        Hinweis: Das sieht nicht nach einer gültigen URL aus.
                      </div>
                    )}
                  </Field>

                  <Field
                    label="Highlights"
                    hint="(optional) · z.B. Bulletpoints"
                    full
                  >
                    <textarea
                      name="highlights"
                      placeholder={"• Balkon\n• Einbauküche\n• Stellplatz\n"}
                      onChange={handleChange}
                      value={property.highlights}
                      rows={4}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none"
                    />
                  </Field>

                  <Field
                    label="Kurzbeschreibung"
                    hint="(optional) · 2–3 Sätze"
                    full
                  >
                    <textarea
                      name="listing_summary"
                      placeholder="Kurz zusammenfassen (2–3 Sätze)"
                      onChange={handleChange}
                      value={property.listing_summary}
                      rows={3}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none"
                    />
                  </Field>

                  <Field label="Beschreibung" hint="" full>
                    <textarea
                      name="description"
                      placeholder="Beschreibung"
                      onChange={handleChange}
                      value={property.description}
                      rows={6}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none"
                    />
                  </Field>

                  <Field
                    label="Voraussetzungen"
                    hint="(optional) · Einkommen, Unterlagen, Haustiere, etc."
                    full
                  >
                    <textarea
                      name="requirements"
                      placeholder={
                        "Beispiel:\n- Mindestnettoeinkommen: ...\n- Schufa / Bonitätsnachweis\n- 3 Gehaltsnachweise\n- Haustiere: nach Absprache\n"
                      }
                      onChange={handleChange}
                      value={property.requirements}
                      rows={6}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none"
                    />
                  </Field>

                  <Field
                    label="Kontakt / Besichtigung"
                    hint="(optional) · Wie sollen Interessenten vorgehen?"
                    full
                  >
                    <textarea
                      name="contact_instructions"
                      placeholder={
                        "Beispiel:\n- Bitte 2 Terminvorschläge senden\n- Unterlagen vorab per E-Mail\n- Rückfragen: ...\n"
                      }
                      onChange={handleChange}
                      value={property.contact_instructions}
                      rows={5}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none"
                    />
                  </Field>

                  <Field
                    label="Interne Notizen"
                    hint="(optional) · nur intern"
                    full
                  >
                    <textarea
                      name="internal_notes"
                      placeholder="Nur intern (nicht an Interessenten senden)…"
                      onChange={handleChange}
                      value={property.internal_notes}
                      rows={4}
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none"
                    />
                  </Field>

                  <div className="md:col-span-2 flex flex-wrap items-center gap-4 pt-2">
                    <Toggle
                      name="pets_allowed"
                      checked={property.pets_allowed}
                      onChange={handleChange}
                      label="Haustiere erlaubt"
                    />
                    <Toggle
                      name="furnished"
                      checked={property.furnished}
                      onChange={handleChange}
                      label="Möbliert"
                    />
                    <Toggle
                      name="elevator"
                      checked={property.elevator}
                      onChange={handleChange}
                      label="Aufzug"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Side cards */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
                <div className="px-4 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-800 inline-flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-gray-500" />
                    Bilder
                  </div>
                  {uploadingImages && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                      Upload…
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="text-xs text-gray-600 mb-3">
                    Bilder werden privat gespeichert (signed URLs im Frontend).
                    Du kannst Reihenfolge ändern und Bilder löschen.
                  </div>

                  <SortablePreviewList files={uiFiles} setFiles={setUiFiles} />

                  <div className="mt-3 text-xs text-gray-500 inline-flex items-center gap-2">
                    <CloudUpload className="h-4 w-4" />
                    Ziehen/Drop oder auswählen — Upload startet automatisch.
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <div className="text-sm font-medium text-amber-900 inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Tipp
                </div>
                <div className="text-sm text-amber-800 mt-1">
                  Für bessere Matching-Qualität: Kurzbeschreibung (2–3 Sätze) +
                  saubere Vermarktung (Vermietung/Verkauf) + klare
                  Stadt/Stadtteil.
                </div>
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <div className="text-sm font-medium text-gray-900">
                  Pflichtfelder
                </div>
                <div className="mt-2 text-sm text-gray-600 space-y-1">
                  <div
                    className={
                      safeTrim(property.title)
                        ? "text-gray-600"
                        : "text-amber-800"
                    }
                  >
                    • Kurztitel
                  </div>
                  <div
                    className={
                      safeTrim(property.city)
                        ? "text-gray-600"
                        : "text-amber-800"
                    }
                  >
                    • Stadt
                  </div>
                  <div
                    className={
                      safeTrim(property.type)
                        ? "text-gray-600"
                        : "text-amber-800"
                    }
                  >
                    • Typ
                  </div>
                  <div
                    className={
                      safeTrim(property.price_type)
                        ? "text-gray-600"
                        : "text-amber-800"
                    }
                  >
                    • Vermarktung
                  </div>
                  <div
                    className={
                      safeTrim(property.price)
                        ? "text-gray-600"
                        : "text-amber-800"
                    }
                  >
                    • Preis
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
  full,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <label className={full ? "md:col-span-2" : ""}>
      <div className="text-xs font-medium text-gray-700 mb-1">
        {label}
        {hint ? <span className="text-gray-400"> · {hint}</span> : null}
      </div>
      {children}
    </label>
  );
}

function Toggle({
  name,
  checked,
  onChange,
  label,
}: {
  name: string;
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
}) {
  return (
    <label className="inline-flex items-center gap-2 text-sm text-gray-800">
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border-gray-300"
      />
      {label}
    </label>
  );
}
