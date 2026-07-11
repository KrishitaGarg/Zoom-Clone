/**
 * Utility functions for processing, extracting, and formatting meeting attributes.
 */

/**
 * Extracts and normalizes a meeting ID from either a direct input or a complete invitation URL.
 * It trims whitespace, handles URL parsing, removes query parameters, and verifies the XXX-XXX-XXXX format.
 * 
 * @param {string} input - The raw meeting ID or invitation URL.
 * @returns {string|null} The normalized meeting ID in "XXX-XXX-XXXX" format, or null if invalid.
 */
export function extractMeetingId(input) {
  if (!input) return null;

  // 1. Trim whitespace
  let cleanInput = input.trim();

  // 2. Handle complete invitation URL or relative paths
  try {
    // If it's a full URL, parse it
    if (cleanInput.startsWith("http://") || cleanInput.startsWith("https://")) {
      const url = new URL(cleanInput);
      // Path is usually /meeting/XXX-XXX-XXXX
      const pathParts = url.pathname.split("/").filter(Boolean);
      // The last part should be the meeting ID
      if (pathParts.length > 0) {
        cleanInput = pathParts[pathParts.length - 1];
      }
    } else {
      // If it contains a slash but no protocol (e.g. localhost:3000/meeting/XXX-XXX-XXXX)
      const slashIndex = cleanInput.lastIndexOf("/");
      if (slashIndex !== -1) {
        cleanInput = cleanInput.substring(slashIndex + 1);
      }
    }
  } catch (err) {
    // If URL parsing fails, we fall back to processing cleanInput directly
  }

  // 3. Remove query parameters if any (e.g., ?participantId=123)
  const questionMarkIndex = cleanInput.indexOf("?");
  if (questionMarkIndex !== -1) {
    cleanInput = cleanInput.substring(0, questionMarkIndex);
  }

  // 4. Remove any spaces or alternative separator characters, and reconstruct with standard hyphens
  // Let's remove spaces or double-hyphens, normalize to standard alphanumeric characters
  const digits = cleanInput.replace(/[^a-zA-Z0-9]/g, "");
  
  // A standard Zoom ID format is 10 digits/characters grouped as 3-3-4 (e.g., 849-245-7316)
  if (digits.length === 10) {
    const part1 = digits.substring(0, 3);
    const part2 = digits.substring(3, 6);
    const part3 = digits.substring(6, 10);
    const formattedId = `${part1}-${part2}-${part3}`;
    
    // Validate with regex format: ^[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{4}$
    const validRegex = /^[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{4}$/;
    if (validRegex.test(formattedId)) {
      return formattedId;
    }
  }

  // Fallback direct regex check on the formatted value if they entered it with hyphens directly
  const directRegex = /^[0-9a-zA-Z]{3}-[0-9a-zA-Z]{3}-[0-9a-zA-Z]{4}$/;
  if (directRegex.test(cleanInput)) {
    return cleanInput;
  }

  return null;
}

/**
 * Copies the standardized meeting invitation text to the user's clipboard.
 * 
 * @param {object} meeting - The meeting object containing details.
 * @returns {Promise<boolean>} True if successfully copied, false otherwise.
 */
export async function copyMeetingInvitation(meeting) {
  if (!meeting) return false;

  const title = meeting.title || "Zoom Meeting";
  const meetingId = meeting.public_meeting_id;
  const inviteUrl = meeting.invite_url || `${window.location.origin}/meeting/${meetingId}`;

  const invitationText = `You are invited to ${title}\n\nMeeting ID:\n${meetingId}\n\nJoin:\n${inviteUrl}`;

  try {
    await navigator.clipboard.writeText(invitationText);
    return true;
  } catch (err) {
    console.error("Clipboard copy failed:", err);
    return false;
  }
}
