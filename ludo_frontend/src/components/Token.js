import React from 'react';
import './Token.css';

// Color hex values mapping
const COLOR_MAP = {
  red: '#EF4444',
  green: '#22C55E',
  yellow: '#EAB308',
  blue: '#3B82F6',
};

// PUBLIC_INTERFACE
/**
 * Token component representing a player's game piece on the board.
 * @param {object} props - { color, isHighlighted, onClick, isInBase, tokenIndex, stackCount }
 */
function Token({ color, isHighlighted, onClick, isInBase, tokenIndex, stackCount }) {
  const colorHex = COLOR_MAP[color] || color;
  const highlightClass = isHighlighted ? 'token-highlighted' : '';
  const baseClass = isInBase ? 'token-in-base' : '';

  return (
    <button
      className={`token ${highlightClass} ${baseClass}`}
      onClick={onClick}
      disabled={!isHighlighted}
      aria-label={`${color} token${isHighlighted ? ' (movable)' : ''}`}
      style={{
        '--token-color': colorHex,
        '--token-offset': tokenIndex || 0,
      }}
    >
      <svg viewBox="0 0 40 40" className="token-svg">
        {/* Token shadow */}
        <ellipse cx="20" cy="36" rx="12" ry="3" fill="rgba(0,0,0,0.2)" />
        {/* Token body */}
        <circle cx="20" cy="20" r="14" fill={colorHex} stroke="#ffffff" strokeWidth="2.5" />
        {/* Token inner highlight */}
        <circle cx="20" cy="17" r="6" fill="rgba(255,255,255,0.4)" />
        {/* Stack count indicator */}
        {stackCount > 1 && (
          <>
            <circle cx="30" cy="10" r="8" fill="#1F2937" stroke="#ffffff" strokeWidth="1.5" />
            <text x="30" y="14" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
              {stackCount}
            </text>
          </>
        )}
      </svg>
      {isHighlighted && <span className="token-glow" />}
    </button>
  );
}

export default Token;
