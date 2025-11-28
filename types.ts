export enum CellState {
  HIDDEN = 'HIDDEN',
  REVEALED = 'REVEALED',
  FLAGGED = 'FLAGGED',
}

export interface Cell {
  row: number;
  col: number;
  isMine: boolean;
  state: CellState;
  neighborMines: number;
}

export type Board = Cell[][];

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  WON = 'WON',
  LOST = 'LOST',
}

export interface Difficulty {
  name: string;
  rows: number;
  cols: number;
  mines: number;
}

export interface AIHint {
  row: number;
  col: number;
  action: 'reveal' | 'flag';
  reasoning: string;
}

export const DIFFICULTIES: Record<string, Difficulty> = {
  BEGINNER: { name: 'Beginner', rows: 9, cols: 9, mines: 10 },
  INTERMEDIATE: { name: 'Intermediate', rows: 16, cols: 16, mines: 40 },
  EXPERT: { name: 'Expert', rows: 16, cols: 30, mines: 99 },
};