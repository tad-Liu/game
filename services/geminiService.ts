import { GoogleGenAI, Type } from "@google/genai";
import { Board, CellState, AIHint } from '../types';

const getBoardString = (board: Board): string => {
  return board.map(row => 
    row.map(cell => {
      if (cell.state === CellState.REVEALED) {
        return cell.neighborMines.toString();
      } else if (cell.state === CellState.FLAGGED) {
        return 'F';
      } else {
        return '?';
      }
    }).join(' ')
  ).join('\n');
};

export const getAIHint = async (board: Board): Promise<AIHint> => {
  try {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      throw new Error("API Key not found");
    }

    const ai = new GoogleGenAI({ apiKey });
    
    // Convert board to string representation
    const boardStr = getBoardString(board);
    const rows = board.length;
    const cols = board[0].length;

    const prompt = `
      You are a Minesweeper expert. I need your help to find the safest move.
      Here is the current state of the board (${rows} rows x ${cols} columns).
      
      Symbols:
      '?' = Hidden/Unrevealed cell
      'F' = Flagged cell (suspected mine)
      '0'-'8' = Revealed cell with neighbor mine count
      
      Board Layout:
      ${boardStr}
      
      Analyze the board logically. Look for patterns (like 1-2-1, 1-1, corner logic).
      If there is a guaranteed safe move, suggest revealing it.
      If there is a guaranteed mine, suggest flagging it.
      If no guaranteed moves exist, calculate the safest probability and suggest that.
      
      Return a JSON object with:
      - row: 0-indexed row number
      - col: 0-indexed column number
      - action: "reveal" or "flag"
      - reasoning: A short, clear explanation of why this is the best move (max 1 sentence).
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            row: { type: Type.INTEGER },
            col: { type: Type.INTEGER },
            action: { type: Type.STRING, enum: ["reveal", "flag"] },
            reasoning: { type: Type.STRING },
          },
          required: ["row", "col", "action", "reasoning"],
        },
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    const hint = JSON.parse(text) as AIHint;
    
    // Validate bounds
    if (hint.row < 0 || hint.row >= rows || hint.col < 0 || hint.col >= cols) {
       throw new Error("AI returned invalid coordinates");
    }

    return hint;

  } catch (error) {
    console.error("Gemini AI Error:", error);
    throw new Error("AI is currently thinking about other things. Try again later!");
  }
};
