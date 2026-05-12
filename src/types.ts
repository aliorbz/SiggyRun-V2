
export type GameState = 'START' | 'PLAYING' | 'GAMEOVER';

export interface Point {
  x: number;
  y: number;
}

export interface Entity extends Point {
  width: number;
  height: number;
  type: 'PLAYER' | 'HAT' | 'BOOK' | 'ELIXIR' | 'BIRD';
}

export interface Particle extends Point {
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  date: string;
}
