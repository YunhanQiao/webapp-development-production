/**
 * @fileoverview ScoreCellWithTime - A comprehensive golf scorecard cell component.
 *
 * This component renders a single hole's scorecard cell with integrated time tracking
 * and SGS (Speedgolf Score) calculation. It supports both score entry and time entry
 * modes, with proper validation and visual feedback for golf scoring.
 *
 * Features:
 * - Stroke score input with par-based styling
 * - Time input with minutes and seconds
 * - SGS calculation and display
 * - Visual feedback for score relative to par
 * - Support for final results display mode
 *
 * @component
 * @example
 * // Basic usage in a tournament scorecard
 * <ScoreCellWithTime
 *   holeNum={1}
 *   player={playerData}
 *   selectedRound="R1"
 *   roundScores={scoresObject}
 *   roundHoleTimes={timesObject}
 *   getHolePar={getHolePar}
 *   getScoreClass={getScoreClass}
 *   currentRound={roundData}
 *   handleScoreChange={handleScoreChange}
 *   handleHoleTimeChange={handleHoleTimeChange}
 *   strokePar={4}
 *   timePar={300}
 *   showHoleTimes={true}
 *   finalResults={false}
 * />
 *
 * @author GitHub Copilot
 * @version 2.0.0
 * @since 2025-01-18
 *
 * @changelog
 * v2.0.0 - Added auto-defaulting seconds to "00" when minutes entered
 *        - Added conditional TimeToParIcons display based on meaningful time data
 *        - Enhanced time clearing and validation logic
 */

import React, { useState } from "react";

// This is a shared component. Need to move them to shared folder for global feature access
import TimeToParIcons from "features/round/components/ScoreCard/components/TimeToParIcons";

/**
 * ScoreCellWithTime - A comprehensive golf scorecard cell component.
 *
 * Renders a single hole's scorecard entry with integrated time tracking for speedgolf.
 * Supports both stroke and time entry with automatic SGS calculation and display.
 * Features auto-defaulting seconds to "00" when minutes are entered and conditional
 * time-to-par icon display based on meaningful time data.
 *
 * @param {Object} props - The component props
 * @param {number} props.holeNum - The hole number (1-18)
 * @param {Object} props.player - Player data object containing userId and other player information
 * @param {string} props.selectedRound - The selected round identifier (e.g., "R1", "R2")
 * @param {Object} props.roundScores - Object containing scores for each hole, keyed by hole number
 * @param {Object} props.roundHoleTimes - Object containing time data for each hole, keyed by hole number
 * @param {Function} props.getHolePar - Function to get par for a specific hole and round
 * @param {Function} props.getScoreClass - Function to get CSS class based on score relative to par
 * @param {Object} props.currentRound - Current round object containing round configuration
 * @param {Function} props.handleScoreChange - Callback function for score changes
 * @param {Function} props.handleHoleTimeChange - Callback function for time changes
 * @param {number} props.strokePar - The stroke par for this hole
 * @param {number} props.timePar - The time par for this hole in seconds
 * @param {boolean} [props.showHoleTimes=true] - Whether to show time input fields
 * @param {boolean} [props.finalResults=false] - Whether this is in final results mode (read-only)
 * @param {boolean} [props.isRoundLocked=false] - Whether this round is locked due to incomplete previous round
 *
 * @returns {JSX.Element} The rendered scorecard cell component
 *
 * @example
 * // Score entry mode
 * <ScoreCellWithTime
 *   holeNum={1}
 *   player={{userId: "player123", name: "John Doe"}}
 *   selectedRound="R1"
 *   roundScores={{1: 4, 2: 3}}
 *   roundHoleTimes={{1: "00:05:30", 2: "00:04:15"}}
 *   getHolePar={(hole, round) => 4}
 *   getScoreClass={(par, score, hole) => "par"}
 *   currentRound={{id: "round1", numHoles: 18}}
 *   handleScoreChange={(playerId, round, hole, score) => {}}
 *   handleHoleTimeChange={(playerId, round, hole, time) => {}}
 *   strokePar={4}
 *   timePar={300}
 *   showHoleTimes={true}
 *   finalResults={false}
 * />
 *
 * @example
 * // Final results mode (read-only)
 * <ScoreCellWithTime
 *   holeNum={1}
 *   player={{userId: "player123", name: "John Doe"}}
 *   selectedRound="R1"
 *   roundScores={{1: 4}}
 *   roundHoleTimes={{1: "00:05:30"}}
 *   getHolePar={(hole, round) => 4}
 *   getScoreClass={(par, score, hole) => "par"}
 *   currentRound={{id: "round1", numHoles: 18}}
 *   handleScoreChange={() => {}}
 *   handleHoleTimeChange={() => {}}
 *   strokePar={4}
 *   timePar={300}
 *   showHoleTimes={true}
 *   finalResults={true}
 * />
 */
