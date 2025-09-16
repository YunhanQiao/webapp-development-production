import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { clearBuddyDetails, clearSearchResults, clearSelectedBuddy } from "../buddiesSlice";
import {
  fetchCurrentBuddies,
  fetchIncomingBuddyRequests,
  fetchOutgoingBuddyRequests,
  sendBuddyRequest,
} from "../buddiesActions";
import DefaultProfilePic from "../../../images/DefaultProfilePic.jpg";

function BuddyDetailsModal({ buddy, onClose }) {
  const [requestSent, setRequestSent] = useState(false);
  const buddyDetails = useSelector(state => state.buddies.buddyDetails);
  //TODO i think we need to use buddyDetails instead  state variables here

  const currentBuddies = useSelector(state => state.buddies.currentBuddies);
  const outgoingRequests = useSelector(state => state.buddies.outgoingBuddyRequests);
  const incomingRequests = useSelector(state => state.buddies.incomingBuddyRequests);

  const dispatch = useDispatch();
  const jwtToken = useSelector(state => state.user.tokens.jwtToken);
  const userId = useSelector(state => state.user.user._id);
  const [activeTab, setActiveTab] = useState("Feed");

  // Check buddy relationship status
  const [buddyStatus, setBuddyStatus] = useState("none");

  useEffect(() => {
    if (!buddy || !buddy._id) return;

    // Check if this is the current user's own profile
    if (buddy._id === userId) {
      setBuddyStatus("self");
      return;
    }
    // Check if already buddies
    const isCurrentBuddy = currentBuddies.some(currentBuddy => currentBuddy._id === buddy._id);

    // Check if there's an outgoing request
    const hasOutgoingRequest = outgoingRequests.some(request => request._id === buddy._id);

    // Check if there's an incoming request
    const hasIncomingRequest = incomingRequests.some(request => request._id === buddy._id);

    if (isCurrentBuddy) {
      setBuddyStatus("buddies");
    } else if (hasOutgoingRequest || requestSent) {
      setBuddyStatus("pending");
    } else if (hasIncomingRequest) {
      setBuddyStatus("incoming");
    } else {
      setBuddyStatus("none");
    }
  }, [buddy, currentBuddies, outgoingRequests, incomingRequests, requestSent, userId]);

  if (!buddy) return null;

  const handleSendRequest = () => {
    dispatch(sendBuddyRequest(userId, buddyDetails._id, jwtToken));
    setRequestSent(true);
    setBuddyStatus("pending");
    dispatch(clearBuddyDetails());
    dispatch(clearSearchResults());

    dispatch(fetchCurrentBuddies(jwtToken, userId));
    dispatch(fetchIncomingBuddyRequests(jwtToken, userId));
    dispatch(fetchOutgoingBuddyRequests(jwtToken, userId));
    if (onClose) onClose();
  };

  const handleCloseModal = () => {
    dispatch(clearBuddyDetails());
    if (onClose) onClose();
    dispatch(clearSearchResults());
    dispatch(clearSelectedBuddy());
  };

  // Determine button text and state
  const getButtonConfig = () => {
    switch (buddyStatus) {
      case "buddies":
        return {
          text: "Buddies",
          disabled: true,
          className: "btn btn-success request-button",
        };
      case "pending":
        return {
          text: "Request Sent",
          disabled: true,
          className: "btn btn-secondary request-button",
        };
      case "incoming":
        return {
          text: "Respond to Request",
          disabled: true,
          className: "btn btn-info request-button",
        };
      case "self":
        return {
          text: "Your Profile",
          disabled: true,
          className: "btn btn--secondary request-button",
        };
      default:
        return {
          text: "Add Buddy",
          disabled: false,
          className: "btn btn-primary request-button",
        };
    }
  };

  const buttonConfig = getButtonConfig();

  return (
    <div className="modal show">
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content buddy-details-modal">
          <div className="buddies-modal-header">
            <button type="button" className="btn-close" onClick={handleCloseModal}>
              &times;
            </button>
          </div>
          <div className="modal-body">
            <div className="profile-header">
              {/* Display profile picture and details */}
              <img src={buddy.profilePic || DefaultProfilePic} alt="Profile" className="profile-image" />
              <div className="profile-info">
                <div className="profile-name-and-button">
                  <h3>
                    {buddy.firstName} {buddy.lastName}
                  </h3>
                  {/* Send Buddy Request Button */}
                  {/* <button
                    className="btn btn-primary request-button"
                    onClick={handleSendRequest}
                    disabled={buddy.isBuddy || requestSent}
                    data-status={buddy.isBuddy ? "Buddies" : requestSent ? "Pending" : ""}
                  >
                    {buddy.isBuddy ? "Buddies" : requestSent ? "Pending" : "Add Buddy"}
                  </button> */}
                  {/* Send Buddy Request Button */}
                  <button
                    className={buttonConfig.className}
                    onClick={handleSendRequest}
                    disabled={buttonConfig.disabled}
                  >
                    {buttonConfig.text}
                  </button>
                </div>
                <div className="buddy-rounds-posts">
                  <span>
                    <strong>{buddy.buddies?.length || 0}</strong> Buddies
                  </span>
                  <span>
                    <strong>{buddy.rounds?.length || 0}</strong> Rounds
                  </span>
                  <span>
                    <strong>{buddy.feedItems?.length || 0}</strong> Posts
                  </span>
                </div>
                <p>{buddy.bio || "N/A"}</p>
                <div className="hometown-homeCourse">
                  <div className="hometown-section">
                    <span className="material-symbols-outlined icon-home-pin">home_pin</span>
                    <p>
                      {buddy.hometown || "N/A"}, {buddy.homeState || "N/A"}, {buddy.homeCountry || "N/A"}
                    </p>
                  </div>
                  <p>
                    <strong>Home Course:</strong> {buddy.homeCourse || "N/A"}
                  </p>
                </div>
                <p>
                  <strong>Clubs: </strong>
                  {buddy.clubs && buddy.clubs.length > 0 ? buddy.clubs.join(", ") : "N/A"}
                </p>
                <p>
                  <strong>Club Notes: </strong>
                  {buddy.clubNotes || "N/A"}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className="modal-tabs">
            <div
              className={`modal-tab ${activeTab === "Feed" ? "modal-tab-active" : ""}`}
              onClick={() => setActiveTab("Feed")}
            >
              Feed
            </div>
            <div
              className={`modal-tab ${activeTab === "Rounds" ? "modal-tab-active" : ""}`}
              onClick={() => setActiveTab("Rounds")}
            >
              Rounds
            </div>
            <div
              className={`modal-tab ${activeTab === "Stats" ? "modal-tab-active" : ""}`}
              onClick={() => setActiveTab("Stats")}
            >
              Stats
            </div>
          </div>

          {/* Tab Content Section */}
          <div className="tab-content">
            {activeTab === "Feed" && <div>Feed content goes here.</div>}
            {activeTab === "Rounds" && <div>Rounds content goes here.</div>}
            {activeTab === "Stats" && <div>Stats content goes here.</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuddyDetailsModal;
