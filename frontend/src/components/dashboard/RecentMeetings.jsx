import React from "react";
import { History, Trash2 } from "lucide-react";
import MeetingCard from "./MeetingCard";
import EmptyState from "../ui/EmptyState";

/**
 * Renders a list of recent / historical completed or ended sessions.
 * Displays a nice customized Empty State if no past history records exist.
 * 
 * @param {object} props
 * @param {Array} props.meetings - Array of meeting response objects.
 * @param {function} props.onShowToast - Callback to display notification messages.
 */
export default function RecentMeetings({ meetings = [], onShowToast }) {
  const hasMeetings = meetings && meetings.length > 0;

  const emptyIcon = <History className="w-12 h-12 text-gray-400 stroke-[1.5]" />;

  return (
    <section className="w-full" id="recent-meetings-section">
      <div className="flex items-center justify-between mb-4" id="recent-meetings-header">
        <div className="flex items-center gap-2" id="recent-title-wrapper">
          <History className="w-5 h-5 text-gray-500" />
          <h2 className="text-lg font-bold text-gray-800">
            Recent Meetings
          </h2>
        </div>
        <span className="text-xs font-semibold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full border border-gray-150" id="recent-count-badge">
          {meetings.length} sessions
        </span>
      </div>

      {hasMeetings ? (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          id="recent-meetings-grid"
        >
          {meetings.map((meeting) => (
            <MeetingCard
              key={meeting.id}
              meeting={meeting}
              isUpcoming={false} // Historical logs don't show active Join buttons
              onShowToast={onShowToast}
            />
          ))}
        </div>
      ) : (
        <div id="recent-meetings-empty">
          <EmptyState
            title="No Meeting History"
            description="Your past logs are empty. Sessions you start, schedule, and end will show up here as history."
            icon={emptyIcon}
          />
        </div>
      )}
    </section>
  );
}
