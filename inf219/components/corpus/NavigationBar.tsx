"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function NavigationBar() {
  const [isInfoOpen, setIsInfoOpen] = useState(false);

  useEffect(() => {
    if (!isInfoOpen) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsInfoOpen(false);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isInfoOpen]);

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-6"
      >
        <Link
          href="/"
          className="text-sm font-semibold tracking-tight text-neutral-900"
        >
          AffectiveVisSTAR
        </Link>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-6 text-sm">
            <Link href="/" className="text-neutral-700 transition hover:text-neutral-950 underline-offset-3 hover:underline">
              Corpus Classification Table
            </Link>
            <Link
              href="/emotions"
              className="text-neutral-700 transition hover:text-neutral-950 underline-offset-3 hover:underline"
            >
              Emotions by Everything
            </Link>
          </div>

          <button
            type="button"
            aria-label="About AffectiveVisSTAR"
            aria-haspopup="dialog"
            className="flex size-8 shrink-0 items-center justify-center rounded-full text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-2 focus-visible:outline-blue-600"
            onClick={() => setIsInfoOpen(true)}
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" className="size-5">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 11v5m0-8h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </nav>

      {isInfoOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setIsInfoOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="info-title"
            className="w-full max-w-md rounded-lg border border-neutral-200 bg-white p-6 text-neutral-800 shadow-xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 id="info-title" className="text-lg font-semibold">Information</h2>
              <button
                type="button"
                aria-label="Close information"
                className="rounded px-2 text-xl leading-none text-neutral-600 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-blue-600"
                onClick={() => setIsInfoOpen(false)}
              >
                ×
              </button>
            </div>
            <p className="text-sm leading-relaxed">
              
            </p>
          </section>
        </div>
      )}
    </>
  );
}