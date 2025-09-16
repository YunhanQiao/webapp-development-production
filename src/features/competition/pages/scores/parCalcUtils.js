/**
 * @fileoverview Par calculation utilities for tournament scoring.
 *
 * This module consolidates all scoring calculation functions including stroke, time, and SGS calculations
 * for speedgolf tournaments. It provides both standard calculations (for all holes) and accumulator
 * pattern calculations (only for holes with entered data).
 *
 * ===============================================================================
 * TABLE OF CONTENTS - Quick Navigation (Use Ctrl+F to jump to sections)
 * ===============================================================================
 *
 * 1. STROKE CALCULATIONS              (lines ~25-90)   - Basic stroke totals
 * 2. STROKE PAR CALCULATIONS          (lines ~90-250)  - Stroke par with accumulator
 * 3. TIME CALCULATIONS                (lines ~250-340) - Basic time totals
 * 4. TIME PAR CALCULATIONS            (lines ~340-440) - Time par with accumulator
 * 5. SGS CALCULATIONS                 (lines ~440-665) - Speedgolf Score calculations
 * 6. TO PAR CALCULATIONS              (lines ~665-965) - Stroke/time to par logic
 * 7. TO PAR FORMATTING                (lines ~965+)    - Display formatting utilities
 *
 * Total Functions: 31 exports
 * File Size: 1,065+ lines
 *
 * @author Chris Hundhausen & GitHub Copilot
 * @version 1.0.0
 * @since 2025-01-17
 */

import { mmssToSeconds } from "./timeUtils";

// =================================================================
// STROKE CALCULATIONS
// =================================================================

/**
 * Calculate total strokes for OUT holes (holes 1-9).
 *
 * @param {Object} playerScores - Object containing hole scores where keys are hole numbers (1-18)
 * @returns {number} Total strokes for holes 1-9, returns 0 if no scores are provided
 *
 * @example
 * const scores = { 1: 4, 2: 3, 3: 5, 4: 4, 5: 3, 6: 4, 7: 5, 8: 3, 9: 4 };
 * const outTotal = calcOutStrokes(scores); // Returns 35
 */
export const calcOutStrokes = playerScores => {
  const strokesArray = Array.from({ length: 9 }, (_, i) => {
    const hole = i + 1;
    const score = parseInt(playerScores?.[hole] || 0);
    return score;
  });

  const total = strokesArray.reduce((sum, score) => sum + score, 0);
  return total;
};

/**
 * Calculate total strokes for IN holes (holes 10-18).
 *
 * @param {Object} playerScores - Object containing hole scores where keys are hole numbers (1-18)
 * @returns {number} Total strokes for holes 10-18, returns 0 if no scores are provided
 *
 * @example
 * const scores = { 10: 4, 11: 3, 12: 5, 13: 4, 14: 3, 15: 4, 16: 5, 17: 3, 18: 4 };
 * const inTotal = calcInStrokes(scores); // Returns 35
 */
export const calcInStrokes = playerScores => {
  return Array.from({ length: 9 }, (_, i) => parseInt(playerScores?.[i + 10] || 0)).reduce(
    (sum, score) => sum + score,
    0,
  );
};

/**
 * Calculate total strokes for a round based on round type.
 *
 * @param {Object} playerScores - Object containing hole scores where keys are hole numbers
 * @param {boolean} isFullRound - True if this is an 18-hole round
 * @param {boolean} isFrontNine - True if this is a front 9 round (holes 1-9)
 * @param {boolean} isBackNine - True if this is a back 9 round (holes 10-18)
 * @returns {number} Total strokes for the round based on round type
 *
 * @example
 * const scores = { 1: 4, 2: 3, ..., 18: 4 };
 * const total = calcTotalStrokes(scores, true, false, false); // Full round total
 */
export const calcTotalStrokes = (playerScores, isFullRound, isFrontNine, isBackNine) => {
  if (isFullRound) {
    return calcOutStrokes(playerScores) + calcInStrokes(playerScores);
  } else if (isFrontNine) {
    return calcOutStrokes(playerScores);
  } else if (isBackNine) {
    return calcInStrokes(playerScores);
  }
  return 0;
};

// =================================================================
// STROKE PAR CALCULATIONS (with accumulator pattern)
// =================================================================

/**
 * Calculate stroke par for OUT holes (1-9) based only on holes with entered scores.
 * Uses accumulator pattern - only includes par for holes that have actual score data.
 *
 * @param {Object} playerScores - Object containing hole scores where keys are hole numbers
 * @param {Function} getHolePar - Function that returns par for a given hole number and round
 * @param {Object} currentRound - Current round object containing round information
 * @returns {number} Total stroke par for OUT holes that have entered scores
 *
 * @example
 * const scores = { 1: 4, 3: 5, 5: 3 }; // Only holes 1, 3, 5 have scores
 * const parTotal = calcOutStrokePar(scores, getHolePar, round); // Only includes par for holes 1, 3, 5
 */
export const calcOutStrokePar = (playerScores, getHolePar, currentRound) => {
  let totalStrokePar = 0;

  for (let hole = 1; hole <= 9; hole++) {
    const score = playerScores[hole];
    const hasScore = score && score !== "" && score !== null;

    // Only include stroke par for holes that have score data
    if (hasScore) {
      const holeStrokePar = getHolePar(hole, currentRound);
      totalStrokePar += holeStrokePar;
    }
  }

  return totalStrokePar;
};

/**
 * Calculate stroke par for IN holes (10-18) based only on holes with entered scores.
 * Uses accumulator pattern - only includes par for holes that have actual score data.
 *
 * @param {Object} playerScores - Object containing hole scores where keys are hole numbers
 * @param {Function} getHolePar - Function that returns par for a given hole number and round
 * @param {Object} currentRound - Current round object containing round information
 * @returns {number} Total stroke par for IN holes that have entered scores
 *
 * @example
 * const scores = { 10: 4, 12: 5, 14: 3 }; // Only holes 10, 12, 14 have scores
 * const parTotal = calcInStrokePar(scores, getHolePar, round); // Only includes par for holes 10, 12, 14
 */
