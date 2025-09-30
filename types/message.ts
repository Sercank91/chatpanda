// Normale Nachricht (Global Chat)
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

// Systemnachricht (Global Chat)
export type SystemMessage = {
  id: string;
  username: "System";
  content: string;
  type: "system";
  created_at: string;
  room: string;
  user_id: string;
  gender: string;
};

// Private Nachricht (1:1 Chat)
export type PrivateMessage = {
  from: string;
  text: string;
  type?: "user" | "system";
};

// Union für alle Chats
export type Message = UserMessage | SystemMessage | PrivateMessage;
