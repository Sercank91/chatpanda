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

// Systemnachricht (für Global Chat)
export type SystemMessage = {
  id: string;
  username: "System";
  content: string;
  type: "system";
  created_at: string;
  room: string;     // ⬅️ ergänzt
  user_id: string;  // ⬅️ ergänzt
  gender: string;   // ⬅️ ergänzt
};

// Union
export type Message = UserMessage | SystemMessage;
