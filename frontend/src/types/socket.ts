export type Direction = 'north' | 'south' | 'east' | 'west';

export interface UserState {
  id: string;
  peerId?: string;
  x: number;
  y: number;
  room: string;
  isSitting: boolean;
  direction: Direction;
}

export interface ClientToServerEvents {
  join_room: (data: { room: string; peerId?: string; x?: number; y?: number }) => void;
  move: (data: { x: number; y: number; direction?: Direction }) => void;
  toggle_sit: (data: { isSitting: boolean; x?: number; y?: number }) => void;
  register_peer: (peerId: string) => void;
}

export interface ServerToClientEvents {
  state_update: (users: Record<string, UserState>) => void;
  user_joined: (user: UserState) => void;
  user_left: (socketId: string) => void;
}
