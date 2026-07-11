"use client";

import React, { useState } from "react";
import { Video, ArrowLeft, ArrowRight, Keyboard } from "lucide-react";

/**
 * PreJoinScreen component allowing a user joining via a direct URL
 * to specify their display name before entering the meeting.
 *
 * @param {object} props
 * @param {object} props.meeting - Meeting meta-data object.
 * @param {function} props.onJoin - Callback triggered with the validated display name.
 * @param {function} props.onBack - Callback to return to dashboard.
 * @param {boolean} props.isJoining - Indicates if the join API call is in flight.
 */
export default function PreJoinScreen({ meeting, onJoin, onBack, isJoining }) {
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError("Please enter a display name to join the meeting.");
      return;
    }
    if (trimmed.length > 50) {
      setError("Display name must be 50 characters or less.");
      return;
    }
    setError("");
    onJoin(trimmed);
  };

  if (!meeting) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A] text-white p-6" id="prejoin-screen-root">
      <div className="max-w-md w-full bg-[#242424] border border-[#333] rounded-2xl p-8 shadow-2xl space-y-6" id="prejoin-card">
        
        {/* Decorative Header Icon */}
        <div className="flex justify-center" id="prejoin-icon-wrapper">
          <div className="p-4 bg-[#2D8CFF]/10 rounded-full border border-[#2D8CFF]/20" id="prejoin-avatar">
            <Video className="w-8 h-8 text-[#2D8CFF]" />
          </div>
        </div>

        {/* Meeting details */}
        <div className="text-center space-y-2" id="prejoin-details">
          <h2 className="text-2xl font-extrabold text-gray-100 tracking-tight" id="prejoin-title">
            {meeting.title || "Zoom Video Meeting"}
          </h2>
          <div className="flex items-center justify-center gap-2" id="prejoin-meta">
            <span className="text-xs font-semibold px-2.5 py-1 bg-[#2D8CFF]/20 text-[#2D8CFF] rounded-full uppercase tracking-wider" id="prejoin-badge">
              {meeting.meeting_type === "instant" ? "Instant Session" : "Scheduled Session"}
            </span>
            <span className="text-xs font-mono text-gray-400 bg-black/30 px-2.5 py-1 rounded-md border border-white/5" id="prejoin-meeting-id">
              ID: {meeting.public_meeting_id}
            </span>
          </div>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="space-y-4" id="prejoin-form">
          <div className="space-y-2" id="input-group-display-name">
            <label 
              htmlFor="display-name-input" 
              className="text-xs font-bold text-gray-400 uppercase tracking-wider block"
            >
              Your Display Name
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500">
                <Keyboard className="w-4 h-4" />
              </span>
              <input
                id="display-name-input"
                type="text"
                placeholder="e.g. Alice Smith"
                value={displayName}
                onChange={(e) => {
                  setDisplayName(e.target.value);
                  if (error) setError("");
                }}
                disabled={isJoining}
                className="w-full bg-[#1A1A1A] border border-[#3A3A3A] focus:border-[#2D8CFF] rounded-xl pl-10 pr-4 py-3 text-sm text-gray-100 placeholder-gray-600 font-medium outline-none transition-colors"
                autoFocus
                maxLength={50}
              />
            </div>
            {error && (
              <p className="text-xs font-semibold text-rose-500 mt-1.5 flex items-center gap-1" id="prejoin-error-msg">
                <span>⚠️</span> {error}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="pt-2 space-y-3" id="prejoin-actions">
            <button
              type="submit"
              disabled={isJoining}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#2D8CFF] hover:bg-[#1A73E8] disabled:bg-gray-700 text-white font-bold text-sm shadow-lg shadow-blue-500/10 transition-colors cursor-pointer"
              id="btn-prejoin-submit"
            >
              <span>{isJoining ? "Joining Session..." : "Join Meeting"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onBack}
              disabled={isJoining}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-transparent hover:bg-white/5 border border-white/10 hover:border-white/20 text-gray-400 hover:text-white font-bold text-sm transition-colors cursor-pointer"
              id="btn-prejoin-back"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Dashboard</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
