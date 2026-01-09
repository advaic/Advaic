"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";

interface SortableImageProps {
  url: string;
  onDelete: (url: string) => void;
}

export function SortableImage({ url, onDelete }: SortableImageProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: url });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="relative w-24 h-24 rounded overflow-hidden"
      {...attributes}
      {...listeners}
    >
      <Image src={url} alt="Vorschau" fill className="object-cover" />
      <button
        type="button"
        onClick={() => onDelete(url)}
        className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded px-1"
      >
        X
      </button>
    </div>
  );
}
