"use client";

import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import Image from "next/image";
import { useState, useEffect } from "react";
import clsx from "clsx";

interface Property {
  id: string;
  city: string;
  neighbourhood: string;
  street_address: string;
  type: string;
  price: number;
  price_type: string;
  rooms: number;
  size_sqm: number;
  floor: number;
  year_built: number;
  furnished: boolean;
  pets_allowed: string;
  heating: string;
  energy_label: string;
  available_from: string;
  elevator: boolean;
  parking: string;
  title: string;
  description: string;
  url: string;
  created_at: string;
}

export default function PropertyDetailClient({
  property,
  image_urls,
}: {
  property: Property;
  image_urls: string[];
}) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [sliderRef, instanceRef] = useKeenSlider<HTMLDivElement>({
    loop: true,
    slides: { perView: 1 },
    slideChanged(slider) {
      setCurrentSlide(slider.track.details.rel);
    },
  });

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeImage, setActiveImage] = useState(0);

  const openLightbox = (index: number) => {
    setActiveImage(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  return (
    <div className="p-6">
      {/* IMAGE SLIDER */}
      {image_urls.length > 0 ? (
        <>
          <div className="relative">
            <div
              ref={sliderRef}
              className="keen-slider h-[350px] sm:h-[450px] md:h-[500px] lg:h-[550px] xl:h-[600px] rounded-md overflow-hidden mb-6"
            >
              {Array.isArray(image_urls) &&
                image_urls.map((url, idx) => {
                  const fullImageUrl = url.startsWith("http")
                    ? url
                    : `https://igavhuyqnninqnluevnvn.supabase.co/storage/v1/object/public/${url}`;
                  return (
                    <div key={idx} className="keen-slider__slide flex items-center justify-center">
                      <Image
                        src={fullImageUrl}
                        alt={`Property image ${idx + 1}`}
                        width={800}
                        height={600}
                        className="object-cover h-full w-full"
                      />
                    </div>
                  );
                })}
            </div>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-2">
              {image_urls.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => instanceRef.current?.moveToIdx(idx)}
                  className={clsx(
                    "w-3 h-3 rounded-full",
                    currentSlide === idx ? "bg-gray-800" : "bg-gray-300"
                  )}
                ></button>
              ))}
            </div>
          </div>

          {/* LIGHTBOX OVERLAY */}
          {lightboxOpen && (
            <div
              className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center"
              onClick={closeLightbox}
            >
              <div className="relative w-[90%] h-[80%] max-w-5xl">
                <Image
                  src={
                    image_urls[activeImage].startsWith("http")
                      ? image_urls[activeImage]
                      : `https://igavhuyqnninqnluenvnn.supabase.co/storage/v1/object/public/${image_urls[activeImage]}`
                  }
                  alt="Großansicht"
                  fill
                  style={{ objectFit: "contain" }}
                />
                <button
                  className="absolute top-4 right-4 text-white text-2xl"
                  onClick={closeLightbox}
                >
                  ✕
                </button>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="w-full h-96 bg-gray-100 flex items-center justify-center rounded-md mb-6">
          <span className="text-gray-500 text-sm">Kein Bild verfügbar</span>
        </div>
      )}

      {/* TEXT DETAILS */}
      <h1 className="text-2xl font-semibold mb-2">
        {property.title}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700 mb-6">
        <div>
          📍 <strong>Adresse:</strong> {property.street_address},{" "}
          {property.city}
        </div>
        <div>
          🏗️ <strong>Baujahr:</strong> {property.year_built}
        </div>
        <div>
          💶 <strong>Preis:</strong> {property.price} €
        </div>
        <div>
          📌 <strong>Status:</strong> {property.type}
        </div>
        <div>
          📐 <strong>Fläche:</strong> {property.size_sqm} m²
        </div>
        <div>
          🛏️ <strong>Zimmer:</strong> {property.rooms}
        </div>
        <div>
          🏢 <strong>Etage:</strong> {property.floor}
        </div>
        <div>
          🪟 <strong>Heizung:</strong> {property.heating}
        </div>
        <div>
          🚗 <strong>Parken:</strong> {property.parking}
        </div>
        <div>
          🏷️ <strong>Energieklasse:</strong> {property.energy_label}
        </div>
        <div>
          🐾 <strong>Haustiere erlaubt:</strong> {property.pets_allowed}
        </div>
        <div>
          🛋️ <strong>Möbliert:</strong> {property.furnished ? "Ja" : "Nein"}
        </div>
        <div>
          🛗 <strong>Aufzug:</strong> {property.elevator ? "Ja" : "Nein"}
        </div>
        <div>
          📅 <strong>Verfügbar ab:</strong> {property.available_from}
        </div>
        <div>
          🔗 <strong>Exposé:</strong>{" "}
          <a
            href={property.url}
            target="_blank"
            className="text-blue-600 underline"
          >
            Ansehen
          </a>
        </div>
      </div>

      <div className="prose max-w-full">
        <h2>Beschreibung</h2>
        <p>{property.description}</p>
      </div>

      <div className="text-xs text-gray-400 mt-8">
        Letzte Aktualisierung: {new Date(property.created_at).toLocaleString()}
      </div>
    </div>
  );
}
