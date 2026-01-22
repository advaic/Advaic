import { NextRequest, NextResponse } from "next/server";
import OAuth from "oauth-1.0a";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";
import { XMLParser } from "fast-xml-parser";

export const runtime = "nodejs";

function mustEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function supabaseAdmin() {
  return createClient<Database>(
    mustEnv("NEXT_PUBLIC_SUPABASE_URL"),
    mustEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}

function propertyImagesBucket() {
  // user confirmed bucket exists and is private
  return (process.env.PROPERTY_IMAGES_BUCKET || "").trim() || "property-images";
}

function getImmoScoutEnv(environment: string) {
  const env = (environment || "sandbox").toLowerCase();
  if (env === "prod") {
    return {
      baseUrl: mustEnv("IMMOSCOUT_BASE_URL_PROD"),
      consumerKey: mustEnv("IMMOSCOUT_CONSUMER_KEY_PROD"),
      consumerSecret: mustEnv("IMMOSCOUT_CONSUMER_SECRET_PROD"),
    };
  }
  return {
    baseUrl: mustEnv("IMMOSCOUT_BASE_URL"),
    consumerKey: mustEnv("IMMOSCOUT_CONSUMER_KEY"),
    consumerSecret: mustEnv("IMMOSCOUT_CONSUMER_SECRET"),
  };
}

function oauthClient(consumerKey: string, consumerSecret: string) {
  return new OAuth({
    consumer: { key: consumerKey, secret: consumerSecret },
    signature_method: "HMAC-SHA1",
    hash_function(baseString, key) {
      return crypto.createHmac("sha1", key).update(baseString).digest("base64");
    },
  });
}

function tryJsonParse(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function tryXmlParse(text: string): any | null {
  try {
    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: "@_",
      removeNSPrefix: true, // wichtig: realestates:realEstates -> realEstates
      parseAttributeValue: false,
      trimValues: true,
    });
    return parser.parse(text);
  } catch {
    return null;
  }
}

function extractRealEstateElements(payload: any): any[] {
  if (!payload || typeof payload !== "object") return [];

  const found: any[][] = [];

  const walk = (obj: any) => {
    if (!obj || typeof obj !== "object") return;

    // If we see a realEstateList that contains realEstateElement, capture it.
    if (
      "realEstateList" in obj &&
      obj.realEstateList &&
      typeof obj.realEstateList === "object" &&
      "realEstateElement" in obj.realEstateList
    ) {
      const el = (obj.realEstateList as any).realEstateElement;
      if (Array.isArray(el)) found.push(el);
      else if (el && typeof el === "object") found.push([el]);
    }

    // Some responses embed realEstateElement directly
    if ("realEstateElement" in obj) {
      const el = (obj as any).realEstateElement;
      if (Array.isArray(el)) found.push(el);
      else if (el && typeof el === "object") found.push([el]);
    }

    for (const k of Object.keys(obj)) {
      const v = (obj as any)[k];
      if (Array.isArray(v)) {
        for (const item of v) walk(item);
      } else if (v && typeof v === "object") {
        walk(v);
      }
    }
  };

  walk(payload);

  // Prefer the biggest hit
  found.sort((a, b) => b.length - a.length);
  return found[0] || [];
}

function pick(obj: any, paths: string[]) {
  for (const p of paths) {
    const parts = p.split(".");
    let cur = obj;
    let ok = true;
    for (const part of parts) {
      if (cur && typeof cur === "object" && part in cur) cur = cur[part];
      else {
        ok = false;
        break;
      }
    }
    if (ok && cur != null) return cur;
  }
  return null;
}

function parseImmoDate(v: any): Date | null {
  if (!v) return null;
  const s = String(v);
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function normalizeStringArray(v: any): string[] {
  if (!v) return [];
  if (Array.isArray(v)) {
    return v.map((x) => String(x || "").trim()).filter(Boolean);
  }
  const s = String(v).trim();
  return s ? [s] : [];
}

function uniqLimit(urls: string[], limit = 12): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const u of urls) {
    const s = String(u || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= limit) break;
  }
  return out;
}

