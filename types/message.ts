// types/message.ts
export type Message = {
  id: string;
  room: string;
  user_id: string;
  username: string;
  content: string;
  gender: string;
  type?: "system" | "user";
  created_at: string;
};
