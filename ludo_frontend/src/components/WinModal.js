import React from 'react';
import './WinModal.css';

const COLOR_MAP = {
  red: '#EF4444',
  green: '#22C55E',
  yellow: '#EAB308',
  blue: '#3B82F6',
};

// PUBLIC_INTERFACE
/**
 * WinModal component displaying the winner announcement.
 * @param {object} props - { winner, onNewGame, onClose }
 * winner: { name, color }
 */
function WinModal({ winner, onNewGame, onClose }) {
  if (!winner) return null;

  const winnerColor = COLOR_MAP[winner.color] || '#B45309';

  return (
    <div className="win-modal-overlay" onClick={onClose}>
      <div className="win-modal" onClick={(e) => e.stopPropagation()}>
        <div className="win-confetti">🎊</div>
        <h2 className="win-title">🏆 Winner! 🏆</h2>
        <div
          className="win-player-name"
          style={{ color: winnerColor }}
        >
          {winner.name}
        </div>
        <p className="win-message">Congratulations! All tokens reached home!</p>
        <div className="win-actions">
          <button className="win-new-game-btn" onClick={onNewGame}>
            Play Again 🎮
          </button>
          <button className="win-close-btn" onClick={onClose}>
            View Board
          </button>
        </div>
      </div>
    </div>
  );
}

export default WinModal;