function guessExtFromContentType(ct: string | null): string {
  const s = (ct || "").toLowerCase();
  if (s.includes("image/jpeg")) return "jpg";
  if (s.includes("image/png")) return "png";
  if (s.includes("image/webp")) return "webp";
  if (s.includes("image/gif")) return "gif";
  return "jpg";
}

function guessExtFromUrl(url: string): string {
  const u = (url || "").toLowerCase();
  if (u.includes(".png")) return "png";
  if (u.includes(".webp")) return "webp";
  if (u.includes(".gif")) return "gif";
  if (u.includes(".jpeg")) return "jpg";
  if (u.includes(".jpg")) return "jpg";
  return "jpg";
}

function sha256Hex(buf: Uint8Array): string {
  return crypto.createHash("sha256").update(buf).digest("hex");
}

async function mirrorOneImageToBucket(args: {
  supabase: ReturnType<typeof supabaseAdmin>;
  bucket: string;
  agentId: string;
  propertyId: string;
  sourceUrl: string;
  index: number;
}): Promise<string | null> {
  const { supabase, bucket, agentId, propertyId, sourceUrl, index } = args;

  // Basic safety: do not download huge files
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  try {
    const resp = await fetch(sourceUrl, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
    }).catch(() => null);

    if (!resp || !resp.ok) return null;

    const ct = resp.headers.get("content-type");
    const len = Number(resp.headers.get("content-length") || "0");
    // Hard cap 8MB (images only)
    if (len && len > 8 * 1024 * 1024) return null;

    const ab = await resp.arrayBuffer();
    const u8 = new Uint8Array(ab);
    if (u8.byteLength > 8 * 1024 * 1024) return null;

    const hash = sha256Hex(u8);
    const ext = guessExtFromUrl(sourceUrl) || guessExtFromContentType(ct);

    // Stable path: dedupe by content hash (same image => same object key)
    // Keep index prefix only to preserve ordering when multiple distinct images exist.
    const path = `agents/${agentId}/properties/${propertyId}/${String(
      index
    ).padStart(2, "0")}_${hash}.${ext}`;

    // Try upload; if it already exists, treat as success
    const uploadRes = await supabase.storage.from(bucket).upload(path, u8, {
      contentType: ct || `image/${ext === "jpg" ? "jpeg" : ext}`,
      upsert: false,
    });

    if (uploadRes.error) {
      const msg = String(uploadRes.error.message || "").toLowerCase();
      // Supabase storage returns various messages for existing objects
      if (
        msg.includes("already exists") ||
        msg.includes("duplicate") ||
        msg.includes("409")
      ) {
        return path;
      }
      return null;
    }

    return path;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

async function mirrorImagesToBucket(args: {
  supabase: ReturnType<typeof supabaseAdmin>;
  bucket: string;
  agentId: string;
  propertyId: string;
  sourceUrls: string[];
  limit?: number;
}): Promise<string[]> {
  const { supabase, bucket, agentId, propertyId } = args;
  const limit = Math.max(1, Math.min(12, Number(args.limit || 8)));

  const urls = uniqLimit(args.sourceUrls, limit);
  const out: string[] = [];

  // Sequential on purpose (avoid hammering + easy to reason about)
  for (let i = 0; i < urls.length; i++) {
    const path = await mirrorOneImageToBucket({
      supabase,
      bucket,
      agentId,
      propertyId,
      sourceUrl: urls[i],
      index: i + 1,
    });
    if (path) out.push(path);
  }

  return out;
}

function mergeDeltaImages(args: {
  existing: string[];
  previousSourceMirrored: string[];
  nextSourceMirrored: string[];
  limit?: number;
}): string[] {
  const limit = Math.max(1, Math.min(24, Number(args.limit || 24)));

  const prev = new Set(
    (args.previousSourceMirrored || [])
      .map((x) => String(x || "").trim())
      .filter(Boolean)
  );
  const seen = new Set<string>();
  const out: string[] = [];

  // 1) Keep existing images that were NOT mirrored from this source previously
  for (const u of args.existing || []) {
    const s = String(u || "").trim();
    if (!s) continue;
    if (prev.has(s)) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= limit) return out;
  }

  // 2) Append the freshly mirrored images from this source (deduped)
  for (const u of args.nextSourceMirrored || []) {
    const s = String(u || "").trim();
    if (!s) continue;
    if (seen.has(s)) continue;
    seen.add(s);
    out.push(s);
    if (out.length >= limit) break;
  }

  return out;
}