export const calcInStrokePar = (playerScores, getHolePar, currentRound) => {
  let totalStrokePar = 0;

  for (let hole = 10; hole <= 18; hole++) {
    // Only include stroke par for holes that have score data
    if (playerScores[hole] && playerScores[hole] !== "" && playerScores[hole] !== null) {
      const holeStrokePar = getHolePar(hole, currentRound);
      totalStrokePar += holeStrokePar;
    }
  }

  return totalStrokePar;
};

/**
 * Calculate total stroke par based only on holes with entered scores.
 * Uses accumulator pattern - only includes par for holes that have actual score data.
 * Adapts to different round types (full round, front 9, back 9).
 *
 * @param {Object} playerScores - Object containing hole scores where keys are hole numbers
 * @param {Function} getHolePar - Function that returns par for a given hole number and round
 * @param {Object} currentRound - Current round object containing round information
 * @param {boolean} isFrontNine - True if this is a front 9 round (holes 1-9 only)
 * @param {boolean} isBackNine - True if this is a back 9 round (holes 10-18 only)
 * @returns {number} Total stroke par for holes that have entered scores
 *
 * @example
 * const scores = { 1: 4, 3: 5, 10: 4, 15: 3 }; // Partial scores across front and back
 * const parTotal = calcTotalStrokePar(scores, getHolePar, round, false, false); // Full round, includes all entered holes
 */
export const calcTotalStrokePar = (playerScores, getHolePar, currentRound, isFrontNine, isBackNine) => {
  let totalStrokePar = 0;

  // Determine holes based on round type
  let startHole = 1;
  let endHole = 18;

  if (isFrontNine) {
    startHole = 1;
    endHole = 9;
  } else if (isBackNine) {
    startHole = 10;
    endHole = 18;
  }

  for (let hole = startHole; hole <= endHole; hole++) {
    // Only include stroke par for holes that have score data
    if (playerScores[hole] && playerScores[hole] !== "" && playerScores[hole] !== null) {
      const holeStrokePar = getHolePar(hole, currentRound);
      totalStrokePar += holeStrokePar;
    }
  }

  return totalStrokePar;
};

/**
 * Calculate stroke par for OUT holes (all 9 holes, not using accumulator pattern).
 * This function calculates par for all OUT holes regardless of whether scores are entered.
 *
 * @param {Function} getHolePar - Function that returns par for a given hole number and round
 * @param {Object} currentRound - Current round object containing round information
 * @returns {number} Total stroke par for all OUT holes (1-9)
 *
 * @example
 * const outPar = calculateOutPar(getHolePar, currentRound); // Returns total par for holes 1-9
 */
export const calculateOutPar = (getHolePar, currentRound) => {
  return Array.from({ length: 9 }, (_, i) => getHolePar(i + 1, currentRound)).reduce((sum, par) => sum + par, 0);
};

/**
 * Calculate stroke par for IN holes (all 9 holes, not using accumulator pattern).
 * This function calculates par for all IN holes regardless of whether scores are entered.
 *
 * @param {Function} getHolePar - Function that returns par for a given hole number and round
 * @param {Object} currentRound - Current round object containing round information
 * @returns {number} Total stroke par for all IN holes (10-18)
 *
 * @example
 * const inPar = calculateInPar(getHolePar, currentRound); // Returns total par for holes 10-18
 */
export const calculateInPar = (getHolePar, currentRound) => {
  return Array.from({ length: 9 }, (_, i) => getHolePar(i + 10, currentRound)).reduce((sum, par) => sum + par, 0);
};

/**
 * Calculate total stroke par for a round based on round type (all holes, not using accumulator pattern).
 * This function calculates par for all holes in the round type regardless of whether scores are entered.
 *
 * @param {Function} getHolePar - Function that returns par for a given hole number and round
 * @param {Object} currentRound - Current round object containing round information
 * @param {boolean} isFullRound - True if this is an 18-hole round
 * @param {boolean} isFrontNine - True if this is a front 9 round (holes 1-9)
 * @param {boolean} isBackNine - True if this is a back 9 round (holes 10-18)
 * @returns {number} Total stroke par for the round based on round type
 *
 * @example
 * const totalPar = calculateTotalPar(getHolePar, round, true, false, false); // 18-hole round total par
 */
export const calculateTotalPar = (getHolePar, currentRound, isFullRound, isFrontNine, isBackNine) => {
  if (isFullRound) {
    return calculateOutPar(getHolePar, currentRound) + calculateInPar(getHolePar, currentRound);
  } else if (isFrontNine) {
    return calculateOutPar(getHolePar, currentRound);
  } else if (isBackNine) {
    return calculateInPar(getHolePar, currentRound);
  }
  return 0;
};

// =================================================================
// TIME CALCULATIONS
// =================================================================

/**
 * Calculate time for OUT holes (1-9) using accumulator pattern.
 * Only includes times for holes where actual time data has been entered.
 *
 * @param {Object} playerHoleTimes - Object containing time entries for each hole
 * @returns {number} Total time in seconds for OUT holes that have time data
 *
 * @example
 * const times = { 1: "05:30", 3: "04:45", 5: "06:00" }; // Only holes 1, 3, 5 have times
 * const outSeconds = calcOutTime(times); // Returns total seconds for those holes
 */
export const calcOutTime = playerHoleTimes => {
  let totalSeconds = 0;

  for (let hole = 1; hole <= 9; hole++) {
    const timeString = playerHoleTimes[hole] || "";
    if (timeString && timeString !== "" && timeString !== "00:00" && timeString !== "00:00:00") {
      const holeSeconds = mmssToSeconds(timeString);
      totalSeconds += holeSeconds;
    }
  }

  return totalSeconds;
};

