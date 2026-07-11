import React from "react";

/**
 * A reusable loading spinner styled with Tailwind CSS animations.
 * Supports customizable sizes and container heights.
 * 
 * @param {object} props
 * @param {string} [props.size="md"] - Size options: 'sm', 'md', 'lg'.
 * @param {boolean} [props.fullPage=false] - If true, centers spinner in a full screen viewport overlay.
 * @param {string} [props.className=""] - Additional custom CSS classes.
 */
export default function LoadingSpinner({ size = "md", fullPage = false, className = "" }) {
  const sizeClasses = {
    sm: "w-5 h-5 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4"
  };

  const selectedSize = sizeClasses[size] || sizeClasses.md;

  const spinner = (
    <div className={`flex flex-col items-center justify-center space-y-2 ${className}`} id="loading-spinner-container">
      <div 
        className={`${selectedSize} rounded-full border-gray-200 border-t-[#2D8CFF] animate-spin`} 
        style={{ borderStyle: "solid" }}
        id="loading-spinner-ring"
      />
      <span className="text-sm font-medium text-gray-500 tracking-wide animate-pulse">
        Loading...
      </span>
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-50/80 backdrop-blur-xs" id="full-page-loading-overlay">
        {spinner}
      </div>
    );
  }

  return spinner;
}
