import React, { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Spinner } from "react-bootstrap";
import { getPublicTournamentTeesheet, getPublicTournamentLeaderboard } from "../competitionServices";
import "flag-icon-css/css/flag-icons.min.css";
const DEFAULT_PLAYER_IMAGE = "/images/DefaultProfilePic.jpg";

const PublicTournamentTeesheet = () => {
  const { uniqueName } = useParams();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(null);
  const [teeSheetData, setTeeSheetData] = useState({});

  // Function to determine which round should be the default based on completion
  const getDefaultTab = useCallback((dayKeys, leaderboardData) => {
    if (!leaderboardData || !dayKeys.length) {
      return dayKeys[0] || "day1";
    }

    try {
      // Check each round to see if it has been completed by any players
      for (let i = 0; i < dayKeys.length; i++) {
        const dayKey = dayKeys[i];

        // Check if this round has any completed scores
        let hasCompletedScores = false;

        // Look for players with completed scores for this round
        if (leaderboardData.divisions) {
          for (const division of leaderboardData.divisions) {
            // Find players in this division from the tournament data
            const divisionPlayers = leaderboardData.players?.filter(player => player.division === division._id) || [];

            for (const player of divisionPlayers) {
              if (player.scoreCards && player.scoreCards.length > 0) {
                // Check if this player has completed this specific round
                const hasRoundScore = player.scoreCards.some(scorecard => {
                  if (division.rounds && division.rounds[i]) {
                    return scorecard.roundId === division.rounds[i]._id;
                  }
                  return false;
                });

                if (hasRoundScore) {
                  hasCompletedScores = true;
                  break;
                }
              }
            }
            if (hasCompletedScores) break;
          }
        }

        // If this round has no completed scores, it's the next round to play
        if (!hasCompletedScores) {
          return dayKey;
        }
      }

      // If all rounds have some completed scores, default to the last round
      return dayKeys[dayKeys.length - 1];
    } catch (error) {
      console.warn("Error determining default tab, falling back to first day:", error);
      return dayKeys[0] || "day1";
    }
  }, []);

  const processTeeSheetData = useCallback(
    (data, leaderboard = null) => {
      if (!data.teeSheet || !data.teeSheet.playerAssignments) {
        setTeeSheetData({});
        return;
      }

      const assignmentsByDay = {};
      const startDate = new Date(data.tournamentInfo.startDate);
      const endDate = new Date(data.tournamentInfo.endDate);
      let dayCount = 0;
      const currentDate = new Date(startDate);

      // Helper function to format date for display
      const formatDayMonth = dateObj => {
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return `${months[dateObj.getMonth()]} ${dateObj.getDate()}`;
      };

      while (currentDate <= endDate) {
        dayCount++;
        const dayKey = `day${dayCount}`;
        const formattedDate = formatDayMonth(currentDate);

        assignmentsByDay[dayKey] = {
          date: new Date(currentDate),
          displayDate: formattedDate,
          players: [],
        };

        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Process player assignments
      data.teeSheet.playerAssignments.forEach(assignment => {
        if (!assignment.roundAssignments || assignment.roundAssignments.length === 0) {
          return;
        }

        assignment.roundAssignments.forEach(round => {
          const roundDate = new Date(round.date);
          const dayDiff = Math.floor((roundDate - startDate) / (1000 * 60 * 60 * 24));
          const dayKey = `day${dayDiff + 1}`;

          if (assignmentsByDay[dayKey]) {
            let profilePic = DEFAULT_PLAYER_IMAGE;
            let homeCountry = null;
            if (data.players && Array.isArray(data.players)) {
              const player = data.players.find(p => p.playerName === assignment.playerName);
              if (player) {
                if (player.profilePic) {
                  profilePic = player.profilePic;
                }
                if (player.homeCountry) {
                  homeCountry = player.homeCountry;
                }
              }
            }

            assignmentsByDay[dayKey].players.push({
              name: assignment.playerName,
              playerId: assignment.playerId,
              teeTime: round.teeTime,
              division: assignment.divisionName,
              profilePic: profilePic,
              homeCountry: homeCountry,
            });
          }
        });
      });

      // Sort players within each day by tee time
      Object.keys(assignmentsByDay).forEach(dayKey => {
        assignmentsByDay[dayKey].players.sort((a, b) => a.teeTime.localeCompare(b.teeTime));
      });

      setTeeSheetData(assignmentsByDay);

      // Determine the smart default tab based on round completion
      const dayKeys = Object.keys(assignmentsByDay);
      const defaultTab = getDefaultTab(dayKeys, leaderboard);
      setActiveTab(defaultTab);
    },
    [getDefaultTab],
  );

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setLoading(true);

        // Fetch both teesheet and leaderboard data in parallel
        const [teesheetResponse, leaderboardResponse] = await Promise.all([
          getPublicTournamentTeesheet(uniqueName),
          getPublicTournamentLeaderboard(uniqueName),
        ]);

        if (teesheetResponse.status === 200 && teesheetResponse.data.success) {
          const tournamentData = teesheetResponse.data.data;
          setTournament(tournamentData);

          // Process tee sheet data with leaderboard data if available (for round completion detection)
          let leaderboard = null;
          if (leaderboardResponse.status === 200 && leaderboardResponse.data.success) {
            leaderboard = leaderboardResponse.data.data;
          }

          processTeeSheetData(tournamentData, leaderboard);
        } else {
          throw new Error(teesheetResponse.data.message || "Failed to fetch tournament tee sheet");
        }
      } catch (err) {
        console.error("Error fetching tournament tee sheet:", err);
        setError("Failed to load tournament tee sheet. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (uniqueName) {
      fetchTournament();
    }
  }, [uniqueName, processTeeSheetData]);

  const formatTime = timeString => {
    if (!timeString) return "";
    if (timeString.match(/^\d{1,2}:\d{2} [AP]M$/)) {
      return timeString;
    }

    try {
      const parts = timeString.split(" ");
      if (parts.length !== 2) return timeString;
      const timeParts = parts[0].split(":");
      if (timeParts.length < 2) return timeString;
      const hours = parseInt(timeParts[0], 10);
      return `${hours}:${timeParts[1]} ${parts[1]}`;
    } catch (err) {
      console.error("Error formatting time:", err);
      return timeString;
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "40px 0" }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading tournament tee sheet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
        <div className="alert alert-danger">{error}</div>
        <Link to="/competitions/public" className="btn btn-primary">
          Back to Tournaments
        </Link>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "20px" }}>
        <div className="alert alert-warning">Tournament not found or not published.</div>
        <Link to="/competitions/public" className="btn btn-primary">
          Back to Tournaments
        </Link>
      </div>
    );
  }

  return (
    <>
      <Container fluid style={{ paddingTop: "50px" }}>
        {/* Breadcrumb Navigation */}
        <nav aria-label="breadcrumb" className="mb-3">
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
                  {tournament?.tournamentInfo?.startDate && tournament?.tournamentInfo?.name
                    ? `${new Date(tournament.tournamentInfo.startDate).getFullYear()} ${tournament.tournamentInfo.name}`
                    : uniqueName}
                </a>
              </li>
              <li
                className="breadcrumb-item active"
                aria-current="page"
                style={{ color: "#495057", fontWeight: "500" }}
              >
                Tee Sheet
              </li>
            </ol>
          </div>
        </nav>

        {/* Tournament Header Banner - full width */}
        <div
          style={{
            backgroundColor: "#13294E",
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
                src={tournament.tournamentInfo?.logo || "../../../../images/DefaultGolfCoursePic.jpg"}
                alt={`${tournament.tournamentInfo?.name} logo`}
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
                <h2 className="mb-0">{tournament.tournamentInfo.name}: Tee Sheet</h2>
                <p className="m-0" style={{ color: "#FFFFFF" }}>
                  {tournament.tournamentInfo?.startDate && tournament.tournamentInfo?.endDate
                    ? `${new Date(tournament.tournamentInfo.startDate).toLocaleDateString()} - ${new Date(tournament.tournamentInfo.endDate).toLocaleDateString()}`
                    : tournament.tournamentInfo?.startDate
                      ? new Date(tournament.tournamentInfo.startDate).toLocaleDateString()
                      : "Dates not available"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ paddingLeft: "20px", paddingRight: "20px" }}>
          <div style={{ maxWidth: "100%", overflowX: "hidden" }}>
            <div style={{ maxWidth: "1200px", padding: "0 20px" }}>
              <div
                style={{
                  display: "flex",
                  borderBottom: "1px solid #ccc",
                }}
              >
                {Object.entries(teeSheetData).map(([dayKey, dayData]) => (
                  <div
                    key={dayKey}
                    style={{
                      padding: "8px 12px",
                      cursor: "pointer",
                      backgroundColor: activeTab === dayKey ? "#f0f0f0" : "transparent",
                      borderBottom: activeTab === dayKey ? "none" : "none",
                      borderLeft: activeTab === dayKey ? "1px solid #ccc" : "none",
                      borderRight: activeTab === dayKey ? "1px solid #ccc" : "none",
                      borderTop: activeTab === dayKey ? "1px solid #ccc" : "none",
                      marginBottom: activeTab === dayKey ? "-1px" : "0",
                      fontWeight: activeTab === dayKey ? "bold" : "normal",
                    }}
                    onClick={() => setActiveTab(dayKey)}
                  >
                    {dayData.displayDate}
                  </div>
                ))}
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  padding: "15px 0",
                  borderBottom: "1px solid #ccc",
                }}
              >
                <div style={{ fontWeight: "bold" }}>Player</div>
                <div style={{ fontWeight: "bold" }}>Tee Time</div>
                <div style={{ fontWeight: "bold" }}>Division</div>
              </div>
              {teeSheetData[activeTab]?.players.map((player, index) => (
                <div
                  key={index}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    padding: "15px 0",
                    borderBottom: "1px solid #eee",
                    alignItems: "center",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "5px",
                        overflow: "hidden",
                        marginRight: "15px",
                        backgroundColor: "#f0f0f0",
                      }}
                    >
                      <img
                        src={player.profilePic || DEFAULT_PLAYER_IMAGE}
                        alt={player.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => {
                          e.target.src = DEFAULT_PLAYER_IMAGE;
                        }}
                      />
                    </div>
                    <div style={{ fontWeight: "bold", display: "flex", alignItems: "center" }}>
                      {player.name}
                      {player.homeCountry && (
                        <span
                          className={`flag-icon flag-icon-${player.homeCountry.toLowerCase()}`}
                          title={player.homeCountry}
                          style={{ marginLeft: "8px", fontSize: "1rem" }}
                        />
                      )}
                    </div>
                  </div>
                  <div>{formatTime(player.teeTime)}</div>
                  <div>{player.division}</div>
                </div>
              ))}
              {(!teeSheetData[activeTab] || !teeSheetData[activeTab].players.length) && (
                <div style={{ textAlign: "center", padding: "30px 0" }}>
                  <p>No tee times scheduled for this day.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </Container>
    </>
  );
};

export default PublicTournamentTeesheet;
