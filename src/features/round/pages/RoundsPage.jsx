import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

import { fetchAllRoundsAction, roundsSelector } from "features/round";
import { isUserAuthenticated, userPreferencesSelector } from "features/user";
import { searchRounds, sortRounds } from "../../../services/roundsServices";

import { RoundsTable, RoundsSearch, RoundsToast } from "../components";

const Rounds = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isAuthenticated = useSelector(isUserAuthenticated);
  const userPreferences = useSelector(userPreferencesSelector);
  const rounds = useSelector(roundsSelector);

  const [searchTerm, setSearchTerm] = useState("");
  const [filteredRounds, setFilteredRounds] = useState(rounds);
  // State to keep track of sorting configuration
  const [sortConfig, setSortConfig] = useState({
    columnName: null,
    direction: "none",
  });

  const distanceUnit = useMemo(() => {
    try {
      return userPreferences?.preferredUnits === "imperial" ? "miles" : "km";
    } catch (e) {
      return "mi";
    }
  }, [userPreferences?.preferredUnits]);

  const handleNewRoundClick = () => navigate("/rounds/newRound");

  const handleSearchChange = e => setSearchTerm(e.target.value);

  const handleSort = columnName => {
    let direction = "ascending";
    if (sortConfig.columnName === columnName && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ columnName, direction });
  };

  // Fetch all rounds at first render
  useEffect(() => {
    dispatch(fetchAllRoundsAction(navigate));
  }, []);

  // Filter/sort if the searchTerm/sortConfig changed
  useEffect(() => {
    const roundsToUpdate = searchTerm ? searchRounds(rounds, searchTerm, distanceUnit) : rounds;
    const sortedRounds = sortRounds(roundsToUpdate, sortConfig.columnName, sortConfig.direction);
    setFilteredRounds(sortedRounds);
  }, [searchTerm, rounds, sortConfig]);

  return (
    <>
      {isAuthenticated ? (
        <div id="roundsModeTab" className="mode-page" role="tabpanel" aria-label="Rounds Tab" tabIndex="0">
          <h1 className="mode-page-header">Rounds</h1>
          <RoundsSearch value={searchTerm} onChange={handleSearchChange} />
          <RoundsToast />
          <RoundsTable
            distanceUnit={distanceUnit}
            filteredRounds={filteredRounds}
            handleSort={handleSort}
            roundsLength={rounds.length}
            sortConfig={sortConfig}
          />
          <button id="roundsModeActionBtn" type="button" className="float-btn" onClick={handleNewRoundClick}>
            <span className="fas fa-calendar-plus fa-fw" aria-hidden="true" />
            New Round
          </button>
        </div>
      ) : (
        <h1>Loading</h1>
      )}
    </>
  );
};

export default Rounds;
