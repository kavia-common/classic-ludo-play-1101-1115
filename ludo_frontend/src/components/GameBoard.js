import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import Token from './Token';
import { useSound } from '../services/SoundContext';
import {
  getBoardCoordinates,
  getHomeStretchCoordinates,
  getBaseCoordinates,
} from '../services/gameEngine';
import './GameBoard.css';

const BOARD_SIZE = 15;

// Safe square positions on the main track
const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

// Total squares on the main board track
const MAIN_TRACK_SIZE = 52;

/**
 * Determine the background color category of a cell on the 15x15 grid.
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {string} CSS class for the cell
 */
function getCellType(row, col) {
  // Red base area (bottom-left): rows 9-14, cols 0-5
  if (row >= 9 && row <= 14 && col >= 0 && col <= 5) {
    if ((row >= 9 && row <= 14 && col === 6) || (row === 8 && col >= 0 && col <= 5)) {
      return 'cell-path';
    }
    return 'cell-red-base';
  }
  // Green base area (top-left): rows 0-5, cols 0-5
  if (row >= 0 && row <= 5 && col >= 0 && col <= 5) {
    return 'cell-green-base';
  }
  // Yellow base area (top-right): rows 0-5, cols 9-14
  if (row >= 0 && row <= 5 && col >= 9 && col <= 14) {
    return 'cell-yellow-base';
  }
  // Blue base area (bottom-right): rows 9-14, cols 9-14
  if (row >= 9 && row <= 14 && col >= 9 && col <= 14) {
    return 'cell-blue-base';
  }
  // Center home area: rows 6-8, cols 6-8
  if (row >= 6 && row <= 8 && col >= 6 && col <= 8) {
    return 'cell-home-center';
  }
  // Home stretch cells
  if (col === 7 && row >= 9 && row <= 13) return 'cell-red-stretch';
  if (row === 7 && col >= 1 && col <= 5) return 'cell-green-stretch';
  if (col === 7 && row >= 1 && row <= 5) return 'cell-yellow-stretch';
  if (row === 7 && col >= 9 && col <= 13) return 'cell-blue-stretch';

  return 'cell-path';
}

/**
 * Check if a cell is part of a base interior (where tokens sit before entering play).
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {boolean}
 */
function isBaseInterior(row, col) {
  if ((row === 10 || row === 13) && (col === 1 || col === 4)) return true;
  if ((row === 1 || row === 4) && (col === 1 || col === 4)) return true;
  if ((row === 1 || row === 4) && (col === 10 || col === 13)) return true;
  if ((row === 10 || row === 13) && (col === 10 || col === 13)) return true;
  return false;
}

/**
 * Check if a cell at (row, col) corresponds to a safe square on the path.
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {boolean}
 */
function isSafeSquare(row, col) {
  for (const pos of SAFE_SQUARES) {
    const coord = getBoardCoordinates(pos);
    if (coord.row === row && coord.col === col) return true;
  }
  return false;
}

/**
 * Compute intermediate positions for step-by-step animation.
 * @param {object} prevToken - Previous token state { state, position, homeStretchPos, stepsFromStart }
 * @param {object} currToken - Current token state
 * @param {string} color - Player color
 * @param {number} startPos - Player start position on main track
 * @returns {Array<{row, col}>} Array of intermediate grid coordinates
 */
function computeIntermediateSteps(prevToken, currToken, color, startPos) {
  const steps = [];

  // Token just left base -> only one step (start position)
  if (prevToken.state === 'base' && currToken.state === 'active') {
    return []; // No intermediate, just appear at start
  }

  // Token was active, now moved further
  if (prevToken.state === 'active' && (currToken.state === 'active' || currToken.state === 'home')) {
    const prevSteps = prevToken.stepsFromStart;
    const currSteps = currToken.stepsFromStart;

    for (let s = prevSteps + 1; s <= currSteps; s++) {
      if (s > MAIN_TRACK_SIZE) {
        // In home stretch
        const hsPos = s - MAIN_TRACK_SIZE - 1;
        if (hsPos >= 0 && hsPos < 5) {
          const coord = getHomeStretchCoordinates(color, hsPos);
          steps.push(coord);
        }
      } else {
        // On main track
        const boardPos = (startPos + s) % MAIN_TRACK_SIZE;
        const coord = getBoardCoordinates(boardPos);
        steps.push(coord);
      }
    }
  }

  return steps;
}

// PUBLIC_INTERFACE
/**
 * GameBoard component rendering the 15x15 Ludo board with all tokens.
 * Supports step-by-step token movement animation.
 * @param {object} props - { players, currentPlayerIndex, validMoves, onTokenClick, diceValue }
 */
