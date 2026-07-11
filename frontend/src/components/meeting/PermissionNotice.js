"use client";

import React from "react";
import { AlertTriangle, X } from "lucide-react";

/**
 * Renders a clean, non-blocking, Zoom-style notice banner inside the meeting room
 * when camera or microphone devices fail to initialize.
 *
 * @param {object} props
 * @param {string} props.errorType - The standard Error name (e.g., "NotAllowedError", "NotFoundError", "NotReadableError")
 * @param {function} props.onDismiss - Handler to close/dismiss the banner.
 */
export default function PermissionNotice({ errorType, onDismiss }) {
  if (!errorType) return null;

  let message = "An error occurred while connecting to your camera or microphone.";
  let description = "You can still participate in the meeting via viewing other participants.";

  if (errorType === "NotAllowedError") {
    message = "Camera or microphone access was denied.";
    description = "You can continue with your camera off and microphone muted. Please check your browser permission settings to share media.";
  } else if (errorType === "NotFoundError") {
    message = "No camera or microphone was detected.";
    description = "You can continue without media. Please connect a webcam or recording device to share video and audio.";
  } else if (errorType === "NotReadableError") {
    message = "Your camera or microphone is currently unavailable.";
    description = "The device is already in use by another application. Please close other programs using your camera and try again.";
  } else if (errorType === "InsecureContext") {
    message = "Camera and microphone access require HTTPS or localhost.";
    description = "Web browsers block camera and microphone access in insecure HTTP environments. Please connect securely.";
  }

  return (
    <div 
      className="bg-amber-600/10 border-b border-amber-500/20 px-6 py-3 text-amber-200 text-xs md:text-sm font-medium flex items-start justify-between gap-4 transition-all"
      id="permission-notice-container"
    >
      <div className="flex gap-3" id="permission-notice-content">
        <AlertTriangle className="w-4 h-4 md:w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div id="permission-notice-text">
          <span className="font-extrabold text-amber-300 block mb-0.5">{message}</span>
          <span className="text-gray-300 font-medium">{description}</span>
        </div>
      </div>
      <button
        onClick={onDismiss}
        aria-label="Dismiss media notice"
        className="text-amber-400 hover:text-amber-200 transition-colors p-1 rounded-md hover:bg-white/5 cursor-pointer"
        id="btn-dismiss-permission-notice"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
