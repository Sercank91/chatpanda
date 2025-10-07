// core/Types.ts
export type User = {
  id: string;
  nickname: string;
  gender?: "m" | "w" | "d" | "u";
  online: boolean;
};

export type Message = {
  id: string;
  from: string;
  to?: string;
  text: string;
  created_at: string;
  system?: boolean;
};