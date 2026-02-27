/**
 * Local Ludo Game Engine
 * 
 * Implements complete Ludo game logic for pass-and-play mode.
 * Used as a fallback when the backend is unavailable, or as the
 * primary engine for offline play.
 * 
 * Classic Ludo Rules Implemented:
 * - 2-4 players, each with 4 tokens
 * - Roll 6 to leave base
 * - Capture opponent tokens by landing on them
 * - Safe squares protect tokens from capture
 * - Home stretch is color-specific
 * - First player to get all 4 tokens home wins
 * - Roll 6 gives extra turn
 */

// Board configuration constants
const BOARD_SIZE = 52; // Total squares on the main track
const TOKENS_PER_PLAYER = 4;
const HOME_STRETCH_LENGTH = 5; // 5 squares in the home column before home

// Player colors and their starting positions on the main track
const PLAYER_CONFIGS = [
  { color: 'red', name: 'Red', startPos: 0, homeEntryPos: 50 },
  { color: 'green', name: 'Green', startPos: 13, homeEntryPos: 11 },
  { color: 'yellow', name: 'Yellow', startPos: 26, homeEntryPos: 24 },
  { color: 'blue', name: 'Blue', startPos: 39, homeEntryPos: 37 },
];

// Safe square positions (0-indexed on the main track)
const SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];

// Token states
const TOKEN_STATE = {
  BASE: 'base',       // In the home base (not yet on board)
  ACTIVE: 'active',   // On the main track or home stretch
  HOME: 'home',       // Reached home (finished)
};

/**
 * Generate a unique game ID.
 * @returns {string} A unique identifier
 */