/**
 * Calculate time for IN holes (10-18) using accumulator pattern.
 * Only includes times for holes where actual time data has been entered.
 *
 * @param {Object} playerHoleTimes - Object containing time entries for each hole
 * @returns {number} Total time in seconds for IN holes that have time data
 *
 * @example
 * const times = { 10: "05:30", 12: "04:45", 14: "06:00" }; // Only holes 10, 12, 14 have times
 * const inSeconds = calcInTime(times); // Returns total seconds for those holes
 */
export const calcInTime = playerHoleTimes => {
  let totalSeconds = 0;

  for (let hole = 10; hole <= 18; hole++) {
    const timeString = playerHoleTimes[hole] || "";
    if (timeString && timeString !== "" && timeString !== "00:00" && timeString !== "00:00:00") {
      totalSeconds += mmssToSeconds(timeString);
    }
  }

  return totalSeconds;
};

/**
 * Calculate total time from all hole times using accumulator pattern.
 * Only includes times for holes where actual time data has been entered.
 * Adapts to different round types (full round, front 9, back 9).
 *
 * @param {Object} playerHoleTimes - Object containing time entries for each hole
 * @param {boolean} isFrontNine - True if this is a front 9 round (holes 1-9 only)
 * @param {boolean} isBackNine - True if this is a back 9 round (holes 10-18 only)
 * @returns {number} Total time in seconds for holes that have time data
 *
 * @example
 * const times = { 1: "05:30", 3: "04:45", 10: "05:00", 15: "06:30" }; // Mixed front and back
 * const totalSeconds = calcTotalTime(times, false, false); // Full round, all entered times
 */
export const calcTotalTime = (playerHoleTimes, isFrontNine, isBackNine) => {
  let totalSeconds = 0;

  // Determine holes based on round type
  let startHole = 1;
  let endHole = 18;

  if (isFrontNine) {
    startHole = 1;
    endHole = 9;
  } else if (isBackNine) {
    startHole = 10;
    endHole = 18;
  }

  for (let hole = startHole; hole <= endHole; hole++) {
    const timeString = playerHoleTimes[hole] || "";
    if (timeString && timeString !== "" && timeString !== "00:00" && timeString !== "00:00:00") {
      totalSeconds += mmssToSeconds(timeString);
    }
  }

  return totalSeconds;
};

// =================================================================
// TIME PAR CALCULATIONS (with accumulator pattern)
// =================================================================

/**
 * Calculate time par for OUT holes (1-9) using accumulator pattern.
 * Only includes time par for holes where actual time data has been entered.
 * This ensures meaningful partial totals that reflect only played holes.
 *
 * @param {Object} playerHoleTimes - Object containing time entries for each hole
 * @param {Object} teeData - Tee data containing hole information including time par values
 * @param {string} divisionGender - Division/gender identifier for time par lookup (e.g., "men", "women")
 * @returns {number} Total time par in seconds for OUT holes that have time data
 *
 * @example
 * const times = { 1: "05:30", 3: "04:45" }; // Only holes 1, 3 have time data
 * const outTimePar = calculateOutTimePar(times, teeData, "men"); // Only includes time par for holes 1, 3
 */
export const calculateOutTimePar = (playerHoleTimes, teeData, divisionGender) => {
  let totalTimePar = 0;

  for (let hole = 1; hole <= 9; hole++) {
    // Only include time par for holes that have time data
    if (playerHoleTimes[hole] && playerHoleTimes[hole] !== "00:00:00") {
      const holeTimePar = teeData?.holes?.[hole - 1]?.[`${divisionGender}TimePar`] || 0;
      totalTimePar += Math.round(holeTimePar);
    }
  }

  return totalTimePar; // Return in seconds
};

/**
 * Calculate time par for IN holes (10-18) using accumulator pattern.
 * Only includes time par for holes where actual time data has been entered.
 * This ensures meaningful partial totals that reflect only played holes.
 *
 * @param {Object} playerHoleTimes - Object containing time entries for each hole
 * @param {Object} teeData - Tee data containing hole information including time par values
 * @param {string} divisionGender - Division/gender identifier for time par lookup (e.g., "men", "women")
 * @returns {number} Total time par in seconds for IN holes that have time data
 *
 * @example
 * const times = { 10: "05:30", 12: "04:45" }; // Only holes 10, 12 have time data
 * const inTimePar = calculateInTimePar(times, teeData, "women"); // Only includes time par for holes 10, 12
 */
export const calculateInTimePar = (playerHoleTimes, teeData, divisionGender) => {
  let totalTimePar = 0;

  for (let hole = 10; hole <= 18; hole++) {
    // Only include time par for holes that have time data
    if (playerHoleTimes[hole] && playerHoleTimes[hole] !== "00:00:00") {
      const holeTimePar = teeData?.holes?.[hole - 1]?.[`${divisionGender}TimePar`] || 0;
      totalTimePar += Math.round(holeTimePar);
    }
  }

  return totalTimePar; // Return in seconds
};

/**
 * Calculate total time par using accumulator pattern.
 * Only includes time par for holes where actual time data has been entered.
 * Adapts to different round types (full round, front 9, back 9).
 *
 * @param {Object} playerHoleTimes - Object containing time entries for each hole
 * @param {Object} teeData - Tee data containing hole information including time par values
 * @param {string} divisionGender - Division/gender identifier for time par lookup (e.g., "men", "women")
 * @param {boolean} isFrontNine - True if this is a front 9 round (holes 1-9 only)
 * @param {boolean} isBackNine - True if this is a back 9 round (holes 10-18 only)
 * @returns {number} Total time par in seconds for holes that have time data
 *
 * @example
 * const times = { 1: "05:30", 10: "05:00", 15: "06:30" }; // Mixed front and back holes
 * const totalTimePar = calculateTotalTimePar(times, teeData, "men", false, false); // Full round
 */
