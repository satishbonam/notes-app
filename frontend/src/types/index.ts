// src/types/index.ts
export interface Note {
  id: string;
  title: string;
  content: string;
  ownerId?: string;
  sharedWith?: string[];
  is_owner?: boolean;
}

export interface User {
  id: string;
  email: string;
  name?: string;
}
