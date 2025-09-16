import { useEffect, useState, useRef } from "react";
import { Container, Table, Row, Col, Collapse } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import { getPublicTournaments } from "../competitionServices";
import { createLocalDate } from "../utils/dateUtils";

const DEFAULT_LOGO = "../../../images/DefaultGolfCoursePic.jpg";

const PublicTournamentsPage = () => {
  const navigate = useNavigate();
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchBoxTournament, setSearchBoxTournament] = useState("");
  const [collapseState, setCollapseState] = useState({
    inProgress: true, // Start with In Progress expanded
    upcoming: true, // Start with Upcoming expanded
    past: false, // Start with Past collapsed
  });
  const [focusedRowIndex, setFocusedRowIndex] = useState(-1);
  const [currentSection, setCurrentSection] = useState("inProgress");

  // Refs for table focus management
  const inProgressTableRef = useRef(null);
  const upcomingTableRef = useRef(null);
  const pastTableRef = useRef(null);

  useEffect(() => {
    const fetchPublicTournaments = async () => {
      try {
        setLoading(true);
        const response = await getPublicTournaments();

        if (response.data.success) {
          setTournaments(response.data.data || []);
        } else {
          throw new Error(response.data.message || "Failed to fetch tournaments");
        }
      } catch (err) {
        console.error("Error fetching public tournaments:", err);
        const errorMessage =
          err.response?.data?.message || err.message || "Failed to load tournaments. Please try again later.";
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchPublicTournaments();
  }, []);

  // Helper function to create local date from UTC timestamp to avoid timezone issues
  const createLocalDate = dateString => {
    if (!dateString) return new Date();

    // Extract just the date part (YYYY-MM-DD) to avoid timezone conversion issues
    const dateOnly = dateString.split("T")[0];

    // Create a local date by parsing the date parts
    const [year, month, day] = dateOnly.split("-").map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed in JavaScript
  };

  // Categorize tournaments by status
  const categorizeTournaments = () => {
    if (!tournaments || !tournaments.length) return { upcoming: [], inProgress: [], completed: [] };

    const currentDate = new Date();
    const upcoming = [];
    const inProgress = [];
    const completed = [];

    tournaments.forEach(tournament => {
      // Use fixed date parsing to avoid timezone issues
      const startDate = createLocalDate(tournament.basicInfo.startDate);
      const endDate = createLocalDate(tournament.basicInfo.endDate);
      endDate.setHours(23, 59, 59, 999);

      // Create a date 5 days after the tournament ends for extended "In Progress" period
      const extendedEndDate = new Date(endDate);
      extendedEndDate.setDate(extendedEndDate.getDate() + 5);
      extendedEndDate.setHours(23, 59, 59, 999);

      if (currentDate < startDate) {
        upcoming.push(tournament);
      } else if (currentDate >= startDate && currentDate <= extendedEndDate) {
        inProgress.push(tournament);
      } else {
        completed.push(tournament);
      }
    });

    return { upcoming, inProgress, completed };
  };

  const { upcoming, inProgress, completed } = categorizeTournaments();

  // Auto-expand sections with search matches
  useEffect(() => {
    if (searchBoxTournament) {
      setCollapseState(prevState => {
        const newState = { ...prevState };

        // Auto-expand sections that have search matches
        if (hasSearchMatches(inProgress, searchBoxTournament)) {
          newState.inProgress = true;
        }
        if (hasSearchMatches(upcoming, searchBoxTournament)) {
          newState.upcoming = true;
        }
        if (hasSearchMatches(completed, searchBoxTournament)) {
          newState.past = true;
        }

        return newState;
      });
    }
  }, [searchBoxTournament, inProgress, upcoming, completed]);

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

  // Check if a section has any search matches
  const hasSearchMatches = (tournamentList, searchTerm) => {
    if (!searchTerm || !tournamentList?.length) return false;
    return tournamentList.some(tournament =>
      tournament?.basicInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  };

  const toggleCollapse = section => {
    setCollapseState(prev => {
      const newState = {
        ...prev,
        [section]: !prev[section],
      };

      // If section is being expanded, focus on its table after a brief delay (if it has content)
      if (!prev[section]) {
        setTimeout(() => {
          const visibleTournaments = getVisibleTournamentsInSection(section);
          if (visibleTournaments.length > 0) {
            let tableRef;
            switch (section) {
              case "inProgress":
                tableRef = inProgressTableRef;
                break;
              case "upcoming":
                tableRef = upcomingTableRef;
                break;
              case "past":
                tableRef = pastTableRef;
                break;
              default:
                return;
            }

            if (tableRef.current) {
              tableRef.current.focus();
              setCurrentSection(section);
              setFocusedRowIndex(0);
            }
          }
        }, 100);
      }

      return newState;
    });
  };

  const handleTournamentClick = uniqueName => {
    if (uniqueName) {
      navigate(`/competitions/u/${uniqueName}`);
    } else {
      console.warn("Cannot navigate: uniqueName is missing");
    }
  };

  // Get all visible tournaments in current section
  const getVisibleTournamentsInSection = section => {
    const { inProgress, upcoming, completed } = categorizeTournaments();
    const searchTerm = searchBoxTournament || "";

    let sectionTournaments = [];
    switch (section) {
      case "inProgress":
        sectionTournaments = inProgress;
        break;
      case "upcoming":
        sectionTournaments = upcoming;
        break;
      case "past":
        sectionTournaments = completed;
        break;
      default:
        return [];
    }

    return sectionTournaments
      .filter(tournament => tournament?.basicInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
      .slice()
      .sort((a, b) => createLocalDate(a.basicInfo.startDate) - createLocalDate(b.basicInfo.startDate));
  };

  // Handle when table loses focus
  const handleTableBlur = e => {
    // Only clear focus if the new focus target is not within the table
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setFocusedRowIndex(-1);
      setCurrentSection("");
    }
  };

  // Handle when table receives focus via tab
  const handleTableFocus = section => {
    const visibleTournaments = getVisibleTournamentsInSection(section);
    if (visibleTournaments.length > 0) {
      setCurrentSection(section);
      // Start with first row focused when tabbing to table
      if (currentSection !== section || focusedRowIndex === -1) {
        setFocusedRowIndex(0);
      }
    }
  };

  // Handle keyboard navigation for table rows
  const handleTableKeyDown = (e, section) => {
    const visibleTournaments = getVisibleTournamentsInSection(section);

    if (visibleTournaments.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        if (currentSection !== section) {
          setCurrentSection(section);
          setFocusedRowIndex(0);
        } else if (focusedRowIndex === -1) {
          // Start navigation from first row if no row is focused
          setFocusedRowIndex(0);
        } else {
          // Implement wraparound: if at bottom, go to top
          setFocusedRowIndex(prev => (prev < visibleTournaments.length - 1 ? prev + 1 : 0));
        }
        break;

      case "ArrowUp":
        e.preventDefault();
        if (currentSection !== section) {
          setCurrentSection(section);
          setFocusedRowIndex(visibleTournaments.length - 1);
        } else if (focusedRowIndex === -1) {
          // Start navigation from last row if no row is focused
          setFocusedRowIndex(visibleTournaments.length - 1);
        } else {
          // Implement wraparound: if at top, go to bottom
          setFocusedRowIndex(prev => (prev > 0 ? prev - 1 : visibleTournaments.length - 1));
        }
        break;

      case "Enter":
      case " ":
        e.preventDefault();
        e.stopPropagation();
        if (currentSection === section && focusedRowIndex >= 0 && focusedRowIndex < visibleTournaments.length) {
          const selectedTournament = visibleTournaments[focusedRowIndex];
          handleTournamentClick(selectedTournament.basicInfo?.uniqueName);
        }
        break;

      case "Home":
        e.preventDefault();
        setCurrentSection(section);
        setFocusedRowIndex(0);
        break;

      case "End":
        e.preventDefault();
        setCurrentSection(section);
        setFocusedRowIndex(visibleTournaments.length - 1);
        break;

      default:
        // Let other keys pass through normally
        break;
    }
  };

  // Helper function to render tournament rows
  const renderTournamentRows = (tournamentList, searchTerm, section) => {
    if (!tournamentList?.length) return null;

    const filteredAndSorted = tournamentList
      .filter(tournament => tournament?.basicInfo?.name?.toLowerCase().includes(searchTerm?.toLowerCase() || ""))
      .slice()
      .sort((a, b) => createLocalDate(a.basicInfo.startDate) - createLocalDate(b.basicInfo.startDate));

    return filteredAndSorted.map((tournament, index) => {
      const { _id, basicInfo, courses = [] } = tournament;

      const isFocused = currentSection === section && focusedRowIndex === index;

      return (
        <tr
          key={_id}
          onClick={() => handleTournamentClick(basicInfo?.uniqueName)}
          className={`tournament-row ${isFocused ? "focused-row" : ""}`}
          aria-label={`View tournament: ${basicInfo.name}. Dates: ${formatDate(basicInfo.startDate)} to ${formatDate(basicInfo.endDate)}`}
          role="button"
          tabIndex={-1}
          aria-describedby={`${section}-tournament-name-header ${section}-tournament-dates-header ${section}-tournament-location-header`}
          style={{
            cursor: basicInfo?.uniqueName ? "pointer" : "default",
            transition: "background-color 0.3s",
          }}
        >
          <td>
            <div style={{ display: "flex", alignItems: "center" }}>
              <img
                alt="Tournament Logo"
                className="logo-image"
                style={{ width: "50px", height: "50px", marginRight: "10px" }}
                src={basicInfo?.logo || DEFAULT_LOGO}
              />
              <strong>{basicInfo?.name || "Unnamed Tournament"}</strong>
            </div>
          </td>
          <td>
            {basicInfo?.startDate && basicInfo?.endDate
              ? `${formatDate(basicInfo.startDate)} - ${formatDate(basicInfo.endDate)}`
              : "Dates not specified"}
          </td>
          <td>
            {courses && courses.length > 0 ? (
              <div>
                <>{courses[0].name}</>
                <br />
                {courses[0].location}
              </div>
            ) : (
              "Location not specified"
            )}
          </td>
        </tr>
      );
    });
  };

  return (
    <>
      <Container fluid style={{ paddingTop: "50px" }}>
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
              <a
                href={process.env.REACT_APP_DEPLOYMENT_URL || "https://speedscore.org/"}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none", display: "flex", alignItems: "center" }}
                aria-label="Go to SpeedScore main application"
              >
                <img
                  src="../../../../images/sslogo_lg.png"
                  alt="SpeedScore logo"
                  style={{
                    height: "60px",
                    width: "auto",
                    marginRight: "20px",
                    objectFit: "contain",
                    cursor: "pointer",
                    transition: "opacity 0.3s ease",
                  }}
                  onMouseOver={e => (e.target.style.opacity = "0.8")}
                  onMouseOut={e => (e.target.style.opacity = "1")}
                  onError={e => {
                    e.target.src = "../../../../images/DefaultGolfCoursePic.jpg";
                  }}
                />
              </a>
              <div>
                <h2 className="mb-0">Speedgolf Tournaments</h2>
              </div>
            </div>
          </div>
        </div>

        <div style={{ paddingLeft: "20px", paddingRight: "20px" }}>
          {loading ? (
            <div>
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : error ? (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          ) : (
            <>
              <div className="d-flex justify-content-start align-items-center mb-4">
                <label className="form-label me-2" htmlFor="searchBox">
                  Search/Filter:&nbsp;
                </label>
                <div style={{ width: "300px" }}>
                  <input
                    className="form-control"
                    id="searchBox"
                    aria-label="Search Tournaments"
                    type="search"
                    value={searchBoxTournament}
                    onChange={event => setSearchBoxTournament(event.target.value)}
                    placeholder="Filter by tournament name"
                  />
                </div>
              </div>

              {/* Screen reader instructions for table navigation */}
              <div id="table-instructions" className="visually-hidden">
                Tournament list navigation: Use Tab to focus on tournament tables that contain tournaments. Once
                focused, use arrow keys to navigate between tournament rows. Press Enter or Space to open a tournament
                details page. Use the collapsible section headers to expand or collapse tournament categories. Empty
                tables are not focusable.
              </div>

              {/* In Progress Tournaments */}
              <Row className="mt-4">
                <Col sm="12">
                  <h4
                    className="mb-3 d-flex align-items-center"
                    style={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => toggleCollapse("inProgress")}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleCollapse("inProgress");
                      } else if (e.key === "Tab" && !e.shiftKey && collapseState.inProgress) {
                        // If tabbing forward and section is expanded, focus should go to table (if it has content)
                        setTimeout(() => {
                          const hasContent = getVisibleTournamentsInSection("inProgress").length > 0;
                          if (inProgressTableRef.current && hasContent) {
                            inProgressTableRef.current.focus();
                            setCurrentSection("inProgress");
                            setFocusedRowIndex(0);
                          }
                        }, 0);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={collapseState.inProgress}
                    aria-controls="in-progress-tournaments"
                  >
                    <span
                      className="me-2"
                      style={{
                        color: "black",
                        fontSize: "18px",
                        fontWeight: "bold",
                        width: "24px",
                        height: "24px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FontAwesomeIcon icon={collapseState.inProgress ? "chevron-down" : "chevron-right"} />
                    </span>
                    <span
                      className="bg-success rounded-circle me-2"
                      style={{ width: "12px", height: "12px", display: "inline-block" }}
                    ></span>
                    <span className="fw-bold">In Progress</span>
                    <small className="text-muted ms-2">({inProgress.length})</small>
                  </h4>
                  <Collapse in={collapseState.inProgress}>
                    <div id="in-progress-tournaments">
                      <Table
                        striped
                        bordered
                        hover
                        responsive
                        ref={inProgressTableRef}
                        onKeyDown={e => handleTableKeyDown(e, "inProgress")}
                        onFocus={() => handleTableFocus("inProgress")}
                        onBlur={handleTableBlur}
                        tabIndex={getVisibleTournamentsInSection("inProgress").length > 0 ? 0 : -1}
                        role="table"
                        aria-label="In Progress Tournaments"
                        aria-describedby="table-instructions"
                      >
                        <thead>
                          <tr>
                            <th scope="col" id="inprogress-tournament-name-header">
                              Tournament
                            </th>
                            <th scope="col" id="inprogress-tournament-dates-header">
                              Dates
                            </th>
                            <th scope="col" id="inprogress-tournament-location-header">
                              Location
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {inProgress.length > 0 ? (
                            renderTournamentRows(inProgress, searchBoxTournament, "inProgress") || (
                              <tr role="row">
                                <td colSpan={3} className="text-center" role="cell">
                                  No tournaments in progress found
                                </td>
                              </tr>
                            )
                          ) : (
                            <tr role="row">
                              <td colSpan={3} className="text-center" role="cell">
                                No tournaments currently in progress.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Collapse>
                </Col>
              </Row>

              {/* Upcoming Tournaments */}
              <Row className="mt-4">
                <Col sm="12">
                  <h4
                    className="mb-3 d-flex align-items-center"
                    style={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => toggleCollapse("upcoming")}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleCollapse("upcoming");
                      } else if (e.key === "Tab" && !e.shiftKey && collapseState.upcoming) {
                        // If tabbing forward and section is expanded, focus should go to table (if it has content)
                        setTimeout(() => {
                          const hasContent = getVisibleTournamentsInSection("upcoming").length > 0;
                          if (upcomingTableRef.current && hasContent) {
                            upcomingTableRef.current.focus();
                            setCurrentSection("upcoming");
                            setFocusedRowIndex(0);
                          }
                        }, 0);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={collapseState.upcoming}
                    aria-controls="upcoming-tournaments"
                  >
                    <span
                      className="me-2"
                      style={{
                        color: "black",
                        fontSize: "18px",
                        fontWeight: "bold",
                        width: "24px",
                        height: "24px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FontAwesomeIcon icon={collapseState.upcoming ? "chevron-down" : "chevron-right"} />
                    </span>
                    <span
                      className="bg-primary rounded-circle me-2"
                      style={{ width: "12px", height: "12px", display: "inline-block" }}
                    ></span>
                    <span className="fw-bold">Upcoming</span>
                    <small className="text-muted ms-2">({upcoming.length})</small>
                  </h4>
                  <Collapse in={collapseState.upcoming}>
                    <div id="upcoming-tournaments">
                      <Table
                        striped
                        bordered
                        hover
                        responsive
                        ref={upcomingTableRef}
                        onKeyDown={e => handleTableKeyDown(e, "upcoming")}
                        onFocus={() => handleTableFocus("upcoming")}
                        onBlur={handleTableBlur}
                        tabIndex={getVisibleTournamentsInSection("upcoming").length > 0 ? 0 : -1}
                        role="table"
                        aria-label="Upcoming Tournaments"
                        aria-describedby="table-instructions"
                      >
                        <thead>
                          <tr>
                            <th scope="col" id="upcoming-tournament-name-header">
                              Tournament
                            </th>
                            <th scope="col" id="upcoming-tournament-dates-header">
                              Dates
                            </th>
                            <th scope="col" id="upcoming-tournament-location-header">
                              Location
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {upcoming.length > 0 ? (
                            renderTournamentRows(upcoming, searchBoxTournament, "upcoming") || (
                              <tr role="row">
                                <td colSpan={3} className="text-center" role="cell">
                                  No upcoming tournaments found
                                </td>
                              </tr>
                            )
                          ) : (
                            <tr role="row">
                              <td colSpan={3} className="text-center" role="cell">
                                No tournaments currently upcoming.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Collapse>
                </Col>
              </Row>

              {/* Past Tournaments */}
              <Row className="mt-4">
                <Col sm="12">
                  <h4
                    className="mb-3 d-flex align-items-center"
                    style={{ cursor: "pointer", userSelect: "none" }}
                    onClick={() => toggleCollapse("past")}
                    onKeyDown={e => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        toggleCollapse("past");
                      } else if (e.key === "Tab" && !e.shiftKey && collapseState.past) {
                        // If tabbing forward and section is expanded, focus should go to table (if it has content)
                        setTimeout(() => {
                          const hasContent = getVisibleTournamentsInSection("past").length > 0;
                          if (pastTableRef.current && hasContent) {
                            pastTableRef.current.focus();
                            setCurrentSection("past");
                            setFocusedRowIndex(0);
                          }
                        }, 0);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-expanded={collapseState.past}
                    aria-controls="past-tournaments"
                  >
                    <span
                      className="me-2"
                      style={{
                        color: "black",
                        fontSize: "18px",
                        fontWeight: "bold",
                        width: "24px",
                        height: "24px",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FontAwesomeIcon icon={collapseState.past ? "chevron-down" : "chevron-right"} />
                    </span>
                    <span
                      className="bg-secondary rounded-circle me-2"
                      style={{ width: "12px", height: "12px", display: "inline-block" }}
                    ></span>
                    <span className="fw-bold">Past</span>
                    <small className="text-muted ms-2">({completed.length})</small>
                  </h4>
                  <Collapse in={collapseState.past}>
                    <div id="past-tournaments">
                      <Table
                        striped
                        bordered
                        hover
                        responsive
                        ref={pastTableRef}
                        onKeyDown={e => handleTableKeyDown(e, "past")}
                        onFocus={() => handleTableFocus("past")}
                        onBlur={handleTableBlur}
                        tabIndex={getVisibleTournamentsInSection("past").length > 0 ? 0 : -1}
                        role="table"
                        aria-label="Past Tournaments"
                        aria-describedby="table-instructions"
                      >
                        <thead>
                          <tr>
                            <th scope="col" id="past-tournament-name-header">
                              Tournament
                            </th>
                            <th scope="col" id="past-tournament-dates-header">
                              Dates
                            </th>
                            <th scope="col" id="past-tournament-location-header">
                              Location
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {completed.length > 0 ? (
                            renderTournamentRows(completed, searchBoxTournament, "past") || (
                              <tr role="row">
                                <td colSpan={3} className="text-center" role="cell">
                                  No past tournaments found
                                </td>
                              </tr>
                            )
                          ) : (
                            <tr role="row">
                              <td colSpan={3} className="text-center" role="cell">
                                No past tournaments available.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </Table>
                    </div>
                  </Collapse>
                </Col>
              </Row>
            </>
          )}

          <style>
            {`
          .tournament-row:hover {
            background-color: rgba(0, 123, 255, 0.1) !important;
          }
          
          .focused-row {
            background-color: rgba(0, 123, 255, 0.3) !important;
            outline: 3px solid #007bff !important;
            outline-offset: -3px !important;
            box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.5) !important;
          }
          
          .table:focus {
            outline: 2px solid #007bff !important;
            outline-offset: 2px !important;
          }
        `}
          </style>
        </div>
      </Container>
    </>
  );
};

export default PublicTournamentsPage;
