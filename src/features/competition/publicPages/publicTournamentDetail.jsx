import React, { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Container, Row, Col, Spinner, Modal, Table } from "react-bootstrap";
import { getPublicTournamentByUniqueName } from "../competitionServices";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUsers, faUserPlus, faTrophy, faGolfBall } from "@fortawesome/free-solid-svg-icons";
import { fetchCompetitionByID } from "../competitionActions";
import { useDispatch, useSelector } from "react-redux";
import "flag-icon-css/css/flag-icons.min.css";

const DEFAULT_PLAYER_IMAGE = "/images/DefaultProfilePic.jpg";
const DEFAULT_LOGO = "../../../../images/DefaultGolfCoursePic.jpg";

const PlayersListModal = ({ show, onHide, players, tournamentName }) => {
  const registeredPlayers = players.filter(player => player.status === "registered");

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          List of {registeredPlayers.length} Players Registered for {tournamentName}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ maxHeight: "500px", overflowY: "auto" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Player</th>
              <th>Division</th>
            </tr>
          </thead>
          <tbody>
            {registeredPlayers.map((player, index) => (
              <tr key={index}>
                <td>
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <img
                      src={player.profilePic || DEFAULT_PLAYER_IMAGE}
                      alt={player.playerName}
                      style={{
                        width: "50px",
                        height: "50px",
                        borderRadius: "50%",
                        marginRight: "10px",
                        objectFit: "cover",
                      }}
                      onError={e => {
                        e.target.src = DEFAULT_PLAYER_IMAGE;
                      }}
                    />
                    <div>
                      <div>
                        <strong>{player.playerName}</strong>
                        {player.homeCountry && (
                          <span
                            className={`flag-icon flag-icon-${player.homeCountry.toLowerCase()}`}
                            title={player.homeCountry}
                            style={{ marginLeft: "8px" }}
                          />
                        )}
                      </div>
                      <div>{[player.homeTown, player.homeState, player.homeCountry].filter(Boolean).join(", ")}</div>
                    </div>
                  </div>
                </td>
                <td>{player.divisionName || player.division || "Open"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal.Body>
      <Modal.Footer className="justify-content-center">
        <button className="mode-page-btn action-dialog action-button" onClick={onHide}>
          Dismiss
        </button>
      </Modal.Footer>
    </Modal>
  );
};

const PublicTournamentDetail = () => {
  const { uniqueName } = useParams();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const userState = useSelector(state => state.user);
  const user = userState.user;
  const userId = user._id;

  // Helper function to extract document type from URL
  const getDocumentType = url => {
    if (!url) return "";

    // Extract file extension from URL
    const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|$)/);
    if (match) {
      const extension = match[1].toLowerCase();
      // Map common extensions to readable names
      const typeMap = {
        pdf: "PDF",
        doc: "DOC",
        docx: "DOCX",
        txt: "TXT",
        rtf: "RTF",
        odt: "ODT",
        png: "PNG",
        jpg: "JPG",
        jpeg: "JPEG",
        gif: "GIF",
        zip: "ZIP",
        xlsx: "XLSX",
        xls: "XLS",
      };
      return typeMap[extension] || extension.toUpperCase();
    }

    // Fallback: assume PDF for common document URLs
    if (url.includes("document") || url.includes("rules") || url.includes("info")) {
      return "PDF";
    }

    return "DOC";
  };
  const jwtToken = userState.tokens.jwtToken;
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    const fetchTournament = async () => {
      try {
        setLoading(true);
        const response = await getPublicTournamentByUniqueName(uniqueName);

        if (response.status === 200 && response.data.success) {
          const tournamentData = response.data.data;
          setTournament(tournamentData);
        } else {
          throw new Error(response.data.message || "Failed to fetch tournament details");
        }
      } catch (err) {
        console.error("Error fetching tournament details:", err);
        setError("Failed to load tournament details. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    if (uniqueName) {
      fetchTournament();
    }
  }, [uniqueName]);
  // Check for JWT Token in cookies or localStorage when component mounts
  // useEffect(() => {
  //   const checkAuthentication = () => {
  //     // Check cookie first
  //     const userCookie = Cookies.get('user-cookie');

  //     // Check localStorage as fallback
  //     const storedJwtToken = localStorage.getItem('jwtToken');

  //     if (userCookie || storedJwtToken) {
  //       setIsLoggedIn(true);
  //     } else {
  //       setIsLoggedIn(false);
  //     }
  //   };

  //   checkAuthentication();
  // }, []);

  const formatDate = dateString => {
    if (!dateString) return "";
    try {
      // Extract just the date part (YYYY-MM-DD) to avoid timezone conversion issues
      const dateOnly = dateString.split("T")[0];
      // Create a local date by parsing the date parts
      const [year, month, day] = dateOnly.split("-").map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed in JavaScript

      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(date);
    } catch (err) {
      console.error("Error formatting date:", err);
      return dateString;
    }
  };

  const countRegisteredPlayers = players => {
    if (!players || !Array.isArray(players)) return 0;
    return players.filter(player => player.status === "registered").length;
  };

  const handleNewUserRegistration = () => {
    // Store tournament information for the registration process
    if (tournament && tournament._id) {
      sessionStorage.setItem(
        "pendingTournamentRegistration",
        JSON.stringify({
          tournamentId: tournament._id,
          uniqueName: uniqueName,
        }),
      );

      // Navigate to create account page
      navigate("/signup");
    }
  };

  const handleExistingUserRegistration = async () => {
    // If already logged in, go directly to tournament detail page

    if (!jwtToken) {
      console.log("JWT Token is not defined");
      // Navigate to login page
      // Navigate to login page with redirect parameter
      navigate(`/login?redirect=/competitions/detail/${tournament._id}`);
      return;
    }
    if (jwtToken && userId && tournament && tournament._id) {
      console.log("User is logged in, fetching tournament by ID");
      // Store tournament information for the registration process
      sessionStorage.setItem(
        "pendingTournamentRegistration",
        JSON.stringify({
          tournamentId: tournament._id,
          uniqueName: uniqueName,
        }),
      );
      await dispatch(fetchCompetitionByID(tournament._id));
      navigate(`/competitions/detail/${tournament._id}`);
      // navigate(`/competitions/u/${uniqueName}/register`);
      return;
    }

    // Not logged in, store tournament information for the registration process
    if (tournament && tournament._id) {
      sessionStorage.setItem(
        "pendingTournamentRegistration",
        JSON.stringify({
          tournamentId: tournament._id,
          uniqueName: uniqueName,
        }),
      );

      // Navigate to login page with redirect parameter
      navigate(`/login?redirect=/competitions/detail/${tournament._id}`);
    }
  };
  if (loading) {
    return (
      <Container className="text-center" style={{ marginTop: "120px" }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>Loading tournament details...</p>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <div className="alert alert-danger">{error}</div>
        <Link to="/competitions/public" className="btn btn-primary">
          Back to Tournaments
        </Link>
      </Container>
    );
  }

  if (!tournament) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning">Tournament not found or not published.</div>
        <Link to="/competitions/public" className="btn btn-primary">
          Back to Tournaments
        </Link>
      </Container>
    );
  }

  const { basicInfo, divisions = [], players = [], courses = [], regPaymentInfo = {} } = tournament;
  const registeredPlayerCount = countRegisteredPlayers(players);

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
              <li
                className="breadcrumb-item active"
                aria-current="page"
                style={{ color: "#495057", fontWeight: "500" }}
              >
                {basicInfo?.startDate && basicInfo?.name
                  ? `${new Date(basicInfo.startDate).getFullYear()} ${basicInfo.name}`
                  : uniqueName}
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
                src={tournament?.basicInfo?.logo || tournament?.logo || DEFAULT_LOGO}
                alt={`${basicInfo?.name} logo`}
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
                <h2 className="mb-0">{basicInfo?.name}</h2>
                {courses && courses.length > 0 && (
                  <div>
                    {courses.map((course, index) => {
                      // Extract course name (substring up to first comma)
                      const courseName = course.name
                        ? course.name.indexOf(",") !== -1
                          ? course.name.substring(0, course.name.indexOf(",")).trim()
                          : course.name.trim()
                        : "Unknown Course";

                      const courseLocation = course.location || "Location not specified";

                      return (
                        <div key={index}>
                          <p className="m-0" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                            {courseName}
                          </p>
                          <p className="m-0" style={{ color: "#FFFFFF", opacity: "0.9" }}>
                            {courseLocation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
                <p className="m-0" style={{ color: "#FFFFFF" }}>
                  {basicInfo?.startDate && basicInfo?.endDate
                    ? `${formatDate(basicInfo.startDate)} - ${formatDate(basicInfo.endDate)}`
                    : "Dates not specified"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div style={{ paddingLeft: "20px", paddingRight: "20px" }} className="mt-4 mb-5">
          <Row>
            <Col md={12}>
              <div className="card">
                <div className="card-body">
                  <Row className="mb-3">
                    <Col sm={4} className="fw-bold">
                      Tournament Host:
                    </Col>
                    <Col sm={8}>
                      {basicInfo?.tournamentCreatorName || "Not specified"}
                      {basicInfo?.tournamentCreatorEmail && <span> ({basicInfo.tournamentCreatorEmail})</span>}
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col sm={4} className="fw-bold">
                      Registration Window:
                    </Col>
                    <Col sm={8}>
                      {regPaymentInfo?.regStartDate && regPaymentInfo?.regEndDate
                        ? `${formatDate(regPaymentInfo.regStartDate)} - ${formatDate(regPaymentInfo.regEndDate)}`
                        : "No registration period available"}
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col sm={4} className="fw-bold">
                      Divisions & Entry Fees:
                    </Col>
                    <Col sm={8}>
                      {divisions?.length > 0 ? (
                        <Table bordered>
                          <thead>
                            <tr>
                              {divisions.map((division, index) => (
                                <th key={index}>{division.name}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              {divisions.map((division, index) => (
                                <td key={index}>
                                  Gender: {division.gender || "Any"}
                                  <br />
                                  Age: {division.minAge || "?"} - {division.maxAge || "?"}
                                  <br />
                                  Fee: ${division.entryFee}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </Table>
                      ) : (
                        "No divisions available"
                      )}
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col sm={4} className="fw-bold">
                      Rules:
                    </Col>
                    <Col sm={8}>
                      {basicInfo?.rules ? (
                        <a href={basicInfo.rules} target="_blank" rel="noopener noreferrer">
                          Rules Info ({getDocumentType(basicInfo.rules)})
                        </a>
                      ) : (
                        "No rules available for this tournament."
                      )}
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col sm={4} className="fw-bold">
                      Prizes:
                    </Col>
                    <Col sm={8}>
                      {basicInfo?.prizeDoc ? (
                        <a href={basicInfo.prizeDoc} target="_blank" rel="noopener noreferrer">
                          Prize Info ({getDocumentType(basicInfo.prizeDoc)})
                        </a>
                      ) : (
                        basicInfo?.prizeText || "No prize information available."
                      )}
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col sm={4} className="fw-bold">
                      Additional Info:
                    </Col>
                    <Col sm={8}>
                      {basicInfo?.additionalInfoDoc ? (
                        <a href={basicInfo.additionalInfoDoc} target="_blank" rel="noopener noreferrer">
                          Tournament Info (PDF)
                        </a>
                      ) : (
                        basicInfo?.additionalInfoText || "No additional information available."
                      )}
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>
          </Row>

          {/* Action Buttons Section */}
          <Row className="mt-4">
            <Col className="d-flex justify-content-start flex-wrap">
              {/* Button for new users */}
              <button
                className="mode-page-btn action-dialog action-button"
                style={{ width: "200px", fontSize: "14px", padding: "8px", margin: "2px" }}
                onClick={handleNewUserRegistration}
              >
                <div>
                  <FontAwesomeIcon icon={faUserPlus} className="me-1" /> Register
                </div>
                <div style={{ fontSize: "12px" }}>(I don't yet have a SpeedScore Account)</div>
              </button>

              {/* Button for existing users */}
              <button
                className="mode-page-btn action-dialog action-button"
                style={{ width: "200px", fontSize: "14px", padding: "8px", margin: "2px" }}
                onClick={handleExistingUserRegistration}
              >
                <div>
                  <FontAwesomeIcon icon={faUserPlus} className="me-1" /> Register
                </div>
                <div style={{ fontSize: "12px" }}>(I already have a SpeedScore Account)</div>
              </button>

              {/* View Registrants button */}
              {players?.length > 0 && (
                <button
                  onClick={() => setShowPlayersModal(true)}
                  className="mode-page-btn action-dialog action-button"
                  style={{
                    width: "170px",
                    fontSize: "14px",
                    padding: "8px",
                    margin: "2px",
                    backgroundColor: "#0d2240",
                    border: "1px solid #0d2240",
                  }}
                >
                  <FontAwesomeIcon icon={faUsers} className="me-1" /> View Registrants ({registeredPlayerCount})
                </button>
              )}

              {/* View Tee Sheet button */}
              <button
                className="mode-page-btn action-dialog action-button"
                style={{
                  width: "170px",
                  fontSize: "14px",
                  padding: "8px",
                  margin: "2px",
                  backgroundColor: "#0d2240",
                  border: "1px solid #0d2240",
                }}
                onClick={() => navigate(`/competitions/u/${uniqueName}/teesheet`)}
              >
                <FontAwesomeIcon icon={faGolfBall} className="me-1" /> View Tee Sheet
              </button>

              {/* View Leaderboard button */}
              <button
                className="mode-page-btn action-dialog action-button"
                style={{
                  width: "170px",
                  fontSize: "14px",
                  padding: "8px",
                  margin: "2px",
                  backgroundColor: "#0d2240",
                  border: "1px solid #0d2240",
                }}
                onClick={() => navigate(`/competitions/u/${uniqueName}/leaderboard`)}
              >
                <FontAwesomeIcon icon={faTrophy} className="me-1" /> View Leaderboard
              </button>
            </Col>
          </Row>

          <PlayersListModal
            show={showPlayersModal}
            onHide={() => setShowPlayersModal(false)}
            players={players || []}
            tournamentName={basicInfo.name}
          />
        </div>
      </Container>
    </>
  );
};

export default PublicTournamentDetail;
