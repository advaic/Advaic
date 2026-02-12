"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  CloudUpload,
  Image as ImageIcon,
  Loader2,
  Save,
  Sparkles,
  Trash2,
  ListChecks,
} from "lucide-react";

import SortablePreviewList from "@/components/SortablePreviewList";
import { supabase } from "@/lib/supabaseClient";

const PROPERTY_IMAGES_BUCKET =
  process.env.NEXT_PUBLIC_SUPABASE_PROPERTY_IMAGES_BUCKET || "property-images";

/** Checklist types */
type VermarktungUI = "" | "Vermietung" | "Verkauf";
type PetsPolicy = "allowed" | "not_allowed" | "on_request";

type RequirementsChecklist = {
  rent: {
    schufa: boolean;
    income_proof: boolean;
    self_disclosure: boolean;
    id_copy: boolean;
    landlord_reference: boolean;
    pets_policy: PetsPolicy;
    smoking_allowed: boolean;
  };
  sale: {
    financing_proof: boolean;
    reservation_possible: boolean;
    notary_flexible: boolean;
    handover_flexible: boolean;
  };
};

function defaultChecklist(): RequirementsChecklist {
  return {
    rent: {
      schufa: false,
      income_proof: false,
      self_disclosure: false,
      id_copy: false,
      landlord_reference: false,
      pets_policy: "on_request",
      smoking_allowed: false,
    },
    sale: {
      financing_proof: false,
      reservation_possible: false,
      notary_flexible: false,
      handover_flexible: false,
    },
  };
}

type PropertyDraft = {
  id: string | null;
  title: string;
  city: string;
  neighborhood: string;
  street_address: string;
  type: string;
  price: string;

  /**
   * DB column stays `price_type` for compatibility,
   * but UI meaning is now: Vermarktung (Vermietung/Verkauf)
   */
  price_type: VermarktungUI;

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

  /** Existing fields (you already added / plan to add) */
  requirements: string;
  highlights: string;
  internal_notes: string;
  contact_instructions: string;

  /** NEW structured requirements (add in Supabase) */
  requirements_checklist: RequirementsChecklist;
  requirements_notes: string;

  status: "draft" | "published";

  // image_urls stores private storage paths (NOT public URLs)
  image_urls: string[];
};

type TriState = "standard" | "enabled" | "disabled";

type FollowupPolicyDraft = {
  enabled: TriState;
  max_stage_rent: number | null;
  max_stage_buy: number | null;
  stage1_delay_hours: number | null;
  stage2_delay_hours: number | null;
};

function defaultFollowupPolicyDraft(): FollowupPolicyDraft {
  return {
    enabled: "standard",
    max_stage_rent: null,
    max_stage_buy: null,
    stage1_delay_hours: null,
    stage2_delay_hours: null,
  };
}

function dbBoolToTriState(v: boolean | null): TriState {
  if (v === null || typeof v === "undefined") return "standard";
  return v ? "enabled" : "disabled";
}

function triStateToDbBool(v: TriState): boolean | null {
  if (v === "standard") return null;
  return v === "enabled";
}

