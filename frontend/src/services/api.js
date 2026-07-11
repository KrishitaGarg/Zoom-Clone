/**
 * Reusable frontend API service for communicating with the FastAPI backend.
 * Uses standard fetch, handles non-2xx responses, and extracts structured FastAPI error messages.
 */

const API_URL = (typeof process !== "undefined" && process.env && process.env.NEXT_PUBLIC_API_URL) || "/api";

export function getMeetingWebSocketUrl(meetingId) {
  if (typeof window === "undefined") return null;
  const backend = new URL(API_URL, window.location.origin);
  const protocol = backend.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${backend.host}/ws/meetings/${encodeURIComponent(meetingId)}`;
}

/**
 * Reusable request helper that wraps standard fetch, parses JSON safely,
 * and extracts detail error messages from FastAPI.
 * 
 * @param {string} endpoint - The API endpoint path (e.g., "/meetings/upcoming")
 * @param {object} [options={}] - Standard fetch configuration options
 * @returns {Promise<any>} The parsed JSON response
 */
async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  // Set default headers for JSON payload handling
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);

    // Parse JSON safely
    let data = null;
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      data = await response.json();
    } else {
      // Non-JSON response
      const text = await response.text();
      data = text ? { detail: text } : null;
    }

    if (!response.ok) {
      // Extract FastAPI detail error if available
      let errorMessage = `Request failed with status ${response.status}`;
      
      if (data && data.detail) {
        if (Array.isArray(data.detail)) {
          // Parse Pydantic validation errors
          errorMessage = data.detail.map((err) => `${err.loc ? err.loc.join('.') + ': ' : ''}${err.msg}`).join("; ");
        } else if (typeof data.detail === "string") {
          errorMessage = data.detail;
        } else if (typeof data.detail === "object") {
          errorMessage = JSON.stringify(data.detail);
        }
      }
      
      const error = new Error(errorMessage);
      error.status = response.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (error) {
    // If it's already our structured error, rethrow it
    if (error.status) {
      throw error;
    }
    // Network or parse errors
    console.error(`API fetch error at ${url}:`, error);
    throw new Error(error.message || "Server is unreachable. Please check your network connection.");
  }
}

/**
 * Retrieves the pre-seeded default application user.
 * 
 * @returns {Promise<object>} The default user object.
 */
export async function getDefaultUser() {
  return request("/users/default");
}

/**
 * Dynamically retrieves scheduled meetings starting in the future.
 * 
 * @returns {Promise<Array>} List of upcoming scheduled meetings.
 */
export async function getUpcomingMeetings() {
  return request("/meetings/upcoming");
}

/**
 * Dynamically retrieves past scheduled meetings or completed meetings.
 * 
 * @returns {Promise<Array>} List of recent meetings.
 */
export async function getRecentMeetings() {
  return request("/meetings/recent");
}

/**
 * Verifies and returns a specific meeting by its public_meeting_id.
 * 
 * @param {string} meetingId - The Zoom-style public meeting ID (XXX-XXX-XXXX).
 * @returns {Promise<object>} The meeting details.
 */
export async function getMeeting(meetingId) {
  return request(`/meetings/${meetingId}`);
}

/**
 * Registers a new instant meeting in the database.
 * Instantly marks status as 'live' and starts the session.
 * 
 * @param {number} hostId - The database ID of the host user.
 * @returns {Promise<object>} The created meeting details.
 */
export async function createInstantMeeting(hostId) {
  return request("/meetings/instant", {
    method: "POST",
    body: JSON.stringify({
      host_id: hostId,
      title: "Instant Meeting"
    }),
  });
}

/**
 * Saves a scheduled meeting for a future date and time.
 * 
 * @param {object} payload - The meeting scheduling payload.
 * @param {string} payload.title - Title of the meeting.
 * @param {string} [payload.description] - Optional description.
 * @param {number} payload.host_id - Host user database ID.
 * @param {string} payload.scheduled_start - ISO UTC timestamp string.
 * @param {number} payload.duration_minutes - Duration in minutes.
 * @returns {Promise<object>} The scheduled meeting details.
 */
export async function scheduleMeeting(payload) {
  return request("/meetings/schedule", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * Registers or rejoins a user as an active participant inside the meeting room.
 * Validates display name and current meeting status.
 * 
 * @param {string} meetingId - The Zoom-style public meeting ID (XXX-XXX-XXXX).
 * @param {string} displayName - The display name selected by the joining user.
 * @returns {Promise<object>} Participant details including role, state, and ID.
 */
export async function joinMeeting(meetingId, displayName) {
  return request(`/meetings/${meetingId}/join`, {
    method: "POST",
    body: JSON.stringify({
      display_name: displayName,
    }),
  });
}

/**
 * Retrieves the list of active participants inside the meeting room.
 * 
 * @param {string} meetingId - The Zoom-style public meeting ID.
 * @returns {Promise<Array>} List of active participants.
 */
export async function getMeetingParticipants(meetingId) {
  return request(`/meetings/${meetingId}/participants`);
}

/**
 * Updates a participant's hardware state (e.g., mute, camera).
 * 
 * @param {number} participantId - The database ID of the participant.
 * @param {object} payload - Fields to update (is_muted, is_camera_on).
 * @returns {Promise<object>} The updated participant object.
 */
export async function updateParticipant(participantId, payload) {
  return request(`/participants/${participantId}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

/**
 * Signals that a participant is leaving the meeting room.
 * 
 * @param {number} participantId - The database ID of the participant.
 * @returns {Promise<object>} The updated participant object.
 */
export async function leaveMeeting(participantId) {
  return request(`/participants/${participantId}/leave`, {
    method: "PATCH",
  });
}

/**
 * Administrative action to evict/remove a participant from a live meeting room.
 * 
 * @param {number} participantId - The database ID of the participant to remove.
 * @returns {Promise<object>} The removed participant object.
 */
export async function removeParticipant(participantId) {
  return request(`/participants/${participantId}`, {
    method: "DELETE",
  });
}

/**
 * Host administrative action to end the meeting session for everyone.
 * 
 * @param {string} meetingId - The Zoom-style public meeting ID.
 * @returns {Promise<object>} The ended meeting details.
 */
export async function endMeeting(meetingId) {
  return request(`/meetings/${meetingId}/end`, {
    method: "PATCH",
  });
}
