import React from "react";
import { CalendarDays, CalendarPlus } from "lucide-react";
import MeetingCard from "./MeetingCard";
import EmptyState from "../ui/EmptyState";

/**
 * Renders a list of future/upcoming scheduled sessions.
 * Displays an elegant custom Empty State when no scheduled items exist.
 * 
 * @param {object} props
 * @param {Array} props.meetings - Array of meeting response objects.
 * @param {function} props.onJoin - Callback triggered when joining a meeting.
 * @param {function} props.onShowToast - Callback to bubble notification messages.
 * @param {function} props.onOpenScheduleModal - Callback to trigger scheduling from empty state.
 */
export default function UpcomingMeetings({ 
  meetings = [], 
  onJoin, 
  onShowToast, 
  onOpenScheduleModal 
}) {
  const hasMeetings = meetings && meetings.length > 0;

  // Empty state action button
  const scheduleButton = (
    <button
      onClick={onOpenScheduleModal}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-[#2D8CFF] hover:bg-[#1A73E8] rounded-xl shadow-xs transition-colors cursor-pointer"
      id="empty-upcoming-schedule-btn"
    >
      <CalendarPlus className="w-4 h-4" />
      <span>Schedule Now</span>
    </button>
  );

  return (
    <section className="w-full" id="upcoming-meetings-section">
      <div className="flex items-center justify-between mb-4" id="upcoming-meetings-header">
        <div className="flex items-center gap-2" id="upcoming-title-wrapper">
          <CalendarDays className="w-5 h-5 text-[#2D8CFF]" />
          <h2 className="text-lg font-bold text-gray-800">
            Upcoming Meetings
          </h2>
        </div>
        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-150" id="upcoming-count-badge">
          {meetings.length} scheduled
        </span>
      </div>

      {hasMeetings ? (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          id="upcoming-meetings-grid"
        >
          {meetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              isUpcoming={true}
              onJoin={onJoin}
              onShowToast={onShowToast}
            />
          ))}
        </div>
      ) : (
        <div id="upcoming-meetings-empty">
          <EmptyState
            title="No Scheduled Meetings"
            description="You don't have any upcoming video sessions. Why not plan one ahead of time or start an instant meeting?"
            actionButton={scheduleButton}
          />
        </div>
      )}
    </section>
  );
}
