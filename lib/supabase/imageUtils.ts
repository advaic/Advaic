// lib/supabase/imageUtils.ts
import { supabase } from "../supabaseClient";

export async function uploadImageToSupabase(
  file: File,
  propertyId: string
): Promise<string | null> {
  const filePath = `${propertyId}/${Date.now()}-${file.name}`;

  const { data, error } = await supabase.storage
    .from("property-images")
    .upload(filePath, file);

  if (error) {
    console.error("Image upload failed:", error);
    return null;
  }

  const { data: publicUrlData } = supabase.storage
    .from("property-images")
    .getPublicUrl(filePath);

  return publicUrlData?.publicUrl ?? null;
}
