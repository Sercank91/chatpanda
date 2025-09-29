// app/chatpanda/ChatRoom.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browser";
import { Smartphone } from "lucide-react";

type OnlineUser = {
  nickname: string;
  gender: string;
  online_at: string;
  device?: "mobile" | "desktop";
};

const genderMap: Record<string, { icon: string; color: string }> = {
  m: { icon: "♂️", color: "text-blue-400" },
  w: { icon: "♀️", color: "text-pink-400" },
  d: { icon: "⚧", color: "text-purple-400" },
  u: { icon: "?", color: "text-gray-400" },
};

export default function ChatRoom({
  room,
  onUserClick,
}: {
  room: string;
  onUserClick?: (user: string, pos: { x: number; y: number }) => void;
}) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
  const [welcomeSent, setWelcomeSent] = useState(false);

  useEffect(() => {
    const nickname = localStorage.getItem("chatpanda_nickname") || "Gast";
    const gender = localStorage.getItem("chatpanda_gender") || "u";
    const isMobile = /Mobi|Android/i.test(navigator.userAgent);

    const channel = supabase.channel(`room:${room}`, {
      config: { presence: { key: nickname } },
    });

    // Präsenz aktualisieren
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const users: OnlineUser[] = [];

      Object.values(state).forEach((arr) => {
        (arr as unknown as OnlineUser[]).forEach((user) => {
          if (user.nickname) {
            users.push({
              nickname: user.nickname,
              gender: user.gender ?? "u",
              online_at: user.online_at ?? new Date().toISOString(),
              device: user.device ?? "desktop",
            });
          }
        });
      });

      // 🔑 doppelte User rausfiltern
      const unique = users.filter(
        (u, idx, arr) => arr.findIndex((x) => x.nickname === u.nickname) === idx
      );

      setOnlineUsers(unique);
    });

    // subscribe + track
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        channel.track({
          nickname,
          gender,
          online_at: new Date().toISOString(),
          device: isMobile ? "mobile" : "desktop",
        });

        // Systemnachricht nur 1× pro Sitzung
        if (!welcomeSent) {
          const welcomeMsg = {
            id: `local-${Date.now()}`,
            room,
            username: "System",
            content: `Herzlich Willkommen im Chatpanda, ${nickname}!`,
            type: "system",
            created_at: new Date().toISOString(),
          };
          window.dispatchEvent(new CustomEvent("local-message", { detail: welcomeMsg }));
          setWelcomeSent(true);
        }
      }
    });

    return () => {
      channel.unsubscribe();
    };
  }, [room, welcomeSent]);

  const currentUser = localStorage.getItem("chatpanda_nickname") || "Gast";

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
                  // 🔑 Eigener User → nur Statistik
                  if (user.nickname === currentUser) {
                    if (onUserClick) {
                      onUserClick(user.nickname, {
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }
                    return;
                  }
                  if (onUserClick) {
                    onUserClick(user.nickname, {
                      x: e.clientX,
                      y: e.clientY,
                    });
                  }
                }}
              >
                <span className={`${g.color} w-5 text-center inline-block`}>
                  {g.icon}
                </span>
                <span className="font-semibold">{user.nickname}</span>
                {user.device === "mobile" && (
                  <Smartphone className="w-4 h-4 text-green-400 ml-1" />
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
