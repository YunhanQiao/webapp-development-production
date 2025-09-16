import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import { Modal, Button } from "react-bootstrap";
import "flag-icon-css/css/flag-icons.min.css";
import { fetchCourseByIds } from "features/course/courseActions";
import TournamentScoresPage from "./TournamentScoresPage";

// Custom CSS for modal
const customModalStyles = `
  .modal-90w {
    max-width: 90vw !important;
  }
  .modal-90w .modal-content {
    max-height: 80vh !important;
  }
  .modal-90w .modal-body {
    max-height: 65vh !important;
    overflow: auto !important;
    padding: 12px !important;
  }
`;

// Inject styles if they don't exist
if (typeof document !== "undefined" && !document.getElementById("modal-styles")) {
  const styleElement = document.createElement("style");
  styleElement.id = "modal-styles";
  styleElement.textContent = customModalStyles;
  document.head.appendChild(styleElement);
}

const PlayerScorecardModal = ({ player, tournament, selectedDivision, fullCoursesData, show, onHide }) => {
  const dispatch = useDispatch();

  useEffect(() => {
    if (tournament && show) {
      const courseIds = tournament.courses.map(course => course.courseId);
      dispatch(fetchCourseByIds(courseIds));
    }
  }, [tournament, show, dispatch]);

  if (!player || !tournament) return null;

  const getThemeColors = () => {
    return {
      updateBtnBg: tournament.colorTheme.updateBtnBg || "#13294E",
      updateBtnTxt: tournament.colorTheme.updateBtnTxt || "#FFFFFF",
      tournNameBannerBg: tournament.colorTheme.tournNameBannerBg || "#13294E",
      tournNameBannerTxt: tournament.colorTheme.tournNameBannerTxt || "#FFFFFF",
    };
  };

  const themeColors = getThemeColors();

  const modalStyles = {
    bannerStyle: {
      backgroundColor: themeColors.tournNameBannerBg,
      color: themeColors.tournNameBannerTxt,
      borderBottom: "none",
    },
    closeButton: {
      backgroundColor: themeColors.updateBtnBg,
      color: themeColors.updateBtnTxt,
      borderColor: themeColors.updateBtnBg,
    },
  };

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      dialogClassName="modal-90w"
      className="scorecard-modal"
      style={{ zIndex: 1050 }}
    >
      <Modal.Header style={modalStyles.bannerStyle}>
        <Modal.Title style={{ color: "#FFFFFF", width: "100%" }}>
          <div className="d-flex align-items-center justify-content-between w-100">
            <div className="d-flex align-items-center">
              {player.profilePic && (
                <img
                  src={player.profilePic}
                  alt={`${player.playerName} profile`}
                  className="rounded-circle me-2"
                  style={{
                    width: "32px",
                    height: "32px",
                    objectFit: "cover",
                  }}
                  onError={e => {
                    e.target.style.display = "none";
                  }}
                />
              )}
              {player.playerName}
              {player.homeCountry && (
                <span
                  className={`flag-icon flag-icon-${player.homeCountry.toLowerCase()} ms-3`}
                  title={player.homeCountry}
                  style={{ marginLeft: "8px", marginRight: "8px" }}
                />
              )}
              – {tournament.basicInfo.startDate ? new Date(tournament.basicInfo.startDate).getFullYear() : ""}{" "}
              {tournament.basicInfo.name}
            </div>
            <div className="d-flex align-items-center">
              <button
                type="button"
                className="btn-close btn-close-white"
                aria-label="Close"
                onClick={onHide}
                style={{ fontSize: "1rem" }}
              ></button>
            </div>
          </div>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body
        className="p-3"
        style={{
          maxHeight: "65vh",
          position: "relative",
        }}
      >
        <TournamentScoresPage finalResults={true} playerId={player.userId} fullCoursesData={fullCoursesData} />
      </Modal.Body>
      <Modal.Footer>
        <Button style={modalStyles.closeButton} onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default PlayerScorecardModal;
