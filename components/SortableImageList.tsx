"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

type SortableImageListProps = {
  imageUrls: string | string[]; // Accept either raw string or array of URLs
  onDelete: (url: string) => void;
};

export default function SortableImageList({
  imageUrls,
  onDelete,
}: SortableImageListProps) {
  const [parsedUrls, setParsedUrls] = useState<string[]>([]);

  useEffect(() => {
    if (Array.isArray(imageUrls)) {
      setParsedUrls(imageUrls);
    } else if (typeof imageUrls === "string") {
      try {
        const parsed = JSON.parse(imageUrls);
        if (Array.isArray(parsed)) {
          setParsedUrls(parsed);
        } else {
          throw new Error();
        }
      } catch {
        // fallback: comma-separated
        setParsedUrls(imageUrls.split(",").map((s) => s.trim()));
      }
    }
  }, [imageUrls]);

  return (
    <div className="grid grid-cols-2 gap-4">
      {parsedUrls.map((url, index) => (
        <div
          key={index}
          className="relative group border rounded overflow-hidden"
        >
          <Image
            src={url}
            alt="Immobilienbild"
            width={300}
            height={200}
            className="object-cover w-full h-auto"
          />
          <button
            onClick={() => onDelete(url)}
            className="absolute top-1 right-1 bg-white text-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Löschen
          </button>
        </div>
      ))}
    </div>
  );
}
