/**
 * @fileoverview TournamentScoresPage - Comprehensive golf tournament score entry and management system.
 *
 * This component provides a complete tournament scoring interface supporting both traditional
 * golf scoring and speedgolf time tracking. It handles score entry, validation, display,
 * and persistence for tournament play across multiple rounds and divisions.
 *
 * Key Features:
 * - Multi-round tournament support with flexible round configurations
 * - Dual scoring modes: traditional golf and speedgolf (with time tracking)
 * - Real-time SGS (Speedgolf Score) calculation with seconds precision
 * - Par-based score visualization and validation
 * - Time entry with automatic finish time calculation
 * - Comprehensive score persistence and validation
 * - Division-based player management
 * - Course information integration
 * - Responsive scorecard layout supporting 18-hole, front 9, and back 9 formats
 * - "All Divisions" view with multi-table rendering for cross-division tournaments
 * - Player search functionality for quick score entry access
 *
 * Player Search System:
 * The player search feature enables tournament administrators to quickly locate specific
 * players for efficient score entry, particularly useful in large tournaments with many
 * participants across multiple divisions.
 *
 * - **Case-Insensitive Search**: Matches player names regardless of capitalization
 * - **Real-Time Filtering**: Updates results immediately as user types
 * - **Cross-Division Search**: In "All Divisions" view, searches across all tournament divisions
 * - **Division-Specific Search**: In individual division view, filters only that division's players
 * - **Smart Division Hiding**: In "All Divisions" view, completely hides divisions with no search matches
 * - **Clear Search**: One-click button to clear search term and restore full player list
 * - **Search Scope Indication**: Search is limited to currently selected division and round
 *
 * All Divisions View:
 * The "All Divisions" feature allows tournament administrators to view and manage scores
 * for all divisions simultaneously in a single interface. This is particularly useful for
 * tournaments with multiple divisions that may have different round configurations.
 *
 * - **Multi-Table Rendering**: Displays separate scorecards for each division
 * - **Division-Specific Rounds**: Handles divisions with different numbers of rounds
 * - **Course Data Integration**: Automatically retrieves course information for each division
 * - **Fallback Messaging**: Shows clear messages when divisions lack selected rounds
 * - **Empty Division Handling**: Displays appropriate messaging for divisions without players
 *
 * Time Par Calculation Architecture:
 * - Table Header: Uses unified timePar calculation with Math.round() for consistent display
 *   across all holes, providing baseline comparison for all players
 * - Player Calculations: Uses accumulator pattern (calculateOutTimePar, calculateInTimePar,
 *   calculateTotalTimePar) for OUT/IN/TOTAL columns when hole times are enabled, which only
 *   includes holes with actual player data for accurate partial scoring
 * - Precision: All time par calculations use Math.round() to ensure display consistency
 *   with GolfCourseInfoTable component
 *
 * SGS Calculation:
 * Uses accumulator pattern for accurate partial scoring - only includes holes with
 * actual score data. SGS is calculated as strokes + time with full seconds precision
 * displayed in MM:SS format.
 *
 * Time Management:
 * Supports both manual time entry and automatic calculation from hole times.
 * Validates time consistency and provides real-time feedback.
 *
 * Time Entry Method Enforcement System:
 * This component implements a sophisticated time entry method detection and enforcement
 * system to prevent data corruption and ensure tournament scoring consistency:
 *
 * - **Detection**: Automatically analyzes existing tournament data to determine which
 *   time entry method has been established (hole-by-hole vs start/finish times)
 * - **Enforcement**: Locks the UI to the detected method, disabling incompatible options
 * - **Data Protection**: Prevents switching between time entry methods once data exists
 * - **User Feedback**: Provides clear messaging about why certain options are disabled
 *
 * Detection Logic:
 * 1. Checks current holeTimes state for unsaved hole-by-hole data
 * 2. Analyzes tournament-level player scorecards for saved time data
 * 3. Falls back to division-level scorecards (legacy structure)
 * 4. Returns "hole_by_hole", "start_finish", or null based on findings
 *
 * UI Enforcement:
 * - Disables "Round start and finish time" when hole-by-hole data exists
 * - Disables "Hole-by-hole durations" when start/finish data exists
 * - Shows explanatory text for disabled options
 * - Maintains data integrity across page refreshes and navigation
 *
 * @component
 * @example
 * // Basic tournament score entry
 * <TournamentScoresPage
 *   finalResults={false}
 *   playerId={null}
 *   fullCoursesData={coursesData}
 * />
 *
 * @example
 * // Final results display for specific player
 * <TournamentScoresPage
 *   finalResults={true}
 *   playerId="player123"
 *   fullCoursesData={coursesData}
 * />
 *
 * @author GitHub Copilot
 * @version 2.2.0
 * @since 2025-01-17
 *
 * @changelog
 * v2.2.0 - Added player search functionality for efficient score entry access
 *        - Implemented case-insensitive player name filtering across all views
 *        - Added smart division hiding in "All Divisions" view when no search matches
 *        - Enhanced user experience with real-time search results and clear button
 * v2.1.0 - Added "All Divisions" view with multi-table rendering
 *        - Enhanced course data fallback logic for division-specific rounds
 *        - Added getDivisionCourseData and getDivisionCourseInfo helper functions
 *        - Improved empty division and missing round handling
 *        - Added consistent tournament banner styling across all pages
 */

import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { tournamentsSelector } from "../competitionSelectors";
import { fetchAllCompetitions, saveTournamentScores } from "../competitionActions";
import { notifyMessage } from "services/toasterServices";
import useAuthProtection from "../../../auth/useAuthProtection";
import "../../../styles/features/competition/scoreStyles.css";
import "flag-icon-css/css/flag-icons.min.css";
import RoundSelector from "./scores/RoundSelector";
import ScoreControlsBar from "./scores/ScoreControlsBar";
import DefaultProfilePic from "../../../images/DefaultProfilePic.jpg";
import {
  convertTo24Hour,
  formatToAMPM,
  calculateTimeFromFinishAndStart,
  mmssToSeconds,
  timeToPar,
  secondsToMmss,
} from "./scores/timeUtils";
import {
  calcOutStrokes,
  calcInStrokes,
  calcTotalStrokes,
  calcOutStrokePar,
  calcInStrokePar,
  calcTotalStrokePar,
  calcTotalStrokesToPar,
  calcOutTime,
  calcInTime,
  calcTotalTime,
  calculateOutTimePar,
  calculateInTimePar,
  calculateTotalTimePar,
  calculateSGS,
  calcOutSGS,
  calcInSGS,
  calcTotalSGS,
  calcOutSGSToPar,
  calcInSGSToPar,
  calcTotalSGSToPar,
  formatStrokesToPar,
  formatSGSToPar,
} from "./scores/parCalcUtils";
import ScoreCellWithTime from "./scores/ScoreCellWithTime";
import { fetchCourseByIds } from "features/course/courseActions";
import GolfCourseInfoTable from "../components/GolfCourseInfoTable";
import { computeSGSToPar } from "features/round/utils";
import {
  isRealTimeData,
  hasRealTimeDataInRound,
  isRealDurationData,
  isRealTimestampData,
} from "../utils/timeValidation";

const DEFAULT_LOGO = "../../../../images/DefaultGolfCoursePic.jpg";

/**
 * TournamentScoresPage - Comprehensive golf tournament score entry and management system.
 *
 * Main tournament scoring interface that handles both traditional golf and speedgolf scoring.
 * Supports multiple rounds, divisions, and flexible course configurations. Provides real-time
 * SGS calculation with seconds precision and comprehensive score validation.
 *
 * @param {Object} props - Component props
 * @param {boolean} [props.finalResults=false] - Whether to display in final results mode (read-only)
 * @param {string|null} [props.playerId=null] - Specific player ID to display (for final results)
 * @param {Object} [props.fullCoursesData] - Complete course data for all courses in tournament
 *
 * @returns {JSX.Element} The tournament scores page component
 *
 * @example
 * // Score entry mode for tournament administration
 * <TournamentScoresPage
 *   finalResults={false}
 *   playerId={null}
 *   fullCoursesData={coursesData}
 * />
 *
 * @example
 * // Final results display for specific player
 * <TournamentScoresPage
 *   finalResults={true}
 *   playerId="player123"
 *   fullCoursesData={coursesData}
 * />
 *
 * @component
 */
