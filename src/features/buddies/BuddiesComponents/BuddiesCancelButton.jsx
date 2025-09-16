import React, { useEffect } from "react";
import { Bounce, toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { cancelOutgoingBuddyRequest } from "../buddiesActions";
import { cond } from "lodash";
// This button is for deleting an existing buddy
function BuddiesCancelButton({ buddyId }) {
  const dispatch = useDispatch(); // Get the dispatch function from Redux
  //Reference code from manage account page
  // const { user, setUser } = useUserContext();
  const userState = useSelector(state => state.user);
  const user = userState.user;
  // let userAuthenticated = user?.accountInfo?.authenticated || false;
  let userAuthenticated = userState.authenticated;
  const userId = user._id;
  const jwtToken = userState.tokens.jwtToken;
  const loadingState = user.isLoading;

  const handleCancelClick = () => {
    if (buddyId) {
      dispatch(cancelOutgoingBuddyRequest(userId, buddyId, jwtToken));
    }
    toast.success("Buddy request cancelled", {
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
  };
  return (
    <button type="button" className="btn btn-danger" onClick={handleCancelClick}>
      Cancel Request
    </button>
  );
}

export default BuddiesCancelButton;
