import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

// Tetris game constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const EMPTY_CELL = 0;

// Tetromino shapes
const TETROMINOS = [
  // I
  {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: "bg-cyan-500"
  },
  // J
  {
    shape: [
      [2, 0, 0],
      [2, 2, 2],
      [0, 0, 0]
    ],
    color: "bg-blue-500"
  },
  // L
  {
    shape: [
      [0, 0, 3],
      [3, 3, 3],
      [0, 0, 0]
    ],
    color: "bg-orange-500"
  },
  // O
  {
    shape: [
      [4, 4],
      [4, 4]
    ],
    color: "bg-yellow-500"
  },
  // S
  {
    shape: [
      [0, 5, 5],
      [5, 5, 0],
      [0, 0, 0]
    ],
    color: "bg-green-500"
  },
  // T
  {
    shape: [
      [0, 6, 0],
      [6, 6, 6],
      [0, 0, 0]
    ],
    color: "bg-purple-500"
  },
  // Z
  {
    shape: [
      [7, 7, 0],
      [0, 7, 7],
      [0, 0, 0]
    ],
    color: "bg-red-500"
  }
];

// Get color based on tetromino type
const getTetrominoColor = (type: number) => {
  if (type === 0) return "bg-gray-200 dark:bg-gray-800";
  return TETROMINOS[type - 1].color;
};

