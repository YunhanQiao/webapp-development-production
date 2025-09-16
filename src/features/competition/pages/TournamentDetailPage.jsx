import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Container, Row, Col, Button, Spinner, Modal, Table } from "react-bootstrap";
import { fetchCompetitionByID, togglePublishStatus } from "../competitionActions";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { formatCurrency } from "../utils/currencyUtils";
import "flag-icon-css/css/flag-icons.min.css";
import { createLocalDate } from "../utils/dateUtils";

import {
  faEdit,
  faCheckCircle,
  faBan,
  faGolfBall,
  faClipboardList,
  faUserPlus,
  faTrophy,
  faMoneyBillWave,
  faArrowLeft,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { notifyMessage } from "services/toasterServices";
import TournamentPublish from "./TournamentPublish";
import TournamentRegistration from "./TournamentRegistration";
import RegistrationInfoModal from "./RegistrationInfoModal";
import TournamentPayout from "./PayoutModal";
import "../../../styles/features/competition/newTournament.css";
const DEFAULT_LOGO = "../../../../images/DefaultGolfCoursePic.jpg";
const DEFAULT_PLAYER_IMAGE = "../../../images/DefaultProfilePic.jpg";

const actionButtonStyle = {
  width: "170px",
  height: "38px",
  fontSize: "14px",
  padding: "0",
  backgroundColor: "#0d2240",
  border: "1px solid #0d2240",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "5px",
};

const PlayersListModal = ({ show, onHide, players, tournamentName }) => {
  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          List of {players.length} Players Registered for {tournamentName}
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
            {players.map((player, index) => (
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
                <td>{player.divisionName || player.division || "No Division"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal.Body>
      <Modal.Footer className="justify-content-center">
        <button className="mode-page-btn action-dialog action-button" onClick={onHide} style={actionButtonStyle}>
          Dismiss
        </button>
      </Modal.Footer>
    </Modal>
  );
};

const TournamentDetailPage = () => {
  const { tournamentId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

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
  const user = useSelector(state => state.user.user);
  const activeTournament = useSelector(state => state.competitions.activeTournament);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showPlayersModal, setShowPlayersModal] = useState(false);
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showRegisterDialog, setShowRegisterDialog] = useState(false);
  const [showRegistrationInfo, setShowRegistrationInfo] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);
  const [userRegistration, setUserRegistration] = useState(null);

  useEffect(() => {
    const loadTournament = async () => {
      try {
        setLoading(true);
        setError(null);
        await dispatch(fetchCompetitionByID(tournamentId));
      } catch (error) {
        console.error("Failed to load tournament:", error);
        setError("Failed to load tournament details. Please try again later.");
        notifyMessage("error", "Failed to load tournament details", 3000, "colored", "top-center");
      } finally {
        setLoading(false);
      }
    };

    if (tournamentId) {
      loadTournament();
    }
  }, [dispatch, tournamentId]);

  const handlePublishConfirm = async stripeAccountId => {
    if (!activeTournament) return;

    setIsPublishing(true);
    try {
      await dispatch(togglePublishStatus(activeTournament._id, !activeTournament.published, stripeAccountId));
      await dispatch(fetchCompetitionByID(tournamentId));
      setShowPublishDialog(false);
    } finally {
      setIsPublishing(false);
    }
  };

  const isAdminOrDirector = () => {
    if (!activeTournament || !user) return false;

    const isAdmin =
      (activeTournament.admins && activeTournament.admins.includes(user._id)) ||
      (activeTournament.basicInfo?.admins && activeTournament.basicInfo.admins.includes(user._id));

    const isDirector = activeTournament.director === user._id || activeTournament.basicInfo?.directorId === user._id;

    return isAdmin || isDirector;
  };

  const isRegistrationOpen = () => {
    if (!activeTournament || !activeTournament.regPaymentInfo) return false;
    const currentDate = new Date();
    // Use fixed date parsing to avoid timezone issues
    const startDate = createLocalDate(activeTournament.regPaymentInfo.regStartDate);
    const endDate = createLocalDate(activeTournament.regPaymentInfo.regEndDate);
    endDate.setHours(23, 59, 59, 999);
    return currentDate >= startDate && currentDate <= endDate;
  };

  const isTournamentEnded = () => {
    if (!activeTournament || !activeTournament.basicInfo) return false;
    const currentDate = new Date();
    // Use fixed date parsing to avoid timezone issues
    const endDate = createLocalDate(activeTournament.basicInfo.endDate);
    endDate.setHours(23, 59, 59, 999);

    // Show "View Final Results" starting the day after the tournament ends
    return currentDate > endDate;
  };

  const isUserRegistered = () => {
    if (!activeTournament || !user || !activeTournament.players) return false;
    return activeTournament.players.some(player => player.userId === user._id);
  };

  const handleViewRegistration = () => {
    if (!activeTournament?.players) return;
    const playerRegistration = activeTournament.players.find(player => player.userId === user._id);
    if (playerRegistration) {
      setUserRegistration(playerRegistration);
      setShowRegistrationInfo(true);
    } else {
      notifyMessage("error", "Registration details not found", 3000, "colored", "top-center");
    }
  };

  const checkRegistrationCap = () => {
    if (!activeTournament?.regPaymentInfo || !activeTournament?.players) return;

    if (activeTournament.players.length + 1 <= activeTournament.regPaymentInfo.capRegAt) {
      setShowRegisterDialog(true);
    } else {
      notifyMessage("error", "Registration is full", 5000, "colored", "top-center");
    }
  };

  const handleRegistrationComplete = async () => {
    setShowRegisterDialog(false);
    await dispatch(fetchCompetitionByID(tournamentId));
  };

  const handleWithdrawalComplete = async () => {
    await dispatch(fetchCompetitionByID(tournamentId));
    handleCloseRegistrationInfo();
  };

  const handleCloseRegistrationInfo = () => {
    setShowRegistrationInfo(false);
    setUserRegistration(null);
  };

  const handlePayoutClick = () => {
    setShowPayoutDialog(true);
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
        <button
          // onClick={() => navigate("/competitions")}
          onClick={() => navigate(-1)}
          style={{
            display: "inline-block",
            backgroundColor: "#343a40",
            border: "1px solid #343a40",
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
          Back to Tournaments
        </button>
      </Container>
    );
  }

  if (!activeTournament) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning">Tournament not found</div>
        <button
          onClick={() => navigate("/competitions")}
          // onClick={() => navigate(-1)}
          style={{
            display: "inline-block",
            backgroundColor: "#343a40",
            border: "1px solid #343a40",
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
          Back to Tournaments
        </button>
      </Container>
    );
  }

  if (!activeTournament.basicInfo || !activeTournament.regPaymentInfo) {
    return (
      <Container className="mt-5">
        <div className="alert alert-warning">Tournament data is incomplete</div>
        <button
          onClick={() => navigate("/competitions")}
          // onClick={() => navigate(-1)}
          style={{
            display: "inline-block",
            backgroundColor: "#343a40",
            border: "1px solid #343a40",
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
          Back to Tournaments
        </button>
      </Container>
    );
  }

  const { basicInfo, regPaymentInfo } = activeTournament;

  const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Use helper function to create local dates
  const tournamentStartDate = createLocalDate(basicInfo.startDate);
  const tournamentEndDate = createLocalDate(basicInfo.endDate);
  const regStartDate = createLocalDate(regPaymentInfo.regStartDate);
  const regEndDate = createLocalDate(regPaymentInfo.regEndDate);

  // Extract course names (up to first comma) and location information
  const getCourseDisplayInfo = () => {
    if (activeTournament.courses && activeTournament.courses.length > 0) {
      const courses = activeTournament.courses;

      // Get course names (substring up to first comma)
      const courseNames = courses.map(course => {
        if (course.name) {
          const commaIndex = course.name.indexOf(",");
          return commaIndex !== -1 ? course.name.substring(0, commaIndex).trim() : course.name.trim();
        }
        return "Unknown Course";
      });

      // Get location (use first course's location or fallback)
      const location = courses[0].location || basicInfo.location || "Location not specified";

      // Format course names display for single course
      let coursesDisplay = "";
      if (courseNames.length === 1) {
        coursesDisplay = courseNames[0];
      } else if (courseNames.length === 2) {
        coursesDisplay = `${courseNames[0]} & ${courseNames[1]}`;
      } else if (courseNames.length > 2) {
        const lastCourse = courseNames[courseNames.length - 1];
        const otherCourses = courseNames.slice(0, -1).join(", ");
        coursesDisplay = `${otherCourses} & ${lastCourse}`;
      }

      return {
        coursesDisplay,
        location,
        courses,
        isMultipleCourses: courses.length > 1,
      };
    }

    // Fallback when no courses data available
    return {
      coursesDisplay: null,
      location: basicInfo.location || "Location not specified",
      courses: [],
      isMultipleCourses: false,
    };
  };

  const { coursesDisplay, location: courseLocation, courses, isMultipleCourses } = getCourseDisplayInfo();

  const activePlayersCount = activeTournament.players
    ? activeTournament.players.filter(player => player.status === "registered").length
    : 0;

  const registrationCount = activePlayersCount === 0 ? "0" : activePlayersCount === 1 ? "1" : `${activePlayersCount}`;
  const currencyCode = activeTournament?.regPaymentInfo?.currencyType || "USD";
  return (
    <>
      <Container style={{ paddingTop: "100px" }}>
        <Container className="mt-4 mb-5">
          <Row className="mb-4">
            <Col className="text-center">
              <h1 className="display-4">{basicInfo.name || "No Tournament Name"}</h1>

              {/* Single course display */}
              {!isMultipleCourses && (
                <>
                  {coursesDisplay && (
                    <p className="lead mb-1" style={{ fontWeight: "600", color: "#2c5530" }}>
                      {coursesDisplay}
                    </p>
                  )}
                  <p className="lead mb-2" style={{ color: "#666" }}>
                    {courseLocation}
                  </p>
                </>
              )}

              {/* Multiple courses table display */}
              {isMultipleCourses && (
                <div className="mb-2">
                  <table
                    style={{
                      margin: "0 auto",
                      borderCollapse: "collapse",
                      width: "auto",
                    }}
                  >
                    <tbody>
                      <tr>
                        {courses.map((course, index) => {
                          const courseName = course.name
                            ? course.name.indexOf(",") !== -1
                              ? course.name.substring(0, course.name.indexOf(",")).trim()
                              : course.name.trim()
                            : "Unknown Course";

                          const courseLocation = course.location || "Location not specified";

                          return (
                            <td
                              key={index}
                              style={{
                                border: "none",
                                padding: "0 20px",
                                textAlign: "center",
                                verticalAlign: "top",
                              }}
                            >
                              <p
                                className="lead mb-1"
                                style={{
                                  fontWeight: "600",
                                  color: "#2c5530",
                                  margin: "0",
                                }}
                              >
                                {courseName}
                              </p>
                              <p
                                className="lead mb-0"
                                style={{
                                  color: "#666",
                                  margin: "0",
                                  fontSize: "1rem",
                                }}
                              >
                                {courseLocation}
                              </p>
                            </td>
                          );
                        })}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              <p className="mb-4">
                {dateTimeFormat.format(tournamentStartDate)} - {dateTimeFormat.format(tournamentEndDate)}
              </p>
            </Col>
          </Row>

          {(isAdminOrDirector() || activeTournament.published) && (
            <Row className="mb-4">
              <Col className="d-flex justify-content-center flex-wrap">
                {activeTournament.published && (
                  <button
                    className="mode-page-btn action-dialog action-button"
                    style={{ ...actionButtonStyle, backgroundColor: "#0d2240", border: "1px solid #0d2240" }}
                    onClick={() => navigate(`/competitions/${activeTournament._id}/leaderboard`)}
                  >
                    <FontAwesomeIcon icon={faTrophy} className="me-1" />
                    {isTournamentEnded() ? "View Final Results" : "View Leaderboard"}
                  </button>
                )}

                {isAdminOrDirector() && (
                  <>
                    {!activeTournament.published && (
                      <button
                        className="mode-page-btn action-dialog action-button"
                        style={{ ...actionButtonStyle, backgroundColor: "#0d2240", border: "1px solid #0d2240" }}
                        onClick={() => navigate(`/competitions/newTournament/${activeTournament._id}/basicInfo`)}
                      >
                        <FontAwesomeIcon icon={faEdit} className="me-1" /> Edit Tournament
                      </button>
                    )}

                    <button
                      className="mode-page-btn action-dialog action-button"
                      style={{
                        ...actionButtonStyle,
                        backgroundColor: activeTournament.published ? "#dc3545" : "#0d2240",
                        border: activeTournament.published ? "1px solid #dc3545" : "1px solid #0d2240",
                      }}
                      onClick={() => setShowPublishDialog(true)}
                    >
                      {activeTournament.published ? (
                        <>
                          <FontAwesomeIcon icon={faBan} className="me-1" /> Unpublish Tournament
                        </>
                      ) : (
                        <>
                          <FontAwesomeIcon icon={faCheckCircle} className="me-1" /> Publish Tournament
                        </>
                      )}
                    </button>

                    {activeTournament.published && (
                      <>
                        <button
                          className="mode-page-btn action-dialog action-button"
                          style={{ ...actionButtonStyle, backgroundColor: "#0d2240", border: "1px solid #0d2240" }}
                          onClick={() => navigate(`/competitions/${activeTournament._id}/teesheet`)}
                        >
                          <FontAwesomeIcon icon={faGolfBall} className="me-1" />
                          {isAdminOrDirector() ? "View/Edit Player Roster" : "View Player Roster"}
                        </button>

                        {activeTournament.teeSheet &&
                          activeTournament.teeSheet.playerAssignments &&
                          activeTournament.teeSheet.playerAssignments.length > 0 && (
                            <button
                              className="mode-page-btn action-dialog action-button"
                              style={{ ...actionButtonStyle, backgroundColor: "#0d2240", border: "1px solid #0d2240" }}
                              onClick={() => navigate(`/competitions/${activeTournament._id}/scores`)}
                            >
                              <FontAwesomeIcon icon={faClipboardList} className="me-1" /> Enter Scores
                            </button>
                          )}
                      </>
                    )}

                    {activeTournament.paymentTracking &&
                      activeTournament.paymentTracking.payoutStatus === "pending" &&
                      activeTournament.paymentTracking.totalAmountCollected > 0 &&
                      new Date() >= new Date(activeTournament.basicInfo.startDate) && (
                        <button
                          className="mode-page-btn action-dialog action-button"
                          style={{ ...actionButtonStyle, backgroundColor: "#0d2240", border: "1px solid #0d2240" }}
                          onClick={handlePayoutClick}
                        >
                          <FontAwesomeIcon icon={faMoneyBillWave} className="me-1" /> Process Payout
                        </button>
                      )}
                  </>
                )}

                {activeTournament.published && isRegistrationOpen() && isUserRegistered() && (
                  <button
                    className="mode-page-btn action-dialog action-button"
                    style={{ ...actionButtonStyle, backgroundColor: "#0d2240", border: "1px solid #0d2240" }}
                    onClick={handleViewRegistration}
                  >
                    <FontAwesomeIcon icon={faClipboardList} className="me-1" /> My Entry
                  </button>
                )}
              </Col>
            </Row>
          )}

          <Row>
            <Col md={4} className="text-center">
              <div className="mb-4">
                <img
                  src={basicInfo.logo || DEFAULT_LOGO}
                  alt={`${basicInfo.name} logo`}
                  className="img-fluid mb-3"
                  style={{ maxHeight: "200px" }}
                />

                {activeTournament.players && activeTournament.players.length > 0 && (
                  <div className="d-flex justify-content-center">
                    <button
                      onClick={() => setShowPlayersModal(true)}
                      className="mode-page-btn action-dialog action-button"
                      style={{ ...actionButtonStyle, backgroundColor: "#0d2240", border: "1px solid #0d2240" }}
                    >
                      <FontAwesomeIcon icon={faUsers} className="me-1" /> View Registrants ({registrationCount})
                    </button>
                  </div>
                )}
                {activeTournament.published && isRegistrationOpen() && !isUserRegistered() && (
                  <div className="d-flex justify-content-center">
                    <button
                      onClick={checkRegistrationCap}
                      className="mode-page-btn action-dialog action-button mt-2"
                      style={{ ...actionButtonStyle, backgroundColor: "#0d2240", border: "1px solid #0d2240" }}
                    >
                      <FontAwesomeIcon icon={faUserPlus} className="me-1" /> Register
                    </button>
                  </div>
                )}
              </div>
            </Col>

            <Col md={8}>
              <div className="card">
                <div className="card-body">
                  <Row className="mb-3">
                    <Col sm={4} className="fw-bold">
                      Tournament Host:
                    </Col>
                    <Col sm={8}>
                      {basicInfo.tournamentCreatorName || basicInfo.directorName || "Not specified"}
                      {basicInfo.tournamentCreatorEmail && <span> ({basicInfo.tournamentCreatorEmail})</span>}
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col sm={4} className="fw-bold">
                      Registration Window:
                    </Col>
                    <Col sm={8}>
                      {dateTimeFormat.format(regStartDate)} - {dateTimeFormat.format(regEndDate)}
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col sm={4} className="fw-bold">
                      Divisions & Entry Fees:
                    </Col>
                    <Col sm={8}>
                      {activeTournament.divisions && activeTournament.divisions.length > 0 ? (
                        <Table bordered>
                          <thead>
                            <tr>
                              {activeTournament.divisions.map((division, index) => (
                                <th key={index}>{division.name || "No Name"}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr>
                              {activeTournament.divisions.map((division, index) => (
                                <td key={index}>
                                  Gender: {division.gender || "Any"}
                                  <br />
                                  Age: {division.minAge || "?"} - {division.maxAge || "?"}
                                  <br />
                                  Fee: {formatCurrency(division.fee || division.entryFee || 0, currencyCode)}
                                </td>
                              ))}
                            </tr>
                          </tbody>
                        </Table>
                      ) : (
                        <div>No Divisions</div>
                      )}
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col sm={4} className="fw-bold">
                      Rules:
                    </Col>
                    <Col sm={8}>
                      {basicInfo.rulesDoc ? (
                        <a href={basicInfo.rulesDoc} target="_blank" rel="noopener noreferrer">
                          Rules Info ({getDocumentType(basicInfo.rulesDoc)})
                        </a>
                      ) : basicInfo.rules &&
                        (basicInfo.rules.startsWith("http") ||
                          basicInfo.rules.includes(".pdf") ||
                          basicInfo.rules.includes(".doc")) ? (
                        <a href={basicInfo.rules} target="_blank" rel="noopener noreferrer">
                          Rules Info ({getDocumentType(basicInfo.rules)})
                        </a>
                      ) : (
                        basicInfo.rules || "No rules available for this tournament."
                      )}
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col sm={4} className="fw-bold">
                      Prizes:
                    </Col>
                    <Col sm={8}>
                      {basicInfo.prizeDoc ? (
                        <a href={basicInfo.prizeDoc} target="_blank" rel="noopener noreferrer">
                          Prize Info ({getDocumentType(basicInfo.prizeDoc)})
                        </a>
                      ) : (
                        basicInfo.prizes || basicInfo.prizeText || "No prize information available."
                      )}
                    </Col>
                  </Row>

                  <Row className="mb-3">
                    <Col sm={4} className="fw-bold">
                      Additional Info:
                    </Col>
                    <Col sm={8}>
                      {basicInfo.additionalInfoDoc ? (
                        <a href={basicInfo.additionalInfoDoc} target="_blank" rel="noopener noreferrer">
                          Tournament Info (PDF)
                        </a>
                      ) : (
                        basicInfo.additionalInfo ||
                        basicInfo.additionalInfoText ||
                        "No additional information available."
                      )}
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col sm={4} className="fw-bold">
                      Public Registration Url:
                    </Col>
                    <Col sm={8}>
                      <a
                        href={`/competitions/u/${activeTournament.basicInfo.uniqueName}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {`${window.location.origin}/competitions/u/${activeTournament.basicInfo.uniqueName}`}
                      </a>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col sm={4} className="fw-bold">
                      Public Teesheet Url:
                    </Col>
                    <Col sm={8}>
                      <a
                        href={`/competitions/u/${activeTournament.basicInfo.uniqueName}/teesheet`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {`${window.location.origin}/competitions/u/${activeTournament.basicInfo.uniqueName}/teesheet`}
                      </a>
                    </Col>
                  </Row>
                  <Row className="mb-3">
                    <Col sm={4} className="fw-bold">
                      Public Leaderboard Url:
                    </Col>
                    <Col sm={8}>
                      <a
                        href={`/competitions/u/${activeTournament.basicInfo.uniqueName}/leaderboard`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {`${window.location.origin}/competitions/u/${activeTournament.basicInfo.uniqueName}/leaderboard`}
                      </a>
                    </Col>
                  </Row>
                </div>
              </div>
            </Col>
          </Row>

          <div className="mt-4 text-center">
            <button
              // onClick={() => navigate("/competitions")}
              onClick={() => navigate(-1)}
              style={{
                display: "inline-block",
                backgroundColor: "#0d2240",
                border: "1px solid #0d2240",
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
              Back to Tournaments
            </button>
          </div>

          <PlayersListModal
            show={showPlayersModal}
            onHide={() => setShowPlayersModal(false)}
            players={
              activeTournament.players ? activeTournament.players.filter(player => player.status === "registered") : []
            }
            tournamentName={basicInfo.name}
          />

          <TournamentPublish
            show={showPublishDialog}
            onClose={() => {
              setShowPublishDialog(false);
            }}
            onConfirm={handlePublishConfirm}
            tournament={activeTournament}
            isPublishing={isPublishing}
          />

          <TournamentRegistration
            show={showRegisterDialog}
            onClose={() => {
              setShowRegisterDialog(false);
            }}
            onRegistrationSuccess={handleRegistrationComplete}
            tournament={activeTournament}
            user={user}
            divisions={activeTournament?.divisions || []}
          />

          <RegistrationInfoModal
            show={showRegistrationInfo}
            onHide={handleCloseRegistrationInfo}
            tournament={activeTournament}
            userRegistration={userRegistration}
            onWithdrawComplete={handleWithdrawalComplete}
          />

          <TournamentPayout
            show={showPayoutDialog}
            onClose={() => {
              setShowPayoutDialog(false);
            }}
            tournament={activeTournament}
            isProcessing={isProcessingPayout}
          />
        </Container>
      </Container>
    </>
  );
};

export default TournamentDetailPage;
