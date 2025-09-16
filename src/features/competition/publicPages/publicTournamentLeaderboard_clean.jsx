import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Alert, Button, Spinner } from "react-bootstrap";
import { getPublicTournamentLeaderboard } from "../competitionServices";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import Navbar from "features/shared/Navbar/Navbar";
import "flag-icon-css/css/flag-icons.min.css";

const PublicTournamentLeaderboard = () => {
  const { uniqueName } = useParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [tournament, setTournament] = useState(null);
  const [selectedDivisionId, setSelectedDivisionId] = useState("");
  const [fullCoursesData, setFullCoursesData] = useState({});
  const [error, setError] = useState(null);

  // Ref for the division select element
  const divisionSelectRef = useRef(null);

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

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setIsLoading(true);
        const response = await getPublicTournamentLeaderboard(uniqueName);

        if (response.status === 200 && response.data.success) {
          const data = response.data.data;
          setTournament(data);

          // Set default division
          if (data.divisions && data.divisions.length > 0) {
            setSelectedDivisionId(data.divisions[0]._id);
          }

          // Process courses data
          if (data.courses) {
            const coursesData = {};
            data.courses.forEach(course => {
              coursesData[course._id || course.courseId] = course;
            });
            setFullCoursesData(coursesData);
          }
        } else {
          throw new Error(response.data.message || "Failed to fetch tournament leaderboard");
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

  const handleBackToTournament = () => {
    navigate(`/competitions/u/${uniqueName}`);
  };

  const themeColors = getThemeColors();

  if (isLoading) {
    return (
      <>
        <Navbar />
        <Container className="text-center mt-5" style={{ paddingTop: "100px" }}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Loading tournament leaderboard...</p>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <Container className="mt-5" style={{ paddingTop: "100px" }}>
          <div className="alert alert-danger">{error}</div>
          <Button onClick={handleBackToTournament} variant="primary">
            Back to Tournament
          </Button>
        </Container>
      </>
    );
  }

  if (!tournament) {
    return (
      <>
        <Navbar />
        <Container className="mt-5" style={{ paddingTop: "100px" }}>
          <div className="alert alert-warning">Tournament not found or not published.</div>
          <Button onClick={handleBackToTournament} variant="primary">
            Back to Tournament
          </Button>
        </Container>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <Container fluid style={{ paddingTop: "50px" }}>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 style={{ color: themeColors.titleText }}>
            <FontAwesomeIcon icon={faTrophy} className="me-2" />
            {tournament.name} - Leaderboard
          </h2>
          <Button
            onClick={handleBackToTournament}
            style={{
              backgroundColor: themeColors.updateBtnBg,
              color: themeColors.updateBtnTxt,
              border: "none",
            }}
          >
            Back to Tournament
          </Button>
        </div>

        {tournament.divisions && tournament.divisions.length > 0 && (
          <div className="mb-3">
            <label htmlFor="divisionSelect" className="form-label">
              Division:
            </label>
            <select
              id="divisionSelect"
              ref={divisionSelectRef}
              className="form-select"
              value={selectedDivisionId}
              onChange={e => setSelectedDivisionId(e.target.value)}
            >
              {tournament.divisions.map(division => (
                <option key={division._id} value={division._id}>
                  {division.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Tournament leaderboard content will be added here */}
        <Alert variant="info">Leaderboard display is being implemented. Selected division: {selectedDivisionId}</Alert>
      </Container>
    </>
  );
};

export default PublicTournamentLeaderboard;
