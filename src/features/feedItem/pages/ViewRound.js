import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { fetchRoundByIdAction } from "../feeditemActions";
import Navbar from "../../shared/Navbar/Navbar";
import moment from "moment";
import {
  roundPace,
  unitFormattingString,
  formatRoundDate,
  secondsConversion,
  distanceConversion,
} from "../utils/utils";

const ViewRound = () => {
  const { roundId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const userState = useSelector(state => state.user);
  const jwtToken = userState.tokens.jwtToken;
  const user = userState.user;
  const userPreferredUnit = user?.preferences?.preferredUnits ?? "imperial";
  // Local loading state
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    dispatch(fetchRoundByIdAction(jwtToken, roundId))
      .then(() => setLoading(false))
      .catch(() => setLoading(false));
  }, [dispatch, roundId, jwtToken]);

  //'selectedRound' from Redux
  const selectedRound = useSelector(state => state.feeds.selectedRound);

  if (loading) {
    return <div>Loading round details...</div>;
  }

  if (!selectedRound) {
    return <div>Round not found.</div>;
  }

  console.log("The value of Selected round:", selectedRound);

  //unpacking the selectedRound object
  const { _id, date, roundType, strokes, time, distance, notes, keepPrivate, numHoles, courseId, teeId } =
    selectedRound;

  const minutes = Math.floor((time || 0) / 60);
  const seconds = (time || 0) % 60;
  const formattedDate = date ? moment(date, "MM-DD-YYYY").format("YYYY-MM-DD") : "N/A";
  const sgsScore = strokes + secondsConversion(time).minutes + ":" + secondsConversion(time).seconds;
  const pace = `${roundPace(distance, userPreferredUnit)} ${unitFormattingString(userPreferredUnit)} pace`;

  return (
    <>
      <Navbar />
      <div
        id="roundsModeDialog"
        className="mode-page action-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="roundFormHeader"
        tabIndex="0"
      >
        <h1 id="roundFormHeader" className="mode-page-header">
          View Round
        </h1>
        <form id="logRoundForm" className="centered">
          {/* Date */}
          <div className="mb-3">
            <label htmlFor="roundDate" className="form-label">
              Date:
              <div
                id="roundDate"
                className="form-control centered"
                style={{
                  backgroundColor: "#e9ecef",
                  cursor: "not-allowed",
                  pointerEvents: "none",
                }}
              >
                {formattedDate || "N/A"}
              </div>
            </label>
            <div id="roundDateDescr" className="form-text">
              Enter a valid date
            </div>
          </div>

          {/* Course and Tee */}
          <div className="d-flex flex-row flex-wrap justify-content-center">
            <div className="course-container">
              <label htmlFor="roundCourse" className="form-label">
                Course:
                <div
                  id="roundCourse"
                  className="form-control centered"
                  style={{
                    backgroundColor: "#e9ecef",
                    cursor: "not-allowed",
                    pointerEvents: "none",
                  }}
                >
                  {courseId && courseId?.shortName ? courseId.shortName : "N/A"}
                </div>
                <div id="roundCourseDescr" className="form-text mb-2" style={{ alignSelf: "flex-start" }}>
                  Choose a course from the dropdown list
                </div>
              </label>
            </div>
            <div className="tee-container">
              <label htmlFor="roundTee">
                Tee:
                <div
                  id="roundTee"
                  className="form-control centered roundTee"
                  style={{
                    backgroundColor: "#e9ecef",
                    cursor: "not-allowed",
                    pointerEvents: "none",
                  }}
                >
                  {teeId?.name || "N/A"}
                </div>
              </label>
            </div>
          </div>

          {/* Round Type */}
          <div className="mb-3">
            <label htmlFor="roundType">
              Type:
              <div
                id="roundType"
                className="form-control centered"
                style={{
                  backgroundColor: "#e9ecef",
                  cursor: "not-allowed",
                  pointerEvents: "none",
                }}
              >
                {roundType || "Practice"}
              </div>
            </label>
          </div>

          {/* Holes */}
          <div className="mb-3">
            <label htmlFor="roundHoles">
              Holes:
              <div
                id="roundHoles"
                className="form-control centered"
                style={{
                  backgroundColor: "#e9ecef",
                  cursor: "not-allowed",
                  pointerEvents: "none",
                }}
              >
                {numHoles || "18"}
              </div>
            </label>
          </div>

          {/* Hole-By-Hole Data */}
          <div className="d-flex flex-column align-items-center mb-3">
            <div className="d-flex align-items-center">
              <input
                type="checkbox"
                className="custom-control-input me-1"
                id="scorecardButtonEnable"
                disabled
                checked={false}
              />
              <label className="custom-control-label me-2" htmlFor="scorecardButtonEnable">
                Hole-By-Hole Data
              </label>
            </div>
            <button type="button" className="btn btn-outline-dark mt-2" disabled={true}>
              <span id="scoreCardDetails" className="fas fa-table"></span>
            </button>
          </div>

          {/* Strokes */}
          <div className="mb-3">
            <label htmlFor="roundStrokes">
              Strokes:
              <div
                id="roundStrokes"
                className="form-control centered"
                style={{
                  backgroundColor: "#e9ecef",
                  cursor: "not-allowed",
                  pointerEvents: "none",
                }}
              >
                {strokes || "80"}
              </div>
            </label>
            <div id="roundStrokesDescr" className="form-text mb-3">
              Enter a strokes value between 9 and 200
            </div>
          </div>

          {/* Strokes to Par - Only show if there's a value */}
          {/* {strokesToPar !== undefined && (
          <div className="centered">
            <h6 style={{ color: strokesToPar < 0 ? "red" : "black" }}>
              Strokes to par: {strokesToPar === 0 ? "EVEN" : strokesToPar}
            </h6>
          </div>
        )} */}

          {/* Time */}
          <div className="mb-3">
            <label htmlFor="roundTime">
              Time:
              <br />
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div
                  id="roundMinutes"
                  className="form-control"
                  style={{
                    backgroundColor: "#e9ecef",
                    cursor: "not-allowed",
                    pointerEvents: "none",
                    textAlign: "right",
                    width: "70px",
                    marginRight: "5px",
                  }}
                >
                  {minutes || "60"}
                </div>
                :
                <div
                  id="roundSeconds"
                  className="form-control"
                  style={{
                    backgroundColor: "#e9ecef",
                    cursor: "not-allowed",
                    pointerEvents: "none",
                    width: "70px",
                    marginLeft: "5px",
                  }}
                >
                  {seconds || "00"}
                </div>
              </div>
            </label>
            <div id="roundTimeDescr" className="form-text">
              Enter a minutes value between 10 and 400, and a seconds value between 0 and 59
            </div>
          </div>

          {/* Time to Par - Only show if there's a value */}
          {/* {timeToPar && timeToPar !== "NaN:NaN" && (
          <div className="centered mb-3">
            <h6 style={{ color: checkTimeToParNegative ? "red" : "black" }}>
              Time to par: {timeToPar}
            </h6>
          </div>
        )} */}

          {/* Speedgolf Score */}
          <div className="mb-3">
            <label htmlFor="roundSGS">
              Speedgolf Score:
              <br />
              <div
                id="roundSGS"
                className="form-control centered"
                style={{
                  backgroundColor: "#e9ecef",
                  cursor: "not-allowed",
                  pointerEvents: "none",
                }}
              >
                {sgsScore || "140:00"}
              </div>
            </label>
          </div>

          {/* Distance */}
          <div className="mb-3">
            <label htmlFor="roundDistance" className="form-label">
              Distance:
              <div
                id="roundDistance"
                className="form-control centered"
                style={{
                  backgroundColor: "#e9ecef",
                  cursor: "not-allowed",
                  pointerEvents: "none",
                }}
              >
                {distanceConversion(distance, userPreferredUnit) || "ND"}
              </div>
            </label>
          </div>

          {/* Distance Unit */}
          <div className="d-flex justify-content-center mb-2">
            Miles
            <div className="form-switch">
              <input
                className="form-check-input centered"
                type="checkbox"
                role="switch"
                // checked={distanceUnit !== "miles"}
                disabled
              />
            </div>
            Kilometers
          </div>

          <div className="mb-3">
            <div id="roundDistanceDescr" className="form-text">
              Enter a distance value (in miles or km) between 0.01 and 62 miles (100 km)
            </div>
          </div>

          {/* Pace - Only show if there's a value */}

          <div className="mb-3">
            <h6 className="centered">Pace: {pace || "NA"}</h6>
          </div>

          {/* Notes */}
          <div className="mb-3">
            <label htmlFor="roundNotes">
              Notes:
              <br />
              <div
                id="roundNotes"
                className="form-control"
                style={{
                  backgroundColor: "#e9ecef",
                  cursor: "not-allowed",
                  pointerEvents: "none",
                  minHeight: "100px",
                  width: "100%", // Makes the box use full available width
                  maxWidth: "800px", // Sets a maximum width for better readability
                  whiteSpace: "pre-wrap",
                  overflowY: "auto", // Adds vertical scrolling if content exceeds height
                  height: "auto", // Height will adjust based on content
                }}
              >
                {notes || ""}
              </div>
            </label>
            <div id="roundNotesDescr" className="form-text">
              Enter optional round notes
            </div>
          </div>

          {/* Private round checkbox - disabled in view mode */}
          <div className="container mt-3 mb-3">
            <div className="form-group text-center">
              <div className="custom-control custom-checkbox">
                <input
                  type="checkbox"
                  className="custom-control-input me-1"
                  id="keepPrivate"
                  disabled
                  checked={keepPrivate || false}
                />
                <label className="custom-control-label" htmlFor="keepPrivate">
                  Keep this round private
                </label>
              </div>
            </div>
          </div>

          <div className="mode-page-btn-container">
            <button
              onClick={() => navigate(-1)}
              className="mode-page-btn-cancel action-dialog cancel-button"
              type="button"
            >
              {/* <span className="fa fa-window-close"></span> */}
              &nbsp;Back
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ViewRound;
