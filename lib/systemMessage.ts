// lib/systemMessage.ts

// Für Private Chats
export function createPrivateSystemMessage(text: string) {
  return {
    from: "System",
    text,
    type: "system" as const,
  };
}

// Für Global Chat
export function createGlobalSystemMessage(content: string) {
  return {
    id: `sys-${Date.now()}`,
    username: "System",
    content,
    type: "system" as const,
    created_at: new Date().toISOString(),
  };
}

// ✅ Generische Variante für API-Routen
export function createSystemMessage(content: string) {
  return {
    id: `sys-${Date.now()}`,
    username: "System",
    content,
    type: "system" as const,
    created_at: new Date().toISOString(),
  };
}