export const calculateTotalTimePar = (playerHoleTimes, teeData, divisionGender, isFrontNine, isBackNine) => {
  let totalTimePar = 0;

  // Determine holes based on round type
  let startHole = 1;
  let endHole = 18;

  if (isFrontNine) {
    startHole = 1;
    endHole = 9;
  } else if (isBackNine) {
    startHole = 10;
    endHole = 18;
  }

  for (let hole = startHole; hole <= endHole; hole++) {
    // Only include time par for holes that have time data
    if (playerHoleTimes[hole] && playerHoleTimes[hole] !== "00:00:00") {
      const holeTimePar = teeData?.holes?.[hole - 1]?.[`${divisionGender}TimePar`] || 0;
      totalTimePar += Math.round(holeTimePar);
    }
  }

  return totalTimePar; // Return in seconds
};

// =================================================================
// SGS CALCULATIONS
// =================================================================

/**
 * Calculate SGS (Speedgolf Score) from strokes and elapsed time.
 * SGS is calculated as: strokes + time in minutes (rounded).
 * This is a simple calculation for basic SGS display.
 *
 * @param {number} strokes - Total number of strokes
 * @param {string} elapsedTime - Elapsed time in MM:SS format
 * @returns {string} SGS formatted as MM:SS, or "--:--" if invalid input
 *
 * @example
 * const sgs = calculateSGS(72, "45:30"); // Returns SGS based on 72 strokes + 45:30 time
 */
export const calculateSGS = (strokes, elapsedTime) => {
  if (!strokes || elapsedTime === "--:--") return "--:--";

  const [elapsedMinutes, elapsedSeconds] = elapsedTime.split(":").map(Number);
  let totalMinutes = strokes + elapsedMinutes;
  let totalSeconds = elapsedSeconds;

  if (totalSeconds >= 60) {
    totalMinutes += Math.floor(totalSeconds / 60);
    totalSeconds = totalSeconds % 60;
  }

  return `${String(totalMinutes).padStart(2, "0")}:${String(totalSeconds).padStart(2, "0")}`;
};

/**
 * Calculate SGS for OUT holes (1-9) using accumulator pattern.
 * Only includes holes that have score data entered. Returns detailed breakdown
 * including strokes, time components, and calculated SGS in MM:SS format.
 *
 * @param {Object} playerScores - Object containing hole scores where keys are hole numbers
 * @param {Object} playerHoleTimes - Object containing time entries for each hole
 * @returns {Object} SGS breakdown with strokes, timeMinutes, timeSeconds, and sgs properties
 *
 * @example
 * const scores = { 1: 4, 3: 5 }; // Only holes 1, 3 have scores
 * const times = { 1: "05:30", 3: "04:45" };
 * const outSGS = calcOutSGS(scores, times); // Returns {strokes: 9, timeMinutes: 10, timeSeconds: 15, sgs: "19:15"}
 */
export const calcOutSGS = (playerScores, playerHoleTimes) => {
  let totalStrokes = 0;
  let totalTimeSeconds = 0;
  let hasAnyScores = false;

  for (let hole = 1; hole <= 9; hole++) {
    // Only include holes that have score data
    if (playerScores[hole] && playerScores[hole] !== "" && playerScores[hole] !== null) {
      hasAnyScores = true;
      totalStrokes += parseInt(playerScores[hole]) || 0;
      const timeString = playerHoleTimes[hole] || "";
      if (timeString && timeString !== "" && timeString !== "00:00" && timeString !== "00:00:00") {
        totalTimeSeconds += mmssToSeconds(timeString);
      }
    }
  }

  // Return "--:--" if no scores entered
  if (!hasAnyScores) {
    return {
      strokes: 0,
      timeMinutes: 0,
      timeSeconds: 0,
      sgs: "--:--",
      sgsMinutes: 0,
      sgsSeconds: 0,
    };
  }

  // Calculate SGS: strokes + time (keeping seconds precision)
  const timeInMinutes = Math.floor(totalTimeSeconds / 60);
  const remainingSeconds = totalTimeSeconds % 60;
  const sgsMinutes = totalStrokes + timeInMinutes;
  const sgsSeconds = remainingSeconds;

  return {
    strokes: totalStrokes,
    timeMinutes: timeInMinutes,
    timeSeconds: remainingSeconds,
    sgs: `${String(sgsMinutes).padStart(2, "0")}:${String(sgsSeconds).padStart(2, "0")}`,
    sgsMinutes: sgsMinutes,
    sgsSeconds: sgsSeconds,
  };
};

/**
 * Calculate SGS for IN holes (10-18) using accumulator pattern.
 * Only includes holes that have score data entered. Returns detailed breakdown
 * including strokes, time components, and calculated SGS in MM:SS format.
 *
 * @param {Object} playerScores - Object containing hole scores where keys are hole numbers
 * @param {Object} playerHoleTimes - Object containing time entries for each hole
 * @returns {Object} SGS breakdown with strokes, timeMinutes, timeSeconds, and sgs properties
 *
 * @example
 * const scores = { 10: 4, 12: 5 }; // Only holes 10, 12 have scores
 * const times = { 10: "05:30", 12: "04:45" };
 * const inSGS = calcInSGS(scores, times); // Returns {strokes: 9, timeMinutes: 10, timeSeconds: 15, sgs: "19:15"}
 */
export const calcInSGS = (playerScores, playerHoleTimes) => {
  let totalStrokes = 0;
  let totalTimeSeconds = 0;
  let hasAnyScores = false;

  for (let hole = 10; hole <= 18; hole++) {
    // Only include holes that have score data
    if (playerScores[hole] && playerScores[hole] !== "" && playerScores[hole] !== null) {
      hasAnyScores = true;
      totalStrokes += parseInt(playerScores[hole]) || 0;
      const timeString = playerHoleTimes[hole] || "";
      if (timeString && timeString !== "" && timeString !== "00:00" && timeString !== "00:00:00") {
        totalTimeSeconds += mmssToSeconds(timeString);
      }
    }
  }

  // Return "--:--" if no scores entered
  if (!hasAnyScores) {
    return {
      strokes: 0,
      timeMinutes: 0,
      timeSeconds: 0,
      sgs: "--:--",
      sgsMinutes: 0,
      sgsSeconds: 0,
    };
  }

  // Calculate SGS: strokes + time (keeping seconds precision)
  const timeInMinutes = Math.floor(totalTimeSeconds / 60);
  const remainingSeconds = totalTimeSeconds % 60;
  const sgsMinutes = totalStrokes + timeInMinutes;
  const sgsSeconds = remainingSeconds;

  return {
    strokes: totalStrokes,
    timeMinutes: timeInMinutes,
    timeSeconds: remainingSeconds,
    sgs: `${String(sgsMinutes).padStart(2, "0")}:${String(sgsSeconds).padStart(2, "0")}`,
    sgsMinutes: sgsMinutes,
    sgsSeconds: sgsSeconds,
  };
};

