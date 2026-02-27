import React, { useState } from 'react';
import './SetupScreen.css';

const AVAILABLE_COLORS = [
  { id: 'red', label: 'Red', hex: '#EF4444' },
  { id: 'green', label: 'Green', hex: '#22C55E' },
  { id: 'yellow', label: 'Yellow', hex: '#EAB308' },
  { id: 'blue', label: 'Blue', hex: '#3B82F6' },
];

// PUBLIC_INTERFACE
/**
 * SetupScreen component for configuring a new Ludo game.
 * Allows selection of player count (2-4), player names, and colors.
 * @param {object} props - { onStartGame: function({ playerCount, playerNames, playerColors }) }
 */
function SetupScreen({ onStartGame }) {
  const [playerCount, setPlayerCount] = useState(2);
  const [playerNames, setPlayerNames] = useState(['', '', '', '']);
  const [playerColors, setPlayerColors] = useState(['red', 'green', 'yellow', 'blue']);

  /**
   * Handle player count change and reset colors if needed.
   * @param {number} count - Number of players (2-4)
   */
  const handlePlayerCountChange = (count) => {
    setPlayerCount(count);
  };

  /**
   * Handle player name change.
   * @param {number} index - Player index
   * @param {string} name - New name value
   */
  const handleNameChange = (index, name) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  /**
   * Handle color selection for a player.
   * @param {number} index - Player index
   * @param {string} colorId - Selected color ID
   */
  const handleColorChange = (index, colorId) => {
    const newColors = [...playerColors];
    // Swap colors if another player has the selected color
    const existingIndex = newColors.findIndex((c, i) => i !== index && i < playerCount && c === colorId);
    if (existingIndex !== -1) {
      newColors[existingIndex] = newColors[index];
    }
    newColors[index] = colorId;
    setPlayerColors(newColors);
  };

  /**
   * Submit game configuration and start the game.
   */
  const handleStart = () => {
    const names = playerNames.map((name, i) =>
      name.trim() || `Player ${i + 1}`
    );
    onStartGame({
      playerCount,
      playerNames: names.slice(0, playerCount),
      playerColors: playerColors.slice(0, playerCount),
    });
  };

  return (
    <div className="setup-screen">
      <div className="setup-card">
        <h1 className="setup-title">🎲 Classic Ludo</h1>
        <p className="setup-subtitle">Pass & Play Board Game</p>

        {/* Player Count Selection */}
        <div className="setup-section">
          <label className="setup-label">Number of Players</label>
          <div className="player-count-selector">
            {[2, 3, 4].map((count) => (
              <button
                key={count}
                className={`count-btn ${playerCount === count ? 'count-btn-active' : ''}`}
                onClick={() => handlePlayerCountChange(count)}
                aria-label={`${count} players`}
              >
                {count}
              </button>
            ))}
          </div>
        </div>

        {/* Player Configuration */}
        <div className="setup-section">
          <label className="setup-label">Player Settings</label>
          {Array.from({ length: playerCount }).map((_, index) => (
            <div key={index} className="player-config">
              <div
                className="player-color-indicator"
                style={{ backgroundColor: AVAILABLE_COLORS.find(c => c.id === playerColors[index])?.hex }}
              />
              <input
                type="text"
                className="player-name-input"
                placeholder={`Player ${index + 1}`}
                value={playerNames[index]}
                onChange={(e) => handleNameChange(index, e.target.value)}
                maxLength={15}
                aria-label={`Player ${index + 1} name`}
              />
              <div className="color-picker">
                {AVAILABLE_COLORS.map((color) => {
                  const isUsedByOther = playerColors.findIndex((c, i) => i !== index && i < playerCount && c === color.id) !== -1;
                  return (
                    <button
                      key={color.id}
                      className={`color-btn ${playerColors[index] === color.id ? 'color-btn-selected' : ''} ${isUsedByOther ? 'color-btn-dimmed' : ''}`}
                      style={{ backgroundColor: color.hex }}
                      onClick={() => handleColorChange(index, color.id)}
                      aria-label={`Select ${color.label}`}
                      title={color.label}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Start Button */}
        <button className="start-btn" onClick={handleStart}>
          Start Game 🎮
        </button>
      </div>
    </div>
  );
}

export default SetupScreen;
