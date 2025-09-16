/**
 * Tournament Division Date Offset Utilities
 *
 * This module provides utilities for converting between absolute dates and day offsets
 * relative to tournament start dates. This enables a hybrid approach where:
 * - UI uses day offsets (Day 1, Day 2, etc.) for easier cross-tab synchronization
 * - API receives absolute dates for backward compatibility
 *
 * @author GitHub Copilot
 * @created August 17, 2025
 */

/**
 * Converts an absolute date to a day offset relative to tournament start date
 *
 * @param {string|Date} date - The absolute date (YYYY-MM-DD string or Date object)
 * @param {string|Date} tournamentStartDate - Tournament start date for reference
 * @returns {number} Day offset (0 = start date, 1 = day 2, etc.)
 *
 * @example
 * convertDateToOffset("2025-08-17", "2025-08-15") // Returns 2 (Day 3)
 * convertDateToOffset("2025-08-15", "2025-08-15") // Returns 0 (Day 1)
 */
export const convertDateToOffset = (date, tournamentStartDate) => {
  if (!date || !tournamentStartDate) {
    console.warn("convertDateToOffset: Missing required parameters", { date, tournamentStartDate });
    return 0;
  }

  try {
    // Parse dates in local timezone to avoid timezone shifting
    const targetDate = typeof date === "string" ? new Date(date + "T00:00:00") : new Date(date);
    const startDate =
      typeof tournamentStartDate === "string"
        ? new Date(tournamentStartDate + "T00:00:00")
        : new Date(tournamentStartDate);

    // Check for invalid dates
    if (isNaN(targetDate.getTime()) || isNaN(startDate.getTime())) {
      console.error("convertDateToOffset: Invalid date values", { date, tournamentStartDate });
      return 0;
    }

    // Reset time to avoid timezone issues
    targetDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    // Calculate difference in days
    const diffTime = targetDate.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    // Return the actual offset (can be negative for dates before tournament start)
    return diffDays;
  } catch (error) {
    console.error("convertDateToOffset: Error converting date to offset", { date, tournamentStartDate, error });
    return 0;
  }
};

/**
 * Converts a day offset to an absolute date relative to tournament start date
 *
 * @param {number} dayOffset - Day offset (0 = start date, 1 = day 2, etc.)
 * @param {string|Date} tournamentStartDate - Tournament start date for reference
 * @returns {string} Absolute date in YYYY-MM-DD format
 *
 * @example
 * convertOffsetToDate(0, "2025-08-15") // Returns "2025-08-15" (Day 1)
 * convertOffsetToDate(2, "2025-08-15") // Returns "2025-08-17" (Day 3)
 */
export const convertOffsetToDate = (dayOffset, tournamentStartDate) => {
  if (typeof dayOffset !== "number" || !tournamentStartDate) {
    console.warn("convertOffsetToDate: Missing or invalid parameters", { dayOffset, tournamentStartDate });
    if (tournamentStartDate) {
      // Use timezone-neutral date extraction for fallback
      if (typeof tournamentStartDate === "string") {
        return tournamentStartDate.includes("T") ? tournamentStartDate.split("T")[0] : tournamentStartDate;
      } else {
        const year = tournamentStartDate.getFullYear();
        const month = String(tournamentStartDate.getMonth() + 1).padStart(2, "0");
        const day = String(tournamentStartDate.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    }
    return "";
  }

  try {
    // Parse date in local timezone to avoid timezone shifting
    // Handle both string dates and Date objects properly
    let startDate;
    if (typeof tournamentStartDate === "string") {
      startDate = new Date(tournamentStartDate + "T00:00:00");
    } else {
      // For Date objects, extract date components without timezone conversion
      const year = tournamentStartDate.getFullYear();
      const month = String(tournamentStartDate.getMonth() + 1).padStart(2, "0");
      const day = String(tournamentStartDate.getDate()).padStart(2, "0");
      const dateStr = `${year}-${month}-${day}`;
      startDate = new Date(dateStr + "T00:00:00");
    }

    // Check for invalid start date
    if (isNaN(startDate.getTime())) {
      console.error("convertOffsetToDate: Invalid tournament start date", { tournamentStartDate });
      return "";
    }

    // Add offset days (can be negative for dates before tournament start)
    const targetDate = new Date(startDate);
    targetDate.setDate(startDate.getDate() + dayOffset);

    // Return in YYYY-MM-DD format using timezone-neutral extraction
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, "0");
    const day = String(targetDate.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("convertOffsetToDate: Error converting offset to date", { dayOffset, tournamentStartDate, error });
    return "";
  }
};

/**
 * Generates dropdown options for day selection within tournament date range
 *
 * @param {string|Date} startDate - Tournament start date
 * @param {string|Date} endDate - Tournament end date
 * @returns {Array<{value: number, label: string, date: string}>} Array of option objects
 *
 * @example
 * generateDayOptions("2025-08-15", "2025-08-17")
 * // Returns:
 * // [
 * //   { value: 0, label: "Day 1 (8/15/2025)", date: "2025-08-15" },
 * //   { value: 1, label: "Day 2 (8/16/2025)", date: "2025-08-16" },
 * //   { value: 2, label: "Day 3 (8/17/2025)", date: "2025-08-17" }
 * // ]
 */
export const generateDayOptions = (startDate, endDate) => {
  if (!startDate || !endDate) {
    console.warn("generateDayOptions: Missing required date parameters", { startDate, endDate });
    return [];
  }

  try {
    // Parse dates in local timezone to avoid timezone shifting
    const start = typeof startDate === "string" ? new Date(startDate + "T00:00:00") : new Date(startDate);
    const end = typeof endDate === "string" ? new Date(endDate + "T00:00:00") : new Date(endDate);

    // Check for invalid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error("generateDayOptions: Invalid date values", { startDate, endDate });
      return [];
    }

    // Reset time to avoid timezone issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // Validate date range
    if (end < start) {
      console.warn("generateDayOptions: End date is before start date", { startDate, endDate });
      return [];
    }

    const options = [];
    const currentDate = new Date(start);
    let dayOffset = 0;

    while (currentDate <= end) {
      // Use timezone-neutral date extraction (same as convertOffsetToDate)
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");
      const dateString = `${year}-${month}-${day}`;

      // Format the SAME date string for display (M/D/YYYY) - avoid timezone issues
      const dateForDisplay = new Date(dateString + "T00:00:00");
      const displayDate = dateForDisplay.toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });

      options.push({
        value: dayOffset,
        label: `Day ${dayOffset + 1} (${displayDate})`,
        date: dateString,
      });

      // Move to next day
      currentDate.setDate(currentDate.getDate() + 1);
      dayOffset++;
    }

    return options;
  } catch (error) {
    console.error("generateDayOptions: Error generating day options", { startDate, endDate, error });
    return [];
  }
};

