import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { notFound } from "next/navigation";

import type { Database } from "@/types/supabase";
import PropertyDetailClient from "@/components/PropertyDetailClient";

type PageProps = {
  params: { id: string };
};

export default async function PropertyDetailPage({ params }: PageProps) {
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  );

  const id = params.id; // UUID/string id
  if (!id) return notFound();

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id)
    .single();

  if (propertyError) {
    console.error("Error loading property:", propertyError);
  }

  if (!property || propertyError) return notFound();

  // We store private storage paths in `properties.image_urls`.
  const imagePaths = Array.isArray((property as any).image_urls)
    ? ((property as any).image_urls as string[]).filter(Boolean)
    : [];

  return (
    <PropertyDetailClient
      property={property as any}
      image_urls={imagePaths}
    />
  );
}
