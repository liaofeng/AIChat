import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";

// Tetris game constants
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const EMPTY_CELL = 0;

// Tetromino shapes
const TETROMINOS = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0]
    ],
    color: 'bg-cyan-500',
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'bg-blue-500',
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'bg-orange-500',
  },
  O: {
    shape: [
      [1, 1],
      [1, 1]
    ],
    color: 'bg-yellow-500',
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0]
    ],
    color: 'bg-green-500',
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0]
    ],
    color: 'bg-purple-500',
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0]
    ],
    color: 'bg-red-500',
  }
};

// Get random tetromino
const getRandomTetromino = () => {
  const tetrominos = Object.keys(TETROMINOS) as Array<keyof typeof TETROMINOS>;
  const randTetromino = tetrominos[Math.floor(Math.random() * tetrominos.length)];
  return TETROMINOS[randTetromino];
};

// Create empty board
const createEmptyBoard = () => 
  Array.from(Array(BOARD_HEIGHT), () => Array(BOARD_WIDTH).fill(EMPTY_CELL));

const Tetris = () => {
  const [board, setBoard] = useState(createEmptyBoard());
  const [currentTetromino, setCurrentTetromino] = useState(getRandomTetromino());
  const [position, setPosition] = useState({ x: Math.floor(BOARD_WIDTH / 2) - 2, y: 0 });
  const [gameOver, setGameOver] = useState(false);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Check if position is valid
  const isPositionValid = useCallback((tetromino: any, pos: { x: number; y: number }) => {
    for (let y = 0; y < tetromino.shape.length; y++) {
      for (let x = 0; x < tetromino.shape[y].length; x++) {
        if (tetromino.shape[y][x] !== 0) {
          const newX = pos.x + x;
          const newY = pos.y + y;
          
          // Check boundaries
          if (
            newX < 0 || 
            newX >= BOARD_WIDTH || 
            newY >= BOARD_HEIGHT
          ) {
            return false;
          }
          
          // Check if cell is already filled
          if (newY >= 0 && board[newY][newX] !== EMPTY_CELL) {
            return false;
          }
        }
      }
    }
    return true;
  }, [board]);

  // Rotate tetromino
  const rotateTetromino = useCallback(() => {
    if (isPaused || gameOver || !gameStarted) return;
    
    const rotated = {
      ...currentTetromino,
      shape: currentTetromino.shape[0].map((_: number, index: number) =>
        currentTetromino.shape.map((row: number[]) => row[index]).reverse()
      )
    };
    
    if (isPositionValid(rotated, position)) {
      setCurrentTetromino(rotated);
    }
  }, [currentTetromino, position, isPositionValid, isPaused, gameOver, gameStarted]);

  // Move tetromino
  const moveTetromino = useCallback((direction: 'left' | 'right' | 'down') => {
    if (isPaused || gameOver || !gameStarted) return;
    
    const newPosition = { ...position };
    
    if (direction === 'left') {
      newPosition.x -= 1;
    } else if (direction === 'right') {
      newPosition.x += 1;
    } else if (direction === 'down') {
      newPosition.y += 1;
    }
    
    if (isPositionValid(currentTetromino, newPosition)) {
      setPosition(newPosition);
      return true;
    }
    
    // If can't move down, lock the tetromino
    if (direction === 'down') {
      lockTetromino();
      return false;
    }
    
    return false;
  }, [currentTetromino, position, isPositionValid, isPaused, gameOver, gameStarted]);

  // Hard drop tetromino
  const hardDrop = useCallback(() => {
    if (isPaused || gameOver || !gameStarted) return;
    
    let newY = position.y;
    while (isPositionValid(currentTetromino, { ...position, y: newY + 1 })) {
      newY += 1;
    }
    
    setPosition({ ...position, y: newY });
    lockTetromino();
  }, [currentTetromino, position, isPositionValid, isPaused, gameOver, gameStarted]);

  // Lock tetromino to board
  const lockTetromino = useCallback(() => {
    const newBoard = [...board];
    
    // Add tetromino to board
    for (let y = 0; y < currentTetromino.shape.length; y++) {
      for (let x = 0; x < currentTetromino.shape[y].length; x++) {
        if (currentTetromino.shape[y][x] !== 0) {
          const boardY = position.y + y;
          if (boardY < 0) {
            setGameOver(true);
            return;
          }
          newBoard[boardY][position.x + x] = currentTetromino.color;
        }
      }
    }
    
    // Check for completed rows
    let clearedRows = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (newBoard[y].every(cell => cell !== EMPTY_CELL)) {
        // Remove the row and add an empty row at the top
        newBoard.splice(y, 1);
        newBoard.unshift(Array(BOARD_WIDTH).fill(EMPTY_CELL));
        clearedRows += 1;
        y++; // Check the same row again
      }
    }
    
    // Update score
    if (clearedRows > 0) {
      const points = [0, 40, 100, 300, 1200][clearedRows] * level;
      setScore(prevScore => prevScore + points);
      
      // Update level every 10 rows cleared
      const newTotalRows = Math.floor(score / 1000) + clearedRows;
      const newLevel = Math.floor(newTotalRows / 10) + 1;
      if (newLevel > level) {
        setLevel(newLevel);
      }
    }
    
    setBoard(newBoard);
    
    // Generate new tetromino
    setCurrentTetromino(getRandomTetromino());
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - 2, y: 0 });
    
    // Check if game over
    const newTetromino = getRandomTetromino();
    if (!isPositionValid(newTetromino, { x: Math.floor(BOARD_WIDTH / 2) - 2, y: 0 })) {
      setGameOver(true);
    }
  }, [board, currentTetromino, position, level, score, isPositionValid]);

  // Game tick
  useEffect(() => {
    if (!gameStarted || gameOver || isPaused) return;
    
    const speed = 1000 - (level - 1) * 100 > 100 ? 1000 - (level - 1) * 100 : 100;
    const gameLoop = setInterval(() => {
      moveTetromino('down');
    }, speed);
    
    return () => {
      clearInterval(gameLoop);
    };
  }, [gameStarted, gameOver, isPaused, level, moveTetromino]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          moveTetromino('left');
          break;
        case 'ArrowRight':
          moveTetromino('right');
          break;
        case 'ArrowDown':
          moveTetromino('down');
          break;
        case 'ArrowUp':
          rotateTetromino();
          break;
        case ' ':
          hardDrop();
          break;
        case 'p':
        case 'P':
          setIsPaused(!isPaused);
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [gameStarted, gameOver, isPaused, moveTetromino, rotateTetromino, hardDrop]);

  // Render board with current tetromino
  const renderBoard = () => {
    const boardWithTetromino = board.map(row => [...row]);
    
    // Add current tetromino to board
    if (gameStarted && !gameOver) {
      for (let y = 0; y < currentTetromino.shape.length; y++) {
        for (let x = 0; x < currentTetromino.shape[y].length; x++) {
          if (currentTetromino.shape[y][x] !== 0) {
            const boardY = position.y + y;
            const boardX = position.x + x;
            
            if (boardY >= 0 && boardY < BOARD_HEIGHT && boardX >= 0 && boardX < BOARD_WIDTH) {
              boardWithTetromino[boardY][boardX] = currentTetromino.color;
            }
          }
        }
      }
    }
    
    return (
      <div className="grid grid-cols-10 gap-0 border-2 border-gray-700 bg-gray-900">
        {boardWithTetromino.flat().map((cell, index) => (
          <div 
            key={index} 
            className={`w-6 h-6 border border-gray-800 ${cell || 'bg-gray-800'}`}
          />
        ))}
      </div>
    );
  };

  // Start new game
  const startGame = () => {
    setBoard(createEmptyBoard());
    setCurrentTetromino(getRandomTetromino());
    setPosition({ x: Math.floor(BOARD_WIDTH / 2) - 2, y: 0 });
    setGameOver(false);
    setScore(0);
    setLevel(1);
    setGameStarted(true);
    setIsPaused(false);
  };

  // Pause/resume game
  const togglePause = () => {
    if (gameStarted && !gameOver) {
      setIsPaused(!isPaused);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6">Tetris Game</h1>
      
      <div className="flex flex-col md:flex-row gap-6">
        <Card className="p-6 bg-white shadow-lg">
          {renderBoard()}
        </Card>
        
        <Card className="p-6 bg-white shadow-lg">
          <div className="flex flex-col gap-4">
            <div className="text-xl">
              <p><strong>Score:</strong> {score}</p>
              <p><strong>Level:</strong> {level}</p>
            </div>
            
            <div className="flex flex-col gap-2">
              {!gameStarted ? (
                <Button onClick={startGame} className="w-full">Start Game</Button>
              ) : (
                <>
                  <Button 
                    onClick={togglePause} 
                    variant={isPaused ? "default" : "outline"}
                    className="w-full"
                  >
                    {isPaused ? "Resume" : "Pause"}
                  </Button>
                  <Button onClick={startGame} variant="outline" className="w-full">Restart</Button>
                </>
              )}
            </div>
            
            {gameOver && (
              <div className="mt-4 p-4 bg-red-100 text-red-800 rounded-md">
                <p className="font-bold">Game Over!</p>
                <p>Final Score: {score}</p>
              </div>
            )}
            
            <div className="mt-4">
              <h3 className="font-bold mb-2">Controls:</h3>
              <ul className="text-sm">
                <li>← → : Move left/right</li>
                <li>↓ : Move down</li>
                <li>↑ : Rotate</li>
                <li>Space : Hard drop</li>
                <li>P : Pause/Resume</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Tetris;
