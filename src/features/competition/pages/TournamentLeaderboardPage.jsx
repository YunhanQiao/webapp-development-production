import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Container, Table, Alert, Button, Spinner } from "react-bootstrap";
import { tournamentsSelector } from "../competitionSelectors";
import { fetchAllCompetitions } from "../competitionActions";
import { fetchCourseById } from "../../course/courseActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import PlayerScorecardModal from "./PlayerScorecardModal";
import * as Conversions from "../../../conversions.js";
import useIsMobile from "../../../hooks/useIsMobile";
import { createLocalDate } from "../utils/dateUtils";
import "flag-icon-css/css/flag-icons.min.css";
import "./internalLeaderboardMobile.css";
const DEFAULT_LOGO = "../../../../images/DefaultGolfCoursePic.jpg";
const TournamentLeaderboard = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tournaments = useSelector(tournamentsSelector);
  const isMobile = useIsMobile();
  const [isLoading, setIsLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [selectedDivisionId, setSelectedDivisionId] = useState("");
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [allDivisionsData, setAllDivisionsData] = useState({});
  const [fullCoursesData, setFullCoursesData] = useState({}); // Store fetched course data with tees/holes
  const [showPlayerScorecard, setShowPlayerScorecard] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const findDivisionById = useCallback(
    divisionId => {
      if (!tournament || !tournament.divisions) return null;
      return tournament.divisions.find(d => d._id === divisionId);
    },
    [tournament],
  );
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

  // Determine if tournament is over (day after end date or later)
  const isTournamentOver = useCallback(() => {
    if (!tournament?.basicInfo?.endDate) return false;
    // Use fixed date parsing to avoid timezone issues
    const endDate = createLocalDate(tournament.basicInfo.endDate);
    const today = new Date();
    // Set both dates to start of day for accurate comparison
    endDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    // Tournament is over if today is the day after the end date or later
    return today.getTime() > endDate.getTime();
  }, [tournament]);

  const formatMMSSTime = timeStr => {
    if (!timeStr || timeStr === "—") return "—";
    if (!timeStr.includes(":")) return timeStr;
    const parts = timeStr.split(":");
    if (parts.length === 2) {
      return `${parseInt(parts[0], 10)}:${parts[1]}`;
    }
    if (parts.length === 3) {
      const hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const totalMinutes = hours * 60 + minutes;
      return `${totalMinutes}:${parts[2]}`;
    }
    return timeStr;
  };
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
  const themeColors = getThemeColors();
  const getCourseForRound = useCallback(
    roundId => {
      if (!tournament || !tournament.divisions || !selectedDivisionId) return null;
      const division = findDivisionById(selectedDivisionId);
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
      } else if (round.teeId && fullCoursesData[round.courseId]) {
        // Try to find tee info in the full course data
        const courseData = fullCoursesData[round.courseId];
        if (courseData && courseData.tees) {
          let teeInfo = null;
          if (Array.isArray(courseData.tees)) {
            teeInfo = courseData.tees.find(tee => tee.id === round.teeId || tee._id === round.teeId);
          } else if (typeof courseData.tees === "object") {
            teeInfo = Object.values(courseData.tees).find(tee => tee.id === round.teeId || tee._id === round.teeId);
          }
          if (teeInfo?.name) {
            teeName = teeInfo.name;
          }
        }
      }
      return `${courseName} (${teeName})`;
    },
    [tournament, selectedDivisionId, findDivisionById, fullCoursesData],
  );
  // Function to format course information for a specific division
  const formatCourseInfoForDivision = useCallback(
    division => {
      if (!division || !division.rounds) return "Course information not available";
      const coursesInfo = {};
      // Build courses info for this division
      division.rounds.forEach((round, index) => {
        const roundKey = `R${index + 1}`;
        // Get course info directly from round data
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
        } else if (round.teeId && fullCoursesData[round.courseId]) {
          // Try to find tee info in the full course data
          const courseData = fullCoursesData[round.courseId];
          if (courseData && courseData.tees) {
            let teeInfo = null;
            if (Array.isArray(courseData.tees)) {
              teeInfo = courseData.tees.find(tee => tee.id === round.teeId || tee._id === round.teeId);
            } else if (typeof courseData.tees === "object") {
              teeInfo = Object.values(courseData.tees).find(tee => tee.id === round.teeId || tee._id === round.teeId);
            }
            if (teeInfo?.name) {
              teeName = teeInfo.name;
            }
          }
        }
        coursesInfo[roundKey] = `${courseName} (${teeName})`;
      });
      const rounds = Object.keys(coursesInfo);
      if (rounds.length === 0) return "Course information not available";
      if (rounds.length === 1) {
        return `Round ${rounds[0].substring(1)}: ${coursesInfo[rounds[0]] || "Course information not available"}`;
      }
      // Check if all rounds have the same course/tee
      const firstCourse = coursesInfo[rounds[0]];
      const allSame = rounds.every(round => coursesInfo[round] === firstCourse);
      if (allSame && firstCourse) {
        // Create a readable range of rounds (e.g., "1 & 2" or "1, 2 & 3")
        const roundNumbers = rounds.map(r => r.substring(1));
        let roundRange;
        if (roundNumbers.length === 2) {
          roundRange = roundNumbers.join(" & ");
        } else {
          roundRange = roundNumbers.slice(0, -1).join(", ") + " & " + roundNumbers[roundNumbers.length - 1];
        }
        return `Rounds ${roundRange}: ${firstCourse}`;
      }
      // If not all the same, show individual rounds on separate lines or joined
      const roundInfos = rounds.map(
        round => `Round ${round.substring(1)}: ${coursesInfo[round] || "Course information not available"}`,
      );
      // If there are only 2 rounds, join them with " | ", otherwise show them separately
      if (roundInfos.length <= 2) {
        return roundInfos.join(" | ");
      } else {
        return roundInfos.join(" | ");
      }
    },
    [tournament, fullCoursesData],
  );
  // Function to fetch full course data for all courses used in the tournament
  const fetchAllCourseData = useCallback(async () => {
    if (!tournament || !tournament.divisions || !selectedDivisionId) {
      return;
    }
    // Collect all unique course IDs from all divisions when "All" is selected
    const uniqueCourseIds = new Set();
    if (selectedDivisionId === "All") {
      // Fetch course data for all divisions
      tournament.divisions.forEach(division => {
        division.rounds.forEach(round => {
          if (round.courseId) {
            uniqueCourseIds.add(round.courseId);
          }
        });
      });
    } else {
      // Fetch course data for the selected division only
      const division = findDivisionById(selectedDivisionId);
      if (!division) {
        return;
      }
      division.rounds.forEach(round => {
        if (round.courseId) {
          uniqueCourseIds.add(round.courseId);
        }
      });
    }
    // Fetch full course data for each unique course ID
    const fetchedCourses = {};
    for (const courseId of uniqueCourseIds) {
      try {
        const courseData = await dispatch(fetchCourseById(courseId, navigate));
        if (courseData) {
          fetchedCourses[courseId] = courseData;
        } else {
        }
      } catch (error) {
        // Silently handle course fetch errors to prevent console noise in production
      }
    }
    setFullCoursesData(fetchedCourses);
  }, [tournament, selectedDivisionId, findDivisionById, dispatch, navigate]);
  // Helper function to get stroke par for a round
  const getStrokeParForRound = useCallback(
    roundId => {
      if (!tournament || !tournament.divisions || !roundId) {
        return 72; // fallback
      }

      // When selectedDivisionId is "All", we need to find which division contains this round
      let division = null;
      let round = null;

      if (selectedDivisionId === "All") {
        // Search all divisions for the round with this ID
        for (const div of tournament.divisions) {
          const foundRound = div.rounds?.find(r => r._id === roundId);
          if (foundRound) {
            division = div;
            round = foundRound;
            break;
          }
        }
      } else {
        // Normal case: find division by ID
        division = findDivisionById(selectedDivisionId);
        if (division) {
          round = division.rounds?.find(r => r._id === roundId);
        }
      }

      if (!division || !round) {
        return 72;
      }
      // Determine gender from division
      const gender = division.gender === "Male" ? "mens" : "womens";
      // Determine which holes to use based on round configuration
      const numHoles = round.numHoles || "18";
      const isFrontNine = numHoles === "Front 9" || numHoles === "9";
      const isBackNine = numHoles === "Back 9";
      // **NEW: Try to use fetched full course data first**
      if (round.courseId && round.teeId && fullCoursesData[round.courseId]) {
        const fullCourse = fullCoursesData[round.courseId];
        // Handle both array and object formats for tees
        let tees = null;
        if (Array.isArray(fullCourse.tees)) {
          tees = fullCourse.tees;
        } else if (fullCourse.tees && typeof fullCourse.tees === "object") {
          // Convert object to array if needed
          tees = Object.values(fullCourse.tees);
        }
        if (tees && tees.length > 0) {
          const tee = tees.find(t => t._id === round.teeId || t.id === round.teeId);
          if (tee && tee.holes) {
            let holesToSum = tee.holes;
            // Filter holes based on round configuration
            if (isFrontNine) {
              holesToSum = tee.holes.slice(0, 9); // holes 1-9
            } else if (isBackNine) {
              holesToSum = tee.holes.slice(9, 18); // holes 10-18
            } else {
            }
            const strokePar = holesToSum.reduce((sum, hole, index) => {
              const parField = gender === "mens" ? "mensStrokePar" : "womensStrokePar";
              const holeStrokePar = hole[parField] || 4;
              return sum + holeStrokePar;
            }, 0);

            return strokePar;
          }
        }
      }
      // **Fallback to original tournament course data (this was the original behavior)**
      // Use courseId and teeId from round to find the correct course and tee
      if (round.courseId && round.teeId) {
        // Look up course in tournament.courses
        const course = tournament.courses?.find(c => c.courseId === round.courseId || c._id === round.courseId);
        if (course && course.tees) {
          const tee = course.tees.find(t => t._id === round.teeId || t.id === round.teeId);
          if (tee && tee.holes) {
            let holesToSum = tee.holes;
            // Filter holes based on round configuration
            if (isFrontNine) {
              holesToSum = tee.holes.slice(0, 9); // holes 1-9
            } else if (isBackNine) {
              holesToSum = tee.holes.slice(9, 18); // holes 10-18
            } else {
            }
            // For full round, use all holes (no filtering)
            const strokePar = holesToSum.reduce((sum, hole, index) => {
              const parField = gender === "mens" ? "mensStrokePar" : "womensStrokePar";
              const holeStrokePar = hole[parField] || 4;
              return sum + holeStrokePar;
            }, 0);
            return strokePar;
          }
        }
      }
      // Fallback: try to get course data from round.course (embedded data)
      if (round.course && round.course.tees) {
        const tee = round.course.tees.find(t => t.name === round.teeName) || round.course.tees[0];
        if (tee && tee.holes) {
          let holesToSum = tee.holes;
          // Filter holes based on round configuration
          if (isFrontNine) {
            holesToSum = tee.holes.slice(0, 9); // holes 1-9
          } else if (isBackNine) {
            holesToSum = tee.holes.slice(9, 18); // holes 10-18
          }
          return holesToSum.reduce((sum, hole) => {
            const parField = gender === "mens" ? "mensStrokePar" : "womensStrokePar";
            return sum + (hole[parField] || 4); // default to par 4 if not set
          }, 0);
        }
      }
      // Last fallback: try by course name if available
      if (round.courseId && tournament.courses) {
        const course = tournament.courses.find(c => c.courseId === round.courseId || c._id === round.courseId);
        if (course && course.tees) {
          const tee = course.tees.find(t => t.name === round.teeName) || course.tees[0];
          if (tee && tee.holes) {
            let holesToSum = tee.holes;
            // Filter holes based on round configuration
            if (isFrontNine) {
              holesToSum = tee.holes.slice(0, 9); // holes 1-9
            } else if (isBackNine) {
              holesToSum = tee.holes.slice(9, 18); // holes 10-18
            }
            return holesToSum.reduce((sum, hole) => {
              const parField = gender === "mens" ? "mensStrokePar" : "womensStrokePar";
              return sum + (hole[parField] || 4); // default to par 4 if not set
            }, 0);
          }
        }
      }
      // Final fallback based on number of holes
      if (isFrontNine || isBackNine) {
        return 36; // 9 holes × par 4 average
      }
      return 72; // 18 holes × par 4 average
    },
    [tournament, selectedDivisionId, findDivisionById, fullCoursesData],
  );
  // Helper function to get time par for a round
  const getTimeParForRound = useCallback(
    roundId => {
      if (!tournament || !tournament.divisions || !roundId) {
        return 0; // fallback
      }

      // When selectedDivisionId is "All", we need to find which division contains this round
      let division = null;
      let round = null;

      if (selectedDivisionId === "All") {
        // Search all divisions for the round with this ID
        for (const div of tournament.divisions) {
          const foundRound = div.rounds?.find(r => r._id === roundId);
          if (foundRound) {
            division = div;
            round = foundRound;
            break;
          }
        }
      } else {
        // Normal case: find division by ID
        division = findDivisionById(selectedDivisionId);
        if (division) {
          round = division.rounds?.find(r => r._id === roundId);
        }
      }

      if (!division || !round) {
        return 0;
      }

      // Determine gender from division
      const gender = division.gender === "Male" ? "mens" : "womens";
      // Determine which holes to use based on round configuration
      const numHoles = round.numHoles || "18";
      const isFrontNine = numHoles === "Front 9" || numHoles === "9";
      const isBackNine = numHoles === "Back 9";
      // **NEW: Try to use fetched full course data first**
      if (round.courseId && round.teeId && fullCoursesData[round.courseId]) {
        const fullCourse = fullCoursesData[round.courseId];
        // Handle both array and object formats for tees
        let tees = null;
        if (Array.isArray(fullCourse.tees)) {
          tees = fullCourse.tees;
        } else if (fullCourse.tees && typeof fullCourse.tees === "object") {
          // Convert object to array if needed
          tees = Object.values(fullCourse.tees);
        }
        if (tees && tees.length > 0) {
          const tee = tees.find(t => t._id === round.teeId || t.id === round.teeId);
          if (tee && tee.holes) {
            let holesToSum = tee.holes;
            // Filter holes based on round configuration
            if (isFrontNine) {
              holesToSum = tee.holes.slice(0, 9); // holes 1-9
            } else if (isBackNine) {
              holesToSum = tee.holes.slice(9, 18); // holes 10-18
            } else {
            }
            const timePar = holesToSum.reduce((sum, hole, index) => {
              const timeParField = gender === "mens" ? "mensTimePar" : "womensTimePar";
              const holeTimePar = hole[timeParField] || 0;
              return sum + holeTimePar;
            }, 0);

            return timePar;
          }
        }
      }
      // **Fallback to original tournament course data**
      // Use courseId and teeId from round to find the correct course and tee
      if (round.courseId && round.teeId) {
        // Look up course in tournament.courses
        const course = tournament.courses?.find(c => c.courseId === round.courseId || c._id === round.courseId);
        if (course && course.tees) {
          const tee = course.tees.find(t => t._id === round.teeId || t.id === round.teeId);
          if (tee && tee.holes) {
            let holesToSum = tee.holes;
            // Filter holes based on round configuration
            if (isFrontNine) {
              holesToSum = tee.holes.slice(0, 9); // holes 1-9
            } else if (isBackNine) {
              holesToSum = tee.holes.slice(9, 18); // holes 10-18
            } else {
            }
            // For full round, use all holes (no filtering)
            const timePar = holesToSum.reduce((sum, hole, index) => {
              const timeParField = gender === "mens" ? "mensTimePar" : "womensTimePar";
              const holeTimePar = hole[timeParField] || 0;
              return sum + holeTimePar;
            }, 0);
            return timePar;
          }
        }
      }
      // Fallback: try to get course data from round.course (embedded data)
      if (round.course && round.course.tees) {
        const tee = round.course.tees.find(t => t.name === round.teeName) || round.course.tees[0];
        if (tee && tee.holes) {
          let holesToSum = tee.holes;
          // Filter holes based on round configuration
          if (isFrontNine) {
            holesToSum = tee.holes.slice(0, 9); // holes 1-9
          } else if (isBackNine) {
            holesToSum = tee.holes.slice(9, 18); // holes 10-18
          }
          return holesToSum.reduce((sum, hole) => {
            const timeParField = gender === "mens" ? "mensTimePar" : "womensTimePar";
            return sum + (hole[timeParField] || 0); // sum time par in seconds
          }, 0);
        }
      }
      // Last fallback: try by course name if available
      if (round.courseId && tournament.courses) {
        const course = tournament.courses.find(c => c.courseId === round.courseId || c._id === round.courseId);
        if (course && course.tees) {
          const tee = course.tees.find(t => t.name === round.teeName) || course.tees[0];
          if (tee && tee.holes) {
            let holesToSum = tee.holes;
            // Filter holes based on round configuration
            if (isFrontNine) {
              holesToSum = tee.holes.slice(0, 9); // holes 1-9
            } else if (isBackNine) {
              holesToSum = tee.holes.slice(9, 18); // holes 10-18
            }
            return holesToSum.reduce((sum, hole) => {
              const timeParField = gender === "mens" ? "mensTimePar" : "womensTimePar";
              return sum + (hole[timeParField] || 0); // sum time par in seconds
            }, 0);
          }
        }
      }
      // Fallback to 0 if no course data available
      return 0;
    },
    [tournament, selectedDivisionId, findDivisionById, fullCoursesData],
  );
  const calculateAllDivisionsData = useCallback(() => {
    if (!tournament || !tournament.players || !tournament.divisions) {
      setAllDivisionsData({});
      return;
    }
    const allDivisionResults = {};
    tournament.divisions.forEach(division => {
      const divisionPlayers = tournament.players.filter(player => {
        return player.division === division._id && player.status !== "withdrawn";
      });
      const totalRounds = division?.rounds?.length || 0;
      const courses = {};
      if (division && division.rounds) {
        division.rounds.forEach((round, index) => {
          const roundKey = `R${index + 1}`;
          // Get course info directly for this division
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
          } else if (round.teeId && fullCoursesData[round.courseId]) {
            const courseData = fullCoursesData[round.courseId];
            if (courseData && courseData.tees) {
              let teeInfo = null;
              if (Array.isArray(courseData.tees)) {
                teeInfo = courseData.tees.find(tee => tee.id === round.teeId || tee._id === round.teeId);
              } else if (typeof courseData.tees === "object") {
                teeInfo = Object.values(courseData.tees).find(tee => tee.id === round.teeId || tee._id === round.teeId);
              }
              if (teeInfo?.name) {
                teeName = teeInfo.name;
              }
            }
          }
          courses[roundKey] = `${courseName} (${teeName})`;
        });
      }
      const processedData = divisionPlayers.map(player => {
        const roundDetailsMap = {};
        if (division && division.rounds) {
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
        if (player.scoreCards && player.scoreCards.length > 0) {
          player.scoreCards.forEach(scorecard => {
            const roundIndex = division.rounds.findIndex(r => r._id === scorecard.roundId);
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
        let totalStrokePar = 0;
        let totalTimePar = 0;
        let completedRounds = [];
        let totalSGSSeconds = 0;
        let hasCompletedRounds = false;
        // Always calculate for "All" rounds
        Object.keys(roundDetailsMap).forEach(roundKey => {
          const roundData = roundDetailsMap[roundKey];
          if (roundData.completed) {
            const strokePar = getStrokeParForRound(roundData.id);
            const timePar = getTimeParForRound(roundData.id);

            // Calculate SGS correctly: strokes × 60 + time_in_seconds
            const strokes = roundData.strokes || 0;
            const timeInSeconds = Conversions.timeToSeconds(roundData.time);
            const actualSGSSeconds = strokes * 60 + timeInSeconds;

            // Debug logging for SGS calculation
            if (player.playerName === "Chris Hundhausen" || player.playerName === "Kathy Leppard") {
              console.log(`Debug for ${player.playerName} - Round ${roundKey}:`);
              console.log(`  Strokes: ${strokes}`);
              console.log(`  Time: ${roundData.time}`);
              console.log(`  Time in seconds: ${timeInSeconds}`);
              console.log(`  Calculated SGS seconds: ${actualSGSSeconds}`);
              console.log(`  Stroke Par: ${strokePar}`);
              console.log(`  Time Par: ${timePar}`);
              console.log(`  Round ID: ${roundData.id}`);
              console.log(`  Selected Division ID: ${selectedDivisionId}`);

              // Debug course/tee data
              let division = null;
              let round = null;

              if (selectedDivisionId === "All") {
                // Search all divisions for the round with this ID
                for (const div of tournament.divisions) {
                  const foundRound = div.rounds?.find(r => r._id === roundData.id);
                  if (foundRound) {
                    division = div;
                    round = foundRound;
                    break;
                  }
                }
              } else {
                division = findDivisionById(selectedDivisionId);
                round = division?.rounds.find(r => r._id === roundData.id);
              }

              console.log(`  Division: ${division?.name}, Gender: ${division?.gender}`);
              console.log(`  Round courseId: ${round?.courseId}, teeId: ${round?.teeId}`);
              console.log(
                `  Full courses data available: ${fullCoursesData ? Object.keys(fullCoursesData).length : 0} courses`,
              );

              if (round?.courseId && fullCoursesData[round.courseId]) {
                const course = fullCoursesData[round.courseId];
                console.log(`  Course found in fullCoursesData: ${course.name}`);
                console.log(
                  `  Course tees: ${course.tees ? (Array.isArray(course.tees) ? course.tees.length : Object.keys(course.tees).length) : 0}`,
                );

                let tees = Array.isArray(course.tees) ? course.tees : course.tees ? Object.values(course.tees) : [];
                const tee = tees.find(t => t._id === round.teeId || t.id === round.teeId);
                console.log(`  Tee found: ${tee ? tee.name || "unnamed" : "not found"}`);

                if (tee && tee.holes) {
                  const gender = division.gender === "Male" ? "mens" : "womens";
                  const timeParField = gender === "mens" ? "mensTimePar" : "womensTimePar";
                  console.log(`  Tee holes count: ${tee.holes.length}, looking for field: ${timeParField}`);
                  console.log(`  First hole time par: ${tee.holes[0] ? tee.holes[0][timeParField] : "no holes"}`);

                  // Calculate total time par for debugging
                  const totalTimePar = tee.holes.reduce((sum, hole) => {
                    return sum + (hole[timeParField] || 0);
                  }, 0);
                  console.log(`  Total calculated time par: ${totalTimePar} seconds`);
                }
              }
            }

            totalStrokePar += strokePar;
            totalTimePar += timePar;
            totalSGSSeconds += actualSGSSeconds;
            completedRounds.push(roundKey);
            hasCompletedRounds = true;
          }
        });
        // Calculate speedgolf par correctly (matches scorecard logic)
        const timeParMinutes = Math.floor(totalTimePar / 60);
        const timeParSecondsRemainder = totalTimePar % 60;
        const sgsParMinutes = totalStrokePar + timeParMinutes;
        const sgsParSeconds = timeParSecondsRemainder;

        // Calculate difference in seconds for accurate comparison (matches calcTotalSGSToPar)
        const parSGSSeconds = sgsParMinutes * 60 + sgsParSeconds;
        const toParSeconds = totalSGSSeconds - parSGSSeconds;

        // Debug logging for final calculation
        if (player.playerName === "Chris Hundhausen" || player.playerName === "Kathy Leppard") {
          console.log(`Final calculation for ${player.playerName}:`);
          console.log(`  Total Stroke Par: ${totalStrokePar}`);
          console.log(`  Total Time Par: ${totalTimePar}`);
          console.log(`  Total SGS Seconds: ${totalSGSSeconds}`);
          console.log(`  Time Par Minutes: ${timeParMinutes}`);
          console.log(`  Time Par Seconds Remainder: ${timeParSecondsRemainder}`);
          console.log(`  SGS Par Minutes: ${sgsParMinutes}`);
          console.log(`  SGS Par Seconds: ${sgsParSeconds}`);
          console.log(`  Par SGS Seconds: ${parSGSSeconds}`);
          console.log(`  To Par Seconds: ${toParSeconds}`);
        }
        // Format "to par" in speedgolf format using library function
        let formattedToPar = "";
        if (!hasCompletedRounds) {
          // Show em dash for players without any completed rounds
          formattedToPar = "—";
        } else if (toParSeconds === 0) {
          formattedToPar = "E";
        } else {
          // Use Conversions.toTimePar to format the difference, then add +/- sign
          const absToParFormatted = Conversions.toTimePar(Math.abs(toParSeconds));
          formattedToPar = toParSeconds < 0 ? `-${absToParFormatted}` : `+${absToParFormatted}`;

          // Debug logging for formatting
          if (player.playerName === "Chris Hundhausen" || player.playerName === "Kathy Leppard") {
            console.log(`Formatting for ${player.playerName}:`);
            console.log(`  Absolute to par seconds: ${Math.abs(toParSeconds)}`);
            console.log(`  Formatted by toTimePar: ${absToParFormatted}`);
            console.log(`  Final formatted to par: ${formattedToPar}`);
          }
        }
        let thruStatus;
        if (completedRounds.length === totalRounds && completedRounds.length > 0) {
          thruStatus = "F";
        } else if (completedRounds.length > 0) {
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
          // No rounds completed - show first round's tee time in THRU column with date
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
          // Try to get tee time from roundDetailsMap first (more reliable since we just populated it)
          const firstRoundTeeTime = upcomingRoundData?.teeTime;
          if (firstRoundTeeTime) {
            thruStatus = formatTeeTimeWithDate(firstRoundTeeTime, 0);
          } else {
            // If still no tee time, try the original method as fallback
            const teeTime = getTeeTimeForPlayer(player.userId, upcomingRoundData?.id);
            thruStatus = teeTime ? formatTeeTimeWithDate(teeTime, 0) : "—";
          }
        }
        const totalSGSFormatted = hasCompletedRounds ? Conversions.toTimePar(totalSGSSeconds) : "—";
        return {
          id: player.userId,
          name: player.playerName,
          homeCountry: player.homeCountry,
          profilePic: player.profilePic,
          divisionId: player.division,
          divisionName: division.name,
          toPar: toParSeconds,
          formattedToPar,
          thruStatus,
          roundDetails: roundDetailsMap,
          hasScores: !!player.scoreCards?.length,
          completedRoundCount: completedRounds.length,
          totalSGS: totalSGSFormatted,
          totalSGSSeconds: totalSGSSeconds,
        };
      });
      const sortedData = processedData.sort((a, b) => {
        if (a.hasScores && !b.hasScores) return -1;
        if (!a.hasScores && b.hasScores) return 1;
        if (!a.hasScores && !b.hasScores) return 0;
        if (a.toPar !== b.toPar) {
          return a.toPar - b.toPar;
        }
        const aTotalSGS = a.totalSGSSeconds || Infinity;
        const bTotalSGS = b.totalSGSSeconds || Infinity;
        return aTotalSGS - bTotalSGS;
      });

      // Determine if trophies should be displayed for this division
      // Trophies are shown only when at least 3 players (or all players if fewer than 3)
      // have completed all rounds
      const playersWithAllRoundsCompleted = sortedData.filter(
        player => player.completedRoundCount === totalRounds && totalRounds > 0,
      ).length;
      const totalPlayersInDivision = sortedData.length;
      const minimumForTrophies = Math.min(3, totalPlayersInDivision);

      // Calculate completion rate for this division
      const completionRate = totalPlayersInDivision > 0 ? playersWithAllRoundsCompleted / totalPlayersInDivision : 0;

      // Trophies are shown when:
      // 1. At least 3 players (or all players if fewer than 3) have completed all rounds
      // 2. AND 90% or more of players in the division have completed all rounds
      const shouldShowTrophies = playersWithAllRoundsCompleted >= minimumForTrophies && completionRate >= 0.9;

      allDivisionResults[division._id] = {
        division: division,
        players: sortedData,
        courses: courses,
        courseInfo: formatCourseInfoForDivision(division),
        roundOptions: division.rounds?.map((_, index) => `R${index + 1}`) || [],
        singleRound: division.rounds?.length === 1,
        showTrophies: shouldShowTrophies,
      };
    });
    setAllDivisionsData(allDivisionResults);
  }, [
    tournament,
    selectedDivisionId,
    findDivisionById,
    getStrokeParForRound,
    getTimeParForRound,
    getTeeTimeForPlayer,
    formatCourseInfoForDivision,
    fullCoursesData,
  ]);
  const processLeaderboardData = useCallback(() => {
    if (!tournament || !tournament.players || !selectedDivisionId) {
      setLeaderboardData([]);
      return;
    }
    const selectedDivision = findDivisionById(selectedDivisionId);
    if (!selectedDivision) {
      setLeaderboardData([]);
      return;
    }
    const divisionPlayers = tournament.players.filter(player => {
      return player.division === selectedDivisionId && player.status !== "withdrawn";
    });
    const totalRounds = selectedDivision?.rounds?.length || 0;
    const courses = {};
    if (selectedDivision && selectedDivision.rounds) {
      selectedDivision.rounds.forEach((round, index) => {
        const roundKey = `R${index + 1}`;
        const courseInfo = getCourseForRound(round._id);
        courses[roundKey] = courseInfo || "Unknown Course";
      });
    }
    const processedData = divisionPlayers.map(player => {
      const roundDetailsMap = {};
      if (selectedDivision && selectedDivision.rounds) {
        selectedDivision.rounds.forEach((round, index) => {
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
      if (player.scoreCards && player.scoreCards.length > 0) {
        player.scoreCards.forEach(scorecard => {
          const roundIndex = selectedDivision.rounds.findIndex(r => r._id === scorecard.roundId);
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
      let totalStrokePar = 0;
      let totalTimePar = 0;
      let completedRounds = [];
      let totalSGSSeconds = 0;
      let hasCompletedRounds = false;
      // Always calculate for all rounds
      Object.keys(roundDetailsMap).forEach(roundKey => {
        const roundData = roundDetailsMap[roundKey];
        if (roundData.completed) {
          const strokePar = getStrokeParForRound(roundData.id);
          const timePar = getTimeParForRound(roundData.id);

          // Calculate SGS correctly: strokes × 60 + time_in_seconds
          const strokes = roundData.strokes || 0;
          const timeInSeconds = Conversions.timeToSeconds(roundData.time);
          const actualSGSSeconds = strokes * 60 + timeInSeconds;

          totalStrokePar += strokePar;
          totalTimePar += timePar;
          totalSGSSeconds += actualSGSSeconds;
          completedRounds.push(roundKey);
          hasCompletedRounds = true;
        }
      });
      // Calculate speedgolf par correctly (matches scorecard logic)
      const timeParMinutes = Math.floor(totalTimePar / 60);
      const timeParSecondsRemainder = totalTimePar % 60;
      const sgsParMinutes = totalStrokePar + timeParMinutes;
      const speedgolfParSeconds = sgsParMinutes * 60 + timeParSecondsRemainder;
      // Calculate "to par" as difference between actual SGS and speedgolf par, both in seconds
      const toParSeconds = totalSGSSeconds - speedgolfParSeconds;
      // Format "to par" in speedgolf format using library function
      let formattedToPar = "";
      if (!hasCompletedRounds) {
        // Show em dash for players without any completed rounds
        formattedToPar = "—";
      } else if (toParSeconds === 0) {
        formattedToPar = "E";
      } else {
        // Use Conversions.toTimePar to format the difference, then add +/- sign
        const absToParFormatted = Conversions.toTimePar(Math.abs(toParSeconds));
        formattedToPar = toParSeconds < 0 ? `-${absToParFormatted}` : `+${absToParFormatted}`;
      }
      let thruStatus;
      if (completedRounds.length === totalRounds && completedRounds.length > 0) {
        thruStatus = "F";
      } else if (completedRounds.length > 0) {
        const currentRoundKey = completedRounds.sort().slice(-1)[0];
        const currentRoundIdx = parseInt(currentRoundKey.replace("R", "")) - 1;
        const currentRoundId = selectedDivision.rounds[currentRoundIdx]?._id;
        const scorecard = player.scoreCards?.find(sc => sc.roundId === currentRoundId);
        if (scorecard && scorecard.scores) {
          const holesWithData = scorecard.scores.length;
          thruStatus = holesWithData.toString();
        } else {
          thruStatus = `R${completedRounds.length}`;
        }
      } else {
        // No rounds completed - show first round's tee time in THRU column with date
        const upcomingRound = Object.keys(roundDetailsMap)[0];
        const upcomingRoundData = roundDetailsMap[upcomingRound];
        // Format tee time with date for THRU column
        const formatTeeTimeWithDate = (teeTime, roundIndex) => {
          if (!teeTime) return null;
          const divisionRound = selectedDivision?.rounds?.[roundIndex];
          if (divisionRound?.date) {
            const date = new Date(divisionRound.date);
            const formattedDate = date.toLocaleDateString("en-GB", {
              day: "numeric",
              month: "short",
            });
            // Clean up time format - remove zero padding and seconds
            const cleanTime = teeTime
              .replace(/^0/, "")
              .replace(/:00(:00)?( |$)/, " ")
              .trim();
            return `${formattedDate} at ${cleanTime}`;
          }
          return teeTime
            .replace(/^0/, "")
            .replace(/:00(:00)?( |$)/, " ")
            .trim();
        };
        // Try to get tee time from roundDetailsMap first (more reliable since we just populated it)
        const firstRoundTeeTime = upcomingRoundData?.teeTime;
        if (firstRoundTeeTime) {
          thruStatus = formatTeeTimeWithDate(firstRoundTeeTime, 0);
        } else {
          // If still no tee time, try the original method as fallback
          const teeTime = getTeeTimeForPlayer(player.userId, upcomingRoundData?.id);
          thruStatus = teeTime ? formatTeeTimeWithDate(teeTime, 0) : "—";
        }
      }
      const totalSGSFormatted = hasCompletedRounds ? Conversions.toTimePar(totalSGSSeconds) : "—";
      const playerDivision = findDivisionById(player.division);
      const divisionName = playerDivision?.name || "Unknown";
      return {
        id: player.userId,
        name: player.playerName,
        homeCountry: player.homeCountry,
        profilePic: player.profilePic,
        divisionId: player.division,
        divisionName: divisionName,
        toPar: toParSeconds,
        formattedToPar,
        thruStatus,
        roundDetails: roundDetailsMap,
        hasScores: !!player.scoreCards?.length,
        completedRoundCount: completedRounds.length,
        totalSGS: totalSGSFormatted,
        totalSGSSeconds: totalSGSSeconds,
      };
    });
    const sortedData = processedData.sort((a, b) => {
      if (a.hasScores && !b.hasScores) return -1;
      if (!a.hasScores && b.hasScores) return 1;
      if (!a.hasScores && !b.hasScores) return 0;
      if (a.toPar !== b.toPar) {
        return a.toPar - b.toPar;
      }
      const aTotalSGS = a.totalSGSSeconds || Infinity;
      const bTotalSGS = b.totalSGSSeconds || Infinity;
      return aTotalSGS - bTotalSGS;
    });
    setLeaderboardData(sortedData);
  }, [
    tournament,
    selectedDivisionId,
    findDivisionById,
    getCourseForRound,
    getStrokeParForRound,
    getTimeParForRound,
    getTeeTimeForPlayer,
  ]);
  useEffect(() => {
    if (!tournaments?.length) {
      dispatch(fetchAllCompetitions());
    } else {
      setIsLoading(false);
    }
  }, [dispatch, tournaments]);
  useEffect(() => {
    const foundTournament = tournaments?.find(t => t._id === competitionId);
    setTournament(foundTournament);
    if (foundTournament?.divisions?.length > 0) {
      setSelectedDivisionId("All");
    }
  }, [tournaments, competitionId]);
  useEffect(() => {
    if (tournament && selectedDivisionId && selectedDivisionId !== "All") {
      processLeaderboardData();
    }
  }, [tournament, selectedDivisionId, processLeaderboardData]);
  // Calculate all divisions data when "All" is selected
  useEffect(() => {
    if (tournament && selectedDivisionId === "All") {
      calculateAllDivisionsData();
    }
  }, [tournament, selectedDivisionId, calculateAllDivisionsData]);
  // Fetch full course data when tournament or division changes
  useEffect(() => {
    if (tournament && selectedDivisionId) {
      fetchAllCourseData();
    }
  }, [tournament, selectedDivisionId, fetchAllCourseData]);
  const handlePlayerClick = playerId => {
    const player = tournament.players.find(p => p.userId === playerId);
    if (player) {
      setSelectedPlayer(player);
      setShowPlayerScorecard(true);
    }
  };
  const getRoundOptions = () => {
    if (!tournament || !selectedDivisionId) return ["All"];
    const division = findDivisionById(selectedDivisionId);
    if (!division) return ["All"];
    const rounds = ["All"];
    division.rounds.forEach((_, index) => {
      rounds.push(`R${index + 1}`);
    });
    return rounds;
  };
  const isSingleRound = () => {
    if (!tournament || !selectedDivisionId) return false;
    const division = findDivisionById(selectedDivisionId);
    return division?.rounds?.length === 1;
  };
  const tableHeaderStyle = {
    backgroundColor: themeColors.headerRowBg,
    color: themeColors.headerRowTxt,
  };
  if (isLoading) {
    return (
      <Container className="d-flex justify-content-center align-items-center" style={{ minHeight: "200px" }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }
  if (!tournament) {
    return (
      <Container className="p-4">
        <Alert variant="danger">
          Tournament not found. Please check the URL and try again.
          <div className="mt-3">
            <Button variant="primary" onClick={() => navigate("/competitions")}>
              Return to Tournaments
            </Button>
          </div>
        </Alert>
      </Container>
    );
  }
  const roundOptions = getRoundOptions().filter(r => r !== "All");
  const singleRound = isSingleRound();
  const selectedDivision = findDivisionById(selectedDivisionId);
  const tournamentTitle = `${tournament.basicInfo.name}${isTournamentOver() ? ": Final Results" : ": Leaderboard"}`;
  return (
    <Container fluid className="p-4">
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
            <h2 className="mb-0">{tournamentTitle}</h2>
            <p className="m-0" style={{ color: "#6FA5D8" }}>
              {tournament.basicInfo.startDate && new Date(tournament.basicInfo.startDate).toLocaleDateString()} -{" "}
              {tournament.basicInfo.endDate && new Date(tournament.basicInfo.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
      <div className="mb-4">
        <div className="d-flex align-items-center">
          <label htmlFor="division-select" className="me-0" style={{ whiteSpace: "nowrap" }}>
            Division:&nbsp;
          </label>
          <select
            id="division-select"
            className="form-select form-select-sm"
            value={selectedDivisionId}
            onChange={e => setSelectedDivisionId(e.target.value)}
            style={{ width: "auto", minWidth: "120px" }}
          >
            <option value="All">All</option>
            {tournament.divisions?.map(division => (
              <option key={division._id} value={division._id}>
                {division.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="mb-3 text-muted small">
        Retrieved at {new Date().toLocaleTimeString().replace(/:00$/, "")} on{" "}
        {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
      </div>
      {selectedDivisionId === "All" ? (
        // Render all divisions with separate tables
        Object.keys(allDivisionsData).length > 0 ? (
          <div>
            {Object.values(allDivisionsData).map((divisionData, divIndex) => (
              <div key={divisionData.division._id} className={divIndex > 0 ? "mt-5" : ""}>
                {/* Division Header */}
                <div className="mb-3">
                  <h3
                    className="mb-2"
                    style={{
                      fontSize: "1.5rem",
                      fontWeight: "700",
                      color: themeColors.titleText,
                      borderBottom: `2px solid ${themeColors.titleText}`,
                      paddingBottom: "8px",
                    }}
                  >
                    {divisionData.division.name} Division
                  </h3>
                  <div
                    className="text-lg"
                    style={{ fontSize: "1.125rem", fontWeight: "500", marginBottom: "12px", color: "#666666" }}
                  >
                    {divisionData.courseInfo}
                  </div>
                </div>
                {/* Division Table */}
                {divisionData.players.length > 0 ? (
                  <>
                    {/* Desktop Table */}
                    <div className="table-responsive mb-4 internal-desktop-table">
                      <Table striped bordered hover className="internal-leaderboard-table">
                        <thead>
                          <tr>
                            <th style={tableHeaderStyle}>POS</th>
                            <th style={tableHeaderStyle}>CTRY</th>
                            <th style={tableHeaderStyle}>PLAYER</th>
                            {!divisionData.singleRound && (
                              <th
                                className="text-center"
                                style={{
                                  backgroundColor: themeColors.sgParColBg,
                                  color: themeColors.sgParColTxt,
                                }}
                              >
                                TOTAL
                              </th>
                            )}
                            <th style={tableHeaderStyle} className="text-center">
                              TO PAR
                            </th>
                            <th style={tableHeaderStyle} className="text-center">
                              THRU
                            </th>
                            {divisionData.roundOptions.map(round => (
                              <React.Fragment key={`header-${round}`}>
                                <th
                                  className="text-center"
                                  style={{
                                    backgroundColor: themeColors.sgParColBg,
                                    color: themeColors.sgParColTxt,
                                  }}
                                >
                                  {divisionData.singleRound ? "SGS" : `${round} SGS`}
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    backgroundColor: themeColors.strParColBg,
                                    color: themeColors.strParColTxt,
                                  }}
                                >
                                  {divisionData.singleRound ? "STR" : `${round} STR`}
                                </th>
                                <th
                                  className="text-center"
                                  style={{
                                    backgroundColor: themeColors.timeParColBg,
                                    color: themeColors.timeParColTxt,
                                  }}
                                >
                                  {divisionData.singleRound ? "TIME" : `${round} TIME`}
                                </th>
                              </React.Fragment>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {divisionData.players.map((player, index) => (
                            <tr key={player.id}>
                              <td>{index + 1}</td>
                              <td>
                                {player.homeCountry && (
                                  <span
                                    className={`flag-icon flag-icon-${player.homeCountry.toLowerCase()}`}
                                    title={player.homeCountry}
                                  />
                                )}
                              </td>
                              <td>
                                <div className="d-flex align-items-center">
                                  {player.profilePic && (
                                    <img
                                      src={player.profilePic}
                                      alt={`${player.name} profile`}
                                      className="rounded-circle me-2"
                                      style={{
                                        width: "32px",
                                        height: "32px",
                                        objectFit: "cover",
                                      }}
                                      onError={e => {
                                        e.target.style.display = "none";
                                      }}
                                    />
                                  )}
                                  <button
                                    onClick={() => handlePlayerClick(player.id)}
                                    className="text-primary bg-transparent border-0 p-0"
                                    style={{ cursor: "pointer", textDecoration: "none" }}
                                  >
                                    {player.name}
                                  </button>
                                  {/* Trophy icons for top 3 finishers */}
                                  {divisionData.showTrophies && index === 0 && (
                                    <FontAwesomeIcon
                                      icon={faTrophy}
                                      className="ms-2"
                                      style={{ color: "#FFD700" }}
                                      title="1st Place - Gold"
                                    />
                                  )}
                                  {divisionData.showTrophies && index === 1 && (
                                    <FontAwesomeIcon
                                      icon={faTrophy}
                                      className="ms-2"
                                      style={{ color: "#C0C0C0" }}
                                      title="2nd Place - Silver"
                                    />
                                  )}
                                  {divisionData.showTrophies && index === 2 && (
                                    <FontAwesomeIcon
                                      icon={faTrophy}
                                      className="ms-2"
                                      style={{ color: "#CD7F32" }}
                                      title="3rd Place - Bronze"
                                    />
                                  )}
                                </div>
                              </td>
                              {!divisionData.singleRound && (
                                <td className="text-center">{formatMMSSTime(player.totalSGS)}</td>
                              )}
                              <td
                                className={`text-center ${player.toPar < 0 ? "text-danger" : player.toPar > 0 ? "" : ""}`}
                              >
                                {player.formattedToPar}
                              </td>
                              <td className="text-center">
                                {player.thruStatus && player.thruStatus.includes(":") ? (
                                  <span title="Scheduled tee time">{player.thruStatus}</span>
                                ) : (
                                  player.thruStatus
                                )}
                              </td>
                              {divisionData.roundOptions.map((round, roundIndex) => {
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
                                  // Get the round info to find the date
                                  const divisionRound = divisionData.division.rounds?.[roundIndex];
                                  if (divisionRound?.date) {
                                    const date = new Date(divisionRound.date);
                                    const formattedDate = date.toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                    });
                                    // Clean up time format - remove zero padding and seconds
                                    const cleanTime = teeTime.replace(/^0/, "").replace(/:00(:00)?(\s|$)/, "$1");
                                    return `${formattedDate} at ${cleanTime}`;
                                  }
                                  return teeTime.replace(/^0/, "").replace(/:00(:00)?(\s|$)/, "$1");
                                };
                                return (
                                  <React.Fragment key={`${player.id}-${round}`}>
                                    <td className="text-center">
                                      {roundData?.completed ? (
                                        roundData.speedGolfScore
                                      ) : shouldShowTeeTime ? (
                                        <span title="Scheduled tee time" style={{ fontSize: "0.8em", color: "#666" }}>
                                          {formatTeeTimeWithDate(roundData.teeTime, roundData)}
                                        </span>
                                      ) : (
                                        "—"
                                      )}
                                    </td>
                                    <td className="text-center">{roundData?.completed ? roundData.strokes : "—"}</td>
                                    <td className="text-center">{roundData?.completed ? roundData.time : "—"}</td>
                                  </React.Fragment>
                                );
                              })}
                            </tr>
                          ))}
                        </tbody>
                      </Table>
                    </div>

                    {/* Mobile Cards */}
                    {isMobile && (
                      <div className="internal-mobile-cards">
                        {divisionData.players.map((player, index) => (
                          <div key={player.id} className="internal-mobile-leaderboard-card">
                            <div className="internal-mobile-player-info">
                              <span className="internal-mobile-position-badge">{index + 1}</span>
                              {player.profilePic && (
                                <img
                                  src={player.profilePic}
                                  alt={`${player.name} profile`}
                                  className="internal-mobile-profile-pic rounded-circle"
                                  style={{
                                    width: "32px",
                                    height: "32px",
                                    objectFit: "cover",
                                    marginRight: "8px",
                                  }}
                                  onError={e => {
                                    e.target.style.display = "none";
                                  }}
                                />
                              )}
                              <div>
                                <button
                                  onClick={() => handlePlayerClick(player.id)}
                                  className="text-primary bg-transparent border-0 p-0 internal-mobile-player-name"
                                  style={{ cursor: "pointer", textDecoration: "none" }}
                                >
                                  {player.name}
                                </button>
                              </div>
                              {player.homeCountry && (
                                <span
                                  className={`flag-icon flag-icon-${player.homeCountry.toLowerCase()} internal-mobile-flag`}
                                  title={player.homeCountry}
                                />
                              )}
                              {/* Trophy icons for top 3 finishers */}
                              {divisionData.showTrophies && index === 0 && (
                                <FontAwesomeIcon
                                  icon={faTrophy}
                                  className="ms-2"
                                  style={{ color: "#FFD700" }}
                                  title="1st Place - Gold"
                                />
                              )}
                              {divisionData.showTrophies && index === 1 && (
                                <FontAwesomeIcon
                                  icon={faTrophy}
                                  className="ms-2"
                                  style={{ color: "#C0C0C0" }}
                                  title="2nd Place - Silver"
                                />
                              )}
                              {divisionData.showTrophies && index === 2 && (
                                <FontAwesomeIcon
                                  icon={faTrophy}
                                  className="ms-2"
                                  style={{ color: "#CD7F32" }}
                                  title="3rd Place - Bronze"
                                />
                              )}
                            </div>
                            <div className="internal-mobile-score-summary">
                              {!divisionData.singleRound && (
                                <div className="internal-mobile-score-item">
                                  <span className="internal-mobile-score-label">TOTAL</span>
                                  <span className="internal-mobile-score-value">{formatMMSSTime(player.totalSGS)}</span>
                                </div>
                              )}
                              <div className="internal-mobile-score-item">
                                <span className="internal-mobile-score-label">TO PAR</span>
                                <span
                                  className={`internal-mobile-score-value ${player.toPar < 0 ? "text-danger" : player.toPar > 0 ? "" : ""}`}
                                >
                                  {player.formattedToPar}
                                </span>
                              </div>
                              <div className="internal-mobile-score-item">
                                <span className="internal-mobile-score-label">THRU</span>
                                <span className="internal-mobile-score-value">
                                  {player.thruStatus && player.thruStatus.includes(":") ? (
                                    <span title="Scheduled tee time">{player.thruStatus}</span>
                                  ) : (
                                    player.thruStatus
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Round Details */}
                            <div className="internal-mobile-rounds">
                              {divisionData.roundOptions.map((round, roundIndex) => {
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
                                  // Get the round info to find the date
                                  const divisionRound = divisionData.division.rounds?.[roundIndex];
                                  if (divisionRound?.date) {
                                    const date = new Date(divisionRound.date);
                                    const formattedDate = date.toLocaleDateString("en-GB", {
                                      day: "numeric",
                                      month: "short",
                                    });
                                    // Clean up time format - remove zero padding and seconds
                                    const cleanTime = teeTime.replace(/^0/, "").replace(/:00(:00)?(\s|$)/, "$1");
                                    return `${formattedDate} at ${cleanTime}`;
                                  }
                                  return teeTime.replace(/^0/, "").replace(/:00(:00)?(\s|$)/, "$1");
                                };

                                return (
                                  <div key={`${player.id}-${round}`} className="internal-mobile-round">
                                    <div className="internal-mobile-round-header">Round {roundIndex + 1}</div>
                                    <div className="internal-mobile-round-data">
                                      <div className="internal-mobile-score-item">
                                        <span className="internal-mobile-score-label">SGS</span>
                                        <span className="internal-mobile-score-value">
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
                                        </span>
                                      </div>
                                      <div className="internal-mobile-score-item">
                                        <span className="internal-mobile-score-label">STR</span>
                                        <span className="internal-mobile-score-value">
                                          {roundData?.completed ? roundData.strokes : "—"}
                                        </span>
                                      </div>
                                      <div className="internal-mobile-score-item">
                                        <span className="internal-mobile-score-label">TIME</span>
                                        <span className="internal-mobile-score-value">
                                          {roundData?.completed ? roundData.time : "—"}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center p-4 mb-4">
                    <em>No players are registered in {divisionData.division.name} Division</em>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-4">
            <em>Loading divisions...</em>
          </div>
        )
      ) : selectedDivisionId ? (
        // Render single division
        leaderboardData.length > 0 ? (
          <div>
            {/* Division Header */}
            <div className="mb-3">
              <h3
                className="mb-2"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "700",
                  color: themeColors.titleText,
                  borderBottom: `2px solid ${themeColors.titleText}`,
                  paddingBottom: "8px",
                }}
              >
                {selectedDivision ? `${selectedDivision.name} Division` : "Division"}
              </h3>
              <div
                className="text-lg"
                style={{ fontSize: "1.125rem", fontWeight: "500", marginBottom: "12px", color: "#666666" }}
              >
                {selectedDivision ? formatCourseInfoForDivision(selectedDivision) : ""}
              </div>
            </div>
            <>
              {/* Desktop Table */}
              <div className="table-responsive internal-desktop-table">
                <Table striped bordered hover className="internal-leaderboard-table">
                  <thead>
                    <tr>
                      <th style={tableHeaderStyle}>POS</th>
                      <th style={tableHeaderStyle}>CTRY</th>
                      <th style={tableHeaderStyle}>PLAYER</th>
                      {!singleRound && (
                        <th
                          className="text-center"
                          style={{
                            backgroundColor: themeColors.sgParColBg,
                            color: themeColors.sgParColTxt,
                          }}
                        >
                          TOTAL
                        </th>
                      )}
                      <th style={tableHeaderStyle} className="text-center">
                        TO PAR
                      </th>
                      <th style={tableHeaderStyle} className="text-center">
                        THRU
                      </th>
                      {roundOptions.map(round => (
                        <React.Fragment key={`header-${round}`}>
                          <th
                            className="text-center"
                            style={{
                              backgroundColor: themeColors.sgParColBg,
                              color: themeColors.sgParColTxt,
                            }}
                          >
                            {singleRound ? "SGS" : `${round} SGS`}
                          </th>
                          <th
                            className="text-center"
                            style={{
                              backgroundColor: themeColors.strParColBg,
                              color: themeColors.strParColTxt,
                            }}
                          >
                            {singleRound ? "STR" : `${round} STR`}
                          </th>
                          <th
                            className="text-center"
                            style={{
                              backgroundColor: themeColors.timeParColBg,
                              color: themeColors.timeParColTxt,
                            }}
                          >
                            {singleRound ? "TIME" : `${round} TIME`}
                          </th>
                        </React.Fragment>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboardData.map((player, index) => (
                      <tr key={player.id}>
                        <td>{index + 1}</td>
                        <td>
                          {player.homeCountry && (
                            <span
                              className={`flag-icon flag-icon-${player.homeCountry.toLowerCase()}`}
                              title={player.homeCountry}
                            />
                          )}
                        </td>
                        <td>
                          <div className="d-flex align-items-center">
                            {player.profilePic && (
                              <img
                                src={player.profilePic}
                                alt={`${player.name} profile`}
                                className="rounded-circle me-2"
                                style={{
                                  width: "32px",
                                  height: "32px",
                                  objectFit: "cover",
                                }}
                                onError={e => {
                                  e.target.style.display = "none";
                                }}
                              />
                            )}
                            <button
                              onClick={() => handlePlayerClick(player.id)}
                              className="text-primary bg-transparent border-0 p-0"
                              style={{ cursor: "pointer", textDecoration: "none" }}
                            >
                              {player.name}
                            </button>
                            {/* Trophy icons for top 3 finishers */}
                            {player.hasScores && index === 0 && (
                              <FontAwesomeIcon
                                icon={faTrophy}
                                className="ms-2"
                                style={{ color: "#FFD700" }}
                                title="1st Place - Gold"
                              />
                            )}
                            {player.hasScores && index === 1 && (
                              <FontAwesomeIcon
                                icon={faTrophy}
                                className="ms-2"
                                style={{ color: "#C0C0C0" }}
                                title="2nd Place - Silver"
                              />
                            )}
                            {player.hasScores && index === 2 && (
                              <FontAwesomeIcon
                                icon={faTrophy}
                                className="ms-2"
                                style={{ color: "#CD7F32" }}
                                title="3rd Place - Bronze"
                              />
                            )}
                          </div>
                        </td>
                        {!singleRound && <td className="text-center">{formatMMSSTime(player.totalSGS)}</td>}
                        <td className={`text-center ${player.toPar < 0 ? "text-danger" : player.toPar > 0 ? "" : ""}`}>
                          {player.formattedToPar}
                        </td>
                        <td className="text-center">
                          {player.thruStatus && player.thruStatus.includes(":") ? (
                            <span title="Scheduled tee time">{player.thruStatus}</span>
                          ) : (
                            player.thruStatus
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
                            // Get the round info to find the date
                            const divisionRound = selectedDivision?.rounds?.[roundIndex];
                            if (divisionRound?.date) {
                              const date = new Date(divisionRound.date);
                              const formattedDate = date.toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                              });
                              // Clean up time format - remove zero padding and seconds
                              const cleanTime = teeTime.replace(/^0/, "").replace(/:00(:00)?(\s|$)/, "$1");
                              return `${formattedDate} at ${cleanTime}`;
                            }
                            return teeTime.replace(/^0/, "").replace(/:00(:00)?(\s|$)/, "$1");
                          };
                          return (
                            <React.Fragment key={`${player.id}-${round}`}>
                              <td className="text-center">
                                {roundData?.completed ? (
                                  roundData.speedGolfScore
                                ) : shouldShowTeeTime ? (
                                  <span title="Scheduled tee time" style={{ fontSize: "0.8em", color: "#666" }}>
                                    {formatTeeTimeWithDate(roundData.teeTime, roundData)}
                                  </span>
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="text-center">{roundData?.completed ? roundData.strokes : "—"}</td>
                              <td className="text-center">{roundData?.completed ? roundData.time : "—"}</td>
                            </React.Fragment>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {/* Mobile Cards */}
              {isMobile && (
                <div className="internal-mobile-cards">
                  {leaderboardData.map((player, index) => (
                    <div key={player.id} className="internal-mobile-leaderboard-card">
                      <div className="internal-mobile-player-info">
                        <span className="internal-mobile-position-badge">{index + 1}</span>
                        <div>
                          <button
                            onClick={() => handlePlayerClick(player.id)}
                            className="text-primary bg-transparent border-0 p-0 internal-mobile-player-name"
                            style={{ cursor: "pointer", textDecoration: "none" }}
                          >
                            {player.name}
                          </button>
                          {/* Trophy icons for top 3 finishers */}
                          {player.hasScores && index === 0 && (
                            <FontAwesomeIcon
                              icon={faTrophy}
                              className="ms-2"
                              style={{ color: "#FFD700" }}
                              title="1st Place - Gold"
                            />
                          )}
                          {player.hasScores && index === 1 && (
                            <FontAwesomeIcon
                              icon={faTrophy}
                              className="ms-2"
                              style={{ color: "#C0C0C0" }}
                              title="2nd Place - Silver"
                            />
                          )}
                          {player.hasScores && index === 2 && (
                            <FontAwesomeIcon
                              icon={faTrophy}
                              className="ms-2"
                              style={{ color: "#CD7F32" }}
                              title="3rd Place - Bronze"
                            />
                          )}
                        </div>
                        {player.homeCountry && (
                          <span
                            className={`flag-icon flag-icon-${player.homeCountry.toLowerCase()} internal-mobile-flag`}
                            title={player.homeCountry}
                          />
                        )}
                      </div>
                      <div className="internal-mobile-score-summary">
                        {!singleRound && (
                          <div className="internal-mobile-score-item">
                            <span className="internal-mobile-score-label">TOTAL</span>
                            <span className="internal-mobile-score-value">{formatMMSSTime(player.totalSGS)}</span>
                          </div>
                        )}
                        <div className="internal-mobile-score-item">
                          <span className="internal-mobile-score-label">TO PAR</span>
                          <span
                            className={`internal-mobile-score-value ${player.toPar < 0 ? "text-danger" : player.toPar > 0 ? "" : ""}`}
                          >
                            {player.formattedToPar}
                          </span>
                        </div>
                        <div className="internal-mobile-score-item">
                          <span className="internal-mobile-score-label">THRU</span>
                          <span className="internal-mobile-score-value">
                            {player.thruStatus && player.thruStatus.includes(":") ? (
                              <span title="Scheduled tee time">{player.thruStatus}</span>
                            ) : (
                              player.thruStatus
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          </div>
        ) : (
          <div className="text-center p-4">
            <em>No players are registered in this division</em>
          </div>
        )
      ) : (
        <Alert variant="warning">Please select a division to view results.</Alert>
      )}
      <div className="mt-4 text-center">
        <Button
          variant="secondary"
          className="ms-2"
          style={{
            backgroundColor: themeColors.updateBtnBg,
            color: themeColors.updateBtnTxt,
            borderColor: themeColors.updateBtnBg,
          }}
          // onClick={() => navigate("/competitions")}
          onClick={() => navigate(-1)}
        >
          Back to Tournament
        </Button>
      </div>
      <PlayerScorecardModal
        player={selectedPlayer}
        tournament={tournament}
        selectedDivision={selectedDivisionId}
        fullCoursesData={fullCoursesData}
        show={showPlayerScorecard}
        onHide={() => {
          setShowPlayerScorecard(false);
          setSelectedPlayer(null);
        }}
      />
    </Container>
  );
};
export default TournamentLeaderboard;
