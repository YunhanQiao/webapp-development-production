import React, { useEffect } from "react";
import { Modal, Button, Table } from "react-bootstrap";
import "../../../styles/features/competition/moreInfoModal.css";

const TournamentMoreInfoModal = ({ show, onHide, tournament }) => {
  const { basicInfo, divisions, regPaymentInfo, courses } = tournament || {};

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

  useEffect(() => {
    if (tournament) {
      console.log("Tournament Info:", tournament);
    }
  }, [tournament]);

  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Modal show={show} onHide={onHide} size="lg" className="more-info-modal">
      <Modal.Header closeButton>
        <Modal.Title>{basicInfo?.name}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="comp-label-info-container">
          <div className="label">Host:</div>
          <div className="info">
            {basicInfo?.tournamentCreatorName} ({basicInfo?.tournamentCreatorEmail})
          </div>
        </div>

        <div className="comp-label-info-container">
          <div className="label">Courses:</div>
          <div className="info">
            {courses?.length > 0
              ? courses.map((course, index) => (
                  <div key={course.courseId} className={index > 0 ? "mt-2" : ""}>
                    <strong>Course {index + 1}:</strong> {course.name.split(",")[0]}
                    <br />
                    <strong>Address:</strong> {course.location || "No address available"}
                  </div>
                ))
              : "No course information available"}
          </div>
        </div>

        <div className="comp-label-info-container">
          <div className="label">
            <span>Registration</span>
            <br />
            <span>Timeline:</span>
          </div>
          <div className="info">
            {regPaymentInfo?.regStartDate && regPaymentInfo?.regEndDate ? (
              <>
                Start: {dateFormatter.format(new Date(regPaymentInfo.regStartDate))}
                <br />
                End: {dateFormatter.format(new Date(regPaymentInfo.regEndDate))}
              </>
            ) : (
              "No registration period available"
            )}
          </div>
        </div>

        <div className="comp-label-info-container">
          <div className="label">
            <span>Tournament</span>
            <br />
            <span>Dates:</span>
          </div>
          <div className="info">
            {basicInfo?.startDate && basicInfo?.endDate ? (
              <>
                Start: {dateFormatter.format(new Date(basicInfo.startDate))}
                <br />
                End: {dateFormatter.format(new Date(basicInfo.endDate))}
              </>
            ) : (
              "No dates available"
            )}
          </div>
        </div>

        <div className="comp-label-info-container">
          <div className="label">
            <span>Divisions &</span>
            <br />
            <span>Entry Fees:</span>
          </div>
          <div className="info">
            <Table bordered>
              <thead>
                <tr>
                  {divisions?.length > 0 ? (
                    divisions.map((division, index) => <th key={index}>{division.name}</th>)
                  ) : (
                    <th>No divisions available</th>
                  )}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {divisions?.length > 0 ? (
                    divisions.map((division, index) => (
                      <td key={index}>
                        Age: {division.minAge} - {division.maxAge} <br />
                        Fee: ${division.entryFee}
                      </td>
                    ))
                  ) : (
                    <td>No data available</td>
                  )}
                </tr>
              </tbody>
            </Table>
          </div>
        </div>

        <div className="comp-label-info-container">
          <div className="label">Rules:</div>
          <div className="info">
            {basicInfo?.rules ? (
              <a href={basicInfo.rules} target="_blank" rel="noopener noreferrer">
                View Tournament Rules Here
              </a>
            ) : (
              "No rules available for this tournament."
            )}
          </div>
        </div>

        <div className="comp-label-info-container">
          <div className="label">Prizes:</div>
          <div className="info">
            {basicInfo?.prizeDoc ? (
              <a href={basicInfo.prizeDoc} target="_blank" rel="noopener noreferrer">
                Prize Info ({getDocumentType(basicInfo.prizeDoc)})
              </a>
            ) : (
              basicInfo?.prizeText || "No prize information available."
            )}
          </div>
        </div>
        <div className="comp-label-info-container">
          <div className="label">Additional Info:</div>
          <div className="info">
            {basicInfo?.additionalInfoDoc ? (
              <a href={basicInfo.additionalInfoDoc} target="_blank" rel="noopener noreferrer">
                View Additional Information Here
              </a>
            ) : (
              basicInfo?.additionalInfoText || "No additional information available."
            )}
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer className="modal-footer-custom">
        <Button className="mode-page-btn action-dialog action-button custom-ok-button" onClick={onHide}>
          OK
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default TournamentMoreInfoModal;
