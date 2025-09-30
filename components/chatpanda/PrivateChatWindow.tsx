"use client";
import { useEffect, useState, useRef } from "react";
import { Rnd } from "react-rnd";
import { supabase } from "@/lib/supabase/browser";
import { createPrivateSystemMessage } from "@/lib/systemMessage";
import { Smile, AlertTriangle, Ban, Send } from "lucide-react";

type PrivateChatWindowProps = {
  user: string;
  onClose: () => void;
  initialMessages?: { from: string; text: string; gender?: "m" | "w" | "d" | "u" }[];
};

type Message = {
  from: string;
  text: string;
  gender?: "m" | "w" | "d" | "u";
  type?: "system" | "user";
};

export default function PrivateChatWindow({
  user,
  onClose,
  initialMessages = [],
}: PrivateChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [myNickname, setMyNickname] = useState("Ich");
  const [showSmileyBox, setShowSmileyBox] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const [cooldownUntil, setCooldownUntil] = useState<number>(0);

  // Nickname laden
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("chatpanda_nickname");
      setMyNickname(stored || "Ich");
    }
  }, []);

  // Initial Nachrichten
  useEffect(() => {
    if (initialMessages.length > 0) {
      setMessages(initialMessages.map((m) => ({ ...m, type: "user" })));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Realtime Subscription
  useEffect(() => {
    if (!myNickname || !user) return;

    const channel = supabase
      .channel(`dm:${myNickname}-${user}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "private_messages" },
        (payload) => {
          const m = payload.new as {
            from_nickname: string;
            to_nickname: string;
            message: string;
            gender?: "m" | "w" | "d" | "u";
          };

          const blockedRaw = localStorage.getItem("chatpanda_blocked");
          const blocked: string[] = blockedRaw ? JSON.parse(blockedRaw) : [];

          if (blocked.includes(m.from_nickname) || blocked.includes(m.to_nickname)) {
            return;
          }

          if (
            (m.from_nickname === user && m.to_nickname === myNickname) ||
            (m.from_nickname === myNickname && m.to_nickname === user)
          ) {
            setMessages((prev) => [
              ...prev,
              { from: m.from_nickname, text: m.message, gender: m.gender || "u", type: "user" },
            ]);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [myNickname, user]);

  // Scroll automatisch
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // -------------------------------------
  // Handle Send mit Gender
  // -------------------------------------
  async function handleSend() {
    if (!input.trim() || !myNickname || !user) return;

    const text = input.trim();
    setInput("");

    // 🔹 Gender aus localStorage laden
    const gender = (localStorage.getItem("chatpanda_gender") as "m" | "w" | "d" | "u") || "u";

    try {
      const sessionRes = await supabase.auth.getSession();
      const accessToken = sessionRes.data?.session?.access_token;

      const headers: Record<string, string> = { "Content-Type": "application/json" };
      const body: Record<string, string> = { to: user, message: text, gender };

      if (accessToken) {
        headers["Authorization"] = `Bearer ${accessToken}`;
      } else {
        body["from"] = myNickname;
      }

      const res = await fetch("/api/chatpanda/send-private", {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 429 && data.retry_after) {
          setCooldownUntil(Date.now() + data.retry_after * 1000);
        } else if (res.status === 403 || data.system) {
          setMessages((prev) => [
            ...prev,
            createPrivateSystemMessage(
              data.error || data.system?.content || "🚫 Nachricht konnte nicht zugestellt werden."
            ) as Message,
          ]);
        } else {
          console.error("❌ Fehler:", data.error || res.statusText);
        }
        return;
      }

      // 🔹 Sofort lokal anzeigen (Realtime kommt auch noch)
      setMessages((prev) => [...prev, { from: myNickname, text, gender, type: "user" }]);
    } catch (err: unknown) {
      console.error("🔥 Netzwerkfehler:", err);
      setMessages((prev) => [
        ...prev,
        createPrivateSystemMessage("Netzwerkfehler beim Senden.") as Message,
      ]);
    }
  }

  const now = Date.now();
  const cooldownActive = now < cooldownUntil;
  const cooldownSeconds = cooldownActive ? Math.ceil((cooldownUntil - now) / 1000) : 0;

  function addSmiley(smiley: string) {
    setInput((prev) => prev + " " + smiley);
    setShowSmileyBox(false);
  }

  return (
    <Rnd
      default={{ x: 100, y: 100, width: 500, height: 350 }}
      bounds="window"
      dragHandleClassName="header"
      cancel=".no-drag"
      enableResizing={false}
    >
      <div className="bg-gray-900 text-white rounded-lg shadow-xl border border-gray-700 h-full flex flex-col">
        {/* Header */}
        <div className="header cursor-move bg-blue-600 px-3 py-2 rounded-t-lg flex justify-between items-center">
          <span className="font-semibold">Privatchat mit {user}</span>
          <button
            onClick={onClose}
            className="no-drag text-white hover:text-red-400 px-2 py-1"
          >
            ✖
          </button>
        </div>

        {/* Nachrichtenbereich */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 text-sm relative">
          {messages.length === 0 && <p className="text-gray-400">Noch keine Nachrichten</p>}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`p-2 rounded text-left ${
                m.type === "system"
                  ? "bg-gray-900/70 text-yellow-300 italic"
                  : "bg-gray-800"
              }`}
            >
              {m.type === "system" ? (
                <span>{m.text}</span>
              ) : (
                <div className="flex items-center gap-1">
                  {m.gender === "m" && <span className="text-blue-400">♂️</span>}
                  {m.gender === "w" && <span className="text-pink-400">♀️</span>}
                  {m.gender === "d" && <span className="text-purple-400">⚧️</span>}
                  {(!m.gender || m.gender === "u") && <span className="text-gray-400">❔</span>}
                  <span className="font-semibold">{m.from}:</span>
                  <span>{m.text}</span>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />

          {/* Smiley Box */}
          {showSmileyBox && (
            <div className="absolute bottom-14 left-2 bg-gray-800 border border-gray-600 rounded-lg p-2 grid grid-cols-6 gap-2 text-lg">
              {["😀", "😂", "😍", "😎", "😢", "😡", "👍", "👎", "❤️", "🔥"].map((s) => (
                <button
                  key={s}
                  onClick={() => addSmiley(s)}
                  className="hover:bg-gray-700 rounded"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Eingabefeld + Buttons */}
        <div className="border-t border-gray-700 p-2 flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={cooldownActive ? `Warte ${cooldownSeconds}s` : "Nachricht..."}
            disabled={cooldownActive}
            className="flex-1 bg-gray-800 px-2 py-1 rounded text-sm focus:outline-none disabled:opacity-50"
          />

          {/* Smiley Button */}
          <button
            onClick={() => setShowSmileyBox((p) => !p)}
            className="no-drag p-2 rounded hover:bg-gray-700"
          >
            <Smile size={18} className="text-yellow-400" />
          </button>

          {/* Verstoß melden */}
          <button
            onClick={() => setShowReportModal(true)}
            className="no-drag p-2 rounded hover:bg-gray-700"
          >
            <AlertTriangle size={18} className="text-red-400" />
          </button>

          {/* Blockieren */}
          <button
            onClick={() => setShowBlockModal(true)}
            className="no-drag p-2 rounded hover:bg-gray-700"
          >
            <Ban size={18} className="text-red-500" />
          </button>

          {/* Senden */}
          <button
            onClick={handleSend}
            className={`ml-2 px-3 py-1 rounded text-sm flex items-center gap-1 ${
              cooldownActive
                ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            } no-drag`}
            disabled={cooldownActive}
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg w-96 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-red-400">
              <AlertTriangle size={20} /> Verstoß melden
            </h2>
            <p className="text-sm text-gray-300">
              Meldest du {user} wegen Spam, Belästigung oder Regelverstoß?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReportModal(false)}
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  alert(`🚨 Verstoß von ${user} gemeldet!`);
                }}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-500"
              >
                Melden
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Block Modal */}
      {showBlockModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-gray-900 text-white p-6 rounded-lg shadow-lg w-96 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2 text-red-500">
              <Ban size={20} /> Benutzer blockieren
            </h2>
            <p className="text-sm text-gray-300">
              Möchtest du {user} blockieren? Er kann dir dann keine Nachrichten mehr schicken.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowBlockModal(false)}
                className="px-3 py-1 rounded bg-gray-700 hover:bg-gray-600"
              >
                Abbrechen
              </button>
              <button
                onClick={() => {
                  setShowBlockModal(false);
                  alert(`🚫 {user} wurde blockiert!`);
                }}
                className="px-3 py-1 rounded bg-red-600 hover:bg-red-500"
              >
                Blockieren
              </button>
            </div>
          </div>
        </div>
      )}
    </Rnd>
  );
}