function GameBoard({ players, currentPlayerIndex, validMoves, onTokenClick, diceValue }) {
  const { playTokenStep, playCapture, playExitBase, playHome } = useSound();
  const [animatingTokenId, setAnimatingTokenId] = useState(null);
  const [animationOverrides, setAnimationOverrides] = useState({});
  const prevPlayersRef = useRef(null);
  const animationInProgressRef = useRef(false);

  // Detect token changes and trigger step-by-step animation
  useEffect(() => {
    if (!prevPlayersRef.current || animationInProgressRef.current) {
      prevPlayersRef.current = players;
      return;
    }

    const prevPlayers = prevPlayersRef.current;

    // Find which token moved
    for (let pi = 0; pi < players.length; pi++) {
      const currPlayer = players[pi];
      const prevPlayer = prevPlayers[pi];
      if (!prevPlayer) continue;

      for (let ti = 0; ti < currPlayer.tokens.length; ti++) {
        const currToken = currPlayer.tokens[ti];
        const prevToken = prevPlayer.tokens[ti];

        // Check if this token changed
        if (prevToken.state !== currToken.state ||
            prevToken.position !== currToken.position ||
            prevToken.homeStretchPos !== currToken.homeStretchPos) {

          // Token left base
          if (prevToken.state === 'base' && currToken.state === 'active') {
            playExitBase();
            setAnimatingTokenId(currToken.id);
            setTimeout(() => setAnimatingTokenId(null), 400);
            prevPlayersRef.current = players;
            return;
          }

          // Token reached home
          if (currToken.state === 'home' && prevToken.state !== 'home') {
            playHome();
            prevPlayersRef.current = players;
            return;
          }

          // Token was sent back to base (captured)
          if (currToken.state === 'base' && prevToken.state === 'active') {
            playCapture();
            prevPlayersRef.current = players;
            return;
          }

          // Normal movement - animate step by step
          if (prevToken.state === 'active' && currToken.state === 'active') {
            const intermediateSteps = computeIntermediateSteps(
              prevToken, currToken, currPlayer.color, currPlayer.startPos
            );

            if (intermediateSteps.length > 1) {
              animationInProgressRef.current = true;

              // Animate through each intermediate step
              intermediateSteps.forEach((stepCoord, stepIdx) => {
                setTimeout(() => {
                  playTokenStep();
                  setAnimatingTokenId(currToken.id);
                  setAnimationOverrides(prev => ({
                    ...prev,
                    [currToken.id]: stepCoord,
                  }));

                  // Clear animation on last step
                  if (stepIdx === intermediateSteps.length - 1) {
                    setTimeout(() => {
                      setAnimatingTokenId(null);
                      setAnimationOverrides(prev => {
                        const next = { ...prev };
                        delete next[currToken.id];
                        return next;
                      });
                      animationInProgressRef.current = false;
                    }, 120);
                  }
                }, stepIdx * 150); // 150ms per step
              });

              prevPlayersRef.current = players;
              return;
            } else if (intermediateSteps.length === 1) {
              // Single step move
              playTokenStep();
              setAnimatingTokenId(currToken.id);
              setTimeout(() => setAnimatingTokenId(null), 200);
            }
          }
        }
      }
    }

    prevPlayersRef.current = players;
  }, [players, playTokenStep, playCapture, playExitBase, playHome]);

  // Build a map of positions to tokens for efficient rendering
  const tokenPositions = useMemo(() => {
    const posMap = {};

    players.forEach((player) => {
      player.tokens.forEach((token, tokenIdx) => {
        let coord = null;
        let key = null;

        // Check if there's an animation override for this token
        const override = animationOverrides[token.id];
        if (override) {
          coord = override;
          key = `anim_${override.row}_${override.col}`;
        } else if (token.state === 'base') {
          coord = getBaseCoordinates(player.color, tokenIdx);
          key = `base_${coord.row}_${coord.col}`;
        } else if (token.state === 'active') {
          if (token.homeStretchPos >= 0) {
            coord = getHomeStretchCoordinates(player.color, token.homeStretchPos);
            key = `hs_${coord.row}_${coord.col}`;
          } else {
            coord = getBoardCoordinates(token.position);
            key = `pos_${coord.row}_${coord.col}`;
          }
        } else if (token.state === 'home') {
          coord = { row: 7, col: 7 };
          key = `home_${player.color}_${tokenIdx}`;
        }

        if (coord) {
          if (!posMap[key]) {
            posMap[key] = { row: coord.row, col: coord.col, tokens: [] };
          }
          posMap[key].tokens.push({
            id: token.id,
            color: player.color,
            playerIndex: player.index,
            tokenIndex: tokenIdx,
            state: token.state,
          });
        }
      });
    });

    return posMap;
  }, [players, animationOverrides]);

  // Build set of valid token IDs for highlighting
  const validTokenIds = useMemo(() => {
    return new Set((validMoves || []).map(m => m.tokenId));
  }, [validMoves]);

  // Memoize onTokenClick handlers
  const handleTokenClick = useCallback((tokenId) => {
    if (animationInProgressRef.current) return; // Block clicks during animation
    onTokenClick(tokenId);
  }, [onTokenClick]);

  // Render the grid
  const cells = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      const cellType = getCellType(row, col);
      const isBase = isBaseInterior(row, col);
      const isSafe = isSafeSquare(row, col);

      // Find tokens at this position
      const posKeys = Object.keys(tokenPositions).filter(key => {
        const pos = tokenPositions[key];
        return pos.row === row && pos.col === col;
      });

      const tokensHere = posKeys.flatMap(key => tokenPositions[key].tokens);

      cells.push(
        <div
          key={`${row}-${col}`}
          className={`board-cell ${cellType} ${isBase ? 'cell-base-spot' : ''} ${isSafe ? 'cell-safe' : ''}`}
          style={{ gridRow: row + 1, gridColumn: col + 1 }}
        >
          {isSafe && <span className="safe-star">★</span>}
          {tokensHere.map((tokenData, i) => (
            <Token
              key={tokenData.id}
              color={tokenData.color}
              isHighlighted={validTokenIds.has(tokenData.id)}
              onClick={() => handleTokenClick(tokenData.id)}
              isInBase={tokenData.state === 'base'}
              tokenIndex={i}
              stackCount={tokensHere.length > 1 ? tokensHere.length : 0}
              isAnimating={animatingTokenId === tokenData.id}
            />
          ))}
        </div>
      );
    }
  }

  return (
    <div className="game-board-wrapper">
      <div className="game-board">
        {cells}
      </div>
    </div>
  );
}

export default GameBoard;
