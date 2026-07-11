"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateParticipant, leaveMeeting, removeParticipant, endMeeting, getMeetingParticipants, getMeeting } from "../../services/api";

import MeetingHeader from "./MeetingHeader";
import PermissionNotice from "./PermissionNotice";
import VideoTile from "./VideoTile";
import MeetingToolbar from "./MeetingToolbar";
import ParticipantsPanel from "./ParticipantsPanel";
import InviteModal from "./InviteModal";
import Toast from "../ui/Toast";

/**
 * Core interactive Meeting Room component.
 * Orchesrates HTML5 MediaDevices camera/mic loop, synchronizes participant states,
 * manages responsive sidebar panels, handles invite details, and enforces host controls.
 *
 * @param {object} props
 * @param {object} props.meeting - Validated meeting meta-data response.
 * @param {Array} props.initialParticipants - Initially retrieved active participant roster.
 * @param {string} props.participantId - The browser's active participant session ID.
 */
export default function MeetingRoom({ meeting, initialParticipants, participantId }) {
  const router = useRouter();

  // Active connected participants list
  const [participants, setParticipants] = useState(initialParticipants || []);
  
  // Drawer & Modal layout flags
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Hardware toggle states
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(true);

  // Browser Permission notice state
  const [permissionError, setPermissionError] = useState("");

  // Submitting loaders
  const [isMuteAllLoading, setIsMuteAllLoading] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Refs for tracking HTML5 media streams
  const mediaStreamRef = useRef(null);
  const localVideoRef = useRef(null);

  // Helper to show custom micro toast notifications
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  // Determine current active participant record from the roster
  const currentParticipant = participants.find((p) => p.id === Number(participantId));
  const isHost = currentParticipant?.role === "host";

  // Helper function to update the backend participant record with latest camera/mic states
  const updateParticipantStateInDb = async (mutedState, cameraState) => {
    if (!participantId) return;
    try {
      await updateParticipant(Number(participantId), {
        is_muted: mutedState,
        is_camera_on: cameraState,
      });
    } catch (err) {
      console.error("Failed to sync media state with FastAPI backend:", err);
      showToast("Toggled locally, but failed to synchronize status with other participants.", "info");
    }
  };

  // Synchronize participants roster with FastAPI backend
  const fetchParticipants = useCallback(async () => {
    try {
      // 1. Fetch live participant records
      const updatedList = await getMeetingParticipants(meeting.public_meeting_id);
      setParticipants(updatedList);
      
      // 2. Validate active presence. If we are no longer in the list (and we have joined), the host removed us!
      const stillActive = updatedList.some((p) => p.id === Number(participantId));
      if (!stillActive && participantId) {
        cleanupMediaTracks();
        router.push("/?removed=true");
        return;
      }

      // 3. Optional: double check if the meeting status changed to ended
      const updatedMeeting = await getMeeting(meeting.public_meeting_id);
      if (updatedMeeting.status === "ended") {
        cleanupMediaTracks();
        router.push("/?meetingEnded=true");
      }
    } catch (err) {
      console.error("Error polling participants roster:", err);
    }
  }, [meeting.public_meeting_id, participantId, router]);

  // Clean helper to stop all current media device tracks
  const cleanupMediaTracks = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  };

  // Roster Polling: Triggered every 5 seconds only when participants sidebar is open
  useEffect(() => {
    let intervalId = null;
    if (isParticipantsOpen) {
      // Initial refresh upon drawer opening
      fetchParticipants();
      
      intervalId = setInterval(() => {
        fetchParticipants();
      }, 5000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isParticipantsOpen, fetchParticipants]);

  // Hardware Initialization: Run on component mount to capture user media
  useEffect(() => {
    let activeStream = null;

    const initMedia = async () => {
      try {
        // Secure browser context validation
        if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setPermissionError("InsecureContext");
          setIsMuted(true);
          setIsCameraOn(false);
          await updateParticipantStateInDb(true, false);
          return;
        }

        // Request webcam and audio authorization
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        activeStream = stream;
        mediaStreamRef.current = stream;

        // Extract native track configuration
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];

        const initialMute = audioTrack ? !audioTrack.enabled : true;
        const initialCamera = videoTrack ? videoTrack.enabled : false;

        setIsMuted(initialMute);
        setIsCameraOn(initialCamera);

        // Bind stream source to standard HTML5 video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Propagate current hardware states to the backend DB
        await updateParticipantStateInDb(initialMute, initialCamera);
        
        // Load latest participants list
        await fetchParticipants();

      } catch (err) {
        console.error("Camera/Microphone track error:", err);
        const name = err.name || "";
        if (name === "NotAllowedError") {
          setPermissionError("NotAllowedError");
        } else if (name === "NotFoundError") {
          setPermissionError("NotFoundError");
        } else if (name === "NotReadableError") {
          setPermissionError("NotReadableError");
        } else {
          setPermissionError("NotFoundError");
        }
        
        setIsMuted(true);
        setIsCameraOn(false);
        await updateParticipantStateInDb(true, false);
        await fetchParticipants();
      }
    };

    initMedia();

    // Stream cleanup on component teardown/unmount
    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      cleanupMediaTracks();
    };
  }, []);

  // Re-bind MediaStream source if video element mounts due to camera state changes
  useEffect(() => {
    if (isCameraOn && mediaStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [isCameraOn, participants]);

  // Handler: Microphone Toggle
  const handleToggleMic = async () => {
    if (!mediaStreamRef.current) {
      showToast("No active audio tracks detected to toggle.", "error");
      return;
    }
    const audioTrack = mediaStreamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      const nextMuted = !isMuted;
      audioTrack.enabled = !nextMuted;
      setIsMuted(nextMuted);
      
      // Update local participants list for snappy feedback
      setParticipants((prev) => 
        prev.map((p) => p.id === Number(participantId) ? { ...p, is_muted: nextMuted } : p)
      );

      try {
        await updateParticipant(Number(participantId), { is_muted: nextMuted });
      } catch (err) {
        console.error("Failed to sync mic state:", err);
        showToast("Audio toggled, but failed to sync state with participants.", "info");
      }
    } else {
      showToast("Microphone is not detected.", "error");
    }
  };

  // Handler: Camera Toggle
  const handleToggleCamera = async () => {
    if (!mediaStreamRef.current) {
      showToast("No active video tracks detected to toggle.", "error");
      return;
    }
    const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
    if (videoTrack) {
      const nextCameraOn = !isCameraOn;
      videoTrack.enabled = nextCameraOn;
      setIsCameraOn(nextCameraOn);
      
      // Update local participants list for snappy feedback
      setParticipants((prev) => 
        prev.map((p) => p.id === Number(participantId) ? { ...p, is_camera_on: nextCameraOn } : p)
      );

      try {
        await updateParticipant(Number(participantId), { is_camera_on: nextCameraOn });
      } catch (err) {
        console.error("Failed to sync camera state:", err);
        showToast("Video toggled, but failed to sync state with participants.", "info");
      }
    } else {
      showToast("Camera device is not detected.", "error");
    }
  };

  // Handler: Host "Mute All" action
  const handleMuteAllGuests = async () => {
    setIsMuteAllLoading(true);
    try {
      const targetGuests = participants.filter(
        (p) => p.role !== "host" && p.id !== Number(participantId) && !p.is_muted
      );

      // Perform non-blocking sequential updates
      await Promise.all(
        targetGuests.map((p) => updateParticipant(p.id, { is_muted: true }))
      );

      showToast("Requested Mute All for guest participants.", "success");
      await fetchParticipants();
    } catch (err) {
      console.error("Failed to perform Mute All:", err);
      showToast("Failed to complete mute all request.", "error");
    } finally {
      setIsMuteAllLoading(false);
    }
  };

  // Handler: Host "Remove Participant" action
  const handleEvictParticipant = async (evictedPid) => {
    try {
      await removeParticipant(evictedPid);
      showToast("Participant evicted from meeting room.", "success");
      await fetchParticipants();
    } catch (err) {
      console.error("Eviction failure:", err);
      showToast("Could not evict participant from meeting.", "error");
    }
  };

  // Handler: Host "End Meeting for Everyone" action
  const handleEndSession = async () => {
    try {
      cleanupMediaTracks();
      await endMeeting(meeting.public_meeting_id);
      router.push("/?meetingEnded=true");
    } catch (err) {
      console.error("Failed to finalize end meeting endpoint:", err);
      router.push("/");
    }
  };

  // Handler: Standard "Leave Meeting" workflow
  const handleLeaveSession = async () => {
    if (isLeaving) return;
    setIsLeaving(true);

    try {
      cleanupMediaTracks();
      await leaveMeeting(Number(participantId));
      router.push("/?leftMeeting=true");
    } catch (err) {
      console.error("Leave operation failed:", err);
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#121212] text-white" id="meeting-room-viewport">
      
      {/* 1. Roster notifications & Warning Notice Banners */}
      <PermissionNotice 
        errorType={permissionError} 
        onDismiss={() => setPermissionError("")} 
      />

      {/* 2. Custom meeting top navbar */}
      <MeetingHeader 
        meeting={meeting} 
        participantCount={participants.length} 
      />

      {/* 3. Central Working Area (Video grid + Sidebar drawers) */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden" id="meeting-workspace-area">
        
        {/* Dynamic Video Layout Grid */}
        <div 
          className="flex-1 p-6 md:p-8 overflow-y-auto flex items-center justify-center bg-[#141414]"
          id="video-grid-container"
        >
          <div 
            className={`w-full max-w-6xl mx-auto grid gap-6 p-2 ${
              participants.length === 1 
                ? "grid-cols-1 max-w-2xl" 
                : participants.length === 2 
                ? "grid-cols-1 md:grid-cols-2 max-w-4xl" 
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            }`}
            id="meeting-video-grid"
          >
            {participants.map((p) => (
              <VideoTile
                key={p.id}
                participant={p}
                isLocal={p.id === Number(participantId)}
                videoRef={p.id === Number(participantId) ? localVideoRef : null}
              />
            ))}
          </div>
        </div>

        {/* Sliding Sidebar: Participants Panel */}
        {isParticipantsOpen && (
          <div 
            className="w-full md:w-auto h-auto md:h-full border-t md:border-t-0 md:border-l border-white/5" 
            id="sidebar-panel-container"
          >
            <ParticipantsPanel
              participants={participants}
              currentParticipant={currentParticipant}
              onMuteAll={handleMuteAllGuests}
              onRemoveParticipant={handleEvictParticipant}
              isMuteAllLoading={isMuteAllLoading}
            />
          </div>
        )}
      </div>

      {/* 4. Bottom Control HUD Toolbar */}
      <MeetingToolbar
        isMuted={isMuted}
        isCameraOn={isCameraOn}
        onToggleMic={handleToggleMic}
        onToggleCamera={handleToggleCamera}
        isParticipantsOpen={isParticipantsOpen}
        onToggleParticipants={() => setIsParticipantsOpen(!isParticipantsOpen)}
        onOpenInvite={() => setIsInviteOpen(true)}
        onLeave={handleLeaveSession}
        onEndMeeting={handleEndSession}
        isHost={isHost}
        participantCount={participants.length}
      />

      {/* 5. Overlay invite details dialog */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        meeting={meeting}
      />

      {/* 6. Active micro Toast notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
