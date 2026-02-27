import React, { useState, useCallback } from 'react';
import { useSound } from '../services/SoundContext';
import './Dice.css';

// Dice face SVG dot patterns for values 1-6
const DICE_DOTS = {
  1: [{ cx: 50, cy: 50 }],
  2: [{ cx: 28, cy: 28 }, { cx: 72, cy: 72 }],
  3: [{ cx: 28, cy: 28 }, { cx: 50, cy: 50 }, { cx: 72, cy: 72 }],
  4: [{ cx: 28, cy: 28 }, { cx: 72, cy: 28 }, { cx: 28, cy: 72 }, { cx: 72, cy: 72 }],
  5: [{ cx: 28, cy: 28 }, { cx: 72, cy: 28 }, { cx: 50, cy: 50 }, { cx: 28, cy: 72 }, { cx: 72, cy: 72 }],
  6: [{ cx: 28, cy: 28 }, { cx: 72, cy: 28 }, { cx: 28, cy: 50 }, { cx: 72, cy: 50 }, { cx: 28, cy: 72 }, { cx: 72, cy: 72 }],
};

// PUBLIC_INTERFACE
/**
 * Dice component with enhanced roll animation and sound effects.
 * Displays a die face and triggers roll action on click.
 * @param {object} props - { value, onRoll, disabled, rolling, playerColor }
 */
function Dice({ value, onRoll, disabled, rolling, playerColor }) {
  const [isAnimating, setIsAnimating] = useState(false);
  const { playDiceRoll } = useSound();

  /**
   * Handle dice click - triggers roll with animation and sound.
   */
  const handleClick = useCallback(() => {
    if (disabled || isAnimating) return;
    setIsAnimating(true);

    // Play dice roll sound
    playDiceRoll();

    // Animation duration
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);

    onRoll();
  }, [disabled, isAnimating, onRoll, playDiceRoll]);

  const displayValue = value || 1;
  const dots = DICE_DOTS[displayValue] || DICE_DOTS[1];
  const animClass = (rolling || isAnimating) ? 'dice-rolling' : (value ? 'dice-result' : '');
  const disabledClass = disabled ? 'dice-disabled' : '';

  return (
    <div className="dice-container">
      <button
        className={`dice-button ${animClass} ${disabledClass}`}
        onClick={handleClick}
        disabled={disabled}
        aria-label={`Roll dice${value ? `. Current value: ${value}` : ''}`}
        style={{
          '--dice-accent': playerColor || '#B45309',
        }}
      >
        <svg viewBox="0 0 100 100" className="dice-face">
          <defs>
            <linearGradient id="dice-bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFDF5" />
              <stop offset="100%" stopColor="#FFF7ED" />
            </linearGradient>
            <filter id="dice-inner-shadow">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="rgba(0,0,0,0.1)" />
            </filter>
          </defs>
          {/* Dice body with rounded corners */}
          <rect
            x="3" y="3" width="94" height="94"
            rx="14" ry="14"
            fill="url(#dice-bg-grad)"
            stroke={playerColor || '#B45309'}
            strokeWidth="3"
          />
          {/* Inner border for depth */}
          <rect
            x="7" y="7" width="86" height="86"
            rx="11" ry="11"
            fill="none"
            stroke="rgba(0,0,0,0.04)"
            strokeWidth="1"
          />
          {/* Dots with slight shadow for depth */}
          {dots.map((dot, i) => (
            <g key={i} filter="url(#dice-inner-shadow)">
              <circle
                cx={dot.cx}
                cy={dot.cy}
                r="9.5"
                fill="#1F2937"
              />
              {/* Dot highlight */}
              <circle
                cx={dot.cx - 2}
                cy={dot.cy - 2}
                r="3"
                fill="rgba(255,255,255,0.15)"
              />
            </g>
          ))}
        </svg>
      </button>
      {!disabled && !value && (
        <span className="dice-hint">Tap to roll</span>
      )}
      {value && (
        <span className="dice-value">Rolled: {value}</span>
      )}
    </div>
  );
}

export default Dice;
