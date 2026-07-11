/**
 * Date and time parsing and formatting utility functions for the Zoom Clone.
 * Handles parsing backend UTC naive timestamps and formatting them for the local browser timezone.
 */

/**
 * Parses a backend-provided UTC timestamp (often missing the 'Z' offset indicator) safely.
 * Treats the timestamp strictly as UTC.
 * @param {string|null} value - The datetime string from the backend.
 * @returns {Date|null} A JavaScript Date object or null if input is invalid.
 */
export function parseBackendUtc(value) {
  if (!value) return null;

  // Ensure the string has a 'Z' suffix so that JS Date constructor treats it as UTC
  const normalized = value.endsWith("Z") ? value : `${value}Z`;
  const dateObj = new Date(normalized);
  
  // Return null if the date is invalid
  return isNaN(dateObj.getTime()) ? null : dateObj;
}

/**
 * Formats a Date object to a readable date (e.g., "Friday, Oct 24, 2026") in local time.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted local date.
 */
export function formatLocalDate(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "short",
    day: "numeric"
  }).format(date);
}

/**
 * Formats a Date object to a readable time (e.g., "10:30 AM") in local time.
 * @param {Date} date - The date/time to format.
 * @returns {string} The formatted local time.
 */
export function formatLocalTime(date) {
  if (!date) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

/**
 * Helper to combine date and time formatting (e.g., "Friday, Oct 24 - 10:30 AM")
 * @param {string} utcString - The backend UTC timestamp string.
 * @returns {string} A user-friendly formatted local datetime string.
 */
export function formatBackendDateTime(utcString) {
  const dateObj = parseBackendUtc(utcString);
  if (!dateObj) return "N/A";
  
  const formattedDate = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(dateObj);

  const formattedTime = formatLocalTime(dateObj);
  return `${formattedDate} at ${formattedTime}`;
}