export default function Tetris() {
  const { toast } = useToast();
  const [gameOver, setGameOver] = useState(false);
  const [paused, setPaused] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [dropTime, setDropTime] = useState(1000);
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentTetromino, setCurrentTetromino] = useState(getRandomTetromino());
  const [nextTetromino, setNextTetromino] = useState(getRandomTetromino());
  const [position, setPosition] = useState({ x: Math.floor(BOARD_WIDTH / 2) - 2, y: 0 });

  // Create an empty board
  function createEmptyBoard() {
    return Array.from({ length: BOARD_HEIGHT }, () => 
      Array.from({ length: BOARD_WIDTH }, () => EMPTY_CELL)
    );
  }

  // Get a random tetromino
  function getRandomTetromino() {
    const randomIndex = Math.floor(Math.random() * TETROMINOS.length);
    return TETROMINOS[randomIndex];
  }

  // Define types for tetromino and position
  type TetrominoType = {
    shape: number[][];
    color: string;
  };

  type PositionType = {
    x: number;
    y: number;
  };

  // Check if the current position is valid
  const isValidPosition = useCallback((tetromino: TetrominoType, pos: PositionType) => {
    for (let y = 0; y < tetromino.shape.length; y++) {
      for (let x = 0; x < tetromino.shape[y].length; x++) {
        if (tetromino.shape[y][x] !== 0) {
          const boardX = pos.x + x;
          const boardY = pos.y + y;
          
          // Check if within board boundaries
          if (
            boardX < 0 || 
            boardX >= BOARD_WIDTH || 
            boardY >= BOARD_HEIGHT
          ) {
            return false;
          }
          
          // Check if cell is already occupied
          if (boardY >= 0 && board[boardY][boardX] !== EMPTY_CELL) {
            return false;
          }
        }
      }
    }
    return true;
  }, [board]);

  // Rotate tetromino
  const rotateTetromino = useCallback(() => {
    if (paused || gameOver) return;
    
    const rotated = {
      ...currentTetromino,
      shape: currentTetromino.shape[0].map((_, index) =>
        currentTetromino.shape.map(row => row[index]).reverse()
      )
    };
    
    if (isValidPosition(rotated, position)) {
      setCurrentTetromino(rotated);
    }
  }, [currentTetromino, position, isValidPosition, paused, gameOver]);

  // Move tetromino left
  const moveLeft = useCallback(() => {
    if (paused || gameOver) return;
    
    const newPos = { ...position, x: position.x - 1 };
    if (isValidPosition(currentTetromino, newPos)) {
      setPosition(newPos);
    }
  }, [currentTetromino, position, isValidPosition, paused, gameOver]);

  // Move tetromino right
  const moveRight = useCallback(() => {
    if (paused || gameOver) return;
    
    const newPos = { ...position, x: position.x + 1 };
    if (isValidPosition(currentTetromino, newPos)) {
      setPosition(newPos);
    }
  }, [currentTetromino, position, isValidPosition, paused, gameOver]);

  // Move tetromino down
  const moveDown = useCallback(() => {
    if (paused || gameOver) return;
    
    const newPos = { ...position, y: position.y + 1 };
    if (isValidPosition(currentTetromino, newPos)) {
      setPosition(newPos);
      return true;
    }
    return false;
  }, [currentTetromino, position, isValidPosition, paused, gameOver]);

  // Drop tetromino to bottom
  const dropTetromino = useCallback(() => {
    if (paused || gameOver) return;
    
    let newPos = { ...position };
    while (isValidPosition(currentTetromino, { ...newPos, y: newPos.y + 1 })) {
      newPos.y += 1;
    }
    setPosition(newPos);
    lockTetromino();
  }, [currentTetromino, position, isValidPosition, paused, gameOver]);

  // Lock the tetromino in place and check for completed lines
  const lockTetromino = useCallback(() => {
    // Create a new board with the current tetromino locked in place
    const newBoard = [...board];
    for (let y = 0; y < currentTetromino.shape.length; y++) {
      for (let x = 0; x < currentTetromino.shape[y].length; x++) {
        if (currentTetromino.shape[y][x] !== 0) {
          const boardY = position.y + y;
          const boardX = position.x + x;
          
          // If tetromino is at the top, game over
          if (boardY < 0) {
            setGameOver(true);
            toast({
              title: "游戏结束",
              description: `最终得分: ${score}`,
            });
            return;
          }
          
          if (boardY >= 0) {
            newBoard[boardY][boardX] = currentTetromino.shape[y][x];
          }
        }
      }
    }
    
    // Check for completed lines
    let linesCleared = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== EMPTY_CELL)) {
        // Remove the line and add an empty line at the top
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(EMPTY_CELL));
        linesCleared++;
        y++; // Check the same row again
      }
    }
    
    // Update score and level
    if (linesCleared > 0) {
      const newLines = lines + linesCleared;
      const newLevel = Math.floor(newLines / 10) + 1;
      const linePoints = [0, 40, 100, 300, 1200]; // Points for 0, 1, 2, 3, 4 lines
      const newScore = score + linePoints[linesCleared] * level;
      
      setLines(newLines);
      setLevel(newLevel);
      setScore(newScore);
      setDropTime(1000 / newLevel);
    }
    
    setBoard(newBoard);
    setCurrentTetromino(nextTetromino);
    setNextTetromino(getRandomTetromino());
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - 2, y: 0 });
  }, [board, currentTetromino, nextTetromino, position, score, level, lines, toast]);

  // Handle key presses
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowDown':
          e.preventDefault();
          moveDown();
          break;
        case 'ArrowUp':
          e.preventDefault();
          rotateTetromino();
          break;
        case ' ':
          e.preventDefault();
          dropTetromino();
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          setPaused(prev => !prev);
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [moveLeft, moveRight, moveDown, rotateTetromino, dropTetromino, gameOver]);

  // Drop tetromino automatically
  useEffect(() => {
    if (gameOver || paused) return;
    
    const interval = setInterval(() => {
      const moved = moveDown();
      if (!moved) {
        lockTetromino();
      }
    }, dropTime);
    
    return () => {
      clearInterval(interval);
    };
  }, [moveDown, lockTetromino, dropTime, gameOver, paused]);

  // Reset game
  const resetGame = () => {
    setGameOver(false);
    setPaused(false);
    setScore(0);
    setLevel(1);
    setLines(0);
    setDropTime(1000);
    setBoard(createEmptyBoard());
    setCurrentTetromino(getRandomTetromino());
    setNextTetromino(getRandomTetromino());
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - 2, y: 0 });
  };

  // Render the game board
  const renderBoard = () => {
    // Create a copy of the board to display
    const displayBoard = board.map(row => [...row]);
    
    // Add the current tetromino to the display board
    for (let y = 0; y < currentTetromino.shape.length; y++) {
      for (let x = 0; x < currentTetromino.shape[y].length; x++) {
        if (currentTetromino.shape[y][x] !== 0) {
          const boardY = position.y + y;
          const boardX = position.x + x;
          
          if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
            displayBoard[boardY][boardX] = currentTetromino.shape[y][x];
          }
        }
      }
    }
    
    return (
      <div className="grid grid-cols-10 gap-px bg-gray-300 dark:bg-gray-700 p-px">
        {displayBoard.flat().map((cell, index) => (
          <div
            key={index}
            className={`w-6 h-6 ${getTetrominoColor(cell)}`}
          />
        ))}
      </div>
    );
  };

  // Render the next tetromino preview
  const renderNextTetromino = () => {
    return (
      <div className="grid grid-cols-4 gap-px bg-gray-300 dark:bg-gray-700 p-px">
        {nextTetromino.shape.flat().map((cell, index) => (
          <div
            key={index}
            className={`w-4 h-4 ${cell ? nextTetromino.color : "bg-gray-200 dark:bg-gray-800"}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 flex flex-col items-center">
      <h1 className="text-3xl font-bold mb-6">俄罗斯方块</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="p-4">
          <div className="relative">
            {renderBoard()}
            
            {(gameOver || paused) && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <div className="text-white text-center">
                  <p className="text-xl font-bold mb-4">
                    {gameOver ? "游戏结束" : "游戏暂停"}
                  </p>
                  <Button 
                    onClick={gameOver ? resetGame : () => setPaused(false)}
                    className="mt-2"
                  >
                    {gameOver ? "重新开始" : "继续游戏"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Card>
        
        <div className="flex flex-col gap-4">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-2">游戏信息</h2>
            <div className="space-y-2">
              <p>得分: {score}</p>
              <p>等级: {level}</p>
              <p>消除行数: {lines}</p>
            </div>
          </Card>
          
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-2">下一个方块</h2>
            {renderNextTetromino()}
          </Card>
          
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-2">控制</h2>
            <div className="text-sm space-y-1">
              <p>← → : 左右移动</p>
              <p>↓ : 加速下落</p>
              <p>↑ : 旋转</p>
              <p>空格 : 直接落下</p>
              <p>P : 暂停/继续</p>
            </div>
          </Card>
          
          <div className="flex gap-2">
            <Button onClick={resetGame} className="flex-1">
              重新开始
            </Button>
            <Button 
              onClick={() => setPaused(prev => !prev)} 
              variant="outline" 
              className="flex-1"
            >
              {paused ? "继续" : "暂停"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
