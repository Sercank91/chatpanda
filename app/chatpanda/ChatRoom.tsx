"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/browser"; // 🔹 wichtig: den Client für den Browser importieren

// 🔹 Typ für Online-User, damit kein "any" mehr
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

    // Wenn der Channel verbunden ist → eigenen Status senden
    channel.subscribe(async (status) => {
      if (status === "SUBSCRIBED") {
        await channel.track({
          nickname,
          gender,
          online_at: new Date().toISOString(),
        });
      }
    });

    // Wenn sich die Presence-Liste ändert → aktualisieren
    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState();
      const users: OnlineUser[] = [];

      Object.values(state).forEach((arr) => {
        (arr as OnlineUser[]).forEach((user) => {
          users.push(user);
        });
      });

      setOnlineUsers(users);
    });

    return () => {
      channel.unsubscribe(); // Beim Verlassen des Chats wieder abmelden
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
