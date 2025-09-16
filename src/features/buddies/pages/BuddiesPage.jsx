import PageUnderConstruction from "../../shared/PageUnderConstruction/PageUnderConstruction";
import BuddiesPendingTable from "../BuddiesComponents/BuddiesPendingTable";
import BuddiesCurrentTable from "../BuddiesComponents/BuddiesCurrentTable";
//import BuddiesModeSearch from "../BuddiesComponents/BuddiesSearchBar";
import BuddiesModeSearch from "../BuddiesComponents/BuddiesModeSearch";
import BuddyDetailsModal from "../BuddiesComponents/BuddyDetailsModal";

import { clearBuddyDetails } from "../buddiesSlice";

import {
  fetchCurrentBuddies,
  fetchIncomingBuddyRequests,
  fetchOutgoingBuddyRequests,
  fetchBuddyDetails,
} from "../buddiesActions";
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import User from "models/user.model";
import { getUser } from "features/user/userServices";
import { useNavigate } from "react-router-dom";

// export default Buddies;

// Main Buddies Table
function Buddies() {
  //Reference code from manage account page
  const navigate = useNavigate();
  // const { user, setUser } = useUserContext();
  const userState = useSelector(state => state.user);
  const user = userState.user;
  const dispatch = useDispatch();
  // let userAuthenticated = user?.accountInfo?.authenticated || false;
  let userAuthenticated = userState.authenticated;
  const userId = user._id;
  const jwtToken = userState.tokens.jwtToken;
  const loadingState = user.isLoading;

  let storedUser = null;
  if (userAuthenticated) {
    storedUser = JSON.parse(localStorage.getItem(user.accountInfo.email));
  }
  console.log(storedUser);

  const currentBuddies = useSelector(state => state.buddies.currentBuddies);
  const incomingBuddyRequests = useSelector(state => state.buddies.incomingBuddyRequests);
  const outgoingBuddyRequests = useSelector(state => state.buddies.outgoingBuddyRequests);
  const buddyDetails = useSelector(state => state.buddies.buddyDetails);

  useEffect(() => {
    if (jwtToken && userId) {
      dispatch(fetchCurrentBuddies(jwtToken, userId));
      dispatch(fetchIncomingBuddyRequests(jwtToken, userId));
      dispatch(fetchOutgoingBuddyRequests(jwtToken, userId));
    } else {
      console.error("JWT Token is not defined");
    }
  }, [dispatch, jwtToken, userId]);

  // Handle fetching buddy details when clicking on a buddy card
  const handleCardClick = buddyId => {
    if (buddyId) {
      dispatch(fetchBuddyDetails(buddyId, jwtToken));
    }
  };

  const handleCloseModal = () => {
    dispatch(clearBuddyDetails());
  };

  return (
    <div className="container-fluid pt-5 mt-5">
      <div>
        <h1 className="mode-page-header">Buddies</h1>
      </div>
      <div className="row">
        <div>
          <BuddiesModeSearch />
        </div>

        <div className="col-md-12 mx-5">
          {/* Buddies Pending Requests Table */}
          <div className="py-4">
            <BuddiesPendingTable
              incomingRequests={Array.isArray(incomingBuddyRequests) ? incomingBuddyRequests : []}
              outgoingRequests={Array.isArray(outgoingBuddyRequests) ? outgoingBuddyRequests : []}
              onCardClick={handleCardClick} // Add onCardClick prop
            />
          </div>
          {/* Current Buddies Table */}
          <div>
            <BuddiesCurrentTable
              currentBuddies={Array.isArray(currentBuddies) ? currentBuddies : []}
              onCardClick={handleCardClick} // Add onCardClick prop
            />
          </div>
        </div>
      </div>
      {/* {selectedBuddy && (
        <BuddyDetailsModal buddy={selectedBuddy} onClose={handleCloseModal} />
      )} */}
      {/* Render Buddy Details Modal */}

      {/* Render Buddy Details Modal if buddyDetails exist */}
      {buddyDetails && <BuddyDetailsModal buddy={buddyDetails} onClose={handleCloseModal} />}
    </div>
  );
}

export default Buddies;
