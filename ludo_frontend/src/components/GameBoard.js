import React, { useMemo } from 'react';
import Token from './Token';
import {
  getBoardCoordinates,
  getHomeStretchCoordinates,
  getBaseCoordinates,
} from '../services/gameEngine';
import './GameBoard.css';

const BOARD_SIZE = 15;

// Safe square positions on the main track
const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

/**
 * Determine the background color category of a cell on the 15x15 grid.
 * @param {number} row - Row index
 * @param {number} col - Column index
 * @returns {string} CSS class for the cell
 */
function getCellType(row, col) {
  // Red base area (bottom-left): rows 9-14, cols 0-5
  if (row >= 9 && row <= 14 && col >= 0 && col <= 5) {
    // Path cells within the red zone
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
  // Red home stretch: col 7, rows 9-13
  if (col === 7 && row >= 9 && row <= 13) return 'cell-red-stretch';
  // Green home stretch: row 7, cols 1-5
  if (row === 7 && col >= 1 && col <= 5) return 'cell-green-stretch';
  // Yellow home stretch: col 7, rows 1-5
  if (col === 7 && row >= 1 && row <= 5) return 'cell-yellow-stretch';
  // Blue home stretch: row 7, cols 9-13
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
  // Red base interior spots
  if ((row === 10 || row === 13) && (col === 1 || col === 4)) return true;
  // Green base interior spots
  if ((row === 1 || row === 4) && (col === 1 || col === 4)) return true;
  // Yellow base interior spots
  if ((row === 1 || row === 4) && (col === 10 || col === 13)) return true;
  // Blue base interior spots
  if ((row === 10 || row === 13) && (col === 10 || col === 13)) return true;
  return false;
}

// PUBLIC_INTERFACE
/**
 * GameBoard component rendering the 15x15 Ludo board with all tokens.
 * @param {object} props - { players, currentPlayerIndex, validMoves, onTokenClick, diceValue }
 */
function GameBoard({ players, currentPlayerIndex, validMoves, onTokenClick, diceValue }) {
  // Build a map of positions to tokens for efficient rendering
  const tokenPositions = useMemo(() => {
    const posMap = {};

    players.forEach((player) => {
      player.tokens.forEach((token, tokenIdx) => {
        let coord = null;
        let key = null;

        if (token.state === 'base') {
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
          // Tokens that reached home are shown in center
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
  }, [players]);

  // Build set of valid token IDs for highlighting
  const validTokenIds = useMemo(() => {
    return new Set((validMoves || []).map(m => m.tokenId));
  }, [validMoves]);

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
              onClick={() => onTokenClick(tokenData.id)}
              isInBase={tokenData.state === 'base'}
              tokenIndex={i}
              stackCount={tokensHere.length > 1 ? tokensHere.length : 0}
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

export default GameBoard;
