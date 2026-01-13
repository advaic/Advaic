import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { notFound } from "next/navigation";

import type { Database } from "@/types/supabase";
import PropertyDetailClient from "@/components/PropertyDetailClient";

type PageProps = {
  params: { id: string };
};

export default async function PropertyDetailPage({ params }: PageProps) {
  // Next.js versions differ: `cookies()` may return the store or a Promise.
  // Awaiting works in both cases and fixes TS when it is a Promise.
  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => {
          const cs: any = cookieStore as any;
          if (typeof cs.getAll === "function") return cs.getAll();
          // Fallback: build an array from iterator if available
          if (typeof cs[Symbol.iterator] === "function") {
            const out: any[] = [];
            for (const c of cs as any) out.push(c);
            return out;
          }
          return [];
        },
        setAll: (cookiesToSet) => {
          const cs: any = cookieStore as any;
          // In Server Components, `cookies()` can be read-only (no `.set`).
          // Supabase may try to set refreshed cookies; ignore if not supported.
          for (const { name, value, options } of cookiesToSet) {
            try {
              cs.set?.(name, value, options);
            } catch {
              // no-op
            }
          }
        },
      },
    }
  );

  const rawId = params.id;
  if (!rawId) return notFound();

  // In our Supabase schema, `properties.id` is often a numeric/bigint.
  // Next params are always strings, so we must coerce when it is numeric.
  const id: number | string = /^\d+$/.test(rawId) ? Number(rawId) : rawId;

  if (typeof id === "number" && Number.isNaN(id)) return notFound();

  // Ensure the user is authenticated and only allow access to their own properties.
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return notFound();

  const { data: property, error: propertyError } = await supabase
    .from("properties")
    .select("*")
    .eq("id", id as any)
    .eq("agent_id", user.id)
    .single();

  if (propertyError) {
    console.error("Error loading property:", {
      message: propertyError.message,
      code: (propertyError as any).code,
      details: (propertyError as any).details,
      hint: (propertyError as any).hint,
      id,
      rawId,
      userId: user.id,
    });
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