/**
 * Calculate total SGS using accumulator pattern.
 * Only includes holes that have score data entered. Returns detailed breakdown
 * including strokes, time components, and calculated SGS in MM:SS format. Adapts to different
 * round types (full round, front 9, back 9).
 *
 * @param {Object} playerScores - Object containing hole scores where keys are hole numbers
 * @param {Object} playerHoleTimes - Object containing time entries for each hole
 * @param {boolean} isFrontNine - True if this is a front 9 round (holes 1-9 only)
 * @param {boolean} isBackNine - True if this is a back 9 round (holes 10-18 only)
 * @returns {Object} SGS breakdown with strokes, timeMinutes, timeSeconds, and sgs properties
 *
 * @example
 * const scores = { 1: 4, 3: 5, 10: 4, 15: 5 }; // Mixed front and back holes with scores
 * const times = { 1: "05:30", 3: "04:45", 10: "05:00", 15: "06:30" };
 * const totalSGS = calcTotalSGS(scores, times, false, false); // Full round SGS
 */
export const calcTotalSGS = (playerScores, playerHoleTimes, isFrontNine, isBackNine) => {
  let totalStrokes = 0;
  let totalTimeSeconds = 0;
  let hasAnyScores = false;

  // Determine holes based on round type
  let startHole = 1;
  let endHole = 18;

  if (isFrontNine) {
    startHole = 1;
    endHole = 9;
  } else if (isBackNine) {
    startHole = 10;
    endHole = 18;
  }

  for (let hole = startHole; hole <= endHole; hole++) {
    // Only include holes that have score data
    if (playerScores[hole] && playerScores[hole] !== "" && playerScores[hole] !== null) {
      hasAnyScores = true;
      totalStrokes += parseInt(playerScores[hole]) || 0;
      const timeString = playerHoleTimes[hole] || "";
      if (timeString && timeString !== "" && timeString !== "00:00" && timeString !== "00:00:00") {
        totalTimeSeconds += mmssToSeconds(timeString);
      }
    }
  }

  // Return "--:--" if no scores entered
  if (!hasAnyScores) {
    return {
      strokes: 0,
      timeMinutes: 0,
      timeSeconds: 0,
      sgs: "--:--",
      sgsMinutes: 0,
      sgsSeconds: 0,
    };
  }

  // Calculate SGS: strokes + time (keeping seconds precision)
  const timeInMinutes = Math.floor(totalTimeSeconds / 60);
  const remainingSeconds = totalTimeSeconds % 60;
  const sgsMinutes = totalStrokes + timeInMinutes;
  const sgsSeconds = remainingSeconds;

  return {
    strokes: totalStrokes,
    timeMinutes: timeInMinutes,
    timeSeconds: remainingSeconds,
    sgs: `${String(sgsMinutes).padStart(2, "0")}:${String(sgsSeconds).padStart(2, "0")}`,
    sgsMinutes: sgsMinutes,
    sgsSeconds: sgsSeconds,
  };
};

// =================================================================
// TO PAR CALCULATIONS (Accumulator Pattern)
// =================================================================

/**
 * Calculate strokes to par for OUT holes using accumulator pattern.
 * Only includes holes that have score data entered. Returns the difference
 * between actual strokes and par for only the holes that have been played.
 *
 * @param {Object} playerScores - Object containing hole scores where keys are hole numbers
 * @param {Function} getHolePar - Function that returns par for a given hole number and round
 * @param {Object} currentRound - Current round object containing round information
 * @returns {number} Strokes to par for OUT holes that have entered scores (positive = over par, negative = under par)
 *
 * @example
 * const scores = { 1: 4, 3: 5, 5: 3 }; // Only holes 1, 3, 5 have scores (total: 12)
 * // If holes 1, 3, 5 have par 4, 4, 4 respectively (total par: 12)
 * const strokesToPar = calcOutStrokesToPar(scores, getHolePar, round); // Returns 0 (even par)
 */
export const calcOutStrokesToPar = (playerScores, getHolePar, currentRound) => {
  const totalStrokes = calcOutStrokes(playerScores);
  const totalPar = calcOutStrokePar(playerScores, getHolePar, currentRound);
  return totalStrokes - totalPar;
};

/**
 * Calculate strokes to par for IN holes using accumulator pattern.
 * Only includes holes that have score data entered. Returns the difference
 * between actual strokes and par for only the holes that have been played.
 *
 * @param {Object} playerScores - Object containing hole scores where keys are hole numbers
 * @param {Function} getHolePar - Function that returns par for a given hole number and round
 * @param {Object} currentRound - Current round object containing round information
 * @returns {number} Strokes to par for IN holes that have entered scores (positive = over par, negative = under par)
 *
 * @example
 * const scores = { 10: 3, 12: 5, 14: 4 }; // Only holes 10, 12, 14 have scores (total: 12)
 * // If holes 10, 12, 14 have par 4, 4, 4 respectively (total par: 12)
 * const strokesToPar = calcInStrokesToPar(scores, getHolePar, round); // Returns 0 (even par)
 */
