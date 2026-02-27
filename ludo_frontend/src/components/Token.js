import React from 'react';
import './Token.css';

// Color hex values mapping
const COLOR_MAP = {
  red: '#EF4444',
  green: '#22C55E',
  yellow: '#EAB308',
  blue: '#3B82F6',
};

// Darker shade for token body gradient
const COLOR_DARK = {
  red: '#B91C1C',
  green: '#15803D',
  yellow: '#A16207',
  blue: '#1D4ED8',
};

// Lighter shade for highlights
const COLOR_LIGHT = {
  red: '#FCA5A5',
  green: '#86EFAC',
  yellow: '#FDE68A',
  blue: '#93C5FD',
};

// PUBLIC_INTERFACE
/**
 * Token component representing a player's game piece on the board.
 * Renders a realistic 3D pawn-like piece with gradients and shadows.
 * @param {object} props - { color, isHighlighted, onClick, isInBase, tokenIndex, stackCount, isAnimating }
 */
function Token({ color, isHighlighted, onClick, isInBase, tokenIndex, stackCount, isAnimating }) {
  const colorHex = COLOR_MAP[color] || color;
  const darkHex = COLOR_DARK[color] || color;
  const lightHex = COLOR_LIGHT[color] || '#ffffff';
  const highlightClass = isHighlighted ? 'token-highlighted' : '';
  const baseClass = isInBase ? 'token-in-base' : '';
  const animatingClass = isAnimating ? 'token-moving' : '';
  const uniqueId = `token-grad-${color}-${tokenIndex || 0}`;

  return (
    <button
      className={`token ${highlightClass} ${baseClass} ${animatingClass}`}
      onClick={onClick}
      disabled={!isHighlighted}
      aria-label={`${color} token${isHighlighted ? ' (movable)' : ''}`}
      style={{
        '--token-color': colorHex,
        '--token-offset': tokenIndex || 0,
      }}
    >
      <svg viewBox="0 0 50 60" className="token-svg">
        <defs>
          {/* Main body gradient */}
          <radialGradient id={`${uniqueId}-body`} cx="40%" cy="35%" r="60%">
            <stop offset="0%" stopColor={lightHex} stopOpacity="0.9" />
            <stop offset="50%" stopColor={colorHex} />
            <stop offset="100%" stopColor={darkHex} />
          </radialGradient>
          {/* Head gradient */}
          <radialGradient id={`${uniqueId}-head`} cx="40%" cy="30%" r="55%">
            <stop offset="0%" stopColor={lightHex} stopOpacity="0.8" />
            <stop offset="60%" stopColor={colorHex} />
            <stop offset="100%" stopColor={darkHex} />
          </radialGradient>
          {/* Shadow filter */}
          <filter id={`${uniqueId}-shadow`} x="-20%" y="-10%" width="140%" height="130%">
            <feDropShadow dx="1" dy="2" stdDeviation="2" floodColor="rgba(0,0,0,0.35)" />
          </filter>
        </defs>

        {/* Base shadow ellipse */}
        <ellipse cx="25" cy="56" rx="14" ry="3.5" fill="rgba(0,0,0,0.25)" />

        {/* Pawn body - tapered column */}
        <path
          d={`M 15 52 
              Q 13 44, 16 36 
              Q 18 30, 19 26 
              Q 17 22, 18 18 
              L 32 18 
              Q 33 22, 31 26 
              Q 32 30, 34 36 
              Q 37 44, 35 52 
              Z`}
          fill={`url(#${uniqueId}-body)`}
          stroke={darkHex}
          strokeWidth="1"
          filter={`url(#${uniqueId}-shadow)`}
        />

        {/* Pawn base - wider bottom */}
        <ellipse cx="25" cy="52" rx="12" ry="4" fill={`url(#${uniqueId}-body)`} stroke={darkHex} strokeWidth="0.8" />

        {/* Neck ring */}
        <ellipse cx="25" cy="22" rx="6" ry="2" fill={darkHex} opacity="0.4" />

        {/* Head sphere */}
        <circle cx="25" cy="14" r="9" fill={`url(#${uniqueId}-head)`} stroke={darkHex} strokeWidth="1" filter={`url(#${uniqueId}-shadow)`} />

        {/* Head highlight (glossy effect) */}
        <ellipse cx="22" cy="11" rx="4" ry="3" fill="rgba(255,255,255,0.45)" />

        {/* Body highlight stripe */}
        <path
          d="M 21 28 Q 20 36, 19 44 Q 18 48, 20 52"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* White ring border at base */}
        <ellipse cx="25" cy="52" rx="11" ry="3.5" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />

        {/* Stack count indicator */}
        {stackCount > 1 && (
          <>
            <circle cx="40" cy="8" r="8" fill="#1F2937" stroke="#ffffff" strokeWidth="1.5" />
            <text x="40" y="12" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="bold">
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
