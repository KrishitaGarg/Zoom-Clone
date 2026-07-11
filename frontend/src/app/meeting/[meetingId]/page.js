"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getMeeting, getMeetingParticipants, joinMeeting } from "../../../services/api";

import LoadingSpinner from "../../../components/ui/LoadingSpinner";
import PreJoinScreen from "../../../components/meeting/PreJoinScreen";
import MeetingRoom from "../../../components/meeting/MeetingRoom";
import Toast from "../../../components/ui/Toast";
import { AlertCircle, ArrowLeft } from "lucide-react";

/**
 * Zoom clone dynamic meeting page.
 * Leverages React.use() to parse params asynchronously in Next.js 15.
 * Coordinates page-level validation, loading overlays, error alerts,
 * and handles Pre-Join display-name capture.
 */
export default function MeetingPage({ params }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Next.js 15 asynchronous routing params unwrapper
  const resolvedParams = use(params);
  const meetingId = resolvedParams.meetingId;
  const participantId = searchParams.get("participantId");

  // Core loading, validation, and data states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meeting, setMeeting] = useState(null);
  const [initialParticipants, setInitialParticipants] = useState([]);

  // Form submitting action loader
  const [isJoining, setIsJoining] = useState(false);

  // Local Toast notification state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast((prev) => ({ ...prev, show: false }));
  };

  useEffect(() => {
    if (!meetingId) return;

    const validateAndLoad = async () => {
      setLoading(true);
      setError("");
      try {
        // 1. Validate the meeting credentials
        const validatedMeeting = await getMeeting(meetingId);
        setMeeting(validatedMeeting);

        // 2. Enforce status constraints
        if (validatedMeeting.status === "ended") {
          setError("This meeting has already ended.");
          setLoading(false);
          return;
        }
        if (validatedMeeting.status === "cancelled") {
          setError("This meeting was cancelled.");
          setLoading(false);
          return;
        }

        // 3. If an active participantId search parameter is present, load connected participants
        if (participantId) {
          try {
            const roster = await getMeetingParticipants(meetingId);
            setInitialParticipants(roster);

            // Double check if the participant ID actually exists in the active DB roster
            const exists = roster.some((p) => p.id === Number(participantId));
            if (!exists) {
              // Participant is stale or was removed; redirect to fresh pre-join screen
              router.replace(`/meeting/${meetingId}`);
            }
          } catch (rosterErr) {
            console.error("Failed to query initial participants:", rosterErr);
          }
        }
      } catch (err) {
        console.error("Meeting validation error:", err);
        setError(err.message || "Meeting not found. Please verify the Meeting ID.");
      } finally {
        setLoading(false);
      }
    };

    validateAndLoad();
  }, [meetingId, participantId, router]);

  // Handler: Pre-Join name registration submission
  const handlePreJoinSubmit = async (displayName) => {
    setIsJoining(true);
    try {
      // Create guest participant record in the backend DB
      const participant = await joinMeeting(meetingId, displayName);
      
      // Update browser URL using search parameter, which triggers reload and entries into MeetingRoom
      router.replace(`/meeting/${meetingId}?participantId=${participant.id}`);
    } catch (err) {
      console.error("Join submission error:", err);
      showToast(err.message || "Failed to enter the meeting session.", "error");
    } finally {
      setIsJoining(false);
    }
  };

  const handleBackToDashboard = () => {
    router.push("/");
  };

  // 1. Loading UI
  if (loading) {
    return <LoadingSpinner size="lg" fullPage={true} />;
  }

  // 2. Validation Error States UI
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1A1A1A] text-white p-6" id="meeting-error-viewport">
        <div className="max-w-md w-full bg-[#242424] border border-white/5 rounded-2xl p-8 shadow-2xl text-center space-y-6" id="error-card">
          <div className="flex justify-center" id="error-icon-wrapper">
            <div className="p-4 bg-rose-500/10 rounded-full border border-rose-500/20" id="error-badge">
              <AlertCircle className="w-8 h-8 text-rose-500" />
            </div>
          </div>
          <div className="space-y-2" id="error-text">
            <h2 className="text-xl font-extrabold text-gray-100 tracking-tight">
              Cannot Join Meeting
            </h2>
            <p className="text-sm text-gray-400 leading-relaxed font-medium">
              {error}
            </p>
          </div>
          <button
            onClick={handleBackToDashboard}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-sm border border-white/10 transition-colors cursor-pointer"
            id="btn-error-back"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // 3. Render PreJoin screen if no active participant ID is specified
  if (!participantId) {
    return (
      <>
        <PreJoinScreen
          meeting={meeting}
          onJoin={handlePreJoinSubmit}
          onBack={handleBackToDashboard}
          isJoining={isJoining}
        />
        {toast.show && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
          />
        )}
      </>
    );
  }

  // 4. Mount active, verified Meeting Room session
  return (
    <MeetingRoom
      meeting={meeting}
      initialParticipants={initialParticipants}
      participantId={participantId}
    />
  );
}
