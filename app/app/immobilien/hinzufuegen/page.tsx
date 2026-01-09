// @ts-nocheck
// Neue Logik: Immobilie erst speichern, dann Bilder hochladen und URLs in image_urls speichern
"use client";

import { useState, useCallback } from "react";
import SortablePreviewList from "@/components/SortablePreviewList";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function HinzufuegenPage() {
  const router = useRouter();
  const [property, setProperty] = useState({
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
    status: "published",
    image_urls: [],
  });
  const [uploading, setUploading] = useState(false);
  const [files, setFiles] = useState<(File | string)[]>([]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    const newValue =
      type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    setProperty((prev) => ({
      ...prev,
      [name]: newValue,
    }));
  };

  const updateProperty = useCallback(
    async (updatedFields: Partial<typeof property>) => {
      if (!property.id) return;
      const { data, error } = await supabase
        .from("properties")
        .update(updatedFields)
        .eq("id", property.id)
        .select()
        .single();
      if (error) {
        alert("Fehler beim Aktualisieren der Immobilie");
        console.error(error);
        return;
      }
      setProperty((prev) => ({
        ...prev,
        ...data,
      }));
    },
    [property.id]
  );

  const uploadImageToSupabase = async (file: File, propertyId: number) => {
    const fileExt = file.name.split(".").pop();
    const filePath = `${Date.now()}-${file.name}`;

    const { data, error } = await supabase.storage
      .from("property-images")
      .upload(`${propertyId}/${filePath}`, file);

    if (error) {
      alert("Upload fehlgeschlagen: " + error.message);
      return null;
    }

    const publicUrl = `https://igavhuyqninnqluenvnn.supabase.co/storage/v1/object/public/property-images/${propertyId}/${filePath}`;
    return publicUrl;
  };

  const handleSubmit = async () => {
    setUploading(true);

    // Step 1: Logs zur Sicherheit
    const formData = {
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
      status: "published",
      image_urls: [],
    };

    console.log("Starte Speicherung der Immobilie mit Werten:", formData);

    // Fetch logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error("Failed to get user", userError);
      setUploading(false);
      return;
    }

    // Step 2: Immobilie einfügen
    const { data: insertData, error: insertError } = await supabase
      .from("properties")
      .insert([
        {
          ...formData,
          agent_id: user.id,
        },
      ])
      .select()
      .single();

    console.log("Insert result:", insertData);
    console.log("Insert error:", insertError);

    if (insertError || !insertData || !insertData.id) {
      setUploading(false);
      alert("Fehler beim Speichern der Immobilie");
      console.error(
        "Insert fehlgeschlagen oder keine ID:",
        insertError,
        insertData
      );
      return;
    }

    // Step 3: Bilder hochladen (falls vorhanden)
    let uploadedUrls: string[] = [];

    if (files.length > 0) {
      try {
        uploadedUrls = await Promise.all(
          files.map(async (file) => {
            if (typeof file === "string") return file;
            const url = await uploadImageToSupabase(file, insertData.id);
            if (!url) {
              console.warn("Fehler beim Hochladen eines Bildes:", file.name);
              return "";
            }
            return url;
          })
        );

        // Leere Strings filtern
        uploadedUrls = uploadedUrls.filter(Boolean);
        console.log("Erfolgreich hochgeladene Bilder:", uploadedUrls);
      } catch (uploadError) {
        console.error("Fehler beim Hochladen der Bilder:", uploadError);
        alert("Fehler beim Hochladen der Bilder");
        setUploading(false);
        return;
      }
    }

    // Step 4: Update der Immobilie mit image_urls
    const { error: updateError } = await supabase
      .from("properties")
      .update({ image_urls: uploadedUrls })
      .eq("id", insertData.id);

    if (updateError) {
      console.error("Fehler beim Update der Bilder:", updateError);
      alert("Fehler beim Hinzufügen der Bilder zur Immobilie");
      setUploading(false);
      return;
    }

    // Erfolg
    alert("Immobilie erfolgreich gespeichert!");
    setUploading(false);
    router.push("/immobilien");
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Neue Immobilie hinzufügen</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label>
          Kurztitel
          <input
            name="title"
            placeholder="Kurztitel (z. B. 'Moderne Wohnung mit Balkon')"
            onChange={handleChange}
            value={property.title}
            className="border p-2 rounded w-full"
          />
        </label>
        <label>
          Stadt
          <input
            name="city"
            placeholder="Stadt (z. B. Hamburg)"
            onChange={handleChange}
            value={property.city}
            className="border p-2 rounded w-full"
          />
        </label>
        <label>
          Stadtteil
          <input
            name="neighborhood"
            placeholder="Stadtteil (z. B. Eimsbüttel)"
            onChange={handleChange}
            value={property.neighborhood}
            className="border p-2 rounded w-full"
          />
        </label>
        <label>
          Straße
          <input
            name="street_address"
            placeholder="Straße (z. B. Osterstraße 12a)"
            onChange={handleChange}
            value={property.street_address}
            className="border p-2 rounded w-full"
          />
        </label>
        <label>
          Typ
          <input
            name="type"
            placeholder="Typ (z. B. Wohnung)"
            onChange={handleChange}
            value={property.type}
            className="border p-2 rounded w-full"
          />
        </label>
        <label>
          Preis
          <input
            name="price"
            type="number"
            placeholder="Preis (z. B. 1250)"
            onChange={handleChange}
            value={property.price}
            className="border p-2 rounded w-full"
          />
        </label>
        <label>
          Preisart
          <input
            name="price_type"
            placeholder="Preisart (z. B. Miete oder Kauf)"
            onChange={handleChange}
            value={property.price_type}
            className="border p-2 rounded w-full"
          />
        </label>
        <label>
          Größe in m²
          <input
            name="size_sqm"
            type="number"
            placeholder="Größe in m² (z. B. 85)"
            onChange={handleChange}
            value={property.size_sqm}
            className="border p-2 rounded w-full"
          />
        </label>
        <label>
          Zimmeranzahl
          <input
            name="rooms"
            type="number"
            placeholder="Zimmeranzahl (z. B. 3)"
            onChange={handleChange}
            value={property.rooms}
            className="border p-2 rounded w-full"
          />
        </label>
        <label>
          Etage
          <input
            name="floor"
            type="number"
            placeholder="Etage (z. B. 2)"
            onChange={handleChange}
            value={property.floor}
            className="border p-2 rounded w-full"
          />
        </label>
        <label>
          Baujahr
          <input
            name="year_built"
            type="number"
            placeholder="Baujahr (z. B. 1995)"
            onChange={handleChange}
            value={property.year_built}
            className="border p-2 rounded w-full"
          />
        </label>
        <label>
          Heizungsart
          <input
            name="heating"
            placeholder="Heizungsart (z. B. Zentralheizung)"
            onChange={handleChange}
            value={property.heating}
            className="border p-2 rounded w-full"
          />
        </label>
        <label>
          Energieklasse
          <input
            name="energy_label"
            placeholder="Energieklasse (z. B. B)"
            onChange={handleChange}
            value={property.energy_label}
            className="border p-2 rounded w-full"
          />
        </label>
        <label>
          Verfügbar ab
          <input
            name="available_from"
            type="date"
            placeholder="Verfügbar ab (z. B. 01.09.2025)"
            onChange={handleChange}
            value={property.available_from}
            className="border p-2 rounded w-full"
          />
        </label>
        <label>
          Parkmöglichkeiten
          <input
            name="parking"
            placeholder="Parkmöglichkeiten (z. B. Tiefgarage)"
            onChange={handleChange}
            value={property.parking}
            className="border p-2 rounded w-full"
          />
        </label>
        <label>
          Listing-Link
          <input
            name="url"
            placeholder="Listing-Link (z. B. https://...)"
            onChange={handleChange}
            value={property.url}
            className="border p-2 rounded w-full"
          />
        </label>
        <label className="col-span-2">
          Beschreibung
          <textarea
            name="description"
            placeholder="Beschreibung"
            onChange={handleChange}
            value={property.description}
            className="border p-2 rounded w-full"
            rows={4}
          />
        </label>

        <label className="flex items-center gap-2 col-span-2">
          <input
            type="checkbox"
            name="pets_allowed"
            checked={property.pets_allowed}
            onChange={handleChange}
          />
          Haustiere erlaubt?
        </label>

        <label className="flex items-center gap-2 col-span-2">
          <input
            type="checkbox"
            name="furnished"
            checked={property.furnished}
            onChange={handleChange}
          />
          Möbliert?
        </label>

        <label className="flex items-center gap-2 col-span-2">
          <input
            type="checkbox"
            name="elevator"
            checked={property.elevator}
            onChange={handleChange}
          />
          Aufzug vorhanden?
        </label>

        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Bilder hochladen
          </label>
          <SortablePreviewList files={files} setFiles={setFiles} />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={uploading}
        className="mt-6 px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {uploading ? "Wird gespeichert..." : "Immobilie speichern"}
      </button>
    </div>
  );
}
