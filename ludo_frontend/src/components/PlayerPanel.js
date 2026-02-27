import React from 'react';
import './PlayerPanel.css';

const COLOR_MAP = {
  red: '#EF4444',
  green: '#22C55E',
  yellow: '#EAB308',
  blue: '#3B82F6',
};

// PUBLIC_INTERFACE
/**
 * PlayerPanel component showing all players, their status, and whose turn it is.
 * @param {object} props - { players, currentPlayerIndex }
 */
function PlayerPanel({ players, currentPlayerIndex }) {
  return (
    <div className="player-panel">
      {players.map((player, index) => {
        const isCurrent = index === currentPlayerIndex;
        const tokensHome = player.tokens.filter(t => t.state === 'home').length;
        const tokensActive = player.tokens.filter(t => t.state === 'active').length;
        const tokensBase = player.tokens.filter(t => t.state === 'base').length;

        return (
          <div
            key={index}
            className={`player-info ${isCurrent ? 'player-info-active' : ''} ${player.hasFinished ? 'player-info-finished' : ''}`}
            style={{ '--player-color': COLOR_MAP[player.color] || '#999' }}
          >
            <div className="player-color-dot" style={{ backgroundColor: COLOR_MAP[player.color] }} />
            <div className="player-details">
              <span className="player-name">{player.name}</span>
              <span className="player-tokens-status">
                {tokensBase > 0 && <span title="In base">🏠{tokensBase}</span>}
                {tokensActive > 0 && <span title="On board">🔵{tokensActive}</span>}
                {tokensHome > 0 && <span title="Finished">🏆{tokensHome}</span>}
              </span>
            </div>
            {isCurrent && !player.hasFinished && (
              <span className="turn-indicator">◄</span>
            )}
            {player.hasFinished && (
              <span className="finished-badge">✓</span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default PlayerPanel;
