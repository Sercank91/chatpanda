"use client";
import { useEffect, useState } from "react";
import ChatFeed from "@/components/chatpanda/ChatFeed";
import ChatInput from "@/components/chatpanda/ChatInput";
import ChatRoom from "./ChatRoom";

export default function ChatpandaPage() {
  const [nickname, setNickname] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [showUsers, setShowUsers] = useState(false);

  useEffect(() => {
    setNickname(localStorage.getItem("chatpanda_nickname"));
    setGender(localStorage.getItem("chatpanda_gender"));
  }, []);

  if (!nickname || !gender) {
    return (
      <div className="flex min-h-screen items-center justify-center text-red-500">
        Kein Nickname gefunden. Bitte gehe zurück zur Startseite.
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Top bar with nickname on right */}
      <div className="border-b px-4 py-3 flex justify-between items-center sm:justify-end">
        {/* Mobile toggle button */}
        <button 
          className="sm:hidden bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          onClick={() => setShowUsers(!showUsers)}
        >
          Users ({showUsers ? 'Hide' : 'Show'})
        </button>
        <span className="text-sm text-gray-700 font-medium">Hello, {nickname}</span>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Left side: Chat messages (main area) */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-hidden">
            <ChatFeed />
          </div>
        </div>

        {/* Right side: Online users (desktop only) */}
        <div className="hidden sm:flex w-80 border-l bg-gray-50/50">
          <div className="w-full">
            <ChatRoom room="global" />
          </div>
        </div>
      </div>

      {/* Mobile: Users overlay */}
      {showUsers && (
        <div className="fixed inset-0 bg-white z-50 flex flex-col sm:hidden">
          <div className="bg-white border-b px-4 py-3 flex justify-between items-center shadow-sm">
            <h2 className="font-semibold text-gray-900">Online Users</h2>
            <button 
              onClick={() => setShowUsers(false)}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Back to Chat
            </button>
          </div>
          <div className="flex-1 overflow-hidden">
            <ChatRoom room="global" />
          </div>
        </div>
      )}

      {/* Fixed chat input at bottom */}
      <div className="border-t bg-white shadow-lg">
        <ChatInput room="global" />
      </div>
    </div>
  );
}