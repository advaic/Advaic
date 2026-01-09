import { supabase } from "@/lib/supabaseClient";
import { notFound } from "next/navigation";
import PropertyDetailClient from "@/components/PropertyDetailClient";

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function PropertyDetailPage({ params }: PageProps) {
  const { id } = await params;

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (propertyError) {
    console.error("Error loading property:", propertyError);
  }

  if (!property || propertyError) return notFound();

  const { data: images } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", id)
    .order("created_at", { ascending: true });

  return (
    <PropertyDetailClient
      property={property}
      image_urls={images?.map((img) => img.url) || []}
    />
  );
}