function generateId() {
  return 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

/**
 * Roll a six-sided die.
 * @returns {number} Value between 1 and 6
 */
function rollDieValue() {
  return Math.floor(Math.random() * 6) + 1;
}

// PUBLIC_INTERFACE
/**
 * Create a new Ludo game with given player configuration.
 * @param {object} params - { playerCount, playerNames, playerColors }
 * @returns {object} Initial game state
 */
export function createLocalGame({ playerCount = 2, playerNames = [], playerColors = [] }) {
  const players = [];
  const defaultColors = ['red', 'green', 'yellow', 'blue'];
  const defaultNames = ['Player 1', 'Player 2', 'Player 3', 'Player 4'];

  for (let i = 0; i < playerCount; i++) {
    const color = playerColors[i] || defaultColors[i];
    const config = PLAYER_CONFIGS.find(c => c.color === color) || PLAYER_CONFIGS[i];

    const tokens = [];
    for (let t = 0; t < TOKENS_PER_PLAYER; t++) {
      tokens.push({
        id: `${color}_${t}`,
        state: TOKEN_STATE.BASE,
        position: -1,         // -1 means in base
        homeStretchPos: -1,   // Position in home stretch (-1 = not in home stretch)
        stepsFromStart: 0,    // Total steps taken from start position
      });
    }

    players.push({
      index: i,
      name: playerNames[i] || defaultNames[i],
      color: color,
      startPos: config.startPos,
      homeEntryPos: config.homeEntryPos,
      tokens: tokens,
      hasFinished: false,
      finishOrder: -1,
    });
  }

  return {
    id: generateId(),
    players,
    currentPlayerIndex: 0,
    diceValue: null,
    diceRolled: false,
    hasExtraTurn: false,
    consecutiveSixes: 0,
    winner: null,
    gameOver: false,
    turnPhase: 'roll', // 'roll' or 'move'
    message: `${players[0].name}'s turn - Roll the dice!`,
    moveHistory: [],
    finishOrder: [],
  };
}

// PUBLIC_INTERFACE
/**
 * Roll the dice for the current player in a local game.
 * @param {object} gameState - Current game state
 * @returns {object} Updated game state with dice value and valid moves
 */
export function rollLocalDice(gameState) {
  if (gameState.gameOver) {
    return { ...gameState, message: 'Game is over!' };
  }
  if (gameState.turnPhase !== 'roll') {
    return { ...gameState, message: 'You must move a token first!' };
  }

  const diceValue = rollDieValue();
  const newState = {
    ...gameState,
    diceValue,
    diceRolled: true,
  };

  // Track consecutive sixes
  if (diceValue === 6) {
    newState.consecutiveSixes = (gameState.consecutiveSixes || 0) + 1;
    // Three consecutive sixes = lose turn
    if (newState.consecutiveSixes >= 3) {
      const nextPlayerIndex = getNextPlayerIndex(newState);
      return {
        ...newState,
        turnPhase: 'roll',
        diceRolled: false,
        diceValue: null,
        consecutiveSixes: 0,
        currentPlayerIndex: nextPlayerIndex,
        hasExtraTurn: false,
        message: `${gameState.players[gameState.currentPlayerIndex].name} rolled three 6s! Turn lost. ${newState.players[nextPlayerIndex].name}'s turn.`,
      };
    }
    newState.hasExtraTurn = true;
  } else {
    newState.consecutiveSixes = 0;
    newState.hasExtraTurn = false;
  }

  const validMoves = getValidMovesLocal(newState);

  // If no valid moves, advance to next player
  if (validMoves.length === 0) {
    if (newState.hasExtraTurn) {
      return {
        ...newState,
        turnPhase: 'roll',
        diceRolled: false,
        diceValue: null,
        hasExtraTurn: false,
        message: `${gameState.players[gameState.currentPlayerIndex].name} rolled ${diceValue} but has no valid moves. Roll again!`,
      };
    }
    const nextPlayerIndex = getNextPlayerIndex(newState);
    return {
      ...newState,
      turnPhase: 'roll',
      diceRolled: false,
      diceValue: null,
      currentPlayerIndex: nextPlayerIndex,
      message: `${gameState.players[gameState.currentPlayerIndex].name} rolled ${diceValue} but has no valid moves. ${newState.players[nextPlayerIndex].name}'s turn.`,
    };
  }

  // Auto-move if only one valid move
  if (validMoves.length === 1) {
    return moveLocalToken(newState, validMoves[0].tokenId);
  }

  newState.turnPhase = 'move';
  newState.message = `${gameState.players[gameState.currentPlayerIndex].name} rolled ${diceValue}. Choose a token to move.`;
  return newState;
}

// PUBLIC_INTERFACE
/**
 * Get valid moves for the current player based on dice value.
 * @param {object} gameState - Current game state
 * @returns {Array<object>} Array of { tokenId, tokenIndex } for movable tokens
 */
export function getValidMovesLocal(gameState) {
  const player = gameState.players[gameState.currentPlayerIndex];
  const diceValue = gameState.diceValue;

  if (!diceValue) return [];

  const validMoves = [];

  player.tokens.forEach((token, index) => {
    if (token.state === TOKEN_STATE.HOME) return; // Already home

    if (token.state === TOKEN_STATE.BASE) {
      // Can only leave base with a 6
      if (diceValue === 6) {
        validMoves.push({ tokenId: token.id, tokenIndex: index });
      }
    } else if (token.state === TOKEN_STATE.ACTIVE) {
      // Check if the move is within bounds
      const newSteps = token.stepsFromStart + diceValue;
      const totalPath = BOARD_SIZE + HOME_STRETCH_LENGTH + 1; // Main track + home stretch + home

      if (newSteps <= totalPath) {
        validMoves.push({ tokenId: token.id, tokenIndex: index });
      }
    }
  });

  return validMoves;
}

// PUBLIC_INTERFACE
/**
 * Move a token for the current player.
 * @param {object} gameState - Current game state
 * @param {string} tokenId - ID of the token to move
 * @returns {object} Updated game state after the move
 */
export function moveLocalToken(gameState, tokenId) {
  if (gameState.gameOver) {
    return { ...gameState, message: 'Game is over!' };
  }

  const playerIndex = gameState.currentPlayerIndex;
  const player = { ...gameState.players[playerIndex] };
  const diceValue = gameState.diceValue;
  const tokenIndex = player.tokens.findIndex(t => t.id === tokenId);

  if (tokenIndex === -1) {
    return { ...gameState, message: 'Invalid token!' };
  }

  const token = { ...player.tokens[tokenIndex] };
  let capturedToken = null;
  let message = '';

  if (token.state === TOKEN_STATE.BASE && diceValue === 6) {
    // Move token out of base to start position
    token.state = TOKEN_STATE.ACTIVE;
    token.position = player.startPos;
    token.stepsFromStart = 0;
    message = `${player.name} moves a token to the starting position.`;

    // Check for capture at start position
    capturedToken = checkCapture(gameState, playerIndex, player.startPos);
  } else if (token.state === TOKEN_STATE.ACTIVE) {
    const newSteps = token.stepsFromStart + diceValue;
    const homeEntrySteps = BOARD_SIZE; // Steps to reach home entry
    const totalPathToHome = BOARD_SIZE + HOME_STRETCH_LENGTH + 1;

    if (newSteps === totalPathToHome) {
      // Token reaches home!
      token.state = TOKEN_STATE.HOME;
      token.position = -1;
      token.homeStretchPos = -1;
      token.stepsFromStart = newSteps;
      message = `${player.name}'s token reached HOME! 🎉`;
    } else if (newSteps > homeEntrySteps) {
      // Token is in the home stretch
      token.homeStretchPos = newSteps - homeEntrySteps - 1;
      token.position = -1; // Not on main track
      token.stepsFromStart = newSteps;
      message = `${player.name} moves a token into the home stretch.`;
    } else {
      // Normal move on main track
      const newPosition = (player.startPos + newSteps) % BOARD_SIZE;
      token.position = newPosition;
      token.stepsFromStart = newSteps;
      message = `${player.name} moves a token ${diceValue} spaces.`;

      // Check for capture
      capturedToken = checkCapture(gameState, playerIndex, newPosition);
    }
  } else {
    return { ...gameState, message: 'Cannot move this token!' };
  }

  // Apply capture
  const newPlayers = gameState.players.map((p, i) => {
    if (i === playerIndex) {
      const newTokens = [...p.tokens];
      newTokens[tokenIndex] = token;
      return { ...p, tokens: newTokens };
    }
    if (capturedToken && i === capturedToken.playerIndex) {
      const newTokens = [...p.tokens];
      newTokens[capturedToken.tokenIndex] = {
        ...newTokens[capturedToken.tokenIndex],
        state: TOKEN_STATE.BASE,
        position: -1,
        homeStretchPos: -1,
        stepsFromStart: 0,
      };
      return { ...p, tokens: newTokens };
    }
    return p;
  });

  if (capturedToken) {
    message += ` Captured ${gameState.players[capturedToken.playerIndex].name}'s token! 💥`;
  }

  // Check if player has won
  const updatedPlayer = newPlayers[playerIndex];
  const allHome = updatedPlayer.tokens.every(t => t.state === TOKEN_STATE.HOME);
  let gameOver = false;
  let winner = null;
  const finishOrder = [...gameState.finishOrder];

  if (allHome && !updatedPlayer.hasFinished) {
    newPlayers[playerIndex] = { ...updatedPlayer, hasFinished: true, finishOrder: finishOrder.length };
    finishOrder.push(playerIndex);
    message += ` ${updatedPlayer.name} has finished! 🏆`;

    // Game ends when all but one player have finished, or first player finishes
    const activePlayers = newPlayers.filter(p => !p.hasFinished).length;
    if (activePlayers <= 1 || finishOrder.length === 1) {
      gameOver = true;
      winner = playerIndex;
      message = `🏆 ${updatedPlayer.name} WINS! Congratulations! 🏆`;
    }
  }

  // Determine next turn
  let nextPlayerIndex = playerIndex;
  let nextTurnPhase = 'roll';
  const hasExtraTurn = gameState.hasExtraTurn || (capturedToken !== null);

  if (!gameOver && !hasExtraTurn) {
    nextPlayerIndex = getNextPlayerIndex({ ...gameState, players: newPlayers });
  }

  if (!gameOver && !hasExtraTurn) {
    message += ` ${newPlayers[nextPlayerIndex].name}'s turn.`;
  } else if (!gameOver && hasExtraTurn) {
    message += ` ${updatedPlayer.name} gets another turn!`;
  }

  return {
    ...gameState,
    players: newPlayers,
    currentPlayerIndex: nextPlayerIndex,
    diceValue: null,
    diceRolled: false,
    turnPhase: nextTurnPhase,
    hasExtraTurn: false,
    consecutiveSixes: hasExtraTurn ? gameState.consecutiveSixes : 0,
    gameOver,
    winner,
    finishOrder,
    message,
    moveHistory: [...gameState.moveHistory, { playerIndex, tokenId, diceValue }],
  };
}

/**
 * Check if a move results in capturing an opponent's token.
 * @param {object} gameState - Current game state
 * @param {number} playerIndex - Index of the moving player
 * @param {number} position - Target position on the main track
 * @returns {object|null} { playerIndex, tokenIndex } of captured token or null
 */
function checkCapture(gameState, playerIndex, position) {
  // Cannot capture on safe squares
  if (SAFE_SQUARES.includes(position)) {
    return null;
  }

  for (let i = 0; i < gameState.players.length; i++) {
    if (i === playerIndex) continue;
    const opponent = gameState.players[i];
    for (let t = 0; t < opponent.tokens.length; t++) {
      const oppToken = opponent.tokens[t];
      if (oppToken.state === TOKEN_STATE.ACTIVE && oppToken.position === position && oppToken.homeStretchPos < 0) {
        return { playerIndex: i, tokenIndex: t };
      }
    }
  }
  return null;
}

/**
 * Get the next player index, skipping finished players.
 * @param {object} gameState - Current game state
 * @returns {number} Index of the next active player
 */
function getNextPlayerIndex(gameState) {
  const totalPlayers = gameState.players.length;
  let next = (gameState.currentPlayerIndex + 1) % totalPlayers;
  let attempts = 0;

  while (attempts < totalPlayers) {
    if (!gameState.players[next].hasFinished) {
      return next;
    }
    next = (next + 1) % totalPlayers;
    attempts++;
  }

  return gameState.currentPlayerIndex; // Fallback
}

// PUBLIC_INTERFACE
/**
 * Get the board position coordinates for rendering.
 * Returns the x, y grid coordinates for a given board position.
 * The Ludo board is a 15x15 grid.
 * @param {number} position - Board position (0-51)
 * @returns {object} { row, col } on the 15x15 grid
 */
export function getBoardCoordinates(position) {
  // Define the path around the Ludo board (15x15 grid)
  // The path goes clockwise starting from the red start
  const pathCoords = [
    // Bottom-center going up (column 6, rows 13 to 9) - 5 squares
    { row: 13, col: 6 }, // 0 - Red start (safe)
    { row: 12, col: 6 },
    { row: 11, col: 6 },
    { row: 10, col: 6 },
    { row: 9, col: 6 },
    // Turn left (row 8, cols 5 to 0) - 6 squares
    { row: 8, col: 5 },
    { row: 8, col: 4 },
    { row: 8, col: 3 },
    { row: 8, col: 2 }, // 8 - Safe
    { row: 8, col: 1 },
    { row: 8, col: 0 },
    // Turn up (rows 7, 6 at col 0) - 2 squares
    { row: 7, col: 0 },
    { row: 6, col: 0 },
    // Turn right (row 6, cols 1 to 5) then col 6 rows 5 to 1 - Green path
    { row: 6, col: 1 }, // 13 - Green start (safe)
    { row: 6, col: 2 },
    { row: 6, col: 3 },
    { row: 6, col: 4 },
    { row: 6, col: 5 },
    // Turn up (col 6, rows 5 to 1)
    { row: 5, col: 6 },
    { row: 4, col: 6 },
    { row: 3, col: 6 },
    { row: 2, col: 6 }, // 21 - Safe
    { row: 1, col: 6 },
    { row: 0, col: 6 },
    // Turn right
    { row: 0, col: 7 },
    { row: 0, col: 8 },
    // Turn down (col 8, rows 1 to 5) then row 6 cols 9 to 13
    { row: 1, col: 8 }, // 26 - Yellow start (safe)
    { row: 2, col: 8 },
    { row: 3, col: 8 },
    { row: 4, col: 8 },
    { row: 5, col: 8 },
    // Turn right
    { row: 6, col: 9 },
    { row: 6, col: 10 },
    { row: 6, col: 11 },
    { row: 6, col: 12 }, // 34 - Safe
    { row: 6, col: 13 },
    { row: 6, col: 14 },
    // Turn down
    { row: 7, col: 14 },
    { row: 8, col: 14 },
    // Turn left (row 8, cols 13 to 9) then col 8 rows 9 to 13
    { row: 8, col: 13 }, // 39 - Blue start (safe)
    { row: 8, col: 12 },
    { row: 8, col: 11 },
    { row: 8, col: 10 },
    { row: 8, col: 9 },
    // Turn down
    { row: 9, col: 8 },
    { row: 10, col: 8 },
    { row: 11, col: 8 },
    { row: 12, col: 8 }, // 47 - Safe
    { row: 13, col: 8 },
    { row: 14, col: 8 },
    // Turn left
    { row: 14, col: 7 },
    { row: 14, col: 6 }, // 50 - back near red home entry
    // Continue...
    { row: 13, col: 7 }, // 51 - not used in standard path, wraps to 0
  ];

  if (position >= 0 && position < pathCoords.length) {
    return pathCoords[position];
  }
  return { row: 7, col: 7 }; // Center fallback
}

// PUBLIC_INTERFACE
/**
 * Get home stretch coordinates for a player.
 * @param {string} color - Player color
 * @param {number} homeStretchPos - Position in home stretch (0-4)
 * @returns {object} { row, col } on the 15x15 grid
 */
export function getHomeStretchCoordinates(color, homeStretchPos) {
  const homeStretchPaths = {
    red: [
      { row: 13, col: 7 },
      { row: 12, col: 7 },
      { row: 11, col: 7 },
      { row: 10, col: 7 },
      { row: 9, col: 7 },
    ],
    green: [
      { row: 7, col: 1 },
      { row: 7, col: 2 },
      { row: 7, col: 3 },
      { row: 7, col: 4 },
      { row: 7, col: 5 },
    ],
    yellow: [
      { row: 1, col: 7 },
      { row: 2, col: 7 },
      { row: 3, col: 7 },
      { row: 4, col: 7 },
      { row: 5, col: 7 },
    ],
    blue: [
      { row: 7, col: 13 },
      { row: 7, col: 12 },
      { row: 7, col: 11 },
      { row: 7, col: 10 },
      { row: 7, col: 9 },
    ],
  };

  const path = homeStretchPaths[color];
  if (path && homeStretchPos >= 0 && homeStretchPos < path.length) {
    return path[homeStretchPos];
  }
  return { row: 7, col: 7 }; // Center (home)
}

// PUBLIC_INTERFACE
/**
 * Get base coordinates for a player's tokens.
 * @param {string} color - Player color
 * @param {number} tokenIndex - Token index (0-3)
 * @returns {object} { row, col } on the 15x15 grid
 */
export function getBaseCoordinates(color, tokenIndex) {
  const bases = {
    red: [
      { row: 10, col: 1 }, { row: 10, col: 4 },
      { row: 13, col: 1 }, { row: 13, col: 4 },
    ],
    green: [
      { row: 1, col: 1 }, { row: 1, col: 4 },
      { row: 4, col: 1 }, { row: 4, col: 4 },
    ],
    yellow: [
      { row: 1, col: 10 }, { row: 1, col: 13 },
      { row: 4, col: 10 }, { row: 4, col: 13 },
    ],
    blue: [
      { row: 10, col: 10 }, { row: 10, col: 13 },
      { row: 13, col: 10 }, { row: 13, col: 13 },
    ],
  };

  const basePositions = bases[color];
  if (basePositions && tokenIndex >= 0 && tokenIndex < basePositions.length) {
    return basePositions[tokenIndex];
  }
  return { row: 7, col: 7 };
}
