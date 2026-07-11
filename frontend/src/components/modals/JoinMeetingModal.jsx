"use client";

import React, { useState } from "react";
import { X, LogIn, AlertCircle } from "lucide-react";
import { extractMeetingId } from "../../utils/meetingUtils";
import { joinMeeting } from "../../services/api";

/**
 * Zoom-style modal to let users join an existing meeting by public ID or invitation link.
 * Integrates URL extraction, validation, and backend participation registration.
 * 
 * @param {object} props
 * @param {boolean} props.isOpen - True if the modal should render.
 * @param {function} props.onClose - Dismiss callback.
 * @param {object} props.user - Default user object (pre-fills Display Name).
 * @param {function} props.onJoinSuccess - Successful join redirection/state handler.
 * @param {function} props.onShowToast - Callback to display toast notifications.
 */
export default function JoinMeetingModal({ 
  isOpen, 
  onClose, 
  user, 
  onJoinSuccess, 
  onShowToast 
}) {
  const [meetingInput, setMeetingInput] = useState("");
  const [displayName, setDisplayName] = useState(user ? user.name : "");
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    // 1. Validate display name
    const trimmedName = displayName.trim();
    if (!trimmedName) {
      setLocalError("Display name is a required field.");
      return;
    }

    // 2. Extract and normalize meeting ID
    const meetingId = extractMeetingId(meetingInput);
    if (!meetingId) {
      setLocalError("Invalid Meeting ID. Please enter a 10-character ID (e.g., 849-245-7316) or a valid invitation URL.");
      return;
    }

    setSubmitting(true);

    try {
      // 3. Register user in the meeting room (backend participation session)
      const participant = await joinMeeting(meetingId, trimmedName);
      
      onShowToast("Connection registered. Redirecting to room...", "success");
      onClose();
      
      // 4. Bubble successful response up so the parent handles the routing
      if (onJoinSuccess) {
        onJoinSuccess(meetingId, participant);
      }
    } catch (err) {
      console.error("Join meeting error:", err);
      // Display backend errors clearly (e.g. Meeting has ended, Meeting has not started, not found, etc.)
      setLocalError(err.message || "An unexpected error occurred while joining. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      id="join-meeting-modal-overlay"
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-gray-100 overflow-hidden relative"
        id="join-meeting-modal-box"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between" id="join-modal-header">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-[#2D8CFF]" />
            <span>Join a Meeting</span>
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            id="join-modal-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5" id="join-meeting-form">
          {/* Error Banner inside Modal */}
          {localError && (
            <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 font-medium leading-relaxed animate-shake" id="join-error-banner">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{localError}</span>
            </div>
          )}

          {/* Field: Meeting ID or Invite Link */}
          <div className="space-y-1.5" id="field-meeting-id">
            <label htmlFor="meeting-input-box" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Meeting ID or Personal Link Name
            </label>
            <input
              type="text"
              id="meeting-input-box"
              value={meetingInput}
              onChange={(e) => setMeetingInput(e.target.value)}
              placeholder="e.g., 849-245-7316 or https://..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#2D8CFF] focus:bg-white transition-all duration-150"
              required
              disabled={submitting}
              autoComplete="off"
            />
          </div>

          {/* Field: Display Name */}
          <div className="space-y-1.5" id="field-display-name">
            <label htmlFor="display-name-box" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Your Name
            </label>
            <input
              type="text"
              id="display-name-box"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your screen name"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#2D8CFF] focus:bg-white transition-all duration-150"
              required
              disabled={submitting}
              maxLength={50}
            />
          </div>

          {/* Modal Buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-50" id="join-modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors cursor-pointer"
              id="btn-cancel-join"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-[#2D8CFF] hover:bg-[#1A73E8] disabled:bg-[#2D8CFF]/50 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              id="btn-submit-join"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Joining...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Join Meeting</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
