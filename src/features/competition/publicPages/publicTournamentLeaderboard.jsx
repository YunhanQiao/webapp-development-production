import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Container, Spinner } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { getPublicTournamentLeaderboard, getPublicTournamentTeesheet } from "../competitionServices";
import { createLocalDate } from "../utils/dateUtils";
import useIsMobile from "../../../hooks/useIsMobile";
import "flag-icon-css/css/flag-icons.min.css";
import "../../../styles/features/competition/publicLeaderboardMobile.css";

/**
 * @fileoverview PublicTournamentLeaderboard - Public-facing tournament leaderboard with temporary TO PAR workaround
 *
 * This component displays tournament leaderboards for public access without authentication requirements.
 * It includes a comprehensive workaround for TO PAR column limitations due to backend API restrictions
 * and enhanced UI refinements for consistent display across tournament types.
 *
 * **Recent Major Changes (January 2025):**
 *
 * ## TO PAR Column Temporary Removal
 * **Issue:** Public API endpoints lack authentication context to access detailed course data (tees, pars, gender-specific par calculations)
 * **Root Cause:** Backend architecture separates public and authenticated endpoints, preventing access to course.tees data
 * **Solution:** Temporary removal of TO PAR column with easy restoration path when backend is updated
 *
 * **Implementation Details:**
 * - TO PAR column header and data cells are commented out with restoration notes
 * - Comments include specific markers: "TEMPORARILY COMMENTED OUT - TO PAR column requires course data from authenticated API"
 * - Original column structure preserved for easy restoration when backend supports course data in public endpoints
 * - TOTAL column replaces TO PAR functionality as primary scoring reference
 *
 * ## Column Structure Optimization
 * **Multi-Round Tournaments:**
 * - POS | PLAYER | TOTAL | THRU | R1 SGS | R1 STR | R1 TIME | R2 SGS | R2 STR | R2 TIME | ...
 * - TOTAL column uses #cc2127 red background to match PLAYER column styling
 * - SGS columns conditionally rendered only for multi-round tournaments
 *
 * **Single-Round Tournaments:**
 * - POS | PLAYER | TOTAL | THRU | STR | TIME
 * - SGS column completely removed to eliminate redundancy (SGS same as TOTAL in single rounds)
 * - Conditional rendering: `{!singleRound && ...}` pattern used throughout
 *
 * ## UI Consistency Improvements
 * **Color Standardization:**
 * - Standard columns (POS, PLAYER, TOTAL, THRU): #cc2127 red background
 * - SGS columns: #000000 black background
 * - STR/TIME columns: #13294E dark blue background
 * - All headers: #FFFFFF white text with center alignment
 *
 * **Responsive Design:**
 * - Maintains Bootstrap table responsiveness
 * - Clean white/light gray row banding preserved
 * - Consistent 20px padding eliminates layout awkwardness
 *
 * ## Data Flow Architecture
 * **Player Processing:**
 * - Uses scoreCards method for accurate score calculations
 * - Handles both tournament-level and division-level player data structures
 * - Implements proper SGS calculation: `(strokes × 60) + time_in_seconds`
 * - Fallback handling for missing or incomplete scorecard data
 *
 * **Division Handling:**
 * - "All Divisions" view shows all divisions regardless of player count
 * - Individual division selection filters appropriately
 * - Empty divisions display with proper headers and "no players" messaging
 *
 * ## Restoration Path for TO PAR Column
 * **When Backend is Updated:**
 * 1. Search for "TEMPORARILY COMMENTED OUT - TO PAR" comments
 * 2. Uncomment TO PAR header: `<th style={tableHeaderStyle}>TO PAR</th>`
 * 3. Uncomment TO PAR data cell: `<td className="text-center">{player.formattedToPar || "--"}</td>`
 * 4. Verify course data is accessible via public API endpoints
 * 5. Test par calculations for both 9-hole and 18-hole rounds
 * 6. Validate gender-specific par handling for mixed divisions
 *
 * **Required Backend Changes:**
 * - Public tournament endpoints must include course.tees data
 * - Gender-specific par calculation support (mens/womens/mixed divisions)
 * - Proper authentication context for course data access in public routes
 *
 * ## Technical Dependencies
 * - React 18+ with hooks (useState, useEffect, useRef, useCallback)
 * - React Router for URL parameter handling
 * - Bootstrap 5 for responsive table layout
 * - FontAwesome for trophy icons (top 3 finishers)
 * - flag-icon-css for country flag integration
 * - Custom competitionServices for API communication
 *
 * @component
 * @since 2.0.0
 * @version 2.1.0
 * @author GitHub Copilot
 * @last-modified 2025-01-17
 *
 * @example
 * // Basic usage in public tournament routing
 * <Route path="/competitions/u/:uniqueName/leaderboard" component={PublicTournamentLeaderboard} />
 *
 * @example
 * // Direct component usage (for testing)
 * <PublicTournamentLeaderboard />
 * // Reads tournament uniqueName from URL params
 *
 * @changelog
 * v2.1.0 - Temporary TO PAR column removal due to backend API limitations
 *        - Column structure optimization for single vs multi-round tournaments
 *        - Enhanced color consistency across all table headers
 *        - Conditional SGS column rendering to eliminate redundancy
 *        - Comprehensive restoration documentation for future backend updates
 * v2.0.0 - Initial public leaderboard implementation with full feature set
 *        - Multi-round tournament support with speedgolf calculations
 *        - Country flags and trophy icons integration
 *        - Responsive Bootstrap table layout with clean styling
 *
 * @see {@link TournamentLeaderboardPage} For internal leaderboard with full TO PAR support
 * @see {@link competitionServices} For API communication methods
 */