export const calcInStrokesToPar = (playerScores, getHolePar, currentRound) => {
  const totalStrokes = calcInStrokes(playerScores);
  const totalPar = calcInStrokePar(playerScores, getHolePar, currentRound);
  return totalStrokes - totalPar;
};

/**
 * Calculate total strokes to par using accumulator pattern.
 * Only includes holes that have score data entered. Returns the difference
 * between actual strokes and par for only the holes that have been played.
 * Adapts to different round types (full round, front 9, back 9).
 *
 * @param {Object} playerScores - Object containing hole scores where keys are hole numbers
 * @param {Function} getHolePar - Function that returns par for a given hole number and round
 * @param {Object} currentRound - Current round object containing round information
 * @param {boolean} isFrontNine - True if this is a front 9 round (holes 1-9 only)
 * @param {boolean} isBackNine - True if this is a back 9 round (holes 10-18 only)
 * @returns {number} Total strokes to par for holes that have entered scores (positive = over par, negative = under par)
 *
 * @example
 * const scores = { 1: 4, 3: 5, 10: 4, 15: 3 }; // Mixed front and back holes with scores
 * const strokesToPar = calcTotalStrokesToPar(scores, getHolePar, round, false, false); // Full round to par
 */
export const calcTotalStrokesToPar = (playerScores, getHolePar, currentRound, isFrontNine, isBackNine) => {
  const totalStrokes = calcTotalStrokes(playerScores, !isFrontNine && !isBackNine, isFrontNine, isBackNine);
  const totalPar = calcTotalStrokePar(playerScores, getHolePar, currentRound, isFrontNine, isBackNine);
  return totalStrokes - totalPar;
};

/**
 * Calculate time to par for OUT holes using accumulator pattern.
 * Only includes holes that have time data entered. Returns the difference
 * between actual time and time par for only the holes that have been played.
 *
 * @param {Object} playerHoleTimes - Object containing time entries for each hole
 * @param {Object} teeData - Tee data containing hole information including time par values
 * @param {string} divisionGender - Division/gender identifier for time par lookup (e.g., "men", "women")
 * @returns {number} Time to par in seconds for OUT holes that have time data (positive = over par, negative = under par)
 *
 * @example
 * const times = { 1: "05:30", 3: "04:45" }; // Only holes 1, 3 have time data
 * const timeToPar = calcOutTimeToPar(times, teeData, "men"); // Returns time difference from par in seconds
 */
export const calcOutTimeToPar = (playerHoleTimes, teeData, divisionGender) => {
  const totalTime = calcOutTime(playerHoleTimes);
  const totalTimePar = calculateOutTimePar(playerHoleTimes, teeData, divisionGender);
  return totalTime - totalTimePar;
};

/**
 * Calculate time to par for IN holes using accumulator pattern.
 * Only includes holes that have time data entered. Returns the difference
 * between actual time and time par for only the holes that have been played.
 *
 * @param {Object} playerHoleTimes - Object containing time entries for each hole
 * @param {Object} teeData - Tee data containing hole information including time par values
 * @param {string} divisionGender - Division/gender identifier for time par lookup (e.g., "men", "women")
 * @returns {number} Time to par in seconds for IN holes that have time data (positive = over par, negative = under par)
 *
 * @example
 * const times = { 10: "05:30", 12: "04:45" }; // Only holes 10, 12 have time data
 * const timeToPar = calcInTimeToPar(times, teeData, "women"); // Returns time difference from par in seconds
 */
export const calcInTimeToPar = (playerHoleTimes, teeData, divisionGender) => {
  const totalTime = calcInTime(playerHoleTimes);
  const totalTimePar = calculateInTimePar(playerHoleTimes, teeData, divisionGender);
  return totalTime - totalTimePar;
};

/**
 * Calculate total time to par using accumulator pattern.
 * Only includes holes that have time data entered. Returns the difference
 * between actual time and time par for only the holes that have been played.
 * Adapts to different round types (full round, front 9, back 9).
 *
 * @param {Object} playerHoleTimes - Object containing time entries for each hole
 * @param {Object} teeData - Tee data containing hole information including time par values
 * @param {string} divisionGender - Division/gender identifier for time par lookup (e.g., "men", "women")
 * @param {boolean} isFrontNine - True if this is a front 9 round (holes 1-9 only)
 * @param {boolean} isBackNine - True if this is a back 9 round (holes 10-18 only)
 * @returns {number} Total time to par in seconds for holes that have time data (positive = over par, negative = under par)
 *
 * @example
 * const times = { 1: "05:30", 10: "05:00", 15: "06:30" }; // Mixed front and back holes
 * const timeToPar = calcTotalTimeToPar(times, teeData, "men", false, false); // Full round time to par
 */
export const calcTotalTimeToPar = (playerHoleTimes, teeData, divisionGender, isFrontNine, isBackNine) => {
  const totalTime = calcTotalTime(playerHoleTimes, isFrontNine, isBackNine);
  const totalTimePar = calculateTotalTimePar(playerHoleTimes, teeData, divisionGender, isFrontNine, isBackNine);
  return totalTime - totalTimePar;
};

/**
 * Calculate SGS to par for OUT holes using accumulator pattern.
 * Only includes holes that have score data entered. Returns the difference
 * between actual SGS and SGS par for only the holes that have been played.
 *
 * @param {Object} playerScores - Object containing hole scores where keys are hole numbers
 * @param {Object} playerHoleTimes - Object containing time entries for each hole
 * @param {Function} getHolePar - Function that returns par for a given hole number and round
 * @param {Object} currentRound - Current round object containing round information
 * @param {Object} teeData - Tee data containing hole information including time par values
 * @param {string} divisionGender - Division/gender identifier for time par lookup (e.g., "men", "women")
 * @returns {Object} SGS to par breakdown with sgs (MM:SS), par (MM:SS), and difference in seconds
 *
 * @example
 * const scores = { 1: 4, 3: 5 }; // Only holes 1, 3 have scores
 * const times = { 1: "05:30", 3: "04:45" };
 * const sgsToPar = calcOutSGSToPar(scores, times, getHolePar, round, teeData, "men"); // Returns SGS difference from par
 */
