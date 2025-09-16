import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Button, Spinner } from "react-bootstrap";
import { getPublicTournamentLeaderboard } from "../competitionServices";
import TournamentScoresPage from "../pages/TournamentScoresPage";
import Navbar from "features/shared/Navbar/Navbar";
import "flag-icon-css/css/flag-icons.min.css";

const PublicTournamentLeaderboard = () => {
  const { uniqueName } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fullCoursesData, setFullCoursesData] = useState({});

  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setLoading(true);
        const response = await getPublicTournamentLeaderboard(uniqueName);

        if (response.status === 200 && response.data.success) {
          const data = response.data.data;
          setTournament(data);

          // Process courses data into the format expected by TournamentScoresPage
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
        setLoading(false);
      }
    };

    if (uniqueName) {
      fetchTournament();
    }
  }, [uniqueName]);

  const handleBackToTournament = () => {
    navigate(`/competitions/u/${uniqueName}`);
  };

  if (loading) {
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
      <div style={{ paddingTop: "50px" }}>
        <TournamentScoresPage
          finalResults={true}
          tournament={tournament}
          fullCoursesData={fullCoursesData}
          onBackToTournament={handleBackToTournament}
        />
      </div>
    </>
  );
};

export default PublicTournamentLeaderboard;
