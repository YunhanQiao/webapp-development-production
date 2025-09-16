import React, { useState, useEffect } from "react";
import { Modal, Form } from "react-bootstrap";

const AdjustTeeSheetDialog = ({ show, onClose, onAdjust }) => {
  const [adjustment, setAdjustment] = useState({ hours: 0, minutes: 0 });
  const [direction, setDirection] = useState("later");

  useEffect(() => {
    if (show) {
      setAdjustment({ hours: 0, minutes: 0 });
      setDirection("later");
    }
  }, [show]);

  const handleAdjust = () => {
    const totalMinutes = (adjustment.hours * 60 + adjustment.minutes) * (direction === "earlier" ? -1 : 1);
    onAdjust(totalMinutes);

    setAdjustment({ hours: 0, minutes: 0 });
    setDirection("later");

    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Adjust Tee Sheet Times</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form>
          <Form.Group className="mb-4">
            <Form.Label className="mb-3">Adjust times:</Form.Label>
            <div className="d-flex gap-3 align-items-center mb-3">
              <Form.Select value={direction} onChange={e => setDirection(e.target.value)} style={{ width: "130px" }}>
                <option value="later">Move later</option>
                <option value="earlier">Move earlier</option>
              </Form.Select>
              <span>by:</span>
            </div>

            <div className="d-flex align-items-center gap-3">
              <Form.Control
                type="number"
                min="0"
                max="23"
                value={adjustment.hours}
                onChange={e => setAdjustment({ ...adjustment, hours: parseInt(e.target.value) || 0 })}
                style={{ width: "80px" }}
              />
              <span>hours</span>
              <Form.Control
                type="number"
                min="0"
                max="59"
                value={adjustment.minutes}
                onChange={e => setAdjustment({ ...adjustment, minutes: parseInt(e.target.value) || 0 })}
                style={{ width: "80px" }}
              />
              <span>minutes</span>
            </div>
          </Form.Group>

          <div className="text-muted mt-3">
            This will move all tee times {direction} by {adjustment.hours} hours and {adjustment.minutes} minutes
          </div>
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <button className="btn btn-secondary" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary"
          onClick={handleAdjust}
          disabled={adjustment.hours === 0 && adjustment.minutes === 0}
          style={{ backgroundColor: "#13294E" }}
        >
          Adjust Times
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default AdjustTeeSheetDialog;
