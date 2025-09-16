import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { Container, Table, Alert, Button, Spinner, Form, Modal } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import _ from "lodash";
import "flag-icon-css/css/flag-icons.min.css";

import { tournamentsSelector, teesetsSelector } from "../competitionSelectors";
import {
  fetchAllCompetitions,
  saveTeeSheet,
  fetchTeeSheet,
  processPlayerRefund,
  adminAddPlayerToTournament,
  fetchCompetitionByID,
  fetchTeesets,
} from "../competitionActions";
import DefaultProfilePic from "../../../images/DefaultProfilePic.jpg";
import GenerateDialog from "./teeSheet/generateTeeSheetDialog";
import ExportTeeSheetDialog from "./teeSheet/exportTeeSheetDialog";
import AdjustTeeSheetDialog from "./teeSheet/adjustTeeSheetDialog";
import { notifyMessage } from "services/toasterServices";
import * as CompetitionServices from "../competitionServices";
import "../../../styles/components/modals.css";

const DEFAULT_LOGO = "../../../../images/DefaultGolfCoursePic.jpg";

const TournamentTeeSheetPage = () => {
  const { competitionId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const tournaments = useSelector(tournamentsSelector);
  const activeTournament = useSelector(state => state.competitions.activeTournament);
  const teesets = useSelector(teesetsSelector);
  const [isLoading, setIsLoading] = useState(true);
  const [tournament, setTournament] = useState(null);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showGenerateDialog, setShowGenerateDialog] = useState(false);
  const [displayedPlayers, setDisplayedPlayers] = useState([]);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showAdjustDialog, setShowAdjustDialog] = useState(false);
  const [sortDirection, setSortDirection] = useState({}); // Track sort direction for each round date
  const [activeSortColumn, setActiveSortColumn] = useState(null); // Track which column is currently sorted
  const [playerDivisionChanges, setPlayerDivisionChanges] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [playerToDelete, setPlayerToDelete] = useState(null);
  const [originalTeeTimesRef, setOriginalTeeTimesRef] = useState({});
  const [showDivisionWarningModal, setShowDivisionWarningModal] = useState(false);
  const [pendingDivisionChange, setPendingDivisionChange] = useState(null);
  const [showDivisionInfoModal, setShowDivisionInfoModal] = useState(false);
  const [isGeneratingTeeTimes, setIsGeneratingTeeTimes] = useState(false);
  const [lastSortTime, setLastSortTime] = useState(0); // Debounce sorting
  const [dataSource, setDataSource] = useState("server"); // 'server' | 'user-sorted' | 'generated'

  // Player picker state
  const [showPlayerPickerModal, setShowPlayerPickerModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [isAddingPlayers, setIsAddingPlayers] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Access user data
  const jwtToken = useSelector(state => state.user.tokens.jwtToken);
  const currentUserId = useSelector(state => state.user.user._id);

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

  const findDivisionById = useCallback(
    divisionId => {
      return tournament?.divisions?.find(d => d._id === divisionId);
    },
    [tournament],
  );

  // Function to update displayed data with priority tracking
  const updateDisplayedData = useCallback(
    (newData, source = "server") => {
      if (source === "server") {
        if (dataSource === "server") {
          setDisplayedPlayers(newData);
        }
      } else {
        setDataSource(source);
        setDisplayedPlayers(newData);
      }
    },
    [dataSource],
  );

  const handleDivisionChange = (playerId, newDivisionId) => {
    // Check if player has existing scores that might be lost
    const player = displayedPlayers.find(p => p._id === playerId);
    const hasExistingScores = player?.scoreCards && player.scoreCards.length > 0;

    if (hasExistingScores) {
      // Show score loss warning
      setPendingDivisionChange({
        playerId,
        newDivisionId,
        player,
        hasScores: true,
        newDivision: findDivisionById(newDivisionId),
      });
      setShowDivisionWarningModal(true);
    } else {
      // No warnings needed, proceed with change
      setPlayerDivisionChanges(prev => ({
        ...prev,
        [playerId]: newDivisionId,
      }));
      setHasUnsavedChanges(true);
    }
  };

  const confirmDivisionChange = () => {
    if (pendingDivisionChange) {
      setPlayerDivisionChanges(prev => ({
        ...prev,
        [pendingDivisionChange.playerId]: pendingDivisionChange.newDivisionId,
      }));
      setHasUnsavedChanges(true);
    }
    setShowDivisionWarningModal(false);
    setPendingDivisionChange(null);
  };

  const cancelDivisionChange = () => {
    setShowDivisionWarningModal(false);
    setPendingDivisionChange(null);
  };

  const getCurrentDivisionId = player => {
    // Return the pending change if exists, otherwise the original division
    return playerDivisionChanges[player._id] || player.division;
  };

  // Function to get count of pending tee time changes
  const getPendingTeeTimeChanges = () => {
    let changeCount = 0;
    displayedPlayers.forEach(player => {
      if (originalTeeTimesRef[player.userId]) {
        player.roundAssignments?.forEach(assignment => {
          const originalTime = originalTeeTimesRef[player.userId][assignment.date];
          if (originalTime && originalTime !== assignment.teeTime) {
            changeCount++;
          }
        });
      }
    });
    return changeCount;
  };

  // Function to check if a specific tee time has been changed
  const isTeeTimeChanged = (player, date, currentTime) => {
    if (!originalTeeTimesRef[player.userId]) return false;
    const originalTime = originalTeeTimesRef[player.userId][date];
    return originalTime && originalTime !== currentTime;
  };

  const handleDeletePlayer = playerId => {
    const player = displayedPlayers.find(p => p._id === playerId);
    if (player) {
      setPlayerToDelete(player);
      setShowDeleteModal(true);
    }
  };

  const confirmDeletePlayer = async () => {
    if (!playerToDelete) return;

    try {
      setIsLoading(true);

      const success = await dispatch(processPlayerRefund(competitionId, playerToDelete.userId, "Removed by admin"));

      if (success) {
        // Remove player from displayed list immediately
        setDisplayedPlayers(prev => prev.filter(player => player._id !== playerToDelete._id));
        notifyMessage(
          "success",
          `${playerToDelete.playerName} has been removed from the tournament`,
          3000,
          "colored",
          "top-center",
        );

        // Refresh tournament data to ensure Redux state is updated
        await new Promise(resolve => setTimeout(resolve, 1000)); // Increased delay for backend sync
        await dispatch(fetchCompetitionByID(competitionId));
      }
    } catch (error) {
      notifyMessage("error", `Failed to remove player: ${error.message}`, 5000, "colored", "top-center");
    } finally {
      setIsLoading(false);
      setShowDeleteModal(false);
      setPlayerToDelete(null);
    }
  };

  const cancelDeletePlayer = () => {
    setShowDeleteModal(false);
    setPlayerToDelete(null);
  };

  // Player picker handlers
  const handlePlayerSearch = term => {
    setSearchTerm(term);
  };

  const handlePlayerSelect = player => {
    if (!selectedPlayers.find(p => p.id === player.id)) {
      setSelectedPlayers(prev => [...prev, player]);
    }
    setSearchTerm("");
    setSearchResults([]);
  };

  const handlePlayerRemove = playerId => {
    setSelectedPlayers(prev => prev.filter(p => p.id !== playerId));
  };

  const handleAddPlayers = async () => {
    if (selectedPlayers.length === 0) {
      return;
    }

    setIsAddingPlayers(true);
    try {
      let successCount = 0;
      for (const player of selectedPlayers) {
        const result = await dispatch(
          adminAddPlayerToTournament(
            competitionId,
            player, // Pass the entire player object with id, name, and profilePic
          ),
        );

        if (result) {
          successCount++;
        }
      }

      if (successCount > 0) {
        notifyMessage(
          "success",
          `Successfully added ${successCount} player${successCount !== 1 ? "s" : ""} to tournament`,
          3000,
          "colored",
          "top-center",
        );
        // Refresh tournament data
        await dispatch(fetchAllCompetitions());
        setSelectedPlayers([]);
        setShowPlayerPickerModal(false);
      }
    } catch (error) {
      notifyMessage("error", `Failed to add players: ${error.message}`, 5000, "colored", "top-center");
    } finally {
      setIsAddingPlayers(false);
    }
  };

  const handleCancelPlayerPicker = () => {
    setSelectedPlayers([]);
    setSearchTerm("");
    setShowPlayerPickerModal(false);
    setSearchResults([]);
  };

  useEffect(() => {
    const loadTeeSheet = async () => {
      if (tournament) {
        const teeSheetData = await dispatch(fetchTeeSheet(competitionId));
        if (teeSheetData?.data?.playerAssignments) {
          const playerOrderMap = {};
          teeSheetData.data.playerAssignments.forEach((assignment, index) => {
            playerOrderMap[assignment.playerId] = index;
          });

          let activePlayers = tournament.players.filter(player => player.status !== "withdrawn");
          let updatedPlayers = activePlayers.map(player => {
            const teeSheetPlayer = teeSheetData.data.playerAssignments.find(p => p.playerId === player.userId);
            const playerDivision = findDivisionById(player.division);
            const divisionRounds = playerDivision?.rounds || [];
            let playerRoundAssignments = teeSheetPlayer?.roundAssignments || [];

            const existingAssignmentsByDate = {};
            playerRoundAssignments.forEach(assignment => {
              existingAssignmentsByDate[assignment.date] = assignment;
            });

            const completeRoundAssignments = divisionRounds.map(round => {
              if (existingAssignmentsByDate[round.date]) {
                return existingAssignmentsByDate[round.date];
              }
              return {
                date: round.date,
                teeTime: "--:--",
              };
            });

            return {
              ...player,
              divisionName: playerDivision?.name || "Unknown",
              originalOrder: playerOrderMap[player.userId] ?? 999999,
              roundAssignments: completeRoundAssignments,
            };
          });

          updatedPlayers = _.sortBy(updatedPlayers, ["originalOrder"]);
          setDisplayedPlayers(updatedPlayers);
          setDataSource("server");

          // Capture original tee times for change tracking
          const originalTimes = {};
          updatedPlayers.forEach(player => {
            originalTimes[player.userId] = {};
            player.roundAssignments?.forEach(assignment => {
              originalTimes[player.userId][assignment.date] = assignment.teeTime;
            });
          });
          setOriginalTeeTimesRef(originalTimes);
        } else {
          const activePlayers = tournament.players.filter(player => player.status !== "withdrawn");
          const playersWithEmptyTimes = activePlayers.map(player => {
            const playerDivision = findDivisionById(player.division);
            return {
              ...player,
              divisionName: playerDivision?.name || "Unknown",
              roundAssignments:
                playerDivision?.rounds.map(round => ({
                  date: round.date,
                  teeTime: "--:--",
                })) || [],
            };
          });
          setDisplayedPlayers(playersWithEmptyTimes);
          setDataSource("server");

          // Capture original tee times for change tracking (empty times)
          const originalTimes = {};
          playersWithEmptyTimes.forEach(player => {
            originalTimes[player.userId] = {};
            player.roundAssignments?.forEach(assignment => {
              originalTimes[player.userId][assignment.date] = assignment.teeTime;
            });
          });
          setOriginalTeeTimesRef(originalTimes);
        }
      }
    };

    loadTeeSheet();
  }, [tournament, competitionId, dispatch, findDivisionById]); // Removed updateDisplayedData to prevent sorting from triggering reload

  // Fetch teesets if not already loaded
  useEffect(() => {
    if (!teesets || teesets.length === 0) {
      dispatch(fetchTeesets());
    }
  }, [dispatch, teesets]);

  useEffect(() => {
    if (!tournaments?.length) {
      dispatch(fetchAllCompetitions());
    } else {
      setIsLoading(false);
    }
  }, [dispatch, tournaments]);

  // REDESIGNED: Single source of truth for data loading
  // Only fetch tournament details when page loads
  useEffect(() => {
    if (competitionId) {
      dispatch(fetchCompetitionByID(competitionId));
    }
  }, [dispatch, competitionId]);

  // SIMPLIFIED: Single useEffect to manage server data
  useEffect(() => {
    // Always sync tournament data, but only update displayed data if no user actions are active
    if (activeTournament && activeTournament._id === competitionId) {
      setTournament(activeTournament);

      // Only update displayed data if user hasn't sorted the table
      if (dataSource === "server") {
        updateDisplayedData(activeTournament.players || [], "server");
      } else {
        // User has made changes, don't override their data
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTournament, competitionId]); // Minimal dependencies

  // Fallback for tournaments from the list
  useEffect(() => {
    if (!activeTournament && tournaments?.length && competitionId) {
      const foundTournament = tournaments.find(t => t._id === competitionId);
      if (foundTournament) {
        setTournament(foundTournament);
        if (dataSource === "server") {
          updateDisplayedData(foundTournament.players || [], "server");
        } else {
          // User has made changes, don't override their data
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournaments, competitionId, activeTournament]);

  // Handle player search with debouncing
  useEffect(() => {
    if (searchTerm.trim() !== "") {
      setIsSearching(true);
      const timer = setTimeout(async () => {
        try {
          const response = await CompetitionServices.fetchUsers(jwtToken);

          if (response.status === 200 && response.data) {
            // Get list of already registered ACTIVE player IDs (exclude withdrawn players)
            const registeredPlayerIds = new Set();
            if (tournament && tournament.players) {
              tournament.players.forEach(player => {
                // Only exclude active players, allow withdrawn players to be re-added
                if (player.userId && player.status !== "withdrawn") {
                  registeredPlayerIds.add(player.userId);
                }
              });
            }

            // Remove duplicates based on user ID
            const uniqueUsers = response.data.filter((user, index, array) => {
              return array.findIndex(u => u.id === user.id) === index;
            });

            // Filter users by search term and exclude already registered players
            const filteredUsers = uniqueUsers.filter(user => {
              const name = user.name?.toLowerCase() || "";
              const searchLower = searchTerm.toLowerCase();
              const matchesSearch = name.includes(searchLower);
              const notAlreadyRegistered = !registeredPlayerIds.has(user.id);
              return matchesSearch && notAlreadyRegistered;
            });
            setSearchResults(filteredUsers);
          } else {
            setSearchResults([]);
          }
        } catch (error) {
          console.error("💥 Error fetching users:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, 500);
      return () => {
        clearTimeout(timer);
      };
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }
  }, [searchTerm, jwtToken, tournament]);

  // Monitor division changes to maintain unsaved changes state
  useEffect(() => {
    const hasDivisionChanges = Object.keys(playerDivisionChanges).length > 0;
    if (hasDivisionChanges && !hasUnsavedChanges) {
      setHasUnsavedChanges(true);
    }
  }, [playerDivisionChanges, hasUnsavedChanges]);

  // REDESIGNED: Dedicated tee sheet loading
  // Only loads tee sheet data when tournament changes and merges with existing player data
  useEffect(() => {
    const loadTeeSheetData = async () => {
      if (tournament && !isGeneratingTeeTimes && dataSource === "server") {
        const teeSheetData = await dispatch(fetchTeeSheet(competitionId));

        if (teeSheetData?.teeSheet?.playerAssignments) {
          const activePlayers = tournament.players.filter(player => player.status !== "withdrawn");
          const updatedPlayers = activePlayers.map(player => {
            const teeSheetPlayer = teeSheetData.teeSheet.playerAssignments.find(
              p => p.playerId.toString() === player.userId,
            );
            if (teeSheetPlayer) {
              return {
                ...player,
                roundAssignments: teeSheetPlayer.roundAssignments,
              };
            }
            return player;
          });

          // Only update if data source is still 'server' (not overridden by user actions)
          if (dataSource === "server") {
            updateDisplayedData(updatedPlayers, "server");
          }
        }
      }
    };

    loadTeeSheetData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournament, competitionId, dispatch]); // Removed dataSource - useEffect should only run when tournament changes

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

  const formatTimeWithAMPM = date => {
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const ampm = hours >= 12 ? "PM" : "AM";

    hours = hours % 12;
    hours = hours ? hours : 12;

    const timeStr = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
      2,
      "0",
    )} ${ampm}`;
    return timeStr;
  };

  const formatTimeInput = input => {
    const format1 = /^(\d{1,2}):(\d{1,2})\s*(AM|PM|am|pm)$/i;
    const match1 = input.match(format1);
    if (match1) {
      const [, hours, minutes, period] = match1;
      return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}:00 ${period.toUpperCase()}`;
    }

    const format2 = /^(\d{1,2}):(\d{1,2}):(\d{1,2})$/;
    const match2 = input.match(format2);
    if (match2) {
      const [, hours, minutes, seconds] = match2;
      const intHours = parseInt(hours);
      const period = intHours >= 12 ? "PM" : "AM";
      const displayHours = intHours % 12 || 12;
      return `${displayHours.toString().padStart(2, "0")}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")} ${period}`;
    }

    const format3 = /^(\d{1,2}):(\d{1,2})$/;
    const match3 = input.match(format3);
    if (match3) {
      const [, hours, minutes] = match3;
      const intHours = parseInt(hours);
      const period = intHours >= 12 ? "PM" : "AM";
      const displayHours = intHours % 12 || 12;
      return `${displayHours.toString().padStart(2, "0")}:${minutes.padStart(2, "0")}:00 ${period}`;
    }

    return null;
  };

  const handleGenerateComplete = settings => {
    setIsGeneratingTeeTimes(true); // Prevent tee sheet reload during generation

    const { selectedDate } = settings; // Extract the selected date from settings

    // CRITICAL FIX: Capture current tee times BEFORE generating new ones
    // This allows the system to detect what changed
    const originalTimesBeforeGeneration = {};
    displayedPlayers.forEach(player => {
      originalTimesBeforeGeneration[player.userId] = {};
      player.roundAssignments?.forEach(assignment => {
        originalTimesBeforeGeneration[player.userId][assignment.date] = assignment.teeTime;
      });
    });

    const sortPlayers = players => {
      const sortedPlayers = [...players].sort((a, b) => {
        let comparison = 0;

        if (settings.sortBy === "5K Running Time") {
          comparison = Number(a.fiveKRunningTime) - Number(b.fiveKRunningTime);
        } else if (settings.sortBy === "Avg Golf Score") {
          comparison = Number(a.avgGolfScore) - Number(b.avgGolfScore);
        } else if (settings.sortBy === "Previous Round Finish Time") {
          // Sort by previous round finish time
          const previousDate = settings.previousDate;

          // Get previous round finish times for both players
          const getPreviousRoundTime = player => {
            // Get the previous round ID from divisions
            let previousRoundId = null;
            if (tournament?.divisions) {
              for (const division of tournament.divisions) {
                if (division.rounds) {
                  const previousRound = division.rounds.find(round => round.date === previousDate);
                  if (previousRound) {
                    previousRoundId = previousRound._id;
                    break;
                  }
                }
              }
            }

            if (player.scoreCards && previousRoundId) {
              const previousScoreCard = player.scoreCards.find(sc => sc.roundId === previousRoundId);
              if (previousScoreCard && previousScoreCard.totalTime && previousScoreCard.totalTime !== "--:--") {
                // Convert totalTime to seconds for comparison
                const timeParts = previousScoreCard.totalTime.split(":");
                if (timeParts.length === 2) {
                  const minutes = parseInt(timeParts[0]) || 0;
                  const seconds = parseInt(timeParts[1]) || 0;
                  return minutes * 60 + seconds;
                } else if (timeParts.length === 3) {
                  const hours = parseInt(timeParts[0]) || 0;
                  const minutes = parseInt(timeParts[1]) || 0;
                  const seconds = parseInt(timeParts[2]) || 0;
                  return hours * 3600 + minutes * 60 + seconds;
                }
              }
            }
            // Return a very large number for players without previous round times (sort them last)
            return 999999;
          };

          const timeA = getPreviousRoundTime(a);
          const timeB = getPreviousRoundTime(b);
          comparison = timeA - timeB;
        } else {
          // Default: Combined score
          const scoreA = Number(a.avgGolfScore) + Number(a.fiveKRunningTime);
          const scoreB = Number(b.avgGolfScore) + Number(b.fiveKRunningTime);
          comparison = scoreA - scoreB;
        }

        // Apply sort order: ascending (default) or descending
        return settings.sortOrder === "descending" ? -comparison : comparison;
      });

      return sortedPlayers;
    };

    const getRoundInfo = date => {
      const teeTimeInfo = tournament.basicInfo.teeTimes.find(tt => tt.date === date);
      return teeTimeInfo;
    };

    const getPlayersInRound = (date, players) => {
      const playersInRound = players.filter(player => {
        const division = findDivisionById(player.division);
        return division && division.rounds && division.rounds.some(r => r.date === date);
      });
      return playersInRound;
    };

    let processedPlayers = [];

    if (settings.consecutiveDivisions) {
      const playersByDivision = _.groupBy(displayedPlayers, "divisionName");

      settings.divisionOrder.forEach(divisionName => {
        const playersInDivision = playersByDivision[divisionName] || [];
        if (!playersInDivision.length) return;

        // CRITICAL FIX: Use current table order instead of sorting
        // The table might be sorted by tee times, so respect that order
        const divisionPlayersInTableOrder = playersInDivision;

        const divisionId = playersInDivision[0]?.division;
        const divisionConfig = divisionId ? findDivisionById(divisionId) : null;

        if (!divisionConfig || !divisionConfig.rounds) return;

        const playersWithTeeTimes = divisionPlayersInTableOrder.map((player, playerIndex) => {
          const existingAssignmentsByDate = {};
          if (player.roundAssignments && player.roundAssignments.length > 0) {
            player.roundAssignments.forEach(ra => {
              if (ra.date) {
                existingAssignmentsByDate[ra.date] = ra;
              }
            });
          }

          const newRoundAssignments = divisionConfig.rounds.map(round => {
            const roundInfo = getRoundInfo(round.date);
            if (!roundInfo) return { date: round.date, teeTime: "--:--" };

            // Check if this player already has a tee time for this round
            const existingAssignment = existingAssignmentsByDate[round.date];

            // Only generate tee times for the selected date
            if (round.date !== selectedDate) {
              // Return existing assignment or default for non-selected dates
              return existingAssignment || { date: round.date, teeTime: "--:--" };
            }

            // Generate new tee time for the selected round (overwrite existing)
            const previousDivisions = settings.divisionOrder.slice(0, settings.divisionOrder.indexOf(divisionName));
            const prevDivisionPlayers = previousDivisions.flatMap(div => playersByDivision[div] || []);
            const prevPlayersInRound = getPlayersInRound(round.date, prevDivisionPlayers);

            // For consecutive divisions, we don't count existing tee times in current division
            // since we're regenerating all times for the selected date
            const [baseHours, baseMinutes] = roundInfo.startTime.split(":").map(Number);
            const baseTime = new Date();
            baseTime.setHours(baseHours, baseMinutes, 0);

            const totalPreviousPlayers = prevPlayersInRound.length;
            const totalIntervalMs = settings.interval.minutes * 60000 + settings.interval.seconds * 1000;
            const finalTime = new Date(baseTime.getTime() + (totalPreviousPlayers + playerIndex) * totalIntervalMs);

            return {
              teeTime: formatTimeWithAMPM(finalTime),
              date: round.date,
            };
          });

          return {
            ...player,
            roundAssignments: newRoundAssignments,
          };
        });

        processedPlayers = [...processedPlayers, ...playersWithTeeTimes];
      });
    } else {
      const sortedPlayers = sortPlayers(displayedPlayers);

      processedPlayers = sortedPlayers.map(player => {
        const divisionConfig = findDivisionById(player.division);

        if (!divisionConfig || !divisionConfig.rounds) {
          return {
            ...player,
            roundAssignments: [],
          };
        }

        // Collect existing assignments by date
        const existingAssignmentsByDate = {};
        if (player.roundAssignments && player.roundAssignments.length > 0) {
          player.roundAssignments.forEach(ra => {
            if (ra.date) {
              existingAssignmentsByDate[ra.date] = ra;
            }
          });
        }

        const newRoundAssignments = divisionConfig.rounds.map(round => {
          const roundInfo = getRoundInfo(round.date);
          if (!roundInfo) return { date: round.date, teeTime: "--:--" };

          // Check if this player already has a tee time for this round
          const existingAssignment = existingAssignmentsByDate[round.date];

          // Only generate tee times for the selected date
          if (round.date !== selectedDate) {
            // Return existing assignment or default for non-selected dates (create new object)
            return existingAssignment
              ? { ...existingAssignment } // Create new object instead of returning reference
              : { date: round.date, teeTime: "--:--" };
          }

          // Generate new tee time for the selected round (overwrite existing)
          const playersInRound = getPlayersInRound(round.date, sortedPlayers);
          const playerPosition = playersInRound.findIndex(p => p.userId === player.userId);

          // For non-consecutive mode, we don't count existing tee times since we're regenerating all
          const [baseHours, baseMinutes] = roundInfo.startTime.split(":").map(Number);
          const baseTime = new Date();
          baseTime.setHours(baseHours, baseMinutes, 0);

          const finalTime = new Date(
            baseTime.getTime() +
              playerPosition * (settings.interval.minutes * 60000 + settings.interval.seconds * 1000),
          );

          return {
            date: round.date,
            teeTime: formatTimeWithAMPM(finalTime),
          };
        });

        return {
          ...player,
          roundAssignments: newRoundAssignments,
        };
      });
    }

    // CRITICAL FIX: Set the original tee times reference BEFORE updating displayed players
    // This ensures the change detection system can identify what changed
    setOriginalTeeTimesRef(originalTimesBeforeGeneration);

    // Update using new data management system
    updateDisplayedData([...processedPlayers], "generated");
    setHasUnsavedChanges(true);

    // Force a state update by updating a dummy state to trigger re-render
    setOriginalTeeTimesRef({ ...originalTimesBeforeGeneration });

    // Close the dialog
    setShowGenerateDialog(false);

    // Use a timeout to ensure the state updates are processed
    // Reset generation flag after a short delay
    setTimeout(() => {
      setIsGeneratingTeeTimes(false);
    }, 100);
  };

  const handleExportTeeSheet = () => {
    setShowExportDialog(true);
  };

  const handleAdjustTimes = adjustmentMinutes => {
    const updatedPlayers = displayedPlayers.map(player => ({
      ...player,
      roundAssignments: player.roundAssignments.map(round => {
        if (!round || !round.teeTime) return round;

        const timeMatch = round.teeTime.match(/(\d+):(\d+):(\d+)\s*(AM|PM)/i);
        if (!timeMatch) return round;

        let [, hours, minutes, seconds, period] = timeMatch;
        hours = parseInt(hours);
        if (period.toUpperCase() === "PM" && hours !== 12) hours += 12;
        if (period.toUpperCase() === "AM" && hours === 12) hours = 0;

        const date = new Date();
        date.setHours(hours, parseInt(minutes), parseInt(seconds));
        date.setMinutes(date.getMinutes() + adjustmentMinutes);

        return {
          ...round,
          teeTime: formatTimeWithAMPM(date),
        };
      }),
    }));

    updateDisplayedData(updatedPlayers, "adjusted");
    setHasUnsavedChanges(true);
  };

  const handleAdjustTeeSheet = () => {
    setShowAdjustDialog(true);
  };

  const handleSave = async () => {
    try {
      const activeDisplayedPlayers = displayedPlayers.filter(player => player.status !== "withdrawn");
      const teeSheetData = {
        playerAssignments: activeDisplayedPlayers.map(player => {
          // Use pending division change if exists, otherwise use current division
          const currentDivisionId = playerDivisionChanges[player._id] || player.division;
          const currentDivision = findDivisionById(currentDivisionId);

          return {
            playerId: player.userId,
            playerName: player.playerName,
            divisionId: currentDivisionId,
            divisionName: currentDivision?.name || player.divisionName,
            roundAssignments: player.roundAssignments.map(assignment => ({
              date: assignment.date,
              teeTime: assignment.teeTime,
            })),
          };
        }),
      };
      await dispatch(saveTeeSheet(competitionId, teeSheetData));

      // Clear pending changes after successful save
      setPlayerDivisionChanges({});
      setHasUnsavedChanges(false);

      notifyMessage("success", "Tee sheet saved successfully!", 5000, "colored", "top-center");

      // Refresh tournament data AND tee sheet data to reflect changes
      await Promise.all([dispatch(fetchAllCompetitions()), dispatch(fetchTeeSheet(competitionId))]);

      // IMPORTANT: After fetching fresh data, update original tee times to current displayed state
      // This prevents the useEffect from thinking there are changes when it reloads
      const newOriginalTimes = {};
      displayedPlayers.forEach(player => {
        newOriginalTimes[player.userId] = {};
        player.roundAssignments?.forEach(assignment => {
          newOriginalTimes[player.userId][assignment.date] = assignment.teeTime;
        });
      });
      setOriginalTeeTimesRef(newOriginalTimes);
    } catch (error) {
      console.error("COMPLETE Error saving tee sheet:", error);
      notifyMessage("error", `Failed to save tee sheet: ${JSON.stringify(error)}`, 5000, "colored", "top-center");
    }
  };

  const handleTimeChange = (newTime, player, date) => {
    const updatedPlayers = displayedPlayers.map(p => {
      if (p.userId === player.userId) {
        const currentAssignments = p.roundAssignments || [];
        const existingAssignmentIndex = currentAssignments.findIndex(ra => ra.date === date);
        const newAssignments = [...currentAssignments];

        if (existingAssignmentIndex >= 0) {
          newAssignments[existingAssignmentIndex] = {
            ...newAssignments[existingAssignmentIndex],
            teeTime: newTime,
          };
        } else {
          newAssignments.push({
            date: date,
            teeTime: newTime,
          });
        }

        return {
          ...p,
          roundAssignments: newAssignments,
        };
      }
      return p;
    });

    setDisplayedPlayers(updatedPlayers);
    setHasUnsavedChanges(true);
  };

  const handleBlur = (finalTime, player, date, originalTime) => {
    const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9]:[0-5][0-9] (AM|PM)$/i;

    if (!timeRegex.test(finalTime) && finalTime !== "--:--") {
      const formattedTime = formatTimeInput(finalTime);

      if (formattedTime) {
        handleTimeChange(formattedTime, player, date);
      } else {
        const updatedPlayers = displayedPlayers.map(p => {
          if (p.userId === player.userId) {
            return {
              ...p,
              roundAssignments: p.roundAssignments.map(ra => {
                if (ra.date === date) {
                  return { ...ra, teeTime: originalTime };
                }
                return ra;
              }),
            };
          }
          return p;
        });
        setDisplayedPlayers(updatedPlayers);
        notifyMessage(
          "warning",
          "Invalid time format. Please use HH:MM:SS AM/PM format.",
          3000,
          "colored",
          "top-center",
        );
      }
    }
  };

  // Helper function to get course and tee information for a round
  const getCourseAndTeeInfo = round => {
    if (!round) return "Unknown Course (Unknown Tee)";

    let courseName = "Unknown Course";
    let teeName = "Unknown Tee";

    // Get course name
    if (round.course) {
      courseName = round.course.name ? round.course.name.split(",")[0] : "Unknown Course";
    } else if (round.courseId && tournament?.courses) {
      const course = tournament.courses.find(c => c.courseId === round.courseId || c._id === round.courseId);
      if (course) {
        courseName = course.name ? course.name.split(",")[0] : "Unknown Course";
      }
    }

    // Get tee name - first try embedded tee data
    if (round.tee?.name) {
      teeName = round.tee.name;
    } else if (round.teeName) {
      teeName = round.teeName;
    }
    // Then try to find tee info using teeId and teesets
    else if (round.teeId && teesets) {
      const teeInfo = teesets.find(tee => tee._id === round.teeId || tee.id === round.teeId);
      if (teeInfo?.name) {
        teeName = teeInfo.name;
      }
    }
    // Fallback to course tees if available
    else if (round.teeId && tournament?.courses) {
      const course = tournament.courses.find(c => c.courseId === round.courseId || c._id === round.courseId);
      if (course && course.tees) {
        let teeInfo = null;
        if (Array.isArray(course.tees)) {
          teeInfo = course.tees.find(tee => tee.id === round.teeId || tee._id === round.teeId);
        } else if (typeof course.tees === "object") {
          teeInfo = Object.values(course.tees).find(tee => tee.id === round.teeId || tee._id === round.teeId);
        }
        if (teeInfo?.name) {
          teeName = teeInfo.name;
        }
      }
    }

    return `${courseName} (${teeName})`;
  };

  const getAllDates = () => {
    const dates = new Set();

    tournament.divisions?.forEach(division => {
      division.rounds?.forEach(round => {
        if (round.date) {
          dates.add(round.date);
        }
      });
    });

    return Array.from(dates).sort();
  };

  const handleColumnSort = date => {
    // Debounce rapid clicks
    const now = Date.now();
    if (now - lastSortTime < 300) {
      return;
    }
    setLastSortTime(now);

    const currentDirection = sortDirection[date] || "asc";
    const newDirection = currentDirection === "asc" ? "desc" : "asc";

    // Sort in place to preserve object references - this prevents change detection issues
    const sortedPlayers = displayedPlayers.slice(); // Create shallow copy for sorting
    sortedPlayers.sort((a, b) => {
      const timeA = getPlayerTeeTime(a, date);
      const timeB = getPlayerTeeTime(b, date);

      // Handle empty tee times
      if (timeA === "--:--" && timeB === "--:--") return 0;
      if (timeA === "--:--") return 1;
      if (timeB === "--:--") return -1;

      // Convert times to comparable format
      const timeAMinutes = convertTimeToMinutes(timeA);
      const timeBMinutes = convertTimeToMinutes(timeB);

      const comparison = timeAMinutes - timeBMinutes;
      return newDirection === "asc" ? comparison : -comparison;
    });

    updateDisplayedData(sortedPlayers, "user-sorted");
    setActiveSortColumn(date);
    setSortDirection({ ...sortDirection, [date]: newDirection });
  };

  const convertTimeToMinutes = timeString => {
    if (!timeString || timeString === "--:--") return 0;

    const [time, period] = timeString.split(" ");
    const [hours, minutes] = time.split(":").map(Number);

    let totalMinutes = minutes;
    if (period === "PM" && hours !== 12) {
      totalMinutes += (hours + 12) * 60;
    } else if (period === "AM" && hours === 12) {
      totalMinutes += 0; // 12 AM is 0 hours
    } else {
      totalMinutes += hours * 60;
    }

    return totalMinutes;
  };

  const getPlayerTeeTime = (player, date) => {
    const assignment = player.roundAssignments?.find(ra => ra.date === date);
    return assignment?.teeTime || "--:--";
  };

  const roundDates = getAllDates();
  const themeColors = getThemeColors();

  return (
    <Container fluid className="p-4" style={{ paddingTop: "100px" }}>
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
            <h2 className="mb-0">{tournament.basicInfo.name}: Player Roster</h2>
            <p className="m-0" style={{ color: "white" }}>
              {tournament.basicInfo.startDate && new Date(tournament.basicInfo.startDate).toLocaleDateString()} -{" "}
              {tournament.basicInfo.endDate && new Date(tournament.basicInfo.endDate).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {!displayedPlayers?.length ? (
        <Alert variant="info">No players have registered for this tournament yet.</Alert>
      ) : (
        <>
          <div className="tournament-table-container">
            <Table bordered className="mt-3">
              <thead>
                <tr>
                  <th>Registered Player</th>
                  <th>Division</th>
                  <th>Avg Golf Score</th>
                  <th>5k run time</th>
                  <th>Actions</th>
                  {roundDates.map((date, idx) => {
                    const currentSortDirection = sortDirection[date];
                    const isSorted = activeSortColumn === date;

                    return (
                      <th key={date} style={{ position: "relative", userSelect: "none" }}>
                        <div
                          className="d-flex align-items-center justify-content-between"
                          onClick={() => handleColumnSort(date)}
                          style={{
                            padding: "12px 8px",
                            minHeight: "48px",
                            cursor: "pointer",
                            borderRadius: "4px",
                            margin: "-4px",
                          }}
                        >
                          <span style={{ fontSize: "14px", fontWeight: "500" }}>Day {idx + 1} Tee Time</span>
                          <div
                            className="d-flex flex-column ms-2"
                            style={{
                              fontSize: "1rem", // Larger icons for better touch targets
                              lineHeight: "1",
                              minWidth: "20px", // Ensure adequate touch area width
                              alignItems: "center",
                            }}
                          >
                            <FontAwesomeIcon
                              icon="sort-up"
                              style={{
                                color: isSorted && currentSortDirection === "asc" ? "#007bff" : "#dee2e6",
                                marginBottom: "-1px",
                                transition: "color 0.2s ease",
                              }}
                            />
                            <FontAwesomeIcon
                              icon="sort-down"
                              style={{
                                color: isSorted && currentSortDirection === "desc" ? "#007bff" : "#dee2e6",
                                marginTop: "-1px",
                                transition: "color 0.2s ease",
                              }}
                            />
                          </div>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {displayedPlayers.map((player, index) => {
                  const currentDivisionId = getCurrentDivisionId(player);
                  const division = findDivisionById(currentDivisionId);

                  return (
                    <tr key={index}>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <img
                            src={player.profilePic || DefaultProfilePic}
                            alt={player.playerName}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              objectFit: "cover",
                              flexShrink: 0,
                            }}
                          />
                          <span>
                            {player.playerName}
                            {player.scoreCards && player.scoreCards.length > 0 && (
                              <span
                                className="badge bg-info ms-2"
                                style={{ fontSize: "0.7rem" }}
                                title="Player has existing scores - changing division may cause score loss"
                              >
                                Has Scores
                              </span>
                            )}
                            {player.homeCountry && (
                              <span
                                className={`flag-icon flag-icon-${player.homeCountry.toLowerCase()}`}
                                title={player.homeCountry}
                                style={{ marginLeft: "8px" }}
                              />
                            )}
                          </span>
                        </div>
                      </td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={getCurrentDivisionId(player)}
                          onChange={e => handleDivisionChange(player._id, e.target.value)}
                          style={{
                            fontSize: "0.875rem",
                            backgroundColor: playerDivisionChanges[player._id] ? "#fff3cd" : "",
                            borderColor: playerDivisionChanges[player._id] ? "#ffc107" : "",
                          }}
                          title={
                            playerDivisionChanges[player._id]
                              ? "Division change pending - click Save Changes to apply"
                              : ""
                          }
                        >
                          {tournament.divisions.map(division => (
                            <option key={division._id} value={division._id}>
                              {division.name}
                            </option>
                          ))}
                        </Form.Select>
                      </td>
                      <td>{player.avgGolfScore}</td>
                      <td>{player.fiveKRunningTime}</td>
                      <td style={{ textAlign: "center" }}>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDeletePlayer(player._id)}
                          title="Delete Player"
                          aria-label={`Remove ${player.playerName} from tournament`}
                          style={{ border: "none", background: "transparent" }}
                        >
                          <FontAwesomeIcon icon="trash" style={{ color: "#dc3545" }} />
                        </Button>
                      </td>
                      {roundDates.map((date, idx) => {
                        const divisionRound = division?.rounds?.find(round => round.date === date);
                        const roundAssignment = player.roundAssignments?.find(ra => ra.date === date);
                        const time = roundAssignment ? roundAssignment.teeTime : "--:--";

                        return (
                          <td key={date}>
                            <input
                              type="text"
                              value={time}
                              onChange={e => handleTimeChange(e.target.value, player, date)}
                              onBlur={e => handleBlur(e.target.value, player, date, time)}
                              style={{
                                border: "none",
                                background: isTeeTimeChanged(player, date, time) ? "#fff3cd" : "transparent",
                                borderColor: isTeeTimeChanged(player, date, time) ? "#ffc107" : "transparent",
                                borderWidth: isTeeTimeChanged(player, date, time) ? "1px" : "0",
                                borderStyle: isTeeTimeChanged(player, date, time) ? "solid" : "none",
                                width: "100%",
                                font: "inherit",
                                padding: 0,
                                margin: 0,
                                cursor: time === "--:--" ? "not-allowed" : "text",
                              }}
                              title={
                                isTeeTimeChanged(player, date, time)
                                  ? "Tee time change pending - click Save Changes to apply"
                                  : ""
                              }
                              disabled={time === "--:--" && !divisionRound}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </div>

          <div className="tournament-button-container">
            <div className="tournament-button-wrapper">
              <Button
                variant="dark"
                onClick={() => {
                  setShowPlayerPickerModal(true);
                }}
              >
                Add Players...
              </Button>
              <Button variant="dark" onClick={() => setShowGenerateDialog(true)}>
                Generate Tee Times...
              </Button>
              <Button variant="dark" onClick={handleExportTeeSheet}>
                Export Tee Sheet...
              </Button>
              <Button variant="dark" onClick={handleAdjustTeeSheet}>
                Adjust Tee Sheet...
              </Button>
              <Button variant="dark" onClick={() => setShowDivisionInfoModal(true)}>
                Division Info...
              </Button>
            </div>
          </div>
        </>
      )}

      <div className="d-flex justify-content-between mt-4">
        <Button variant="danger" onClick={() => navigate("/competitions")}>
          Cancel Changes
        </Button>
        <div className="d-flex align-items-center gap-2">
          <div className="d-flex flex-column align-items-end">
            {(Object.keys(playerDivisionChanges).length > 0 || getPendingTeeTimeChanges() > 0) && (
              <small className="text-muted mb-1">
                {Object.keys(playerDivisionChanges).length > 0 && (
                  <span>
                    {Object.keys(playerDivisionChanges).length} division change
                    {Object.keys(playerDivisionChanges).length !== 1 ? "s" : ""}
                    {getPendingTeeTimeChanges() > 0 && ", "}
                  </span>
                )}
                {getPendingTeeTimeChanges() > 0 && (
                  <span>
                    {getPendingTeeTimeChanges()} tee time change{getPendingTeeTimeChanges() !== 1 ? "s" : ""}
                  </span>
                )}
                {" pending"}
              </small>
            )}
          </div>
          <Button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            style={{
              backgroundColor: hasUnsavedChanges ? "#13294e" : "#6c757d",
              borderColor: hasUnsavedChanges ? "#13294e" : "#6c757d",
              color: "white",
              opacity: hasUnsavedChanges ? 1 : 0.65,
            }}
          >
            Save Changes
          </Button>
        </div>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "inline-block",
            backgroundColor: "#13294e",
            border: "1px solid #13294e",
            padding: "10px 15px",
            color: "white",
            textDecoration: "none",
            fontWeight: "normal",
            textAlign: "center",
            width: "auto",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Back to Tournament
        </button>
      </div>

      <GenerateDialog
        show={showGenerateDialog}
        onClose={() => setShowGenerateDialog(false)}
        tournament={tournament}
        onGenerate={handleGenerateComplete}
      />
      <ExportTeeSheetDialog
        show={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        tournament={tournament}
        displayedPlayers={displayedPlayers}
      />
      <AdjustTeeSheetDialog
        show={showAdjustDialog}
        onClose={() => setShowAdjustDialog(false)}
        onAdjust={handleAdjustTimes}
      />

      {/* Delete Player Confirmation Modal */}
      <Modal
        show={showDeleteModal}
        onHide={cancelDeletePlayer}
        centered
        dialogClassName="delete-player-modal"
        size="sm"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Modal.Header closeButton style={{ textAlign: "center" }}>
          <Modal.Title style={{ width: "100%", textAlign: "center" }}>Remove Player</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ textAlign: "center" }}>
          <p>
            Are you sure you want to remove <strong>{playerToDelete?.playerName}</strong> from this tournament?
          </p>
          <p className="text-danger">
            <strong>This action cannot be undone!</strong>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDeletePlayer} autoFocus>
            No, cancel
          </Button>
          <Button variant="danger" onClick={confirmDeletePlayer}>
            Yes, remove
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Division Change Warning Modal */}
      <Modal show={showDivisionWarningModal} onHide={cancelDivisionChange} centered size="sm">
        <Modal.Header closeButton style={{ textAlign: "center" }}>
          <Modal.Title style={{ width: "100%", textAlign: "center", color: "#dc3545" }}>
            ⚠️ Division Change Warning
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ textAlign: "center" }}>
          <p>
            <strong>{pendingDivisionChange?.player?.playerName}</strong> has existing scores.
          </p>

          <p className="text-warning">
            <strong>Score Loss Risk:</strong> Moving them to a different division may cause their scores to be lost if
            the new division has different round configurations.
          </p>

          <p className="text-danger">
            <strong>Are you sure you want to proceed?</strong>
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={cancelDivisionChange} autoFocus>
            Cancel
          </Button>
          <Button variant="warning" onClick={confirmDivisionChange}>
            Yes, change division
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Player Picker Modal */}
      <Modal
        show={showPlayerPickerModal}
        onHide={handleCancelPlayerPicker}
        size="lg"
        centered
        className="player-picker-modal"
      >
        <Modal.Header closeButton className="text-center">
          <Modal.Title className="w-100 text-center">Add Players to Tournament</Modal.Title>
        </Modal.Header>
        <Modal.Body className="px-4">
          <div className="mb-4">
            <label className="form-label fw-bold">Search for players:</label>
            <input
              className="form-control form-control-lg"
              type="search"
              value={searchTerm}
              onChange={e => handlePlayerSearch(e.target.value)}
              placeholder="Search by name..."
              style={{
                border: "2px solid rgb(77, 125, 177)",
                borderRadius: "8px",
                fontSize: "16px", // Prevents zoom on iOS
              }}
            />
          </div>

          {/* Search Results */}
          {searchTerm && (
            <div
              className="search-results mb-4"
              style={{
                border: "1px solid #ddd",
                borderRadius: "8px",
                boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
                maxHeight: "250px",
                overflowY: "auto",
                backgroundColor: "#fff",
                position: "relative",
                zIndex: 1050, // Ensure it's above other content
              }}
            >
              {isSearching ? (
                <div className="text-center p-4">
                  <Spinner size="sm" className="me-2" />
                  <span>Searching players...</span>
                </div>
              ) : searchResults.length > 0 ? (
                searchResults
                  .filter(player => player.id !== currentUserId)
                  .filter(player => {
                    // Check against tournament.players (exclude only active players, allow withdrawn)
                    const activeTournamentPlayer = tournament.players?.some(
                      tournamentPlayer =>
                        tournamentPlayer.userId === player.id && tournamentPlayer.status !== "withdrawn",
                    );
                    // Check against displayedPlayers (current UI state)
                    const inDisplayedPlayers = displayedPlayers?.some(
                      displayedPlayer => displayedPlayer.userId === player.id,
                    );

                    return !activeTournamentPlayer && !inDisplayedPlayers;
                  })
                  .map(player => (
                    <div
                      key={player.id}
                      className="search-result-item d-flex align-items-center p-3"
                      style={{
                        cursor: "pointer",
                        borderBottom: "1px solid #f0f0f0",
                        transition: "background-color 0.2s ease",
                        minHeight: "60px", // Ensure touch targets are large enough on mobile
                      }}
                      onClick={() => handlePlayerSelect(player)}
                      onMouseEnter={e => (e.target.style.backgroundColor = "#f8f9fa")}
                      onMouseLeave={e => (e.target.style.backgroundColor = "transparent")}
                    >
                      <img
                        src={DefaultProfilePic}
                        alt="Profile"
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "50%",
                          marginRight: "12px",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: "16px", fontWeight: "500" }}>{player.name}</span>
                    </div>
                  ))
              ) : (
                <div className="text-center text-muted p-4">
                  <i className="fas fa-search me-2"></i>
                  No players found matching your search.
                </div>
              )}
            </div>
          )}

          {/* Selected Players */}
          {selectedPlayers.length > 0 && (
            <div className="mb-4">
              <label className="form-label fw-bold">Selected players ({selectedPlayers.length}):</label>
              <div
                className="border rounded p-3"
                style={{
                  maxHeight: "180px",
                  overflowY: "auto",
                  backgroundColor: "#f8f9fa",
                  border: "2px dashed #dee2e6",
                }}
              >
                {selectedPlayers.map(player => (
                  <div
                    key={player.id}
                    className="d-flex align-items-center justify-content-between mb-2 p-2 bg-white rounded"
                    style={{ minHeight: "50px" }}
                  >
                    <div className="d-flex align-items-center">
                      <img
                        src={DefaultProfilePic}
                        alt="Profile"
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "50%",
                          marginRight: "12px",
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ fontSize: "16px", fontWeight: "500" }}>{player.name}</span>
                    </div>
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => handlePlayerRemove(player.id)}
                      style={{ minWidth: "80px" }}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <small className="text-muted mt-2 d-block">
                <i className="fas fa-info-circle me-1"></i>
                Players will be added to the first division with default golf score (85) and 5K time (25:00). You can
                adjust these values after adding them.
              </small>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button variant="danger" onClick={handleCancelPlayerPicker} style={{ minWidth: "100px" }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddPlayers}
            disabled={selectedPlayers.length === 0 || isAddingPlayers}
            style={{
              minWidth: "120px",
              backgroundColor: "#13294e",
              border: "1px solid #13294e",
              color: "white",
            }}
          >
            {isAddingPlayers ? (
              <>
                <Spinner size="sm" className="me-2" />
                Adding...
              </>
            ) : (
              `Add ${selectedPlayers.length} Player${selectedPlayers.length !== 1 ? "s" : ""}`
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Division Info Modal */}
      <Modal show={showDivisionInfoModal} onHide={() => setShowDivisionInfoModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>Division Information</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {tournament?.divisions?.map(division => (
            <div key={division.name} className="mb-4 p-3 border rounded">
              <h5 className="text-primary mb-3">{division.name} Division</h5>

              {division.rounds?.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped table-sm">
                    <thead>
                      <tr>
                        <th>Round</th>
                        <th>Date</th>
                        <th>Course & Tee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {division.rounds.map((round, idx) => (
                        <tr key={idx}>
                          <td>Round {idx + 1}</td>
                          <td>{new Date(round.date).toLocaleDateString()}</td>
                          <td>{getCourseAndTeeInfo(round)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted">No rounds configured for this division.</p>
              )}
            </div>
          ))}

          {(!tournament?.divisions || tournament.divisions.length === 0) && (
            <p className="text-muted">No divisions configured for this tournament.</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDivisionInfoModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default TournamentTeeSheetPage;
