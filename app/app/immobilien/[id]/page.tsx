import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import PropertyDetailClient from "@/components/PropertyDetailClient";

export default async function PropertyDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", params.id)
    .single();

  if (propertyError) {
    console.error("Error loading property:", propertyError);
  }

  if (!property || propertyError) return notFound();

  const { data: images } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <PropertyDetailClient
      property={property}
      image_urls={images?.map((img) => img.url) || []}
    />
  );
}
