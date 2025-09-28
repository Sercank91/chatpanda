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

export default function ChatRoom({ room }: { room: string }) {
  const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);

  useEffect(() => {
    const nickname = localStorage.getItem("chatpanda_nickname") || "Gast";
    const gender = localStorage.getItem("chatpanda_gender") || "u";

    // Realtime Presence Channel
    const channel = supabase.channel(`room:${room}`, {
      config: { presence: { key: nickname } },
    });

    // 🔹 join & leave Logs für Debug
    channel.on("presence", { event: "join" }, ({ key, newPresences }) => {
      console.log("JOIN:", key, newPresences);
    });

    channel.on("presence", { event: "leave" }, ({ key, leftPresences }) => {
      console.log("LEAVE:", key, leftPresences);
    });

    // Presence Sync → Liste der User holen
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      console.log("Presence raw state:", state); // 🔹 Debug

      const users: OnlineUser[] = [];
      Object.values(state).forEach((arr) => {
        (arr as unknown as OnlineUser[]).forEach((user) => {
          if (user.nickname) {
            users.push({
              nickname: user.nickname,
              gender: user.gender || "u",
              online_at: user.online_at || new Date().toISOString(),
            });
          }
        });
      });

      console.log("Online Users parsed:", users); // 🔹 Debug
      setOnlineUsers(users);
    });

    // 🔹 KORRIGIERT: subscribe + track
    channel.subscribe().then(async (status) => {
      console.log("Channel Status:", status);
      if (status === "SUBSCRIBED") {
        await channel.track({
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
