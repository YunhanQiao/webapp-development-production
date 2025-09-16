import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUsers, fetchBuddyDetails } from "../buddiesActions";
import DefaultProfilePic from "../../../images/DefaultProfilePic.jpg";
import { clearSelectedBuddy, clearSearchResults } from "../buddiesSlice";
import BuddyDetailsModal from "./BuddyDetailsModal";

//Below code keyboard navigation
function BuddiesModeSearch() {
  const [searchTerm, setSearchTerm] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selectedBuddy, setSelectedBuddy] = useState(null);
  const dispatch = useDispatch();
  const searchResults = useSelector(state => state.buddies.searchResults) || [];
  const jwtToken = useSelector(state => state.user.tokens.jwtToken);
  const buddyDetails = useSelector(state => state.buddies.buddyDetails);
  const currentUserId = useSelector(state => state.user.user._id);

  useEffect(() => {
    if (searchTerm.trim() !== "") {
      const timer = setTimeout(() => {
        dispatch(fetchUsers(searchTerm, jwtToken));
      }, 500);
      return () => clearTimeout(timer);
    } else {
      dispatch(clearSearchResults());
    }
  }, [searchTerm, dispatch, jwtToken]);

  // Update selectedBuddy based on keyboard navigation
  useEffect(() => {
    if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
      setSelectedBuddy(searchResults[highlightedIndex]);
    }
  }, [highlightedIndex, searchResults]);

  const handleResultClick = buddy => {
    if (buddy) {
      console.log("Selected buddy:", buddy);
      // Update search box with selected buddy's name
      setSearchTerm(`${buddy.firstName} ${buddy.lastName}`);
      dispatch(fetchBuddyDetails(buddy._id, jwtToken));
      // Do not clear the search term here; let the modal open.
      setSearchTerm("");
      dispatch(clearSearchResults());
    } else {
      console.error("Buddy is undefined");
    }
  };

  useEffect(() => {
    const handleKeyDown = event => {
      if (event.key === "ArrowDown") {
        setHighlightedIndex(prevIndex => (prevIndex + 1) % searchResults.length);
      } else if (event.key === "ArrowUp") {
        setHighlightedIndex(prevIndex => (prevIndex - 1 + searchResults.length) % searchResults.length);
      } else if (event.key === "Enter") {
        if (highlightedIndex >= 0 && highlightedIndex < searchResults.length) {
          handleResultClick(searchResults[highlightedIndex]);
        } else {
          console.error("Invalid highlighted index");
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [highlightedIndex, searchResults, jwtToken]);

  const handleSearchBoxChange = event => {
    setSearchTerm(event.target.value);
    setHighlightedIndex(-1);
  };

  const handleCloseModal = () => {
    dispatch(clearSelectedBuddy());
    dispatch(clearSearchResults());
    setSearchTerm("");
  };

  const getHighlightedText = (text, highlight) => {
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return (
      <span>
        {parts.map((part, i) => (
          <span key={i} style={part.toLowerCase() === highlight.toLowerCase() ? { fontWeight: "bold" } : {}}>
            {part}
          </span>
        ))}
      </span>
    );
  };

  return (
    <div className="container d-flex flex-column align-items-center position-relative">
      <div className="d-flex align-items-center justify-content-center" style={{ width: "100%" }}>
        <label className="form-label" htmlFor="searchBox">
          {" "}
          Search:&nbsp;
        </label>
        <div className="w-50">
          <input
            className="form-control"
            id="searchBox"
            aria-label="Search for Buddies"
            type="search"
            value={searchTerm}
            onChange={handleSearchBoxChange}
            placeholder="Search by first name... "
            style={{
              flexGrow: 1,
              border: "2px lightrgb(77, 125, 177)",
              borderRadius: "4px",
            }}
          />
        </div>

        {searchTerm && (
          <div
            className="search-results position-absolute bg-white w-50"
            style={{
              border: "1px solid #ddd",
              borderRadius: "5px",
              boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.1)",
              zIndex: 1000,
              maxHeight: "200px",
              overflowY: "auto",
              top: "100%",
              marginTop: "10px",
              width: "75%",
              left: "27%",
            }}
          >
            {searchResults.length > 0 ? (
              searchResults
                .filter(buddy => buddy._id !== currentUserId)
                .map((buddy, index) => (
                  <div
                    key={buddy._id}
                    className={`search-result-item d-flex align-items-center p-2 ${highlightedIndex === index ? "bg-light" : ""}`}
                    style={{ cursor: "pointer", borderBottom: "1px solid #eee" }}
                    onClick={() => handleResultClick(buddy)}
                  >
                    <img
                      src={buddy.profilePic || DefaultProfilePic}
                      alt="Profile"
                      style={{ width: "30px", height: "30px", borderRadius: "50%", marginRight: "10px" }}
                    />
                    <span>{getHighlightedText(`${buddy.firstName} ${buddy.lastName}`, searchTerm)}</span>
                  </div>
                ))
            ) : (
              <p className="text-center text-muted p-2 mb-0">No buddies found matching your search.</p>
            )}
          </div>
        )}
      </div>
      {buddyDetails && <BuddyDetailsModal buddy={buddyDetails} onClose={handleCloseModal} />}
    </div>
  );
}

export default BuddiesModeSearch;
