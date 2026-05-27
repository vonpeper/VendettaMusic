'use client';

import { useState } from "react";
import { uploadMedia } from "@/actions/media";

export default function UploadTest() {
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    // Provide a section name that makes sense for the test, e.g., "test_upload"
    formData.set("section", "test_upload");
    const result = await uploadMedia(formData);
    if (result?.success) {
      setUploadedUrl(result?.url ?? null);
      setError(null);
    } else {
      setError(result?.error || "Error desconocido");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">Subir foto de prueba (Frontend)</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Archivo (PNG / JPG)</span>
          <input
            type="file"
            name="file"
            accept="image/png, image/jpeg"
            required
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/80"
          />
        </label>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition"
        >
          Subir
        </button>
      </form>
      {uploadedUrl && (
        <div className="mt-4 text-center">
          <p className="font-medium">URL subido:</p>
          <a href={uploadedUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
            {uploadedUrl}
          </a>
          <div className="mt-2">
            <img src={uploadedUrl} alt="uploaded" className="max-w-xs mx-auto rounded shadow" />
          </div>
        </div>
      )}
      {error && <p className="mt-4 text-red-600">Error: {error}</p>}
    </div>
  );
}
