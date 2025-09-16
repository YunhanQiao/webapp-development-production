import { useNavigate } from "react-router-dom";
import { memo } from "react";

import { NoRoundsMessage, RoundsTableHeader, RoundsTableRow } from "./";

const columns = ["date", "course", "strokes", "time", "SGS", "distance", "pace"];

function RoundsTable({ distanceUnit, filteredRounds, handleSort, roundsLength, sortConfig }) {
  const navigate = useNavigate();

  const handleRoundEdit = id => navigate(`/rounds/editRound/${id}`);

  const getSortIconClass = colName => {
    const defaultIcon = "fa-sort";

    if (sortConfig.columnName !== colName) {
      return defaultIcon;
    }

    if (sortConfig.direction === "ascending") {
      return "fa-sort-amount-up";
    }

    if (sortConfig.direction === "descending") {
      return "fa-sort-amount-down";
    }

    return defaultIcon;
  };

  return (
    <table id="roundsTable" className="table table-hover">
      <thead className="table-light">
        {columns.map(colName => (
          <RoundsTableHeader
            key={colName}
            name={colName}
            onClick={() => handleSort(colName)}
            sortIconClass={getSortIconClass(colName)}
          />
        ))}
      </thead>
      <tbody>
        {filteredRounds.length === 0 ? (
          <NoRoundsMessage />
        ) : (
          filteredRounds.map(round => (
            <RoundsTableRow key={round._id} distanceUnit={distanceUnit} onClick={handleRoundEdit} round={round} />
          ))
        )}
      </tbody>
      <caption id="roundsTableCaption" aria-live="polite">
        Displaying {filteredRounds.length} of {roundsLength} speedgolf rounds
      </caption>
    </table>
  );
}

export default memo(RoundsTable);
