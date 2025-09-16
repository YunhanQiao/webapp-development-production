import React from "react";
import DefaultProfilePic from "../../../images/DefaultProfilePic.jpg";

import "../../../styles/features/buddies/stylesBuddies.css";

function BuddiesProfilePic({ buddy, onProfilePicClick }) {
  const handleClick = e => {
    e.stopPropagation(); // Prevent triggering parent card click event
    if (onProfilePicClick) {
      onProfilePicClick();
    }
  };

  // if (buddy.profilePic) {
  //   return <img src={buddy.profilePic} className='card-img-top profile-pic' alt='Profile pic'
  //    />;
  // }
  // use the default profile pic
  return (
    <img
      src={buddy.profilePic || DefaultProfilePic}
      className="card-img-top profile-pic"
      alt={buddy.profilePic ? "Profile pic" : "Default profile pic"}
      onClick={handleClick} // Trigger modal when clicked
    />
  );
}

export default BuddiesProfilePic;
