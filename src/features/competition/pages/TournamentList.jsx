import { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { tournamentsSelector } from "../competitionSelectors";
import { useNavigate } from "react-router-dom";
import "../../../styles/features/competition/newTournament.css";
import { Container, Table, Row, Col, Collapse } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { fetchCourses } from "features/course/courseActions";
import { fetchAllCompetitions } from "../competitionActions";
import { notifyMessage } from "services/toasterServices";
import { createLocalDate } from "../utils/dateUtils";
const DEFAULT_LOGO = "../../../../images/DefaultGolfCoursePic.jpg";

const TournamentList = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const tournaments = useSelector(tournamentsSelector);
  const user = useSelector(state => state.user.user);

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
          const tableRef =
            section === "inProgress" ? inProgressTableRef : section === "upcoming" ? upcomingTableRef : pastTableRef;
          const hasContent = getVisibleTournamentsInSection(section).length > 0;

          if (tableRef.current && hasContent) {
            tableRef.current.focus();
            // Also set the current section and first row as focused
            setCurrentSection(section);
            setFocusedRowIndex(0);
          }
        }, 150); // Small delay to allow collapse animation
      }

      return newState;
    });
  };

  useEffect(() => {
    dispatch(fetchAllCompetitions());
    dispatch(fetchCourses(navigate));
  }, [dispatch, navigate]);

  // Manage table focus classes based on focused row state
  useEffect(() => {
    // Update table classes based on whether we have a focused row
    const hasFocusedRow = focusedRowIndex >= 0 && currentSection;

    // Update all table refs
    [inProgressTableRef, upcomingTableRef, pastTableRef].forEach(ref => {
      if (ref.current) {
        if (hasFocusedRow) {
          ref.current.classList.add("has-focused-row");
        } else {
          ref.current.classList.remove("has-focused-row");
        }
      }
    });
  }, [focusedRowIndex, currentSection]);

  // Auto-expand sections when search matches are found
  useEffect(() => {
    if (searchBoxTournament && searchBoxTournament.trim()) {
      // Filter and categorize tournaments within the effect to avoid dependency issues
      if (!tournaments || !tournaments.length) return;

      const visibleTournaments = tournaments.filter(tournament => {
        // Show published tournaments to everyone
        if (tournament.published) return true;

        // Show unpublished tournaments only to admin/director
        if (!user || !user._id) return false;
        const isAdmin =
          (tournament.admins && tournament.admins.includes(user._id)) ||
          (tournament.basicInfo?.admins && tournament.basicInfo.admins.includes(user._id));
        const isDirector = tournament.director === user._id || tournament.basicInfo?.directorId === user._id;
        return isAdmin || isDirector;
      });

      const currentDate = new Date();
      const upcomingTournaments = [];
      const inProgressTournaments = [];
      const completedTournaments = [];

      visibleTournaments.forEach(tournament => {
        const startDate = createLocalDate(tournament.basicInfo.startDate);
        const endDate = createLocalDate(tournament.basicInfo.endDate);
        endDate.setHours(23, 59, 59, 999);

        // Create a date 5 days after the tournament ends for extended "In Progress" period
        const extendedEndDate = new Date(endDate);
        extendedEndDate.setDate(extendedEndDate.getDate() + 5);
        extendedEndDate.setHours(23, 59, 59, 999);

        if (currentDate < startDate) {
          upcomingTournaments.push(tournament);
        } else if (currentDate >= startDate && currentDate <= extendedEndDate) {
          inProgressTournaments.push(tournament);
        } else {
          completedTournaments.push(tournament);
        }
      });

      setCollapseState(prevState => {
        const newState = { ...prevState };

        // Auto-expand sections that have search matches
        if (hasSearchMatches(inProgressTournaments, searchBoxTournament)) {
          newState.inProgress = true;
        }
        if (hasSearchMatches(upcomingTournaments, searchBoxTournament)) {
          newState.upcoming = true;
        }
        if (hasSearchMatches(completedTournaments, searchBoxTournament)) {
          newState.past = true;
        }

        return newState;
      });
    }
  }, [searchBoxTournament, tournaments, user]); // Dependencies: search term, tournaments data, and user data

  const isAdminOrDirector = tournament => {
    if (!user || !user._id) return false;
    const isAdmin =
      (tournament.admins && tournament.admins.includes(user._id)) ||
      (tournament.basicInfo?.admins && tournament.basicInfo.admins.includes(user._id));
    const isDirector = tournament.director === user._id || tournament.basicInfo?.directorId === user._id;
    return isAdmin || isDirector;
  };

  const handleTournamentClick = (tournamentId, tournament) => {
    if (!tournament.published && !isAdminOrDirector(tournament)) {
      notifyMessage("error", "The tournament is not published", 5000, "colored", "top-center");
      return;
    }
    navigate(`/competitions/detail/${tournamentId}`);
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
      // Don't automatically set a focused row when tabbing to table
      // Let the user use arrow keys to start row navigation
      // Only set focused row if we're already in this section and had a previous focus
      if (currentSection === section && focusedRowIndex >= 0) {
        // Keep the existing focused row
      } else {
        // Clear focused row so table shows its own focus
        setFocusedRowIndex(-1);
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
        if (currentSection === section && focusedRowIndex >= 0 && focusedRowIndex < visibleTournaments.length) {
          const selectedTournament = visibleTournaments[focusedRowIndex];
          handleTournamentClick(selectedTournament._id, selectedTournament);
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

  // Filter tournaments to only show published ones OR ones where user is admin/director
  const getVisibleTournaments = () => {
    if (!tournaments || !tournaments.length) return [];

    return tournaments.filter(tournament => {
      // Show published tournaments to everyone
      if (tournament.published) return true;

      // Show unpublished tournaments only to admin/director
      return isAdminOrDirector(tournament);
    });
  };

  // Categorize tournaments by status
  const categorizeTournaments = () => {
    const visibleTournaments = getVisibleTournaments();
    const currentDate = new Date();

    const upcoming = [];
    const inProgress = [];
    const completed = [];

    visibleTournaments.forEach(tournament => {
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

  // Helper function to render tournament rows
  const renderTournamentRows = (tournamentList, searchTerm, section) => {
    if (!tournamentList?.length) return null;

    const filteredAndSorted = tournamentList
      .filter(tournament => tournament?.basicInfo?.name?.toLowerCase().includes(searchTerm?.toLowerCase() || ""))
      .slice()
      .sort((a, b) => createLocalDate(a.basicInfo.startDate) - createLocalDate(b.basicInfo.startDate));

    return filteredAndSorted.map((tournament, index) => {
      const { _id, basicInfo, published, regPaymentInfo, courses = [] } = tournament;

      // Use helper function to create local dates
      const TStartDate = createLocalDate(basicInfo.startDate);
      const TEndDate = createLocalDate(basicInfo.endDate);
      const REndDate = createLocalDate(regPaymentInfo.regEndDate);

      const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      const isFocused = currentSection === section && focusedRowIndex === index;

      return (
        <tr
          key={_id}
          onClick={() => handleTournamentClick(_id, tournament)}
          className={`tournament-row ${isFocused ? "focused-row" : ""}`}
          aria-label={`View tournament: ${basicInfo.name}. Registration deadline: ${dateTimeFormat.format(REndDate)}`}
          role="button"
          tabIndex={-1}
          aria-describedby={`${section}-tournament-name-header ${section}-tournament-dates-header ${section}-tournament-location-header`}
        >
          <td>
            <div style={{ display: "flex", alignItems: "center" }}>
              <img alt="Tournament Logo preview" className="logo-image" src={basicInfo.logo || DEFAULT_LOGO} />
              <strong>
                {basicInfo.name}
                {/* Show indicator for unpublished tournaments */}
                {!published && (
                  <span className="badge bg-warning text-dark ms-2" style={{ fontSize: "0.7em" }}>
                    Draft
                  </span>
                )}
              </strong>
            </div>
          </td>
          <td>
            {dateTimeFormat.format(TStartDate)} - {dateTimeFormat.format(TEndDate)}
            <br />
            <strong> Registration Deadline: </strong>
            {dateTimeFormat.format(REndDate)}
          </td>
          <td>
            {courses && courses.length > 0 ? (
              <div>
                <>{courses[0].name.split(",")[0]}</>
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
    <Container className="h-50">
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexDirection: "column",
          gap: "0.75rem",
          marginBottom: "1.5rem",
          padding: "1rem",
        }}
      >
        <label
          style={{
            fontWeight: "600",
            fontSize: "1rem",
            color: "#495057",
            textAlign: "center",
          }}
          htmlFor="searchBox"
        >
          Search/Filter:
        </label>
        <div
          style={{
            width: "100%",
            maxWidth: "400px",
          }}
        >
          <input
            style={{
              width: "100%",
              minHeight: "44px",
              fontSize: "16px", // Prevents iOS zoom
              padding: "0.75rem",
              borderRadius: "0.375rem",
              border: "1px solid #ced4da",
              textAlign: "center",
            }}
            id="searchBox"
            aria-label="Search Tournaments"
            type="search"
            value={searchBoxTournament}
            onChange={event => setSearchBoxTournament(event.target.value)}
            placeholder="Enter tournament name..."
          />
        </div>
      </div>

      {/* Screen reader instructions for table navigation */}
      <div id="table-instructions" className="visually-hidden">
        Tournament list navigation: Use Tab to focus on tournament tables that contain tournaments. Once focused, use
        arrow keys to navigate between tournament rows. Press Enter or Space to open a tournament details page. Use the
        collapsible section headers to expand or collapse tournament categories. Empty tables are not focusable.
      </div>

      {/* In Progress Tournaments - Always show */}
      <Row className="justify-content-center mt-4">
        <Col sm="9">
          <h4
            style={{
              cursor: "pointer",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "nowrap",
              whiteSpace: "nowrap",
              marginBottom: "1rem",
              padding: "1rem",
              backgroundColor: "#f8f9fa",
              borderRadius: "0.5rem",
              border: "1px solid #dee2e6",
              fontSize: "1.1rem",
              fontWeight: "normal",
            }}
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
              style={{
                color: "black",
                fontSize: "18px",
                fontWeight: "bold",
                width: "24px",
                height: "24px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FontAwesomeIcon icon={collapseState.inProgress ? "chevron-down" : "chevron-right"} />
            </span>
            <span
              style={{
                width: "12px",
                height: "12px",
                display: "inline-block",
                flexShrink: 0,
                backgroundColor: "#198754",
                borderRadius: "50%",
              }}
            ></span>
            <span style={{ flexShrink: 1, overflow: "hidden", textOverflow: "ellipsis", fontWeight: "bold" }}>
              In Progress
            </span>
            <small style={{ flexShrink: 0, color: "#6c757d" }}>({inProgress.length})</small>
          </h4>
          <Collapse in={collapseState.inProgress}>
            <div id="in-progress-tournaments">
              <Table
                striped
                bordered
                hover
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

      {/* Upcoming Tournaments - Always show */}
      <Row className="justify-content-center mt-4">
        <Col sm="9">
          <h4
            style={{
              cursor: "pointer",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "nowrap",
              whiteSpace: "nowrap",
              marginBottom: "1rem",
              padding: "1rem",
              backgroundColor: "#f8f9fa",
              borderRadius: "0.5rem",
              border: "1px solid #dee2e6",
              fontSize: "1.1rem",
              fontWeight: "normal",
            }}
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
              style={{
                color: "black",
                fontSize: "18px",
                fontWeight: "bold",
                width: "24px",
                height: "24px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FontAwesomeIcon icon={collapseState.upcoming ? "chevron-down" : "chevron-right"} />
            </span>
            <span
              style={{
                width: "12px",
                height: "12px",
                display: "inline-block",
                flexShrink: 0,
                backgroundColor: "#0d6efd",
                borderRadius: "50%",
              }}
            ></span>
            <span style={{ flexShrink: 1, overflow: "hidden", textOverflow: "ellipsis", fontWeight: "bold" }}>
              Upcoming
            </span>
            <small style={{ flexShrink: 0, color: "#6c757d" }}>({upcoming.length})</small>
          </h4>
          <Collapse in={collapseState.upcoming}>
            <div id="upcoming-tournaments">
              <Table
                striped
                bordered
                hover
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

      {/* Past Tournaments - Always show */}
      <Row className="justify-content-center mt-4">
        <Col sm="9">
          <h4
            style={{
              cursor: "pointer",
              userSelect: "none",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexWrap: "nowrap",
              whiteSpace: "nowrap",
              marginBottom: "1rem",
              padding: "1rem",
              backgroundColor: "#f8f9fa",
              borderRadius: "0.5rem",
              border: "1px solid #dee2e6",
              fontSize: "1.1rem",
              fontWeight: "normal",
            }}
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
              style={{
                color: "black",
                fontSize: "18px",
                fontWeight: "bold",
                width: "24px",
                height: "24px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <FontAwesomeIcon icon={collapseState.past ? "chevron-down" : "chevron-right"} />
            </span>
            <span
              style={{
                width: "12px",
                height: "12px",
                display: "inline-block",
                flexShrink: 0,
                backgroundColor: "#6c757d",
                borderRadius: "50%",
              }}
            ></span>
            <span style={{ flexShrink: 1, overflow: "hidden", textOverflow: "ellipsis", fontWeight: "bold" }}>
              Past
            </span>
            <small style={{ flexShrink: 0, color: "#6c757d" }}>({completed.length})</small>
          </h4>
          <Collapse in={collapseState.past}>
            <div id="past-tournaments">
              <Table
                striped
                bordered
                hover
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
    </Container>
  );
};

export default TournamentList;
