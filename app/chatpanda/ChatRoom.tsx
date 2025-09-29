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

    // 🔹 Präsenz-Änderungen überwachen
    channel.on("presence", { event: "sync" }, async () => {
      const state = channel.presenceState();
      const users: OnlineUser[] = [];

      Object.values(state).forEach((arr) => {
        (arr as unknown as OnlineUser[]).forEach((user) => {
          if (user.nickname) {
            users.push({
              nickname: user.nickname,
              gender: user.gender ?? "u",
              online_at: user.online_at ?? new Date().toISOString(),
            });
          }
        });
      });

      // 🔹 Unterschiede berechnen
      const oldNames = new Set(onlineUsers.map((u) => u.nickname));
      const newNames = new Set(users.map((u) => u.nickname));

      // 👉 Neue User = "ist dem Raum beigetreten"
      for (const u of users) {
        if (!oldNames.has(u.nickname) && u.nickname !== nickname) {
          await supabase.from("messages").insert({
            room,
            username: "System",
            content: `${u.nickname} ist dem Raum beigetreten.`,
            type: "system",
          });
        }
      }

      // 👉 Entfernte User = "hat den Raum verlassen"
      for (const u of onlineUsers) {
        if (!newNames.has(u.nickname) && u.nickname !== nickname) {
          await supabase.from("messages").insert({
            room,
            username: "System",
            content: `${u.nickname} hat den Raum verlassen.`,
            type: "system",
          });
        }
      }

      setOnlineUsers(users);
    });

    // 🔹 Beitritt + eigene Willkommensnachricht
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        channel.track({
          nickname,
          gender,
          online_at: new Date().toISOString(),
        });

        // nur der eigene Client bekommt diese Willkommensnachricht
        await supabase.from("messages").insert({
          room,
          username: "System",
          content: `Herzlich Willkommen im Chatpanda, ${nickname}!`,
          type: "system",
        });
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [room, onlineUsers]);

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
                <span className={`${g.color} w-5 text-center inline-block`}>
                  {g.icon}
                </span>
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
