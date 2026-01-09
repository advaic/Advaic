// File: /app/api/cleanup-drafts/route.ts

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Falls du es nicht schon in einer Umgebungsvariable hast:
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Achte darauf, dass diese NUR serverseitig verwendet wird!
);

export async function GET() {
  const now = new Date();
  const cutoff = new Date(now.getTime() - 10 * 60 * 1000); // 10 Minuten vorher

  // 1. Finde alle Properties mit status = 'draft' und älter als 10 Minuten
  const { data: drafts, error: fetchError } = await supabaseAdmin
    .from("properties")
    .select("id")
    .eq("status", "draft")
    .lt("created_at", cutoff.toISOString());

  if (fetchError) {
    console.error("Fehler beim Abrufen von Draft-Properties:", fetchError);
    return NextResponse.json(
      { error: "Fehler beim Abrufen der Entwürfe" },
      { status: 500 }
    );
  }

  for (const draft of drafts || []) {
    const propertyId = draft.id;

    // 2. Hole die zugehörigen Bilder
    const { data: images, error: imageFetchError } = await supabaseAdmin
      .from("property_images")
      .select("image_url")
      .eq("property_id", propertyId);

    if (imageFetchError) {
      console.error(
        `Fehler beim Abrufen der Bilder für Property ${propertyId}:`,
        imageFetchError
      );
      continue;
    }

    // 3. Lösche die Bilder aus dem Storage
    const filePaths =
      images?.map((img) => {
        const parts = img.image_url.split("/");
        return parts.slice(parts.indexOf("property-images")).join("/");
      }) || [];

    if (filePaths.length > 0) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("property-images")
        .remove(filePaths);

      if (storageError) {
        console.error(
          `Fehler beim Löschen der Bilder aus dem Storage für Property ${propertyId}:`,
          storageError
        );
      }
    }

    // 4. Lösche Einträge aus der property_images Tabelle
    await supabaseAdmin
      .from("property_images")
      .delete()
      .eq("property_id", propertyId);

    // 5. Lösche die Property selbst
    await supabaseAdmin.from("properties").delete().eq("id", propertyId);
  }

  return NextResponse.json({ success: true, deleted: drafts?.length || 0 });
}
