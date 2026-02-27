import React, { useState, useCallback } from 'react';
import './Dice.css';

// Dice face SVG dot patterns for values 1-6
const DICE_DOTS = {
  1: [{ cx: 50, cy: 50 }],
  2: [{ cx: 25, cy: 25 }, { cx: 75, cy: 75 }],
  3: [{ cx: 25, cy: 25 }, { cx: 50, cy: 50 }, { cx: 75, cy: 75 }],
  4: [{ cx: 25, cy: 25 }, { cx: 75, cy: 25 }, { cx: 25, cy: 75 }, { cx: 75, cy: 75 }],
  5: [{ cx: 25, cy: 25 }, { cx: 75, cy: 25 }, { cx: 50, cy: 50 }, { cx: 25, cy: 75 }, { cx: 75, cy: 75 }],
  6: [{ cx: 25, cy: 25 }, { cx: 75, cy: 25 }, { cx: 25, cy: 50 }, { cx: 75, cy: 50 }, { cx: 25, cy: 75 }, { cx: 75, cy: 75 }],
};

// PUBLIC_INTERFACE
/**
 * Dice component with roll animation.
 * Displays a die face and triggers roll action on click.
 * @param {object} props - { value, onRoll, disabled, rolling, playerColor }
 */
function Dice({ value, onRoll, disabled, rolling, playerColor }) {
  const [isAnimating, setIsAnimating] = useState(false);

  /**
   * Handle dice click - triggers roll with animation.
   */
  const handleClick = useCallback(() => {
    if (disabled || isAnimating) return;
    setIsAnimating(true);

    // Animation duration
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);

    onRoll();
  }, [disabled, isAnimating, onRoll]);

  const displayValue = value || 1;
  const dots = DICE_DOTS[displayValue] || DICE_DOTS[1];
  const animClass = (rolling || isAnimating) ? 'dice-rolling' : '';
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
          <rect
            x="2" y="2" width="96" height="96"
            rx="12" ry="12"
            fill="#FFFBEB"
            stroke={playerColor || '#B45309'}
            strokeWidth="3"
          />
          {dots.map((dot, i) => (
            <circle
              key={i}
              cx={dot.cx}
              cy={dot.cy}
              r="10"
              fill="#1F2937"
            />
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
