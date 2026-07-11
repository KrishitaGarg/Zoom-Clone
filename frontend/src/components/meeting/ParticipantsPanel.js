"use client";

import React, { useState } from "react";
import { X, Mic, MicOff, Video, VideoOff, Crown, UserX, VolumeX, AlertCircle } from "lucide-react";

/**
 * Zoom-inspired panel listing all active participants and displaying administrative host triggers.
 *
 * @param {object} props
 * @param {Array} props.participants - Array of connected participant states.
 * @param {object} props.currentParticipant - The participant representation of the local user.
 * @param {function} props.onMuteAll - Host callback to mute all other users.
 * @param {function} props.onRemoveParticipant - Host callback to evict a participant.
 * @param {boolean} props.isMuteAllLoading - Loading state during host bulk updates.
 */
export default function ParticipantsPanel({ 
  participants = [], 
  currentParticipant, 
  onMuteAll, 
  onRemoveParticipant,
  isMuteAllLoading = false
}) {
  const [removeIdLoading, setRemoveIdLoading] = useState(null);

  const isHost = currentParticipant?.role === "host";

  const handleRemoveClick = async (pid, name) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the meeting?`)) {
      setRemoveIdLoading(pid);
      try {
        await onRemoveParticipant(pid);
      } catch (err) {
        console.error("Remove participant failed:", err);
      } finally {
        setRemoveIdLoading(null);
      }
    }
  };

  return (
    <div 
      className="w-full md:w-80 bg-[#1A1A1A] border-l border-white/5 flex flex-col h-full text-white z-10 select-none"
      id="participants-panel-root"
    >
      {/* Roster Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between" id="panel-header">
        <h2 className="text-sm font-bold text-gray-100 flex items-center gap-2">
          <span>Participants</span>
          <span className="bg-[#2D8CFF] text-white text-xs px-2 py-0.5 rounded-full font-bold">
            {participants.length}
          </span>
        </h2>
      </div>

      {/* Roster list */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1" id="participants-list-container">
        {participants.map((p) => {
          const isMe = p.id === currentParticipant?.id;
          const isPHost = p.role === "host";
          
          return (
            <div 
              key={p.id} 
              className={`flex items-center justify-between p-2.5 rounded-xl transition-all ${
                isMe ? "bg-white/5 border border-white/5" : "hover:bg-white/3"
              }`}
              id={`participant-item-${p.id}`}
            >
              {/* Left: Avatar & Name */}
              <div className="flex items-center gap-2.5 min-w-0" id={`p-info-left-${p.id}`}>
                {/* Initials Avatar */}
                <div className="w-8 h-8 rounded-full bg-gray-800 border border-white/5 flex items-center justify-center text-xs font-bold text-gray-300 flex-shrink-0">
                  {p.display_name ? p.display_name.slice(0, 2).toUpperCase() : "?"}
                </div>
                
                {/* Display Name and Tags */}
                <div className="min-w-0" id={`p-name-block-${p.id}`}>
                  <p className="text-xs font-bold text-gray-200 truncate flex items-center gap-1.5">
                    <span className="truncate">{p.display_name}</span>
                    {isMe && <span className="text-[10px] text-gray-500 font-semibold">(Me)</span>}
                  </p>
                  <p className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                    {isPHost ? (
                      <span className="text-amber-400 flex items-center gap-0.5 font-bold uppercase tracking-wider text-[8px]">
                        <Crown className="w-2.5 h-2.5" /> Host
                      </span>
                    ) : (
                      <span className="text-gray-500 text-[9px]">Guest</span>
                    )}
                  </p>
                </div>
              </div>

              {/* Right: State Indicators & Admin controls */}
              <div className="flex items-center gap-2" id={`p-controls-right-${p.id}`}>
                {/* Micro / Cam indicators */}
                <div className="flex items-center gap-1.5 text-gray-500" id={`p-hardware-indicators-${p.id}`}>
                  {p.is_muted ? (
                    <MicOff className="w-3.5 h-3.5 text-rose-500" title="Muted" />
                  ) : (
                    <Mic className="w-3.5 h-3.5 text-emerald-500" title="Unmuted" />
                  )}
                  {p.is_camera_on ? (
                    <Video className="w-3.5 h-3.5 text-emerald-500" title="Camera On" />
                  ) : (
                    <VideoOff className="w-3.5 h-3.5 text-rose-500" title="Camera Off" />
                  )}
                </div>

                {/* Host Control Actions: Remove Participant (Only shown if current is Host and p is not me) */}
                {isHost && !isPHost && !isMe && (
                  <button
                    onClick={() => handleRemoveClick(p.id, p.display_name)}
                    disabled={removeIdLoading === p.id}
                    className="p-1 rounded-lg bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 hover:text-rose-200 transition-all cursor-pointer"
                    id={`btn-remove-participant-${p.id}`}
                    title="Remove participant from meeting"
                    aria-label={`Remove ${p.display_name}`}
                  >
                    <UserX className={`w-3.5 h-3.5 ${removeIdLoading === p.id ? "animate-spin" : ""}`} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Host Controls: Footer Actions */}
      {isHost && (
        <div className="p-4 border-t border-white/5 space-y-3 bg-[#161616]" id="panel-host-footer">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold flex items-center gap-1">
            <Crown className="w-3.5 h-3.5 text-amber-500" />
            <span>Host Controls</span>
          </p>
          
          <button
            onClick={onMuteAll}
            disabled={isMuteAllLoading || participants.length <= 1}
            className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 rounded-xl transition-all cursor-pointer shadow-md shadow-rose-950/10"
            id="btn-host-mute-all"
          >
            <VolumeX className="w-3.5 h-3.5" />
            <span>{isMuteAllLoading ? "Muting Everyone..." : "Mute All Participants"}</span>
          </button>
          
          <div className="flex items-start gap-1.5 text-[10px] text-gray-500 bg-white/3 p-2.5 rounded-lg border border-white/5" id="host-limit-card">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              <strong>MVP Signal Limitation:</strong> Mute All updates server state display. Without real-time WebRTC tracks transmission, it cannot physically mute guest microphones remotely.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