/**
 * Validates that a day offset is within the tournament date range
 *
 * @param {number} dayOffset - Day offset to validate
 * @param {string|Date} startDate - Tournament start date
 * @param {string|Date} endDate - Tournament end date
 * @returns {boolean} True if offset is valid, false otherwise
 *
 * @example
 * validateDayOffset(1, "2025-08-15", "2025-08-17") // Returns true
 * validateDayOffset(5, "2025-08-15", "2025-08-17") // Returns false (outside range)
 */
export const validateDayOffset = (dayOffset, startDate, endDate) => {
  if (typeof dayOffset !== "number" || !startDate || !endDate) {
    return false;
  }

  try {
    // Parse dates in local timezone to avoid timezone shifting
    const start = typeof startDate === "string" ? new Date(startDate + "T00:00:00") : new Date(startDate);
    const end = typeof endDate === "string" ? new Date(endDate + "T00:00:00") : new Date(endDate);

    // Check for invalid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error("validateDayOffset: Invalid date values", { startDate, endDate });
      return false;
    }

    // Reset time to avoid timezone issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    // Calculate maximum valid offset
    const maxOffset = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    return dayOffset >= 0 && dayOffset <= maxOffset;
  } catch (error) {
    console.error("validateDayOffset: Error validating day offset", { dayOffset, startDate, endDate, error });
    return false;
  }
};

/**
 * Converts existing round data from absolute dates to day offsets
 * Useful for backward compatibility when loading existing tournaments
 *
 * @param {Array} rounds - Array of round objects with date fields
 * @param {string|Date} tournamentStartDate - Tournament start date for reference
 * @returns {Array} Array of round objects with dayOffset fields added
 *
 * @example
 * const rounds = [
 *   { date: "2025-08-15", format: "Speedgolf" },
 *   { date: "2025-08-17", format: "Sprintgolf" }
 * ];
 * convertRoundsToOffsets(rounds, "2025-08-15")
 * // Returns:
 * // [
 * //   { date: "2025-08-15", format: "Speedgolf", dayOffset: 0 },
 * //   { date: "2025-08-17", format: "Sprintgolf", dayOffset: 2 }
 * // ]
 */
export const convertRoundsToOffsets = (rounds, tournamentStartDate) => {
  if (!Array.isArray(rounds) || !tournamentStartDate) {
    console.warn("convertRoundsToOffsets: Invalid parameters", { rounds, tournamentStartDate });
    return Array.isArray(rounds) ? rounds : [];
  }

  return rounds.map(round => {
    if (!round.date) {
      console.warn("convertRoundsToOffsets: Round missing date field", round);
      return { ...round, dayOffset: 0 };
    }

    const dayOffset = convertDateToOffset(round.date, tournamentStartDate);

    return {
      ...round,
      dayOffset,
    };
  });
};

/**
 * Converts round data from day offsets back to absolute dates
 * Used before API submission to maintain backward compatibility
 *
 * @param {Array} rounds - Array of round objects with dayOffset fields
 * @param {string|Date} tournamentStartDate - Tournament start date for reference
 * @returns {Array} Array of round objects with date fields updated
 *
 * @example
 * const rounds = [
 *   { dayOffset: 0, format: "Speedgolf" },
 *   { dayOffset: 2, format: "Sprintgolf" }
 * ];
 * convertRoundsToAbsoluteDates(rounds, "2025-08-15")
 * // Returns:
 * // [
 * //   { dayOffset: 0, format: "Speedgolf", date: "2025-08-15" },
 * //   { dayOffset: 2, format: "Sprintgolf", date: "2025-08-17" }
 * // ]
 */
