import React, { useState, useEffect, useCallback } from "react";
import { Modal, Form } from "react-bootstrap";
import "../../../../styles/components/modals.css";

const GenerateDialog = ({ show, onClose, tournament, onGenerate }) => {
  const [sortBy, setSortBy] = useState("Combined");
  const [sortOrder, setSortOrder] = useState("ascending"); // "ascending" or "descending"
  const [interval, setInterval] = useState({ minutes: 5, seconds: 0 });
  const [consecutiveDivisions, setConsecutiveDivisions] = useState(true);
  const [selectedDate, setSelectedDate] = useState("");

  const [divisionOrder, setDivisionOrder] = useState(
    tournament?.divisions?.map(d => ({ id: d._id, name: d.name })) || [],
  );

  // Get all available tournament dates
  const getAllDates = () => {
    const dates = new Set();
    tournament?.divisions?.forEach(division => {
      division.rounds?.forEach(round => {
        if (round.date) {
          dates.add(round.date);
        }
      });
    });
    return Array.from(dates).sort();
  };

  const availableDates = getAllDates();

  // Check if previous round finish time option should be available
  const isPreviousRoundFinishTimeAvailable = useCallback(() => {
    if (!selectedDate || !availableDates || availableDates.length === 0) {
      return false;
    }

    // Check if selected date is not the first date
    const sortedDates = [...availableDates].sort();
    const selectedDateIndex = sortedDates.indexOf(selectedDate);

    if (selectedDateIndex <= 0) {
      return false;
    }

    // Get the previous date
    const previousDate = sortedDates[selectedDateIndex - 1];

    // Check if there are any complete rounds from the previous date
    let hasCompleteRounds = false;

    if (tournament?.players) {
      // Get the previous round ID from divisions
      let previousRoundId = null;
      if (tournament.divisions) {
        for (const division of tournament.divisions) {
          if (division.rounds) {
            const previousRound = division.rounds.find(round => round.date === previousDate);
            if (previousRound) {
              previousRoundId = previousRound._id;
              break;
            }
          }
        }
      }

      for (const player of tournament.players) {
        // Check if player has scoreCards for the previous round
        if (player.scoreCards && previousRoundId) {
          const previousScoreCard = player.scoreCards.find(sc => sc.roundId === previousRoundId);

          if (previousScoreCard && previousScoreCard.totalTime && previousScoreCard.totalTime !== "--:--") {
            hasCompleteRounds = true;
            break;
          }
        }
      }
    }

    return hasCompleteRounds;
  }, [selectedDate, availableDates, tournament]);

  // Set default selected date to first available date
  useEffect(() => {
    if (availableDates.length > 0 && !selectedDate) {
      setSelectedDate(availableDates[0]);
    }
  }, [availableDates, selectedDate]);

  // Format date for display
  const formatDateForDisplay = dateString => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <Modal show={show} onHide={onClose} size="md" className="mobile-friendly-modal">
      <Modal.Header closeButton className="mobile-modal-header">
        <Modal.Title>Generate Tee Times</Modal.Title>
      </Modal.Header>
      <Modal.Body className="mobile-modal-body">
        {/* Content will be scrollable */}
        <Form>
          <Form.Group className="mb-3">
            <Form.Label>Tournament Date:</Form.Label>
            <Form.Select value={selectedDate} onChange={e => setSelectedDate(e.target.value)} required>
              {availableDates.map(date => (
                <option key={date} value={date}>
                  {formatDateForDisplay(date)}
                </option>
              ))}
            </Form.Select>
            <Form.Text className="text-muted">
              Tee times will be generated for the selected tournament date only.
            </Form.Text>
          </Form.Group>

          <div className="alert alert-warning mb-3">
            <strong>⚠️ Warning:</strong> This will overwrite any existing tee times for the selected date. All players
            will receive new tee times based on the settings below.
          </div>

          <Form.Group className="mb-3">
            <Form.Label>Order players by:</Form.Label>
            <Form.Select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="Combined">Avg. Golf Score + 5K Running Time</option>
              <option value="5K Running Time">5K Running Time</option>
              <option value="Avg Golf Score">Avg Golf Score</option>
              {isPreviousRoundFinishTimeAvailable() && (
                <option value="Previous Round Finish Time">Previous Round Finish Time</option>
              )}
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Sort Order:</Form.Label>
            <div className="mt-2">
              <Form.Check
                type="radio"
                id="ascending"
                name="sortOrder"
                label="Ascending order (better players first)"
                checked={sortOrder === "ascending"}
                onChange={() => setSortOrder("ascending")}
                className="mb-2"
              />
              <Form.Check
                type="radio"
                id="descending"
                name="sortOrder"
                label="Descending order (worse players first)"
                checked={sortOrder === "descending"}
                onChange={() => setSortOrder("descending")}
              />
            </div>
          </Form.Group>

          <Form.Group className="mb-3 d-flex align-items-center flex-wrap">
            <Form.Label className="me-2 mb-2 mb-md-0">Tee Time Interval:</Form.Label>
            <div className="d-flex align-items-center flex-wrap">
              <Form.Control
                type="number"
                min="1"
                max="60"
                value={interval.minutes || 5}
                onChange={e => setInterval({ ...interval, minutes: parseInt(e.target.value) || 5 })}
                style={{ width: "70px", fontSize: "16px" }} // fontSize prevents zoom on iOS
                className="me-2 mb-2 mb-md-0"
              />
              <span className="me-2 mb-2 mb-md-0">Minutes</span>
              <Form.Control
                type="number"
                min="0"
                max="59"
                value={interval.seconds || 0}
                onChange={e => setInterval({ ...interval, seconds: parseInt(e.target.value) || 0 })}
                style={{ width: "70px", fontSize: "16px" }} // fontSize prevents zoom on iOS
                className="me-2 mb-2 mb-md-0"
              />
              <span className="mb-2 mb-md-0">Seconds</span>
            </div>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Check
              type="checkbox"
              label="Have all players in the same division tee off consecutively"
              checked={consecutiveDivisions}
              onChange={e => setConsecutiveDivisions(e.target.checked)}
            />
          </Form.Group>

          {consecutiveDivisions && (
            <Form.Group className="mb-3">
              <Form.Label>Division Tee-off Order:</Form.Label>
              <div className="border p-2 mobile-drag-container">
                {divisionOrder.map((division, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={e => e.dataTransfer.setData("index", index)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => {
                      e.preventDefault();
                      const fromIndex = Number(e.dataTransfer.getData("index"));
                      const toIndex = index;

                      const newOrder = [...divisionOrder];
                      const [movedItem] = newOrder.splice(fromIndex, 1);
                      newOrder.splice(toIndex, 0, movedItem);

                      setDivisionOrder(newOrder);
                    }}
                    className="p-3 mb-2 bg-light border rounded mobile-drag-item"
                    style={{
                      cursor: "move",
                      userSelect: "none",
                      minHeight: "48px", // Touch-friendly minimum height
                      display: "flex",
                      alignItems: "center",
                      fontSize: "16px", // Prevent zoom on iOS
                    }}
                  >
                    <span className="me-2">≡</span> {/* Drag handle indicator */}
                    {division.name}
                  </div>
                ))}
              </div>
              <Form.Text className="text-muted">
                Drag to reorder division tee-off order. First division tees off first.
              </Form.Text>
            </Form.Group>
          )}
        </Form>

        <div className="text-muted mt-3 small">Note: You can edit tee times by hand after they are generated</div>
      </Modal.Body>
      <Modal.Footer className="mobile-modal-footer">
        <button className="btn btn-secondary mobile-btn" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-primary mobile-btn"
          onClick={() => {
            // Calculate the previous date for finish time sorting
            const sortedDates = [...availableDates].sort();
            const selectedDateIndex = sortedDates.indexOf(selectedDate);
            const previousDate = selectedDateIndex > 0 ? sortedDates[selectedDateIndex - 1] : null;

            const settings = {
              sortBy,
              sortOrder, // Pass the sort order (ascending/descending)
              interval,
              consecutiveDivisions,
              divisionOrder: divisionOrder.map(d => d.name),
              divisionOrderIds: divisionOrder.map(d => d.id),
              selectedDate, // Pass the selected date
              previousDate, // Pass the previous date for finish time sorting
            };

            onGenerate(settings);
            onClose();
          }}
          style={{ backgroundColor: "#13294E", fontSize: "16px" }} // fontSize prevents zoom
          disabled={!selectedDate}
        >
          Generate
        </button>
      </Modal.Footer>
    </Modal>
  );
};

export default GenerateDialog;
