import React, { useState } from "react";

const HoleTimeModal = ({
  playerId,
  holeNum,
  visible,
  onClose,
  holeTimes,
  selectedRound,
  handleHoleTimeChange,
  setSkipHoleTimePrompts,
}) => {
  const [skipHoleTime, setSkipHoleTime] = useState(false);
  const [skipAllHoleTimes, setSkipAllHoleTimes] = useState(false);

  const handleTimeChange = (min, sec) => {
    if (!visible) return;

    const formattedMin = String(Math.max(0, Math.min(59, min || 0))).padStart(2, "0");
    const formattedSec = String(Math.max(0, Math.min(59, sec || 0))).padStart(2, "0");
    const formattedTime = `00:${formattedMin}:${formattedSec}`;
    handleHoleTimeChange(playerId, selectedRound, holeNum, formattedTime);
  };

  const handleSkipHoleTime = () => {
    if (!visible) return;

    if (skipHoleTime) {
      handleHoleTimeChange(playerId, selectedRound, holeNum, null);
    }

    if (skipAllHoleTimes) {
      setSkipHoleTimePrompts(true);
    }

    onClose();
  };

  if (!visible) return null;

  const roundHoleTimes = holeTimes[playerId]?.[selectedRound] || {};
  const currentTime = roundHoleTimes[holeNum] || "00:00:00";
  const [hours, minutes, seconds] = currentTime.split(":").map(part => parseInt(part) || 0);

  return (
    <div className="hole-time-modal">
      <div className="modal-content">
        <div className="modal-header">
          <h3>Time for Hole {holeNum}</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="modal-body">
          <label>Enter time spent on hole:</label>

          <div className="time-inputs-wrapper">
            <div className="time-inputs-row">
              <div className="time-input-field">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={minutes}
                  onChange={e => handleTimeChange(parseInt(e.target.value), seconds)}
                  className="number-input"
                  disabled={skipHoleTime}
                />
                <span className="time-label">min</span>
              </div>
              <div className="time-input-field">
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={seconds}
                  onChange={e => handleTimeChange(minutes, parseInt(e.target.value))}
                  className="number-input"
                  disabled={skipHoleTime}
                />
                <span className="time-label">sec</span>
              </div>
            </div>
          </div>

          <div className="modal-options">
            <label className="skip-option">
              <input type="checkbox" checked={skipHoleTime} onChange={() => setSkipHoleTime(!skipHoleTime)} />
              Skip time entry for this hole
            </label>

            <label className="skip-option">
              <input
                type="checkbox"
                checked={skipAllHoleTimes}
                onChange={() => setSkipAllHoleTimes(!skipAllHoleTimes)}
              />
              Don't prompt for hole times
            </label>
          </div>

          <div className="modal-buttons">
            <button className="modal-btn" onClick={handleSkipHoleTime}>
              {skipHoleTime ? "Skip" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HoleTimeModal;
