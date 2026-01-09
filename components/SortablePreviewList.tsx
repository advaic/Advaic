"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { arrayMoveImmutable } from "array-move";

type SortablePreviewListProps = {
  files: (File | string)[];
  setFiles?: (files: (File | string)[]) => void;
};

export default function SortablePreviewList({
  files,
  setFiles,
}: SortablePreviewListProps) {
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    if (!files || files.length === 0) {
      setPreviews([]);
      return;
    }

    const newPreviews = files.map((file) => {
      if (typeof file === "string") return file;
      return URL.createObjectURL(file);
    });

    setPreviews(newPreviews);

    return () => {
      newPreviews.forEach((url, i) => {
        if (typeof files[i] !== "string") {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [files]);

  const onDrop = (acceptedFiles: File[]) => {
    if (setFiles) {
      setFiles([...(files || []), ...acceptedFiles]);
    }
  };

  const onDelete = (index: number) => {
    const updatedFiles = files.filter((_, i) => i !== index);
    if (setFiles) {
      setFiles(updatedFiles);
    }
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData("drag-index", index.toString());
  };

  const onDropSort = (
    e: React.DragEvent<HTMLDivElement>,
    dropIndex: number
  ) => {
    const dragIndex = Number(e.dataTransfer.getData("drag-index"));
    if (dragIndex === dropIndex) return;

    const reordered = arrayMoveImmutable(files, dragIndex, dropIndex);
    if (setFiles) {
      setFiles(reordered);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className="border border-dashed border-gray-400 p-4 rounded cursor-pointer text-center"
      >
        <input {...getInputProps()} />
        <p>Ziehe Bilder hierher oder klicke zum Hochladen</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {previews.map((preview, index) => (
          <div
            key={index}
            className="relative group border rounded overflow-hidden"
            draggable
            onDragStart={(e) => onDragStart(e, index)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => onDropSort(e, index)}
          >
            <Image
              src={preview}
              alt={`Vorschau ${index + 1}`}
              width={300}
              height={200}
              className="object-cover w-full h-auto"
            />
            <button
              onClick={() => onDelete(index)}
              className="absolute top-1 right-1 bg-white text-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity"
            >
              Löschen
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
