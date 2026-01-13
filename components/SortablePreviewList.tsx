"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { arrayMoveImmutable } from "array-move";
import { CloudUpload, GripVertical, Loader2, Trash2 } from "lucide-react";

type SortablePreviewListProps = {
  /**
   * Items can be:
   * - File (new uploads)
   * - string (PRIVATE storage path like "<propertyId>/...jpg")
   */
  files: (File | string)[];
  setFiles?: (files: (File | string)[]) => void;

  /**
   * Optional: override how string paths are resolved to viewable URLs.
   * If not provided, the component calls `/api/storage/signed-url`.
   */
  resolveUrl?: (path: string) => Promise<string>;

  /**
   * Optional: bucket name (used only by default resolver).
   * If omitted, server should use its own default.
   */
  bucket?: string;

  /**
   * Optional: called when a string-path image is deleted.
   * Use this to remove the object from private storage via your API.
   */
  onDeletePath?: (path: string) => Promise<void>;

  /**
   * Optional: if true, the component will optimistically remove the item from UI before deleting.
   * Default: false (delete first, then remove from UI).
   */
  optimisticDelete?: boolean;

  /**
   * Optional UI labels
   */
  label?: string;
  helperText?: string;
};

function defaultResolver(bucket: string | undefined) {
  return async (path: string) => {
    const qs = new URLSearchParams();
    qs.set("path", path);
    if (bucket) qs.set("bucket", bucket);

    const res = await fetch(`/api/storage/signed-url?${qs.toString()}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(data?.error || "Konnte Bild-URL nicht laden.");
    }

    // expected: { url: "https://..." }
    if (!data?.url) throw new Error("Signed URL fehlt.");
    return String(data.url);
  };
}

export default function SortablePreviewList({
  files,
  setFiles,
  resolveUrl,
  bucket,
  onDeletePath,
  optimisticDelete = false,
  label = "Ziehe Bilder hierher oder klicke zum Hochladen",
  helperText = "Reihenfolge per Drag & Drop ändern. Einzelne Bilder kannst du löschen.",
}: SortablePreviewListProps) {
  // For File objects, we use Object URLs and clean them up.
  const objectUrlRef = useRef<Map<File, string>>(new Map());

  // For string paths, we resolve them to signed URLs (cached).
  const [signedUrlMap, setSignedUrlMap] = useState<Record<string, string>>({});
  const [loadingPaths, setLoadingPaths] = useState<Record<string, boolean>>({});
  const [deletingMap, setDeletingMap] = useState<Record<string, boolean>>({});

  const resolver = useMemo(
    () => resolveUrl ?? defaultResolver(bucket),
    [resolveUrl, bucket]
  );

  // Build preview URLs array aligned with `files`.
  const [previews, setPreviews] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (!files || files.length === 0) {
        setPreviews([]);
        return;
      }

      // 1) Build previews for File objects synchronously
      const next: string[] = files.map((item) => {
        if (typeof item === "string") return ""; // resolved later

        const existing = objectUrlRef.current.get(item);
        if (existing) return existing;

        const url = URL.createObjectURL(item);
        objectUrlRef.current.set(item, url);
        return url;
      });

      if (!cancelled) setPreviews(next);

      // 2) Resolve string paths (private) to signed URLs
      const paths = files.filter((x): x is string => typeof x === "string");
      const uniquePaths = Array.from(new Set(paths));

      // Resolve only missing paths
      const missing = uniquePaths.filter((p) => !signedUrlMap[p]);
      if (missing.length === 0) {
        // fill now
        if (!cancelled) {
          setPreviews((prev) =>
            prev.map((v, i) => {
              const item = files[i];
              if (typeof item === "string") return signedUrlMap[item] || "";
              return v;
            })
          );
        }
        return;
      }

      // mark loading
      if (!cancelled) {
        setLoadingPaths((p) => {
          const copy = { ...p };
          for (const m of missing) copy[m] = true;
          return copy;
        });
      }

      const resolved: Record<string, string> = {};
      try {
        for (const p of missing) {
          try {
            const url = await resolver(p);
            resolved[p] = url;
          } catch {
            // leave empty; UI will show placeholder
            resolved[p] = "";
          }
        }
      } finally {
        if (!cancelled) {
          setSignedUrlMap((prev) => ({ ...prev, ...resolved }));
          setLoadingPaths((prev) => {
            const copy = { ...prev };
            for (const m of missing) delete copy[m];
            return copy;
          });

          // apply resolved urls into previews
          setPreviews((prev) =>
            prev.map((v, i) => {
              const item = files[i];
              if (typeof item === "string") {
                return (resolved[item] ?? signedUrlMap[item] ?? "") || "";
              }
              return v;
            })
          );
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
    // signedUrlMap intentionally included so already-resolved paths update previews
  }, [files, resolver, signedUrlMap]);

  // Cleanup object URLs for removed File objects
  useEffect(() => {
    const fileSet = new Set(files.filter((x): x is File => x instanceof File));

    for (const [file, url] of objectUrlRef.current.entries()) {
      if (!fileSet.has(file)) {
        URL.revokeObjectURL(url);
        objectUrlRef.current.delete(file);
      }
    }

    return () => {
      // On unmount, revoke all
      for (const url of objectUrlRef.current.values()) {
        URL.revokeObjectURL(url);
      }
      objectUrlRef.current.clear();
    };
  }, [files]);

  const onDrop = (acceptedFiles: File[]) => {
    if (!setFiles) return;
    setFiles([...(files || []), ...acceptedFiles]);
  };

  const onDelete = async (index: number) => {
    if (!setFiles) return;

    const item = files[index];

    // Fast path: local File object
    if (item instanceof File) {
      const updatedFiles = files.filter((_, i) => i !== index);
      setFiles(updatedFiles);
      return;
    }

    // String path (private storage path)
    const path = String(item);

    const removeFromUI = () => {
      const updatedFiles = files.filter((_, i) => i !== index);
      setFiles(updatedFiles);
      // Purge caches for this path
      setSignedUrlMap((prev) => {
        const copy = { ...prev };
        delete copy[path];
        return copy;
      });
      setLoadingPaths((prev) => {
        const copy = { ...prev };
        delete copy[path];
        return copy;
      });
      setDeletingMap((prev) => {
        const copy = { ...prev };
        delete copy[path];
        return copy;
      });
    };

    // If no delete handler provided, behave like before (UI-only)
    if (!onDeletePath) {
      removeFromUI();
      return;
    }

    // Non-optimistic by default (safer)
    let reverted = false;

    const original = [...files];

    if (optimisticDelete) {
      removeFromUI();
    }

    try {
      setDeletingMap((prev) => ({ ...prev, [path]: true }));
      await onDeletePath(path);

      if (!optimisticDelete) {
        removeFromUI();
      }
    } catch (err) {
      console.error("❌ Delete failed:", err);
      // revert if optimistic
      if (optimisticDelete) {
        reverted = true;
        setFiles(original);
      }
    } finally {
      // If we reverted, ensure deleting flag cleared
      setDeletingMap((prev) => {
        const copy = { ...prev };
        delete copy[path];
        return copy;
      });

      // If we optimistically removed, and did not revert, caches were already purged.
      // If we reverted, we keep caches as-is; they will re-resolve if needed.
      void reverted;
    }
  };

  const onDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.dataTransfer.setData("drag-index", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const onDropSort = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (!setFiles) return;

    const dragIndex = Number(e.dataTransfer.getData("drag-index"));
    if (Number.isNaN(dragIndex) || dragIndex === dropIndex) return;

    const reordered = arrayMoveImmutable(files, dragIndex, dropIndex);
    setFiles(reordered);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: true,
  });

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`rounded-2xl border border-dashed px-4 py-4 cursor-pointer text-center transition-colors ${
          isDragActive
            ? "border-amber-300 bg-amber-50"
            : "border-gray-200 bg-[#fbfbfc] hover:bg-gray-50"
        }`}
      >
        <input {...getInputProps()} />
        <div className="inline-flex items-center gap-2 text-sm text-gray-700 font-medium">
          <CloudUpload className="h-4 w-4 text-gray-500" />
          {label}
        </div>
        <div className="mt-1 text-xs text-gray-500">{helperText}</div>
      </div>

      {(!files || files.length === 0) && (
        <div className="text-xs text-gray-500">Noch keine Bilder ausgewählt.</div>
      )}

      <div className="grid grid-cols-2 gap-3">
        {previews.map((preview, index) => {
          const item = files[index];
          const isPath = typeof item === "string";
          const isLoading = isPath && !!loadingPaths[item];
          const isDeleting = isPath && !!deletingMap[item];
          const hasUrl = !!preview;

          return (
            <div
              key={`${isPath ? item : (item as File).name}-${index}`}
              className="relative group rounded-xl border border-gray-200 bg-white overflow-hidden"
              draggable={!!setFiles}
              onDragStart={(e) => onDragStart(e, index)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => onDropSort(e, index)}
              title={setFiles ? "Ziehen zum Sortieren" : undefined}
            >
              {/* Drag handle */}
              {setFiles && (
                <div className="absolute left-2 top-2 z-10 rounded-lg bg-white/90 border border-gray-200 px-1.5 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="h-4 w-4 text-gray-500" />
                </div>
              )}

              {/* Delete */}
              {setFiles && (
                <button
                  type="button"
                  onClick={() => onDelete(index)}
                  disabled={isDeleting}
                  className="absolute right-2 top-2 z-10 rounded-lg bg-white/90 border border-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-60"
                  title="Bild löschen"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </button>
              )}

              <div className="aspect-[4/3] w-full bg-[#fbfbfc] flex items-center justify-center">
                {isLoading ? (
                  <div className="text-xs text-gray-500 inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Lade…
                  </div>
                ) : hasUrl ? (
                  <Image
                    src={preview}
                    alt={`Vorschau ${index + 1}`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 240px"
                  />
                ) : (
                  <div className="text-xs text-gray-500">Kein Preview</div>
                )}
              </div>

              {/* Footer */}
              <div className="px-3 py-2 border-t border-gray-200">
                <div className="text-[11px] text-gray-600 truncate">
                  {isPath ? item : (item as File).name}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
