"use client";

import React, { useEffect, useRef, useState } from "react";
import { Send, X } from "lucide-react";

/** In-memory, meeting-scoped chat panel backed by the existing room WebSocket. */
export default function ChatPanel({ messages = [], currentParticipantId, onSend, onClose }) {
  const [draft, setDraft] = useState("");
  const latestMessageRef = useRef(null);

  useEffect(() => {
    latestMessageRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  const submit = (event) => {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    onSend(text);
    setDraft("");
  };

  return (
    <aside className="w-full md:w-80 bg-[#1a1a1a] border-l border-white/10 flex flex-col h-full text-white z-10" id="chat-panel-root">
      <header className="h-12 px-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="text-sm font-semibold">Meeting Chat</h2>
        <button onClick={onClose} className="p-1 text-gray-400 hover:text-white" aria-label="Close chat" title="Close chat">
          <X className="w-4 h-4" />
        </button>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-3" id="chat-message-list">
        {messages.length === 0 ? (
          <p className="text-xs text-gray-500 text-center pt-4">No messages yet</p>
        ) : messages.map((chatMessage, index) => {
          const isMine = chatMessage.sender_id === Number(currentParticipantId);
          const timestamp = new Date(chatMessage.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
          return (
            <div key={`${chatMessage.timestamp}-${chatMessage.sender_id}-${index}`} className="text-xs leading-relaxed">
              <div className="flex items-baseline gap-2">
                <span className={isMine ? "font-semibold text-[#5da5ff]" : "font-semibold text-gray-200"}>{isMine ? "You" : chatMessage.sender_name}</span>
                <span className="text-[10px] text-gray-500">{timestamp}</span>
              </div>
              <p className="mt-0.5 text-gray-300 break-words">{chatMessage.message}</p>
            </div>
          );
        })}
        <div ref={latestMessageRef} />
      </div>

      <form onSubmit={submit} className="p-3 border-t border-white/10 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) submit(event);
          }}
          rows={1}
          maxLength={1000}
          placeholder="Type a message..."
          className="flex-1 resize-none bg-[#252527] border border-white/10 px-2.5 py-2 text-xs text-white placeholder:text-gray-500 outline-none focus:border-[#2d8cff]"
          aria-label="Chat message"
        />
        <button type="submit" disabled={!draft.trim()} className="p-2 text-[#5da5ff] hover:text-white disabled:text-gray-600 transition-colors" aria-label="Send message" title="Send message">
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
}
