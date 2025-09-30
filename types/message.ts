// types/message.ts

// Normale Nachricht
export type UserMessage = {
  id: string;
  room: string;
  user_id: string;
  username: string;
  content: string;
  gender: string;
  type?: "user";
  created_at: string;
  isLocalFail?: boolean;
};

// Systemnachricht
export type SystemMessage = {
  id: string;
  username: "System";
  content: string;
  type: "system";
  created_at: string;
};

// Union
export type Message = UserMessage | SystemMessage;
