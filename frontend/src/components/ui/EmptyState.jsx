import React from "react";
import { CalendarX } from "lucide-react";

/**
 * Reusable component for displaying clean, illustrative empty list states.
 * 
 * @param {object} props
 * @param {string} props.title - Title of the empty state.
 * @param {string} props.description - Explanatory message.
 * @param {React.ReactNode} [props.icon] - Optional Lucide icon component.
 * @param {React.ReactNode} [props.actionButton] - Optional action button (e.g. Schedule Meeting).
 */
export default function EmptyState({ title, description, icon, actionButton }) {
  const defaultIcon = <CalendarX className="w-12 h-12 text-gray-400 stroke-[1.5]" />;

  return (
    <div 
      className="flex flex-col items-center justify-center text-center p-8 bg-white border border-gray-150 rounded-2xl shadow-xs" 
      id="empty-state-card"
    >
      <div className="p-3 bg-gray-50 rounded-full mb-4" id="empty-state-icon-wrapper">
        {icon || defaultIcon}
      </div>
      <h3 className="text-base font-semibold text-gray-800" id="empty-state-title">
        {title}
      </h3>
      <p className="text-sm text-gray-500 max-w-sm mt-1 mb-5" id="empty-state-description">
        {description}
      </p>
      {actionButton && (
        <div id="empty-state-action-button">
          {actionButton}
        </div>
      )}
    </div>
  );
}
