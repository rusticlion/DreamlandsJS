/**
 * API client for interacting with the Dreamlands backend server
 */

const API_URL = process.env.API_URL || 'http://localhost:3000';

/**
 * Get all messages
 * @returns {Promise<Array>} Array of message objects
 */
export async function getMessages() {
  try {
    const response = await fetch(`${API_URL}/messages`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    throw error;
  }
}

/**
 * Get messages for a specific level
 * @param {string} level - Level identifier
 * @returns {Promise<Array>} Array of message objects for the specified level
 */
export async function getMessagesByLevel(level) {
  try {
    const response = await fetch(`${API_URL}/messages/level/${level}`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch messages for level ${level}:`, error);
    throw error;
  }
}

/**
 * Create a new message
 * @param {Object} message - Message object with text, x, y, and optional level
 * @returns {Promise<Object>} Created message object
 */
export async function createMessage(message) {
  try {
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message)
    });
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to create message:', error);
    throw error;
  }
}

/**
 * Check server health
 * @returns {Promise<Object>} Health status object
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to check server health:', error);
    throw error;
  }
}