const TournamentScoresPage = ({ finalResults = false, playerId, fullCoursesData }) => {
  const dispatch = useDispatch();
  const { competitionId } = useParams();
  const tournaments = useSelector(tournamentsSelector);
  const userPreferredUnits = useSelector(state => state?.user?.user?.preferences?.preferredUnits ?? "metric");
  const navigate = useNavigate();

  // Authentication protection for score saving
  const { protectedSubmit } = useAuthProtection({
    onAuthLost: () => {
      notifyMessage(
        "warning",
        "Your session has expired. Please save your work and log in again to continue scoring.",
        8000,
        "colored",
        "top-center",
      );
    },
  });

  // State management for tournament scoring
  const [isLoading, setIsLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [selectedDivision, setSelectedDivision] = useState("");
  const [selectedRound, setSelectedRound] = useState("R1");
  const [scores, setScores] = useState({});
  const [holeTimes, setHoleTimes] = useState({});
  const [startTimes, setStartTimes] = useState({});
  const [finishTimes, setFinishTimes] = useState({});
  const [unsavedChanges, setUnsavedChanges] = useState(false);
  const [savedPlayers, setSavedPlayers] = useState({});
  const [coursesInfo, setCoursesInfo] = useState({});
  const [units, onUnitsChange] = useState(userPreferredUnits);
  const [holeTimeMode, setHoleTimeMode] = useState("none");
  const [establishedTimeEntryMethod, setEstablishedTimeEntryMethod] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Helper function to determine if hole times are enabled
  const showHoleTimes = holeTimeMode === "durations";

  /**
   * Filters players based on the search term for efficient score entry access.
   *
   * This function provides real-time player filtering functionality to help tournament
   * administrators quickly locate specific players for score entry. It performs case-insensitive
   * partial matching on player names and handles edge cases gracefully.
   *
   * **Search Behavior:**
   * - **Case-Insensitive**: Matches regardless of capitalization in search term or player name
   * - **Partial Matching**: Finds players whose names contain the search term anywhere within
   * - **Whitespace Handling**: Trims whitespace from search term to prevent empty space matches
   * - **Null Safety**: Safely handles players without playerName property
   *
   * **Performance Considerations:**
   * - Returns original array immediately if no search term provided (no filtering overhead)
   * - Uses efficient JavaScript filter() method for real-time performance
   * - Lightweight string operations suitable for typical tournament player counts
   *
   * **Integration:**
   * - Used in both individual division view and "All Divisions" view
   * - Works seamlessly with existing player sorting and display logic
   * - Maintains player object structure for downstream components
   *
   * @param {Array<Object>} players - Array of player objects to filter
   * @param {string} players[].playerName - The player's display name for matching
   * @param {string} players[].userId - The player's unique identifier
   * @returns {Array<Object>} Filtered array containing only players whose names match the search term
   *
   * @example
   * // Search for players with "john" in their name
   * setSearchTerm("john");
   * const filtered = filterPlayersBySearch(divisionPlayers);
   * // Returns: [{playerName: "John Smith", ...}, {playerName: "Johnny Doe", ...}]
   *
   * @example
   * // Case-insensitive matching
   * setSearchTerm("SMITH");
   * const filtered = filterPlayersBySearch(divisionPlayers);
   * // Returns: [{playerName: "John Smith", ...}, {playerName: "Jane Smith", ...}]
   *
   * @example
   * // Empty search returns all players
   * setSearchTerm("");
   * const filtered = filterPlayersBySearch(divisionPlayers);
   * // Returns: Original unfiltered player array
   *
   * @since 2.2.0
   */
  const filterPlayersBySearch = players => {
    if (!searchTerm.trim()) {
      return players;
    }

    const searchLower = searchTerm.toLowerCase().trim();
    return players.filter(player => player.playerName && player.playerName.toLowerCase().includes(searchLower));
  };

  /**
   * Determines the established time entry method for this tournament by analyzing existing data.
   *
   * This method enforces tournament scoring consistency by detecting which time entry approach
   * has been used based on existing scorecards and current state data. Once a method is established,
   * the UI will lock to prevent switching between incompatible time entry approaches, protecting
   * data integrity and preventing user confusion.
   *
   * **Detection Priority Order:**
   * 1. **Current holeTimes state** - Checks for unsaved hole-by-hole data in component state
   * 2. **Tournament-level players** - Primary data structure for saved scorecards
   * 3. **Division-level players** - Legacy data structure support
   *
   * **Method Classification:**
   * - **"hole_by_hole"**: Any meaningful hole time data found (validates using isRealTimeData)
   * - **"start_finish"**: Start/finish times found without hole time data
   * - **null**: No established method detected (clean tournament state)
   *
   * **Data Validation:**
   * Uses isRealTimeData() to distinguish meaningful time entries from placeholder values
   * like "00:00:00", "--:--", null, or empty strings.
   *
   * @returns {"hole_by_hole" | "start_finish" | null} The established method, or null if no data exists
   *
   * @example
   * // Typical usage in time entry method enforcement
   * const method = getEstablishedTimeEntryMethod();
   * if (method === "hole_by_hole") {
   *   // Lock UI to hole-by-hole mode, disable start/finish option
   *   setHoleTimeMode("durations");
   * } else if (method === "start_finish") {
   *   // Lock UI to start/finish mode, disable hole-by-hole option
   *   setHoleTimeMode("none");
   * }
   *
   * @see {@link isRealTimeData} For time data validation logic
   * @see {@link ScoreControlsBar} For UI enforcement implementation
   * @since 2.1.0
   */
  /**
   * Detects if tournament data contains legacy hole time format.
   * Legacy data is characterized by:
   * 1. All hole times prefixed with "00:" (HH:MM:SS format)
   * 2. Values that don't increase by at least 20 seconds hole-to-hole
   *
   * This indicates the data represents durations in "00:MM:SS" format rather than timestamps.
   *
   * @param {Object} playerData - Player scorecard data to analyze
   * @returns {boolean} True if legacy data pattern is detected
   */
  const isLegacyHoleTimeData = useCallback(playerData => {
    if (!playerData?.scoreCards?.length) return false;

    for (const scoreCard of playerData.scoreCards) {
      if (!scoreCard.scores?.length) continue;

      // Get hole times that have meaningful data
      const holeTimesWithData = scoreCard.scores
        .filter(score => score.holeTime && isRealTimeData(score.holeTime))
        .map(score => ({
          hole: score.hole,
          holeTime: score.holeTime,
        }))
        .sort((a, b) => a.hole - b.hole);

      if (holeTimesWithData.length < 2) continue;

      // Check if all times are prefixed with "00:"
      const allHaveZeroHourPrefix = holeTimesWithData.every(item => item.holeTime.startsWith("00:"));

      if (!allHaveZeroHourPrefix) continue;

      // Convert times to seconds and check if they increase by at least 20 seconds
      const timesInSeconds = holeTimesWithData.map(item => {
        const [hours, minutes, seconds] = item.holeTime.split(":").map(Number);
        return hours * 3600 + minutes * 60 + seconds;
      });

      // Check if times increase by at least 20 seconds hole-to-hole
      let hasReasonableIncrease = false;
      for (let i = 1; i < timesInSeconds.length; i++) {
        const increase = timesInSeconds[i] - timesInSeconds[i - 1];
        if (increase >= 20) {
          hasReasonableIncrease = true;
          break;
        }
      }

      // If we have "00:" prefix but no reasonable increases, it's legacy data
      if (!hasReasonableIncrease) {
        return true;
      }
    }

    return false;
  }, []);

  const getEstablishedTimeEntryMethod = useCallback(() => {
    // First check current holeTimes state for existing data
    if (holeTimes && Object.keys(holeTimes).length > 0) {
      for (const playerId of Object.keys(holeTimes)) {
        for (const roundId of Object.keys(holeTimes[playerId] || {})) {
          const roundTimes = holeTimes[playerId][roundId];
          if (roundTimes && Object.keys(roundTimes).length > 0) {
            for (const holeNumber of Object.keys(roundTimes)) {
              const holeTime = roundTimes[holeNumber];

              // Check for realistic timestamp data first (HH:MM:SS format with realistic hours)
              if (isRealTimestampData(holeTime)) {
                return "timestamps";
              }

              // Check for duration data (MM:SS format)
              if (isRealDurationData(holeTime)) {
                return "hole_by_hole";
              }

              // If we have any time data that doesn't match the above patterns,
              // fall back to start/finish times (legacy behavior)
              if (isRealTimeData(holeTime)) {
                return "start_finish";
              }
            }
          }
        }
      }
    }

    // No tournament data available yet
    if (!tournament?.divisions?.length) {
      return null;
    }

    // Check tournament-level players (primary structure)
    if (tournament.players?.length > 0) {
      for (const player of tournament.players) {
        if (player.scoreCards?.length > 0) {
          // Check for legacy data pattern first
          if (isLegacyHoleTimeData(player)) {
            return "start_finish";
          }

          for (const scoreCard of player.scoreCards) {
            if (scoreCard.scores?.length > 0) {
              // Check for realistic timestamp data first (HH:MM:SS format with realistic hours)
              const hasTimestampData = scoreCard.scores.some(
                score => score.holeTime && isRealTimestampData(score.holeTime),
              );

              if (hasTimestampData) {
                return "timestamps";
              }

              // Check for duration data (MM:SS format)
              const hasDurationData = scoreCard.scores.some(
                score => score.holeTime && isRealDurationData(score.holeTime),
              );

              if (hasDurationData) {
                return "hole_by_hole";
              }

              // Check for any other time data and fall back to start/finish
              const hasAnyTimeData = scoreCard.scores.some(score => score.holeTime && isRealTimeData(score.holeTime));

              if (hasAnyTimeData) {
                return "start_finish";
              }

              // Check for start/finish time data
              if (
                scoreCard.startTime ||
                scoreCard.finishTime ||
                scoreCard.roundStartTime ||
                scoreCard.roundFinishTime
              ) {
                return "start_finish";
              }
            }
          }
        }
      }
    }

    // Check division-level players (legacy structure)
    for (const division of tournament.divisions) {
      if (division.players?.length > 0) {
        for (const player of division.players) {
          if (player.scoreCards?.length > 0) {
            // Check for legacy data pattern first
            if (isLegacyHoleTimeData(player)) {
              return "start_finish";
            }

            for (const scoreCard of player.scoreCards) {
              if (scoreCard.scores?.length > 0) {
                // Check for realistic timestamp data first (HH:MM:SS format with realistic hours)
                const hasTimestampData = scoreCard.scores.some(
                  score => score.holeTime && isRealTimestampData(score.holeTime),
                );

                if (hasTimestampData) {
                  return "timestamps";
                }

                // Check for duration data (MM:SS format)
                const hasDurationData = scoreCard.scores.some(
                  score => score.holeTime && isRealDurationData(score.holeTime),
                );

                if (hasDurationData) {
                  return "hole_by_hole";
                }

                // Check for any other time data and fall back to start/finish
                const hasAnyTimeData = scoreCard.scores.some(score => score.holeTime && isRealTimeData(score.holeTime));

                if (hasAnyTimeData) {
                  return "start_finish";
                }

                // Check for start/finish time data
                if (
                  scoreCard.startTime ||
                  scoreCard.finishTime ||
                  scoreCard.roundStartTime ||
                  scoreCard.roundFinishTime
                ) {
                  return "start_finish";
                }
              }
            }
          }
        }
      }
    }

    // No established method found
    return null;
  }, [tournament, holeTimes, isLegacyHoleTimeData]);

  /**
   * Checks if any player has saved hole time data for the current round in the tournament data.
   * This only checks saved/persistent data, not unsaved changes in the current state.
   * Used to determine when "Round start and finish time" option should be disabled.
   *
   * @returns {boolean} True if any player has saved hole time data for the current round
   */
  const hasSavedHoleTimeData = () => {
    if (!selectedRound || !tournament?.divisions) return false;

    // Check tournament data for saved hole times
    for (const division of tournament.divisions) {
      if (division.players) {
        for (const player of division.players) {
          if (player.scoreCards && player.scoreCards.length > 0) {
            for (const scoreCard of player.scoreCards) {
              if (scoreCard.roundId === selectedRound && scoreCard.scores) {
                for (const score of scoreCard.scores) {
                  if (score.holeTime && isRealTimeData(score.holeTime)) {
                    return true;
                  }
                }
              }
            }
          }
        }
      }
    }
    return false;
  };

  /**
   * Handles changes to the hole time mode with comprehensive validation and enforcement.
   *
   * This function is the enforcement point for the time entry method detection system.
   * It prevents switching between incompatible time entry methods once any player has
   * saved data for the tournament, ensuring data consistency and preventing corruption.
   *
   * **Enforcement Logic:**
   * - If an established time entry method exists, validates that the new mode matches
   * - Shows user-friendly error messages explaining why the change is blocked
   * - Maps between internal method names and UI mode values:
   *   - "hole_by_hole" ↔ "durations" (hole time mode)
   *   - "start_finish" ↔ "none" (no hole times, just start/finish)
   *
   * **User Experience:**
   * - Provides clear feedback about why certain options are disabled
   * - Uses toast notifications for immediate user awareness
   * - Maintains current mode if change is blocked
   *
   * @param {string} newMode - The new hole time mode to set ("none", "durations", "timestamps")
   *
   * @example
   * // User tries to switch from hole-by-hole to start/finish
   * handleHoleTimeModeChange("none");
   * // → Shows error toast: "Time entry method is locked to 'Hole-by-hole durations'"
   *
   * @example
   * // Successful mode change when no established method exists
   * handleHoleTimeModeChange("durations");
   * // → Sets hole time mode to durations, enables hole time inputs
   *
   * @see {@link getEstablishedTimeEntryMethod} For detection logic
   * @see {@link ScoreControlsBar} For UI implementation
   * @since 2.1.0
   */
  const handleHoleTimeModeChange = newMode => {
    if (establishedTimeEntryMethod) {
      const currentMethod = establishedTimeEntryMethod === "hole_by_hole" ? "durations" : "none";

      if (currentMethod !== newMode) {
        const establishedMethodName =
          establishedTimeEntryMethod === "hole_by_hole" ? "Hole-by-hole durations" : "Round start and finish times";

        notifyMessage(
          "warning",
          `Time entry method is locked to '${establishedMethodName}' based on existing tournament data.`,
          5000,
          "colored",
          "top-center",
        );
        return;
      }
    }

    setHoleTimeMode(newMode);
  };

  /**
   * Checks if there's unsaved hole time data (data in state but not in saved tournament data).
   * Used to determine when to show warning dialog before switching to "Round start and finish time" mode.
   *
   * @returns {boolean} True if there's unsaved hole time data for the current round
   */
  const hasUnsavedHoleTimeData = () => {
    if (!selectedRound || !holeTimes) return false;

    // Get current state data
    const hasCurrentStateData = Object.values(holeTimes).some(playerData => {
      const roundData = playerData?.[selectedRound];
      if (!roundData) return false;
      return hasRealTimeDataInRound(roundData);
    });

    // Get saved tournament data
    const hasSavedData = hasSavedHoleTimeData();

    // If there's data in current state but not in saved data, it's unsaved
    return hasCurrentStateData && !hasSavedData;
  };

  /**
   * Clears all unsaved hole time data for the current round.
   * Resets hole time state and unsaved changes flag to clean state.
   * Called when user confirms data clearing in warning dialog.
   */
  const clearUnsavedHoleTimeData = () => {
    if (!selectedRound) return;

    setHoleTimes(prevTimes => {
      const newTimes = { ...prevTimes };

      // Clear hole time data for all players for the current round
      Object.keys(newTimes).forEach(playerId => {
        if (newTimes[playerId] && newTimes[playerId][selectedRound]) {
          newTimes[playerId][selectedRound] = {};
        }
      });

      return newTimes;
    });

    // Reset unsaved changes flag since we're clearing the data
    setUnsavedChanges(false);
  };

  /**
   * Checks if a player has completed and saved their previous round before allowing entry to the current round.
   *
   * This function enforces sequential round completion by validating that a player has saved
   * complete scorecard data for Round n-1 before they can enter scores for Round n.
   * This prevents data inconsistencies and ensures proper tournament progression.
   *
   * **Validation Criteria for Previous Round:**
   * - Player must have a saved scorecard for the previous round
   * - Scorecard must contain score data for all holes in the round
   * - Start time and finish time must be present (or calculated)
   * - SGS (Speedgolf Score) must be calculated and saved
   *
   * **Round Progression Rules:**
   * - Round 1 (R1): Always allowed (no previous round)
   * - Round 2 (R2): Requires completed Round 1
   * - Round 3 (R3): Requires completed Round 2
   * - And so on...
   *
   * @param {string} playerId - The player's user ID to check
   * @param {string} currentRound - The round the player wants to enter (e.g., "R2", "R3")
   * @returns {boolean} True if the player can enter the current round, false if previous round incomplete
   *
   * @example
   * // Check if player can enter Round 2
   * const canEnterR2 = hasCompletedPreviousRound("player123", "R2");
   * if (!canEnterR2) {
   *   // Show error: "Please complete Round 1 before entering Round 2"
   * }
   *
   * @example
   * // Round 1 is always allowed
   * const canEnterR1 = hasCompletedPreviousRound("player123", "R1"); // Always returns true
   *
   * @since 2.2.0
   */
  const hasCompletedPreviousRound = (playerId, currentRound) => {
    // Round 1 is always allowed (no previous round)
    if (currentRound === "R1") {
      return true;
    }

    // Extract round number for calculating previous round index
    const currentRoundNum = parseInt(currentRound.substring(1));

    // Find the player in tournament data
    let player = null;
    let playerDivision = null;

    // Check tournament-level players first (primary structure)
    if (tournament?.players?.length > 0) {
      player = tournament.players.find(p => p.userId === playerId);
    }

    // Fallback to division-level players (legacy structure)
    if (!player && tournament?.divisions?.length > 0) {
      for (const division of tournament.divisions) {
        if (division.players?.length > 0) {
          player = division.players.find(p => p.userId === playerId);
          if (player) {
            playerDivision = division;
            break;
          }
        }
      }
    }

    if (!player || !player.scoreCards?.length) {
      return false; // No player found or no scorecards
    }

    // Find the scorecard for the previous round
    const previousRoundIndex = currentRoundNum - 2; // Convert to 0-based index

    // Determine which division to use for round lookup
    let currentDivision;
    if (selectedDivision === "All") {
      // In All Divisions view, find the player's actual division
      // Players are stored at tournament level, so use their division field
      if (player) {
        currentDivision = tournament.divisions?.find(d => d._id === player.division);
      }

      // Fallback: if player division not found via ID, try the search result
      if (!currentDivision) {
        currentDivision =
          playerDivision || tournament.divisions?.find(d => d.players?.some(p => p.userId === playerId));
      }
    } else {
      // In individual division view, use the selected division
      currentDivision = tournament.divisions?.find(d => d.name === selectedDivision);
    }

    const previousRoundObj = currentDivision?.rounds?.[previousRoundIndex];

    if (!previousRoundObj) {
      return false; // Previous round doesn't exist
    }

    const previousScoreCard = player.scoreCards.find(sc => sc.roundId === previousRoundObj._id);

    if (!previousScoreCard) {
      return false; // No scorecard for previous round
    }

    // Validate that the previous round scorecard is complete
    const hasScores = previousScoreCard.scores?.length > 0;
    const hasStartTime = previousScoreCard.startTime || previousScoreCard.roundStartTime;
    const hasFinishTime = previousScoreCard.finishTime || previousScoreCard.roundFinishTime;
    // SGS can be calculated from total + time, so it's not strictly required if we have the components
    const hasSGS = previousScoreCard.sgs != null && previousScoreCard.sgs !== "";
    // Check for both 'total' and 'totalScore' field names
    const hasTotal =
      (previousScoreCard.total != null && previousScoreCard.total > 0) ||
      (previousScoreCard.totalScore != null && previousScoreCard.totalScore > 0);

    // For speedgolf, we need either explicit SGS or the components to calculate it (total + time)
    const canCalculateSGS = hasTotal && hasStartTime && hasFinishTime;
    const hasValidSGS = hasSGS || canCalculateSGS;

    // All criteria must be met for the previous round to be considered complete
    return hasScores && hasStartTime && hasFinishTime && hasValidSGS && hasTotal;
  };

  /**
   * Finds a division by its ID from the tournament data.
   *
   * @param {string} divisionId - The division ID to search for
   * @returns {Object|null} The division object or null if not found
   */
  const findDivisionById = useCallback(
    divisionId => {
      if (!tournament || !tournament.divisions) return null;
      return tournament.divisions.find(d => d._id === divisionId);
    },
    [tournament],
  );

  // Identify the course Id inside the current round that is displayed
  const selectedRoundObject = tournament?.divisions
    ?.find(d => d._id === selectedDivision || d.name === selectedDivision)
    ?.rounds?.find((elem, index) => {
      return selectedRound === `R${index + 1}`;
    });

  // Get Redux course data
  const reduxCourseData = useSelector(state => {
    const selectedCourseId = selectedRoundObject?.courseId;
    const selectedCourse = state.courses.filter(course => course.id === selectedCourseId);
    if (selectedCourse.length > 0) {
      return selectedCourse[0];
    }
    return undefined;
  });

  // Get all courses from Redux for "All Divisions" view
  const allReduxCourses = useSelector(state => state.courses || []);

  // Use fullCoursesData if available (from leaderboard), otherwise fallback to Redux state
  const courseData = (() => {
    const selectedCourseId = selectedRoundObject?.courseId;

    // First try to use fullCoursesData (passed from leaderboard)
    if (fullCoursesData && selectedCourseId && fullCoursesData[selectedCourseId]) {
      return fullCoursesData[selectedCourseId];
    }

    // Fallback to Redux state
    if (reduxCourseData) {
      return reduxCourseData;
    }

    return undefined;
  })();

  // Handle both array and object formats for tees (same fix as in leaderboard)
  let teesArray = null;
  if (Array.isArray(courseData?.tees)) {
    teesArray = courseData.tees;
  } else if (courseData?.tees && typeof courseData.tees === "object") {
    // Convert object to array if needed
    teesArray = Object.values(courseData.tees);
  }

  let teeData = teesArray?.filter(tee => {
    return tee.id === selectedRoundObject?.teeId || tee._id === selectedRoundObject?.teeId;
  });
  if (teeData && Array.isArray(teeData)) {
    teeData = teeData[0];
  }

  let divisionGender = tournament?.divisions?.find(
    d => d._id === selectedDivision || d.name === selectedDivision,
  )?.gender;
  if (divisionGender === "Male" || divisionGender === "All") divisionGender = "mens";
  else if (divisionGender === "Female") divisionGender = "womens";
  else divisionGender = null;

  useEffect(() => {
    if (!tournaments?.length) {
      dispatch(fetchAllCompetitions());
    } else {
      setIsLoading(false);
    }
  }, [dispatch, tournaments]);

  useEffect(() => {
    if (tournament && selectedDivision) {
      const division = tournament.divisions.find(d => d._id === selectedDivision || d.name === selectedDivision);
      if (division && division.rounds && division.rounds.length > 0) {
        const roundIndex = parseInt(selectedRound.slice(1)) - 1;
        if (roundIndex >= division.rounds.length) {
          setSelectedRound("R1");
        }
      }
    }
  }, [tournament, selectedDivision, selectedRound]);

  useEffect(() => {
    const foundTournament = tournaments?.find(t => t._id === competitionId);
    setTournament(foundTournament);
    if (foundTournament) {
      const courseIds = foundTournament.courses.map(course => course.courseId);
      dispatch(fetchCourseByIds(courseIds, navigate));
    }
  }, [tournaments, competitionId]);

  // Set initial division selection and preserve current selection after tournament data updates
  useEffect(() => {
    if (tournament?.divisions?.length > 0) {
      // Check if currently selected division still exists (including "All")
      const divisionExists = selectedDivision === "All" || tournament.divisions.some(d => d.name === selectedDivision);

      // Only set division if no division is selected or if current selection no longer exists
      // This prevents resetting to first division after save operations that refresh tournament data
      if (!selectedDivision || !divisionExists) {
        // If viewing a specific player, set the division to that player's division
        if (playerId && tournament.players) {
          const player = tournament.players.find(p => p.userId === playerId);
          if (player) {
            const playerDivision = findDivisionById(player.division);
            if (playerDivision) {
              setSelectedDivision(playerDivision.name);
              return;
            }
          }
        }
        // Otherwise, default to "All" divisions
        setSelectedDivision("All");
      }
    }
  }, [tournament, playerId, selectedDivision, findDivisionById]);

  useEffect(() => {
    if (tournament && tournament.players) {
      const newScores = {};
      const newHoleTimes = {};
      const newStartTimes = {};
      const newFinishTimes = {};
      const newSavedStatus = {};

      tournament.players.forEach(player => {
        if (player.scoreCards && player.scoreCards.length > 0) {
          newScores[player.userId] = {};
          newHoleTimes[player.userId] = {};
          newStartTimes[player.userId] = {};
          newFinishTimes[player.userId] = {};
          newSavedStatus[player.userId] = {};

          player.scoreCards.forEach(scoreCard => {
            let roundNumber = "R1";

            const division = findDivisionById(player.division);
            if (division && division.rounds) {
              const roundIndex = division.rounds.findIndex(r => r._id === scoreCard.roundId);
              if (roundIndex !== -1) {
                roundNumber = `R${roundIndex + 1}`;
              }
            }

            newScores[player.userId][roundNumber] = {};
            newHoleTimes[player.userId][roundNumber] = {};
            newStartTimes[player.userId][roundNumber] = scoreCard.startTime || "--:--";
            newFinishTimes[player.userId][roundNumber] = scoreCard.finishTime || "--:--";
            newSavedStatus[player.userId][roundNumber] = true;

            if (scoreCard.scores && scoreCard.scores.length > 0) {
              scoreCard.scores.forEach(score => {
                newScores[player.userId][roundNumber][score.hole] = score.strokes;
                if (score.holeTime) {
                  newHoleTimes[player.userId][roundNumber][score.hole] = score.holeTime;
                }
              });
            }
          });
        }
      });

      setScores(prevScores => ({ ...prevScores, ...newScores }));
      setHoleTimes(prevTimes => ({ ...prevTimes, ...newHoleTimes }));
      setStartTimes(prevTimes => ({ ...prevTimes, ...newStartTimes }));
      setFinishTimes(prevTimes => ({ ...prevTimes, ...newFinishTimes }));
      setSavedPlayers(prevSaved => ({ ...prevSaved, ...newSavedStatus }));
    }
  }, [tournament]);

  useEffect(() => {
    const handleBeforeUnload = e => {
      if (unsavedChanges) {
        e.preventDefault();
        e.returnValue = "";
        return "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [unsavedChanges]);

  useEffect(() => {
    if (tournament && selectedDivision) {
      const division = tournament.divisions.find(d => d._id === selectedDivision || d.name === selectedDivision);
      if (division && division.rounds) {
        const courses = {};
        division.rounds.forEach((round, index) => {
          const roundKey = `R${index + 1}`;
          const courseInfo = getCourseForRound(round._id);
          courses[roundKey] = courseInfo || "Unknown Course";
        });
        setCoursesInfo(courses);
      }
    }
  }, [tournament, selectedDivision]);

  // Auto-set hole time mode when existing data is detected
  useEffect(() => {
    if (!selectedRound || !holeTimes || holeTimeMode !== "none") return;

    // Check if any player has hole time data for the current round
    const hasData = Object.values(holeTimes).some(playerData => {
      const roundData = playerData?.[selectedRound];
      if (!roundData) return false;

      // Check if any hole has meaningful time data
      return hasRealTimeDataInRound(roundData);
    });

    if (hasData) {
      setHoleTimeMode("durations");
    }
  }, [holeTimes, selectedRound, holeTimeMode]);

  /**
   * Detects and enforces the established time entry method for the tournament.
   *
   * This effect runs when tournament data changes and automatically sets the appropriate
   * time entry mode based on existing scorecard data. It ensures UI consistency by
   * locking to the detected method without requiring explicit user configuration.
   */
  useEffect(() => {
    if (!tournament) {
      return;
    }

    const method = getEstablishedTimeEntryMethod();
    setEstablishedTimeEntryMethod(method);

    if (method) {
      const mode = method === "hole_by_hole" ? "durations" : "none";
      setHoleTimeMode(mode);
    }
  }, [tournament, getEstablishedTimeEntryMethod]);

  /**
   * Retrieves the par value for a specific hole from course/tee data.
   *
   * @param {number} holeNum - The hole number (1-18)
   * @param {Object} currentRound - The current round object
   * @returns {number} The par value for the hole, defaults to 4 if not found
   */
  const getHolePar = (holeNum, currentRound) => {
    // Get actual par from course/tee data instead of hardcoded values
    const holePar =
      teeData?.holes?.[holeNum - 1]?.[`${divisionGender}StrokePar`] ||
      teeData?.holes?.[holeNum - 1]?.strokePar ||
      teeData?.holes?.[holeNum - 1]?.par ||
      4; // fallback to 4 if no data available
    return holePar;
  };

  /**
   * Determines the CSS class for a score cell based on strokes relative to par.
   *
   * @param {number} strokePar - The par value for the hole
   * @param {number|string} strokes - The player's strokes for the hole
   * @param {number} holeNum - The hole number (used for background color)
   * @returns {string} CSS class name for styling the score cell
   */
  const getScoreClass = (strokePar, strokes, holeNum) => {
    if (!strokes) {
      return "stroke-input";
    }

    const strokesToPar = parseInt(strokes) - parseInt(strokePar);

    if (strokesToPar === -1)
      return "stroke-input circle"; // Birdie
    else if (strokesToPar === 1)
      return "stroke-input square"; // Bogey
    else if (strokesToPar === 0) {
      let cellBgColor = "cell-bg-white";
      // if (holeNum <= 9) {
      //   cellBgColor = isEven ? "cell-bg-white" : "cell-bg-gray";
      // } else {
      //   cellBgColor = isEven ? "cell-bg-gray" : "cell-bg-white";
      // }
      return `stroke-input no-border ${cellBgColor}`;
    } else if (strokesToPar === 2)
      return "stroke-input solid-square"; // Double Bogey
    else if (strokesToPar === -2)
      return "stroke-input solid-circle"; // Eagle
    else if (strokesToPar <= -3)
      return "stroke-input solid-circle"; // Albatross (Triple Circle)
    else if (strokesToPar > 2) return "stroke-input solid-square"; // Higher than Double Bogey

    return "stroke-input normal";
  };

  /**
   * Generates an array of hole numbers based on the round configuration.
   *
   * @param {string} numHoles - The number of holes configuration ("18", "Front 9", "Back 9")
   * @returns {number[]} Array of hole numbers to display
   */
  const getHoleNumbers = numHoles => {
    if (!numHoles) return Array.from({ length: 18 }, (_, i) => i + 1);

    switch (numHoles) {
      case "18":
        return Array.from({ length: 18 }, (_, i) => i + 1);
      case "Front 9":
        return Array.from({ length: 9 }, (_, i) => i + 1);
      case "Back 9":
        return Array.from({ length: 9 }, (_, i) => i + 10);
      default:
        return Array.from({ length: 18 }, (_, i) => i + 1);
    }
  };

  /**
   * Retrieves a player's start time for a specific round.
   *
   * @param {Object} player - The player object containing userId
   * @param {string} roundDate - The date of the round
   * @returns {string} The player's start time in HH:MM AM/PM format or "--:--" if not found
   */
  const getPlayerStartTime = (player, roundDate) => {
    if (player?.userId && selectedRound && startTimes[player.userId]?.[selectedRound]) {
      return startTimes[player.userId][selectedRound];
    }

    if (!player || !roundDate || !tournament?.teeSheet?.playerAssignments) {
      return "--:--";
    }

    const playerAssignment = tournament.teeSheet.playerAssignments.find(pa => pa.playerId === player.userId);

    if (!playerAssignment) {
      return "--:--";
    }

    if (!playerAssignment.roundAssignments?.length) {
      return "--:--";
    }

    const formatDate = dateString => {
      if (!dateString) return "";
      return new Date(dateString).toISOString().split("T")[0];
    };

    const targetDate = formatDate(roundDate);
    const roundAssignment = playerAssignment.roundAssignments.find(ra => formatDate(ra.date) === targetDate);

    if (!roundAssignment) {
      return "--:--";
    }

    return roundAssignment.teeTime;
  };

  /**
   * Handles changes to a player's start time for a round.
   *
   * @param {string} playerId - The player's user ID
   * @param {string} roundNum - The round number (e.g., "R1")
   * @param {string} time - The new start time in 24-hour format
   */
  const handleStartTimeChange = (playerId, roundNum, time) => {
    const formattedTime = formatToAMPM(time);
    const currentTime = startTimes[playerId]?.[roundNum] || "--:--";
    const isTimeChanging = currentTime !== formattedTime;

    setStartTimes(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [roundNum]: formattedTime,
      },
    }));

    // Auto-update finish time when hole times are being used
    if (showHoleTimes) {
      const playerHoleTimes = holeTimes[playerId]?.[roundNum] || {};
      const calculatedFinishTime = calculateFinishTimeFromHoleTimes(formattedTime, playerHoleTimes);

      if (calculatedFinishTime !== "--:--") {
        setFinishTimes(prev => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            [roundNum]: calculatedFinishTime,
          },
        }));
      }
    }

    if (isTimeChanging) {
      setUnsavedChanges(true);
      setSavedPlayers(prev => ({
        ...prev,
        [playerId]: {
          ...(prev[playerId] || {}),
          [roundNum]: false,
        },
      }));
    }
  };

  /**
   * Handles score changes for a specific hole.
   *
   * @param {string} playerId - The player's user ID
   * @param {string} roundNum - The round number (e.g., "R1")
   * @param {number} hole - The hole number
   * @param {string} value - The new score value
   */
  const handleScoreChange = (playerId, roundNum, hole, value) => {
    // Handle empty value - store as empty string
    if (value === "" || value == null) {
      const currentValue = scores[playerId]?.[roundNum]?.[hole];
      const isValueChanging = currentValue !== "";

      setScores(prev => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          [roundNum]: {
            ...(prev[playerId]?.[roundNum] || {}),
            [hole]: "",
          },
        },
      }));

      if (isValueChanging) {
        setUnsavedChanges(true);
        setSavedPlayers(prev => ({
          ...prev,
          [playerId]: {
            ...(prev[playerId] || {}),
            [roundNum]: false,
          },
        }));
      }
      return;
    }

    // Parse and validate the numeric value
    const parsedValue = parseInt(value);
    if (isNaN(parsedValue) || parsedValue < 1 || parsedValue > 99) {
      // Invalid value - ignore the change
      return;
    }

    const validValue = parsedValue;
    const currentValue = scores[playerId]?.[roundNum]?.[hole];
    const isValueChanging = currentValue !== validValue;

    setScores(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [roundNum]: {
          ...(prev[playerId]?.[roundNum] || {}),
          [hole]: validValue,
        },
      },
    }));

    if (isValueChanging) {
      setUnsavedChanges(true);
      setSavedPlayers(prev => ({
        ...prev,
        [playerId]: {
          ...(prev[playerId] || {}),
          [roundNum]: false,
        },
      }));
    }
  };

  /**
   * Validates that the sum of hole times matches the total elapsed time.
   *
   * @param {Object} playerRoundTimes - Object containing hole times for each hole
   * @param {string} startTime - The round start time
   * @param {string} finishTime - The round finish time
   * @returns {boolean} True if hole times are valid or no hole times exist
   */
  const validateHoleTimes = (playerRoundTimes, startTime, finishTime) => {
    if (!playerRoundTimes || Object.keys(playerRoundTimes).length === 0) {
      return true;
    }

    const totalElapsedSeconds = calculateTotalTimeInSeconds(startTime, finishTime);
    if (totalElapsedSeconds <= 0) {
      return false;
    }

    const holeTimeSum = Object.values(playerRoundTimes).reduce((sum, time) => {
      if (!time) return sum;

      const parts = time.split(":").map(Number);

      if (holeTimeMode === "durations") {
        // MM:SS format for durations
        if (parts.length === 2) {
          const [minutes, seconds] = parts;
          return sum + (minutes * 60 + seconds);
        } else if (parts.length === 3) {
          // Handle legacy HH:MM:SS format that might still be in state
          const [hours, minutes, seconds] = parts;
          return sum + (hours * 3600 + minutes * 60 + seconds);
        }
      } else {
        // HH:MM:SS format for timestamps
        if (parts.length === 3) {
          const [hours, minutes, seconds] = parts;
          return sum + (hours * 3600 + minutes * 60 + seconds);
        }
      }

      return sum;
    }, 0);

    return Math.abs(holeTimeSum - totalElapsedSeconds) === 0;
  };

  /**
   * Calculates the total elapsed time in seconds between start and finish times.
   *
   * @param {string} startTime - The start time in HH:MM AM/PM format
   * @param {string} finishTime - The finish time in HH:MM AM/PM format
   * @returns {number} Total elapsed time in seconds, or 0 if invalid times
   */
  const calculateTotalTimeInSeconds = (startTime, finishTime) => {
    if (!startTime || !finishTime || startTime === "--:--" || finishTime === "--:--") {
      return 0;
    }

    const convertToSeconds = time => {
      let [timePart, period] = time.split(" ");
      let [hours, minutes, seconds] = timePart.split(":").map(Number);
      seconds = seconds || 0;

      if (period === "PM" && hours !== 12) {
        hours += 12;
      } else if (period === "AM" && hours === 12) {
        hours = 0;
      }

      return hours * 3600 + minutes * 60 + seconds;
    };

    let startSeconds = convertToSeconds(startTime);
    let finishSeconds = convertToSeconds(finishTime);
    if (startTime.includes("PM") && finishTime.includes("AM")) {
      finishSeconds += 86400;
    }

    return finishSeconds - startSeconds;
  };

  /**
   * Saves tournament scores for a specific player and round.
   *
   * Handles both single division mode and "All" division mode:
   * - Single division: Finds division by selectedDivision name
   * - "All" division: Finds the player's actual division by looking up their division reference
   *
   * Also handles both time entry modes:
   * - Hole time mode: Calculates finish time from hole times automatically
   * - Start/finish mode: Uses manually entered start and finish times
   *
   * @param {Object} player - The player object containing userId and playerName
   * @returns {Promise<void>} Promise that resolves when save operation completes
   *
   * @since Fixed to properly find player's division when selectedDivision is "All"
   * @since Fixed to handle hole time mode finish time calculation correctly
   */
  /**
   * Converts duration time from HH:MM:SS format to MM:SS format for saving.
   * This ensures durations are saved in the new MM:SS format while timestamps
   * remain in HH:MM:SS format.
   *
   * @param {string} timeString - Time string in HH:MM:SS format
   * @returns {string} Time string in MM:SS format or original if not a duration
   */
  const convertDurationForSaving = useCallback(timeString => {
    if (!timeString || typeof timeString !== "string") return timeString;

    // Only convert if it's in HH:MM:SS format and the hour is 00
    const parts = timeString.split(":");
    if (parts.length === 3 && parts[0] === "00") {
      // Convert 00:MM:SS to MM:SS
      return `${parts[1]}:${parts[2]}`;
    }

    // Return as-is for timestamps or already converted durations
    return timeString;
  }, []);

  const handleSaveScores = async player => {
    try {
      await protectedSubmit(async () => {
        await saveScoresInternal(player);
      });
    } catch (error) {
      notifyMessage("error", error.message, 8000, "colored", "top-center");
    }
  };

  const saveScoresInternal = async player => {
    // Find the correct division for this player
    let currentDivision;

    if (selectedDivision === "All") {
      // In "All" division mode, find the player's actual division
      // FIX: Use tournament.players to find player, then get their division
      // (previously tried to find division named "All" which doesn't exist)
      const tournamentPlayer = tournament.players?.find(p => p.userId === player.userId);
      if (tournamentPlayer) {
        currentDivision = findDivisionById(tournamentPlayer.division);
      }
    } else {
      // In single division mode, find division by name
      currentDivision = tournament.divisions?.find(d => d.name === selectedDivision);
    }

    if (!currentDivision) {
      notifyMessage("error", "Division not found", 5000, "colored", "top-center");
      return;
    }

    const roundIndex = parseInt(selectedRound.replace("R", "")) - 1;
    if (!currentDivision?.rounds || roundIndex < 0 || roundIndex >= currentDivision.rounds.length) {
      notifyMessage("error", "Invalid round selection", 5000, "colored", "top-center");
      return;
    }

    const selectedRoundObj = currentDivision.rounds[roundIndex];
    const roundId = selectedRoundObj._id;
    const roundScores = scores[player.userId]?.[selectedRound] || {};
    const roundHoleTimes = holeTimes[player.userId]?.[selectedRound] || {};
    const startTime = startTimes[player.userId]?.[selectedRound] || getPlayerStartTime(player, selectedRoundObj.date);

    // Calculate finish time based on the current mode
    let finishTime;
    if (showHoleTimes) {
      // In hole time mode, calculate finish time from hole times
      finishTime = calculateFinishTimeFromHoleTimes(startTime, roundHoleTimes);
    } else {
      // In start/finish time mode, use the stored finish time
      finishTime = finishTimes[player.userId]?.[selectedRound] || "--:--";
    }

    const isFullRound = selectedRoundObj.numHoles === "18" || !selectedRoundObj.numHoles;
    const isFrontNine = selectedRoundObj.numHoles === "Front 9";
    const isBackNine = selectedRoundObj.numHoles === "Back 9";

    let out = 0;
    let inScore = 0;
    let total = 0;

    if (isFullRound) {
      out = calcOutStrokes(roundScores);
      inScore = calcInStrokes(roundScores);
      total = out + inScore;
    } else if (isFrontNine) {
      out = calcOutStrokes(roundScores);
      total = out;
    } else if (isBackNine) {
      inScore = calcInStrokes(roundScores);
      total = inScore;
    }

    const elapsedTime = calculateTimeFromFinishAndStart(startTime, finishTime);

    // Validate that we have valid times before calculating SGS
    if (startTime === "--:--" || finishTime === "--:--") {
      if (showHoleTimes) {
        notifyMessage(
          "error",
          "Please ensure all hole times are filled and start time is set",
          5000,
          "colored",
          "top-center",
        );
      } else {
        notifyMessage("error", "Please set both start time and finish time", 5000, "colored", "top-center");
      }
      return;
    }

    let sgs = calculateSGS(total, elapsedTime);
    if (sgs === "--:--") {
      notifyMessage(
        "error",
        "Invalid time calculations - please check start and finish times",
        5000,
        "colored",
        "top-center",
      );
      return;
    }

    // Check if this player has meaningful hole time data
    const hasRealHoleTimeData = hasRealTimeDataInRound(roundHoleTimes);

    if (hasRealHoleTimeData) {
      const isValid = validateHoleTimes(roundHoleTimes, startTime, finishTime);
      if (!isValid) {
        notifyMessage(
          "error",
          "The sum of hole times doesn't match the total round time. Cannot save until times are corrected.",
          5000,
          "colored",
          "top-center",
        );
        return;
      }
    }

    const scoreObjectsWithTime = Object.entries(roundScores).map(([hole, strokes]) => {
      let holeTime = roundHoleTimes[hole] || null;

      // Convert duration format for saving when in durations mode
      if (holeTime && holeTimeMode === "durations") {
        holeTime = convertDurationForSaving(holeTime);
      }

      return {
        hole: Number(hole),
        strokes: Number(strokes),
        holeTime: holeTime,
      };
    });

    try {
      const success = await dispatch(
        saveTournamentScores(
          competitionId,
          player.userId,
          roundId,
          scoreObjectsWithTime,
          out,
          inScore,
          total,
          startTime,
          finishTime,
          elapsedTime,
          sgs,
        ),
      );

      if (success) {
        setUnsavedChanges(false);
        setSavedPlayers(prev => ({
          ...prev,
          [player.userId]: {
            ...(prev[player.userId] || {}),
            [selectedRound]: true,
          },
        }));

        // Refresh tournament data to ensure subsequent saves have the latest server state
        await dispatch(fetchAllCompetitions());
      }
    } catch (error) {
      notifyMessage("error", `Failed to save scores: ${error.message}`, 5000, "colored", "top-center");
    }
  };

  /**
   * Handles changes to hole times for a specific player and hole.
   *
   * @param {string} playerId - The player's user ID
   * @param {string} roundNum - The round number (e.g., "R1")
   * @param {number} hole - The hole number
   * @param {string} time - The new hole time (MM:SS for durations, HH:MM:SS for timestamps)
   */
  const handleHoleTimeChange = (playerId, roundNum, hole, time) => {
    // Handle empty values - clear the time data
    if (!time || time.trim() === "") {
      const currentTime = holeTimes[playerId]?.[roundNum]?.[hole] || "";
      const isTimeChanging = currentTime !== "";

      setHoleTimes(prev => ({
        ...prev,
        [playerId]: {
          ...prev[playerId],
          [roundNum]: {
            ...(prev[playerId]?.[roundNum] || {}),
            [hole]: "", // Set to empty string to clear
          },
        },
      }));

      if (isTimeChanging) {
        setUnsavedChanges(true);
        setSavedPlayers(prev => ({
          ...prev,
          [playerId]: {
            ...(prev[playerId] || {}),
            [roundNum]: false,
          },
        }));
      }
      return;
    }

    // Format time based on the current hole time mode
    let formattedTime = time;
    const parts = time.split(":");

    if (holeTimeMode === "durations") {
      // For durations, accept both MM:SS and HH:MM:SS formats, but store as MM:SS
      if (parts.length === 2) {
        // MM:SS format - pad with zeros
        formattedTime = parts.map(part => part.padStart(2, "0")).join(":");
      } else if (parts.length === 3) {
        // HH:MM:SS format - convert to MM:SS if hours are 00
        const [hours, minutes, seconds] = parts.map(part => part.padStart(2, "0"));
        if (hours === "00") {
          formattedTime = `${minutes}:${seconds}`;
        } else {
          // Keep as HH:MM:SS if hours are not 00
          formattedTime = `${hours}:${minutes}:${seconds}`;
        }
      }
    } else {
      // For timestamps, ensure HH:MM:SS format
      if (parts.length === 3) {
        formattedTime = parts.map(part => part.padStart(2, "0")).join(":");
      } else if (parts.length === 2) {
        // Convert MM:SS to HH:MM:SS by assuming 00 hours
        const [minutes, seconds] = parts.map(part => part.padStart(2, "0"));
        formattedTime = `00:${minutes}:${seconds}`;
      }
    }

    const currentTime = holeTimes[playerId]?.[roundNum]?.[hole] || "";
    const isTimeChanging = currentTime !== formattedTime;

    setHoleTimes(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [roundNum]: {
          ...(prev[playerId]?.[roundNum] || {}),
          [hole]: formattedTime,
        },
      },
    }));

    // Auto-update finish time when hole times are being used
    if (showHoleTimes) {
      const updatedHoleTimes = {
        ...(holeTimes[playerId]?.[roundNum] || {}),
        [hole]: formattedTime,
      };
      const playerStartTime =
        startTimes[playerId]?.[roundNum] || getPlayerStartTime({ userId: playerId }, currentRound?.date);
      const calculatedFinishTime = calculateFinishTimeFromHoleTimes(playerStartTime, updatedHoleTimes);

      if (calculatedFinishTime !== "--:--") {
        setFinishTimes(prev => ({
          ...prev,
          [playerId]: {
            ...prev[playerId],
            [roundNum]: calculatedFinishTime,
          },
        }));
      }
    }

    if (isTimeChanging) {
      setUnsavedChanges(true);
      setSavedPlayers(prev => ({
        ...prev,
        [playerId]: {
          ...(prev[playerId] || {}),
          [roundNum]: false,
        },
      }));
    }
  };

  /**
   * Handles changes to a player's finish time for a round.
   *
   * @param {string} playerId - The player's user ID
   * @param {string} roundNum - The round number (e.g., "R1")
   * @param {string} time - The new finish time in 24-hour format
   */
  const handleFinishTimeChange = (playerId, roundNum, time) => {
    const formattedTime = formatToAMPM(time);
    const currentTime = finishTimes[playerId]?.[roundNum] || "--:--";
    const isTimeChanging = currentTime !== formattedTime;

    setFinishTimes(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [roundNum]: formattedTime,
      },
    }));

    if (isTimeChanging) {
      setUnsavedChanges(true);
      setSavedPlayers(prev => ({
        ...prev,
        [playerId]: {
          ...(prev[playerId] || {}),
          [roundNum]: false,
        },
      }));
    }
  };

  /**
   * Calculates the finish time based on start time and total hole times.
   *
   * @param {string} startTime - The start time in HH:MM AM/PM format
   * @param {Object} playerHoleTimes - Object containing hole times for each hole
   * @returns {string} The calculated finish time in HH:MM AM/PM format or "--:--" if invalid
   */
  const calculateFinishTimeFromHoleTimes = (startTime, playerHoleTimes) => {
    if (!startTime || startTime === "--:--") return "--:--";
    const totalHoleTimeSeconds = calcTotalTime(playerHoleTimes, isFrontNine, isBackNine);
    if (totalHoleTimeSeconds === 0) return "--:--";

    try {
      // Convert start time to 24-hour format for calculation
      const startTime24 = convertTo24Hour(startTime);
      const [startHours, startMinutes, startSeconds = 0] = startTime24.split(":").map(Number);

      // Convert start time to total seconds
      const startTimeInSeconds = startHours * 3600 + startMinutes * 60 + startSeconds;

      // Add hole time to start time
      const finishTimeInSeconds = startTimeInSeconds + totalHoleTimeSeconds;

      // Convert back to hours, minutes, seconds
      const finishHours = Math.floor(finishTimeInSeconds / 3600) % 24;
      const finishMinutes = Math.floor((finishTimeInSeconds % 3600) / 60);
      const finishSecondsRemainder = finishTimeInSeconds % 60;

      // Format as time string with seconds and convert back to AM/PM
      const finishTime24 = `${String(finishHours).padStart(2, "0")}:${String(finishMinutes).padStart(2, "0")}:${String(finishSecondsRemainder).padStart(2, "0")}`;
      return formatToAMPM(finishTime24);
    } catch (error) {
      console.error("Error calculating finish time:", error);
      return "--:--";
    }
  };

  if (isLoading) return <div>Loading...</div>;
  const getThemeColors = () => {
    if (!tournament || !tournament.colorTheme) {
      return {
        titleText: "#64DDB5",
        headerRowBg: "#CC8F91",
        headerRowTxt: "#6FA5D8",
        updateBtnBg: "#C5CE50",
        updateBtnTxt: "#71A3E5",
        tournNameBannerBg: "#13294E",
        tournNameBannerTxt: "#64DDB5",
        strParColBg: "#13294E",
        strParColTxt: "#FFFFFF",
        timeParColBg: "#13294E",
        timeParColTxt: "#FFFFFF",
        sgParColBg: "#000000",
        sgParColTxt: "#FFFFFF",
      };
    }

    return {
      titleText: tournament.colorTheme.titleText || "#64DDB5",
      headerRowBg: tournament.colorTheme.headerRowBg || "#CC8F91",
      headerRowTxt: tournament.colorTheme.headerRowTxt || "#6FA5D8",
      updateBtnBg: tournament.colorTheme.updateBtnBg || "#C5CE50",
      updateBtnTxt: tournament.colorTheme.updateBtnTxt || "#71A3E5",
      tournNameBannerBg: tournament.colorTheme.tournNameBannerBg || "#13294E",
      tournNameBannerTxt: tournament.colorTheme.tournNameBannerTxt || "#64DDB5",
      strParColBg: tournament.colorTheme.strParColBg || "#13294E",
      strParColTxt: tournament.colorTheme.strParColTxt || "#FFFFFF",
      timeParColBg: tournament.colorTheme.timeParColBg || "#13294E",
      timeParColTxt: tournament.colorTheme.timeParColTxt || "#FFFFFF",
      sgParColBg: tournament.colorTheme.sgParColBg || "#000000",
      sgParColTxt: tournament.colorTheme.sgParColTxt || "#FFFFFF",
    };
  };

  if (!tournament) return <div>Tournament not found</div>;

  const themeColors = getThemeColors();
  const currentDivision = tournament.divisions?.find(d => d.name === selectedDivision);
  const roundIndex = selectedRound ? parseInt(selectedRound.slice(1)) - 1 : 0;
  const currentRound =
    currentDivision?.rounds && roundIndex >= 0 && roundIndex < currentDivision.rounds.length
      ? currentDivision.rounds[roundIndex]
      : null;
  const roundDate = currentRound?.date;

  let divisionPlayers =
    tournament.players?.filter(p => {
      const playerDivision = findDivisionById(p.division);
      return playerDivision?.name === selectedDivision && p.status !== "withdrawn";
    }) || [];

  if (finalResults) {
    divisionPlayers = divisionPlayers.filter(p => {
      if (p.userId && playerId) {
        return p.userId === playerId;
      }
      return true;
    });
  }

  // Apply search filter
  divisionPlayers = filterPlayersBySearch(divisionPlayers);

  const sortedDivisionPlayers = [...divisionPlayers].sort((playerA, playerB) => {
    const startTimeA = getPlayerStartTime(playerA, roundDate);
    const startTimeB = getPlayerStartTime(playerB, roundDate);

    if (startTimeA === "--:--" && startTimeB === "--:--") return 0;
    if (startTimeA === "--:--") return 1;
    if (startTimeB === "--:--") return -1;

    const convertToSeconds = time => {
      let [timePart, period] = time.split(" ");
      let [hours, minutes, seconds] = timePart.split(":").map(Number);
      seconds = seconds || 0;

      if (period === "PM" && hours !== 12) {
        hours += 12;
      } else if (period === "AM" && hours === 12) {
        hours = 0;
      }

      return hours * 3600 + minutes * 60 + seconds;
    };

    const secondsA = convertToSeconds(startTimeA);
    const secondsB = convertToSeconds(startTimeB);

    return secondsA - secondsB;
  });

  const holes = getHoleNumbers(currentRound?.numHoles);

  const isFullRound = currentRound?.numHoles === "18" || !currentRound?.numHoles;
  const isFrontNine = currentRound?.numHoles === "Front 9";
  const isBackNine = currentRound?.numHoles === "Back 9";

  // OUT/IN columns are only shown for full rounds to maintain proper accumulator pattern
  const showOutColumn = isFullRound;
  const showInColumn = isFullRound;
  /**
   * Determines if the save button should be enabled for a player's round.
   *
   * This function validates that all required data is complete AND that the player
   * has completed their previous round (sequential completion constraint).
   *
   * The function handles both single division mode and "All" division mode:
   * - Single division: Uses global holes and currentRound data
   * - "All" division: Finds the player's specific division and uses division-specific
   *   hole configuration and round data for validation
   *
   * Validation requirements vary based on hole times setting:
   * - With hole times: All holes must have scores + valid hole times (HH:MM:SS) + valid start time
   * - Without hole times: All holes must have scores + valid start/finish times
   *
   * @param {string} playerId - The player's user ID to validate
   * @returns {boolean} True if all required data is complete and valid, and previous round is complete
   *
   * @example
   * // Enable save for a player with complete data
   * const canSave = isSaveEnabled("user123"); // Returns true if all validation passes
   *
   * @since Fixed in tournament score entry - now properly finds players in tournament.players
   *        instead of incorrectly looking in tournament.divisions[].players
   */
  const isSaveEnabled = playerId => {
    // First check if player can enter this round (sequential completion constraint)
    const canEnterCurrentRound = hasCompletedPreviousRound(playerId, selectedRound);
    if (!canEnterCurrentRound) {
      return false; // Cannot save if previous round not completed
    }

    // Get the correct holes for this player's division
    let playerHoles = holes; // Default to global holes for single division mode

    if (selectedDivision === "All") {
      // In "All" division mode, we need to find the player's division and get its holes
      // FIX: Use tournament.players (where players are actually stored) instead of
      // tournament.divisions[].players (which doesn't exist in the data structure)
      const player = tournament.players?.find(p => p.userId === playerId);

      if (player) {
        const playerDivision = findDivisionById(player.division);
        if (playerDivision) {
          const playerRoundIndex = selectedRound ? parseInt(selectedRound.slice(1)) - 1 : 0;
          const playerCurrentRound = playerDivision.rounds?.[playerRoundIndex];
          if (playerCurrentRound) {
            playerHoles = getHoleNumbers(playerCurrentRound.numHoles);
          }
        }
      }
    }

    // Get the correct round date for this player's division
    let playerRoundDate = currentRound?.date; // Default for single division mode

    if (selectedDivision === "All") {
      // In "All" division mode, get the round date from the player's division
      // FIX: Use tournament.players (consistent with data structure) for player lookup
      const player = tournament.players?.find(p => p.userId === playerId);

      if (player) {
        const playerDivision = findDivisionById(player.division);
        if (playerDivision) {
          const playerRoundIndex = selectedRound ? parseInt(selectedRound.slice(1)) - 1 : 0;
          const playerCurrentRound = playerDivision.rounds?.[playerRoundIndex];
          if (playerCurrentRound) {
            playerRoundDate = playerCurrentRound.date;
          }
        }
      }
    }

    const roundScores = scores[playerId]?.[selectedRound] || {};
    const roundHoleTimes = holeTimes[playerId]?.[selectedRound] || {};
    const finishTime = finishTimes[playerId]?.[selectedRound] || "--:--";
    const startTime =
      startTimes[playerId]?.[selectedRound] || getPlayerStartTime({ userId: playerId }, playerRoundDate);

    // Check if all holes have valid scores (not empty string, not zero, must be positive integer)
    const allHolesFilled = playerHoles.every(hole => {
      const score = roundScores[hole];
      // Score must exist, not be empty string, and be a positive integer
      return score !== "" && score != null && score !== undefined && parseInt(score) > 0;
    });

    const validStartTime = startTime !== "--:--";

    // If hole times are enabled, we need different validation
    if (showHoleTimes) {
      // When hole times are enabled:
      // 1. All holes must have valid scores
      // 2. All holes must have valid hole times (format depends on mode)
      // 3. Start time must be valid
      // 4. Finish time is calculated automatically, so we don't need to check it

      const allHoleTimesValid = playerHoles.every(hole => {
        const holeTime = roundHoleTimes[hole];
        if (!holeTime || holeTime === "") return false;

        // Check format based on hole time mode
        if (holeTimeMode === "durations") {
          // MM:SS format for durations
          return /^([0-9]{1,2}):([0-9]{2})$/.test(holeTime);
        } else {
          // HH:MM:SS format for timestamps
          return /^([0-9]{2}):([0-9]{2}):([0-9]{2})$/.test(holeTime);
        }
      });

      return allHolesFilled && allHoleTimesValid && validStartTime;
    } else {
      // When hole times are disabled:
      // 1. All holes must have valid scores
      // 2. Start time must be valid
      // 3. Finish time must be valid

      const validFinishTime = finishTime !== "--:--";
      return allHolesFilled && validStartTime && validFinishTime;
    }
  };
  /**
   * Handles the exit action from the tournament scores page.
   * Prompts user if there are unsaved changes before navigating away.
   */
  const handleExit = () => {
    if (unsavedChanges) {
      if (window.confirm("You have unsaved changes. Are you sure you want to exit?")) {
        // navigate("/competitions");
        navigate(-1);
      }
    } else {
      // navigate("/competitions");
      navigate(-1);
    }
  };

  /**
   * Retrieves course information for a specific round.
   *
   * @param {string} roundId - The round ID to get course information for
   * @returns {string|null} Formatted course name and tee name, or null if not found
   */
  const getCourseForRound = roundId => {
    if (!tournament || !tournament.divisions || !selectedDivision) return null;
    const division = tournament.divisions.find(d => d.name === selectedDivision);
    if (!division) return null;

    const round = division.rounds.find(r => r._id === roundId);
    if (!round) return null;

    let courseName = "Unknown Course";
    let teeName = "Unknown Tee";

    // Get course name
    if (round.course) {
      courseName = round.course.name ? round.course.name.split(",")[0] : "Unknown Course";
    } else if (round.courseId && tournament.courses) {
      const course = tournament.courses.find(c => c.courseId === round.courseId);
      if (course) {
        courseName = course.name.split(",")[0];
      } else {
        const courseById = tournament.courses.find(c => c._id === round.courseId);
        if (courseById) {
          courseName = courseById.name.split(",")[0];
        }
      }
    }

    // Get tee name
    if (round.tee?.name) {
      teeName = round.tee.name;
    } else if (round.teeId) {
      // Try to find tee info in the course data
      const courseToCheck = courseData || reduxCourseData;
      if (courseToCheck && courseToCheck.tees) {
        let teeInfo = null;
        if (Array.isArray(courseToCheck.tees)) {
          teeInfo = courseToCheck.tees.find(tee => tee.id === round.teeId || tee._id === round.teeId);
        } else if (typeof courseToCheck.tees === "object") {
          teeInfo = Object.values(courseToCheck.tees).find(tee => tee.id === round.teeId || tee._id === round.teeId);
        }
        if (teeInfo?.name) {
          teeName = teeInfo.name;
        }
      }
    }

    return `${courseName} (${teeName})`;
  };

  /**
   * Calculates unified time par for table header display.
   * Uses Math.round() for consistent precision with GolfCourseInfoTable.
   * This provides the baseline time par that all players are compared against.
   */
  let timePar = 0; // Initialize to 0 instead of null

  if (isFrontNine) {
    holes.forEach(holeNum => {
      const holeTimePar = teeData?.holes?.[holeNum - 1]?.[`${divisionGender}TimePar`] || 0;
      timePar += Math.round(holeTimePar);
    });
  } else if (isBackNine) {
    holes.forEach(holeNum => {
      const holeData = teeData?.holes?.[holeNum - 1];
      const holeTimePar = holeData?.[`${divisionGender}TimePar`] || 0;
      timePar += Math.round(holeTimePar);
    });
  } else {
    // Full 18-hole round
    holes.forEach(holeNum => {
      const holeTimePar = teeData?.holes?.[holeNum - 1]?.[`${divisionGender}TimePar`] || 0;
      timePar += Math.round(holeTimePar);
    });
  }

  if (timePar > 0) {
    // timePar is already in seconds from the course data, no conversion needed
  }

  // const elapsedTime = useMemo(() => {
  //   return diffMillis(startTimes, finishTimes)
  // }, [startTimes, finishTimes, selectedRound])

  return (
    <div className="p-4 relative">
      <style>{`
        /* Override scoreStyles.css first column right alignment for player names */
        .scorecard-table tbody tr.player-data-row td:first-child,
        .scorecard-table tbody tr.player-data-row td:first-child *,
        .scorecard-table tbody tr.player-data-row td:first-child div,
        .scorecard-table tbody tr.player-data-row td:first-child div div {
          text-align: left !important;
          justify-content: flex-start !important;
          align-items: center !important;
        }
      `}</style>
      {!finalResults && (
        <div
          style={{
            backgroundColor: themeColors.tournNameBannerBg,
            color: "#FFFFFF",
            padding: "20px",
            borderRadius: "0",
            marginBottom: "20px",
          }}
          className="mb-4"
        >
          <div className="d-flex align-items-center">
            <img
              src={tournament.basicInfo?.logo || tournament.logo || DEFAULT_LOGO}
              alt={`${tournament.basicInfo.name} logo`}
              style={{
                height: "60px",
                width: "auto",
                marginRight: "20px",
                objectFit: "contain",
              }}
              onError={e => {
                e.target.src = DEFAULT_LOGO;
              }}
            />
            <div>
              <h2 className="mb-0">{tournament.basicInfo.name}: Enter Player Scores</h2>
              <p className="m-0" style={{ color: "#6FA5D8" }}>
                {tournament.basicInfo.startDate && new Date(tournament.basicInfo.startDate).toLocaleDateString()} -{" "}
                {tournament.basicInfo.endDate && new Date(tournament.basicInfo.endDate).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="flex items-center gap-4 mb-4">
        {!finalResults ? (
          <div className="flex items-center gap-2">
            <label htmlFor="division-select" className="font-medium text-gray-700">
              Division:&nbsp;
            </label>
            <select
              id="division-select"
              className="p-2 border rounded w-48"
              value={selectedDivision}
              onChange={e => setSelectedDivision(e.target.value)}
            >
              <option value="All">All Divisions</option>
              {tournament.divisions?.map(div => (
                <option key={div._id} value={div.name}>
                  {div.name}
                </option>
              ))}
            </select>
            <p></p>
          </div>
        ) : (
          <h3 className="text-lg font-bold mb-2">{selectedDivision} Division</h3>
        )}

        {/* 
          Player Search Component - Real-time player filtering for efficient score entry
          - Controlled input with searchTerm state and setSearchTerm handler
          - Case-insensitive search with instant results as user types
          - Clear button (✕) appears when search term exists
          - Scoped to current division and round selection
          - Hidden in final results mode to maintain clean display
        */}
        {/* Player Search Box */}
        {!finalResults && (
          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-2 mx-auto">
              <label htmlFor="player-search" className="font-medium text-gray-700">
                Search Players:&nbsp;
              </label>
              <input
                id="player-search"
                type="text"
                className="p-2 border rounded w-64"
                placeholder="Enter player name..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{
                  borderColor: "#dee2e6",
                  borderWidth: "1px",
                  borderStyle: "solid",
                  borderRadius: "4px",
                  padding: "8px 12px",
                  fontSize: "14px",
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="text-gray-500 hover:text-gray-700 ml-1"
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "16px",
                    cursor: "pointer",
                    padding: "4px",
                  }}
                  title="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        )}

        {(currentDivision || selectedDivision === "All") && (
          <>
            {/* Show RoundSelector if there are multiple rounds */}
            {(() => {
              // For "All Divisions", use the first division's rounds structure
              const divisionForRounds = selectedDivision === "All" ? tournament.divisions?.[0] : currentDivision;

              return (
                divisionForRounds?.rounds &&
                divisionForRounds.rounds.length > 1 && (
                  <RoundSelector
                    currentDivision={divisionForRounds}
                    selectedRound={selectedRound}
                    onRoundChange={setSelectedRound}
                    units={units}
                    onUnitsChange={onUnitsChange}
                    holeTimeMode={holeTimeMode}
                    onHoleTimeModeChange={handleHoleTimeModeChange}
                    hasExistingHoleTimeData={hasSavedHoleTimeData()}
                    hasUnsavedHoleTimeData={hasUnsavedHoleTimeData()}
                    onClearUnsavedHoleTimeData={clearUnsavedHoleTimeData}
                    establishedTimeEntryMethod={establishedTimeEntryMethod}
                    finalResults={finalResults}
                  />
                )
              );
            })()}

            {/* For single round tournaments, just show the controls */}
            {(() => {
              // For "All Divisions", use the first division's rounds structure
              const divisionForRounds = selectedDivision === "All" ? tournament.divisions?.[0] : currentDivision;

              return (
                divisionForRounds?.rounds &&
                divisionForRounds.rounds.length === 1 && (
                  <ScoreControlsBar
                    holeTimeMode={holeTimeMode}
                    onHoleTimeModeChange={handleHoleTimeModeChange}
                    hasExistingHoleTimeData={hasSavedHoleTimeData()}
                    hasUnsavedHoleTimeData={hasUnsavedHoleTimeData()}
                    onClearUnsavedHoleTimeData={clearUnsavedHoleTimeData}
                    establishedTimeEntryMethod={establishedTimeEntryMethod}
                    finalResults={finalResults}
                  />
                )
              );
            })()}

            {/* Standalone units toggle for All Divisions view */}
            {selectedDivision === "All" && (
              <div className="mb-3">
                <div className="d-flex align-items-center justify-content-start">
                  <label className="fw-bold text-dark me-2 mb-0" style={{ fontSize: "0.9rem" }}>
                    Units:
                  </label>
                  <span
                    className={`me-1 fw-normal ${units === "imperial" ? "" : "text-muted"}`}
                    style={{ fontSize: "0.9rem" }}
                  >
                    Imperial
                  </span>
                  <div className="form-check form-switch mx-1">
                    <input
                      id="unitToggleAllDivisions"
                      className="form-check-input form-check-input-sm"
                      type="checkbox"
                      checked={units === "metric"}
                      onChange={e => {
                        onUnitsChange(e.target.checked ? "metric" : "imperial");
                      }}
                      style={{ transform: "scale(0.8)" }}
                    />
                  </div>
                  <span
                    className={`ms-1 fw-normal ${units === "metric" ? "" : "text-muted"}`}
                    style={{ fontSize: "0.9rem" }}
                  >
                    Metric
                  </span>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <div
        className="overflow-x-auto mt-4"
        style={{
          maxWidth: "100%",
          overflowX: "auto",
          overflowY: "hidden",
          width: "100%",
          display: "block",
        }}
      >
        {selectedDivision === "All" ? (
          // Render multiple tables, one for each division
          tournament.divisions?.map(division => {
            const divisionCurrentDivision = division;
            const divisionRoundIndex = selectedRound ? parseInt(selectedRound.slice(1)) - 1 : 0;
            const divisionCurrentRound =
              divisionCurrentDivision?.rounds &&
              divisionRoundIndex >= 0 &&
              divisionRoundIndex < divisionCurrentDivision.rounds.length
                ? divisionCurrentDivision.rounds[divisionRoundIndex]
                : null; // Set to null if selected round doesn't exist
            const divisionRoundDate = divisionCurrentRound?.date;

            let divisionSpecificPlayers =
              tournament.players?.filter(p => {
                const playerDivision = findDivisionById(p.division);
                return playerDivision?.name === division.name && p.status !== "withdrawn";
              }) || [];

            if (finalResults) {
              divisionSpecificPlayers = divisionSpecificPlayers.filter(p => {
                if (p.userId && playerId) {
                  return p.userId === playerId;
                }
                return true;
              });
            }

            // Apply search filter
            divisionSpecificPlayers = filterPlayersBySearch(divisionSpecificPlayers);

            const divisionSortedPlayers = [...divisionSpecificPlayers].sort((playerA, playerB) => {
              const startTimeA = getPlayerStartTime(playerA, divisionRoundDate);
              const startTimeB = getPlayerStartTime(playerB, divisionRoundDate);

              if (startTimeA === "--:--" && startTimeB === "--:--") return 0;
              if (startTimeA === "--:--") return 1;
              if (startTimeB === "--:--") return -1;

              const convertToSeconds = time => {
                let [timePart, period] = time.split(" ");
                let [hours, minutes, seconds] = timePart.split(":").map(Number);
                seconds = seconds || 0;

                if (period === "PM" && hours !== 12) {
                  hours += 12;
                } else if (period === "AM" && hours === 12) {
                  hours = 0;
                }

                return hours * 3600 + minutes * 60 + seconds;
              };

              const secondsA = convertToSeconds(startTimeA);
              const secondsB = convertToSeconds(startTimeB);

              return secondsA - secondsB;
            });

            const divisionHoles = getHoleNumbers(divisionCurrentRound?.numHoles);
            const divisionIsFullRound = divisionCurrentRound?.numHoles === "18" || !divisionCurrentRound?.numHoles;
            const divisionIsFrontNine = divisionCurrentRound?.numHoles === "Front 9";
            const divisionIsBackNine = divisionCurrentRound?.numHoles === "Back 9";
            const divisionShowOutColumn = divisionIsFullRound;
            const divisionShowInColumn = divisionIsFullRound;

            // Get division-specific data
            const divisionGender = division?.gender === "Male" ? "mens" : "womens";
            // Use divisionCurrentRound instead of trying to find by selectedRound
            const divisionSelectedRoundObject = divisionCurrentRound;

            /**
             * Retrieves course data for a specific division's round in the "All Divisions" view.
             *
             * This function implements a comprehensive fallback strategy to find course data
             * from multiple sources, ensuring reliable course information display across
             * different data structures and states.
             *
             * **Fallback Priority Order:**
             * 1. **fullCoursesData** - Complete course data passed from leaderboard page
             * 2. **allReduxCourses** - Course data from Redux state
             * 3. **tournament.courses** - Course data embedded in tournament object
             * 4. **roundObj.course** - Course data directly embedded in round object
             *
             * @param {Object|null} roundObj - The round object containing course configuration
             * @param {string} roundObj.courseId - The ID of the course for this round
             * @param {Object} [roundObj.course] - Embedded course data (fallback)
             * @returns {Object|undefined} The course data object or undefined if not found
             *
             * @example
             * // Get course data for a division's current round
             * const courseData = getDivisionCourseData(division.rounds[0]);
             * if (courseData) {
             *   console.log(`Course: ${courseData.name}`);
             * }
             *
             * @since 2.1.0 - Added for "All Divisions" multi-table rendering
             */
            const getDivisionCourseData = roundObj => {
              if (!roundObj) return undefined;

              // First try to use fullCoursesData (passed from leaderboard)
              if (fullCoursesData && roundObj.courseId && fullCoursesData[roundObj.courseId]) {
                return fullCoursesData[roundObj.courseId];
              }

              // Try to use Redux course data if available
              const reduxCourse = allReduxCourses?.find(course => course.id === roundObj.courseId);
              if (reduxCourse) {
                return reduxCourse;
              }

              // Fallback to tournament.courses
              if (tournament.courses && roundObj.courseId) {
                const course = tournament.courses.find(
                  c => c.courseId === roundObj.courseId || c._id === roundObj.courseId,
                );
                if (course) {
                  return course;
                }
              }

              // Last fallback to embedded course data
              if (roundObj.course) {
                return roundObj.course;
              }

              return undefined;
            };

            /**
             * Generates formatted course and tee information for display in the "All Divisions" view.
             *
             * This function creates a user-friendly string containing both course name and tee name
             * for a specific division's round. It implements the same fallback logic as
             * getDivisionCourseData to ensure consistent data retrieval.
             *
             * **Information Extracted:**
             * - **Course Name**: Extracted from course data, truncated at first comma
             * - **Tee Name**: Retrieved from tee configuration or embedded round data
             * - **Formatted Output**: "Course Name (Tee Name)" format
             *
             * **Fallback Handling:**
             * - Uses same priority order as getDivisionCourseData for course data
             * - Handles both array and object formats for tee data structures
             * - Provides user-friendly defaults for missing information
             *
             * @param {Object} divisionObj - The division object (currently unused but maintained for consistency)
             * @param {Object|null} roundObj - The round object containing course and tee configuration
             * @param {string} roundObj.courseId - The ID of the course for this round
             * @param {string} [roundObj.teeId] - The ID of the specific tee configuration
             * @param {Object} [roundObj.tee] - Embedded tee data with name property
             * @param {Object} [roundObj.course] - Embedded course data (fallback)
             * @returns {string} Formatted course information string, e.g., "Pebble Beach (Championship)"
             *
             * @example
             * // Get formatted course info for display
             * const courseInfo = getDivisionCourseInfo(division, round);
             * // Returns: "Pebble Beach Golf Links (Championship Tees)"
             *
             * @example
             * // Handle missing round data
             * const courseInfo = getDivisionCourseInfo(division, null);
             * // Returns: "Course information not available"
             *
             * @since 2.1.0 - Added for "All Divisions" multi-table rendering
             */
            const getDivisionCourseInfo = (divisionObj, roundObj) => {
              if (!roundObj) return "Course information not available";

              let courseName = "Unknown Course";
              let teeName = "Unknown Tee";

              // Get the course data using the same logic as getDivisionCourseData
              let divisionSpecificCourseData = null;

              // First try to use fullCoursesData (passed from leaderboard)
              if (fullCoursesData && roundObj.courseId && fullCoursesData[roundObj.courseId]) {
                divisionSpecificCourseData = fullCoursesData[roundObj.courseId];
              }
              // Fallback to allReduxCourses
              else if (allReduxCourses && roundObj.courseId) {
                divisionSpecificCourseData = allReduxCourses.find(c => c.id === roundObj.courseId);
              }
              // Fallback to tournament.courses
              else if (tournament.courses && roundObj.courseId) {
                divisionSpecificCourseData = tournament.courses.find(
                  c => c.courseId === roundObj.courseId || c._id === roundObj.courseId,
                );
              }
              // Last fallback to embedded course data
              else if (roundObj.course) {
                divisionSpecificCourseData = roundObj.course;
              }

              // Get course name
              if (divisionSpecificCourseData) {
                courseName = divisionSpecificCourseData.name
                  ? divisionSpecificCourseData.name.split(",")[0]
                  : "Unknown Course";
              } else if (roundObj.course) {
                courseName = roundObj.course.name ? roundObj.course.name.split(",")[0] : "Unknown Course";
              }

              // Get tee name with improved logic
              if (roundObj.tee?.name) {
                teeName = roundObj.tee.name;
              } else if (roundObj.teeId && divisionSpecificCourseData?.tees) {
                // Handle both array and object formats for tees
                let teeInfo = null;
                if (Array.isArray(divisionSpecificCourseData.tees)) {
                  teeInfo = divisionSpecificCourseData.tees.find(
                    tee => tee.id === roundObj.teeId || tee._id === roundObj.teeId,
                  );
                } else if (typeof divisionSpecificCourseData.tees === "object") {
                  teeInfo = Object.values(divisionSpecificCourseData.tees).find(
                    tee => tee.id === roundObj.teeId || tee._id === roundObj.teeId,
                  );
                }
                if (teeInfo?.name) {
                  teeName = teeInfo.name;
                }
              }

              return `${courseName} (${teeName})`;
            };

            const divisionCourseInfo = getDivisionCourseInfo(division, divisionCurrentRound);
            const divisionCourseData = getDivisionCourseData(divisionCurrentRound);

            // Set up division-specific tee data
            let divisionTeeData = null;
            if (divisionCourseData && divisionCurrentRound?.teeId) {
              const divisionTeesArray = divisionCourseData.tees;
              if (divisionTeesArray) {
                let filteredTeeData = null;
                if (Array.isArray(divisionTeesArray)) {
                  filteredTeeData = divisionTeesArray.filter(tee => {
                    return tee.id === divisionCurrentRound.teeId || tee._id === divisionCurrentRound.teeId;
                  });
                } else if (typeof divisionTeesArray === "object") {
                  // Handle object format
                  filteredTeeData = Object.values(divisionTeesArray).filter(tee => {
                    return tee.id === divisionCurrentRound.teeId || tee._id === divisionCurrentRound.teeId;
                  });
                }
                if (filteredTeeData && Array.isArray(filteredTeeData) && filteredTeeData.length > 0) {
                  divisionTeeData = filteredTeeData[0];
                }
              }
            }

            // Check if this division doesn't have the selected round
            if (!divisionCurrentRound) {
              return (
                <div key={division._id} className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                    {division.name} Division
                  </h2>
                  <div className="text-center p-4">
                    <em>This division does not have this round.</em>
                  </div>
                </div>
              );
            }

            // Check if this division has any players
            if (divisionSortedPlayers.length === 0) {
              // If there's a search term active, hide the division completely
              if (searchTerm && searchTerm.trim()) {
                return null;
              }
              // Otherwise, show the "no players registered" message
              return (
                <div key={division._id} className="mb-4">
                  <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                    {division.name} Division - {divisionCourseInfo}
                  </h2>
                  <div className="text-center p-4">
                    <em>No players are registered in this division</em>
                  </div>
                </div>
              );
            }

            return (
              <div key={division._id} className="mb-4">
                <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b-2 border-gray-300 pb-2">
                  {division.name} Division - {divisionCourseInfo}
                </h2>

                <table
                  className="border-collapse scorecard-table"
                  style={{
                    minWidth: divisionIsFullRound ? "1150px" : "750px",
                    fontSize: "0.85rem",
                    tableLayout: "fixed",
                    width: "auto",
                  }}
                >
                  <tbody>
                    {divisionCourseData && divisionSelectedRoundObject ? (
                      <GolfCourseInfoTable
                        course={divisionCourseData}
                        selectedRound={divisionSelectedRoundObject}
                        units={units}
                        gender={divisionGender}
                        finalResults={finalResults}
                        onUnitsChange={onUnitsChange}
                        showUnitsToggle={false}
                      />
                    ) : (
                      // Show placeholder rows if course data is not available
                      <>
                        <tr>
                          {!finalResults && (
                            <th colSpan={4} style={{ border: "none", backgroundColor: "transparent" }}></th>
                          )}
                          <th colSpan={1} className="p-2 border text-right" style={{ textAlign: "right" }}>
                            Golf Distance
                          </th>
                          <td colSpan={20} className="p-2 border text-center">
                            Course data not available
                          </td>
                        </tr>
                        <tr>
                          {!finalResults && (
                            <th colSpan={4} style={{ border: "none", backgroundColor: "transparent" }}></th>
                          )}
                          <th
                            colSpan={1}
                            className="p-2 border text-right"
                            style={{ textAlign: "right", backgroundColor: "#13294E", color: "white" }}
                          >
                            Stroke Par
                          </th>
                          <td
                            colSpan={20}
                            className="p-2 border text-center"
                            style={{ backgroundColor: "#13294E", color: "white" }}
                          >
                            Course data not available
                          </td>
                        </tr>
                        <tr>
                          {!finalResults && (
                            <th colSpan={4} style={{ border: "none", backgroundColor: "transparent" }}></th>
                          )}
                          <th colSpan={1} className="p-2 border text-right" style={{ textAlign: "right" }}>
                            Run Distance
                          </th>
                          <td colSpan={20} className="p-2 border text-center">
                            Course data not available
                          </td>
                        </tr>
                        <tr>
                          {!finalResults && (
                            <th colSpan={4} style={{ border: "none", backgroundColor: "transparent" }}></th>
                          )}
                          <th
                            colSpan={1}
                            className="p-2 border text-right"
                            style={{ textAlign: "right", backgroundColor: "#ff0f00", color: "white" }}
                          >
                            Time Par
                          </th>
                          <td
                            colSpan={20}
                            className="p-2 border text-center"
                            style={{ backgroundColor: "#ff0f00", color: "white" }}
                          >
                            Course data not available
                          </td>
                        </tr>
                      </>
                    )}
                    <tr>
                      {!finalResults && <th className="p-2 border text-left">Player</th>}
                      {!finalResults && <th className="p-2 border text-left">Div</th>}
                      {!finalResults && <th className="p-2 border">Start Time</th>}
                      {!finalResults && <th className="p-2 border">Finish Time</th>}
                      <th className="p-2 border" style={{ textAlign: "right" }}>
                        Hole
                      </th>
                      {(divisionIsFrontNine || divisionIsFullRound) &&
                        divisionHoles.slice(0, 9).map(holeNum => (
                          <th key={holeNum} className="p-2 border text-center w-12">
                            {holeNum}
                          </th>
                        ))}
                      {divisionIsBackNine &&
                        divisionHoles.map(holeNum => (
                          <th key={holeNum} className="p-2 border text-center w-12">
                            {holeNum}
                          </th>
                        ))}
                      {divisionShowOutColumn && <th className="p-2 border text-center">OUT</th>}
                      {divisionIsFullRound &&
                        divisionHoles.slice(9).map(holeNum => (
                          <th key={holeNum} className="p-2 border text-center w-12">
                            {holeNum}
                          </th>
                        ))}
                      {divisionShowInColumn && <th className="p-2 border text-center">IN</th>}
                      <th className="p-2 border text-center">TOTAL</th>
                      {!finalResults && <th className="p-2 border">Action</th>}
                    </tr>
                    {divisionSortedPlayers.map(player => {
                      const roundScores = scores[player.userId]?.[selectedRound] || {};
                      const roundHoleTimes = holeTimes[player.userId]?.[selectedRound] || {};
                      const playerStartTime =
                        startTimes[player.userId]?.[selectedRound] || getPlayerStartTime(player, divisionRoundDate);
                      const finishTime = finishTimes[player.userId]?.[selectedRound] || "--:--";

                      const canEnterCurrentRound = hasCompletedPreviousRound(player.userId, selectedRound);
                      const isRoundLocked = !canEnterCurrentRound;

                      const elapsedTime = calculateTimeFromFinishAndStart(playerStartTime, finishTime);
                      const elapsedTimeInSeconds = mmssToSeconds(elapsedTime);

                      let timePar = 0;
                      if (divisionIsFrontNine) {
                        divisionHoles.forEach(holeNum => {
                          const holeTimePar = divisionTeeData?.holes?.[holeNum - 1]?.[`${divisionGender}TimePar`] || 0;
                          timePar += Math.round(holeTimePar);
                        });
                      } else if (divisionIsBackNine) {
                        divisionHoles.forEach(holeNum => {
                          const holeData = divisionTeeData?.holes?.[holeNum - 1];
                          const holeTimePar = holeData?.[`${divisionGender}TimePar`] || 0;
                          timePar += Math.round(holeTimePar);
                        });
                      } else {
                        divisionHoles.forEach(holeNum => {
                          const holeTimePar = divisionTeeData?.holes?.[holeNum - 1]?.[`${divisionGender}TimePar`] || 0;
                          timePar += Math.round(holeTimePar);
                        });
                      }

                      const timeParInSeconds = timePar;
                      const timeToParInSeconds = elapsedTimeInSeconds - timeParInSeconds;

                      const strokeToPar = calcTotalStrokesToPar(
                        roundScores,
                        getHolePar,
                        divisionCurrentRound,
                        divisionIsFrontNine,
                        divisionIsBackNine,
                      );
                      // Calculate total for SGS computation
                      let totalForSGS = 0;
                      if (divisionIsFullRound) {
                        totalForSGS = calcTotalStrokes(roundScores, true, false, false);
                      } else if (divisionIsFrontNine) {
                        totalForSGS = calcTotalStrokes(roundScores, false, true, false);
                      } else if (divisionIsBackNine) {
                        totalForSGS = calcTotalStrokes(roundScores, false, false, true);
                      }
                      const sgs = calculateSGS(totalForSGS, elapsedTime);
                      const sgsToPar = sgs !== "--:--" ? computeSGSToPar(timeToParInSeconds, strokeToPar) : "ND";
                      const playerDivision = findDivisionById(player.division);
                      const divisionName = playerDivision?.name || "Unknown";

                      return (
                        <tr key={player.userId} className="player-data-row">
                          {!finalResults && (
                            <td
                              style={{
                                width: "180px",
                                textAlign: "left",
                                padding: "8px",
                                border: "1px solid #dee2e6",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-start",
                                  width: "100%",
                                  textAlign: "left",
                                }}
                              >
                                <img
                                  src={player.profilePic || DefaultProfilePic}
                                  alt={player.playerName}
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    marginRight: "10px",
                                    objectFit: "cover",
                                    flexShrink: 0,
                                  }}
                                />
                                <div
                                  style={{
                                    fontSize: "14px",
                                    textAlign: "left",
                                    width: "100%",
                                    flex: 1,
                                  }}
                                >
                                  {player.playerName}
                                  {player.homeCountry && (
                                    <span
                                      className={`flag-icon flag-icon-${player.homeCountry.toLowerCase()}`}
                                      title={player.homeCountry}
                                      style={{ marginLeft: "8px" }}
                                    />
                                  )}
                                </div>
                              </div>
                            </td>
                          )}
                          {!finalResults && (
                            <td className="p-2 border" style={{ width: "70px" }}>
                              {divisionName}
                            </td>
                          )}
                          {!finalResults && (
                            <td className="p-2 border">
                              <input
                                type="time"
                                step="1"
                                className="w-full p-1 text-center"
                                value={playerStartTime !== "--:--" ? convertTo24Hour(playerStartTime) : ""}
                                onChange={e => handleStartTimeChange(player.userId, selectedRound, e.target.value)}
                              />
                            </td>
                          )}
                          {!finalResults && (
                            <td className="p-2 border">
                              <input
                                type="time"
                                step="1"
                                className="w-full p-1 text-center"
                                value={
                                  showHoleTimes
                                    ? calculateFinishTimeFromHoleTimes(playerStartTime, roundHoleTimes) !== "--:--"
                                      ? convertTo24Hour(
                                          calculateFinishTimeFromHoleTimes(playerStartTime, roundHoleTimes),
                                        )
                                      : ""
                                    : finishTime !== "--:--"
                                      ? convertTo24Hour(finishTime)
                                      : ""
                                }
                                disabled={showHoleTimes}
                                onChange={e => handleFinishTimeChange(player.userId, selectedRound, e.target.value)}
                              />
                            </td>
                          )}
                          <td
                            className="p-2 border text-right scorecard-first-column"
                            style={{
                              height: showHoleTimes ? "220px" : "50px",
                              verticalAlign: "middle",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                alignItems: "flex-end",
                                height: "100%",
                                paddingRight: "8px",
                                textAlign: "right",
                                width: "100%",
                                paddingTop: "15px",
                                paddingBottom: "15px",
                              }}
                            >
                              <div
                                style={{
                                  textAlign: "right",
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  height: "33.33%",
                                  paddingBottom: "10px",
                                }}
                              >
                                <strong>Strokes</strong>
                              </div>
                              <div
                                style={{
                                  textAlign: "right",
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  height: "33.33%",
                                  paddingTop: "10px",
                                }}
                              >
                                <strong>Time</strong>
                              </div>
                              <div
                                style={{
                                  textAlign: "right",
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  height: "33.33%",
                                  paddingTop: "15px",
                                }}
                              >
                                <strong>SGS</strong>
                              </div>
                            </div>
                          </td>
                          {(divisionIsFrontNine || divisionIsFullRound) &&
                            divisionHoles
                              .slice(0, 9)
                              .map(holeNum => (
                                <ScoreCellWithTime
                                  key={holeNum}
                                  holeNum={holeNum}
                                  player={player}
                                  selectedRound={selectedRound}
                                  roundScores={roundScores}
                                  roundHoleTimes={roundHoleTimes}
                                  getHolePar={getHolePar}
                                  getScoreClass={getScoreClass}
                                  currentRound={divisionCurrentRound}
                                  handleScoreChange={handleScoreChange}
                                  handleHoleTimeChange={handleHoleTimeChange}
                                  strokePar={divisionTeeData?.holes?.[holeNum - 1]?.[`${divisionGender}StrokePar`]}
                                  timePar={divisionTeeData?.holes?.[holeNum - 1]?.[`${divisionGender}TimePar`]}
                                  showHoleTimes={showHoleTimes}
                                  finalResults={finalResults}
                                  isRoundLocked={isRoundLocked}
                                  holeTimeMode={holeTimeMode}
                                />
                              ))}
                          {divisionIsBackNine &&
                            divisionHoles.map(holeNum => (
                              <ScoreCellWithTime
                                key={holeNum}
                                holeNum={holeNum}
                                player={player}
                                selectedRound={selectedRound}
                                roundScores={roundScores}
                                roundHoleTimes={roundHoleTimes}
                                getHolePar={getHolePar}
                                getScoreClass={getScoreClass}
                                currentRound={divisionCurrentRound}
                                handleScoreChange={handleScoreChange}
                                handleHoleTimeChange={handleHoleTimeChange}
                                strokePar={divisionTeeData?.holes?.[holeNum - 1]?.[`${divisionGender}StrokePar`]}
                                timePar={divisionTeeData?.holes?.[holeNum - 1]?.[`${divisionGender}TimePar`]}
                                showHoleTimes={showHoleTimes}
                                finalResults={finalResults}
                                isRoundLocked={isRoundLocked}
                                holeTimeMode={holeTimeMode}
                              />
                            ))}
                          {divisionShowOutColumn && (
                            <td
                              className="p-2 border text-center scorecard-summary-column"
                              style={{
                                height: showHoleTimes ? "220px" : "50px",
                                fontSize: "0.85rem",
                                padding: "6px",
                                textAlign: "center",
                                verticalAlign: "middle",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  paddingTop: "15px",
                                  paddingBottom: "15px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "33.33%",
                                  }}
                                >
                                  {(() => {
                                    const divisionOut = calcOutStrokes(roundScores);
                                    const outStrokePar = calcOutStrokePar(
                                      roundScores,
                                      getHolePar,
                                      divisionCurrentRound,
                                    );
                                    return formatStrokesToPar(divisionOut, outStrokePar);
                                  })()}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "33.33%",
                                  }}
                                >
                                  {showHoleTimes ? (
                                    <>
                                      {secondsToMmss(calcOutTime(roundHoleTimes))}
                                      <span style={{ marginLeft: "4px" }}>
                                        {(() => {
                                          const outTimeSeconds = calcOutTime(roundHoleTimes);
                                          const outTimePar = calculateOutTimePar(
                                            roundHoleTimes,
                                            divisionTeeData,
                                            divisionGender,
                                          );
                                          return timeToPar(outTimeSeconds, outTimePar);
                                        })()}
                                      </span>
                                    </>
                                  ) : (
                                    "—"
                                  )}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "33.33%",
                                    paddingTop: "15px",
                                  }}
                                >
                                  {showHoleTimes
                                    ? (() => {
                                        const outSGS = calcOutSGS(roundScores, roundHoleTimes);
                                        const outSGSToPar = calcOutSGSToPar(
                                          roundScores,
                                          roundHoleTimes,
                                          getHolePar,
                                          divisionCurrentRound,
                                          divisionTeeData,
                                          divisionGender,
                                        );
                                        return formatSGSToPar(
                                          outSGS.sgs,
                                          outSGSToPar.par,
                                          outSGSToPar.differenceSeconds,
                                        );
                                      })()
                                    : "—"}
                                </div>
                              </div>
                            </td>
                          )}
                          {divisionIsFullRound &&
                            divisionHoles
                              .slice(9)
                              .map(holeNum => (
                                <ScoreCellWithTime
                                  key={holeNum}
                                  holeNum={holeNum}
                                  player={player}
                                  selectedRound={selectedRound}
                                  roundScores={roundScores}
                                  roundHoleTimes={roundHoleTimes}
                                  getHolePar={getHolePar}
                                  getScoreClass={getScoreClass}
                                  currentRound={divisionCurrentRound}
                                  handleScoreChange={handleScoreChange}
                                  handleHoleTimeChange={handleHoleTimeChange}
                                  strokePar={divisionTeeData?.holes?.[holeNum - 1]?.[`${divisionGender}StrokePar`]}
                                  timePar={divisionTeeData?.holes?.[holeNum - 1]?.[`${divisionGender}TimePar`]}
                                  showHoleTimes={showHoleTimes}
                                  finalResults={finalResults}
                                  isRoundLocked={isRoundLocked}
                                  holeTimeMode={holeTimeMode}
                                />
                              ))}
                          {divisionShowInColumn && (
                            <td
                              className="p-2 border text-center scorecard-summary-column"
                              style={{
                                height: showHoleTimes ? "220px" : "50px",
                                fontSize: "0.85rem",
                                padding: "6px",
                                textAlign: "center",
                                verticalAlign: "middle",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  paddingTop: "15px",
                                  paddingBottom: "15px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "33.33%",
                                  }}
                                >
                                  {(() => {
                                    const divisionInScore = calcInStrokes(roundScores);
                                    const inStrokePar = calcInStrokePar(roundScores, getHolePar, divisionCurrentRound);
                                    return formatStrokesToPar(divisionInScore, inStrokePar);
                                  })()}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "33.33%",
                                  }}
                                >
                                  {showHoleTimes ? (
                                    <>
                                      {secondsToMmss(calcInTime(roundHoleTimes))}
                                      <span style={{ marginLeft: "4px" }}>
                                        {(() => {
                                          const inTimeSeconds = calcInTime(roundHoleTimes);
                                          const inTimePar = calculateInTimePar(
                                            roundHoleTimes,
                                            divisionTeeData,
                                            divisionGender,
                                          );
                                          return timeToPar(inTimeSeconds, inTimePar);
                                        })()}
                                      </span>
                                    </>
                                  ) : (
                                    "—"
                                  )}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "33.33%",
                                    paddingTop: "15px",
                                  }}
                                >
                                  {showHoleTimes
                                    ? (() => {
                                        const inSGS = calcInSGS(roundScores, roundHoleTimes);
                                        const inSGSToPar = calcInSGSToPar(
                                          roundScores,
                                          roundHoleTimes,
                                          getHolePar,
                                          divisionCurrentRound,
                                          divisionTeeData,
                                          divisionGender,
                                        );
                                        return formatSGSToPar(inSGS.sgs, inSGSToPar.par, inSGSToPar.differenceSeconds);
                                      })()
                                    : "—"}
                                </div>
                              </div>
                            </td>
                          )}
                          <td
                            className="p-2 border text-center scorecard-summary-column"
                            style={{
                              height: showHoleTimes ? "220px" : "50px",
                              fontSize: "0.85rem",
                              padding: "6px",
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                alignItems: "center",
                                paddingTop: "15px",
                                paddingBottom: "15px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  height: "33.33%",
                                }}
                              >
                                {(() => {
                                  let divisionTotal = 0;
                                  if (divisionIsFullRound) {
                                    divisionTotal = calcTotalStrokes(roundScores, true, false, false);
                                  } else if (divisionIsFrontNine) {
                                    divisionTotal = calcTotalStrokes(roundScores, false, true, false);
                                  } else if (divisionIsBackNine) {
                                    divisionTotal = calcTotalStrokes(roundScores, false, false, true);
                                  }
                                  const totalStrokePar = calcTotalStrokePar(
                                    roundScores,
                                    getHolePar,
                                    divisionCurrentRound,
                                    divisionIsFrontNine,
                                    divisionIsBackNine,
                                  );
                                  return formatStrokesToPar(divisionTotal, totalStrokePar);
                                })()}
                              </div>
                              <div
                                style={{
                                  textAlign: "center",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  height: "33.33%",
                                }}
                              >
                                {showHoleTimes ? (
                                  <>
                                    {secondsToMmss(
                                      calcTotalTime(roundHoleTimes, divisionIsFrontNine, divisionIsBackNine),
                                    )}
                                    <span style={{ marginLeft: "4px" }}>
                                      {(() => {
                                        const totalTimeSeconds = calcTotalTime(
                                          roundHoleTimes,
                                          divisionIsFrontNine,
                                          divisionIsBackNine,
                                        );
                                        const totalTimePar = calculateTotalTimePar(
                                          roundHoleTimes,
                                          divisionTeeData,
                                          divisionGender,
                                          divisionIsFrontNine,
                                          divisionIsBackNine,
                                        );
                                        return timeToPar(totalTimeSeconds, totalTimePar);
                                      })()}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    {elapsedTime}
                                    <span style={{ marginLeft: "4px" }}>
                                      {timeToPar(elapsedTimeInSeconds, timeParInSeconds)}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div
                                style={{
                                  textAlign: "center",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  height: "33.33%",
                                  paddingTop: "15px",
                                }}
                              >
                                {showHoleTimes ? (
                                  (() => {
                                    const totalSGS = calcTotalSGS(
                                      roundScores,
                                      roundHoleTimes,
                                      divisionIsFrontNine,
                                      divisionIsBackNine,
                                    );
                                    const totalSGSToPar = calcTotalSGSToPar(
                                      roundScores,
                                      roundHoleTimes,
                                      getHolePar,
                                      divisionCurrentRound,
                                      divisionTeeData,
                                      divisionGender,
                                      divisionIsFrontNine,
                                      divisionIsBackNine,
                                    );
                                    return formatSGSToPar(
                                      totalSGS.sgs,
                                      totalSGSToPar.par,
                                      totalSGSToPar.differenceSeconds,
                                    );
                                  })()
                                ) : (
                                  <>
                                    {sgs}
                                    {sgsToPar && sgsToPar !== "ND" && (
                                      <span style={{ marginLeft: "4px" }}>{sgsToPar}</span>
                                    )}
                                    {sgsToPar === "ND" && <span style={{ marginLeft: "4px" }}>ND</span>}
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                          {!finalResults && (
                            <td className="p-2 border">
                              <button
                                className={`btn btn-sm ${
                                  savedPlayers[player.userId]?.[selectedRound]
                                    ? "btn-success"
                                    : isSaveEnabled(player.userId)
                                      ? "btn-primary"
                                      : "btn-secondary disabled"
                                }`}
                                onClick={() => handleSaveScores(player)}
                                disabled={!isSaveEnabled(player.userId) || savedPlayers[player.userId]?.[selectedRound]}
                              >
                                {savedPlayers[player.userId]?.[selectedRound] ? "Saved" : "Save"}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            );
          })
        ) : (
          // Original single table rendering for specific division
          <>
            {/* Check if there are any players in this division */}
            {sortedDivisionPlayers.length === 0 ? (
              <div className="text-center p-4">
                <em>No players are registered in this division</em>
              </div>
            ) : (
              <>
                {/* Course and tee information for single division */}
                {currentDivision && selectedRound && (
                  <div className="mb-4">
                    <h3 className="text-xl font-bold text-gray-800 mb-2">
                      {(() => {
                        const roundIndex = selectedRound ? parseInt(selectedRound.slice(1)) - 1 : 0;
                        const currentRound =
                          currentDivision?.rounds && roundIndex >= 0 && roundIndex < currentDivision.rounds.length
                            ? currentDivision.rounds[roundIndex]
                            : null;

                        if (!currentRound) return "Course information not available";

                        const courseInfo = getCourseForRound(currentRound._id);
                        return `Round ${selectedRound.substring(1)}: ${courseInfo || "Course information not available"}`;
                      })()}
                    </h3>
                  </div>
                )}

                <table
                  className="border-collapse scorecard-table"
                  style={{
                    minWidth: isFullRound ? "1150px" : "750px",
                    fontSize: "0.85rem",
                    tableLayout: "fixed",
                    width: "auto",
                  }}
                >
                  {/* <thead> */}
                  <tbody>
                    <GolfCourseInfoTable
                      course={courseData}
                      selectedRound={selectedRoundObject}
                      units={units}
                      gender={divisionGender}
                      finalResults={finalResults}
                      onUnitsChange={onUnitsChange}
                      showUnitsToggle={true}
                    />
                    <tr>
                      {!finalResults && <th className="p-2 border text-left">Player</th>}
                      {!finalResults && <th className="p-2 border text-left">Div</th>}
                      {!finalResults && <th className="p-2 border">Start Time</th>}
                      {!finalResults && <th className="p-2 border">Finish Time</th>}
                      <th className="p-2 border" style={{ textAlign: "right" }}>
                        Hole
                      </th>
                      {(isFrontNine || isFullRound) &&
                        holes.slice(0, 9).map(holeNum => (
                          <th key={holeNum} className="p-2 border text-center w-12">
                            {holeNum}
                          </th>
                        ))}
                      {isBackNine &&
                        holes.map(holeNum => (
                          <th key={holeNum} className="p-2 border text-center w-12">
                            {holeNum}
                          </th>
                        ))}
                      {showOutColumn && <th className="p-2 border text-center">OUT</th>}
                      {isFullRound &&
                        holes.slice(9).map(holeNum => (
                          <th key={holeNum} className="p-2 border text-center w-12">
                            {holeNum}
                          </th>
                        ))}
                      {showInColumn && <th className="p-2 border text-center">IN</th>}
                      <th className="p-2 border text-center">TOTAL</th>
                      {/* <th className="p-2 border">TIME</th> */}
                      {/* <th className="p-2 border">SGS</th> */}
                      {!finalResults && <th className="p-2 border">Action</th>}
                    </tr>
                    {/* </thead> */}
                    {/* <tbody> */}
                    {sortedDivisionPlayers.map(player => {
                      const roundScores = scores[player.userId]?.[selectedRound] || {};
                      const roundHoleTimes = holeTimes[player.userId]?.[selectedRound] || {};
                      const playerStartTime =
                        startTimes[player.userId]?.[selectedRound] || getPlayerStartTime(player, roundDate);
                      const finishTime = finishTimes[player.userId]?.[selectedRound] || "--:--";

                      // Check if player can enter scores for this round (sequential completion constraint)
                      const canEnterCurrentRound = hasCompletedPreviousRound(player.userId, selectedRound);
                      const isRoundLocked = !canEnterCurrentRound;

                      const out = calcOutStrokes(roundScores);
                      const inScore = calcInStrokes(roundScores);
                      let total = 0;
                      if (isFullRound) {
                        total = calcTotalStrokes(roundScores, true, false, false);
                      } else if (isFrontNine) {
                        total = calcTotalStrokes(roundScores, false, true, false);
                      } else if (isBackNine) {
                        total = calcTotalStrokes(roundScores, false, false, true);
                      }

                      const elapsedTime = calculateTimeFromFinishAndStart(playerStartTime, finishTime);
                      const elapsedTimeInSeconds = mmssToSeconds(elapsedTime);

                      // Player comparison uses unified table header timePar for consistency
                      // This ensures all players are compared against the same baseline
                      const timeParInSeconds = timePar;

                      // Calculate time difference in seconds
                      const timeToParInSeconds = elapsedTimeInSeconds - timeParInSeconds;

                      const strokeToPar = calcTotalStrokesToPar(
                        roundScores,
                        getHolePar,
                        currentRound,
                        isFrontNine,
                        isBackNine,
                      );
                      const sgs = calculateSGS(total, elapsedTime);

                      // Simplified SGS to par calculation
                      const sgsToPar = sgs !== "--:--" ? computeSGSToPar(timeToParInSeconds, strokeToPar) : "ND";
                      const playerDivision = findDivisionById(player.division);
                      const divisionName = playerDivision?.name || "Unknown";

                      return (
                        <tr key={player.userId} className="player-data-row">
                          {/* Continue with the original player rendering logic */}
                          {/* Add class to identify player rows */}
                          {!finalResults && (
                            <td
                              style={{
                                width: "180px",
                                textAlign: "left",
                                padding: "8px",
                                border: "1px solid #dee2e6",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-start",
                                  width: "100%",
                                  textAlign: "left",
                                }}
                              >
                                <img
                                  src={player.profilePic || DefaultProfilePic}
                                  alt={player.playerName}
                                  style={{
                                    width: "40px",
                                    height: "40px",
                                    borderRadius: "50%",
                                    marginRight: "10px",
                                    objectFit: "cover",
                                    flexShrink: 0,
                                  }}
                                />
                                <div
                                  style={{
                                    fontSize: "14px",
                                    textAlign: "left",
                                    width: "100%",
                                    flex: 1,
                                  }}
                                >
                                  {player.playerName}
                                  {player.homeCountry && (
                                    <span
                                      className={`flag-icon flag-icon-${player.homeCountry.toLowerCase()}`}
                                      title={player.homeCountry}
                                      style={{ marginLeft: "8px" }}
                                    />
                                  )}
                                </div>
                              </div>
                            </td>
                          )}
                          {!finalResults && (
                            <td className="p-2 border" style={{ width: "70px" }}>
                              {divisionName}
                            </td>
                          )}
                          {!finalResults && (
                            <td className="p-2 border">
                              <input
                                type="time"
                                step="1"
                                className="w-full p-1 text-center"
                                value={playerStartTime !== "--:--" ? convertTo24Hour(playerStartTime) : ""}
                                onChange={e => handleStartTimeChange(player.userId, selectedRound, e.target.value)}
                              />
                            </td>
                          )}
                          {!finalResults && (
                            <td className="p-2 border">
                              <input
                                type="time"
                                step="1"
                                className="w-full p-1 text-center"
                                value={
                                  showHoleTimes
                                    ? calculateFinishTimeFromHoleTimes(playerStartTime, roundHoleTimes) !== "--:--"
                                      ? convertTo24Hour(
                                          calculateFinishTimeFromHoleTimes(playerStartTime, roundHoleTimes),
                                        )
                                      : ""
                                    : finishTime !== "--:--"
                                      ? convertTo24Hour(finishTime)
                                      : ""
                                }
                                disabled={showHoleTimes}
                                onChange={e => handleFinishTimeChange(player.userId, selectedRound, e.target.value)}
                              />
                            </td>
                          )}
                          {/* <td className="p-2 border">
                      <div className="d-flex flex-column">
                        <p style={{marginBottom: '0'}}>Strokes</p>
                        {showHoleTimes && <p style={{marginBottom: '0', padding: '.2rem 0', marginTop: '1rem'}}>Time</p>}
                        {showHoleTimes && <p style={{marginBottom: '0', marginTop: '3rem'}}>SGS</p>}
                      </div>

                    </td> */}
                          <td
                            className="p-2 border text-right scorecard-first-column"
                            style={{
                              height: showHoleTimes ? "220px" : "50px",
                              verticalAlign: "middle",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                alignItems: "flex-end",
                                height: "100%",
                                paddingRight: "8px",
                                textAlign: "right",
                                width: "100%",
                                paddingTop: "15px",
                                paddingBottom: "15px",
                              }}
                            >
                              <div
                                style={{
                                  textAlign: "right",
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  height: "33.33%",
                                  paddingBottom: "10px", // Match the Strokes data row padding in ScoreCellWithTime
                                }}
                              >
                                <strong>Strokes</strong>
                              </div>
                              <div
                                style={{
                                  textAlign: "right",
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  height: "33.33%",
                                  paddingTop: "10px", // Match the Time data row padding in ScoreCellWithTime
                                }}
                              >
                                <strong>Time</strong>
                              </div>
                              <div
                                style={{
                                  textAlign: "right",
                                  width: "100%",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "flex-end",
                                  height: "33.33%",
                                  paddingTop: "15px", // Match the SGS data row padding in ScoreCellWithTime
                                }}
                              >
                                <strong>SGS</strong>
                              </div>
                            </div>
                          </td>
                          {(isFrontNine || isFullRound) &&
                            holes
                              .slice(0, 9)
                              .map(holeNum => (
                                <ScoreCellWithTime
                                  key={holeNum}
                                  holeNum={holeNum}
                                  player={player}
                                  selectedRound={selectedRound}
                                  roundScores={roundScores}
                                  roundHoleTimes={roundHoleTimes}
                                  getHolePar={getHolePar}
                                  getScoreClass={getScoreClass}
                                  currentRound={currentRound}
                                  handleScoreChange={handleScoreChange}
                                  handleHoleTimeChange={handleHoleTimeChange}
                                  strokePar={teeData?.holes?.[holeNum - 1]?.[`${divisionGender}StrokePar`]}
                                  timePar={teeData?.holes?.[holeNum - 1]?.[`${divisionGender}TimePar`]}
                                  showHoleTimes={showHoleTimes}
                                  finalResults={finalResults}
                                  isRoundLocked={isRoundLocked}
                                  holeTimeMode={holeTimeMode}
                                />
                              ))}
                          {isBackNine &&
                            holes.map(holeNum => (
                              <ScoreCellWithTime
                                key={holeNum}
                                holeNum={holeNum}
                                player={player}
                                selectedRound={selectedRound}
                                roundScores={roundScores}
                                roundHoleTimes={roundHoleTimes}
                                getHolePar={getHolePar}
                                getScoreClass={getScoreClass}
                                currentRound={currentRound}
                                handleScoreChange={handleScoreChange}
                                handleHoleTimeChange={handleHoleTimeChange}
                                strokePar={teeData?.holes?.[holeNum - 1]?.[`${divisionGender}StrokePar`]}
                                timePar={teeData?.holes?.[holeNum - 1]?.[`${divisionGender}TimePar`]}
                                showHoleTimes={showHoleTimes}
                                finalResults={finalResults}
                                isRoundLocked={isRoundLocked}
                                holeTimeMode={holeTimeMode}
                              />
                            ))}
                          {showOutColumn && (
                            <td
                              className="p-2 border text-center scorecard-summary-column"
                              style={{
                                height: showHoleTimes ? "220px" : "50px",
                                fontSize: "0.85rem",
                                padding: "6px",
                                textAlign: "center",
                                verticalAlign: "middle",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  paddingTop: "15px",
                                  paddingBottom: "15px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "33.33%",
                                  }}
                                >
                                  {(() => {
                                    const outStrokePar = calcOutStrokePar(roundScores, getHolePar, currentRound);
                                    return formatStrokesToPar(out, outStrokePar);
                                  })()}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "33.33%",
                                  }}
                                >
                                  {showHoleTimes ? (
                                    <>
                                      {secondsToMmss(calcOutTime(roundHoleTimes))}
                                      <span style={{ marginLeft: "4px" }}>
                                        {(() => {
                                          const outTimeSeconds = calcOutTime(roundHoleTimes);
                                          // Use accumulator pattern for OUT time par (only holes with player data)
                                          // This differs from table header which uses all holes for consistency
                                          const outTimePar = calculateOutTimePar(
                                            roundHoleTimes,
                                            teeData,
                                            divisionGender,
                                          );
                                          return timeToPar(outTimeSeconds, outTimePar);
                                        })()}
                                      </span>
                                    </>
                                  ) : (
                                    "—"
                                  )}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "33.33%",
                                    paddingTop: "15px",
                                  }}
                                >
                                  {showHoleTimes
                                    ? (() => {
                                        const outSGS = calcOutSGS(roundScores, roundHoleTimes);
                                        const outSGSToPar = calcOutSGSToPar(
                                          roundScores,
                                          roundHoleTimes,
                                          getHolePar,
                                          currentRound,
                                          teeData,
                                          divisionGender,
                                        );
                                        return formatSGSToPar(
                                          outSGS.sgs,
                                          outSGSToPar.par,
                                          outSGSToPar.differenceSeconds,
                                        );
                                      })()
                                    : "—"}
                                </div>
                              </div>
                            </td>
                          )}
                          {isFullRound &&
                            holes
                              .slice(9)
                              .map(holeNum => (
                                <ScoreCellWithTime
                                  key={holeNum}
                                  holeNum={holeNum}
                                  player={player}
                                  selectedRound={selectedRound}
                                  roundScores={roundScores}
                                  roundHoleTimes={roundHoleTimes}
                                  getHolePar={getHolePar}
                                  getScoreClass={getScoreClass}
                                  currentRound={currentRound}
                                  handleScoreChange={handleScoreChange}
                                  handleHoleTimeChange={handleHoleTimeChange}
                                  strokePar={teeData?.holes?.[holeNum - 1]?.[`${divisionGender}StrokePar`]}
                                  timePar={teeData?.holes?.[holeNum - 1]?.[`${divisionGender}TimePar`]}
                                  showHoleTimes={showHoleTimes}
                                  finalResults={finalResults}
                                  isRoundLocked={isRoundLocked}
                                  holeTimeMode={holeTimeMode}
                                />
                              ))}
                          {showInColumn && (
                            <td
                              className="p-2 border text-center scorecard-summary-column"
                              style={{
                                height: showHoleTimes ? "220px" : "50px",
                                fontSize: "0.85rem",
                                padding: "6px",
                                textAlign: "center",
                                verticalAlign: "middle",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  paddingTop: "15px",
                                  paddingBottom: "15px",
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "33.33%",
                                  }}
                                >
                                  {(() => {
                                    const inStrokePar = calcInStrokePar(roundScores, getHolePar, currentRound);
                                    return formatStrokesToPar(inScore, inStrokePar);
                                  })()}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "33.33%",
                                  }}
                                >
                                  {showHoleTimes ? (
                                    <>
                                      {secondsToMmss(calcInTime(roundHoleTimes))}
                                      <span style={{ marginLeft: "4px" }}>
                                        {(() => {
                                          const inTimeSeconds = calcInTime(roundHoleTimes);
                                          // Use accumulator pattern for IN time par (only holes with player data)
                                          // This differs from table header which uses all holes for consistency
                                          const inTimePar = calculateInTimePar(roundHoleTimes, teeData, divisionGender);
                                          return timeToPar(inTimeSeconds, inTimePar);
                                        })()}
                                      </span>
                                    </>
                                  ) : (
                                    "—"
                                  )}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    height: "33.33%",
                                    paddingTop: "15px",
                                  }}
                                >
                                  {showHoleTimes
                                    ? (() => {
                                        const inSGS = calcInSGS(roundScores, roundHoleTimes);
                                        const inSGSToPar = calcInSGSToPar(
                                          roundScores,
                                          roundHoleTimes,
                                          getHolePar,
                                          currentRound,
                                          teeData,
                                          divisionGender,
                                        );
                                        return formatSGSToPar(inSGS.sgs, inSGSToPar.par, inSGSToPar.differenceSeconds);
                                      })()
                                    : "—"}
                                </div>
                              </div>
                            </td>
                          )}{" "}
                          <td
                            className="p-2 border text-center scorecard-summary-column"
                            style={{
                              height: showHoleTimes ? "220px" : "50px",
                              fontSize: "0.85rem",
                              padding: "6px",
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <div
                              style={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                justifyContent: "space-between",
                                alignItems: "center",
                                paddingTop: "15px",
                                paddingBottom: "15px",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  height: "33.33%",
                                }}
                              >
                                {(() => {
                                  const totalStrokePar = calcTotalStrokePar(
                                    roundScores,
                                    getHolePar,
                                    currentRound,
                                    isFrontNine,
                                    isBackNine,
                                  );
                                  return formatStrokesToPar(total, totalStrokePar);
                                })()}
                              </div>
                              <div
                                style={{
                                  textAlign: "center",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  height: "33.33%",
                                }}
                              >
                                {showHoleTimes ? (
                                  <>
                                    {secondsToMmss(calcTotalTime(roundHoleTimes, isFrontNine, isBackNine))}
                                    <span style={{ marginLeft: "4px" }}>
                                      {(() => {
                                        const totalTimeSeconds = calcTotalTime(roundHoleTimes, isFrontNine, isBackNine);
                                        // Use accumulator pattern for TOTAL time par when hole times enabled
                                        // This calculates par based only on holes with player data
                                        const totalTimePar = calculateTotalTimePar(
                                          roundHoleTimes,
                                          teeData,
                                          divisionGender,
                                          isFrontNine,
                                          isBackNine,
                                        );
                                        return timeToPar(totalTimeSeconds, totalTimePar);
                                      })()}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    {elapsedTime}
                                    <span style={{ marginLeft: "4px" }}>
                                      {/* Use unified table header timePar when hole times disabled */}
                                      {timeToPar(elapsedTimeInSeconds, timeParInSeconds)}
                                    </span>
                                  </>
                                )}
                              </div>
                              <div
                                style={{
                                  textAlign: "center",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  height: "33.33%",
                                  paddingTop: "15px",
                                }}
                              >
                                {showHoleTimes ? (
                                  (() => {
                                    const totalSGS = calcTotalSGS(roundScores, roundHoleTimes, isFrontNine, isBackNine);
                                    const totalSGSToPar = calcTotalSGSToPar(
                                      roundScores,
                                      roundHoleTimes,
                                      getHolePar,
                                      currentRound,
                                      teeData,
                                      divisionGender,
                                      isFrontNine,
                                      isBackNine,
                                    );
                                    return formatSGSToPar(
                                      totalSGS.sgs,
                                      totalSGSToPar.par,
                                      totalSGSToPar.differenceSeconds,
                                    );
                                  })()
                                ) : (
                                  <>
                                    {sgs}
                                    {sgsToPar && sgsToPar !== "ND" && (
                                      <span style={{ marginLeft: "4px" }}>{sgsToPar}</span>
                                    )}
                                    {sgsToPar === "ND" && <span style={{ marginLeft: "4px" }}>ND</span>}
                                  </>
                                )}
                              </div>
                            </div>
                          </td>
                          {/* <td className="p-2 border text-center">
                      <strong>{elapsedTime} </strong>
                      {timeToParInSeconds
                        ? (() => {
                            const absTime = Math.abs(timeToParInSeconds);
                            const mins = Math.floor(absTime / 60);
                            const secs = Math.floor(absTime % 60)
                              .toString()
                              .padStart(2, "0");
                            return `(${isTimeToParNegative ? "-" : ""}${mins}:${secs})`;
                          })()
                        : "E"}
                    </td>
                    <td className="p-2 border text-center">
                      {sgs} {sgsToPar}
                    </td> */}
                          {!finalResults && (
                            <td className="p-2 border">
                              <button
                                className={`btn btn-sm ${
                                  savedPlayers[player.userId]?.[selectedRound]
                                    ? "btn-success"
                                    : isSaveEnabled(player.userId)
                                      ? "btn-primary"
                                      : "btn-secondary disabled"
                                }`}
                                onClick={() => handleSaveScores(player)}
                                disabled={!isSaveEnabled(player.userId) || savedPlayers[player.userId]?.[selectedRound]}
                              >
                                {savedPlayers[player.userId]?.[selectedRound] ? "Saved" : "Save"}
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </div>{" "}
      {!finalResults && (
        <div className="mt-4 text-center">
          <button
            onClick={handleExit}
            className={`btn ${unsavedChanges ? "btn-danger" : "btn-primary"}`}
            style={{
              backgroundColor: unsavedChanges ? "#dc3545" : "#13294e",
            }}
          >
            {unsavedChanges ? "Back to Tournament with Unsaved Changes" : "Back to Tournament"}
          </button>
        </div>
      )}
    </div>
  );
};

export default TournamentScoresPage;
