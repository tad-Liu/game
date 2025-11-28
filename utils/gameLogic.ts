import { Board, Cell, CellState, Difficulty } from '../types';

// Directions for neighbor checking (top, top-right, right, etc.)
const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
];

export const createEmptyBoard = (rows: number, cols: number): Board => {
  const board: Board = [];
  for (let r = 0; r < rows; r++) {
    const row: Cell[] = [];
    for (let c = 0; c < cols; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        state: CellState.HIDDEN,
        neighborMines: 0,
      });
    }
    board.push(row);
  }
  return board;
};

export const placeMines = (
  board: Board,
  difficulty: Difficulty,
  firstClickRow: number,
  firstClickCol: number
): Board => {
  const newBoard = [...board.map(row => [...row.map(cell => ({ ...cell }))])];
  let minesPlaced = 0;
  const { rows, cols, mines } = difficulty;

  while (minesPlaced < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);

    // Don't place mine on the first clicked cell or its neighbors (to ensure start opening)
    const isFirstClickArea = 
      Math.abs(r - firstClickRow) <= 1 && Math.abs(c - firstClickCol) <= 1;

    if (!newBoard[r][c].isMine && !isFirstClickArea) {
      newBoard[r][c].isMine = true;
      minesPlaced++;
    }
  }

  // Calculate neighbor counts
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!newBoard[r][c].isMine) {
        let count = 0;
        DIRECTIONS.forEach(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && newBoard[nr][nc].isMine) {
            count++;
          }
        });
        newBoard[r][c].neighborMines = count;
      }
    }
  }

  return newBoard;
};

export const revealCell = (board: Board, row: number, col: number): { board: Board; gameOver: boolean; win: boolean } => {
  const newBoard = [...board.map(r => [...r.map(c => ({ ...c }))])];
  const cell = newBoard[row][col];

  if (cell.state !== CellState.HIDDEN) {
    return { board: newBoard, gameOver: false, win: false };
  }

  if (cell.isMine) {
    cell.state = CellState.REVEALED;
    // Reveal all mines
    newBoard.forEach(r => r.forEach(c => {
      if (c.isMine) c.state = CellState.REVEALED;
    }));
    return { board: newBoard, gameOver: true, win: false };
  }

  // Flood fill
  const stack = [[row, col]];
  while (stack.length > 0) {
    const [currR, currC] = stack.pop()!;
    const currCell = newBoard[currR][currC];

    if (currCell.state !== CellState.HIDDEN) continue;

    currCell.state = CellState.REVEALED;

    if (currCell.neighborMines === 0) {
      DIRECTIONS.forEach(([dr, dc]) => {
        const nr = currR + dr;
        const nc = currC + dc;
        if (
          nr >= 0 && nr < newBoard.length &&
          nc >= 0 && nc < newBoard[0].length &&
          newBoard[nr][nc].state === CellState.HIDDEN
        ) {
          stack.push([nr, nc]);
        }
      });
    }
  }

  // Check win
  const isWin = checkWin(newBoard);
  return { board: newBoard, gameOver: false, win: isWin };
};

export const toggleFlag = (board: Board, row: number, col: number): Board => {
  const newBoard = [...board.map(r => [...r.map(c => ({ ...c }))])];
  const cell = newBoard[row][col];

  if (cell.state === CellState.HIDDEN) {
    cell.state = CellState.FLAGGED;
  } else if (cell.state === CellState.FLAGGED) {
    cell.state = CellState.HIDDEN;
  }
  return newBoard;
};

const checkWin = (board: Board): boolean => {
  for (let r = 0; r < board.length; r++) {
    for (let c = 0; c < board[0].length; c++) {
      const cell = board[r][c];
      if (!cell.isMine && cell.state !== CellState.REVEALED) {
        return false;
      }
    }
  }
  return true;
};