function extractHttpUrlsDeep(obj: any): string[] {
  const out: string[] = [];
  const walk = (x: any) => {
    if (x == null) return;
    if (typeof x === "string") {
      const s = x.trim();
      if (s.startsWith("http://") || s.startsWith("https://")) out.push(s);
      return;
    }
    if (Array.isArray(x)) {
      for (const it of x) walk(it);
      return;
    }
    if (typeof x === "object") {
      for (const k of Object.keys(x)) {
        walk((x as any)[k]);
      }
    }
  };
  walk(obj);
  return out;
}

function collectImageUrls(realEstateElement: any): string[] {
  const urls: string[] = [];

  // Common places
  const titlePictureUrl =
    pick(realEstateElement, [
      "titlePicture.url",
      "titlePicture",
      "attachments.titlePicture.url",
      "attachments.titlePicture",
      "realEstateElement.titlePicture.url",
      "realEstateElement.attachments.titlePicture.url",
    ]) ?? null;

  urls.push(...normalizeStringArray(titlePictureUrl));

  // If attachments were requested, try to pull any URLs from the attachments subtree
  const attachmentsSubtree =
    pick(realEstateElement, [
      "attachments",
      "realEstateElement.attachments",
      "realEstateElement.attachments.attachment",
      "attachments.attachment",
    ]) ?? null;

  if (attachmentsSubtree) {
    urls.push(...extractHttpUrlsDeep(attachmentsSubtree));
  }

  // Keep only likely image URLs if we collected a lot
  const filtered = urls.filter((u) => {
    const s = u.toLowerCase();
    return (
      s.startsWith("http") &&
      (s.includes(".jpg") ||
        s.includes(".jpeg") ||
        s.includes(".png") ||
        s.includes(".webp") ||
        s.includes(".gif") ||
        // ImmoScout attachment endpoints often don't include extensions
        s.includes("/attachment") ||
        s.includes("attachments") ||
        s.includes("/pictures") ||
        s.includes("/images"))
    );
  });

  return uniqLimit(filtered.length ? filtered : urls, 12);
}

