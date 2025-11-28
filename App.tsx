import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Board, CellState, Difficulty, GameStatus, DIFFICULTIES, AIHint } from './types';
import { createEmptyBoard, placeMines, revealCell, toggleFlag } from './utils/gameLogic';
import Cell from './components/Cell';
import { getAIHint } from './services/geminiService';

// Icons
const RefreshIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>
);

const BrainIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/></svg>
);

const TrophyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-400"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>
);

const SkullIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500"><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><path d="M8 20v2h8v-2"/><path d="m12.5 17-.5-1-.5 1h1z"/><path d="M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20"/></svg>
);

const App: React.FC = () => {
  const [difficulty, setDifficulty] = useState<Difficulty>(DIFFICULTIES.BEGINNER);
  const [board, setBoard] = useState<Board>([]);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [flags, setFlags] = useState(0);
  const [timer, setTimer] = useState(0);
  const [isFirstClick, setIsFirstClick] = useState(true);
  const [gameMode, setGameMode] = useState<'dig' | 'flag'>('dig'); // For mobile
  const [hint, setHint] = useState<AIHint | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showLossModal, setShowLossModal] = useState(false);

  const timerRef = useRef<number | null>(null);

  // Initialize Game
  const initGame = useCallback((diff: Difficulty) => {
    setBoard(createEmptyBoard(diff.rows, diff.cols));
    setFlags(diff.mines);
    setStatus(GameStatus.IDLE);
    setTimer(0);
    setIsFirstClick(true);
    setHint(null);
    setShowWinModal(false);
    setShowLossModal(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  }, []);

  useEffect(() => {
    initGame(difficulty);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [difficulty, initGame]);

  useEffect(() => {
    if (status === GameStatus.PLAYING) {
      timerRef.current = window.setInterval(() => {
        setTimer((t) => t + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [status]);

  const handleCellClick = useCallback((row: number, col: number) => {
    if (status === GameStatus.WON || status === GameStatus.LOST) return;

    if (gameMode === 'flag') {
        handleContextMenu(null, row, col);
        return;
    }

    const cell = board[row][col];
    if (cell.state === CellState.FLAGGED || cell.state === CellState.REVEALED) return;

    let currentBoard = board;

    if (isFirstClick) {
      currentBoard = placeMines(board, difficulty, row, col);
      setIsFirstClick(false);
      setStatus(GameStatus.PLAYING);
    }

    const { board: newBoard, gameOver, win } = revealCell(currentBoard, row, col);
    setBoard(newBoard);
    setHint(null); // Clear hint on move

    if (gameOver) {
      setStatus(GameStatus.LOST);
      setShowLossModal(true);
    } else if (win) {
      setStatus(GameStatus.WON);
      setShowWinModal(true);
    }
  }, [board, difficulty, isFirstClick, status, gameMode]);

  const handleContextMenu = useCallback((e: React.MouseEvent | null, row: number, col: number) => {
    if (e) e.preventDefault();
    if (status === GameStatus.WON || status === GameStatus.LOST) return;

    const cell = board[row][col];
    if (cell.state === CellState.REVEALED) return;

    const newBoard = toggleFlag(board, row, col);
    setBoard(newBoard);
    setHint(null);

    // Update flag count
    const flaggedCount = newBoard.flat().filter(c => c.state === CellState.FLAGGED).length;
    setFlags(difficulty.mines - flaggedCount);
  }, [board, status, difficulty]);

  const requestHint = async () => {
    if (status !== GameStatus.PLAYING && status !== GameStatus.IDLE) return;
    setLoadingHint(true);
    try {
      // If idle, just click the middle
      if (status === GameStatus.IDLE) {
         // Simulate delay for consistent UX
         await new Promise(r => setTimeout(r, 600)); 
         setHint({
             row: Math.floor(difficulty.rows / 2),
             col: Math.floor(difficulty.cols / 2),
             action: 'reveal',
             reasoning: 'The board is empty. Start in the middle to open up space.'
         });
      } else {
        const aiHint = await getAIHint(board);
        setHint(aiHint);
      }
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to get hint');
    } finally {
      setLoadingHint(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex flex-col items-center py-8 px-4">
      {/* Header */}
      <header className="w-full max-w-4xl flex flex-col gap-6 mb-8">
        <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Gemini Minesweeper
            </h1>
            <div className="flex gap-2">
                <button
                    onClick={() => initGame(difficulty)}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors border border-slate-700 text-slate-300"
                    title="Reset Game"
                >
                    <RefreshIcon />
                </button>
            </div>
        </div>

        {/* Stats Bar */}
        <div className="flex justify-between items-center bg-slate-800/50 p-4 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-xl">
          <div className="flex items-center gap-3">
             <div className="bg-slate-950 p-2 rounded-lg text-red-400 font-mono text-xl border border-slate-800 min-w-[80px] text-center">
               {flags}
             </div>
             <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold">Mines</span>
          </div>

          <div className="flex items-center gap-2">
             <button
               onClick={() => setStatus(GameStatus.IDLE) || initGame(difficulty)}
               className="text-3xl hover:scale-110 transition-transform active:scale-95"
             >
               {status === GameStatus.WON ? '😎' : status === GameStatus.LOST ? '😵' : '🙂'}
             </button>
          </div>

          <div className="flex items-center gap-3">
             <span className="text-sm text-slate-400 uppercase tracking-wider font-semibold text-right">Time</span>
             <div className="bg-slate-950 p-2 rounded-lg text-blue-400 font-mono text-xl border border-slate-800 min-w-[80px] text-center">
               {timer.toString().padStart(3, '0')}
             </div>
          </div>
        </div>
      </header>

      {/* Main Game Area */}
      <main className="w-full max-w-fit flex flex-col gap-4">
        
        {/* Mobile Controls */}
        <div className="flex md:hidden justify-center gap-4 bg-slate-800 p-2 rounded-full self-center mb-2">
            <button 
                onClick={() => setGameMode('dig')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${gameMode === 'dig' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
                ⛏️ Dig
            </button>
            <button 
                onClick={() => setGameMode('flag')}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${gameMode === 'flag' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}`}
            >
                🚩 Flag
            </button>
        </div>

        {/* Game Board Container */}
        <div className="relative group rounded-lg overflow-hidden border-4 border-slate-700 shadow-2xl bg-slate-800">
           
           {/* Hint Overlay (if applicable) */}
           {hint && status === GameStatus.PLAYING && (
               <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 bg-indigo-900/90 text-indigo-100 px-4 py-2 rounded-lg shadow-lg border border-indigo-500/50 backdrop-blur text-sm flex items-center gap-2 animate-bounce">
                  <BrainIcon />
                  <span>
                      AI suggests: <strong>{hint.action.toUpperCase()}</strong> at ({hint.row + 1}, {hint.col + 1}). {hint.reasoning}
                  </span>
                  <button onClick={() => setHint(null)} className="ml-2 hover:text-white font-bold">&times;</button>
               </div>
           )}

           <div className="overflow-auto max-w-[95vw] max-h-[70vh] custom-scroll">
              <div 
                className="grid gap-0 bg-slate-600 w-max mx-auto p-1"
                style={{
                  gridTemplateColumns: `repeat(${difficulty.cols}, min-content)`,
                }}
              >
                {board.map((row, rIdx) => (
                  row.map((cell, cIdx) => (
                    <Cell
                      key={`${rIdx}-${cIdx}`}
                      cell={cell}
                      onClick={handleCellClick}
                      onContextMenu={handleContextMenu}
                      isGameOver={status === GameStatus.LOST || status === GameStatus.WON}
                      highlight={hint?.row === rIdx && hint?.col === cIdx}
                    />
                  ))
                ))}
              </div>
           </div>
        </div>

        {/* Tools / Helpers */}
        <div className="flex justify-between items-center mt-4">
           {/* Difficulty Selector */}
           <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
             {Object.values(DIFFICULTIES).map((diff) => (
               <button
                 key={diff.name}
                 onClick={() => setDifficulty(diff)}
                 className={`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all ${
                   difficulty.name === diff.name
                     ? 'bg-slate-600 text-white shadow'
                     : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                 }`}
               >
                 {diff.name}
               </button>
             ))}
           </div>

           {/* AI Hint Button */}
           <button
             onClick={requestHint}
             disabled={loadingHint || status === GameStatus.LOST || status === GameStatus.WON}
             className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all border
                ${loadingHint 
                    ? 'bg-indigo-900/50 border-indigo-800 text-indigo-400 cursor-wait' 
                    : 'bg-indigo-600 hover:bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 active:translate-y-0.5'
                }
             `}
           >
             {loadingHint ? (
                 <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
             ) : (
                 <BrainIcon />
             )}
             {loadingHint ? 'Thinking...' : 'AI Hint'}
           </button>
        </div>
      </main>

      {/* Modals */}
      {showWinModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-green-400 to-emerald-600" />
                <div className="mx-auto bg-green-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-green-400">
                    <TrophyIcon />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Victory!</h2>
                <p className="text-slate-400 mb-6">
                    You cleared the field in <span className="text-white font-mono">{timer}</span> seconds.
                    <br/>Great job!
                </p>
                <div className="flex gap-3 justify-center">
                    <button 
                        onClick={() => initGame(difficulty)}
                        className="px-6 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg font-semibold transition-colors"
                    >
                        Play Again
                    </button>
                    <button 
                        onClick={() => setShowWinModal(false)}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}

      {showLossModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl max-w-sm w-full text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-orange-600" />
                <div className="mx-auto bg-red-900/30 w-16 h-16 rounded-full flex items-center justify-center mb-4 text-red-500">
                    <SkullIcon />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Game Over</h2>
                <p className="text-slate-400 mb-6">
                    You hit a mine! Better luck next time.
                </p>
                <div className="flex gap-3 justify-center">
                    <button 
                        onClick={() => initGame(difficulty)}
                        className="px-6 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold transition-colors"
                    >
                        Try Again
                    </button>
                    <button 
                        onClick={() => setShowLossModal(false)}
                        className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default App;