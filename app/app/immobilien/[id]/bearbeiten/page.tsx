/*
  Page: bearbeiten/page.tsx
  Purpose: Edit existing property (all fields + images), with full image support (sortable, deletable, reupload)
*/

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Checkbox from "@/components/ui/checkbox";
import SortableImageList from "@/components/SortableImageList";
import { uploadImageToSupabase } from "@/lib/supabase/imageUtils";

export default function EditPropertyPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    city: "",
    neighbourhood: "",
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
    uri: "",
    furnished: false,
    elevator: false,
    description: "",
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      const { data: property, error: propError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (propError || !property) {
        console.error("Fehler beim Laden der Immobilie:", propError);
        return;
      }

      const images = property.image_urls || [];

      setForm({
        ...property,
        pets_allowed: property.pets_allowed ?? false,
        furnished: property.furnished ?? false,
        elevator: property.elevator ?? false,
      });
      setImageUrls(images);
      setLoading(false);
    };

    fetchData();
  }, [id]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleCheckboxChange = (field: string) => {
    setForm((prev) => ({
      ...prev,
      [field]: !prev[field as keyof typeof form],
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const filesArray = Array.from(e.target.files);
    setNewImages((prev) => [...prev, ...filesArray]);

    const newPreviews = filesArray.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleDeleteImage = (url: string) => {
    setImageUrls((prevUrls) => prevUrls.filter((img) => img !== url));
  };

  const handleSortImages = (newOrder: string[]) => {
    setImageUrls(newOrder);
  };

  const handleSubmit = async () => {
    const uploadedUrls: string[] = [];

    for (const file of newImages) {
      const uploaded = await uploadImageToSupabase(file, id!);
      if (uploaded) uploadedUrls.push(uploaded);
    }

    const combinedImageUrls = [...imageUrls, ...uploadedUrls];

    const { error } = await supabase
      .from("properties")
      .update({
        ...form,
        image_urls: combinedImageUrls,
      })
      .eq("id", id);

    if (error) {
      console.error("Fehler beim Aktualisieren:", error);
      return;
    }

    router.push("/immobilien");
  };

  if (!id) return <div className="p-4">❌ Kein ID angegeben.</div>;
  if (loading) return <div className="p-4">⏳ Lade Daten...</div>;

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Immobilie bearbeiten</h1>

      {Object.entries({
        title: "Kurztitel",
        city: "Stadt",
        neighbourhood: "Stadtteil",
        street_address: "Straße",
        type: "Typ",
        price: "Preis",
        price_type: "Preisart",
        size_sqm: "Fläche in m²",
        rooms: "Zimmer",
        floor: "Etage",
        year_built: "Baujahr",
        heating: "Heizung",
        energy_label: "Energieklasse",
        available_from: "Verfügbar ab",
        parking: "Parkmöglichkeiten",
        uri: "Listing-Link",
      }).map(([field, label]) => (
        <div key={field}>
          <Label>{label}</Label>
          <Input
            name={field}
            value={(form as any)[field] || ""}
            onChange={handleInputChange}
          />
        </div>
      ))}

      <div>
        <Label>Beschreibung</Label>
        <Textarea
          name="description"
          value={form.description}
          onChange={handleInputChange}
        />
      </div>

      {["pets_allowed", "furnished", "elevator"].map((field) => (
        <div className="flex items-center space-x-2" key={field}>
          <Checkbox
            id={field}
            checked={(form as any)[field]}
            onChange={() => handleCheckboxChange(field)}
          />
          <Label htmlFor={field}>
            {
              {
                pets_allowed: "Haustiere erlaubt?",
                furnished: "Möbliert",
                elevator: "Aufzug",
              }[field]
            }
          </Label>
        </div>
      ))}

      <div>
        <Label>Bilder</Label>
        <SortableImageList imageUrls={imageUrls} onDelete={handleDeleteImage} />
      </div>

      {imagePreviews.length > 0 && (
        <div>
          <Label>Neue Bilder (Vorschau)</Label>
          <SortableImageList
            imageUrls={imagePreviews}
            onDelete={(urlToDelete) => {
              const index = imagePreviews.findIndex(
                (url) => url === urlToDelete
              );
              if (index !== -1) {
                setNewImages((prevFiles) => {
                  const updatedFiles = [...prevFiles];
                  updatedFiles.splice(index, 1);
                  return updatedFiles;
                });
                setImagePreviews((prevPreviews) => {
                  const updatedPreviews = [...prevPreviews];
                  updatedPreviews.splice(index, 1);
                  return updatedPreviews;
                });
              }
            }}
          />
        </div>
      )}

      <div>
        <Label>Neue Bilder hochladen</Label>
        <Input type="file" multiple onChange={handleImageUpload} />
      </div>

      <div className="pt-4">
        <Button onClick={handleSubmit}>Änderungen speichern</Button>
      </div>
    </div>
  );
}
