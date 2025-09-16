// BuddiesUnbuddyButton.js
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { removeBuddy } from "../buddiesActions";
import { toast, Bounce } from "react-toastify";

function BuddiesUnbuddyButton({ buddy }) {
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

  const handleDeleteBuddy = () => {
    if (buddy._id) {
      dispatch(removeBuddy(userId, buddy._id, jwtToken));
      toast.success("Buddy removed successfully", {
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

  const modalId = `deleteBuddyModal-${buddy._id}`;

  return (
    <div>
      <button type="button" className="btn btn-danger" data-bs-toggle="modal" data-bs-target={`#${modalId}`}>
        Delete Buddy
      </button>

      {/* Bootstrap modal code */}
      <div className="modal fade" id={modalId} tabIndex="-1" aria-labelledby={`${modalId}Label`} aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="buddies-modal-header d-flex justify-content-between align-items-center">
              <h5 className="modal-title mx-auto" id={`${modalId}Label`}>
                Confirm Deletion
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              Are you sure you want to delete {buddy.firstName} {buddy.lastName} from your buddies?
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                data-bs-dismiss="modal"
                onClick={e => {
                  e.stopPropagation(); // Prevent modal from bubbling events
                  handleDeleteBuddy();
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BuddiesUnbuddyButton;
