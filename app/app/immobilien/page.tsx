"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useSessionContext } from "@supabase/auth-helpers-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

type Property = {
  id: string;
  title: string;
  street_address: string;
  city: string;
  price: number;
  size_sqm: number;
  year_built: number;
  type: string;
  image_urls: string[];
};

export default function ImmobilienPage() {
  const [search, setSearch] = useState("");
  const [properties, setProperties] = useState<
    (Property & { firstImageUrl?: string })[]
  >([]);
  const [loading, setLoading] = useState(true);

  const { session, isLoading } = useSessionContext();
  const user = session?.user;
  const router = useRouter();

  useEffect(() => {
    console.log("Inside useEffect → isLoading:", isLoading, "user:", user);
    const fetchProperties = async () => {
      if (isLoading) return;

      if (!user) {
        setLoading(false);
        router.replace("/login");
        return;
      }

      const { data: propertyData, error: propError } = await supabase
        .from("properties")
        .select("*");

      console.log("Session user ID:", user?.id);
      console.log("Fetched properties:", propertyData);
      console.log("Fetch error:", propError);

      if (propError) {
        console.error("Fehler beim Laden:", propError?.message);
        setProperties([]);
      } else {
        setProperties(propertyData || []);
      }
      setLoading(false);
    };

    fetchProperties();
  }, [isLoading, user, router]);

  if (isLoading || loading) {
    console.log("Still loading. isLoading:", isLoading, "loading:", loading);
    return <p className="text-muted-foreground">Lade Immobilien…</p>;
  }

  const filtered = properties.filter((property) =>
    `${property.title} ${property.street_address} ${property.city}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Meine Immobilien</h1>
          <p className="text-muted-foreground text-sm">
            Übersicht aller aktiven Objekte unter deiner Betreuung.
          </p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Suche nach Titel oder Adresse"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border px-3 py-2 rounded-md text-sm w-full md:w-64"
          />
          <Link href="/immobilien/hinzufuegen">
            <Button>+ Immobilie hinzufügen</Button>
          </Link>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-muted-foreground">Keine Immobilien gefunden.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((property) => (
            <div
              key={property.id}
              className="border rounded-lg overflow-hidden shadow-sm bg-white dark:bg-zinc-900"
            >
              {property.image_urls?.[0] && (
                <div className="relative w-full h-48">
                  <Image
                    src={property.image_urls[0]}
                    alt={property.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="p-4 space-y-2">
                <h2 className="text-lg font-semibold">{property.title}</h2>
                <p className="text-sm text-muted-foreground">
                  {property.street_address}, {property.city}
                </p>
                <div className="text-sm space-y-1">
                  <p>
                    💶 <strong>Preis:</strong> {property.price} €
                  </p>
                  <p>
                    📐 <strong>Fläche:</strong> {property.size_sqm} m²
                  </p>
                  <p>
                    🏗️ <strong>Baujahr:</strong> {property.year_built}
                  </p>
                  <p>
                    📌 <strong>Status:</strong> {property.type}
                  </p>
                </div>
                <div className="pt-2 flex gap-2">
                  <Link href={`/immobilien/${property.id}`}>
                    <Button size="sm" className="w-full">
                      Details anzeigen
                    </Button>
                  </Link>
                  <Link href={`/immobilien/${property.id}/bearbeiten`}>
                    <Button size="sm" variant="outline" className="w-full">
                      Bearbeiten
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
