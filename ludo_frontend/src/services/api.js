/**
 * API Client for the Ludo Backend.
 * Provides methods to interact with the backend REST API.
 * Falls back to local game engine if backend is unavailable.
 */

// Backend API base URL - reads from environment or defaults to port 3001
// REACT_APP_API_URL should be set in .env file pointing to the backend
const API_BASE = process.env.REACT_APP_API_URL || '/api';

/**
 * Helper to perform fetch requests with error handling.
 * @param {string} endpoint - API endpoint path
 * @param {object} options - fetch options
 * @returns {Promise<object>} parsed JSON response
 */
async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    // If it's a network error (backend unavailable), throw a specific error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      throw new Error('BACKEND_UNAVAILABLE');
    }
    throw error;
  }
}

// PUBLIC_INTERFACE
/**
 * Create a new Ludo game.
 * @param {object} params - { playerCount, playerNames, playerColors }
 * @returns {Promise<object>} Game state object
 */
export async function createGame(params) {
  return request('/games', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// PUBLIC_INTERFACE
/**
 * Get the current game state.
 * @param {string} gameId - The game identifier
 * @returns {Promise<object>} Game state object
 */
export async function getGameState(gameId) {
  return request(`/games/${gameId}`);
}

// PUBLIC_INTERFACE
/**
 * Roll the dice for the current player.
 * @param {string} gameId - The game identifier
 * @returns {Promise<object>} { diceValue, validMoves, gameState }
 */
export async function rollDice(gameId) {
  return request(`/games/${gameId}/roll`, {
    method: 'POST',
  });
}

// PUBLIC_INTERFACE
/**
 * Move a token on the board.
 * @param {string} gameId - The game identifier
 * @param {object} params - { tokenId, playerIndex }
 * @returns {Promise<object>} Updated game state
 */
export async function moveToken(gameId, params) {
  return request(`/games/${gameId}/move`, {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

// PUBLIC_INTERFACE
/**
 * Get valid moves for the current dice roll.
 * @param {string} gameId - The game identifier
 * @returns {Promise<object>} { validMoves }
 */
export async function getValidMoves(gameId) {
  return request(`/games/${gameId}/valid-moves`);
}

// PUBLIC_INTERFACE
/**
 * Check backend health status.
 * @returns {Promise<boolean>} true if backend is healthy
 */
export async function checkHealth() {
  try {
    await request('/');
    return true;
  } catch {
    return false;
  }
}
