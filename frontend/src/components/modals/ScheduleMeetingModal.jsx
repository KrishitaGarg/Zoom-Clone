"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, AlertCircle } from "lucide-react";
import { scheduleMeeting } from "../../services/api";

/**
 * Zoom-style modal to schedule a meeting for a future date and time.
 * Automatically validates, converts local inputs to an ISO UTC timestamp, and refreshes the parent's inventory.
 * 
 * @param {object} props
 * @param {boolean} props.isOpen - True if modal is visible.
 * @param {function} props.onClose - Form close handler.
 * @param {object} props.user - Default active user (sets host_id).
 * @param {function} props.onScheduleSuccess - Callback to refresh upcoming list with new meeting.
 * @param {function} props.onShowToast - Notification toast handler.
 */
export default function ScheduleMeetingModal({ 
  isOpen, 
  onClose, 
  user, 
  onScheduleSuccess, 
  onShowToast 
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("30"); // Default 30 mins
  
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState("");

  // Initialize input dates with convenient future defaults when opened
  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      
      // Default to today's date formatted as YYYY-MM-DD
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      setDate(`${year}-${month}-${day}`);
      
      // Default to 1 hour in the future, rounded to the nearest hour YYYY-MM-DDTHH:MM
      const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
      const hours = String(nextHour.getHours()).padStart(2, '0');
      setTime(`${hours}:00`);
      
      // Reset form text fields
      setTitle("");
      setDescription("");
      setLocalError("");
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");

    // 1. Verify that the default user has loaded
    if (!user || !user.id) {
      setLocalError("Application user context not loaded. Cannot schedule meeting.");
      return;
    }

    // 2. Validate input requirements
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setLocalError("Meeting title is a required field.");
      return;
    }

    if (!date || !time) {
      setLocalError("Date and start time are required fields.");
      return;
    }

    // 3. Ensure the selected date and time is in the future
    // Construct local Date from inputs
    const localDateTime = new Date(`${date}T${time}`);
    if (isNaN(localDateTime.getTime())) {
      setLocalError("The selected date or time is invalid.");
      return;
    }

    const now = new Date();
    // Allow a small 1-minute clock tolerance, but enforce future
    if (localDateTime.getTime() < now.getTime() - 60000) {
      setLocalError("The selected date and time must be in the future.");
      return;
    }

    setSubmitting(true);

    try {
      // 4. Convert selected local date and time to ISO UTC string
      const scheduledStartUtc = localDateTime.toISOString();

      // 5. Structure payload matching the backend schema
      const payload = {
        title: trimmedTitle,
        description: description.trim() || null,
        host_id: user.id,
        scheduled_start: scheduledStartUtc,
        duration_minutes: Number(duration),
      };

      // 6. Request backend creation
      const newMeeting = await scheduleMeeting(payload);

      // 7. Handle success
      onShowToast("Meeting scheduled successfully!", "success");
      
      if (onScheduleSuccess) {
        onScheduleSuccess(newMeeting);
      }
      
      onClose();
    } catch (err) {
      console.error("Schedule meeting error:", err);
      // Handles standard errors and FastAPI Pydantic detail errors
      setLocalError(err.message || "An unexpected error occurred while scheduling.");
    } finally {
      setSubmitting(false);
    }
  };

  const durationOptions = [
    { value: "15", label: "15 minutes" },
    { value: "30", label: "30 minutes" },
    { value: "45", label: "45 minutes" },
    { value: "60", label: "60 minutes" },
    { value: "90", label: "90 minutes" },
    { value: "120", label: "120 minutes" },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in"
      id="schedule-meeting-modal-overlay"
    >
      <div 
        className="bg-white rounded-3xl w-full max-w-lg shadow-2xl border border-gray-150 overflow-hidden relative"
        id="schedule-meeting-modal-box"
      >
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between" id="schedule-modal-header">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2D8CFF]" />
            <span>Schedule a Meeting</span>
          </h3>
          <button 
            onClick={onClose}
            className="p-1 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
            id="schedule-modal-close-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4" id="schedule-meeting-form">
          {/* Error Banner inside Modal */}
          {localError && (
            <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 font-medium leading-relaxed animate-shake" id="schedule-error-banner">
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
              <span>{localError}</span>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5" id="field-schedule-title">
            <label htmlFor="schedule-title-box" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Topic / Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              id="schedule-title-box"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Weekly Team Sync"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#2D8CFF] focus:bg-white transition-all duration-150"
              required
              disabled={submitting}
              maxLength={150}
              autoComplete="off"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5" id="field-schedule-description">
            <label htmlFor="schedule-desc-box" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Description / Agenda <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              id="schedule-desc-box"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide a brief agenda for your participants"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#2D8CFF] focus:bg-white transition-all duration-150 min-h-20 max-h-32"
              disabled={submitting}
              maxLength={300}
            />
          </div>

          {/* Grid: Date, Time and Duration */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="schedule-datetime-grid">
            {/* Date */}
            <div className="space-y-1.5" id="field-schedule-date">
              <label htmlFor="schedule-date-box" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                id="schedule-date-box"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#2D8CFF] focus:bg-white transition-all duration-150"
                required
                disabled={submitting}
              />
            </div>

            {/* Start Time */}
            <div className="space-y-1.5" id="field-schedule-time">
              <label htmlFor="schedule-time-box" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                Start Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="time"
                id="schedule-time-box"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#2D8CFF] focus:bg-white transition-all duration-150"
                required
                disabled={submitting}
              />
            </div>
          </div>

          {/* Duration Dropdown */}
          <div className="space-y-1.5" id="field-schedule-duration">
            <label htmlFor="schedule-duration-box" className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Duration <span className="text-rose-500">*</span>
            </label>
            <select
              id="schedule-duration-box"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 focus:outline-none focus:border-[#2D8CFF] focus:bg-white transition-all duration-150 cursor-pointer"
              required
              disabled={submitting}
            >
              {durationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Modal Footer / Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-50" id="schedule-modal-actions">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-5 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl border border-gray-200 transition-colors cursor-pointer"
              id="btn-cancel-schedule"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-bold text-white bg-[#2D8CFF] hover:bg-[#1A73E8] disabled:bg-[#2D8CFF]/50 rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              id="btn-submit-schedule"
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Scheduling...</span>
                </>
              ) : (
                <>
                  <Calendar className="w-4 h-4" />
                  <span>Schedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
