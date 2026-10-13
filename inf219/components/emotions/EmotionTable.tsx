"use client";

import { useEffect, useState } from "react";
import { loadEmotions } from "@/lib/emotion-data";
import type { EmotionRow } from "@/lib/types";

// First step: load the emotion data and display the names.
export default function EmotionTable() {
  const [emotions, setEmotions] = useState<EmotionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    loadEmotions()
      .then((rows) => {
        if (active) setEmotions(rows);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : String(err));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    // Ignore a request that finishes after leaving the page.
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return <p className="p-4 text-sm text-neutral-600" role="status">Loading emotions...</p>;
  }

  if (error) {
    return <p className="p-4 text-sm text-red-700" role="alert">{error}</p>;
  }

  return (
    <section className="p-4">
      <h1 className="mb-3 text-xl font-semibold">Emotions</h1>
      {emotions.length === 0 ? (
        <p>No emotions found.</p>
      ) : (
        <ul className="list-disc space-y-1 pl-5">
          {emotions.map((emotion) => (
            <li key={emotion.name}>{emotion.name}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
