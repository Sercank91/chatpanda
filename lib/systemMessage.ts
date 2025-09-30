import type { SystemMessage } from "@/types/message";

// Private Chat Systemnachricht
export function createPrivateSystemMessage(text: string) {
  return {
    from: "System",
    text,
    type: "system" as const,
  };
}

// Global Chat Systemnachricht
export function createGlobalSystemMessage(content: string): SystemMessage {
  return {
    id: `sys-${Date.now()}`,
    username: "System",
    content,
    type: "system",
    created_at: new Date().toISOString(),
    room: "global",   // ⬅️ Pflichtfelder gefüllt
    user_id: "system",
    gender: "u",
  };
}

// Generische Variante für API-Routen
export function createSystemMessage(content: string): SystemMessage {
  return createGlobalSystemMessage(content); // ⬅️ Wiederverwendung
}
