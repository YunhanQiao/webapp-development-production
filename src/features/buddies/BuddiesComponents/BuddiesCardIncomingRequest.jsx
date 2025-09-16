import React from "react";
import BuddiesAcceptDeclineButtons from "./BuddiesAcceptDeclineButtons";
import BuddiesProfilePic from "./BuddiesProfilePic";
import "../../../styles/features/buddies/stylesBuddies.css";

// Buddies card component
function BuddiesCardIncomingRequest({ buddy, onProfilePicClick }) {
  return (
    <div className="card buddy-card">
      {/* Attach onProfilePicClick to the profile picture */}
      <div className="profile-pic-container">
        <BuddiesProfilePic buddy={buddy} onProfilePicClick={onProfilePicClick} />
      </div>
      <div className="card-body d-flex flex-column justify-content-center">
        <h5 className="card-title text-center">
          {buddy.firstName} {buddy.lastName}
        </h5>
        <div className="text-center">
          <BuddiesAcceptDeclineButtons buddyId={buddy._id} />
        </div>
      </div>
    </div>
  );
}

export default BuddiesCardIncomingRequest;
