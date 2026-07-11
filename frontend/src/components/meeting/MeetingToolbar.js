"use client";

import React from "react";
import { Mic, MicOff, Video, VideoOff, Users, Share2, LogOut, ShieldAlert, ShieldCheck } from "lucide-react";

const Control = ({ children, label, active = false, danger = false, ...props }) => (
  <button
    className={`min-w-11 px-1.5 py-1 flex flex-col items-center gap-0.5 text-[10px] leading-3 font-medium transition-colors ${
      danger ? "text-[#f4514f] hover:text-red-300" : active ? "text-[#2d8cff]" : "text-gray-200 hover:text-white"
    }`}
    title={label}
    {...props}
  >
    {children}
    <span className="hidden sm:inline whitespace-nowrap">{label}</span>
  </button>
);

/** Compact fixed Zoom-like meeting controls; callbacks and room behavior remain unchanged. */
export default function MeetingToolbar({
  isMuted, isCameraOn, onToggleMic, onToggleCamera, isParticipantsOpen,
  onToggleParticipants, onOpenInvite, onLeave, onEndMeeting, isHost, participantCount,
}) {
  return (
    <footer className="shrink-0 h-[68px] bg-[#1b1b1d] border-t border-white/10 px-3 sm:px-5 flex items-center justify-between text-white z-20 select-none" id="meeting-toolbar-root">
      <div className="flex items-center gap-1" id="toolbar-left-actions">
        <Control onClick={onToggleMic} label={isMuted ? "Unmute" : "Mute"} danger={isMuted} aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}>
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </Control>
        <Control onClick={onToggleCamera} label={isCameraOn ? "Stop Video" : "Start Video"} danger={!isCameraOn} aria-label={isCameraOn ? "Stop video camera" : "Start video camera"}>
          {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </Control>
      </div>

      <div className="flex items-center gap-1 sm:gap-2" id="toolbar-center-actions">
        <div className="hidden lg:flex min-w-11 px-1.5 py-1 flex-col items-center gap-0.5 text-[10px] leading-3 font-medium text-gray-300" title="Meeting security">
          <ShieldCheck className="w-5 h-5 text-emerald-400" /><span>Security</span>
        </div>
        <Control onClick={onToggleParticipants} label={`Participants${participantCount ? ` (${participantCount})` : ""}`} active={isParticipantsOpen} aria-label="Toggle participants list panel">
          <Users className="w-5 h-5" />
        </Control>
        <Control onClick={onOpenInvite} label="Invite" aria-label="Invite participants">
          <Share2 className="w-5 h-5" />
        </Control>
      </div>

      <div className="flex items-center gap-2" id="toolbar-right-escape">
        <button onClick={onLeave} aria-label="Leave meeting" className="inline-flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-200 hover:bg-white/10 transition-colors" id="btn-leave-meeting">
          <LogOut className="w-3.5 h-3.5" /><span className="hidden sm:inline">Leave</span>
        </button>
        {isHost && (
          <button onClick={onEndMeeting} aria-label="End meeting for everyone" className="inline-flex items-center gap-1.5 bg-[#e02828] hover:bg-[#bd1e1e] px-3 py-1.5 text-xs font-medium transition-colors" id="btn-end-meeting">
            <ShieldAlert className="w-3.5 h-3.5" /> <span>End</span>
          </button>
        )}
      </div>
    </footer>
  );
}
