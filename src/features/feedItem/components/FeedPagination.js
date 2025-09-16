import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const FeedPagination = ({ currentPage, totalPages }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const userState = useSelector(state => state.user);
  const user = userState.user;
  const userId = user._id;
  const jwtToken = userState.tokens.jwtToken;

  const updateQueryParams = page => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set("page", page);
    navigate(`${location.pathname}?${searchParams.toString()}`);
  };

  return (
    <div className="pagination">
      <span>
        &nbsp; &nbsp; Page {currentPage} of {totalPages} &nbsp; &nbsp;
      </span>
      <button disabled={currentPage === 1} onClick={() => updateQueryParams(currentPage - 1)}>
        Previous
      </button>
      <button disabled={currentPage === totalPages} onClick={() => updateQueryParams(currentPage + 1)}>
        Next
      </button>
    </div>
  );
};

export default FeedPagination;