function clampInt(v: number, min: number, max: number): number {
  const n = Math.trunc(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

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

function toVermarktungKey(v: VermarktungUI): "rent" | "sale" | null {
  if (v === "Vermietung") return "rent";
  if (v === "Verkauf") return "sale";
  return null;
}

// --- DB PATCH HELPERS ---
function toNumberOrNull(v: unknown): number | null {
  const s = String(v ?? "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toIntOrNull(v: unknown): number | null {
  const n = toNumberOrNull(v);
  if (n === null) return null;
  const i = Math.trunc(n);
  return Number.isFinite(i) ? i : null;
}

function toDbPetsAllowed(v: boolean): string | null {
  // DB column is text; keep it simple for now
  return v ? "allowed" : "not_allowed";
}

function toDbPatch(patch: Partial<PropertyDraft>): Record<string, any> {
  const out: Record<string, any> = { ...patch };

  // id is not updatable via patch helper
  delete out.id;

  // Convert numeric columns
  if ("price" in out) out.price = toNumberOrNull(out.price);
  if ("size_sqm" in out) out.size_sqm = toIntOrNull(out.size_sqm);
  if ("year_built" in out) out.year_built = toIntOrNull(out.year_built);

  // url has a UNIQUE index in DB; multiple empty strings would violate it.
  // Use NULL for empty/whitespace, and store trimmed value otherwise.
  if ("url" in out) {
    const u = String((out as any).url ?? "").trim();
    out.url = u ? u : null;
  }

  // pets_allowed column is TEXT in DB
  if ("pets_allowed" in out) out.pets_allowed = toDbPetsAllowed(!!(out as any).pets_allowed);

  // image_urls must always be string[] of storage paths
  if ("image_urls" in out) {
    out.image_urls = Array.isArray(out.image_urls)
      ? out.image_urls.filter((x: any) => typeof x === "string" && x && !String(x).startsWith("http"))
      : [];
  }

  // requirements_checklist should be jsonb (object)
  if ("requirements_checklist" in out) {
    out.requirements_checklist = out.requirements_checklist || {};
  }

  return out;
}

/**
 * Remove private storage objects via server route (RLS-safe)
 * Expects /api/storage/remove to exist.
 * Supports both {bucket, paths} and legacy {bucket, path} payloads.
 * Retries per-file deletion if batch fails.
 */
async function removeStoragePathsViaApi(bucket: string, paths: string[]) {
  const cleaned = (paths || [])
    .filter(Boolean)
    .filter((p) => typeof p === "string" && !p.startsWith("http"));

  if (cleaned.length === 0) return;

  // Prefer batch delete: { bucket, paths }
  const tryBatch = async () => {
    const res = await fetch("/api/storage/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket, paths: cleaned }),
    });
    const data = await res.json().catch(() => ({}));
    return { ok: res.ok, data };
  };

  const batch = await tryBatch();
  if (batch.ok) return;

  // Fallback: some implementations expect a single path: { bucket, path }
  // We try per-file deletion so we work with either API shape.
  const errors: string[] = [];
  for (const path of cleaned) {
    const res = await fetch("/api/storage/remove", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bucket, path }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      errors.push(String((data as any)?.error || `Konnte Datei nicht löschen: ${path}`));
    }
  }

  if (errors.length > 0) {
    // If batch failed but single deletes succeeded partially, still surface a clear message.
    throw new Error(errors[0]);
  }

  // If we got here, batch failed but singles didn't report errors (unlikely). Just return.
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

export default function HinzufuegenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Optional: when this page is opened from onboarding, we want to return back there.
  // Example: /app/immobilien/hinzufuegen?returnTo=%2Fapp%2Fonboarding%3Fstep%3D5
  const returnTo = useMemo(() => {
    const raw = searchParams.get("returnTo") || searchParams.get("next") || "";
    const fallback = "/app/immobilien";
    if (!raw) return fallback;

    // Only allow internal paths to avoid open redirects
    if (!raw.startsWith("/")) return fallback;

    // Prevent protocol-relative / absolute URLs
    if (raw.startsWith("//")) return fallback;

    return raw;
  }, [searchParams]);

  const [property, setProperty] = useState<PropertyDraft>({
    id: null,
    title: "",
    city: "",
    neighborhood: "",
    street_address: "",
    type: "",
    price: "",
    price_type: "",

    size_sqm: "",
    rooms: "",
    floor: "",
    year_built: "",
    pets_allowed: false,
    heating: "",
    energy_label: "",
    available_from: "",
    parking: "",
    url: "",
    furnished: false,
    elevator: false,
    listing_summary: "",
    description: "",

    requirements: "",
    highlights: "",
    internal_notes: "",
    contact_instructions: "",

    requirements_checklist: defaultChecklist(),
    requirements_notes: "",

    status: "draft",
    image_urls: [],
  });

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
      // Use signed URL for preview if available (private bucket)
      return signedUrlMap[f] ?? f;
    });
  }, [files, signedUrlMap]);

  const setUiFiles = useCallback(
    (next: (File | string)[]) => {
      // Convert signed preview URLs back to storage paths
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

  const [creatingDraft, setCreatingDraft] = useState(false);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const [followupPolicy, setFollowupPolicy] = useState<FollowupPolicyDraft>(
    defaultFollowupPolicyDraft()
  );
  const [followupPolicyLoading, setFollowupPolicyLoading] = useState(false);
  const [followupPolicySaving, setFollowupPolicySaving] = useState(false);

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const statusBadge = useMemo(() => {
    if (deleting)
      return { label: "Lösche…", cls: "bg-red-50 border-red-200 text-red-800" };
    if (publishing)
      return {
        label: "Veröffentliche…",
        cls: "bg-amber-50 border-amber-200 text-amber-800",
      };
    if (uploadingImages)
      return {
        label: "Bilder…",
        cls: "bg-amber-50 border-amber-200 text-amber-800",
      };
    if (saving || creatingDraft)
      return {
        label: "Speichere…",
        cls: "bg-white border-gray-200 text-gray-700",
      };
    if (lastSavedAt)
      return {
        label: "Gespeichert",
        cls: "bg-emerald-50 border-emerald-200 text-emerald-800",
      };
    return { label: "Entwurf", cls: "bg-white border-gray-200 text-gray-700" };
  }, [
    saving,
    creatingDraft,
    lastSavedAt,
    uploadingImages,
    publishing,
    deleting,
  ]);

  const createDraftIfNeeded = useCallback(async (): Promise<string | null> => {
    if (property.id) return property.id;
    if (creatingDraft) return null;

    setCreatingDraft(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        toast.error("Nicht eingeloggt. Bitte neu einloggen.");
        return null;
      }

      const insertRow = {
        agent_id: user.id,
        status: "draft",
        ...toDbPatch({
          title: property.title || "",
          city: property.city || "",
          neighborhood: property.neighborhood || "",
          street_address: property.street_address || "",
          type: property.type || "",
          price: property.price || "",
          price_type: property.price_type || "",

          size_sqm: property.size_sqm || "",
          rooms: property.rooms || "",
          floor: property.floor || "",
          year_built: property.year_built || "",
          pets_allowed: property.pets_allowed,
          heating: property.heating || "",
          energy_label: property.energy_label || "",
          available_from: property.available_from || "",
          parking: property.parking || "",
          url: property.url ? property.url : null,
          furnished: property.furnished,
          elevator: property.elevator,
          listing_summary: property.listing_summary || "",
          description: property.description || "",

          requirements: property.requirements || "",
          highlights: property.highlights || "",
          internal_notes: property.internal_notes || "",
          contact_instructions: property.contact_instructions || "",

          requirements_checklist: property.requirements_checklist || defaultChecklist(),
          requirements_notes: property.requirements_notes || "",

          image_urls: [],
        }),
      };

      const { data, error } = await supabase
        .from("properties")
        .insert([insertRow])
        .select("id")
        .single();

      if (error || !data?.id) {
        console.error("❌ Draft insert error:", error?.message, error);
        toast.error("Entwurf konnte nicht erstellt werden.");
        return null;
      }

      setProperty((p) => ({ ...p, id: data.id as string, status: "draft" }));
      setLastSavedAt(new Date().toISOString());
      return data.id as string;
    } finally {
      setCreatingDraft(false);
    }
  }, [property, creatingDraft]);

  const persistUpdate = useCallback(
    async (updatedFields: Partial<PropertyDraft>) => {
      const id = await createDraftIfNeeded();
      if (!id) return;

      setSaving(true);
      try {
        const dbPatch = toDbPatch(updatedFields);
        const { error } = await supabase
          .from("properties")
          .update(dbPatch as any)
          .eq("id", id);

        if (error) {
          console.error("❌ Update error:", error);
          toast.error("Speichern fehlgeschlagen.");
          return;
        }
        setLastSavedAt(new Date().toISOString());
      } finally {
        setSaving(false);
      }
    },
    [createDraftIfNeeded]
  );

  const schedulePersist = useCallback(
    (updatedFields: Partial<PropertyDraft>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        void persistUpdate(updatedFields);
      }, 500);
    },
    [persistUpdate]
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!property.id) {
        setFollowupPolicy(defaultFollowupPolicyDraft());
        return;
      }

      setFollowupPolicyLoading(true);
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) return;

        const { data, error } = await supabase
          .from("property_followup_policies")
          .select(
            "enabled, max_stage_rent, max_stage_buy, stage1_delay_hours, stage2_delay_hours"
          )
          .eq("agent_id", user.id)
          .eq("property_id", property.id)
          .maybeSingle();

        if (cancelled) return;

        if (error) {
          console.warn("followup policy load failed", error);
          return;
        }

        if (!data) {
          setFollowupPolicy(defaultFollowupPolicyDraft());
          return;
        }

        setFollowupPolicy({
          enabled: dbBoolToTriState((data as any).enabled ?? null),
          max_stage_rent:
            typeof (data as any).max_stage_rent === "number"
              ? (data as any).max_stage_rent
              : null,
          max_stage_buy:
            typeof (data as any).max_stage_buy === "number"
              ? (data as any).max_stage_buy
              : null,
          stage1_delay_hours:
            typeof (data as any).stage1_delay_hours === "number"
              ? (data as any).stage1_delay_hours
              : null,
          stage2_delay_hours:
            typeof (data as any).stage2_delay_hours === "number"
              ? (data as any).stage2_delay_hours
              : null,
        });
      } finally {
        if (!cancelled) setFollowupPolicyLoading(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [property.id]);

  const upsertFollowupPolicy = useCallback(
    async (next?: Partial<FollowupPolicyDraft>) => {
      setFollowupPolicySaving(true);
      try {
        let propertyId = property.id;
        if (!propertyId) {
          const created = await createDraftIfNeeded();
          if (!created) return;
          propertyId = created;
        }

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          toast.error("Nicht eingeloggt. Bitte neu einloggen.");
          return;
        }

        const merged: FollowupPolicyDraft = {
          ...followupPolicy,
          ...(next || {}),
        };

        const payload = {
          agent_id: user.id,
          property_id: propertyId,
          enabled: triStateToDbBool(merged.enabled),
          max_stage_rent: merged.max_stage_rent,
          max_stage_buy: merged.max_stage_buy,
          stage1_delay_hours: merged.stage1_delay_hours,
          stage2_delay_hours: merged.stage2_delay_hours,
        } as any;

        const { error } = await supabase
          .from("property_followup_policies")
          .upsert(payload, { onConflict: "agent_id,property_id" });

        if (error) {
          console.error("followup policy upsert error", error);
          toast.error("Follow-up Einstellungen konnten nicht gespeichert werden.");
          return;
        }

        setFollowupPolicy(merged);
        toast.success("Follow-up Einstellungen gespeichert.");
      } finally {
        setFollowupPolicySaving(false);
      }
    },
    [property.id, createDraftIfNeeded, followupPolicy]
  );

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;

    setProperty((prev) => ({ ...prev, [name]: newValue as any }));

    // Persist incrementally (debounced)
    schedulePersist({ [name]: newValue } as any);
  };

  /** Checklist updates */
  const updateChecklist = (next: RequirementsChecklist) => {
    setProperty((p) => ({ ...p, requirements_checklist: next }));
    schedulePersist({ requirements_checklist: next } as any);
  };

  const setChecklistBool = (
    section: "rent" | "sale",
    key: string,
    val: boolean
  ) => {
    const current = property.requirements_checklist || defaultChecklist();
    const next: RequirementsChecklist = {
      ...current,
      [section]: { ...(current as any)[section], [key]: val },
    } as any;
    updateChecklist(next);
  };

  const setPetsPolicy = (val: PetsPolicy) => {
    const current = property.requirements_checklist || defaultChecklist();
    const next: RequirementsChecklist = {
      ...current,
      rent: { ...current.rent, pets_policy: val },
    };
    updateChecklist(next);
  };

  const uploadImageToSupabase = useCallback(
    async (file: File, propertyId: string) => {
      const safeName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_");
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Nicht eingeloggt. Bitte neu einloggen.");
      }

      // IMPORTANT: Path must match signed-url policy:
      // agents/<uid>/properties/<propertyId>/...
      const filePath = `agents/${user.id}/properties/${propertyId}/${Date.now()}-${safeName}`;

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

      return filePath;
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
            // compatibility with APIs that expect a single path
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

  // Upload + sync images ordering (DB stores ONLY storage paths)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (files.length === 0) {
        if (property.id && (property.image_urls?.length ?? 0) > 0) {
          setProperty((p) => ({ ...p, image_urls: [] }));
          prevImagePathsRef.current = [];
          await persistUpdate({ image_urls: [] });
        }
        return;
      }

      const id = await createDraftIfNeeded();
      if (!id || cancelled) return;

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
            const path = await uploadImageToSupabase(item, id);
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

      const orderedPaths = nextFiles
        .map((f) => {
          if (typeof f !== "string") return null;
          // Convert any signed preview URLs back to storage paths (defensive)
          return signedUrlToPath[f] ?? f;
        })
        .filter((p): p is string => !!p && !p.startsWith("http"));

      const current = property.image_urls || [];
      const same =
        current.length === orderedPaths.length &&
        current.every((v, i) => String(v) === String(orderedPaths[i]));

      if (!same && !cancelled) {
        setProperty((p) => ({ ...p, image_urls: orderedPaths }));
        prevImagePathsRef.current = orderedPaths;
        await persistUpdate({ image_urls: orderedPaths });
      } else {
        // Keep ref in sync even if nothing changed
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
    const id = await createDraftIfNeeded();
    if (!id) return;

    const canonicalPaths =
      files
        .filter((f): f is string => typeof f === "string")
        .map((s) => signedUrlToPath[s] ?? s)
        .filter((p) => !!p && !p.startsWith("http")) || [];

    await persistUpdate({
      status: "draft",
      image_urls: canonicalPaths,
      // also ensure core fields are written with proper types
      price: property.price,
      size_sqm: property.size_sqm,
      year_built: property.year_built,
      pets_allowed: property.pets_allowed,
    });

    toast.success("Entwurf gespeichert.");
  };

  const canPublish = useMemo(() => {
    const requiredOk =
      safeTrim(property.title) &&
      safeTrim(property.city) &&
      safeTrim(property.type) &&
      safeTrim(property.price_type) &&
      safeTrim(property.price);

    return Boolean(requiredOk);
  }, [property]);

  const publishNow = async () => {
    const id = await createDraftIfNeeded();
    if (!id) return;

    if (!canPublish) {
      toast.error(
        "Bitte fülle mindestens Titel, Stadt, Typ, Preis & Vermarktung aus."
      );
      return;
    }

    setPublishing(true);
    try {
      await persistUpdate({ status: "published" });
      toast.success("Immobilie veröffentlicht.");
      router.push(returnTo);
    } finally {
      setPublishing(false);
    }
  };

  const discardDraft = async () => {
    if (!property.id) {
      router.push(returnTo);
      return;
    }

    const ok = confirm(
      "Entwurf wirklich verwerfen? Der Eintrag und alle hochgeladenen Bilder werden gelöscht."
    );
    if (!ok) return;

    setDeleting(true);
    try {
      const id = property.id;

      // Best-effort remove images from private storage via API
      const paths = (property.image_urls || [])
        .filter(Boolean)
        .filter((p) => typeof p === "string" && !p.startsWith("http"));

      if (paths.length > 0) {
        try {
          await removeStoragePathsViaApi(PROPERTY_IMAGES_BUCKET, paths);
        } catch (e: any) {
          console.warn("⚠️ Could not remove images via API:", e?.message ?? e);
          // continue deleting DB row even if storage cleanup fails
        }
      }

      const { error: delErr } = await supabase
        .from("properties")
        .delete()
        .eq("id", id);

      if (delErr) {
        console.error("❌ Delete error:", delErr);
        toast.error("Konnte Entwurf nicht löschen.");
        return;
      }

      toast.success("Entwurf gelöscht.");
      router.push(returnTo);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message ?? "Konnte Entwurf nicht löschen.");
    } finally {
      setDeleting(false);
    }
  };

  const disabledHeaderActions =
    saving || creatingDraft || publishing || deleting;

  const vermarktungKey = toVermarktungKey(property.price_type);

  return (
    <div
      className="min-h-[calc(100vh-80px)] bg-[#f7f7f8] text-gray-900"
      data-tour="property-add-page"
    >
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        {/* Sticky header */}
        <div
          className="sticky top-0 z-30 pt-4 bg-[#f7f7f8]/90 backdrop-blur border-b border-gray-200"
          data-tour="property-add-header"
        >
          <div className="flex items-start justify-between gap-4 pb-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-semibold" data-tour="property-add-title">
                  Immobilie hinzufügen
                </h1>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-gray-900 text-amber-200">
                  Advaic
                </span>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full border ${statusBadge.cls}`}
                >
                  {statusBadge.label}
                </span>
                {property.id && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                    ID: {property.id}
                  </span>
                )}
              </div>
              <div className="mt-1 text-sm text-gray-600">
                Erstelle zuerst einen Entwurf – Änderungen werden automatisch
                gespeichert.
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => router.push(returnTo)}
                disabled={deleting}
                data-tour="property-add-back"
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
              >
                Zurück
              </button>

              <button
                type="button"
                onClick={discardDraft}
                disabled={deleting}
                data-tour="property-add-discard"
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
                title="Entwurf verwerfen und löschen"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 inline-block mr-2 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4 inline-block mr-2" />
                )}
                Abbrechen
              </button>

              <button
                type="button"
                onClick={forceSaveNow}
                disabled={disabledHeaderActions}
                data-tour="property-add-save"
                className="px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-60"
                title="Entwurf speichern"
              >
                <Save className="h-4 w-4 inline-block mr-2" />
                Speichern
              </button>

              <button
                type="button"
                onClick={publishNow}
                disabled={
                  publishing ||
                  saving ||
                  creatingDraft ||
                  deleting ||
                  !canPublish
                }
                data-tour="property-add-publish"
                className="px-3 py-2 text-sm rounded-lg bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800 disabled:opacity-50"
                title={
                  canPublish
                    ? "Veröffentlichen"
                    : "Bitte mindestens Titel, Stadt, Typ, Preis & Vermarktung ausfüllen"
                }
              >
                {publishing ? (
                  <Loader2 className="h-4 w-4 inline-block mr-2 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 inline-block mr-2" />
                )}
                Veröffentlichen
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Main form */}
            <div
              className="lg:col-span-2 rounded-2xl border border-gray-200 bg-white overflow-hidden"
              data-tour="property-add-details"
            >
              <div
                className="px-4 md:px-6 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between"
                data-tour="property-add-details-header"
              >
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
                      data-tour="property-add-title-input"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                  </Field>

                  <Field label="Stadt" hint="z.B. Hamburg">
                    <input
                      name="city"
                      placeholder="Stadt"
                      onChange={handleChange}
                      value={property.city}
                      data-tour="property-add-city"
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
                      data-tour="property-add-type"
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
                      data-tour="property-add-price"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                  </Field>

                  <Field label="Vermarktung" hint="Vermietung oder Verkauf">
                    <div className="space-y-1">
                      <select
                        name="price_type"
                        onChange={handleChange}
                        value={property.price_type}
                        data-tour="property-add-vermarktung"
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

                  <Field label="Listing-Link" hint="z.B. https://...">
                    <input
                      name="url"
                      placeholder="Listing-Link"
                      onChange={handleChange}
                      value={property.url}
                      data-tour="property-add-listing-url"
                      className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                    />
                    {property.url && !isProbablyUrl(property.url) && (
                      <div className="mt-1 text-xs text-amber-700">
                        Hinweis: Das sieht nicht nach einer gültigen URL aus.
                      </div>
                    )}
                  </Field>

                  {/* Quick Checklist (dynamic) */}
                  <Field
                    label="Quick Checklist"
                    hint="(optional) · Was soll ein Interessent direkt liefern/erfüllen?"
                    full
                  >
                    <div
                      className="rounded-xl border border-gray-200 bg-[#fbfbfc] p-4"
                      data-tour="property-add-checklist"
                    >
                      {!vermarktungKey ? (
                        <div className="text-sm text-gray-600">
                          Wähle zuerst eine Vermarktung (Vermietung/Verkauf),
                          damit die passenden Punkte erscheinen.
                        </div>
                      ) : vermarktungKey === "rent" ? (
                        <div className="space-y-3">
                          <div
                            className="flex items-center gap-2 text-sm font-medium text-gray-900"
                            data-tour="property-add-checklist-rent"
                          >
                            <ListChecks className="h-4 w-4" />
                            Vermietung
                          </div>

                          <ChecklistRow
                            label="SCHUFA-Auskunft"
                            checked={
                              property.requirements_checklist.rent.schufa
                            }
                            onChange={(v) =>
                              setChecklistBool("rent", "schufa", v)
                            }
                          />
                          <ChecklistRow
                            label="Einkommensnachweis"
                            checked={
                              property.requirements_checklist.rent.income_proof
                            }
                            onChange={(v) =>
                              setChecklistBool("rent", "income_proof", v)
                            }
                          />
                          <ChecklistRow
                            label="Selbstauskunft"
                            checked={
                              property.requirements_checklist.rent
                                .self_disclosure
                            }
                            onChange={(v) =>
                              setChecklistBool("rent", "self_disclosure", v)
                            }
                          />
                          <ChecklistRow
                            label="Ausweiskopie"
                            checked={
                              property.requirements_checklist.rent.id_copy
                            }
                            onChange={(v) =>
                              setChecklistBool("rent", "id_copy", v)
                            }
                          />
                          <ChecklistRow
                            label="Vermieterbescheinigung"
                            checked={
                              property.requirements_checklist.rent
                                .landlord_reference
                            }
                            onChange={(v) =>
                              setChecklistBool("rent", "landlord_reference", v)
                            }
                          />

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                            <div>
                              <div className="text-xs font-medium text-gray-700 mb-1">
                                Haustiere
                              </div>
                              <select
                                value={
                                  property.requirements_checklist.rent
                                    .pets_policy
                                }
                                onChange={(e) =>
                                  setPetsPolicy(e.target.value as PetsPolicy)
                                }
                                data-tour="property-add-pets-policy"
                                className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                              >
                                <option value="allowed">Erlaubt</option>
                                <option value="not_allowed">
                                  Nicht erlaubt
                                </option>
                                <option value="on_request">Auf Anfrage</option>
                              </select>
                            </div>

                            <div className="flex items-end">
                              <ChecklistRow
                                label="Rauchen erlaubt"
                                checked={
                                  property.requirements_checklist.rent
                                    .smoking_allowed
                                }
                                onChange={(v) =>
                                  setChecklistBool("rent", "smoking_allowed", v)
                                }
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div
                            className="flex items-center gap-2 text-sm font-medium text-gray-900"
                            data-tour="property-add-checklist-sale"
                          >
                            <ListChecks className="h-4 w-4" />
                            Verkauf
                          </div>

                          <ChecklistRow
                            label="Finanzierungsnachweis"
                            checked={
                              property.requirements_checklist.sale
                                .financing_proof
                            }
                            onChange={(v) =>
                              setChecklistBool("sale", "financing_proof", v)
                            }
                          />
                          <ChecklistRow
                            label="Reservierung möglich"
                            checked={
                              property.requirements_checklist.sale
                                .reservation_possible
                            }
                            onChange={(v) =>
                              setChecklistBool(
                                "sale",
                                "reservation_possible",
                                v
                              )
                            }
                          />
                          <ChecklistRow
                            label="Notartermin flexibel"
                            checked={
                              property.requirements_checklist.sale
                                .notary_flexible
                            }
                            onChange={(v) =>
                              setChecklistBool("sale", "notary_flexible", v)
                            }
                          />
                          <ChecklistRow
                            label="Übergabe flexibel"
                            checked={
                              property.requirements_checklist.sale
                                .handover_flexible
                            }
                            onChange={(v) =>
                              setChecklistBool("sale", "handover_flexible", v)
                            }
                          />
                        </div>
                      )}

                      <div className="mt-4">
                        <div className="text-xs font-medium text-gray-700 mb-1">
                          Notizen zu Voraussetzungen (optional)
                        </div>
                        <textarea
                          name="requirements_notes"
                          value={property.requirements_notes}
                          onChange={handleChange}
                          rows={4}
                          data-tour="property-add-requirements-notes"
                          placeholder="z.B. Mindestnettoeinkommen, gewünschte Einzugsdaten, Haustiere nach Absprache, etc."
                          className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50 resize-none"
                        />
                      </div>
                    </div>
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
                      data-tour="property-add-summary"
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
                      data-tour="property-add-description"
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
              <div
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
                data-tour="property-add-images"
              >
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
                  <div className="text-xs text-gray-600 mb-3" data-tour="property-add-images-hint">
                    Bilder werden privat gespeichert (signed URLs im Frontend).
                    Du kannst Reihenfolge ändern und Bilder löschen.
                  </div>

                  {/* IMPORTANT: UI gets signed URLs, internal state stays storage paths */}
                  <div data-tour="property-add-images-list">
                    <SortablePreviewList files={uiFiles} setFiles={setUiFiles} />
                  </div>

                  <div className="mt-3 text-xs text-gray-500 inline-flex items-center gap-2">
                    <CloudUpload className="h-4 w-4" />
                    {property.id
                      ? "Uploads sind aktiv."
                      : "Sobald du tippst, wird ein Entwurf erstellt."}
                  </div>
                </div>
              </div>

              <div
                className="rounded-2xl border border-gray-200 bg-white overflow-hidden"
                data-tour="property-add-followups-policy"
              >
                <div className="px-4 py-4 border-b border-gray-200 bg-[#fbfbfc] flex items-center justify-between">
                  <div className="text-sm font-medium text-gray-800">Follow-up Regeln</div>
                  <div className="flex items-center gap-2">
                    {followupPolicyLoading && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-white border border-gray-200 text-gray-700">
                        Lädt…
                      </span>
                    )}
                    {followupPolicySaving && (
                      <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800">
                        Speichert…
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-4">
                  <div className="text-xs text-gray-600 mb-3">
                    Property-spezifisch (optional). „Standard“ nutzt deine globalen Follow-up Settings.
                  </div>

                  {!property.id && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 mb-3">
                      <div className="text-sm text-amber-900 font-medium">Hinweis</div>
                      <div className="text-sm text-amber-800 mt-1">
                        Um property-spezifische Follow-up Regeln zu speichern, muss zuerst ein Entwurf angelegt werden.
                      </div>
                      <button
                        type="button"
                        onClick={() => void createDraftIfNeeded()}
                        className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gray-900 border border-gray-900 text-amber-200 hover:bg-gray-800 px-3 py-2 text-sm"
                      >
                        Entwurf anlegen
                      </button>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-medium text-gray-700 mb-1">Follow-ups</div>
                      <select
                        value={followupPolicy.enabled}
                        onChange={(e) => {
                          const v = e.target.value as TriState;
                          setFollowupPolicy((p) => ({ ...p, enabled: v }));
                          void upsertFollowupPolicy({ enabled: v });
                        }}
                        className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                      >
                        <option value="standard">Standard</option>
                        <option value="enabled">An</option>
                        <option value="disabled">Aus</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">Max. Follow-ups (Miete)</div>
                        <select
                          value={followupPolicy.max_stage_rent ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const v = raw === "" ? null : clampInt(Number(raw), 0, 2);
                            setFollowupPolicy((p) => ({ ...p, max_stage_rent: v }));
                            void upsertFollowupPolicy({ max_stage_rent: v });
                          }}
                          className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                        >
                          <option value="">Standard</option>
                          <option value="0">0</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                        </select>
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">Max. Follow-ups (Kauf)</div>
                        <select
                          value={followupPolicy.max_stage_buy ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const v = raw === "" ? null : clampInt(Number(raw), 0, 2);
                            setFollowupPolicy((p) => ({ ...p, max_stage_buy: v }));
                            void upsertFollowupPolicy({ max_stage_buy: v });
                          }}
                          className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                        >
                          <option value="">Standard</option>
                          <option value="0">0</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">Delay Stage 1 (Stunden)</div>
                        <input
                          type="number"
                          min={1}
                          max={336}
                          placeholder="Standard"
                          value={followupPolicy.stage1_delay_hours ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const v = raw === "" ? null : clampInt(Number(raw), 1, 336);
                            setFollowupPolicy((p) => ({ ...p, stage1_delay_hours: v }));
                            void upsertFollowupPolicy({ stage1_delay_hours: v });
                          }}
                          className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                        />
                      </div>

                      <div>
                        <div className="text-xs font-medium text-gray-700 mb-1">Delay Stage 2 (Stunden)</div>
                        <input
                          type="number"
                          min={1}
                          max={336}
                          placeholder="Standard"
                          value={followupPolicy.stage2_delay_hours ?? ""}
                          onChange={(e) => {
                            const raw = e.target.value;
                            const v = raw === "" ? null : clampInt(Number(raw), 1, 336);
                            setFollowupPolicy((p) => ({ ...p, stage2_delay_hours: v }));
                            void upsertFollowupPolicy({ stage2_delay_hours: v });
                          }}
                          className="w-full px-3 py-2 text-sm rounded-lg bg-white border border-gray-200 focus:outline-none focus:ring-2 focus:ring-amber-300/50"
                        />
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-500">
                      Tipp: Lass die Werte auf „Standard“, wenn du nur global steuern willst.
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="rounded-2xl border border-amber-200 bg-amber-50 p-4"
                data-tour="property-add-tip"
              >
                <div className="text-sm font-medium text-amber-900 inline-flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Tipp
                </div>
                <div className="text-sm text-amber-800 mt-1">
                  Für bessere Matching-Qualität: Kurzbeschreibung + saubere
                  Vermarktung (Vermietung/Verkauf) + klare Stadt/Stadtteil +
                  strukturierte Checklist.
                </div>
              </div>

              <div
                className="rounded-2xl border border-gray-200 bg-white p-4"
                data-tour="property-add-required"
              >
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

function ChecklistRow({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2">
      <span className="text-sm text-gray-800">{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 rounded border-gray-300"
      />
    </label>
  );
}
