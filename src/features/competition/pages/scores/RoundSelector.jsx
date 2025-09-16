import React from "react";
import ScoreControlsBar from "./ScoreControlsBar";

const RoundSelector = ({
  currentDivision,
  selectedRound,
  onRoundChange,
  units,
  onUnitsChange,
  holeTimeMode,
  onHoleTimeModeChange,
  hasExistingHoleTimeData = false,
  hasUnsavedHoleTimeData = false,
  onClearUnsavedHoleTimeData = null,
  establishedTimeEntryMethod = null,
  finalResults = false,
}) => {
  if (!currentDivision?.rounds?.length) return null;

  return (
    <div className="mb-3">
      {/* Top row: Round selector buttons */}
      <div className="d-flex" style={{ marginBottom: "8px" }}>
        {currentDivision.rounds.map((_, index) => {
          const roundKey = `R${index + 1}`;
          const isSelected = selectedRound === roundKey;

          return (
            <button
              key={roundKey}
              onClick={() => onRoundChange(roundKey)}
              className={`
                px-4 py-1 
                ${
                  isSelected
                    ? "bg-white border-t border-l border-r border-gray-300"
                    : "bg-gray-100 border border-gray-300"
                } 
                ${index === 0 ? "rounded-tl-md" : ""} 
                ${index === currentDivision.rounds.length - 1 ? "rounded-tr-md" : ""}
                ${isSelected ? "text-black" : "text-gray-600"}
                focus:outline-none
              `}
              style={{
                marginBottom: isSelected ? "-1px" : "0",
                borderBottom: isSelected ? "none" : "1px solid #1852c5",
                position: "relative",
                zIndex: isSelected ? "1" : "0",
              }}
            >
              Round {index + 1}
            </button>
          );
        })}
      </div>

      {/* Bottom row: Controls */}
      <ScoreControlsBar
        holeTimeMode={holeTimeMode}
        onHoleTimeModeChange={onHoleTimeModeChange}
        hasExistingHoleTimeData={hasExistingHoleTimeData}
        hasUnsavedHoleTimeData={hasUnsavedHoleTimeData}
        onClearUnsavedHoleTimeData={onClearUnsavedHoleTimeData}
        establishedTimeEntryMethod={establishedTimeEntryMethod}
        finalResults={finalResults}
      />
    </div>
  );
};

export default RoundSelector;
