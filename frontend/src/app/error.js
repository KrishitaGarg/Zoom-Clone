"use client";

import React, { useEffect } from "react";

/**
 * A beautiful, Zoom-style global Error page for our App Router.
 * Acts as the default error boundary for unexpected client-side runtime crashes.
 */
export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("Next.js App Router boundary caught error:", error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9FC] text-gray-900 p-6" id="error-root">
      <div className="max-w-md w-full bg-white border border-gray-150 rounded-2xl p-8 shadow-xs text-center" id="error-card">
        <h2 className="text-3xl font-extrabold text-rose-600" id="error-title">System Error</h2>
        <h3 className="text-lg font-bold text-gray-800 mt-2" id="error-subtitle">Something went wrong!</h3>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed" id="error-desc">
          {error?.message || "An unexpected error occurred. Please refresh or try again."}
        </p>
        <div className="mt-6 flex justify-center gap-3" id="error-actions">
          <button
            onClick={() => reset()}
            className="px-5 py-2.5 rounded-xl bg-[#2D8CFF] hover:bg-[#1A73E8] text-white text-sm font-bold shadow-xs transition-all cursor-pointer"
            id="btn-error-reset"
          >
            Try Again
          </button>
          <a
            href="/"
            className="px-5 py-2.5 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-600 text-sm font-bold transition-all"
            id="btn-error-home"
          >
            Return Home
          </a>
        </div>
      </div>
    </div>
  );
}
