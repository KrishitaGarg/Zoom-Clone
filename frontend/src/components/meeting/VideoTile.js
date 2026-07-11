"use client";

import React from "react";
import { Crown, MicOff } from "lucide-react";

/** Compact Zoom-like video canvas for a room participant. */
export default function VideoTile({ participant, isLocal, videoRef, remoteStream }) {
  if (!participant) return null;

  const { display_name, role, is_muted, is_camera_on } = participant;
  const getInitials = (name) => {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    return parts.length === 1
      ? parts[0].slice(0, 2).toUpperCase()
      : (parts[0][0] + parts[1][0]).toUpperCase();
  };

  return (
    <div
      className="relative aspect-video w-full min-h-0 overflow-hidden bg-[#202124] border border-white/5 select-none"
      id={`video-tile-${participant.id || "local"}`}
    >
      {is_camera_on ? (
        isLocal ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover transform scale-x-[-1]"
            id="local-video-player"
          />
        ) : remoteStream ? (
          <RemoteVideo stream={remoteStream} participantId={participant.id} />
        ) : (
          <div className="w-full h-full bg-gradient-to-tr from-[#1c1d20] via-[#292b30] to-[#1c1d20] flex items-center justify-center" id={`mock-video-stream-${participant.id}`}>
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-full bg-[#3c4043] flex items-center justify-center text-lg font-semibold text-gray-100" id={`mock-video-avatar-${participant.id}`}>
                {getInitials(display_name)}
              </div>
              <p className="text-[10px] font-medium text-gray-400 tracking-wide uppercase">Video on</p>
            </div>
          </div>
        )
      ) : (
        <div className="w-full h-full bg-[#202124] flex items-center justify-center" id={`camera-off-placeholder-${participant.id}`}>
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-[#3c4043] flex items-center justify-center text-lg md:text-xl font-semibold text-gray-100" id={`avatar-circle-${participant.id}`}>
            {getInitials(display_name)}
          </div>
        </div>
      )}

      <div className="absolute left-2 bottom-2 flex items-center gap-1.5 pointer-events-none" id={`tile-overlays-${participant.id}`}>
        <div className="flex items-center gap-1.5 bg-black/65 px-2 py-1 text-[11px] font-medium text-white max-w-[220px]" id={`tile-names-${participant.id}`}>
          <span className="truncate" id={`tile-display-name-${participant.id}`}>
            {display_name} {isLocal && <span className="text-gray-300 font-normal">(You)</span>}
          </span>
          {is_muted && <MicOff className="w-3 h-3 flex-shrink-0 text-[#f4514f]" id={`mute-indicator-${participant.id}`} title="Microphone is muted" />}
          {role === "host" && (
            <span className="inline-flex items-center gap-0.5 text-[8px] font-medium uppercase tracking-wide text-amber-300" id={`host-badge-${participant.id}`} title="Host organizer">
              <Crown className="w-2 h-2 fill-amber-300" /> Host
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function RemoteVideo({ stream, participantId }) {
  const videoRef = React.useRef(null);
  React.useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = stream;
  }, [stream]);
  return <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" id={`remote-video-player-${participantId}`} />;
}
