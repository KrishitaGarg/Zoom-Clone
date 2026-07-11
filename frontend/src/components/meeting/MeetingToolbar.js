"use client";

import React from "react";
import { 
  Mic, MicOff, Video, VideoOff, Users, Share2, 
  LogOut, ShieldAlert, VolumeX
} from "lucide-react";

/**
 * Zoom-style bottom control bar featuring toggles for hardware media devices,
 * panel triggers, and session leave/end handlers.
 *
 * @param {object} props
 * @param {boolean} props.isMuted - Active mic mute state.
 * @param {boolean} props.isCameraOn - Active camera toggle state.
 * @param {function} props.onToggleMic - Mic toggle callback.
 * @param {function} props.onToggleCamera - Camera toggle callback.
 * @param {boolean} props.isParticipantsOpen - Flag if participants drawer is open.
 * @param {function} props.onToggleParticipants - Participants drawer toggle callback.
 * @param {function} props.onOpenInvite - Callback to show sharing modal.
 * @param {function} props.onLeave - Callback to exit session.
 * @param {function} props.onEndMeeting - Host callback to finalize meeting session.
 * @param {boolean} props.isHost - Is the current participant the session Host.
 * @param {number} props.participantCount - Active connected participant count.
 */
export default function MeetingToolbar({
  isMuted,
  isCameraOn,
  onToggleMic,
  onToggleCamera,
  isParticipantsOpen,
  onToggleParticipants,
  onOpenInvite,
  onLeave,
  onEndMeeting,
  isHost,
  participantCount
}) {
  return (
    <div 
      className="bg-[#121212] border-t border-white/5 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 z-20 select-none"
      id="meeting-toolbar-root"
    >
      {/* Left: Meeting Room stats/quick indicators */}
      <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-gray-500" id="toolbar-left-stats">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="text-gray-300">Room Status: Live</span>
        <span className="text-gray-600">|</span>
        <span>{participantCount} In-room</span>
      </div>

      {/* Center: Essential Controls (Mic, Cam, Panels) */}
      <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center" id="toolbar-center-actions">
        {/* Microphone Toggle */}
        <button
          onClick={onToggleMic}
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
          className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer border ${
            isMuted 
              ? "bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border-rose-500/20" 
              : "bg-white/5 hover:bg-white/10 text-gray-200 border-white/5"
          }`}
          id="btn-toggle-mic"
          title={isMuted ? "Unmute Microphone" : "Mute Microphone"}
        >
          {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5 text-emerald-500" />}
          <span className="text-[10px] font-bold tracking-wider hidden md:inline">
            {isMuted ? "Unmuted" : "Mute"}
          </span>
        </button>

        {/* Camera Toggle */}
        <button
          onClick={onToggleCamera}
          aria-label={isCameraOn ? "Stop video camera" : "Start video camera"}
          className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer border ${
            !isCameraOn 
              ? "bg-rose-600/10 hover:bg-rose-600/20 text-rose-500 border-rose-500/20" 
              : "bg-white/5 hover:bg-white/10 text-gray-200 border-white/5"
          }`}
          id="btn-toggle-camera"
          title={isCameraOn ? "Stop Video" : "Start Video"}
        >
          {isCameraOn ? <Video className="w-5 h-5 text-emerald-500" /> : <VideoOff className="w-5 h-5" />}
          <span className="text-[10px] font-bold tracking-wider hidden md:inline">
            {isCameraOn ? "Stop Video" : "Start Video"}
          </span>
        </button>

        <span className="w-px h-8 bg-white/5 hidden sm:inline" />

        {/* Invite Trigger */}
        <button
          onClick={onOpenInvite}
          aria-label="Invite guests"
          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/5 transition-all flex flex-col items-center gap-1 cursor-pointer"
          id="btn-invite-participants"
          title="Invite guests"
        >
          <Share2 className="w-5 h-5 text-[#2D8CFF]" />
          <span className="text-[10px] font-bold tracking-wider hidden md:inline">Invite</span>
        </button>

        {/* Participants drawer Toggle */}
        <button
          onClick={onToggleParticipants}
          aria-label="Toggle participants list panel"
          className={`p-3 rounded-xl transition-all flex flex-col items-center gap-1 cursor-pointer border ${
            isParticipantsOpen 
              ? "bg-[#2D8CFF]/10 text-[#2D8CFF] border-[#2D8CFF]/20" 
              : "bg-white/5 hover:bg-white/10 text-gray-200 border-white/5"
          }`}
          id="btn-toggle-participants"
          title="Toggle Participants Panel"
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-bold tracking-wider hidden md:inline">Participants</span>
        </button>
      </div>

      {/* Right: Escape Sessions (Leave, End) */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-center sm:justify-end" id="toolbar-right-escape">
        {/* Leave Meeting (Standard Participant escape) */}
        <button
          onClick={onLeave}
          aria-label="Leave meeting"
          className="px-5 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-white text-xs font-bold border border-white/5 transition-colors cursor-pointer flex items-center gap-1.5"
          id="btn-leave-meeting"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Leave</span>
        </button>

        {/* End Meeting (Administrative Host trigger) */}
        {isHost && (
          <button
            onClick={onEndMeeting}
            aria-label="End meeting for everyone"
            className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-lg shadow-rose-950/10"
            id="btn-end-meeting"
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>End Session</span>
          </button>
        )}
      </div>
    </div>
  );
}
