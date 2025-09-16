/**
 * Date utilities for tournament date handling
 *
 * Addresses timezone conversion issues where dates stored in database as UTC
 * get converted to local timezone, causing dates to appear one day earlier.
 */

/**
 * Formats a date string for API calls - returns simple YYYY-MM-DD format
 * that matches what the backend expects (same as production)
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Date string in simple YYYY-MM-DD format for API
 */
export const formatDateForAPI = dateStr => {
  if (!dateStr) return null;
  // Return simple date format that backend expects (same as production)
  // Strip any time/timezone info if present and return just the date part
  if (dateStr.includes("T")) {
    return dateStr.split("T")[0];
  } else {
    return dateStr;
  }
};

/**
 * Parse a date string (YYYY-MM-DD) into a local timezone Date object
 * Avoids timezone conversion issues that occur with new Date(dateString)
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {Date} Date object in local timezone
 */
export const parseLocalDate = dateStr => {
  if (!dateStr) return null;
  // Extract just the date part if it includes time
  const dateOnly = dateStr.split("T")[0];
  const [year, month, day] = dateOnly.split("-").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

/**
 * Creates a local date from a UTC timestamp string, avoiding timezone conversion issues.
 * @param {string} dateString - Date string in ISO format (e.g., "2025-08-15T07:00:00.000Z")
 * @returns {Date} - Local date object representing the intended date
 */
export const createLocalDate = dateString => {
  if (!dateString) return new Date();
  return parseLocalDate(dateString);
};

/**
 * Convert a Date object back to YYYY-MM-DD string format
 * @param {Date} date - Date object
 * @returns {string} Date string in YYYY-MM-DD format
 */
export const formatDateToString = date => {
  if (!date || isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

/**
 * Add days to a date string (timezone-safe)
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {number} days - Number of days to add (can be negative)
 * @returns {string} New date string in YYYY-MM-DD format
 */
export const addDaysToDateString = (dateStr, days) => {
  const date = parseLocalDate(dateStr);
  if (!date) return null;

  date.setDate(date.getDate() + days);
  return formatDateToString(date);
};

/**
 * Generate an array of date strings between start and end dates (inclusive)
 * @param {string} startDateStr - Start date in YYYY-MM-DD format
 * @param {string} endDateStr - End date in YYYY-MM-DD format
 * @returns {string[]} Array of date strings
 */
export const generateDateRange = (startDateStr, endDateStr) => {
  if (!startDateStr || !endDateStr) return [];

  const start = parseLocalDate(startDateStr);
  const end = parseLocalDate(endDateStr);

  if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
    console.error("Invalid date values:", { startDateStr, endDateStr });
    return [];
  }

  const dateArray = [];
  let currentDate = new Date(start);

  while (currentDate <= end) {
    dateArray.push(formatDateToString(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dateArray;
};

/**
 * Calculate the number of days between two date strings
 * @param {string} fromDateStr - Start date in YYYY-MM-DD format
 * @param {string} toDateStr - End date in YYYY-MM-DD format
 * @returns {number} Number of days difference
 */
export const getDaysDifference = (fromDateStr, toDateStr) => {
  const fromDate = parseLocalDate(fromDateStr);
  const toDate = parseLocalDate(toDateStr);

  if (!fromDate || !toDate) return 0;

  const timeDiff = toDate.getTime() - fromDate.getTime();
  return Math.round(timeDiff / (1000 * 60 * 60 * 24));
};

/**
 * Convert database date format to HTML date input format
 * Handles both ISO strings (2025-09-13T00:00:00Z) and plain dates (2025-09-13)
 * @param {string} dateStr - Date string from database
 * @returns {string} Date string in YYYY-MM-DD format for HTML inputs
 */
export const formatDateForInput = dateStr => {
  if (!dateStr) return null;
  // Extract just the date part if it's an ISO string
  return typeof dateStr === "string" && dateStr.includes("T") ? dateStr.split("T")[0] : dateStr;
};

/**
 * Formats a date string for display, avoiding timezone conversion issues.
 *
 * @param {string} dateString - Date string in ISO format
 * @param {Object} options - Intl.DateTimeFormat options (optional)
 * @returns {string} - Formatted date string
 */
export const formatDate = (
  dateString,
  options = {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
) => {
  if (!dateString) return "";

  try {
    const date = createLocalDate(dateString);
    return new Intl.DateTimeFormat("en-US", options).format(date);
  } catch (err) {
    console.error("Error formatting date:", err);
    return dateString;
  }
};

/**
 * Formats a date string for short display (e.g., "Aug 15, 2025")
 *
 * @param {string} dateString - Date string in ISO format
 * @returns {string} - Short formatted date string
 */
export const formatDateShort = dateString => {
  return formatDate(dateString, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};
