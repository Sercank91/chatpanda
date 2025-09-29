// app/chatpanda/ChatRoom.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browser";

// 🔹 Typ für Online-User
type OnlineUser = {
  nickname: string;
  gender: string;
  online_at: string;
};

// 🔹 Mapping für Geschlecht
const genderMap: Record<string, { icon: string; color: string }> = {
  m: { icon: "♂️", color: "text-blue-400" },
  w: { icon: "♀️", color: "text-pink-400" },
  d: { icon: "⚧", color: "text-purple-400" },
  u: { icon: "?", color: "text-gray-400" }, // fallback für unbekannt
};

// 🔹 Props erweitert um onUserClick
export default function ChatRoom({
  room,
  onUserClick,
}: {
  room: string;
  onUserClick?: (user: string, pos: { x: number; y: number }) => void;
}) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const nickname = localStorage.getItem("chatpanda_nickname") || "Gast";
    const gender = localStorage.getItem("chatpanda_gender") || "u";

    const channel = supabase.channel(`room:${room}`, {
      config: { presence: { key: nickname } },
    });

    channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
      console.log("JOIN:", key, newPresences);
    });

    channel.on("presence", { event: "leave" }, ({ key, leftPresences }) => {
      console.log("LEAVE:", key, leftPresences);
    });

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      console.log("Presence raw state:", state);

      const users: OnlineUser[] = [];
      Object.values(state).forEach((arr) => {
        (arr as unknown as OnlineUser[]).forEach((user: OnlineUser) => {
          if (user.nickname) {
            users.push({
              nickname: user.nickname,
              gender: user.gender ?? "u",
              online_at: user.online_at ?? new Date().toISOString(),
            });
          }
        });
      });

      console.log("Online Users parsed:", users);
      setOnlineUsers(users);
    });

    channel.subscribe((status) => {
      console.log("Channel Status:", status);
      if (status === "SUBSCRIBED") {
        channel.track({
          nickname,
          gender,
          online_at: new Date().toISOString(),
        });
        console.log("Tracking gestartet:", nickname);
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [room]);

  return (
    <div className="bg-gray-900 p-4 rounded-lg relative">
      <h2 className="text-lg font-bold mb-2">👥 Online im Raum: {room}</h2>
      {onlineUsers.length === 0 ? (
        <p className="text-gray-400 text-sm">Niemand ist online.</p>
      ) : (
        <ul className="space-y-1">
          {onlineUsers.map((user, i) => {
            const g = genderMap[user.gender] || genderMap["u"];
            return (
              <li
                key={i}
                className="flex items-center gap-2 text-gray-300 cursor-pointer hover:text-blue-400"
                onClick={(e) => {
                  e.preventDefault();
                  if (onUserClick) {
                    onUserClick(user.nickname, {
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }
                }}
              >
                {/* Links: Geschlecht */}
                <span className={`${g.color} w-5 text-center inline-block`}>{g.icon}</span>
                {/* Rechts: Nickname */}
                <span className="font-semibold">{user.nickname}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
