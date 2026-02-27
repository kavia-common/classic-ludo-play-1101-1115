import React, { useState, useCallback } from 'react';
import { SoundProvider, useSound } from './services/SoundContext';
import SetupScreen from './components/SetupScreen';
import GameBoard from './components/GameBoard';
import PlayerPanel from './components/PlayerPanel';
import ActionBar from './components/ActionBar';
import WinModal from './components/WinModal';
import {
  createLocalGame,
  rollLocalDice,
  moveLocalToken,
  getValidMovesLocal,
} from './services/gameEngine';
import './App.css';

/**
 * Game screens enumeration.
 */
const SCREENS = {
  SETUP: 'setup',
  PLAYING: 'playing',
};

/**
 * Inner game component that uses the sound context.
 * Manages game state transitions between setup and gameplay screens.
 */
function GameApp() {
  const [screen, setScreen] = useState(SCREENS.SETUP);
  const [gameState, setGameState] = useState(null);
  const [validMoves, setValidMoves] = useState([]);
  const [rolling, setRolling] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);

  const { playWin, playClick } = useSound();

  /**
   * Handle game start from the setup screen.
   * Creates a new local game with the given configuration.
   * @param {object} config - { playerCount, playerNames, playerColors }
   */
  const handleStartGame = useCallback((config) => {
    const newGame = createLocalGame(config);
    setGameState(newGame);
    setValidMoves([]);
    setShowWinModal(false);
    setScreen(SCREENS.PLAYING);
  }, []);

  /**
   * Handle dice roll action.
   * Rolls the dice and updates game state with new valid moves.
   */
  const handleRollDice = useCallback(() => {
    if (!gameState || gameState.turnPhase !== 'roll' || rolling) return;

    setRolling(true);

    // Simulate dice roll animation delay
    setTimeout(() => {
      const newState = rollLocalDice(gameState);
      setGameState(newState);

      // Calculate valid moves after roll
      if (newState.turnPhase === 'move') {
        const moves = getValidMovesLocal(newState);
        setValidMoves(moves);
      } else {
        setValidMoves([]);
      }

      // Check for win condition
      if (newState.gameOver) {
        setTimeout(() => {
          playWin();
          setShowWinModal(true);
        }, 800);
      }

      setRolling(false);
    }, 600);
  }, [gameState, rolling, playWin]);

  /**
   * Handle token click for moving a token.
   * @param {string} tokenId - The ID of the clicked token
   */
  const handleTokenClick = useCallback((tokenId) => {
    if (!gameState || gameState.turnPhase !== 'move') return;

    // Check if this token is in the valid moves list
    const isValid = validMoves.some(m => m.tokenId === tokenId);
    if (!isValid) return;

    const newState = moveLocalToken(gameState, tokenId);
    setGameState(newState);
    setValidMoves([]);

    // Check for win condition
    if (newState.gameOver) {
      setTimeout(() => {
        playWin();
        setShowWinModal(true);
      }, 800);
    }
  }, [gameState, validMoves, playWin]);

  /**
   * Handle starting a new game - returns to setup screen.
   */
  const handleNewGame = useCallback(() => {
    playClick();
    setScreen(SCREENS.SETUP);
    setGameState(null);
    setValidMoves([]);
    setShowWinModal(false);
  }, [playClick]);

  /**
   * Close the win modal to continue viewing the board.
   */
  const handleCloseWinModal = useCallback(() => {
    setShowWinModal(false);
  }, []);

  // Render setup screen
  if (screen === SCREENS.SETUP) {
    return (
      <div className="App">
        <SetupScreen onStartGame={handleStartGame} />
      </div>
    );
  }

  // Render game screen
  const currentPlayer = gameState ? gameState.players[gameState.currentPlayerIndex] : null;
  const canRoll = gameState && gameState.turnPhase === 'roll' && !gameState.gameOver && !rolling;
  const winnerPlayer = gameState && gameState.winner !== null
    ? gameState.players[gameState.winner]
    : null;

  return (
    <div className="App">
      <div className="game-layout">
        {/* Header */}
        <header className="game-header">
          <h1 className="game-header-title">
            🎲 Classic <span>Ludo</span>
          </h1>
        </header>

        {/* Top panel - Player info */}
        <div className="game-top-panel">
          <PlayerPanel
            players={gameState ? gameState.players : []}
            currentPlayerIndex={gameState ? gameState.currentPlayerIndex : 0}
          />
        </div>

        {/* Center - Game board */}
        <div className="game-board-area">
          <GameBoard
            players={gameState ? gameState.players : []}
            currentPlayerIndex={gameState ? gameState.currentPlayerIndex : 0}
            validMoves={validMoves}
            onTokenClick={handleTokenClick}
            diceValue={gameState ? gameState.diceValue : null}
          />
        </div>

        {/* Bottom - Action bar with dice and controls */}
        <div className="game-bottom-bar">
          <ActionBar
            message={gameState ? gameState.message : ''}
            diceValue={gameState ? gameState.diceValue : null}
            onRoll={handleRollDice}
            canRoll={canRoll}
            rolling={rolling}
            currentPlayer={currentPlayer}
            onNewGame={handleNewGame}
          />
        </div>
      </div>

      {/* Win modal */}
      {showWinModal && winnerPlayer && (
        <WinModal
          winner={winnerPlayer}
          onNewGame={handleNewGame}
          onClose={handleCloseWinModal}
        />
      )}
    </div>
  );
}

// PUBLIC_INTERFACE
/**
 * Main App component for the Classic Ludo game.
 * Wraps the game with SoundProvider for global sound mode.
 * Sound is enabled by default across the entire application.
 */
function App() {
  return (
    <SoundProvider>
      <GameApp />
    </SoundProvider>
  );
}

export default App;
