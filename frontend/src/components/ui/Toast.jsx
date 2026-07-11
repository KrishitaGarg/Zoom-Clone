"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

/**
 * A beautiful, dismissible Toast alert component styled with Tailwind.
 * 
 * @param {object} props
 * @param {string} props.message - The notification body text.
 * @param {string} [props.type="success"] - The category of toast: "success", "error", "info".
 * @param {number} [props.duration=4000] - Lifespan of the toast in milliseconds before auto-dismissal.
 * @param {function} props.onClose - Callback triggered when the toast is closed/expired.
 */
export default function Toast({ message, type = "success", duration = 4000, onClose }) {
  useEffect(() => {
    if (!duration || !onClose) return;
    
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const typeConfig = {
    success: {
      bgColor: "bg-emerald-50",
      borderColor: "border-emerald-200",
      textColor: "text-emerald-800",
      iconColor: "text-emerald-500",
      icon: <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
    },
    error: {
      bgColor: "bg-rose-50",
      borderColor: "border-rose-200",
      textColor: "text-rose-800",
      iconColor: "text-rose-500",
      icon: <AlertTriangle className="w-5 h-5 flex-shrink-0" />
    },
    info: {
      bgColor: "bg-sky-50",
      borderColor: "border-sky-200",
      textColor: "text-sky-800",
      iconColor: "text-sky-500",
      icon: <Info className="w-5 h-5 flex-shrink-0" />
    }
  };

  const config = typeConfig[type] || typeConfig.success;

  return (
    <div 
      className={`fixed bottom-5 right-5 z-50 flex items-center max-w-md p-4 rounded-xl border shadow-lg ${config.bgColor} ${config.borderColor} ${config.textColor} animate-slide-in`}
      role="alert"
      id="notification-toast"
    >
      <div className={`mr-3 ${config.iconColor}`} id="toast-icon">
        {config.icon}
      </div>
      
      <div className="text-sm font-medium mr-8 leading-snug" id="toast-message">
        {message}
      </div>

      <button 
        onClick={onClose}
        className="absolute top-1/2 -translate-y-1/2 right-3 p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-black/5 transition-colors"
        aria-label="Dismiss notification"
        id="toast-close-button"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
