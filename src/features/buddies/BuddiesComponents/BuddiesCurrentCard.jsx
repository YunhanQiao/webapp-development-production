import React from "react";
import BuddiesUnbuddyButton from "./BuddiesUnbuddyButton";
import BuddiesProfilePic from "./BuddiesProfilePic";
import BuddyDetailsModal from "../BuddiesComponents/BuddyDetailsModal";
import { clearBuddyDetails } from "../buddiesSlice";
import { useDispatch, useSelector } from "react-redux";
import "../../../styles/features/buddies/stylesBuddies.css";

// Buddies card component
function BuddiesCurrentCard({ buddy, onProfilePicClick }) {
  return (
    <div className="card buddy-card">
      {/* Pass the onProfilePicClick handler to the profile picture */}
      <div className="profile-pic-container">
        <BuddiesProfilePic buddy={buddy} onProfilePicClick={onProfilePicClick} />
      </div>
      <div className="card-body d-flex flex-column justify-content-center">
        <h5 className="card-title text-center">
          {buddy.firstName} {buddy.lastName}
        </h5>
        <div className="text-center">
          <BuddiesUnbuddyButton buddy={buddy} />
        </div>
      </div>
    </div>
  );
}
export default BuddiesCurrentCard;