export const convertRoundsToAbsoluteDates = (rounds, tournamentStartDate) => {
  if (!Array.isArray(rounds) || !tournamentStartDate) {
    console.warn("convertRoundsToAbsoluteDates: Invalid parameters", { rounds, tournamentStartDate });
    return Array.isArray(rounds) ? rounds : [];
  }

  return rounds.map(round => {
    if (typeof round.dayOffset !== "number") {
      console.warn("convertRoundsToAbsoluteDates: Round missing dayOffset field", round);
      return round;
    }

    const date = convertOffsetToDate(round.dayOffset, tournamentStartDate);

    return {
      ...round,
      date,
    };
  });
};

/**
 * Utility to get tournament duration in days
 *
 * @param {string|Date} startDate - Tournament start date
 * @param {string|Date} endDate - Tournament end date
 * @returns {number} Number of days in tournament (inclusive)
 *
 * @example
 * getTournamentDuration("2025-08-15", "2025-08-17") // Returns 3 days
 */
export const getTournamentDuration = (startDate, endDate) => {
  if (!startDate || !endDate) {
    return 0;
  }

  try {
    // Parse dates in local timezone to avoid timezone shifting
    const start = typeof startDate === "string" ? new Date(startDate + "T00:00:00") : new Date(startDate);
    const end = typeof endDate === "string" ? new Date(endDate + "T00:00:00") : new Date(endDate);

    // Check for invalid dates
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.error("getTournamentDuration: Invalid date values", { startDate, endDate });
      return 0;
    }

    // Reset time to avoid timezone issues
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffTime = end.getTime() - start.getTime();
    return Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
  } catch (error) {
    console.error("getTournamentDuration: Error calculating duration", { startDate, endDate, error });
    return 0;
  }
};

/**
 * Calculate dropdown options for all rounds in a division with monotonic constraints
 *
 * @param {string} minDate - Tournament start date (YYYY-MM-DD)
 * @param {string} maxDate - Tournament end date (YYYY-MM-DD)
 * @param {Array} allRounds - Array of round data with dayOffset values
 * @returns {Object} Object with roundIndex as keys and options arrays as values
 *
 * @example
 * calculateDivisionRoundOptions("2025-10-04", "2025-10-05", [
 *   { dayOffset: 0 }, { dayOffset: 1 }
 * ])
 * // Returns: {
 * //   0: [{ value: 0, label: "Day 1 (10/4/2025)", disabled: false }, ...],
 * //   1: [{ value: 0, label: "Day 1 (10/4/2025)", disabled: true }, ...]
 * // }
 */
export const calculateDivisionRoundOptions = (minDate, maxDate, allRounds) => {
  if (!minDate || !maxDate || !allRounds) {
    console.warn("calculateDivisionRoundOptions: Missing required parameters", { minDate, maxDate, allRounds });
    return {};
  }

  try {
    // Generate base options for the date range
    const baseOptions = generateDayOptions(minDate, maxDate);
    const roundOptions = {};

    // Calculate options for each round position
    allRounds.forEach((round, position) => {
      roundOptions[position] = baseOptions.map(option => {
        let isDisabled = false;
        let disabledReason = "";

        // Apply monotonic ordering constraints
        let minAllowedOffset = 0;
        let maxAllowedOffset = Infinity;

        // Check constraints from previous rounds (must be >= max of previous)
        for (let i = 0; i < position; i++) {
          const prevRound = allRounds[i];
          if (prevRound && typeof prevRound.dayOffset === "number") {
            minAllowedOffset = Math.max(minAllowedOffset, prevRound.dayOffset);
          }
        }

        // Check constraints from later rounds (must be <= min of later)
        for (let i = position + 1; i < allRounds.length; i++) {
          const laterRound = allRounds[i];
          if (laterRound && typeof laterRound.dayOffset === "number") {
            maxAllowedOffset = Math.min(maxAllowedOffset, laterRound.dayOffset);
          }
        }

        // Apply constraints
        if (option.value < minAllowedOffset) {
          isDisabled = true;
          disabledReason = ` (Round ${position + 1} must be on or after Day ${minAllowedOffset + 1})`;
        } else if (maxAllowedOffset !== Infinity && option.value > maxAllowedOffset) {
          isDisabled = true;
          disabledReason = ` (Round ${position + 1} must be on or before Day ${maxAllowedOffset + 1})`;
        }

        return {
          ...option,
          disabled: isDisabled,
          label: option.label + disabledReason,
        };
      });
    });

    return roundOptions;
  } catch (error) {
    console.error("calculateDivisionRoundOptions: Error calculating options", { minDate, maxDate, allRounds, error });
    return {};
  }
};
