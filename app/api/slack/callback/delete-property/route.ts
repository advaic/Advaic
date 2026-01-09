import { NextRequest, NextResponse } from "next/server";
import supabaseAdmin from "@/lib/supabaseAdmin"; // Pfad ggf. anpassen

export async function POST(request: NextRequest) {
  try {
    const { propertyId } = await request.json();

    if (!propertyId) {
      return NextResponse.json(
        { error: "Missing propertyId" },
        { status: 400 }
      );
    }

    // First, fetch image records to get file paths for deletion from storage
    const { data: imageRecords, error: fetchError } = await supabaseAdmin
      .from("property_images")
      .select("image_url")
      .eq("property_id", propertyId);

    if (fetchError) {
      return NextResponse.json(
        { error: "Failed to fetch image records: " + fetchError.message },
        { status: 500 }
      );
    }

    const filePaths = imageRecords
      ?.map((record: { image_url: string }) => {
        const match = record.image_url.match(/property-images\/(.+)$/);
        return match ? match[1] : null;
      })
      .filter(Boolean);

    if (filePaths.length > 0) {
      const { error: storageDeleteError } = await supabaseAdmin.storage
        .from("property-images")
        .remove(filePaths);

      if (storageDeleteError) {
        return NextResponse.json(
          { error: "Failed to delete files from storage: " + storageDeleteError.message },
          { status: 500 }
        );
      }
    }

    // Then, delete all related image records
    const { error: imageDeleteError } = await supabaseAdmin
      .from("property_images")
      .delete()
      .eq("property_id", propertyId);

    if (imageDeleteError) {
      return NextResponse.json(
        { error: "Failed to delete related images: " + imageDeleteError.message },
        { status: 500 }
      );
    }

    // Then, delete the property itself
    const { error: propertyDeleteError } = await supabaseAdmin
      .from("properties")
      .delete()
      .eq("id", propertyId);

    if (propertyDeleteError) {
      return NextResponse.json(
        { error: "Failed to delete property: " + propertyDeleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
