"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Video, Calendar, Plus, RefreshCw, AlertCircle } from "lucide-react";

// Layout & UI components
import Sidebar from "../components/layout/Sidebar";
import Navbar from "../components/layout/Navbar";
import ActionButtons from "../components/dashboard/ActionButtons";
import UpcomingMeetings from "../components/dashboard/UpcomingMeetings";
import RecentMeetings from "../components/dashboard/RecentMeetings";
import JoinMeetingModal from "../components/modals/JoinMeetingModal";
import ScheduleMeetingModal from "../components/modals/ScheduleMeetingModal";
import LoadingSpinner from "../components/ui/LoadingSpinner";
import Toast from "../components/ui/Toast";

// API services
import { 
  getDefaultUser, 
  getUpcomingMeetings, 
  getRecentMeetings, 
  createInstantMeeting 
} from "../services/api";

/**
 * Filters meetings locally by title, public ID, or description.
 * No external API or LLM request is required.
 */
function filterMeetings(meetings = [], query = "") {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return meetings;
  }

  return meetings.filter((meeting) => {
    const searchableText = [
      meeting.title,
      meeting.public_meeting_id,
      meeting.description,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return searchableText.includes(normalizedQuery);
  });
}

/**
 * Zoom-inspired client-side Dashboard home page.
 * Houses state synchronization, greeting calculators, and handlers for action modals.
 */
