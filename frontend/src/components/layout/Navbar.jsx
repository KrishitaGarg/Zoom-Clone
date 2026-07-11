"use client";

import React from "react";
import { Search, Bell, HelpCircle, X } from "lucide-react";

/**
 * Zoom-inspired top navigation bar.
 *
 * @param {object} props
 * @param {object} [props.user] - Loaded user profile.
 * @param {string} [props.searchQuery] - Current meeting-search value.
 * @param {Function} [props.onSearchChange] - Updates the meeting-search value.
 */
export default function Navbar({
  user,
  searchQuery = "",
  onSearchChange,
}) {
  // Format the current date for display in the navigation bar.
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date());

  // Generate avatar initials from the user's display name.
  const getInitials = (name) => {
    if (!name) return "?";

    const parts = name.trim().split(/\s+/);

    if (parts.length > 1) {
      return (
        parts[0][0] + parts[parts.length - 1][0]
      ).toUpperCase();
    }

    return parts[0][0].toUpperCase();
  };

  const name = user?.name || "Krishita";
  const email = user?.email || "krishita@example.com";
  const initials = getInitials(name);

  return (
    <header
      className="bg-white border-b border-gray-200 h-16 px-4 md:px-8 flex items-center justify-between fixed top-0 right-0 sm:left-20 md:left-64 left-0 z-30 shadow-sm transition-all duration-300"
      id="app-navbar"
    >
      {/* Search locally filters meetings already loaded from FastAPI. */}
      <div
        className="flex-1 max-w-md hidden md:block"
        id="navbar-search-container"
      >
        <div className="relative">
          <Search
            className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />

          <input
            type="search"
            value={searchQuery}
            onChange={(event) =>
              onSearchChange?.(event.target.value)
            }
            placeholder="Search meetings by title or ID..."
            aria-label="Search meetings by title or meeting ID"
            className="w-full pl-10 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D8CFF]/20 focus:border-[#2D8CFF] focus:bg-white transition-all duration-150"
            id="navbar-search-input"
          />

          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange?.("")}
              aria-label="Clear meeting search"
              title="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Date, utility placeholders, and user profile. */}
      <div
        className="flex items-center gap-4 md:gap-6 ml-auto"
        id="navbar-actions-container"
      >
        <span
          className="text-xs font-semibold text-gray-400 font-sans tracking-wide uppercase hidden sm:inline-block"
          id="navbar-date-display"
        >
          {formattedDate}
        </span>

        <span
          className="h-4 w-px bg-gray-200 hidden sm:inline-block"
          aria-hidden="true"
        />

        {/* These remain placeholders because they are outside MVP scope. */}
        <div
          className="flex items-center gap-2"
          id="navbar-utility-buttons"
        >
          <button
            type="button"
            className="p-2 rounded-xl text-gray-400 cursor-not-allowed"
            title="Help Center — coming soon"
            aria-label="Help Center — coming soon"
            disabled
          >
            <HelpCircle className="w-5 h-5 stroke-[1.5]" />
          </button>

          <button
            type="button"
            className="p-2 rounded-xl text-gray-400 cursor-not-allowed"
            title="Notifications — coming soon"
            aria-label="Notifications — coming soon"
            disabled
          >
            <Bell className="w-5 h-5 stroke-[1.5]" />
          </button>
        </div>

        <div
          className="flex items-center gap-3 pl-1 border-l border-gray-100 sm:border-l-0"
          id="navbar-user-identity"
        >
          <div
            className="flex-col text-right hidden sm:flex"
            id="navbar-user-details"
          >
            <span className="text-sm font-semibold text-gray-800 leading-tight">
              {name}
            </span>

            <span className="text-[10px] text-gray-400 font-medium">
              {email}
            </span>
          </div>

          <div
            className="w-9 h-9 rounded-full bg-[#E8F2FF] text-[#2D8CFF] border border-[#C2DFFF] flex items-center justify-center text-sm font-bold shadow-sm select-none transition-transform hover:scale-105"
            id="navbar-user-avatar"
            title={`${name} (${email})`}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}