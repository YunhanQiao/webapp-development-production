/**
 * @fileoverview Time validation utilities for tournament scoring
 *
 * This module provides utility functions for validating and determining
 * meaningful time data in golf tournament scoring systems.
 *
 * @author GitHub Copilot
 * @version 1.0.0
 * @since 2025-01-18
 */

/**
 * Determines if a time value is considered "real" meaningful data.
 *
 * This function filters out empty, null, placeholder, and zero time values
 * to determine if the time entry represents actual hole time data that was
 * intentionally entered by a user.
 *
 * @param {string|null|undefined} holeTime - The hole time value to validate
 * @returns {boolean} True if the time value represents meaningful data
 *
 * @example
 * // Valid time data
 * isRealTimeData("00:05:30") // returns true
 * isRealTimeData("00:03:45") // returns true
 *
 * @example
 * // Invalid/empty time data
 * isRealTimeData("") // returns false
 * isRealTimeData("--:--") // returns false
 * isRealTimeData("00:00:00") // returns false
 * isRealTimeData(null) // returns false
 * isRealTimeData(undefined) // returns false
 */
export const isRealTimeData = holeTime => {
  if (!holeTime || holeTime === "" || holeTime === "--:--") return false;

  // Handle both MM:SS and HH:MM:SS formats for zero time detection
  const parts = holeTime.split(":");

  if (parts.length === 2) {
    // MM:SS format - check if it's "00:00" or similar zero pattern
    if (/^0{1,2}:0{1,2}$/.test(holeTime)) return false;
  } else if (parts.length === 3) {
    // HH:MM:SS format - check if it's "00:00:00" or similar zero pattern
    if (/^0{1,2}:0{1,2}:0{1,2}$/.test(holeTime)) return false;
  }

  return true;
};

/**
 * Checks if any hole times in a round data object contain real time data.
 *
 * @param {Object} roundData - Object containing hole time data keyed by hole number
 * @returns {boolean} True if any hole has meaningful time data
 *
 * @example
 * // Round data with meaningful times
 * hasRealTimeDataInRound({1: "00:05:30", 2: "00:04:15"}) // returns true
 *
 * @example
 * // Round data with no meaningful times
 * hasRealTimeDataInRound({1: "00:00:00", 2: "--:--"}) // returns false
 */
export const hasRealTimeDataInRound = roundData => {
  if (!roundData) return false;
  return Object.values(roundData).some(holeTime => isRealTimeData(holeTime));
};

/**
 * Check if a time string represents a meaningful duration (MM:SS format)
 * Durations use MM:SS format for hole-by-hole time tracking
 * @param {string} timeString - Time string to check
 * @returns {boolean} True if it's a non-zero duration
 *
 * @example
 * isRealDurationData("05:30") // returns true
 * isRealDurationData("00:00") // returns false
 * isRealDurationData("12:34:56") // returns false (timestamp format)
 */
export const isRealDurationData = timeString => {
  if (!timeString || typeof timeString !== "string") return false;

  // Check if it's MM:SS format (exactly one colon)
  const colonCount = (timeString.match(/:/g) || []).length;
  if (colonCount !== 1) return false;

  // Check if it matches MM:SS pattern
  if (!/^\d{1,2}:\d{2}$/.test(timeString)) return false;

  // Check if it's not a zero/empty duration
  return !timeString.match(/^0{1,2}:0{1,2}$/);
};

/**
 * Check if a time string represents a meaningful timestamp (HH:MM:SS format)
 * Timestamps use HH:MM:SS format for clock time when hole was finished
 * Only accepts realistic golf hours (6 AM to 8 PM)
 * @param {string} timeString - Time string to check
 * @returns {boolean} True if it's a realistic golf timestamp
 *
 * @example
 * isRealTimestampData("12:34:56") // returns true
 * isRealTimestampData("06:30:00") // returns true
 * isRealTimestampData("00:05:30") // returns false (unrealistic golf time)
 * isRealTimestampData("05:30") // returns false (duration format)
 */
export const isRealTimestampData = timeString => {
  if (!timeString || typeof timeString !== "string") return false;

  // Check if it's HH:MM:SS format (exactly two colons)
  const colonCount = (timeString.match(/:/g) || []).length;
  if (colonCount !== 2) return false;

  // Check if it matches HH:MM:SS pattern
  if (!/^\d{1,2}:\d{2}:\d{2}$/.test(timeString)) return false;

  // Check if it's not a zero timestamp
  if (timeString.match(/^0{1,2}:0{1,2}:0{1,2}$/)) return false;

  // Extract hour component and check if it's in a realistic golf time range
  const parts = timeString.split(":");
  const hour = parseInt(parts[0], 10);

  // Only accept hours between 6 AM and 8 PM (inclusive)
  // This filters out unrealistic times like "00:05:30" (12:05:30 AM)
  return hour >= 6 && hour <= 20;
};

/**
 * Check if a round contains any meaningful duration data (MM:SS format)
 * @param {Object} roundData - Object containing hole time data keyed by hole number
 * @returns {boolean} True if any hole has meaningful duration data
 */
export const hasRealDurationDataInRound = roundData => {
  if (!roundData) return false;
  return Object.values(roundData).some(holeTime => isRealDurationData(holeTime));
};

/**
 * Check if a round contains any meaningful timestamp data (HH:MM:SS format)
 * @param {Object} roundData - Object containing hole time data keyed by hole number
 * @returns {boolean} True if any hole has meaningful timestamp data
 */
export const hasRealTimestampDataInRound = roundData => {
  if (!roundData) return false;
  return Object.values(roundData).some(holeTime => isRealTimestampData(holeTime));
};
