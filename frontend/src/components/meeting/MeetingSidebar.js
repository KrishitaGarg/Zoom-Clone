"use client";

import React from "react";
import { MessageSquare, Users, X } from "lucide-react";
import ParticipantsPanel from "./ParticipantsPanel";
import ChatPanel from "./ChatPanel";

/** Shared Zoom-style right sidebar: one active tab at a time. */
export default function MeetingSidebar({
  activeTab, onSelectTab, onClose, participants, currentParticipant,
  onMuteAll, onRemoveParticipant, isMuteAllLoading, messages,
  currentParticipantId, onSendChat, unreadChatCount,
}) {
  return (
    <aside className="w-full h-full bg-[#1a1a1a] flex flex-col text-white" id="meeting-sidebar-root">
      <header className="h-12 shrink-0 border-b border-white/10 flex items-center px-2" id="meeting-sidebar-tabs">
        <button onClick={() => onSelectTab("participants")} className={`h-full px-3 inline-flex items-center gap-1.5 text-xs font-medium border-b-2 ${activeTab === "participants" ? "border-[#2d8cff] text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
          <Users className="w-4 h-4" /> Participants <span className="text-[10px] text-gray-400">({participants.length})</span>
        </button>
        <button onClick={() => onSelectTab("chat")} className={`relative h-full px-3 inline-flex items-center gap-1.5 text-xs font-medium border-b-2 ${activeTab === "chat" ? "border-[#2d8cff] text-white" : "border-transparent text-gray-400 hover:text-white"}`}>
          <MessageSquare className="w-4 h-4" /> Chat
          {unreadChatCount > 0 && <span className="min-w-4 h-4 px-1 rounded-full bg-[#e02828] text-[9px] leading-4 text-center font-bold">{unreadChatCount > 99 ? "99+" : unreadChatCount}</span>}
        </button>
        <button onClick={onClose} className="ml-auto p-2 text-gray-400 hover:text-white" aria-label="Close sidebar" title="Close sidebar">
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 min-h-0">
        {activeTab === "participants" ? (
          <ParticipantsPanel
            embedded
            participants={participants}
            currentParticipant={currentParticipant}
            onMuteAll={onMuteAll}
            onRemoveParticipant={onRemoveParticipant}
            isMuteAllLoading={isMuteAllLoading}
          />
        ) : (
          <ChatPanel embedded messages={messages} currentParticipantId={currentParticipantId} onSend={onSendChat} />
        )}
      </div>
    </aside>
  );
}
