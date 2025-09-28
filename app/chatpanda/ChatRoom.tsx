// app/chatpanda/ChatRoom.tsx
"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browser";

type OnlineUser = {
  nickname: string;
  gender: string;
  online_at: string;
};

export default function ChatRoom({ room }: { room: string }) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const nickname = localStorage.getItem("chatpanda_nickname") || "Gast";
    const gender = localStorage.getItem("chatpanda_gender") || "u";

    const channel = supabase.channel(`room:${room}`, {
      config: { presence: { key: nickname } },
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

    // 🔹 Log bei Join/Leave
    channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
      console.log("JOIN:", key, newPresences);
    });
    channel.on("presence", { event: "leave" }, ({ key, leftPresences }) => {
      console.log("LEAVE:", key, leftPresences);
    });

    // 🔹 Sync: State komplett neu setzen
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      console.log("Presence raw state:", state);

      const users: OnlineUser[] = [];
      Object.keys(state).forEach((key) => {
        const presences = state[key] as any[];
        presences.forEach((p) => {
          users.push({
            nickname: p.nickname,
            gender: p.gender,
            online_at: p.online_at,
          });
        });
      });

      console.log("Online Users parsed:", users);
      setOnlineUsers(users);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [room]);

  return (
    <div className="bg-gray-900 p-4 rounded-lg">
      <h2 className="text-lg font-bold mb-2">👥 Online im Raum: {room}</h2>
      {onlineUsers.length === 0 ? (
        <p className="text-gray-400 text-sm">Niemand ist online.</p>
      ) : (
        <ul className="space-y-1">
          {onlineUsers.map((user, i) => (
            <li key={i} className="text-gray-300">
              <span className="font-semibold">{user.nickname}</span>{" "}
              <span className="text-gray-500 text-sm">({user.gender})</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