const ScoreCellWithTime = ({
  holeNum,
  player,
  selectedRound,
  roundScores,
  roundHoleTimes,
  getHolePar,
  getScoreClass,
  currentRound,
  handleScoreChange,
  handleHoleTimeChange,
  strokePar,
  timePar,
  showHoleTimes = true,
  finalResults = false,
  isRoundLocked = false,
  holeTimeMode = "durations", // New prop for time format mode
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const timeString = roundHoleTimes[holeNum] || "";

  // Parse time string safely, handling both MM:SS and HH:MM:SS formats
  let minutes = 0;
  let seconds = 0;
  if (timeString && timeString.includes(":")) {
    const parts = timeString.split(":");
    if (parts.length === 2) {
      // MM:SS format
      minutes = parseInt(parts[0]) || 0;
      seconds = parseInt(parts[1]) || 0;
    } else if (parts.length === 3) {
      // HH:MM:SS format - use minutes and seconds parts
      minutes = parseInt(parts[1]) || 0;
      seconds = parseInt(parts[2]) || 0;
    }
  }

  const totalSeconds = minutes * 60 + seconds;

  // Check if time data has been actually entered (not just auto-populated zeros)
  const hasTimeData = timeString && timeString !== "" && timeString !== "00:00:00" && (minutes > 0 || seconds > 0);

  const timeToPar = timePar - totalSeconds;

  /**
   * Handles minutes input change for hole time entry.
   * Validates input to ensure it's within valid range (0-59).
   * Allows clearing the entire time when both fields become empty.
   *
   * @param {Event} e - The input change event
   */
  const handleMinutesChange = e => {
    const value = e.target.value;

    // If the input is empty, check if we should clear the entire time
    if (value === "" || value === null || value === undefined) {
      // If seconds are also 0 or empty, clear the entire time
      if (seconds === 0) {
        handleHoleTimeChange(player.userId, selectedRound, holeNum, "");
        return;
      }
      // Otherwise set minutes to 0 but keep seconds
      let formattedTime;
      if (holeTimeMode === "durations") {
        formattedTime = `00:${String(seconds).padStart(2, "0")}`;
      } else {
        formattedTime = `00:00:${String(seconds).padStart(2, "0")}`;
      }
      handleHoleTimeChange(player.userId, selectedRound, holeNum, formattedTime);
      return;
    }

    const min = Math.max(0, Math.min(59, parseInt(value) || 0));

    // Format time based on the hole time mode
    let formattedTime;
    if (holeTimeMode === "durations") {
      formattedTime = `${String(min).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    } else {
      // timestamps mode - use HH:MM:SS format
      formattedTime = `00:${String(min).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
    }

    handleHoleTimeChange(player.userId, selectedRound, holeNum, formattedTime);
  };

  /**
   * Handles seconds input change for hole time entry.
   * Validates input to ensure it's within valid range (0-59).
   * Allows clearing the entire time when both fields become empty.
   *
   * @param {Event} e - The input change event
   */
  const handleSecondsChange = e => {
    const value = e.target.value;

    // If the input is empty, check if we should clear the entire time
    if (value === "" || value === null || value === undefined) {
      // If minutes are also 0 or empty, clear the entire time
      if (minutes === 0) {
        handleHoleTimeChange(player.userId, selectedRound, holeNum, "");
        return;
      }
      // If there's a minutes value, seconds must default to "00"
      let formattedTime;
      if (holeTimeMode === "durations") {
        formattedTime = `${String(minutes).padStart(2, "0")}:00`;
      } else {
        formattedTime = `00:${String(minutes).padStart(2, "0")}:00`;
      }
      handleHoleTimeChange(player.userId, selectedRound, holeNum, formattedTime);
      return;
    }

    const sec = Math.max(0, Math.min(59, parseInt(value) || 0));

    // Format time based on the hole time mode
    let formattedTime;
    if (holeTimeMode === "durations") {
      formattedTime = `${String(minutes).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    } else {
      // timestamps mode - use HH:MM:SS format
      formattedTime = `00:${String(minutes).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
    }

    handleHoleTimeChange(player.userId, selectedRound, holeNum, formattedTime);
  };

  /**
   * Handles when the minutes input field loses focus.
   * Ensures seconds defaults to "00" when minutes has a value and seconds is empty.
   */
  const handleMinutesBlur = e => {
    const minutesValue = parseInt(e.target.value) || 0;

    // If there's a minutes value, ensure there's a complete time format
    if (minutesValue > 0) {
      let formattedTime;
      if (holeTimeMode === "durations") {
        formattedTime = `${String(minutesValue).padStart(2, "0")}:00`;
      } else {
        formattedTime = `00:${String(minutesValue).padStart(2, "0")}:00`;
      }
      if (timeString !== formattedTime) {
        handleHoleTimeChange(player.userId, selectedRound, holeNum, formattedTime);
      }
    }
  };

  /**
   * Handles when the seconds input field loses focus.
   * Ensures seconds defaults to "00" when there's a minutes value.
   */
  const handleSecondsBlur = e => {
    const secondsValue = e.target.value;
    // If seconds field is empty and there's a minutes value, default to "00"
    if ((secondsValue === "" || secondsValue === null || secondsValue === undefined) && minutes > 0) {
      let formattedTime;
      if (holeTimeMode === "durations") {
        formattedTime = `${String(minutes).padStart(2, "0")}:00`;
      } else {
        formattedTime = `00:${String(minutes).padStart(2, "0")}:00`;
      }
      handleHoleTimeChange(player.userId, selectedRound, holeNum, formattedTime);
    }
  };

  let scoreClass = "";
  if (strokePar) {
    scoreClass = getScoreClass(strokePar, roundScores[holeNum], holeNum);

    // If the field is focused and the class would apply white text, use a temporary class instead
    if (isFocused && (scoreClass.includes("solid-circle") || scoreClass.includes("solid-square"))) {
      // Replace solid classes with their non-solid equivalents during focus
      if (scoreClass.includes("solid-circle")) {
        scoreClass = scoreClass.replace("solid-circle", "circle");
      }
      if (scoreClass.includes("solid-square")) {
        scoreClass = scoreClass.replace("solid-square", "square");
      }
    }
  }
  return (
    <td
      className="p-2 border text-center"
      style={{
        height: showHoleTimes ? "220px" : "50px",
        width: "auto",
        minWidth: "auto",
        maxWidth: "auto",
        backgroundColor: isRoundLocked ? "#f8f9fa" : "transparent",
        opacity: isRoundLocked ? 0.6 : 1,
      }}
    >
      {/* Lock icon removed per user feedback - disabled state is sufficient visual indicator */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          alignItems: "center",
          height: "100%",
          paddingTop: "15px",
          paddingBottom: "15px",
          position: "relative",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "33.33%",
            paddingBottom: "10px", // Add bottom padding to create space below stroke input
          }}
        >
          <input
            type={`${!finalResults ? "number" : "text"}`}
            min="1"
            max="99"
            disabled={finalResults || isRoundLocked}
            style={{ height: "30px", width: "30px" }}
            className={`${scoreClass} text-center`}
            value={!finalResults ? roundScores[holeNum] || "" : roundScores[holeNum] || "--"}
            onChange={e => handleScoreChange(player.userId, selectedRound, holeNum, e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "33.33%",
            paddingTop: "10px", // Add top padding to create space above time inputs
          }}
        >
          {!showHoleTimes ? (
            <span>—</span>
          ) : finalResults && !hasTimeData ? (
            <span>--:--</span>
          ) : hasTimeData || !finalResults ? (
            <div className="sc-time-input-container d-flex flex-column align-items-center justify-content-center">
              <div className="sc-time-inputs d-flex">
                <div className="sc-time-group">
                  <input
                    type={`${!finalResults ? "number" : "text"}`}
                    min="0"
                    max="59"
                    className="sc-time-min-input"
                    disabled={finalResults || isRoundLocked}
                    value={timeString === "" ? "" : minutes || ""}
                    onChange={handleMinutesChange}
                    onBlur={handleMinutesBlur}
                  />
                  <span className="sc-time-label">min</span>
                </div>
                <span className="sc-time-separator">:</span>
                <div className="sc-time-group">
                  <input
                    type={`${!finalResults ? "number" : "text"}`}
                    min="0"
                    max="59"
                    className="sc-time-sec-input"
                    disabled={finalResults || isRoundLocked}
                    value={
                      timeString === ""
                        ? ""
                        : seconds !== null && seconds !== undefined
                          ? seconds.toString().padStart(2, "0")
                          : ""
                    }
                    onChange={handleSecondsChange}
                    onBlur={handleSecondsBlur}
                  />
                  <span className="sc-time-label">sec</span>
                </div>
              </div>
              {hasTimeData && (
                <div className="w-100 d-flex justify-content-center" style={{ marginTop: "8px" }}>
                  <TimeToParIcons timeToPar={timeToPar} />
                </div>
              )}
            </div>
          ) : (
            <span>--:--</span>
          )}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            height: "33.33%",
            paddingTop: "15px", // Add top padding to create more space above SGS
          }}
        >
          <span>
            {!showHoleTimes
              ? "—"
              : roundScores[holeNum] && roundScores[holeNum] !== "" && roundScores[holeNum] !== null
                ? hasTimeData
                  ? `${parseInt(roundScores[holeNum]) + parseInt(minutes)}:${String(seconds).padStart(2, "0")}`
                  : "--:--"
                : "--:--"}
          </span>
        </div>
      </div>
    </td>
  );
};

export default ScoreCellWithTime;
