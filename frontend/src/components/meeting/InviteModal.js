"use client";

import React, { useState, useEffect } from "react";
import { X, Copy, Check, Share2, Info } from "lucide-react";

/**
 * Zoom-inspired overlay dialog allowing users to copy shareable links and IDs.
 *
 * @param {object} props
 * @param {boolean} props.isOpen - Display trigger.
 * @param {function} props.onClose - Dismiss trigger.
 * @param {object} props.meeting - Active meeting details.
 */
export default function InviteModal({ isOpen, onClose, meeting }) {
  const [copied, setCopied] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !meeting) return null;

  // Generate clean shareable link without exposing participantId
  const inviteUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/meeting/${meeting.public_meeting_id}` 
    : "";

  const inviteText = `You are invited to ${meeting.title}

Meeting ID:
${meeting.public_meeting_id}

Join:
${inviteUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(inviteText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Clipboard write failure:", err);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs transition-opacity"
      id="invite-modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-md bg-[#242424] border border-white/5 rounded-2xl shadow-2xl p-6 text-white space-y-5 animate-in fade-in zoom-in-95 duration-150"
        id="invite-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="invite-modal-title"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-3" id="invite-modal-header">
          <div className="flex items-center gap-2" id="invite-modal-title-group">
            <Share2 className="w-5 h-5 text-[#2D8CFF]" />
            <h2 className="text-lg font-bold text-gray-100" id="invite-modal-title">
              Invite Participants
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close invitation modal"
            className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-all cursor-pointer"
            id="btn-close-invite-modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Meeting Credentials info */}
        <div className="space-y-3 bg-black/20 p-4 rounded-xl border border-white/5 text-sm text-gray-300" id="invite-meeting-info">
          <div id="invite-title-line">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Topic</span>
            <span className="text-sm font-bold text-gray-200">{meeting.title}</span>
          </div>
          <div className="grid grid-cols-2 gap-4" id="invite-grid">
            <div id="invite-id-line">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Meeting ID</span>
              <span className="font-mono font-bold text-gray-200">{meeting.public_meeting_id}</span>
            </div>
            <div id="invite-type-line">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Type</span>
              <span className="text-xs font-bold text-gray-300 capitalize">{meeting.meeting_type}</span>
            </div>
          </div>
        </div>

        {/* Invite URL Display Block */}
        <div className="space-y-1.5" id="invite-link-block">
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Invite Link</label>
          <div className="flex gap-2" id="invite-input-row">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-gray-300 font-mono outline-none focus:border-[#2D8CFF]"
              id="invite-link-input"
              onClick={(e) => e.target.select()}
            />
            <button
              onClick={handleCopy}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                copied 
                  ? "bg-emerald-600/20 text-emerald-400 border-emerald-500/20" 
                  : "bg-[#2D8CFF] hover:bg-[#1A73E8] text-white border-transparent"
              }`}
              id="btn-copy-invite"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          </div>
        </div>

        {/* educational callout */}
        <div className="flex items-start gap-2.5 bg-blue-500/5 p-3.5 rounded-xl border border-blue-500/10 text-xs text-blue-300 leading-relaxed" id="invite-notice-box">
          <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
          <p>
            Copying this invitation stores the formatted meeting credentials in your clipboard so you can share it with colleagues or guest participants.
          </p>
        </div>
      </div>
    </div>
  );
}
