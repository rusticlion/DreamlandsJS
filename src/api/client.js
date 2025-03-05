/**
 * API client for interacting with the Dreamlands backend server
 */

// Dynamically set the API URL based on the environment
// In development: use localhost or the environment variable
// In production: use the Heroku backend URL
let baseUrl = process.env.API_URL || 
              (window.location.hostname === 'localhost' 
                ? 'http://localhost:3000' 
                : 'https://dreamlands-server.herokuapp.com');

// Normalize the URL to ensure it doesn't end with a slash
const API_URL = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

/**
 * Get all messages
 * @returns {Promise<Array>} Array of message objects
 */
export async function getMessages() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_URL}/messages`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch messages:', error);
    // Return empty array instead of throwing to gracefully handle server being down
    return [];
  }
}

/**
 * Get messages for a specific level
 * @param {string} level - Level identifier
 * @returns {Promise<Array>} Array of message objects for the specified level
 */
export async function getMessagesByLevel(level) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_URL}/messages/level/${level}`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch messages for level ${level}:`, error);
    // Return empty array instead of throwing
    return [];
  }
}

/**
 * Create a new message
 * @param {Object} message - Message object with text, x, y, and optional level
 * @returns {Promise<Object>} Created message object
 */
export async function createMessage(message) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(message),
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to create message:', error);
    // Return a dummy success response when the server is unavailable
    // This allows the game to continue without disrupting the player experience
    return {
      ...message,
      _id: `local-${Date.now()}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Check server health
 * @returns {Promise<Object>} Health status object
 */
export async function checkHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${API_URL}/health`, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to check server health:', error);
    // Return a fallback status object
    return { 
      status: 'unavailable',
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}