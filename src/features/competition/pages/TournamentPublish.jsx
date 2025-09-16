import { useEffect, useState } from "react";
import { Modal, Button, Alert, Form, Row, Col, Badge } from "react-bootstrap";
import { validatePublishTournament, isDateWithinTournament } from "../tournamentSchema";
import { useDispatch, useSelector } from "react-redux";
import { setupStripeAccount } from "features/user/userActions";
import { confirmStripeSetup } from "features/user/userServices";
import { formatCurrency } from "../utils/currencyUtils";
//Check if user has a Stripe account set up
const StripeSetupDialog = ({ show, onClose, onSetupStripe }) => (
  <Modal show={show} onHide={onClose}>
    <Modal.Header closeButton>
      <Modal.Title>Stripe Account Required</Modal.Title>
    </Modal.Header>
    <Modal.Body>
      <p>
        To publish tournaments and accept payments, you need to set up a Stripe account first. This is required to
        securely process tournament registration fees.
      </p>
    </Modal.Body>
    <Modal.Footer className="d-flex gap-2 justify-content-start border-0 px-3 pb-3">
      <button className="mode-page-btn-cancel action-dialog cancel-button" type="button" onClick={onClose}>
        Cancel
      </button>
      <button className="mode-page-btn action-dialog action-button" type="button" onClick={onSetupStripe}>
        Set Up Stripe Account
      </button>
    </Modal.Footer>
  </Modal>
);