export const calcOutSGSToPar = (playerScores, playerHoleTimes, getHolePar, currentRound, teeData, divisionGender) => {
  // Get SGS breakdown
  const sgsData = calcOutSGS(playerScores, playerHoleTimes);

  // Return early if no SGS data
  if (sgsData.sgs === "--:--") {
    return {
      sgs: "--:--",
      par: "--:--",
      differenceSeconds: 0,
    };
  }

  // Calculate SGS par using accumulator pattern
  const strokePar = calcOutStrokePar(playerScores, getHolePar, currentRound);
  const timeParSeconds = calculateOutTimePar(playerHoleTimes, teeData, divisionGender);
  const timeParMinutes = Math.floor(timeParSeconds / 60);
  const timeParSecondsRemainder = timeParSeconds % 60;

  const sgsParMinutes = strokePar + timeParMinutes;
  const sgsParSeconds = timeParSecondsRemainder;

  // Calculate difference in seconds for accurate comparison
  const actualSGSSeconds = sgsData.sgsMinutes * 60 + sgsData.sgsSeconds;
  const parSGSSeconds = sgsParMinutes * 60 + sgsParSeconds;
  const differenceSeconds = actualSGSSeconds - parSGSSeconds;

  return {
    sgs: sgsData.sgs,
    par: `${String(sgsParMinutes).padStart(2, "0")}:${String(sgsParSeconds).padStart(2, "0")}`,
    differenceSeconds: differenceSeconds,
  };
};

/**
 * Calculate SGS to par for IN holes using accumulator pattern.
 * Only includes holes that have score data entered. Returns the difference
 * between actual SGS and SGS par for only the holes that have been played.
 *
 * @param {Object} playerScores - Object containing hole scores where keys are hole numbers
 * @param {Object} playerHoleTimes - Object containing time entries for each hole
 * @param {Function} getHolePar - Function that returns par for a given hole number and round
 * @param {Object} currentRound - Current round object containing round information
 * @param {Object} teeData - Tee data containing hole information including time par values
 * @param {string} divisionGender - Division/gender identifier for time par lookup (e.g., "men", "women")
 * @returns {Object} SGS to par breakdown with sgs (MM:SS), par (MM:SS), and difference in seconds
 *
 * @example
 * const scores = { 10: 4, 12: 5 }; // Only holes 10, 12 have scores
 * const times = { 10: "05:30", 12: "04:45" };
 * const sgsToPar = calcInSGSToPar(scores, times, getHolePar, round, teeData, "women"); // Returns SGS difference from par
 */
export const calcInSGSToPar = (playerScores, playerHoleTimes, getHolePar, currentRound, teeData, divisionGender) => {
  // Get SGS breakdown
  const sgsData = calcInSGS(playerScores, playerHoleTimes);

  // Return early if no SGS data
  if (sgsData.sgs === "--:--") {
    return {
      sgs: "--:--",
      par: "--:--",
      differenceSeconds: 0,
    };
  }

  // Calculate SGS par using accumulator pattern
  const strokePar = calcInStrokePar(playerScores, getHolePar, currentRound);
  const timeParSeconds = calculateInTimePar(playerHoleTimes, teeData, divisionGender);
  const timeParMinutes = Math.floor(timeParSeconds / 60);
  const timeParSecondsRemainder = timeParSeconds % 60;

  const sgsParMinutes = strokePar + timeParMinutes;
  const sgsParSeconds = timeParSecondsRemainder;

  // Calculate difference in seconds for accurate comparison
  const actualSGSSeconds = sgsData.sgsMinutes * 60 + sgsData.sgsSeconds;
  const parSGSSeconds = sgsParMinutes * 60 + sgsParSeconds;
  const differenceSeconds = actualSGSSeconds - parSGSSeconds;

  return {
    sgs: sgsData.sgs,
    par: `${String(sgsParMinutes).padStart(2, "0")}:${String(sgsParSeconds).padStart(2, "0")}`,
    differenceSeconds: differenceSeconds,
  };
};

/**
 * Calculate total SGS to par using accumulator pattern.
 * Only includes holes that have score data entered. Returns the difference
 * between actual SGS and SGS par for only the holes that have been played.
 * Adapts to different round types (full round, front 9, back 9).
 *
 * @param {Object} playerScores - Object containing hole scores where keys are hole numbers
 * @param {Object} playerHoleTimes - Object containing time entries for each hole
 * @param {Function} getHolePar - Function that returns par for a given hole number and round
 * @param {Object} currentRound - Current round object containing round information
 * @param {Object} teeData - Tee data containing hole information including time par values
 * @param {string} divisionGender - Division/gender identifier for time par lookup (e.g., "men", "women")
 * @param {boolean} isFrontNine - True if this is a front 9 round (holes 1-9 only)
 * @param {boolean} isBackNine - True if this is a back 9 round (holes 10-18 only)
 * @returns {Object} SGS to par breakdown with sgs (MM:SS), par (MM:SS), and difference in seconds
 *
 * @example
 * const scores = { 1: 4, 3: 5, 10: 4, 15: 5 }; // Mixed front and back holes with scores
 * const times = { 1: "05:30", 3: "04:45", 10: "05:00", 15: "06:30" };
 * const sgsToPar = calcTotalSGSToPar(scores, times, getHolePar, round, teeData, "men", false, false); // Full round SGS to par
 */
