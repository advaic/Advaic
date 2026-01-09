"use client";

interface Props {
  screenshots: File[];
  setScreenshots: (files: File[]) => void;
}

export const ScreenshotUploadDropzone = ({
  screenshots,
  setScreenshots,
}: Props) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setScreenshots([...screenshots, ...Array.from(files)]);
    }
  };

  return (
    <input
      type="file"
      accept="image/*"
      multiple
      onChange={handleFileChange}
      className="mt-2 border border-gray-300 p-2 rounded-md w-full"
    />
  );
};