const TournamentPublish = ({ show, onClose, onConfirm, tournament, isPublishing = false }) => {
  const user = useSelector(state => state.user.user);
  const dispatch = useDispatch();
  const [validationErrors, setValidationErrors] = useState([]);
  const [showStripeDialog, setShowStripeDialog] = useState(false);
  const [expandedDivisions, setExpandedDivisions] = useState([]);

  useEffect(() => {
    if (show && tournament) {
      const { errors } = validatePublishTournament(tournament);
      setValidationErrors(errors);
    }
  }, [show, tournament]);

  useEffect(() => {
    if (user.personalInfo?.stripeAccountId) {
      console.log("Updated Account ID:", user.personalInfo.stripeAccountId);
    }
  }, [user]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("setup") === "complete") {
      const stripeAccountId = user.personalInfo?.stripeAccountId;

      if (stripeAccountId) {
        dispatch(confirmStripeSetup(stripeAccountId))
          .then(() => {
            console.log("Stripe setup confirmed successfully");
          })
          .catch(error => {
            console.error("Failed to confirm Stripe setup:", error);
          });
      }
    }
  }, [user, dispatch]);

  if (!tournament) return null;

  const { basicInfo, regPaymentInfo, courses, divisions } = tournament;
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Format dates without timezone conversion issues
  const formatDateSafely = dateStr => {
    if (!dateStr) return "";

    // Extract date part from ISO string if needed
    let dateOnly;
    if (dateStr.includes("T")) {
      dateOnly = dateStr.split("T")[0];
    } else {
      dateOnly = dateStr;
    }

    const [year, month, day] = dateOnly.split("-").map(Number);
    const localDate = new Date(year, month - 1, day); // month is 0-indexed
    return dateFormatter.format(localDate);
  };

  const formatRoundDate = dateString => {
    if (!dateString) return "Date not set";
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date);
  };

  const toggleDivisionExpand = divisionIndex => {
    setExpandedDivisions(prev => {
      if (prev.includes(divisionIndex)) {
        return prev.filter(idx => idx !== divisionIndex);
      } else {
        return [...prev, divisionIndex];
      }
    });
  };

  const handlePublishClick = async () => {
    if (tournament.regPaymentInfo.payThroughApp) {
      const stripeAccountId = user.personalInfo.stripeAccountId;
      if (!stripeAccountId) {
        setShowStripeDialog(true);
        return;
      }
    }
    const stripeAccountId = tournament.regPaymentInfo.payThroughApp ? user.personalInfo.stripeAccountId : null;
    onConfirm(stripeAccountId);
  };

  const handleStripeSetup = async () => {
    try {
      await dispatch(setupStripeAccount());
      setShowStripeDialog(false);
      onClose();
    } catch (error) {
      console.error("Error setting up Stripe:", error);
      alert("Failed to set up Stripe account. Please try again.");
    }
  };

  const checkDateWithinTournament = dateStr => {
    return isDateWithinTournament(dateStr, basicInfo.startDate, basicInfo.endDate);
  };

  const isRegistrationPeriodValid = () => {
    if (!regPaymentInfo?.regEndDate || !basicInfo?.startDate) return true;

    // Parse dates safely without timezone conversion
    const parseDate = dateStr => {
      let dateOnly;
      if (dateStr.includes("T")) {
        dateOnly = dateStr.split("T")[0];
      } else {
        dateOnly = dateStr;
      }
      const [year, month, day] = dateOnly.split("-").map(Number);
      return new Date(year, month - 1, day); // month is 0-indexed
    };

    const regEnd = parseDate(regPaymentInfo.regEndDate);
    const tournamentStart = parseDate(basicInfo.startDate);
    return regEnd <= tournamentStart;
  };

  const renderRoundsForDivision = (division, divisionIndex) => {
    if (!expandedDivisions.includes(divisionIndex) || !division.rounds || division.rounds.length === 0) {
      return null;
    }

    return (
      <div className="mt-2 mb-3 border-top pt-2">
        <h6 className="mb-2">Round Schedule:</h6>
        {division.rounds.map((round, roundIndex) => {
          const isValidRoundDate = checkDateWithinTournament(round.date);

          return (
            <div
              key={roundIndex}
              className={`mb-2 p-2 rounded border ${!isValidRoundDate ? "border-danger bg-danger-subtle" : "bg-light"}`}
            >
              <div className="d-flex justify-content-between">
                <div>
                  <strong>Round {round.roundNumber || roundIndex + 1}</strong>
                  {round.courseId && (
                    <div className="small text-muted">
                      Course: {courses.find(c => c.courseId === round.courseId)?.name || round.courseId}
                    </div>
                  )}
                </div>
                <div className="text-end">
                  <div>
                    {formatRoundDate(round.date)}
                    {!isValidRoundDate && (
                      <Badge bg="danger" className="ms-2">
                        Outside tournament dates
                      </Badge>
                    )}
                  </div>
                  {round.teeTimes !== undefined && (
                    <small className="text-muted">Tee Times: {round.teeTimes ? "Yes" : "No"}</small>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const categorizeErrors = () => {
    const dateErrors = validationErrors.filter(
      error => error.includes("date") || error.includes("must be within") || error.includes("must end before"),
    );
    const otherErrors = validationErrors.filter(error => !dateErrors.includes(error));

    return { dateErrors, otherErrors };
  };

  const { dateErrors, otherErrors } = categorizeErrors();

  const renderTournamentInfo = () => (
    <Form>
      <Form.Group as={Row} className="mb-4">
        <Col sm="2" className="txt-align-right">
          <Form.Label className="form-label fw-bold">Tournament Name:</Form.Label>
        </Col>
        <Col sm="10">
          <Form.Control type="text" value={basicInfo?.name} disabled className="bg-white" />
        </Col>
      </Form.Group>
      <Form.Group as={Row} className="mb-4">
        <Col sm="2" className="txt-align-right">
          <Form.Label className="form-label fw-bold">Tournament Dates:</Form.Label>
        </Col>
        <Col sm="10">
          <Form.Control
            type="text"
            value={`${formatDateSafely(basicInfo?.startDate)} to ${formatDateSafely(basicInfo?.endDate)}`}
            disabled
            className="bg-white"
          />
        </Col>
      </Form.Group>
      <Form.Group as={Row} className="mb-4">
        <Col sm="2" className="txt-align-right">
          <Form.Label className="form-label fw-bold">Registration Period:</Form.Label>
        </Col>
        <Col sm="10">
          <div className="position-relative">
            <Form.Control
              type="text"
              value={`${formatDateSafely(regPaymentInfo?.regStartDate)} to ${formatDateSafely(regPaymentInfo?.regEndDate)}`}
              disabled
              className={`bg-white ${!isRegistrationPeriodValid() ? "border-danger" : ""}`}
            />
            {!isRegistrationPeriodValid() && (
              <div className="text-danger mt-1">
                <small>
                  Registration ends after tournament starts. Registration should end before or on tournament start date.
                </small>
              </div>
            )}
          </div>
        </Col>
      </Form.Group>
      <Form.Group as={Row} className="mb-4">
        <Col sm="2" className="txt-align-right">
          <Form.Label className="form-label fw-bold">Courses:</Form.Label>
        </Col>
        <Col sm="10">
          {Array.isArray(courses) &&
            courses.map((course, index) => (
              <Form.Control
                key={course.courseId || index}
                type="text"
                value={`${course.name} - ${course.location}`}
                className="mb-2 bg-white"
                disabled
              />
            ))}
        </Col>
      </Form.Group>
      <Form.Group as={Row} className="mb-4">
        <Col sm="2" className="txt-align-right">
          <Form.Label className="form-label fw-bold">Divisions:</Form.Label>
        </Col>
        <Col sm="10">
          <div
            className="divisions-container"
            style={{ maxHeight: "300px", overflowY: "auto", border: "1px solid #dee2e6", borderRadius: "4px" }}
          >
            {Array.isArray(divisions) &&
              divisions.map((division, index) => (
                <div key={index} className="mb-3 border rounded p-3" style={{ margin: "10px" }}>
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h5 className="mb-1">{division.name || "Unnamed Division"}</h5>
                      <div className="text-muted mb-2">
                        <span className="me-3">Gender: {division.gender || "Not specified"}</span>
                        <span>
                          Age: {division.minAge || "0"}-{division.maxAge || "unlimited"}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex align-items-center gap-2">
                      <Button variant="primary" size="sm" disabled>
                        Entry Fee:{" "}
                        {formatCurrency(division.entryFee || 0, tournament?.regPaymentInfo?.currencyType || "USD")}
                      </Button>
                      <Button variant="info" size="sm" disabled>
                        {division.rounds?.length || 0} Rounds
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        onClick={() => toggleDivisionExpand(index)}
                        aria-expanded={expandedDivisions.includes(index)}
                      >
                        {expandedDivisions.includes(index) ? "Hide Rounds" : "Show Rounds"}
                      </Button>
                    </div>
                  </div>

                  {renderRoundsForDivision(division, index)}
                </div>
              ))}
          </div>
        </Col>
      </Form.Group>
    </Form>
  );

  return (
    <>
      <Modal show={show} onHide={onClose} size="lg" scrollable>
        <Modal.Header closeButton>
          <Modal.Title>{tournament.published ? "Unpublish Tournament?" : "Publish Tournament?"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {validationErrors.length > 0 ? (
            <Alert variant="danger">
              <Alert.Heading>Cannot publish tournament</Alert.Heading>

              {dateErrors.length > 0 && (
                <>
                  <strong>Date Inconsistencies:</strong>
                  <ul className="mb-2">
                    {dateErrors.map((error, index) => (
                      <li key={`date-${index}`}>{error}</li>
                    ))}
                  </ul>
                </>
              )}

              {otherErrors.length > 0 && (
                <>
                  {dateErrors.length > 0 && <hr />}
                  <strong>Other Issues:</strong>
                  <ul className="mb-2">
                    {otherErrors.map((error, index) => (
                      <li key={`validation-${index}`}>{error}</li>
                    ))}
                  </ul>
                </>
              )}

              <hr />
              <p className="mb-2">Please address these issues before publishing:</p>
              <ul className="mb-0">
                {dateErrors.some(err => err.includes("Registration") || err.includes("end")) && (
                  <li>Update registration dates in the Payment & Registration tab</li>
                )}
                {dateErrors.some(err => err.includes("Round") || err.includes("within tournament")) && (
                  <li>Update round dates in the Divisions tab</li>
                )}
                {otherErrors.some(err => err.includes("course")) && (
                  <li>Complete required information in Courses tab</li>
                )}
                {otherErrors.some(err => err.includes("division")) && (
                  <li>Complete required information in Divisions tab</li>
                )}
              </ul>
            </Alert>
          ) : (
            renderTournamentInfo()
          )}
        </Modal.Body>
        <Modal.Footer className="d-flex gap-2 justify-content-start border-0 px-3 pb-3">
          <button className="mode-page-btn-cancel action-dialog cancel-button" type="button" onClick={onClose}>
            Cancel
          </button>
          {validationErrors.length === 0 && (
            <button
              className="mode-page-btn action-dialog action-button"
              onClick={handlePublishClick}
              disabled={isPublishing}
            >
              {isPublishing ? <>Processing...</> : tournament.published ? "Unpublish" : "Publish"}
            </button>
          )}
        </Modal.Footer>
      </Modal>

      <StripeSetupDialog
        show={showStripeDialog}
        onClose={() => setShowStripeDialog(false)}
        onSetupStripe={handleStripeSetup}
      />
    </>
  );
};

export default TournamentPublish;
