"use client";

import React from "react";
import Link from "next/link";

/**
 * A beautiful, Zoom-style 404 Not Found page for our App Router.
 * Resolves compilation-time Pages Router fallback dependencies.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F7F9FC] text-gray-900 p-6" id="not-found-root">
      <div className="max-w-md w-full bg-white border border-gray-150 rounded-2xl p-8 shadow-xs text-center" id="not-found-card">
        <h2 className="text-3xl font-extrabold text-[#2D8CFF]" id="not-found-title">404</h2>
        <h3 className="text-lg font-bold text-gray-800 mt-2" id="not-found-subtitle">Page Not Found</h3>
        <p className="text-sm text-gray-400 mt-2 leading-relaxed" id="not-found-desc">
          We couldn't find the meeting page or section you were looking for. Please check the URL or return to the main dashboard.
        </p>
        <div className="mt-6" id="not-found-action">
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl bg-[#2D8CFF] hover:bg-[#1A73E8] text-white text-sm font-bold shadow-xs transition-all cursor-pointer"
            id="btn-not-found-home"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