export default function DashboardPage() {
  const router = useRouter();

  // Active user and meeting list states
  const [user, setUser] = useState(null);
  const [upcomingMeetings, setUpcomingMeetings] = useState([]);
  const [recentMeetings, setRecentMeetings] = useState([]);

  // Loading and action indicators
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Global & modal error states
  const [pageError, setPageError] = useState("");

  // Modal display toggles
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  // Active application Tab
  const [activeTab, setActiveTab] = useState("home");

  // Custom Toast state
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });

  // Helper to show custom on-screen Toast notifications
  const showToast = useCallback((message, type = "success") => {
    setToast({ show: true, message, type });
  }, []);

  const hideToast = useCallback(() => {
    setToast((prev) => ({ ...prev, show: false }));
  }, []);

  // Search query state for the Navbar search input
  const [searchQuery, setSearchQuery] = useState("");

  // Filter meetings based on the current search query
  const filteredUpcomingMeetings = filterMeetings(
    upcomingMeetings,
    searchQuery
  );

  const filteredRecentMeetings = filterMeetings(
    recentMeetings,
    searchQuery
  );

  // Fetch all initial data from the backend
  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setPageError("");

    try {
      // 1. Fetch user profile
      const loadedUser = await getDefaultUser();
      setUser(loadedUser);

      // 2. Fetch future upcoming scheduled meetings
      const upcomingList = await getUpcomingMeetings();
      setUpcomingMeetings(upcomingList);

      // 3. Fetch past/completed meetings history
      const recentList = await getRecentMeetings();
      setRecentMeetings(recentList);
    } catch (err) {
      console.error("Dashboard initialization error:", err);
      setPageError(err.message || "Could not retrieve dashboard metrics. Please confirm the FastAPI server is running.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Run initial dashboard load
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Greeting calculator based on local time
  const getGreeting = () => {
    const hours = new Date().getHours();
    const name = user ? user.name : "Krishita";
    if (hours < 12) return `Good morning, ${name}`;
    if (hours < 18) return `Good afternoon, ${name}`;
    return `Good evening, ${name}`;
  };

  // Handler: "New Meeting" (Instant)
  const handleNewMeeting = async () => {
    // 1. Verify user context is present
    if (!user || !user.id) {
      showToast("Cannot start instant meeting: default user not loaded.", "error");
      return;
    }

    setPageError("");
    setActionLoading(true);
    showToast("Starting instant meeting room...", "info");

    try {
      // 2. Request backend generation
      const meeting = await createInstantMeeting(user.id);
      
      showToast("Room created successfully. Redirecting...", "success");
      
      // 3. Redirect to the meeting page using the public Zoom-style identifier and the host's participant ID
      if (meeting.host_participant_id) {
        router.push(`/meeting/${meeting.public_meeting_id}?participantId=${meeting.host_participant_id}`);
      } else {
        router.push(`/meeting/${meeting.public_meeting_id}`);
      }
    } catch (err) {
      console.error("Create instant meeting failure:", err);
      showToast(err.message || "Failed to create an instant meeting room.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Handler: Action button "Join Room" from direct list cards
  const handleJoinMeetingFromCard = (meeting) => {
    if (!meeting) return;
    
    // Check if user is the host and we have a pre-created host participant ID
    const isHost = user && meeting.host_id === user.id;
    if (isHost && meeting.host_participant_id) {
      router.push(`/meeting/${meeting.public_meeting_id}?participantId=${meeting.host_participant_id}`);
      return;
    }
    
    // If not the host (or if host_participant_id is somehow missing), prompt the public join modal
    setIsJoinOpen(true);
  };

  // Handler: "Join Meeting" Success trigger from within JoinModal
  const handleJoinSuccess = (meetingId, participant) => {
    // Redirect to the room with the newly assigned active participant's ID
    router.push(`/meeting/${meetingId}?participantId=${participant.id}`);
  };

  // Handler: "Schedule Meeting" Success trigger from within ScheduleModal
  const handleScheduleSuccess = (newMeeting) => {
    // Dynamically insert the newly scheduled meeting into the upcoming state array,
    // sorted correctly by scheduled starting time.
    setUpcomingMeetings((prev) => {
      const updated = [...prev, newMeeting];
      return updated.sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start));
    });
    
    // Also re-trigger silent sync to ensure server order and fields match perfectly
    loadDashboardData(true);
  };

  // Return full page loader if initial data is loading
  if (loading) {
    return <LoadingSpinner size="lg" fullPage={true} />;
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC]" id="dashboard-app-root">
      {/* 1. Sidebar Navigation */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* 2. Main Content Frame (shrunk by sidebar margins) */}
      <div className="sm:pl-20 md:pl-64 min-h-screen flex flex-col pt-16 transition-all duration-300" id="main-content-frame">
        {/* Top Navbar */}
        <Navbar
          user={user}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />

        {/* Dashboard Content Container */}
        <main className="flex-1 p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full" id="dashboard-main-content">
          
          {/* Error Banner */}
          {pageError && (
            <div 
              className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-3 text-sm text-rose-800 font-semibold"
              id="page-error-banner"
            >
              <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
              <span>{pageError}</span>
              <button 
                onClick={() => loadDashboardData()}
                className="ml-auto text-xs bg-rose-100 hover:bg-rose-200 text-rose-900 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer"
                id="btn-retry-load"
              >
                Retry
              </button>
            </div>
          )}

          {/* Header Greeting Segment */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4" id="dashboard-header-block">
            <div id="greeting-text-wrapper">
              <h1 className="text-2xl md:text-3xl font-extrabold text-gray-800 tracking-tight" id="greeting-header">
                {getGreeting()}
              </h1>
              <p className="text-sm text-gray-400 font-medium mt-1" id="greeting-subheader">
                Welcome to your video communications center. Start, schedule, or join rooms instantly.
              </p>
            </div>

            {/* Silent Refresh Button */}
            <button
              onClick={() => loadDashboardData(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-gray-500 bg-white border border-gray-200 hover:bg-gray-50 hover:text-gray-700 disabled:opacity-50 rounded-xl shadow-xs transition-all cursor-pointer self-start sm:self-center"
              id="btn-sync-dashboard"
              title="Refresh meetings data"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Syncing..." : "Sync Database"}</span>
            </button>
          </div>

          {/* Core Action Grid buttons */}
          <ActionButtons
            isLoading={loading}
            isCreating={actionLoading}
            onNewMeeting={handleNewMeeting}
            onOpenJoinModal={() => setIsJoinOpen(true)}
            onOpenScheduleModal={() => setIsScheduleOpen(true)}
          />

          {/* Divider line */}
          <hr className="border-gray-100" />

          {/* Upcoming scheduled events section */}
          <UpcomingMeetings
            meetings={filteredUpcomingMeetings}
            onJoin={handleJoinMeetingFromCard}
            onShowToast={showToast}
            onOpenScheduleModal={() => setIsScheduleOpen(true)}
          />

          {/* Divider line */}
          <hr className="border-gray-100" />

          {/* Historical logs section */}
          <RecentMeetings
            meetings={filteredRecentMeetings}
            onShowToast={showToast}
          />
        </main>
      </div>

      {/* 3. Overlay Modals */}
      <JoinMeetingModal
        isOpen={isJoinOpen}
        onClose={() => setIsJoinOpen(false)}
        user={user}
        onJoinSuccess={handleJoinSuccess}
        onShowToast={showToast}
      />

      <ScheduleMeetingModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        user={user}
        onScheduleSuccess={handleScheduleSuccess}
        onShowToast={showToast}
      />

      {/* 4. Active Toast Notification */}
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
