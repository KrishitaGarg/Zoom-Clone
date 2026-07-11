"use client";

import React, { useState } from "react";
import { Calendar, Clock, Clipboard, Copy, Check, Video, ArrowRight } from "lucide-react";
import { parseBackendUtc, formatLocalDate, formatLocalTime } from "../../utils/dateUtils";
import { copyMeetingInvitation } from "../../utils/meetingUtils";

/**
 * A beautiful, Zoom-style container rendering meeting meta-data, durations, copy-triggers, and direct action.
 * 
 * @param {object} props
 * @param {object} props.meeting - The meeting model object.
 * @param {boolean} [props.isUpcoming=true] - True if this represents a future scheduled item.
 * @param {function} [props.onJoin] - Handler callback when the Join button is triggered.
 * @param {function} [props.onShowToast] - Handler callback to display a parent-level success/error toast.
 */
export default function MeetingCard({ meeting, isUpcoming = true, onJoin, onShowToast }) {
  const [copied, setCopied] = useState(false);

  if (!meeting) return null;

  const {
    title,
    description,
    public_meeting_id,
    duration_minutes,
    status,
    scheduled_start,
    meeting_type
  } = meeting;

  // Convert backend UTC string to browser-local Date object
  const startDateObj = parseBackendUtc(scheduled_start || meeting.created_at);
  const formattedDate = formatLocalDate(startDateObj);
  const formattedTime = formatLocalTime(startDateObj);

  // Handle Clipboard Copy
  const handleCopy = async (e) => {
    e.stopPropagation();
    const success = await copyMeetingInvitation(meeting);
    if (success) {
      setCopied(true);
      if (onShowToast) {
        onShowToast("Meeting invitation details copied to clipboard!", "success");
      }
      setTimeout(() => setCopied(false), 2000);
    } else {
      if (onShowToast) {
        onShowToast("Failed to copy invitation details.", "error");
      }
    }
  };

  // Status Badge colors
  const statusBadges = {
    scheduled: "bg-blue-50 text-blue-700 border-blue-150",
    live: "bg-red-50 text-red-600 border-red-150 animate-pulse",
    ended: "bg-gray-100 text-gray-600 border-gray-200",
    cancelled: "bg-rose-50 text-rose-500 border-rose-150"
  };

  const badgeClass = statusBadges[status] || statusBadges.scheduled;

  return (
    <div 
      className="bg-white border border-gray-150 rounded-2xl p-5 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
      id={`meeting-card-${public_meeting_id}`}
    >
      <div id="meeting-card-header">
        {/* Top: Badges and Meeting ID */}
        <div className="flex items-center justify-between gap-2 mb-3" id="meeting-card-meta">
          <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeClass}`} id="meeting-status-badge">
            {status === "live" ? "● Live Now" : status}
          </span>
          <span className="text-xs font-mono font-semibold text-gray-400 bg-gray-50 px-2.5 py-1 rounded-lg border border-gray-100" id="meeting-id-badge">
            ID: {public_meeting_id}
          </span>
        </div>

        {/* Title & Description */}
        <h4 className="text-base font-bold text-gray-800 line-clamp-1 group-hover:text-[#2D8CFF]" id="meeting-card-title">
          {title}
        </h4>
        {description ? (
          <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed" id="meeting-card-description">
            {description}
          </p>
        ) : (
          <p className="text-xs text-gray-300 italic mt-1" id="meeting-card-no-description">
            No description provided
          </p>
        )}
      </div>

      {/* Date, Time and Duration */}
      <div className="mt-5 space-y-2 border-t border-b border-gray-50 py-3 text-xs text-gray-500" id="meeting-card-details">
        <div className="flex items-center gap-2" id="detail-date">
          <Calendar className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-medium text-gray-600">{formattedDate || "Instant Session"}</span>
        </div>
        <div className="flex items-center gap-2" id="detail-time">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span className="font-medium text-gray-600">
            {meeting_type === "instant" ? "Started instantly" : `${formattedTime} (${duration_minutes} min duration)`}
          </span>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-3 mt-4 pt-1" id="meeting-card-actions">
        {/* Left: Copy details button */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors cursor-pointer"
          id="btn-copy-invitation"
          title="Copy Invitation details"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-emerald-600">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Invite</span>
            </>
          )}
        </button>

        {/* Right: Join Button (If active/upcoming) */}
        {isUpcoming && (status === "scheduled" || status === "live") ? (
          <button
            onClick={() => onJoin(meeting)}
            className={`
              flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer
              ${status === "live"
                ? "bg-red-600 hover:bg-red-700 text-white shadow-red-100"
                : "bg-[#2D8CFF] hover:bg-[#1A73E8] text-white shadow-blue-100"
              }
            `}
            id="btn-join-meeting-card"
          >
            <Video className="w-3.5 h-3.5 fill-white" />
            <span>Join Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <span className="text-[11px] font-semibold text-gray-400 italic pr-1 select-none" id="status-unjoinable">
            Session Closed
          </span>
        )}
      </div>
    </div>
  );
}
