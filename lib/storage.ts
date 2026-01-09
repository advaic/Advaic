// lib/storage.ts
import { supabase } from "./supabaseClient";

export async function uploadImage(file: File, propertyId: string) {
  const filePath = `${propertyId}/${Date.now()}_${file.name}`;

  const { data, error } = await supabase.storage
    .from("property-images")
    .upload(filePath, file);

  if (error) throw error;

  const publicUrl = supabase.storage
    .from("property-images")
    .getPublicUrl(filePath).data.publicUrl;

  return { filePath, publicUrl };
}
