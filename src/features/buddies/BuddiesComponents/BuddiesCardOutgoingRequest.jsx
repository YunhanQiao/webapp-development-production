import React, { useEffect } from "react";
import BuddiesCancelButton from "./BuddiesCancelButton";
import BuddiesProfilePic from "./BuddiesProfilePic";
import currentBuddies from "../buddiesSlice";
import "../../../styles/features/buddies/stylesBuddies.css";

// Buddies card component
function BuddiesCardOutgoingRequest({ buddy, onProfilePicClick }) {
  return (
    <div className="card buddy-card">
      {/* <div className='buddies-outgoing-requests'></div> */}
      {/* Attach onProfilePicClick to the profile picture */}
      <div className="profile-pic-container">
        <BuddiesProfilePic buddy={buddy} onProfilePicClick={onProfilePicClick} />
      </div>
      <div className="card-body d-flex flex-column justify-content-center">
        <h5 className="card-title text-center">
          {buddy.firstName} {buddy.lastName}
        </h5>
        <div className="text-center">
          <BuddiesCancelButton buddyId={buddy._id} />
        </div>
      </div>
    </div>
  );
}

export default BuddiesCardOutgoingRequest;
