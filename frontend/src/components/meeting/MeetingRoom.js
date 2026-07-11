"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { updateParticipant, leaveMeeting, removeParticipant, endMeeting, getMeetingParticipants, getMeetingWebSocketUrl } from "../../services/api";

import MeetingHeader from "./MeetingHeader";
import PermissionNotice from "./PermissionNotice";
import VideoTile from "./VideoTile";
import MeetingToolbar from "./MeetingToolbar";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatPanel from "./ChatPanel";
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
  const [meetingStatus, setMeetingStatus] = useState(meeting.status);
  
  // Drawer & Modal layout flags
  const [isParticipantsOpen, setIsParticipantsOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [unreadChatCount, setUnreadChatCount] = useState(0);

  // The sole local media state. The toolbar, local tile, and MediaStream all use it.
  const [localMediaState, setLocalMediaState] = useState({
    isMuted: false,
    isVideoOff: false,
  });
  const [remoteStreams, setRemoteStreams] = useState({});

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
  const socketRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const fallbackPollRef = useRef(null);
  const shouldReconnectRef = useRef(true);
  const hasConnectedRef = useRef(false);
  const redirectingRef = useRef(false);
  const peersRef = useRef(new Map());
  const pendingIceRef = useRef(new Map());
  const pendingOffersRef = useRef(new Map());
  const offerRetryRef = useRef(new Map());
  const participantsRef = useRef(initialParticipants || []);
  const isChatOpenRef = useRef(false);

  // Helper to show custom micro toast notifications
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
    if (isChatOpen) setUnreadChatCount(0);
  }, [isChatOpen]);

  const isMuted = localMediaState.isMuted;
  const isVideoOff = localMediaState.isVideoOff;
  const isCameraOn = !isVideoOff;

  // Apply a state change to React and the real local browser tracks together.
  const applyLocalMediaState = useCallback((nextState) => {
    const audioTrack = mediaStreamRef.current?.getAudioTracks()[0];
    const videoTrack = mediaStreamRef.current?.getVideoTracks()[0];
    if (audioTrack) audioTrack.enabled = !nextState.isMuted;
    if (videoTrack) videoTrack.enabled = !nextState.isVideoOff;
    setLocalMediaState(nextState);
  }, []);

  const closePeer = useCallback((remoteParticipantId) => {
    if (offerRetryRef.current.has(remoteParticipantId)) {
      clearTimeout(offerRetryRef.current.get(remoteParticipantId));
      offerRetryRef.current.delete(remoteParticipantId);
    }
    const peer = peersRef.current.get(remoteParticipantId);
    if (peer) {
      peer.onicecandidate = null;
      peer.ontrack = null;
      peer.onconnectionstatechange = null;
      peer.close();
      peersRef.current.delete(remoteParticipantId);
    }
    pendingIceRef.current.delete(remoteParticipantId);
    setRemoteStreams((current) => {
      const next = { ...current };
      delete next[remoteParticipantId];
      return next;
    });
  }, []);

  const cleanupPeers = useCallback(() => {
    [...peersRef.current.keys()].forEach(closePeer);
    pendingOffersRef.current.clear();
  }, [closePeer]);

  const sendWebRtcSignal = useCallback((targetParticipantId, type, payload) => {
    const socket = socketRef.current;
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type, target_participant_id: targetParticipantId, ...payload }));
    }
  }, []);

  const sendChatMessage = useCallback((message) => {
    const socket = socketRef.current;
    const text = message.trim();
    if (text && socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "chat_message", message: text }));
    }
  }, []);

  const attachLocalTracks = useCallback((peer) => {
    const stream = mediaStreamRef.current;
    if (!stream) return;

    stream.getTracks().forEach((track) => {
      const sender = peer.getSenders().find((item) => item.track?.kind === track.kind);
      if (sender) {
        // Covers a peer created before getUserMedia completed without adding a
        // second sender for the same kind.
        if (sender.track !== track) sender.replaceTrack(track);
      } else {
        peer.addTrack(track, stream);
      }
    });
  }, []);

  const ensurePeer = useCallback((remoteParticipantId) => {
    let peer = peersRef.current.get(remoteParticipantId);
    if (peer) {
      attachLocalTracks(peer);
      return peer;
    }

    peer = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    attachLocalTracks(peer);
    peer.onicecandidate = ({ candidate }) => {
      if (candidate) sendWebRtcSignal(remoteParticipantId, "ice_candidate", { candidate });
    };
    peer.ontrack = ({ streams }) => {
      const stream = streams[0];
      if (stream) setRemoteStreams((current) => ({ ...current, [remoteParticipantId]: stream }));
    };
    peer.onconnectionstatechange = () => {
      if (["failed", "closed"].includes(peer.connectionState)) closePeer(remoteParticipantId);
    };
    peersRef.current.set(remoteParticipantId, peer);
    return peer;
  }, [attachLocalTracks, closePeer, sendWebRtcSignal]);

  const applyPendingIce = useCallback(async (remoteParticipantId, peer) => {
    const candidates = pendingIceRef.current.get(remoteParticipantId) || [];
    pendingIceRef.current.delete(remoteParticipantId);
    for (const candidate of candidates) await peer.addIceCandidate(candidate);
  }, []);

  const handleWebRtcSignal = useCallback(async (message) => {
    const remoteParticipantId = Number(message.from_participant_id);
    if (!remoteParticipantId || remoteParticipantId === Number(participantId)) return;
    // The joining answerer must not create a trackless answer. Keep the offer
    // until getUserMedia has supplied the audio/video tracks for this peer.
    if (message.type === "webrtc_offer" && !mediaStreamRef.current) {
      pendingOffersRef.current.set(remoteParticipantId, message);
      return;
    }
    const peer = ensurePeer(remoteParticipantId);
    try {
      if (message.type === "webrtc_offer") {
        await peer.setRemoteDescription(new RTCSessionDescription(message.sdp));
        await applyPendingIce(remoteParticipantId, peer);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        sendWebRtcSignal(remoteParticipantId, "webrtc_answer", { sdp: peer.localDescription });
      } else if (message.type === "webrtc_answer") {
        await peer.setRemoteDescription(new RTCSessionDescription(message.sdp));
        if (offerRetryRef.current.has(remoteParticipantId)) {
          clearTimeout(offerRetryRef.current.get(remoteParticipantId));
          offerRetryRef.current.delete(remoteParticipantId);
        }
        await applyPendingIce(remoteParticipantId, peer);
      } else if (message.type === "ice_candidate") {
        const candidate = new RTCIceCandidate(message.candidate);
        if (peer.remoteDescription) await peer.addIceCandidate(candidate);
        else pendingIceRef.current.set(remoteParticipantId, [...(pendingIceRef.current.get(remoteParticipantId) || []), candidate]);
      }
    } catch (error) {
      closePeer(remoteParticipantId);
    }
  }, [applyPendingIce, closePeer, ensurePeer, participantId, sendWebRtcSignal]);

  const syncPeers = useCallback(async (nextParticipants = participantsRef.current) => {
    if (!mediaStreamRef.current || !participantId) return;
    const localId = Number(participantId);
    const remoteParticipants = nextParticipants.filter((participant) => participant.id !== localId);
    const activeIds = new Set(remoteParticipants.map((participant) => participant.id));
    [...peersRef.current.keys()].filter((id) => !activeIds.has(id)).forEach(closePeer);

    for (const remote of remoteParticipants) {
      // The lower immutable participant ID is the sole offerer, preventing glare.
      if (localId < remote.id && !peersRef.current.has(remote.id)) {
        const peer = ensurePeer(remote.id);
        const offer = await peer.createOffer();
        await peer.setLocalDescription(offer);
        sendWebRtcSignal(remote.id, "webrtc_offer", { sdp: peer.localDescription });
        // A join can race the target socket registration; retry the same offer once.
        offerRetryRef.current.set(remote.id, setTimeout(() => {
          if (peer.signalingState === "have-local-offer") {
            sendWebRtcSignal(remote.id, "webrtc_offer", { sdp: peer.localDescription });
          }
        }, 1500));
      }
    }
  }, [closePeer, ensurePeer, participantId, sendWebRtcSignal]);

  // The local entry is always projected from localMediaState, rather than waiting
  // for the round trip room-state broadcast before the tile updates.
  const roomParticipants = participants.map((participant) => (
    participant.id === Number(participantId)
      ? { ...participant, is_muted: isMuted, is_camera_on: !isVideoOff }
      : participant
  ));
  const currentParticipant = roomParticipants.find((p) => p.id === Number(participantId));
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

  // Clean helper to stop all current media device tracks
  const cleanupMediaTracks = () => {
    cleanupPeers();
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (localVideoRef.current) localVideoRef.current.srcObject = null;
  };

  const exitRoom = useCallback((reason) => {
    if (redirectingRef.current) return;
    redirectingRef.current = true;
    shouldReconnectRef.current = false;
    if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    if (fallbackPollRef.current) clearInterval(fallbackPollRef.current);
    socketRef.current?.close();
    cleanupMediaTracks();
    showToast(reason === "ended" ? "This meeting has been ended by the host." : "You have been removed from this meeting.", "info");
    setTimeout(() => router.push(reason === "ended" ? "/?meetingEnded=true" : "/?removed=true"), 1200);
  }, [router, showToast]);

  // REST is used for initial/reconnection reads and WebSocket fallback only.
  const fetchParticipants = useCallback(async () => {
    try {
      const updatedList = await getMeetingParticipants(meeting.public_meeting_id);
      participantsRef.current = updatedList;
      setParticipants(updatedList);
      syncPeers(updatedList);
      const localParticipant = updatedList.find((p) => p.id === Number(participantId));
      if (localParticipant) {
        applyLocalMediaState({
          isMuted: localParticipant.is_muted,
          isVideoOff: !localParticipant.is_camera_on,
        });
      }
      const stillActive = updatedList.some((p) => p.id === Number(participantId));
      if (!stillActive && participantId) {
        exitRoom("removed");
      }
    } catch (err) {
      console.error("Error fetching participants roster:", err);
    }
  }, [meeting.public_meeting_id, participantId, exitRoom, applyLocalMediaState, syncPeers]);

  // One socket per room. A failed connection uses a five-second REST fallback.
  useEffect(() => {
    let disposed = false;
    let initialConnectTimer = null;
    const stopFallback = () => {
      if (fallbackPollRef.current) clearInterval(fallbackPollRef.current);
      fallbackPollRef.current = null;
    };
    const startFallback = () => {
      if (disposed || fallbackPollRef.current) return;
      fetchParticipants();
      fallbackPollRef.current = setInterval(fetchParticipants, 5000);
    };
    const connect = () => {
      if (disposed || !shouldReconnectRef.current) return;
      const url = getMeetingWebSocketUrl(meeting.public_meeting_id, participantId);
      if (!url) return startFallback();
      let socket;
      try { socket = new WebSocket(url); } catch (error) { startFallback(); return; }
      socketRef.current = socket;
      socket.onopen = () => {
        if (disposed || socketRef.current !== socket) return;
        const reconnected = hasConnectedRef.current;
        hasConnectedRef.current = true;
        stopFallback();
        if (reconnected) fetchParticipants();
      };
      socket.onmessage = (event) => {
        if (socketRef.current !== socket) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === "chat_message") {
            setChatMessages((current) => [...current, payload]);
            if (!isChatOpenRef.current && payload.sender_id !== Number(participantId)) {
              setUnreadChatCount((count) => count + 1);
            }
            return;
          }
          if (["webrtc_offer", "webrtc_answer", "ice_candidate"].includes(payload.type)) {
            handleWebRtcSignal(payload);
            return;
          }
          if (payload.type !== "room_state") return;
          participantsRef.current = Array.isArray(payload.participants) ? payload.participants : [];
          setParticipants(Array.isArray(payload.participants) ? payload.participants : []);
          syncPeers(participantsRef.current);
          const localParticipant = payload.participants?.find((p) => p.id === Number(participantId));
          if (localParticipant) {
            applyLocalMediaState({
              isMuted: localParticipant.is_muted,
              isVideoOff: !localParticipant.is_camera_on,
            });
          }
          setMeetingStatus(payload.meeting?.status || meeting.status);
          if (payload.meeting?.status === "ended") return exitRoom("ended");
          if (participantId && !payload.participants?.some((p) => p.id === Number(participantId))) exitRoom("removed");
        } catch (error) { console.error("Invalid room-state WebSocket message:", error); }
      };
      socket.onclose = () => {
        if (disposed || socketRef.current !== socket) return;
        startFallback();
        if (shouldReconnectRef.current) reconnectTimerRef.current = setTimeout(connect, 1500);
      };
      socket.onerror = () => socket.close();
    };
    shouldReconnectRef.current = true;
    fetchParticipants();
    // Deferring one tick lets React Strict Mode clean up its probe effect before
    // a physical connection is opened, preventing duplicate dev connections.
    initialConnectTimer = setTimeout(connect, 0);
    return () => {
      disposed = true;
      if (initialConnectTimer) clearTimeout(initialConnectTimer);
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      stopFallback();
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [meeting.public_meeting_id, participantId, fetchParticipants, exitRoom, meeting.status, applyLocalMediaState, handleWebRtcSignal, syncPeers, cleanupPeers]);

  // Hardware Initialization: Run on component mount to capture user media
  useEffect(() => {
    let activeStream = null;

    const initMedia = async () => {
      try {
        // Secure browser context validation
        if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setPermissionError("InsecureContext");
          applyLocalMediaState({ isMuted: true, isVideoOff: true });
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
        // Respond to an offer only after its audio/video tracks are attached.
        const queuedOffers = [...pendingOffersRef.current.values()];
        pendingOffersRef.current.clear();
        for (const offer of queuedOffers) await handleWebRtcSignal(offer);
        await syncPeers();

        // Extract native track configuration
        const audioTrack = stream.getAudioTracks()[0];
        const videoTrack = stream.getVideoTracks()[0];

        const initialMute = audioTrack ? !audioTrack.enabled : true;
        const initialCamera = videoTrack ? videoTrack.enabled : false;

        applyLocalMediaState({ isMuted: initialMute, isVideoOff: !initialCamera });

        // Bind stream source to standard HTML5 video element
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Propagate current hardware states to the backend DB
        await updateParticipantStateInDb(initialMute, initialCamera);
        
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
        
        applyLocalMediaState({ isMuted: true, isVideoOff: true });
        await updateParticipantStateInDb(true, false);
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
  }, [applyLocalMediaState, syncPeers, cleanupPeers, handleWebRtcSignal]);

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
      applyLocalMediaState({ isMuted: nextMuted, isVideoOff });
      
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
      const nextVideoOff = !isVideoOff;
      applyLocalMediaState({ isMuted, isVideoOff: nextVideoOff });
      
      try {
        await updateParticipant(Number(participantId), { is_camera_on: !nextVideoOff });
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
      const targetGuests = roomParticipants.filter(
        (p) => p.role !== "host" && p.id !== Number(participantId) && !p.is_muted
      );

      // Perform non-blocking sequential updates
      await Promise.all(
        targetGuests.map((p) => updateParticipant(p.id, { is_muted: true }))
      );

      showToast("Requested Mute All for guest participants.", "success");
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
      exitRoom("ended");
    } catch (err) {
      console.error("Failed to finalize end meeting endpoint:", err);
      router.push("/");
    }
  };

  // Handler: Standard "Leave Meeting" workflow
  const handleLeaveSession = async () => {
    if (isLeaving) return;
    setIsLeaving(true);
    shouldReconnectRef.current = false;
    socketRef.current?.close();

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
    <div className="h-screen overflow-hidden flex flex-col bg-[#121212] text-white" id="meeting-room-viewport">
      
      {/* 1. Roster notifications & Warning Notice Banners */}
      <PermissionNotice 
        errorType={permissionError} 
        onDismiss={() => setPermissionError("")} 
      />

      {/* 2. Custom meeting top navbar */}
      <MeetingHeader 
        meeting={{ ...meeting, status: meetingStatus }}
        participantCount={roomParticipants.length}
      />

      {/* 3. Central Working Area (Video grid + Sidebar drawers) */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row relative overflow-hidden" id="meeting-workspace-area">
        
        {/* Dynamic Video Layout Grid */}
        <div 
            className="flex-1 min-h-0 p-2 md:p-3 overflow-hidden flex items-center justify-center bg-[#141414]"
          id="video-grid-container"
        >
          <div 
            className={`w-full h-full max-w-[1600px] mx-auto grid content-center gap-2 md:gap-3 ${
              roomParticipants.length === 1
                ? "grid-cols-1 max-w-5xl"
              : roomParticipants.length === 2
                ? "grid-cols-1 md:grid-cols-2 max-w-7xl"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            }`}
            id="meeting-video-grid"
          >
            {roomParticipants.map((p) => (
              <VideoTile
                key={p.id}
                participant={p}
                isLocal={p.id === Number(participantId)}
                videoRef={p.id === Number(participantId) ? localVideoRef : null}
                remoteStream={remoteStreams[p.id]}
              />
            ))}
          </div>
        </div>

        {/* Sliding Sidebar: Participants Panel */}
        {(isParticipantsOpen || isChatOpen) && (
          <div className="w-full md:w-auto h-auto md:h-full flex flex-col md:flex-row border-t md:border-t-0 md:border-l border-white/5" id="sidebar-panel-container">
            {isParticipantsOpen && (
            <ParticipantsPanel
              participants={roomParticipants}
              currentParticipant={currentParticipant}
              onMuteAll={handleMuteAllGuests}
              onRemoveParticipant={handleEvictParticipant}
              isMuteAllLoading={isMuteAllLoading}
            />
            )}
            {isChatOpen && <ChatPanel messages={chatMessages} currentParticipantId={participantId} onSend={sendChatMessage} onClose={() => setIsChatOpen(false)} />}
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
        isChatOpen={isChatOpen}
        onToggleChat={() => setIsChatOpen((open) => !open)}
        unreadChatCount={unreadChatCount}
        onOpenInvite={() => setIsInviteOpen(true)}
        onLeave={handleLeaveSession}
        onEndMeeting={handleEndSession}
        isHost={isHost}
        participantCount={roomParticipants.length}
      />

      {/* 5. Overlay invite details dialog */}
      <InviteModal
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
        meeting={{ ...meeting, status: meetingStatus }}
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
