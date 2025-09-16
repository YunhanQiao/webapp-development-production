import React from "react";

const PlayerScoreRow = ({
  player,
  roundScores,
  roundHoleTimes,
  startTime,
  finishTime,
  holes,
  selectedRound,
  showHoleTimes,
  getHolePar,
  getScoreClass,
  handleScoreChange,
  handleScoreClick,
  handleStartTimeChange,
  handleFinishTimeChange,
  convertTo24Hour,
  calculateOut,
  calculateIn,
  calculateOutPar,
  calculateInPar,
  calculateTotalPar,
  formatToPar,
  calculateTimeFromFinishAndStart,
  calculateSGS,
  isFullRound,
  isFrontNine,
  isBackNine,
  showOutColumn,
  showInColumn,
  currentRound,
  isSaveEnabled,
  savedPlayers,
  handleSaveScores,
}) => {
  const out = calculateOut(roundScores);
  const inScore = calculateIn(roundScores);
  let total = 0;
  if (isFullRound) {
    total = out + inScore;
  } else if (isFrontNine) {
    total = out;
  } else if (isBackNine) {
    total = inScore;
  }

  const elapsedTime = calculateTimeFromFinishAndStart(startTime, finishTime);
  const sgs = calculateSGS(total, elapsedTime);

  return (
    <tr>
      <td className="p-2 border">{player.playerName}</td>
      <td className="p-2 border">{player.divisionName}</td>
      <td className="p-2 border">
        <input
          type="time"
          step="1"
          className="w-full p-1 text-center"
          value={startTime !== "--:--" ? convertTo24Hour(startTime) : ""}
          onChange={e => handleStartTimeChange(player.userId, selectedRound, e.target.value)}
        />
      </td>
      <td className="p-2 border">
        <input
          type="time"
          step="1"
          className="w-full p-1 text-center"
          value={finishTime !== "--:--" ? convertTo24Hour(finishTime) : ""}
          onChange={e => handleFinishTimeChange(player.userId, selectedRound, e.target.value)}
        />
      </td>

      {(isFrontNine || isFullRound) &&
        holes.slice(0, 9).map(holeNum => (
          <td key={holeNum} className="p-2 border">
            <input
              type="number"
              min="1"
              max="99"
              className={`${getScoreClass(getHolePar(holeNum, currentRound), roundScores[holeNum], holeNum)} ${
                roundHoleTimes[holeNum] ? "with-time" : ""
              }`}
              value={roundScores[holeNum] || ""}
              onChange={e => handleScoreChange(player.userId, selectedRound, holeNum, e.target.value)}
              onClick={() => handleScoreClick(player.userId, holeNum)}
            />
            {showHoleTimes && roundHoleTimes[holeNum] && (
              <div className="hole-time-display">{roundHoleTimes[holeNum]}</div>
            )}
          </td>
        ))}

      {isBackNine &&
        holes.map(holeNum => (
          <td key={holeNum} className="p-2 border">
            <input
              type="number"
              min="1"
              max="99"
              className={`${getScoreClass(getHolePar(holeNum, currentRound), roundScores[holeNum], holeNum)} ${
                roundHoleTimes[holeNum] ? "with-time" : ""
              }`}
              value={roundScores[holeNum] || ""}
              onChange={e => handleScoreChange(player.userId, selectedRound, holeNum, e.target.value)}
              onClick={() => handleScoreClick(player.userId, holeNum)}
            />
            {showHoleTimes && roundHoleTimes[holeNum] && (
              <div className="hole-time-display">{roundHoleTimes[holeNum]}</div>
            )}
          </td>
        ))}

      {showOutColumn && <td className="p-2 border text-center font-bold">{formatToPar(out, calculateOutPar())}</td>}

      {isFullRound &&
        holes.slice(9).map(holeNum => (
          <td key={holeNum} className="p-2 border">
            <input
              type="number"
              min="1"
              max="99"
              className={`${getScoreClass(getHolePar(holeNum, currentRound), roundScores[holeNum], holeNum)} ${
                roundHoleTimes[holeNum] ? "with-time" : ""
              }`}
              value={roundScores[holeNum] || ""}
              onChange={e => handleScoreChange(player.userId, selectedRound, holeNum, e.target.value)}
              onClick={() => handleScoreClick(player.userId, holeNum)}
            />
            {showHoleTimes && roundHoleTimes[holeNum] && (
              <div className="hole-time-display">{roundHoleTimes[holeNum]}</div>
            )}
          </td>
        ))}

      {showInColumn && <td className="p-2 border text-center font-bold">{formatToPar(inScore, calculateInPar())}</td>}

      <td className="p-2 border text-center font-bold">{formatToPar(total, calculateTotalPar())}</td>
      <td className="p-2 border text-center">{elapsedTime}</td>
      <td className="p-2 border text-center">{sgs}</td>

      <td className="p-2 border">
        <button
          className={`btn btn-sm ${
            savedPlayers[player.userId]?.[selectedRound]
              ? "btn-success"
              : isSaveEnabled(player.userId)
                ? "btn-primary"
                : "btn-secondary disabled"
          }`}
          onClick={() => handleSaveScores(player)}
          disabled={!isSaveEnabled(player.userId) || savedPlayers[player.userId]?.[selectedRound]}
        >
          {savedPlayers[player.userId]?.[selectedRound] ? "Saved" : "Save"}
        </button>
      </td>
    </tr>
  );
};

export default PlayerScoreRow;