export const calcTotalSGSToPar = (
  playerScores,
  playerHoleTimes,
  getHolePar,
  currentRound,
  teeData,
  divisionGender,
  isFrontNine,
  isBackNine,
) => {
  // Get SGS breakdown
  const sgsData = calcTotalSGS(playerScores, playerHoleTimes, isFrontNine, isBackNine);

  // Return early if no SGS data
  if (sgsData.sgs === "--:--") {
    return {
      sgs: "--:--",
      par: "--:--",
      differenceSeconds: 0,
    };
  }

  // Calculate SGS par using accumulator pattern
  const strokePar = calcTotalStrokePar(playerScores, getHolePar, currentRound, isFrontNine, isBackNine);
  const timeParSeconds = calculateTotalTimePar(playerHoleTimes, teeData, divisionGender, isFrontNine, isBackNine);
  const timeParMinutes = Math.floor(timeParSeconds / 60);
  const timeParSecondsRemainder = timeParSeconds % 60;

  const sgsParMinutes = strokePar + timeParMinutes;
  const sgsParSeconds = timeParSecondsRemainder;

  // Calculate difference in seconds for accurate comparison
  const actualSGSSeconds = sgsData.sgsMinutes * 60 + sgsData.sgsSeconds;
  const parSGSSeconds = sgsParMinutes * 60 + sgsParSeconds;
  const differenceSeconds = actualSGSSeconds - parSGSSeconds;

  return {
    sgs: sgsData.sgs,
    par: `${String(sgsParMinutes).padStart(2, "0")}:${String(sgsParSeconds).padStart(2, "0")}`,
    differenceSeconds: differenceSeconds,
  };
};

// =================================================================
// TO PAR FORMATTING
// =================================================================

/**
 * Format strokes with "to par" display notation.
 * Displays stroke score with relationship to stroke par (over, under, or even).
 *
 * @param {number} strokes - The actual stroke count achieved
 * @param {number} strokePar - The stroke par value for comparison
 * @returns {string} Formatted string showing strokes and relationship to par
 *
 * @example
 * formatStrokesToPar(72, 70); // Returns "72 (+2)" - 2 over par
 * formatStrokesToPar(70, 70); // Returns "70 (E)" - even par
 * formatStrokesToPar(68, 70); // Returns "68 (-2)" - 2 under par
 * formatStrokesToPar(0, 70); // Returns "" - no strokes entered
 */
export const formatStrokesToPar = (strokes, strokePar) => {
  if (!strokes || !strokePar) {
    return "";
  }

  const diff = strokes - strokePar;

  let result;
  if (diff === 0) result = `${strokes} (E)`;
  else if (diff > 0) result = `${strokes} (+${diff})`;
  else result = `${strokes} (${diff})`;

  return result;
};

/**
 * Format time with "to par" display notation.
 * Displays time with relationship to time par (over, under, or even).
 * Converts seconds to MM:SS format for display.
 *
 * @param {number} timeSeconds - The actual time in seconds
 * @param {number} timeParSeconds - The time par in seconds
 * @returns {string} Formatted string showing time in MM:SS and relationship to par
 *
 * @example
 * formatTimeToPar(330, 300); // Returns "05:30 (+0:30)" - 30 seconds over par
 * formatTimeToPar(300, 300); // Returns "05:00 (E)" - even with time par
 * formatTimeToPar(270, 300); // Returns "04:30 (-0:30)" - 30 seconds under par
 * formatTimeToPar(0, 300); // Returns "" - no time entered
 */
export const formatTimeToPar = (timeSeconds, timeParSeconds) => {
  if (!timeSeconds || !timeParSeconds) return "";

  // Convert time to MM:SS format
  const timeMinutes = Math.floor(timeSeconds / 60);
  const timeSecondsRemainder = timeSeconds % 60;
  const timeDisplay = `${String(timeMinutes).padStart(2, "0")}:${String(timeSecondsRemainder).padStart(2, "0")}`;

  // Calculate difference
  const diffSeconds = timeSeconds - timeParSeconds;

  if (diffSeconds === 0) return `${timeDisplay} (E)`;

  // Format difference as MM:SS
  const absDiffSeconds = Math.abs(diffSeconds);
  const diffMinutes = Math.floor(absDiffSeconds / 60);
  const diffSecondsRemainder = absDiffSeconds % 60;
  const diffDisplay = `${String(diffMinutes).padStart(1, "0")}:${String(diffSecondsRemainder).padStart(2, "0")}`;

  if (diffSeconds > 0) return `${timeDisplay} (+${diffDisplay})`;
  return `${timeDisplay} (-${diffDisplay})`;
};

/**
 * Format SGS with "to par" display notation.
 * Displays SGS score in MM:SS format with relationship to SGS par (over, under, or even).
 * SGS is strokes + time, so the comparison uses seconds precision.
 *
 * @param {string} sgs - The actual SGS score in MM:SS format (e.g., "92:30") or "--:--" if no data
 * @param {string} sgsPar - The SGS par in MM:SS format (e.g., "90:00")
 * @param {number} differenceSeconds - The difference in seconds (positive = over par, negative = under par)
 * @returns {string} Formatted string showing SGS in MM:SS and relationship to par
 *
 * @example
 * formatSGSToPar("92:30", "90:00", 150); // Returns "92:30 (+2:30)" - 2:30 over SGS par
 * formatSGSToPar("90:00", "90:00", 0); // Returns "90:00 (E)" - even with SGS par
 * formatSGSToPar("87:30", "90:00", -150); // Returns "87:30 (-2:30)" - 2:30 under SGS par
 * formatSGSToPar("--:--", "", 0); // Returns "--:--" - no SGS calculated
 */
export const formatSGSToPar = (sgs, sgsPar, differenceSeconds) => {
  if (!sgs || sgs === "--:--" || !sgsPar) return sgs || "--:--";

  if (differenceSeconds === 0) return `${sgs} (E)`;

  // Format difference as MM:SS
  const absDiffSeconds = Math.abs(differenceSeconds);
  const diffMinutes = Math.floor(absDiffSeconds / 60);
  const diffSecondsRemainder = absDiffSeconds % 60;
  const diffDisplay = `${String(diffMinutes).padStart(1, "0")}:${String(diffSecondsRemainder).padStart(2, "0")}`;

  if (differenceSeconds > 0) return `${sgs} (+${diffDisplay})`;
  return `${sgs} (-${diffDisplay})`;
};
