"use client";

import { useRef, useState } from "react";
import { uploadReviewsCsv } from "@/lib/api";
import { useRouter } from "next/navigation";

type CsvUploadButtonProps = {
  organizationId: number;
};

export function CsvUploadButton({ organizationId }: CsvUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const router = useRouter();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      await uploadReviewsCsv(organizationId, formData);
      router.refresh(); // Refresh the page to show new reviews
    } catch (error) {
      alert("Failed to upload CSV: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset input
      }
    }
  };

  return (
    <>
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="bg-ink hover:bg-ink/90 text-white px-4 py-2 rounded-md font-medium text-sm transition shadow-sm disabled:opacity-70 flex items-center gap-2"
      >
        {isUploading ? (
          <>
            <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Upload CSV
          </>
        )}
      </button>
    </>
  );
}
