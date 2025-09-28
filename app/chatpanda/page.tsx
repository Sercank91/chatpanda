"use client";
import { useEffect, useState } from "react";
import ChatFeed from "@/components/chatpanda/ChatFeed";
import ChatInput from "@/components/chatpanda/ChatInput";
import ChatRoom from "./ChatRoom";
import { Users, X, MessageCircle } from "lucide-react";

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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-center p-8 rounded-2xl bg-slate-800/50 backdrop-blur-xl border border-slate-700/50 shadow-2xl">
          <MessageCircle className="w-16 h-16 text-purple-400 mx-auto mb-4" />
          <p className="text-red-400 text-lg font-medium">
            Kein Nickname gefunden. Bitte gehe zurück zur Startseite.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      {/* Elegant top bar */}
      <div className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4 flex justify-between items-center shadow-lg">
        {/* Mobile toggle button */}
        <button 
          className="sm:hidden group flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg hover:shadow-purple-500/25 hover:scale-105"
          onClick={() => setShowUsers(!showUsers)}
        >
          <Users className="w-4 h-4 transition-transform group-hover:scale-110" />
          <span className="hidden xs:inline">Users</span>
          <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs ml-1">
            {showUsers ? 'Hide' : 'Show'}
          </span>
        </button>

        {/* Welcome message */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-slate-300">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm">Online</span>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-400">Welcome back</div>
            <div className="font-semibold text-white bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">
              {nickname}
            </div>
          </div>
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-500 rounded-full flex items-center justify-center font-bold text-white shadow-lg">
            {nickname.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 flex min-h-0">
        {/* Left side: Chat messages */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          {/* Chat background pattern */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(120,119,198,0.3),transparent_50%)]"></div>
            <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_49%,rgba(255,255,255,0.03)_50%,transparent_51%)] bg-[length:20px_20px]"></div>
          </div>
          
          <div className="flex-1 overflow-hidden relative z-10 p-4">
            <div className="h-full bg-slate-800/30 backdrop-blur-sm rounded-2xl border border-slate-700/30 shadow-2xl overflow-hidden">
              <ChatFeed />
            </div>
          </div>
        </div>

        {/* Right side: Online users (desktop only) */}
        <div className="hidden sm:flex w-80 relative">
          <div className="w-full p-4">
            <div className="h-full bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
              <div className="p-4 border-b border-slate-700/50 bg-slate-700/30">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-purple-400" />
                  <h2 className="font-semibold text-white">Online Users</h2>
                  <div className="ml-auto w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="flex-1 overflow-hidden">
                <ChatRoom room="global" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Users overlay */}
      {showUsers && (
        <div className="fixed inset-0 bg-slate-900/95 backdrop-blur-xl z-50 flex flex-col sm:hidden animate-in slide-in-from-right duration-300">
          <div className="bg-slate-800/80 backdrop-blur-xl border-b border-slate-700/50 px-6 py-4 flex justify-between items-center shadow-lg">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-purple-400" />
              <h2 className="font-semibold text-white text-lg">Online Users</h2>
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            </div>
            <button 
              onClick={() => setShowUsers(false)}
              className="group flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg hover:scale-105"
            >
              <X className="w-4 h-4 transition-transform group-hover:rotate-90" />
              <span>Close</span>
            </button>
          </div>
          <div className="flex-1 overflow-hidden p-4">
            <div className="h-full bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-2xl overflow-hidden">
              <ChatRoom room="global" />
            </div>
          </div>
        </div>
      )}

      {/* Fixed chat input at bottom */}
      <div className="border-t border-slate-700/50 bg-slate-800/80 backdrop-blur-xl shadow-2xl">
        <div className="p-4">
          <div className="bg-slate-700/50 backdrop-blur-sm rounded-2xl border border-slate-600/50 shadow-xl overflow-hidden hover:border-purple-500/50 transition-all duration-300">
            <ChatInput room="global" />
          </div>
        </div>
      </div>
    </div>
  );
}