function toNumberOrNull(v: any): number | null {
  if (v == null) return null;
  const s = String(v)
    .replace(",", ".")
    .replace(/[^\d.-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function toIntOrNull(v: any): number | null {
  const n = toNumberOrNull(v);
  if (n == null) return null;
  const i = Math.trunc(n);
  return Number.isFinite(i) ? i : null;
}

function toBoolOrNull(v: any): boolean | null {
  if (v == null) return null;
  if (typeof v === "boolean") return v;

  const s = String(v).trim().toLowerCase();
  if (!s) return null;

  // common boolean-ish values
  if (["true", "1", "yes", "ja", "y", "j"].includes(s)) return true;
  if (["false", "0", "no", "nein", "n"].includes(s)) return false;

  // ImmoScout enum-ish values often look like YES/NO/NOT_APPLICABLE
  if (s === "not_applicable" || s === "n/a" || s === "na") return null;

  return null;
}

function normalizeText(v: any): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  return s ? s : null;
}

function safeJoin(a?: any, b?: any): string | null {
  const A = normalizeText(a);
  const B = normalizeText(b);
  const out = [A, B].filter(Boolean).join(" ").trim();
  return out ? out : null;
}

function inferVermarktung(args: {
  realEstateTypeRaw: any;
  commercializationTypeRaw?: any;
}): "rent" | "sale" | null {
  const t = String(args.realEstateTypeRaw || "").toLowerCase();
  const c = String(args.commercializationTypeRaw || "").toLowerCase();
  const combined = `${c} ${t}`.trim();
  if (!combined) return null;

  // BUY = sale
  if (combined.includes("buy") || combined.includes("kauf")) return "sale";

  // rent-ish / lease-ish = rent
  if (
    combined.includes("rent") ||
    combined.includes("miete") ||
    combined.includes("lease")
  )
    return "rent";

  return null;
}

function inferType(realEstateTypeRaw: any): string | null {
  const t = String(realEstateTypeRaw || "").toLowerCase();
  if (!t) return null;
  if (t.includes("apartment") || t.includes("wohnung")) return "apartment";
  if (t.includes("house") || t.includes("haus")) return "house";
  if (t.includes("studio")) return "studio";
  if (t.includes("room") || t.includes("zimmer")) return "room";
  return normalizeText(realEstateTypeRaw);
}

function parseISODateOrNull(v: any): string | null {
  if (!v) return null;
  const d = new Date(String(v));
  if (!Number.isFinite(d.getTime())) return null;
  return d.toISOString().slice(0, 10);
}

function extractWarmPrice(e: any): {
  price: number | null;
  price_type: string | null;
} {
  // 1) Warmmiete: bevorzugt calculatedTotalRent / totalRent
  const warmCandidates = [
    "calculatedTotalRent",
    "totalRent",
    "calculatedTotalRent.value",
    "totalRent.value",
  ];

  for (const p of warmCandidates) {
    const v = pick(e, [
      p,
      `realEstateElement.${p}`,
      `price.${p}`,
      `realEstateElement.price.${p}`,
    ]);
    const n = toNumberOrNull(v);
    if (n != null && n > 0) return { price: n, price_type: "warm" };
  }

  // 2) Falls keine Warmmiete vorhanden: baseRent + serviceCharge + heatingCosts (best-effort)
  const baseRent = toNumberOrNull(
    pick(e, [
      "baseRent",
      "realEstateElement.baseRent",
      "price.baseRent",
      "realEstateElement.price.baseRent",
      "baseRent.value",
      "realEstateElement.baseRent.value",
    ])
  );
  const serviceCharge = toNumberOrNull(
    pick(e, [
      "serviceCharge",
      "realEstateElement.serviceCharge",
      "price.serviceCharge",
      "realEstateElement.price.serviceCharge",
      "serviceCharge.value",
      "realEstateElement.serviceCharge.value",
    ])
  );
  const heatingCosts = toNumberOrNull(
    pick(e, [
      "heatingCosts",
      "realEstateElement.heatingCosts",
      "price.heatingCosts",
      "realEstateElement.price.heatingCosts",
      "heatingCosts.value",
      "realEstateElement.heatingCosts.value",
    ])
  );

  // Wenn wir mind. baseRent haben, können wir eine Warmmiete approximieren
  if (baseRent != null && baseRent > 0) {
    const warm = baseRent + (serviceCharge || 0) + (heatingCosts || 0);
    if (warm > 0) return { price: warm, price_type: "warm" };
    return { price: baseRent, price_type: "kalt" };
  }

  // 3) Kauf: purchasePrice
  const buyCandidates = [
    "purchasePrice",
    "purchasePrice.value",
    "price.value",
    "price",
  ];
  for (const p of buyCandidates) {
    const v = pick(e, [
      p,
      `realEstateElement.${p}`,
      `price.${p}`,
      `realEstateElement.price.${p}`,
    ]);
    const n = toNumberOrNull(v);
    if (n != null && n > 0) return { price: n, price_type: "kauf" };
  }

  return { price: null, price_type: null };
}

function mapImmoScoutToProperty(args: {
  e: any;
  agentId: string;
  baseUrl: string;
  href: any;
  immoId: any;
}): any {
  const { e, agentId, baseUrl, href, immoId } = args;

  const title = pick(e, ["title", "realEstateElement.title"]);
  const realEstateType = pick(e, [
    "realEstateType",
    "realEstateElement.realEstateType",
  ]);

  const commercializationType = pick(e, [
    "commercializationType",
    "realEstateElement.commercializationType",
  ]);

  const city = pick(e, ["address.city", "realEstateElement.address.city"]);
  const neighbourhood =
    pick(e, [
      "address.quarter",
      "realEstateElement.address.quarter",
      "address.region",
      "realEstateElement.address.region",
      "geoHierarchy.quarter.name",
      "realEstateElement.geoHierarchy.quarter.name",
    ]) ?? null;

  const street = pick(e, [
    "address.street",
    "realEstateElement.address.street",
  ]);
  const houseNumber = pick(e, [
    "address.houseNumber",
    "realEstateElement.address.houseNumber",
  ]);
  const street_address = safeJoin(street, houseNumber);

  const url =
    (href && String(href)) ||
    (immoId
      ? `${baseUrl}/restapi/api/offer/v1.0/user/me/realestate/${immoId}`
      : null);

  const { price, price_type } = extractWarmPrice(e);

  const rooms =
    pick(e, ["numberOfRooms", "realEstateElement.numberOfRooms"]) ??
    pick(e, ["rooms", "realEstateElement.rooms"]) ??
    null;

  const size =
    pick(e, ["livingSpace", "realEstateElement.livingSpace"]) ??
    pick(e, ["totalSpace", "realEstateElement.totalSpace"]) ??
    null;

  const floor =
    pick(e, ["floor", "realEstateElement.floor"]) ??
    pick(e, ["numberOfFloors", "realEstateElement.numberOfFloors"]) ??
    null;

  const yearBuilt =
    pick(e, ["constructionYear", "realEstateElement.constructionYear"]) ??
    pick(e, ["yearBuilt", "realEstateElement.yearBuilt"]) ??
    null;

  // ImmoScout frequently uses hasFurniture (YES/NO/NOT_APPLICABLE)
  const furnished =
    toBoolOrNull(
      pick(e, [
        "hasFurniture",
        "realEstateElement.hasFurniture",
        "furnished",
        "realEstateElement.furnished",
      ])
    ) ?? null;

  // ImmoScout commonly uses lift (YES/NO/NOT_APPLICABLE)
  const elevator =
    toBoolOrNull(
      pick(e, [
        "lift",
        "realEstateElement.lift",
        "elevator",
        "realEstateElement.elevator",
      ])
    ) ?? null;

  const heating = normalizeText(
    pick(e, ["heatingType", "realEstateElement.heatingType"])
  );
  const energy_label = normalizeText(
    pick(e, [
      "energyEfficiencyClass",
      "realEstateElement.energyEfficiencyClass",
    ])
  );

  const available_from_text = normalizeText(
    pick(e, [
      "freeFrom",
      "realEstateElement.freeFrom",
      "availableFrom",
      "realEstateElement.availableFrom",
    ])
  );

  const rent_move_in_from = parseISODateOrNull(available_from_text);

  const vermarktung = inferVermarktung({
    realEstateTypeRaw: realEstateType,
    commercializationTypeRaw: commercializationType,
  });
  const type = inferType(realEstateType);

  const pets_allowed = normalizeText(
    pick(e, ["petsAllowed", "realEstateElement.petsAllowed"])
  );

  return {
    agent_id: agentId,
    url: url ? String(url) : null,

    title: normalizeText(title),
    listing_summary: normalizeText(title),
    description: normalizeText(
      pick(e, ["descriptionNote", "realEstateElement.descriptionNote"])
    ),

    city: normalizeText(city),
    neighborhood: normalizeText(neighbourhood),
    street_address,

    vermarktung: vermarktung,
    type,

    price,
    price_type: price_type ?? null,

    rooms: rooms != null ? String(rooms) : null,
    size_sqm: toIntOrNull(size),
    floor: floor != null ? String(floor) : null,
    year_built: toIntOrNull(yearBuilt),

    furnished,
    elevator,
    heating,
    energy_label,

    available_from: available_from_text,
    rent_move_in_from,

    pets_allowed: pets_allowed ?? null,
  };
}

export async function POST(req: NextRequest) {
  const secret = mustEnv("IMMOSCOUT_SYNC_SECRET");
  const auth = req.headers.get("authorization") || "";
  const token = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : "";

  if (!token || token !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = supabaseAdmin();
  const bucket = propertyImagesBucket();

  const { data: conns, error: connErr } = await (
    supabase.from("immoscout_connections") as any
  )
    .select(
      "agent_id, environment, status, access_token, access_token_secret, last_error, last_synced_modification"
    )
    .eq("status", "connected");

  if (connErr) {
    return NextResponse.json(
      { error: "Failed to load connections", details: connErr.message },
      { status: 500 }
    );
  }

  const results: any[] = [];

  for (const c of conns || []) {
    const agentId = String(c.agent_id);
    const environment = String(c.environment || "sandbox");

    const accessToken = String(c.access_token || "");
    const accessTokenSecret = String(c.access_token_secret || "");
    const lastSyncedMod = parseImmoDate(c.last_synced_modification);

    if (!accessToken || !accessTokenSecret) {
      results.push({ agentId, ok: false, reason: "missing_access_token" });
      continue;
    }

    const { baseUrl, consumerKey, consumerSecret } =
      getImmoScoutEnv(environment);

    const pageSize = 100;
    const maxPages = 25; // safety

    const makeListUrl = (page: number) =>
      `${baseUrl}/restapi/api/offer/v1.0/user/me/realestate?pagesize=${pageSize}&pagenumber=${page}&features=withAttachments&archivedobjectsincluded=true`;

    const oauth = oauthClient(consumerKey, consumerSecret);

    let allElements: any[] = [];
    let fetchFailed: { status: number | string; body: string } | null = null;

    for (let page = 1; page <= maxPages; page++) {
      const listUrl = makeListUrl(page);
      const requestData = { url: listUrl, method: "GET" };

      const authHeader = oauth.toHeader(
        oauth.authorize(requestData, {
          key: accessToken,
          secret: accessTokenSecret,
        })
      );

      const resp = await fetch(listUrl, {
        method: "GET",
        headers: {
          Authorization: authHeader.Authorization,
          Accept: "application/json, application/xml;q=0.9, */*;q=0.8",
        },
      }).catch(() => null);

      if (!resp || !resp.ok) {
        const txt = resp ? await resp.text().catch(() => "") : "";
        fetchFailed = { status: resp ? resp.status : "no_resp", body: txt };
        break;
      }

      const bodyText = await resp.text();
      const parsed = tryJsonParse(bodyText) ?? tryXmlParse(bodyText);

      if (!parsed) {
        fetchFailed = { status: "unparseable", body: bodyText.slice(0, 800) };
        break;
      }

      const elements = extractRealEstateElements(parsed);
      allElements = allElements.concat(elements);

      // stop if last page
      if (!elements || elements.length < pageSize) break;
    }

    if (fetchFailed) {
      await (supabase.from("immoscout_connections") as any)
        .update({
          last_error:
            `sync_failed: ${fetchFailed.status} ${fetchFailed.body}`.slice(
              0,
              800
            ),
          updated_at: new Date().toISOString(),
        })
        .eq("agent_id", agentId);

      results.push({
        agentId,
        ok: false,
        reason: "sync_failed",
        status: fetchFailed.status,
      });
      continue;
    }

    const elements = allElements;

    let upserted = 0;
    let skippedOld = 0;
    let sourceUpserted = 0;
    let maxSeenMod: Date | null = lastSyncedMod;

    for (const e of elements) {
      // In XML ist modification ein Attribut am realEstateElement (z.B. @_modification).  [oai_citation:2‡ImmoScout24 API](https://api.immobilienscout24.de/api-docs/import-export/real-estate/retrieve-all-real-estates/)
      const modRaw =
        pick(e, [
          "@_modification",
          "modification",
          "realEstateElement.@_modification",
        ]) ?? null;
      const modDate = parseImmoDate(modRaw);

      if (lastSyncedMod && modDate && modDate <= lastSyncedMod) {
        skippedOld++;
        continue;
      }

      if (modDate && (!maxSeenMod || modDate > maxSeenMod)) {
        maxSeenMod = modDate;
      }

      const immoId =
        pick(e, [
          "@_id",
          "id",
          "realEstateElement.@_id",
          "realEstateElement.id",
        ]) ?? null;

      const href =
        pick(e, [
          "@_xlink:href",
          "@_href",
          "realEstateElement.@_xlink:href",
          "realEstateElement.@_href",
        ]) ?? null;

      const title = pick(e, ["title", "realEstateElement.title"]) ?? null;

      const city =
        pick(e, ["address.city", "realEstateElement.address.city"]) ?? null;

      const street =
        pick(e, ["address.street", "realEstateElement.address.street"]) ?? null;

      const houseNumber =
        pick(e, [
          "address.houseNumber",
          "realEstateElement.address.houseNumber",
        ]) ?? null;

      const url =
        (href && String(href)) ||
        (immoId
          ? `${baseUrl}/restapi/api/offer/v1.0/user/me/realestate/${immoId}`
          : null);

      const externalImageUrls = collectImageUrls(e);

      const payload = mapImmoScoutToProperty({
        e,
        agentId,
        baseUrl,
        href,
        immoId,
      });

      if (!payload.url) continue;

      // Important: we mirror images into our private bucket.
      // We therefore DO NOT store external ImmoScout URLs in properties.image_urls.
      const { data: upProp, error: upErr } = await (
        supabase.from("properties") as any
      )
        .upsert(payload, { onConflict: "url" })
        .select("id")
        .maybeSingle();

      // Mirror images after we have a stable property_id
      // Delta-sync semantics:
      // - Keep any existing images that were NOT previously mirrored from ImmoScout
      // - Replace the ImmoScout-mirrored set with the newly mirrored set
      let mirroredImagePaths: string[] = [];
      let previousMirrored: string[] = [];

      if (!upErr && upProp?.id) {
        // Load previous source state (best-effort)
        try {
          const { data: prevSource } = await (
            supabase.from("property_sources") as any
          )
            .select("raw")
            .eq("agent_id", agentId)
            .eq("property_id", upProp.id)
            .eq("source", "immoscout24")
            .eq("environment", environment)
            .eq("external_id", immoId ? String(immoId) : String(url))
            .maybeSingle();

          const prevRaw = prevSource?.raw;
          const prevList = prevRaw?._advaic?.mirrored_image_paths;
          if (Array.isArray(prevList)) {
            previousMirrored = prevList
              .map((x: any) => String(x || "").trim())
              .filter(Boolean);
          }
        } catch {
          // ignore
        }

        if (externalImageUrls.length > 0) {
          mirroredImagePaths = await mirrorImagesToBucket({
            supabase,
            bucket,
            agentId,
            propertyId: String(upProp.id),
            sourceUrls: externalImageUrls,
            limit: 8,
          });
        }

        // Update properties.image_urls using delta merge (do not clobber agent-uploaded images)
        if (mirroredImagePaths.length > 0 || previousMirrored.length > 0) {
          const { data: existingProp } = await (
            supabase.from("properties") as any
          )
            .select("image_urls")
            .eq("id", upProp.id)
            .maybeSingle();

          const existingUrls: string[] = Array.isArray(existingProp?.image_urls)
            ? existingProp.image_urls
            : [];

          const merged = mergeDeltaImages({
            existing: existingUrls,
            previousSourceMirrored: previousMirrored,
            nextSourceMirrored: mirroredImagePaths,
            limit: 24,
          });

          await (supabase.from("properties") as any)
            .update({
              image_urls: merged,
              last_edit_at: new Date().toISOString(),
            })
            .eq("id", upProp.id);
        }
      }

      if (!upErr && upProp?.id) {
        upserted++;

        // Best-effort: store source metadata for delta sync + audit
        try {
          await (supabase.from("property_sources") as any).upsert(
            {
              agent_id: agentId,
              property_id: upProp.id,
              source: "immoscout24",
              environment,
              external_id: immoId ? String(immoId) : String(url),
              href: href ? String(href) : null,
              external_modified_at: modDate ? modDate.toISOString() : null,
              raw: {
                ...e,
                _advaic: {
                  external_image_urls: externalImageUrls,
                  mirrored_image_paths: mirroredImagePaths,
                  previous_mirrored_image_paths: previousMirrored,
                },
              },
              updated_at: new Date().toISOString(),
            },
            { onConflict: "source,environment,external_id" }
          );
          sourceUpserted++;
        } catch {
          // ignore source write failures
        }
      }
    }

    await (supabase.from("immoscout_connections") as any)
      .update({
        last_error: null,
        last_synced_modification: maxSeenMod ? maxSeenMod.toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq("agent_id", agentId);

    results.push({
      agentId,
      ok: true,
      fetched: elements.length,
      upserted,
      sourceUpserted,
      skippedOld,
      lastSyncedMod: maxSeenMod ? maxSeenMod.toISOString() : null,
    });
  }

  return NextResponse.json({
    ok: true,
    processedAgents: (conns || []).length,
    results,
  });
}