/**
 * PublicTournamentLeaderboard Component
 *
 * Displays a public leaderboard for tournament competitions with the following features:
 * - Left-justified layout with consistent 20px padding to eliminate awkward spacing
 * - Responsive Bootstrap table with clean white/light gray row banding
 * - Country flags integration using flag-icon-css library
 * - FontAwesome trophy icons for top 3 finishers (shown only when tournament is over)
 * - Consistent breadcrumb navigation with year + tournament name format
 * - Enhanced banner date contrast (white text on dark background)
 * - Empty division support with headers and "no players" messages
 * - Multi-round tournament support with speedgolf scoring calculations
 * - **TEMPORARY:** TO PAR column removed due to backend API limitations (easy restoration path included)
 * - **ENHANCED:** Optimized column structure for single vs multi-round tournaments
 *
 * @component
 * @example
 * // Used in routing for public tournament pages
 * <Route path="/competitions/u/:uniqueName/leaderboard" component={PublicTournamentLeaderboard} />
 *
 * @returns {JSX.Element} Complete tournament leaderboard interface
 */

const PublicTournamentLeaderboard = () => {
  const { uniqueName } = useParams();
  const isMobile = useIsMobile();

  const [isLoading, setIsLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [selectedDivisionId, setSelectedDivisionId] = useState("");
  const [error, setError] = useState(null);

  // Ref for the division select element
  const divisionSelectRef = useRef(null);

  /**
   * Helper function to find division by ID
   */
  const findDivisionById = useCallback(
    divisionId => {
      if (!tournament || !tournament.divisions) return null;
      return tournament.divisions.find(d => d._id === divisionId);
    },
    [tournament],
  );

  /**
   * Retrieves tee time for a specific player and round
   * Matches the sophisticated logic from internal leaderboard
   */
  const getTeeTimeForPlayer = useCallback(
    (playerId, roundId) => {
      if (!tournament || !tournament.teeSheet || !tournament.teeSheet.playerAssignments) {
        return null;
      }

      const playerAssignment = tournament.teeSheet.playerAssignments.find(
        assignment => assignment.playerId === playerId,
      );

      if (!playerAssignment || !playerAssignment.roundAssignments) {
        return null;
      }

      const player = tournament.players.find(p => p.userId === playerId);
      if (!player) {
        return null;
      }

      const division = findDivisionById(player.division);
      if (!division) {
        return null;
      }

      const round = division.rounds.find(r => r._id === roundId);
      if (!round) {
        return null;
      }

      const roundAssignment = playerAssignment.roundAssignments.find(ra => ra.date === round.date);

      if (!roundAssignment) {
        return null;
      }

      return roundAssignment?.teeTime || null;
    },
    [tournament, findDivisionById],
  );

  /**
   * Retrieves theme colors for tournament branding
   *
   * @returns {Object} Theme color configuration with fallback defaults
   * @property {string} titleText - Title text color
   * @property {string} tournNameBannerBg - Tournament banner background color
   * @property {string} sgParColBg - Speed Golf Score column background
   * @property {string} strParColBg - Strokes column background
   * @property {string} timeParColBg - Time column background
   */
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

  /**
   * Fetches tournament leaderboard data from API
   * Sets up tournament state and default division selection
   *
   * @async
   * @function fetchTournament
   * @throws {Error} When API call fails or returns invalid data
   */
  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setIsLoading(true);

        // Fetch both leaderboard and tee sheet data
        const [leaderboardResponse, teesheetResponse] = await Promise.all([
          getPublicTournamentLeaderboard(uniqueName),
          getPublicTournamentTeesheet(uniqueName),
        ]);

        if (leaderboardResponse.status === 200 && leaderboardResponse.data.success) {
          const data = leaderboardResponse.data.data;

          // Merge tee sheet data if available
          if (teesheetResponse.status === 200 && teesheetResponse.data.success) {
            const teesheetData = teesheetResponse.data.data;
            data.teeSheet = teesheetData.teeSheet;
          }

          setTournament(data);

          // Set default division to "All"
          setSelectedDivisionId("All");
        } else {
          throw new Error(leaderboardResponse.data.message || "Failed to fetch tournament leaderboard");
        }
      } catch (err) {
        console.error("Error fetching tournament leaderboard:", err);
        setError("Failed to load tournament leaderboard. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    if (uniqueName) {
      fetchTournament();
    }
  }, [uniqueName]);

  const themeColors = getThemeColors();

  if (isLoading) {
    return (
      <div style={{ paddingTop: "50px", paddingLeft: "20px", paddingRight: "20px" }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading tournament leaderboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ paddingTop: "50px", paddingLeft: "20px", paddingRight: "20px" }}>
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div style={{ paddingTop: "50px", paddingLeft: "20px", paddingRight: "20px" }}>
        <div className="alert alert-warning">Tournament not found or not published.</div>
      </div>
    );
  }

  // Destructure tournament data - public API uses tournamentInfo structure
  const { tournamentInfo, divisions = [], players = [] } = tournament;

  return (
    <>
      <Container fluid style={{ paddingTop: "50px" }}>
        {/* Breadcrumb Navigation */}
        <nav aria-label="breadcrumb" className="mb-3" style={{ paddingLeft: "20px", paddingRight: "20px" }}>
          <div className="d-flex justify-content-start">
            <ol
              className="breadcrumb mb-0"
              style={{
                fontSize: "0.875rem",
                "--bs-breadcrumb-divider": "'>';",
              }}
            >
              <li className="breadcrumb-item">
                <a
                  href="/competitions/public"
                  style={{
                    color: "#6c757d",
                    textDecoration: "none",
                  }}
                  onMouseOver={e => (e.target.style.textDecoration = "underline")}
                  onMouseOut={e => (e.target.style.textDecoration = "none")}
                >
                  Tournaments
                </a>
              </li>
              <li className="breadcrumb-item">
                <a
                  href={`/competitions/u/${uniqueName}`}
                  style={{
                    color: "#6c757d",
                    textDecoration: "none",
                  }}
                  onMouseOver={e => (e.target.style.textDecoration = "underline")}
                  onMouseOut={e => (e.target.style.textDecoration = "none")}
                >
                  {tournamentInfo?.startDate && tournamentInfo?.name
                    ? (() => {
                        // Create timezone-safe date to get year
                        const dateOnly = tournamentInfo.startDate.split("T")[0];
                        const [year] = dateOnly.split("-").map(Number);
                        return `${year} ${tournamentInfo.name}`;
                      })()
                    : uniqueName}
                </a>
              </li>
              <li
                className="breadcrumb-item active"
                aria-current="page"
                style={{ color: "#495057", fontWeight: "500" }}
              >
                Leaderboard
              </li>
            </ol>
          </div>
        </nav>

        {/* Tournament Header Banner - full width */}
        <div
          style={{
            backgroundColor: themeColors.tournNameBannerBg,
            color: "#FFFFFF",
            padding: "20px",
            borderRadius: "0",
            marginBottom: "20px",
            width: "100%",
          }}
          className="mb-4"
        >
          <div style={{ paddingLeft: "20px", paddingRight: "20px" }}>
            <div className="d-flex align-items-center">
              <img
                src={tournamentInfo?.logo || "../../../../images/DefaultGolfCoursePic.jpg"}
                alt={`${tournamentInfo?.name} logo`}
                style={{
                  height: "60px",
                  width: "auto",
                  marginRight: "20px",
                  objectFit: "contain",
                }}
                onError={e => {
                  e.target.src = "../../../../images/DefaultGolfCoursePic.jpg";
                }}
              />
              <div>
                <h2 className="mb-0">{tournamentInfo?.name}: Leaderboard</h2>
                <p className="m-0" style={{ color: "#FFFFFF" }}>
                  {tournamentInfo?.startDate && tournamentInfo?.endDate
                    ? (() => {
                        // Use imported createLocalDate utility
                        const startDate = createLocalDate(tournamentInfo.startDate);
                        const endDate = createLocalDate(tournamentInfo.endDate);
                        return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
                      })()
                    : tournamentInfo?.startDate
                      ? (() => {
                          // Use imported createLocalDate utility
                          return createLocalDate(tournamentInfo.startDate).toLocaleDateString();
                        })()
                      : "Dates not available"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ paddingLeft: "20px", paddingRight: "20px" }}>
          {/* Division selection */}
          <div className="mb-4">
            <div className="d-flex align-items-center">
              <label htmlFor="division-select" className="me-0" style={{ whiteSpace: "nowrap" }}>
                Division:&nbsp;
              </label>
              <select
                id="division-select"
                ref={divisionSelectRef}
                className="form-select form-select-sm"
                value={selectedDivisionId}
                onChange={e => setSelectedDivisionId(e.target.value)}
                style={{ width: "auto", minWidth: "120px" }}
              >
                <option value="All">All</option>
                {divisions?.map(division => (
                  <option key={division._id} value={division._id}>
                    {division.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Retrieved timestamp matching internal leaderboard */}
          <div className="mb-3 text-muted small">
            Retrieved at {new Date().toLocaleTimeString()} on{" "}
            {new Date().toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </div>

          {/* Tournament leaderboard content */}
          {players && players.length > 0 ? (
            <div>
              {(() => {
                /**
                 * Process divisions and players for leaderboard display
                 *
                 * Key processing steps:
                 * 1. Filter players by division and withdrawal status
                 * 2. Calculate speedgolf scores from scoreCards data
                 * 3. Sort players by total speedgolf score (lowest wins)
                 * 4. Apply responsive table styling with clean row banding
                 * 5. Display country flags and tournament completion trophies
                 *
                 * @returns {JSX.Element} Processed division tables with player data
                 */
                // Process divisions for the current selection
                const processedDivisions = divisions.map(division => {
                  // Filter players for this division
                  const divisionPlayers =
                    players?.filter(player => player.division === division._id && player.status !== "withdrawn") || [];

                  // Process each player using scoreCards method from working version
                  const processedPlayers = divisionPlayers.map(player => {
                    const roundDetailsMap = {};

                    // Initialize round details for all rounds in division
                    if (division.rounds) {
                      division.rounds.forEach((round, index) => {
                        const roundKey = `R${index + 1}`;
                        const teeTime = getTeeTimeForPlayer(player.userId, round._id);

                        roundDetailsMap[roundKey] = {
                          id: round._id,
                          strokes: null,
                          time: null,
                          speedGolfScore: null,
                          completed: false,
                          teeTime: teeTime, // Add tee time for uncompleted rounds
                        };
                      });
                    }

                    // Process scoreCards to populate actual scores
                    if (player.scoreCards && player.scoreCards.length > 0) {
                      player.scoreCards.forEach(scorecard => {
                        const roundIndex = division.rounds?.findIndex(r => r._id === scorecard.roundId);
                        if (roundIndex !== -1) {
                          const roundKey = `R${roundIndex + 1}`;

                          roundDetailsMap[roundKey] = {
                            id: scorecard.roundId,
                            strokes: scorecard.totalScore || 0,
                            time: scorecard.totalTime || "--:--",
                            speedGolfScore: scorecard.speedGolfScore || 0,
                            completed: true,
                          };
                        }
                      });
                    }

                    // Calculate totals
                    let totalStrokes = 0;
                    let totalPar = 0;
                    let completedRounds = [];
                    let totalSGSSeconds = 0;
                    let hasCompletedRounds = false;

                    // Helper function to convert time to seconds
                    /**
                     * Converts time string to seconds for speedgolf calculations
                     * @param {string} timeStr - Time in format "MM:SS" or "HH:MM:SS"
                     * @returns {number} Total seconds
                     */
                    const timeToSeconds = timeStr => {
                      if (!timeStr || timeStr === "-" || timeStr === "--:--") return 0;
                      if (!timeStr.includes(":")) return parseInt(timeStr, 10) || 0;

                      const parts = timeStr.split(":");
                      if (parts.length === 2) {
                        return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
                      } else if (parts.length === 3) {
                        return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
                      }
                      return 0;
                    };

                    // Helper function to convert seconds back to time
                    /**
                     * Converts seconds back to time string format
                     * @param {number} seconds - Total seconds
                     * @returns {string} Time in format "MM:SS"
                     */
                    const secondsToTime = seconds => {
                      if (seconds === 0) return "-";
                      const totalMinutes = Math.floor(seconds / 60);
                      const remainingSeconds = seconds % 60;
                      return `${totalMinutes}:${String(remainingSeconds).padStart(2, "0")}`;
                    };

                    // Sum up all completed rounds
                    Object.keys(roundDetailsMap).forEach(roundKey => {
                      const roundData = roundDetailsMap[roundKey];
                      if (roundData.completed) {
                        totalStrokes += roundData.strokes;
                        totalPar += 72; // Assuming par 72 per round
                        totalSGSSeconds += timeToSeconds(roundData.speedGolfScore);
                        completedRounds.push(roundKey);
                        hasCompletedRounds = true;
                      }
                    });

                    const toPar = totalStrokes - totalPar;
                    let formattedToPar = "";
                    if (hasCompletedRounds) {
                      if (toPar < 0) {
                        formattedToPar = toPar.toString();
                      } else if (toPar > 0) {
                        formattedToPar = `+${toPar}`;
                      } else {
                        formattedToPar = "E";
                      }
                    } else {
                      formattedToPar = "—";
                    }

                    // Calculate sophisticated thruStatus with tee times (matching internal leaderboard logic)
                    let thruStatus;
                    if (hasCompletedRounds && completedRounds.length === division.rounds?.length) {
                      // All rounds completed
                      thruStatus = "F";
                    } else if (completedRounds.length > 0) {
                      // Some rounds completed - show current hole count
                      const currentRoundKey = completedRounds.sort().slice(-1)[0];
                      const currentRoundIdx = parseInt(currentRoundKey.replace("R", "")) - 1;
                      const currentRoundId = division.rounds[currentRoundIdx]?._id;
                      const scorecard = player.scoreCards?.find(sc => sc.roundId === currentRoundId);

                      if (scorecard && scorecard.scores) {
                        const holesWithData = scorecard.scores.length;
                        thruStatus = holesWithData.toString();
                      } else {
                        thruStatus = `R${completedRounds.length}`;
                      }
                    } else {
                      // No rounds completed - show first round's tee time with date formatting
                      const upcomingRound = Object.keys(roundDetailsMap)[0];
                      const upcomingRoundData = roundDetailsMap[upcomingRound];

                      // Format tee time with date for THRU column
                      const formatTeeTimeWithDate = (teeTime, roundIndex) => {
                        if (!teeTime) return null;

                        const divisionRound = division.rounds?.[roundIndex];
                        if (divisionRound?.date) {
                          const date = new Date(divisionRound.date);
                          const formattedDate = date.toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                          });
                          // Clean up time format - remove zero padding and seconds
                          const cleanTime = teeTime
                            .replace(/^0/, "")
                            .replace(/:00(:00)?(\s|$)/, " ")
                            .trim();
                          return `${formattedDate} at ${cleanTime}`;
                        }
                        return teeTime
                          .replace(/^0/, "")
                          .replace(/:00(:00)?(\s|$)/, " ")
                          .trim();
                      };

                      // Try to get tee time from roundDetailsMap first
                      const firstRoundTeeTime = upcomingRoundData?.teeTime;
                      if (firstRoundTeeTime) {
                        thruStatus = formatTeeTimeWithDate(firstRoundTeeTime, 0);
                      } else {
                        // If still no tee time, try the original method as fallback
                        const teeTime = getTeeTimeForPlayer(player.userId, upcomingRoundData?.id);
                        thruStatus = teeTime ? formatTeeTimeWithDate(teeTime, 0) : "—";
                      }
                    }

                    const totalSGSFormatted = hasCompletedRounds ? secondsToTime(totalSGSSeconds) : null;

                    return {
                      id: player.userId,
                      name: player.playerName || player.name || "Unknown Player",
                      profilePic: player.profilePic,
                      homeCountry: player.homeCountry,
                      divisionId: player.division,
                      totalSGS: totalSGSFormatted,
                      totalStrokes: hasCompletedRounds ? totalStrokes : null,
                      totalTime: hasCompletedRounds ? secondsToTime(totalSGSSeconds) : null,
                      hasScores: hasCompletedRounds,
                      formattedToPar,
                      thruStatus,
                      toPar,
                      roundDetails: roundDetailsMap,
                      completedRoundCount: completedRounds.length,
                      totalSGSSeconds: totalSGSSeconds,
                    };
                  });

                  // Sort players (those without scores go to bottom, others by lowest SGS)
                  const sortedPlayers = processedPlayers.sort((a, b) => {
                    if (!a.hasScores && !b.hasScores) return 0;
                    if (!a.hasScores) return 1;
                    if (!b.hasScores) return -1;
                    return (a.totalSGSSeconds || Infinity) - (b.totalSGSSeconds || Infinity);
                  });

                  // Determine round options
                  const roundOptions = division.rounds?.map((_, index) => `R${index + 1}`) || ["R1"];

                  /**
                   * Single Round Detection for Column Structure Optimization
                   *
                   * Determines if this division has only one round to optimize column display:
                   * - Single Round: POS | PLAYER | TOTAL | THRU | STR | TIME
                   * - Multi Round: POS | PLAYER | TOTAL | THRU | R1 SGS | R1 STR | R1 TIME | R2 SGS | R2 STR | R2 TIME | ...
                   *
                   * Key Optimization: SGS columns are hidden for single-round tournaments because:
                   * - In single rounds, SGS value equals TOTAL value (redundant display)
                   * - TOTAL column provides same information with cleaner presentation
                   * - Conditional rendering pattern: `{!singleRound && ...}` used throughout
                   *
                   * @type {boolean} True if division has only one round, false for multi-round tournaments
                   */
                  const singleRound = roundOptions.length === 1;

                  // Extract actual course info from division rounds
                  let courseInfo = "Course information not available";
                  if (division.rounds && division.rounds.length > 0) {
                    const courseDetails = division.rounds.map((round, index) => {
                      let courseName = "Unknown Course";

                      // Extract course name from tournament.courses
                      if (round.courseId && tournament.courses) {
                        const courseData = tournament.courses.find(
                          c => c._id === round.courseId || c.courseId === round.courseId,
                        );
                        if (courseData) {
                          courseName = courseData.name.split(",")[0]; // Take first part before comma
                        }
                      }

                      // Since tee data is not available in API, just show course name
                      return `R${index + 1}: ${courseName}`;
                    });

                    courseInfo = courseDetails.join(" | ");
                  }

                  return {
                    division,
                    players: sortedPlayers,
                    roundOptions,
                    singleRound,
                    courseInfo,
                  };
                });

                // Filter to show divisions based on selection (always show divisions even if no players)
                const divisionsToShow =
                  selectedDivisionId === "All"
                    ? processedDivisions
                    : processedDivisions.filter(d => d.division._id === selectedDivisionId);

                if (divisionsToShow.length === 0) {
                  return (
                    <div className="p-4">
                      <em>No divisions found for the selected criteria</em>
                    </div>
                  );
                }

                // Table header styling to match original version
                /**
                 * Tournament Leaderboard Column Styling Architecture
                 *
                 * Implements consistent color scheme across all tournament leaderboard tables:
                 *
                 * **Standard Columns (Red #cc2127):**
                 * - POS: Position/ranking column
                 * - PLAYER: Player name and country flag
                 * - TOTAL: Combined speedgolf score (replaces TO PAR temporarily)
                 * - THRU: Holes completed indicator
                 *
                 * **SGS Columns (Black #000000):**
                 * - R1 SGS, R2 SGS, etc.: Individual round speedgolf scores
                 * - Only displayed for multi-round tournaments (!singleRound)
                 * - Hidden for single rounds to eliminate redundancy with TOTAL
                 *
                 * **Round Data Columns (Dark Blue #13294E):**
                 * - STR: Stroke count per round
                 * - TIME: Time taken per round
                 * - Consistent across both single and multi-round formats
                 *
                 * **Color Consistency Notes:**
                 * - TOTAL column in multi-round uses #cc2127 to match PLAYER column
                 * - All headers use #FFFFFF white text for optimal contrast
                 * - Styling matches internal TournamentLeaderboardPage for brand consistency
                 *
                 * @constant {Object} tableHeaderStyle Base styling for standard columns
                 */
                const tableHeaderStyle = {
                  backgroundColor: "#cc2127", // Red background like original
                  color: "#FFFFFF", // White text like original
                  textAlign: "center",
                  verticalAlign: "middle",
                  padding: "8px",
                };

                return (
                  <div>
                    {divisionsToShow.map(({ division, players, roundOptions, singleRound, courseInfo }) => (
                      <div key={division._id} className="mb-5">
                        {/* Division Header */}
                        <div className="mb-3">
                          <h3
                            className="mb-2"
                            style={{
                              fontSize: "1.5rem",
                              fontWeight: "700",
                              color: "#000000", // Black division headers like original
                              borderBottom: "2px solid #000000", // Black border
                              paddingBottom: "8px",
                            }}
                          >
                            {division.name} Division
                          </h3>
                          <div
                            className="text-lg"
                            style={{
                              fontSize: "1.125rem",
                              fontWeight: "500",
                              marginBottom: "12px",
                              color: "#666666",
                            }}
                          >
                            {courseInfo}
                          </div>
                        </div>

                        {/* Division Table */}
                        {players.length > 0 ? (
                          isMobile ? (
                            // Mobile Card Layout
                            <div className="mobile-cards-container">
                              {players.map((player, index) => {
                                // Calculate trophy display logic
                                const totalRounds = division.rounds?.length || 0;
                                const playersWithAllRoundsCompleted = players.filter(
                                  p => p.completedRoundCount === totalRounds && totalRounds > 0,
                                ).length;
                                const totalPlayersInDivision = players.length;
                                const minimumForTrophies = Math.min(3, totalPlayersInDivision);
                                const completionRate =
                                  totalPlayersInDivision > 0
                                    ? playersWithAllRoundsCompleted / totalPlayersInDivision
                                    : 0;

                                // Show trophies when enough players have completed all rounds
                                const shouldShowTrophies =
                                  playersWithAllRoundsCompleted >= minimumForTrophies && completionRate >= 0.9;

                                return (
                                  <div key={player.id} className="mobile-player-card">
                                    {/* Position Badge */}
                                    <div className="position-badge">{index + 1}</div>

                                    {/* Player Info Row */}
                                    <div className="player-info-row">
                                      <img
                                        src={player.profilePic || "/images/DefaultProfilePic.jpg"}
                                        alt={`${player.name} profile`}
                                        className="player-avatar"
                                        onError={e => {
                                          e.target.src = "/images/DefaultProfilePic.jpg";
                                        }}
                                      />
                                      <span className="player-name">{player.name}</span>
                                      {player.homeCountry && (
                                        <span
                                          className={`flag-icon flag-icon-${player.homeCountry.toLowerCase()}`}
                                          title={player.homeCountry}
                                        />
                                      )}
                                      {/* Trophy icons for top 3 finishers */}
                                      {(() => {
                                        if (player.hasScores && shouldShowTrophies) {
                                          if (index === 0) {
                                            return (
                                              <FontAwesomeIcon
                                                icon={faTrophy}
                                                className="trophy-icon"
                                                style={{ color: "#FFD700" }}
                                                title="1st Place Champion"
                                              />
                                            );
                                          } else if (index === 1) {
                                            return (
                                              <FontAwesomeIcon
                                                icon={faTrophy}
                                                className="trophy-icon"
                                                style={{ color: "#C0C0C0" }}
                                                title="2nd Place"
                                              />
                                            );
                                          } else if (index === 2) {
                                            return (
                                              <FontAwesomeIcon
                                                icon={faTrophy}
                                                className="trophy-icon"
                                                style={{ color: "#CD7F32" }}
                                                title="3rd Place"
                                              />
                                            );
                                          }
                                        }
                                        return null;
                                      })()}
                                    </div>

                                    {/* Score Data */}
                                    <div className="score-data">
                                      {/* TOTAL and THRU line */}
                                      <div className="score-line summary-line">
                                        <div className="score-item">
                                          <span className="score-label">TOTAL</span>
                                          <span className="score-value">
                                            {!singleRound && (player.hasScores ? player.totalSGS || "—" : "—")}
                                            {singleRound &&
                                              (player.hasScores
                                                ? player.formattedSGS ||
                                                  (player.roundDetails &&
                                                    Object.values(player.roundDetails)[0]?.speedGolfScore) ||
                                                  "—"
                                                : "—")}
                                          </span>
                                        </div>
                                        <div className="score-item">
                                          <span className="score-label">THRU</span>
                                          <span className="score-value">
                                            {player.hasScores
                                              ? player.thruStatus
                                              : player.thruStatus && player.thruStatus !== "—"
                                                ? player.thruStatus
                                                : "—"}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Round data lines */}
                                      {roundOptions.map((round, roundIndex) => {
                                        const roundData = player.roundDetails[round];
                                        const shouldShowTeeTime =
                                          !roundData?.completed &&
                                          roundData?.teeTime &&
                                          player.completedRoundCount > 0 &&
                                          roundIndex >= player.completedRoundCount;

                                        const formatTeeTimeWithDate = (teeTime, roundInfo) => {
                                          if (!teeTime) return null;
                                          const currentDivision = divisionsToShow.find(
                                            d => d.division._id === player.divisionId,
                                          )?.division;
                                          const divisionRound = currentDivision?.rounds?.[roundIndex];
                                          if (divisionRound?.date) {
                                            const date = new Date(divisionRound.date);
                                            const formattedDate = date.toLocaleDateString("en-GB", {
                                              day: "numeric",
                                              month: "short",
                                            });
                                            const cleanTime = teeTime
                                              .replace(/^0/, "")
                                              .replace(/:00(:00)?(\s|$)/, "$1");
                                            return `${formattedDate} at ${cleanTime}`;
                                          }
                                          return teeTime.replace(/^0/, "").replace(/:00(:00)?(\s|$)/, "$1");
                                        };

                                        return (
                                          <div key={`${player.id}-${round}`} className="score-line round-line">
                                            {!singleRound && (
                                              <div className="score-item">
                                                <span className="score-label">{round} SGS</span>
                                                <span className="score-value">
                                                  {roundData?.completed ? (
                                                    roundData.speedGolfScore
                                                  ) : shouldShowTeeTime ? (
                                                    <span className="tee-time">
                                                      {formatTeeTimeWithDate(roundData.teeTime, roundData)}
                                                    </span>
                                                  ) : (
                                                    "—"
                                                  )}
                                                </span>
                                              </div>
                                            )}
                                            <div className="score-item">
                                              <span className="score-label">
                                                {singleRound ? "STROKES" : `${round} STR`}
                                              </span>
                                              <span className="score-value">
                                                {roundData?.completed ? roundData.strokes : "—"}
                                              </span>
                                            </div>
                                            <div className="score-item">
                                              <span className="score-label">
                                                {singleRound ? "TIME" : `${round} TIME`}
                                              </span>
                                              <span className="score-value">
                                                {roundData?.completed ? roundData.time : "—"}
                                              </span>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            // Desktop Table Layout
                            <div className="table-responsive mb-4">
                              {/* 
                            Responsive Bootstrap table with clean styling:
                            - table-bordered: Clean borders between cells
                            - table-hover: Subtle hover effects
                            - Custom row banding: white (even) and table-light (odd) for clean contrast
                            - Fixed width constraints for POS and CTRY columns
                            - Country flags via flag-icon-css library
                            - Tournament completion trophies (FontAwesome) when tournament is over
                            - public-leaderboard-table: Enables mobile card layout
                          */}
                              <table className="table table-bordered table-hover public-leaderboard-table">
                                <thead>
                                  <tr>
                                    <th style={tableHeaderStyle}>POS</th>
                                    <th style={tableHeaderStyle}>CTRY</th>
                                    <th style={tableHeaderStyle}>PLAYER</th>
                                    {/* 
                                    TOTAL Column Conditional Rendering:
                                    - Multi-round: Shows aggregate total with red background to match PLAYER column
                                    - Single-round: Shows round total with standard tableHeaderStyle 
                                  */}
                                    {!singleRound && (
                                      <th
                                        className="text-center"
                                        style={{
                                          backgroundColor: "#cc2127", // Red background to match PLAYER column
                                          color: "#FFFFFF", // White text
                                        }}
                                      >
                                        TOTAL
                                      </th>
                                    )}
                                    {singleRound && (
                                      <th style={tableHeaderStyle} className="text-center">
                                        TOTAL
                                      </th>
                                    )}
                                    {/* 
                                    TO PAR Column Temporary Removal:
                                    
                                    **ISSUE:** Public API endpoints lack authentication context for course data access
                                    **ROOT CAUSE:** Backend separates public/authenticated routes, preventing access to course.tees
                                    **IMPACT:** Cannot calculate gender-specific pars or handle 9-hole/18-hole round differences
                                    
                                    **RESTORATION STEPS (when backend updated):**
                                    1. Uncomment header: <th style={tableHeaderStyle}>TO PAR</th>
                                    2. Uncomment data cell in player row: <td>{player.formattedToPar || "--"}</td>
                                    3. Verify course data accessible via public endpoints
                                    4. Test par calculations for mixed divisions and round types
                                    
                                    **TEMPORARILY COMMENTED OUT - TO PAR column requires course data from authenticated API
                                  <th style={tableHeaderStyle} className="text-center">
                                    TO PAR
                                  </th>
                                  */}
                                    <th style={tableHeaderStyle} className="text-center">
                                      THRU
                                    </th>
                                    {roundOptions.map(round => (
                                      <React.Fragment key={`header-${round}`}>
                                        {/* 
                                        SGS Column Conditional Rendering:
                                        
                                        **LOGIC:** SGS columns only shown for multi-round tournaments
                                        **REASON:** In single rounds, SGS equals TOTAL (redundant display)
                                        **PATTERN:** {!singleRound && ...} used throughout for consistency
                                        **BENEFIT:** Cleaner single-round layout without duplicate information
                                      */}
                                        {!singleRound && (
                                          <th
                                            className="text-center"
                                            style={{
                                              backgroundColor: "#000000", // Black for SGS columns like original
                                              color: "#FFFFFF", // White text
                                            }}
                                          >
                                            {`${round} SGS`}
                                          </th>
                                        )}
                                        <th
                                          className="text-center"
                                          style={{
                                            backgroundColor: "#13294E", // Dark blue for STR columns like original
                                            color: "#FFFFFF", // White text
                                          }}
                                        >
                                          {singleRound ? "STR" : `${round} STR`}
                                        </th>
                                        <th
                                          className="text-center"
                                          style={{
                                            backgroundColor: "#13294E", // Dark blue for TIME columns like original
                                            color: "#FFFFFF", // White text
                                          }}
                                        >
                                          {singleRound ? "TIME" : `${round} TIME`}
                                        </th>
                                      </React.Fragment>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody>
                                  {players.map((player, index) => {
                                    // Calculate trophy display logic
                                    const totalRounds = division.rounds?.length || 0;
                                    const playersWithAllRoundsCompleted = players.filter(
                                      p => p.completedRoundCount === totalRounds && totalRounds > 0,
                                    ).length;
                                    const totalPlayersInDivision = players.length;
                                    const minimumForTrophies = Math.min(3, totalPlayersInDivision);
                                    const completionRate =
                                      totalPlayersInDivision > 0
                                        ? playersWithAllRoundsCompleted / totalPlayersInDivision
                                        : 0;

                                    // Show trophies when enough players have completed all rounds
                                    const shouldShowTrophies =
                                      playersWithAllRoundsCompleted >= minimumForTrophies && completionRate >= 0.9;

                                    return (
                                      <tr key={player.id} className={index % 2 === 1 ? "table-light" : ""}>
                                        <td
                                          className="text-center"
                                          style={{
                                            width: "60px",
                                            maxWidth: "60px",
                                            minWidth: "60px",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                          }}
                                        >
                                          {index + 1}
                                        </td>
                                        <td
                                          className="text-center"
                                          style={{
                                            width: "50px",
                                            maxWidth: "50px",
                                            minWidth: "50px",
                                            whiteSpace: "nowrap",
                                            overflow: "hidden",
                                          }}
                                        >
                                          {player.homeCountry && (
                                            <span
                                              className={`flag-icon flag-icon-${player.homeCountry.toLowerCase()}`}
                                              title={player.homeCountry}
                                            />
                                          )}
                                        </td>
                                        <td>
                                          <div className="d-flex align-items-center">
                                            <img
                                              src={player.profilePic || "/images/DefaultProfilePic.jpg"}
                                              alt={`${player.name} profile`}
                                              className="rounded-circle me-2"
                                              style={{
                                                width: "32px",
                                                height: "32px",
                                                objectFit: "cover",
                                              }}
                                              onError={e => {
                                                e.target.src = "/images/DefaultProfilePic.jpg";
                                              }}
                                            />
                                            <span>{player.name}</span>
                                            {/* Trophy icons for top 3 finishers - only if tournament is over */}
                                            {(() => {
                                              /**
                                               * Tournament completion trophy logic
                                               *
                                               * Awards are only displayed when:
                                               * 1. Player has completed scores (hasScores = true)
                                               * 2. 90% or more of players in division have completed all rounds
                                               * 3. Player is in top 3 positions (index 0, 1, 2)
                                               *
                                               * Trophy colors:
                                               * - 1st Place: Gold (#FFD700)
                                               * - 2nd Place: Silver (#C0C0C0)
                                               * - 3rd Place: Bronze (#CD7F32)
                                               *
                                               * @returns {JSX.Element|null} FontAwesome trophy icon or null
                                               */

                                              if (player.hasScores && shouldShowTrophies) {
                                                if (index === 0) {
                                                  return (
                                                    <FontAwesomeIcon
                                                      icon={faTrophy}
                                                      className="ms-2"
                                                      style={{ color: "#FFD700" }}
                                                      title="1st Place Champion"
                                                    />
                                                  );
                                                } else if (index === 1) {
                                                  return (
                                                    <FontAwesomeIcon
                                                      icon={faTrophy}
                                                      className="ms-2"
                                                      style={{ color: "#C0C0C0" }}
                                                      title="2nd Place"
                                                    />
                                                  );
                                                } else if (index === 2) {
                                                  return (
                                                    <FontAwesomeIcon
                                                      icon={faTrophy}
                                                      className="ms-2"
                                                      style={{ color: "#CD7F32" }}
                                                      title="3rd Place"
                                                    />
                                                  );
                                                }
                                              }
                                              return null;
                                            })()}
                                          </div>
                                        </td>
                                        {/* 
                                      TOTAL Column Data Conditional Rendering:
                                      - Multi-round: Shows aggregate totalSGS across all completed rounds
                                      - Single-round: Shows formattedSGS for the single round (with fallback to totalSGS)
                                      - Matches header conditional rendering pattern for consistency
                                    */}
                                        {!singleRound && (
                                          <td className="text-center" data-label="Total">
                                            {player.hasScores ? player.totalSGS || "—" : "—"}
                                          </td>
                                        )}
                                        {singleRound && (
                                          <td className="text-center" data-label="Total">
                                            {player.hasScores
                                              ? player.formattedSGS ||
                                                (player.roundDetails &&
                                                  Object.values(player.roundDetails)[0]?.speedGolfScore) ||
                                                "—"
                                              : "—"}
                                          </td>
                                        )}
                                        {/* 
                                      TO PAR Data Cell Temporary Removal:
                                      
                                      **ORIGINAL FUNCTIONALITY:** 
                                      - Displayed player's score relative to par (formattedToPar)
                                      - Applied conditional styling: red text for under par, normal for over par
                                      - Showed "—" for players without completed scores
                                      
                                      **RESTORATION CODE:**
                                      <td className={`text-center ${player.toPar < 0 ? "text-danger" : player.toPar > 0 ? "" : ""}`}>
                                        {player.hasScores ? player.formattedToPar : "—"}
                                      </td>
                                      
                                      **TEMPORARILY COMMENTED OUT - TO PAR calculation requires course data from authenticated API
                                    <td
                                      className={`text-center ${player.toPar < 0 ? "text-danger" : player.toPar > 0 ? "" : ""}`}
                                    >
                                      {player.hasScores ? player.formattedToPar : "—"}
                                    </td>
                                    */}
                                        <td className="text-center" data-label="Thru">
                                          {player.hasScores ? (
                                            player.thruStatus
                                          ) : player.thruStatus && player.thruStatus !== "—" ? (
                                            <span title="Scheduled tee time">{player.thruStatus}</span>
                                          ) : (
                                            "—"
                                          )}
                                        </td>
                                        {roundOptions.map((round, roundIndex) => {
                                          const roundData = player.roundDetails[round];

                                          // Show tee time ONLY if:
                                          // 1. This round is not completed AND
                                          // 2. Player has completed at least one round AND
                                          // 3. This round comes after the last completed round
                                          const shouldShowTeeTime =
                                            !roundData?.completed &&
                                            roundData?.teeTime &&
                                            player.completedRoundCount > 0 &&
                                            roundIndex >= player.completedRoundCount;

                                          // Format tee time with date if available
                                          const formatTeeTimeWithDate = (teeTime, roundInfo) => {
                                            if (!teeTime) return null;

                                            // Get the round info to find the date - access current division
                                            const currentDivision = divisionsToShow.find(
                                              d => d.division._id === player.divisionId,
                                            )?.division;
                                            const divisionRound = currentDivision?.rounds?.[roundIndex];
                                            if (divisionRound?.date) {
                                              const date = new Date(divisionRound.date);
                                              const formattedDate = date.toLocaleDateString("en-GB", {
                                                day: "numeric",
                                                month: "short",
                                              });
                                              // Clean up time format - remove zero padding and seconds
                                              const cleanTime = teeTime
                                                .replace(/^0/, "")
                                                .replace(/:00(:00)?(\s|$)/, "$1");
                                              return `${formattedDate} at ${cleanTime}`;
                                            }
                                            return teeTime.replace(/^0/, "").replace(/:00(:00)?(\s|$)/, "$1");
                                          };

                                          return (
                                            <React.Fragment key={`${player.id}-${round}`}>
                                              {/* 
                                            Round SGS Data Cell Conditional Rendering:
                                            - Only displayed for multi-round tournaments (!singleRound)
                                            - Shows individual round speedgolf score when completed
                                            - Shows formatted tee time for uncompleted rounds (when available)
                                            - Eliminates redundancy in single-round tournaments where SGS equals TOTAL
                                          */}
                                              {!singleRound && (
                                                <td className="text-center" data-label={`${round} SGS`}>
                                                  {roundData?.completed ? (
                                                    roundData.speedGolfScore
                                                  ) : shouldShowTeeTime ? (
                                                    <span
                                                      title="Scheduled tee time"
                                                      style={{ fontSize: "0.8em", color: "#666" }}
                                                    >
                                                      {formatTeeTimeWithDate(roundData.teeTime, roundData)}
                                                    </span>
                                                  ) : (
                                                    "—"
                                                  )}
                                                </td>
                                              )}
                                              <td
                                                className="text-center"
                                                data-label={singleRound ? "Strokes" : `${round} Strokes`}
                                              >
                                                {roundData?.completed ? roundData.strokes : "—"}
                                              </td>
                                              <td
                                                className="text-center"
                                                data-label={singleRound ? "Time" : `${round} Time`}
                                              >
                                                {roundData?.completed ? roundData.time : "—"}
                                              </td>
                                            </React.Fragment>
                                          );
                                        })}
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          )
                        ) : (
                          <div className="p-4 mb-4">
                            <em>No players are registered in {division.name} Division</em>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="p-4">
              <em>No tournament data available</em>
            </div>
          )}
        </div>
      </Container>
    </>
  );
};

export default PublicTournamentLeaderboard;
