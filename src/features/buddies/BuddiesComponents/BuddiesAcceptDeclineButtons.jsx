import React from "react";
import { Bounce, toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { acceptBuddyRequest, rejectBuddyRequest } from "../buddiesActions";
import "../../../styles/features/buddies/stylesBuddies.css";

// buttons to accept or decline buddy requests
function BuddiesAcceptDeclineButtons({ buddyId }) {
  const dispatch = useDispatch();
  const userState = useSelector(state => state.user);
  const user = userState.user;
  let userAuthenticated = userState.authenticated;
  const userId = user._id;
  const jwtToken = userState.tokens.jwtToken;
  const loadingState = user.isLoading;

  const handleAccept = () => {
    if (buddyId) {
      dispatch(acceptBuddyRequest(userId, buddyId, jwtToken));
      toast.success("Buddy request accepted", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
    }
  };

  const handleDecline = () => {
    if (buddyId) {
      dispatch(rejectBuddyRequest(userId, buddyId, jwtToken));
      toast.success("Buddy request declined", {
        position: "top-center",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
        transition: Bounce,
      });
    }
  };

  return (
    <div>
      <button type="button" className="btn btn-dk-blue me-1" onClick={handleAccept}>
        Accept
      </button>
      <button type="button" className="btn btn-danger ms-1" onClick={handleDecline}>
        Decline
      </button>
    </div>
  );
}

export default BuddiesAcceptDeclineButtons;
