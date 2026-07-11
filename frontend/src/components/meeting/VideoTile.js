"use client";

import React from "react";
import { MicOff, Crown, VideoOff } from "lucide-react";

/**
 * A Zoom-style responsive video container.
 * Displays real-time webcam streams for the local participant, or animated placeholders
 * with initials avatars for participants with cameras disabled.
 *
 * @param {object} props
 * @param {object} props.participant - The participant state model.
 * @param {boolean} props.isLocal - Whether this tile represents the current browser user.
 * @param {React.RefObject} props.videoRef - Reference to attach the browser MediaStream to.
 */
export default function VideoTile({ participant, isLocal, videoRef }) {
  if (!participant) return null;

  const { display_name, role, is_muted, is_camera_on } = participant;
  const isHost = role === "host";

  // Compute name initials for avatars
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const initials = getInitials(display_name);

  return (
    <div 
      className="relative aspect-video w-full rounded-2xl bg-[#1E1E1E] overflow-hidden border border-white/5 shadow-lg group select-none"
      id={`video-tile-${participant.id || "local"}`}
    >
      {/* 1. Camera Video Element */}
      {is_camera_on ? (
        isLocal ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover rounded-2xl transform scale-x-[-1]"
            id="local-video-player"
          />
        ) : (
          /* For remote participants without real WebRTC stream, show a highly polished mock animated stream background */
          <div 
            className="w-full h-full bg-gradient-to-tr from-[#141517] via-[#23272A] to-[#141517] flex items-center justify-center relative overflow-hidden"
            id={`mock-video-stream-${participant.id}`}
          >
            {/* Soft pulsing visual waves to indicate life */}
            <div className="absolute inset-0 bg-radial-gradient from-indigo-500/5 via-transparent to-transparent animate-pulse" />
            
            <div className="text-center space-y-3 z-10" id={`mock-video-badge-${participant.id}`}>
              <div className="w-20 h-20 rounded-full bg-[#2D8CFF]/20 border border-[#2D8CFF]/30 flex items-center justify-center text-2xl font-extrabold text-[#2D8CFF] shadow-lg animate-pulse" id={`mock-video-avatar-${participant.id}`}>
                {initials}
              </div>
              <p className="text-xs font-bold text-gray-400 tracking-wide uppercase">Mock Video Feed</p>
            </div>
          </div>
        )
      ) : (
        /* Camera Off State: Initials Avatar */
        <div 
          className="w-full h-full bg-[#141517] flex items-center justify-center"
          id={`camera-off-placeholder-${participant.id}`}
        >
          <div 
            className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gray-800 border border-white/10 flex items-center justify-center text-2xl md:text-3xl font-extrabold text-gray-200 shadow-xl"
            id={`avatar-circle-${participant.id}`}
          >
            {initials}
          </div>
        </div>
      )}

      {/* 2. Top Controls & Indicators Overlay (Mute, Host Badges) */}
      <div 
        className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-between pointer-events-none"
        id={`tile-overlays-${participant.id}`}
      >
        {/* Left: Participant Name & Badges */}
        <div className="flex items-center gap-2" id={`tile-names-${participant.id}`}>
          <span className="text-xs md:text-sm font-bold text-white tracking-wide truncate max-w-[120px] sm:max-w-[180px]" id={`tile-display-name-${participant.id}`}>
            {display_name} {isLocal && <span className="text-gray-400 font-semibold text-[11px]">(You)</span>}
          </span>
          {isHost && (
            <span 
              className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 border border-amber-500/30 text-amber-300 px-1.5 py-0.5 rounded-md"
              id={`host-badge-${participant.id}`}
              title="Host organizer"
            >
              <Crown className="w-2.5 h-2.5 fill-amber-300" />
              <span>Host</span>
            </span>
          )}
        </div>

        {/* Right: Hardware States Indicators (Mic mute) */}
        <div className="flex items-center gap-2" id={`tile-states-${participant.id}`}>
          {is_muted && (
            <div 
              className="p-1.5 rounded-lg bg-rose-600/95 border border-rose-500/20 text-white"
              id={`mute-indicator-${participant.id}`}
              title="Microphone is muted"
            >
              <MicOff className="w-3.5 h-3.5" />
            </div>
          )}
          {!is_camera_on && (
            <div 
              className="p-1.5 rounded-lg bg-gray-900/90 border border-white/10 text-gray-400"
              id={`cam-off-indicator-${participant.id}`}
              title="Camera is stopped"
            >
              <VideoOff className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
