"use client";
import { useRef, useEffect } from "react";

type UserContextMenuProps = {
  user: string;
  position: { x: number; y: number };
  onClose: () => void;
  onPrivateChat: () => void;
};

export default function UserContextMenu({
  user,
  position,
  onClose,
  onPrivateChat,
}: UserContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Klick außerhalb → Menü schließen
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [onClose]);

  return (
    <div
      ref={menuRef}
      style={{ top: position.y, left: position.x }}
      className="absolute z-50 w-56 bg-gray-900 text-gray-100 shadow-xl rounded-md border border-gray-700"
    >
      <div className="bg-blue-600 text-white font-semibold px-3 py-2 rounded-t-md">
        Benutzer: {user}
      </div>
      <ul className="divide-y divide-gray-700">
        <li className="px-3 py-2 hover:bg-gray-800 cursor-pointer">
          📊 Benutzer-Statistik
        </li>
        <li className="px-3 py-2 hover:bg-gray-800 cursor-pointer">
          🙋 Benutzer ansprechen
        </li>
        <li
          className="px-3 py-2 hover:bg-gray-800 cursor-pointer"
          onClick={() => {
            onPrivateChat();
            onClose();
          }}
        >
          💬 Privatchat im Fenster
        </li>
        <li className="px-3 py-2 hover:bg-gray-800 cursor-pointer text-red-400">
          🚫 Nachrichten blockieren
        </li>
      </ul>
    </div>
  );
}
