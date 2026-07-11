"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Info } from "lucide-react";

/**
 * A beautiful Zoom-inspired top header for the meeting room.
 * Displays meeting details, ID, secure state, and local time.
 *
 * @param {object} props
 * @param {object} props.meeting - Meeting data object.
 * @param {number} props.participantCount - Total connected participant count.
 */
export default function MeetingHeader({ meeting, participantCount }) {
  const [time, setTime] = useState("");

  // Keep a simple clock ticker
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  if (!meeting) return null;

  return (
    <header 
      className="shrink-0 h-11 bg-[#121212] border-b border-white/10 px-3 sm:px-5 flex items-center justify-between gap-3 text-white z-20 select-none"
      id="meeting-header-root"
    >
      {/* Left: Security and Title */}
      <div className="flex items-center gap-3" id="meeting-header-left">
        <div 
          className="flex items-center gap-1 text-[10px] font-medium text-emerald-400"
          id="secure-indicator"
          title="Meeting room connection is secured"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Secure</span>
        </div>
        
        <h1 className="text-sm md:text-base font-bold text-gray-100 line-clamp-1" id="meeting-header-title">
          {meeting.title}
        </h1>
      </div>

      {/* Center: Meeting ID Info */}
      <div className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-400" id="meeting-header-center">
        <span>Meeting ID:</span>
        <span className="font-mono font-bold text-gray-200 bg-white/5 px-2.5 py-1 rounded-md border border-white/5">
          {meeting.public_meeting_id}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-white/20"></span>
        <span>{participantCount} {participantCount === 1 ? "Participant" : "Participants"}</span>
      </div>

      {/* Right: Clock */}
      <div className="text-xs md:text-sm font-bold text-gray-300 font-mono" id="meeting-header-right">
        {time}
      </div>
    </header>
  );
}
