/**
 * Research API Client
 * 
 * Provides functions to interact with the ScholarFlow backend API.
 */

// Use environment variable for deployment, fallback to localhost for dev
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const WS_BASE = API_BASE.replace('http://', 'ws://').replace('https://', 'wss://');

/**
 * Get the WebSocket URL for research.
 */
export function getWebSocketUrl() {
  return `${WS_BASE}/ws/research`;
}

/**
 * Get the API base URL for REST calls.
 */
export function getApiBaseUrl() {
  return API_BASE;
}

/**
 * Start a new research session.
 * 
 * @param {string} query - The research query
 * @returns {Promise<Object>} Session info with initial plan
 */
export async function startResearch(query) {
  const response = await fetch(`${API_BASE}/api/v1/research/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start research: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Execute the next step in the research workflow.
 * 
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} Updated session state
 */
export async function nextStep(sessionId) {
  const response = await fetch(`${API_BASE}/api/v1/research/next-step`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ session_id: sessionId }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get next step: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get full session details.
 * 
 * @param {string} sessionId - The session ID
 * @returns {Promise<Object>} Full session state
 */
export async function getSession(sessionId) {
  const response = await fetch(`${API_BASE}/api/v1/session/${sessionId}`);

  if (!response.ok) {
    throw new Error(`Failed to get session: ${response.statusText}`);
  }

  return response.json();
}
