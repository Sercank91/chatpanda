import type { SystemMessage, PrivateMessage } from "@/types/message";

// Für Private Chats
export function createPrivateSystemMessage(text: string): PrivateMessage {
  return {
    from: "System",
    text,
    type: "system",
  };
}

// Für Global Chat
export function createGlobalSystemMessage(content: string): SystemMessage {
  return {
    id: `sys-${Date.now()}`,
    username: "System",
    content,
    type: "system",
    created_at: new Date().toISOString(),
    room: "global",
    user_id: "system",
    gender: "u",
  };
}

// ✅ Generische Variante für API-Routen (gleich wie Global)
export function createSystemMessage(content: string): SystemMessage {
  return {
    id: `sys-${Date.now()}`,
    username: "System",
    content,
    type: "system",
    created_at: new Date().toISOString(),
    room: "global",
    user_id: "system",
    gender: "u",
  };
}
