import React, { memo } from 'react';
import { Cell as CellType, CellState } from '../types';

interface CellProps {
  cell: CellType;
  onClick: (row: number, col: number) => void;
  onContextMenu: (e: React.MouseEvent, row: number, col: number) => void;
  isGameOver: boolean;
  highlight?: boolean;
}

const getNumberColor = (count: number) => {
  switch (count) {
    case 1: return 'text-blue-500';
    case 2: return 'text-green-500';
    case 3: return 'text-red-500';
    case 4: return 'text-purple-500';
    case 5: return 'text-yellow-600';
    case 6: return 'text-teal-500';
    case 7: return 'text-gray-900';
    case 8: return 'text-gray-500';
    default: return 'text-gray-300';
  }
};

const Cell: React.FC<CellProps> = memo(({ cell, onClick, onContextMenu, isGameOver, highlight }) => {
  
  const handleMouseDown = (e: React.MouseEvent) => {
    // Only allow primary click here, context menu handled separately
    if (e.button === 0) {
      onClick(cell.row, cell.col);
    }
  };

  const getContent = () => {
    if (cell.state === CellState.FLAGGED) {
      return <span className="text-red-500 text-lg">🚩</span>;
    }
    if (cell.state === CellState.REVEALED) {
      if (cell.isMine) {
        return <span className="text-xl">💣</span>;
      }
      return cell.neighborMines > 0 ? cell.neighborMines : '';
    }
    // If hidden but game over and it's a mine, show it (dimmed)
    if (isGameOver && cell.isMine && cell.state === CellState.HIDDEN) {
      return <span className="opacity-50 text-xl">💣</span>;
    }
    return '';
  };

  const getBackground = () => {
    if (cell.state === CellState.REVEALED) {
      if (cell.isMine) return 'bg-red-500/20 border-red-900/30';
      return 'bg-slate-700 border-slate-600'; // Revealed empty
    }
    if (highlight) {
      return 'bg-yellow-500/50 border-yellow-300 animate-pulse';
    }
    return 'bg-slate-500 hover:bg-slate-400 border-slate-300 border-b-slate-600 border-r-slate-600 border-t-slate-400 border-l-slate-400'; // 3D effect for hidden
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      onContextMenu={(e) => onContextMenu(e, cell.row, cell.col)}
      className={`
        w-8 h-8 sm:w-10 sm:h-10 
        flex items-center justify-center 
        cursor-pointer font-bold select-none transition-colors duration-75
        border-2
        ${getBackground()}
        ${cell.state === CellState.REVEALED ? getNumberColor(cell.neighborMines) : ''}
      `}
      role="button"
      aria-label={`Cell at row ${cell.row}, column ${cell.col}, ${cell.state}`}
    >
      {getContent()}
    </div>
  );
});

export default Cell;