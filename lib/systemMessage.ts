import type { Message } from "@/types/message";

export function createSystemMessage(content: string): Message {
  return {
    id: `sys-${Date.now()}`,
    room: "global",
    user_id: "system",
    username: "System",
    content,
    gender: "u",
    type: "system",
    created_at: new Date().toISOString(),
  };
}
