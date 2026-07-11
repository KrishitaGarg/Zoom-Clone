import React from "react";
import { Video, Plus, Calendar } from "lucide-react";

/**
 * Zoom-inspired primary action buttons/cards dashboard widget.
 * Styled with high-fidelity visual fidelity, hover lift-states, and disabled/loading indicators.
 * 
 * @param {object} props
 * @param {boolean} props.isLoading - Whether user or page data is loading.
 * @param {boolean} props.isCreating - Whether an instant meeting creation request is in progress.
 * @param {function} props.onNewMeeting - Action handler for "New Meeting" click.
 * @param {function} props.onOpenJoinModal - Action handler for "Join Meeting" click.
 * @param {function} props.onOpenScheduleModal - Action handler for "Schedule Meeting" click.
 */
export default function ActionButtons({ 
  isLoading, 
  isCreating, 
  onNewMeeting, 
  onOpenJoinModal, 
  onOpenScheduleModal 
}) {
  return (
    <div 
      className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full" 
      id="dashboard-action-cards"
    >
      {/* 1. New Meeting Card */}
      <button
        onClick={onNewMeeting}
        disabled={isLoading || isCreating}
        className={`
          flex flex-col items-center justify-center p-6 bg-white border border-gray-150 rounded-2xl shadow-sm text-center transition-all duration-200 group relative select-none h-44
          ${isLoading || isCreating 
            ? "opacity-60 cursor-not-allowed" 
            : "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          }
        `}
        id="action-btn-new-meeting"
      >
        <div className="bg-[#FF742E] text-white p-4 rounded-2xl shadow-sm group-hover:scale-105 transition-transform duration-200" id="new-meeting-icon-wrapper">
          {isCreating ? (
            <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            <Video className="w-7 h-7 stroke-[1.75]" />
          )}
        </div>
        <h3 className="text-base font-bold text-gray-800 mt-4 leading-none" id="new-meeting-title">
          New Meeting
        </h3>
        <p className="text-xs text-gray-400 mt-2 font-medium" id="new-meeting-subtitle">
          Start an instant video room
        </p>
      </button>

      {/* 2. Join Meeting Card */}
      <button
        onClick={onOpenJoinModal}
        disabled={isLoading || isCreating}
        className={`
          flex flex-col items-center justify-center p-6 bg-white border border-gray-150 rounded-2xl shadow-sm text-center transition-all duration-200 group relative select-none h-44
          ${isLoading || isCreating 
            ? "opacity-60 cursor-not-allowed" 
            : "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          }
        `}
        id="action-btn-join-meeting"
      >
        <div className="bg-[#2D8CFF] text-white p-4 rounded-2xl shadow-sm group-hover:scale-105 transition-transform duration-200" id="join-meeting-icon-wrapper">
          <Plus className="w-7 h-7 stroke-[1.75]" />
        </div>
        <h3 className="text-base font-bold text-gray-800 mt-4 leading-none" id="join-meeting-title">
          Join Meeting
        </h3>
        <p className="text-xs text-gray-400 mt-2 font-medium" id="join-meeting-subtitle">
          Connect via invitation URL/ID
        </p>
      </button>

      {/* 3. Schedule Meeting Card */}
      <button
        onClick={onOpenScheduleModal}
        disabled={isLoading || isCreating}
        className={`
          flex flex-col items-center justify-center p-6 bg-white border border-gray-150 rounded-2xl shadow-sm text-center transition-all duration-200 group relative select-none h-44
          ${isLoading || isCreating 
            ? "opacity-60 cursor-not-allowed" 
            : "hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
          }
        `}
        id="action-btn-schedule-meeting"
      >
        <div className="bg-[#2D8CFF]/10 text-[#2D8CFF] p-4 rounded-2xl shadow-sm group-hover:scale-105 transition-transform duration-200" id="schedule-meeting-icon-wrapper">
          <Calendar className="w-7 h-7 stroke-[1.75]" />
        </div>
        <h3 className="text-base font-bold text-gray-800 mt-4 leading-none" id="schedule-meeting-title">
          Schedule Meeting
        </h3>
        <p className="text-xs text-gray-400 mt-2 font-medium" id="schedule-meeting-subtitle">
          Plan upcoming future video events
        </p>
      </button>
    </div>
  );
}
