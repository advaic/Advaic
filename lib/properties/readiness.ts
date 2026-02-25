export type PropertyStartklarFieldKey =
  | "title"
  | "street_address"
  | "city"
  | "type"
  | "price_type"
  | "price"
  | "rooms"
  | "size_sqm"
  | "listing_summary"
  | "url";

export type PropertyStartklarField = {
  key: PropertyStartklarFieldKey;
  label: string;
};

type PropertyLike = Partial<Record<PropertyStartklarFieldKey, unknown>> &
  Record<string, unknown>;

const RENT_OR_SALE = new Set(["vermietung", "verkauf", "rent", "sale"]);

export const PROPERTY_STARTKLAR_FIELDS: PropertyStartklarField[] = [
  { key: "title", label: "Kurztitel" },
  { key: "street_address", label: "Straße" },
  { key: "city", label: "Stadt" },
  { key: "type", label: "Typ" },
  { key: "price_type", label: "Vermarktung" },
  { key: "price", label: "Preis" },
  { key: "rooms", label: "Zimmer" },
  { key: "size_sqm", label: "Fläche (m²)" },
  { key: "listing_summary", label: "Kurzbeschreibung" },
  { key: "url", label: "Listing-Link" },
];

function trimValue(value: unknown): string {
  return String(value ?? "").trim();
}

function hasText(value: unknown): boolean {
  return trimValue(value).length > 0;
}

function hasPositiveNumber(value: unknown): boolean {
  const n = Number(value);
  return Number.isFinite(n) && n > 0;
}

export function isHttpUrl(value: unknown): boolean {
  const raw = trimValue(value);
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function hasValidVermarktung(value: unknown): boolean {
  const normalized = trimValue(value).toLowerCase();
  return RENT_OR_SALE.has(normalized);
}

function isFieldValid(field: PropertyStartklarFieldKey, property: PropertyLike): boolean {
  const value = property[field];
  switch (field) {
    case "price":
    case "rooms":
    case "size_sqm":
      return hasPositiveNumber(value);
    case "url":
      return isHttpUrl(value);
    case "price_type":
      return hasValidVermarktung(value);
    default:
      return hasText(value);
  }
}

export function getPropertyStartklarMissingFields(property: PropertyLike): PropertyStartklarField[] {
  return PROPERTY_STARTKLAR_FIELDS.filter((field) => !isFieldValid(field.key, property));
}

export function getPropertyStartklarReason(property: PropertyLike): string | null {
  const missing = getPropertyStartklarMissingFields(property);
  if (missing.length === 0) return null;
  const labels = missing.map((m) => m.label);
  const preview = labels.slice(0, 3).join(", ");
  const more = labels.length > 3 ? ` (+${labels.length - 3} weitere)` : "";
  return `Aktive Immobilie unvollständig: ${preview}${more}.`;
}
