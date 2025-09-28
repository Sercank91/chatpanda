"use client";
import { useEffect, useState, useRef } from "react";
import ChatFeed from "@/components/chatpanda/ChatFeed";
import ChatInput from "@/components/chatpanda/ChatInput";
import ChatRoom from "./ChatRoom";
import PrivateChatWindow from "@/components/chatpanda/PrivateChatWindow";

export default function ChatpandaPage() {
  const [nickname, setNickname] = useState<string | null>(null);
  const [gender, setGender] = useState<string | null>(null);
  const [showUsers, setShowUsers] = useState(false);

  // 🔹 Kontextmenü
  const [contextUser, setContextUser] = useState<string | null>(null);
  const [contextPos, setContextPos] = useState<{ x: number; y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // 🔹 Offene Privatchats
  const [privateChats, setPrivateChats] = useState<string[]>([]);

  useEffect(() => {
    setNickname(localStorage.getItem("chatpanda_nickname"));
    setGender(localStorage.getItem("chatpanda_gender"));
  }, []);

  // Klick außerhalb schließt Kontextmenü
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextUser(null);
        setContextPos(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
      {/* Top bar */}
      <div className="border-b px-4 py-3 flex justify-between items-center sm:justify-end">
        <button
          className="sm:hidden bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          onClick={() => setShowUsers(!showUsers)}
        >
          Users ({showUsers ? "Hide" : "Show"})
        </button>
        <span className="text-sm text-gray-700 font-medium">Hello, {nickname}</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex min-h-0">
        {/* Messages */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-hidden">
            <ChatFeed />
          </div>
        </div>

        {/* Online users (desktop) */}
        <div className="hidden sm:flex w-80 border-l bg-gray-50/50">
          <div className="w-full">
            <ChatRoom
              room="global"
              onUserClick={(user, pos) => {
                setContextUser(user);
                setContextPos(pos);
              }}
            />
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
            <ChatRoom
              room="global"
              onUserClick={(user, pos) => {
                setContextUser(user);
                setContextPos(pos);
              }}
            />
          </div>
        </div>
      )}

      {/* Chat input (fixed) */}
      <div className="border-t bg-white shadow-lg">
        <ChatInput room="global" />
      </div>

      {/* Kontextmenü */}
      {contextUser && contextPos && (
        <div
          ref={contextMenuRef}
          style={{ top: contextPos.y, left: contextPos.x }}
          className="fixed z-50 w-56 bg-gray-800 text-gray-100 shadow-xl rounded-md border border-gray-700"
        >
          <div className="bg-blue-600 text-white font-semibold px-3 py-2 rounded-t-md">
            Benutzer: {contextUser}
          </div>
          <ul className="divide-y divide-gray-700">
            <li className="px-3 py-2 hover:bg-gray-700 cursor-pointer">📊 Benutzer-Statistik</li>
            <li className="px-3 py-2 hover:bg-gray-700 cursor-pointer">🙋 Benutzer ansprechen</li>
            <li
              className="px-3 py-2 hover:bg-gray-700 cursor-pointer"
              onClick={() => {
                if (contextUser && !privateChats.includes(contextUser)) {
                  setPrivateChats((prev) => [...prev, contextUser]);
                }
                setContextUser(null); // Menü schließen
              }}
            >
              💬 Privatchat im Fenster
            </li>
            <li className="px-3 py-2 hover:bg-gray-700 cursor-pointer text-red-400">
              🚫 Nachrichten blockieren
            </li>
          </ul>
        </div>
      )}

      {/* Offene Privatchats → mehrere Fenster möglich */}
      {privateChats.map((user) => (
        <PrivateChatWindow
          key={user}
          user={user}
          onClose={() => setPrivateChats((prev) => prev.filter((u) => u !== user))}
        />
      ))}
    </div>
  );
}
