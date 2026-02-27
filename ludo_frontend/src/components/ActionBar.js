import React from 'react';
import Dice from './Dice';
import './ActionBar.css';

const COLOR_MAP = {
  red: '#EF4444',
  green: '#22C55E',
  yellow: '#EAB308',
  blue: '#3B82F6',
};

// PUBLIC_INTERFACE
/**
 * ActionBar component showing dice, turn message, and action controls.
 * @param {object} props - { message, diceValue, onRoll, canRoll, rolling, currentPlayer, onNewGame }
 */
function ActionBar({ message, diceValue, onRoll, canRoll, rolling, currentPlayer, onNewGame }) {
  const playerColor = currentPlayer ? COLOR_MAP[currentPlayer.color] : '#B45309';

  return (
    <div className="action-bar" style={{ '--action-bar-accent': playerColor }}>
      <div className="action-bar-content">
        {/* Current player indicator */}
        <div className="action-turn-info">
          {currentPlayer && (
            <div
              className="action-player-badge"
              style={{ backgroundColor: playerColor }}
            >
              {currentPlayer.name}
            </div>
          )}
        </div>

        {/* Dice */}
        <div className="action-dice-area">
          <Dice
            value={diceValue}
            onRoll={onRoll}
            disabled={!canRoll}
            rolling={rolling}
            playerColor={playerColor}
          />
        </div>

        {/* Message */}
        <div className="action-message">
          <p className="action-message-text">{message}</p>
        </div>

        {/* New Game button */}
        <button className="new-game-btn" onClick={onNewGame} title="Start new game">
          🔄 New Game
        </button>
      </div>
    </div>
  );
}

export default ActionBar;
