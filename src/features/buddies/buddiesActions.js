import { fetchAllUsers } from "features/competition/competitionActions";
import { notifyMessage } from "../../services/toasterServices";
import * as buddiesServices from "./buddiesServices";
import * as buddiesSlice from "./buddiesSlice";
import { logoutUser } from "features/user/userSlice";

// Helper function to fetch detailed user data for an array of buddy IDs
// const fetchBuddyDetails = async (buddyIds, jwtToken) => {
//   try {
//     const responses = await Promise.all(buddyIds.map(id => getUser(jwtToken, id)));
//     return responses.map(response => response.data);
//   } catch (error) {
//     console.error('Error fetching buddy details:', error);
//     return [];
//   }
// };

export const fetchCurrentBuddies = (jwtToken, userId) => {
  return async dispatch => {
    try {
      const response = await buddiesServices.fetchCurrentBuddies(jwtToken, userId);
      if (response.status === 200) {
        const currentBuddyIds = response.data; // Assuming data is an array of buddy IDs

        // Fetch detailed buddy information (firstName, lastName, profilePic)
        const currentBuddyDetails = await buddiesServices.fetchBuddyDetails(currentBuddyIds, jwtToken);
        dispatch(buddiesSlice.setCurrentBuddies(currentBuddyDetails));
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to fetch current buddies.\n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    }
  };
};

export const fetchOutgoingBuddyRequests = (jwtToken, userId) => {
  return async dispatch => {
    try {
      const response = await buddiesServices.fetchOutgoingBuddyRequests(jwtToken, userId);
      if (response.status === 200) {
        const outgoingBuddyIds = response.data; // Assuming data is an array of IDs
        // Fetch detailed information for each outgoing buddy request
        const detailedOutgoingRequests = await buddiesServices.fetchBuddyDetails(outgoingBuddyIds, jwtToken);
        dispatch(buddiesSlice.setOutgoingBuddyRequests(detailedOutgoingRequests));
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to fetch outgoing buddy requests.\n ${
          response.data.message ? response.data.message : ""
        }`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    }
  };
};

export const fetchIncomingBuddyRequests = (jwtToken, userId) => {
  return async dispatch => {
    try {
      const response = await buddiesServices.fetchIncomingBuddyRequests(jwtToken, userId);
      if (response.status === 200) {
        const incomingBuddyIds = response.data; // Assuming data is an array of IDs

        // Fetch detailed information for each incoming buddy request
        const detailedIncomingRequests = await buddiesServices.fetchBuddyDetails(incomingBuddyIds, jwtToken);
        dispatch(buddiesSlice.setIncomingBuddyRequests(detailedIncomingRequests));
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to fetch incoming buddy requests.\n ${
          response.data.message ? response.data.message : ""
        }`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    }
  };
};

export const sendBuddyRequest = (userId, buddyID, jwtToken) => {
  return async dispatch => {
    try {
      const response = await buddiesServices.sendBuddyRequest(userId, buddyID, jwtToken);
      if (response.status === 200) {
        //dispatch(buddiesSlice.setOutgoingBuddyRequests(buddyID));
        dispatch(buddiesSlice.addOutgoingBuddyRequest(buddyID));
        dispatch(fetchIncomingBuddyRequests(jwtToken, userId));
        dispatch(fetchOutgoingBuddyRequests(jwtToken, userId));
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to send buddy request.\n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    }
  };
};

export const acceptBuddyRequest = (userId, buddyID, jwtToken) => {
  return async dispatch => {
    try {
      const response = await buddiesServices.acceptBuddyRequest(userId, buddyID, jwtToken);
      if (response.status === 200) {
        dispatch(buddiesSlice.acceptIncomingBuddyRequest(buddyID));
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to accept buddy request.\n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    }
  };
};

export const rejectBuddyRequest = (userId, buddyID, jwtToken) => {
  return async dispatch => {
    try {
      const response = await buddiesServices.rejectBuddyRequest(userId, buddyID, jwtToken);
      if (response.status === 200) {
        dispatch(buddiesSlice.rejectIncomingBuddyRequest(buddyID));
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to reject buddy request.\n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    }
  };
};

export const removeBuddy = (userId, buddyID, jwtToken) => {
  return async dispatch => {
    try {
      const response = await buddiesServices.removeBuddy(userId, buddyID, jwtToken);
      if (response.status === 200) {
        dispatch(buddiesSlice.removeCurrentBuddy(buddyID));
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to remove buddy.\n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    }
  };
};

export const cancelOutgoingBuddyRequest = (userId, buddyID, jwtToken) => {
  return async dispatch => {
    try {
      const response = await buddiesServices.cancelOutgoingBuddyRequest(userId, buddyID, jwtToken);
      if (response.status === 200) {
        dispatch(buddiesSlice.cancelOutgoingBuddyRequest(buddyID));
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to cancel outgoing buddy request.\n ${
          response.data.message ? response.data.message : ""
        }`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    }
  };
};

export const fetchUsers = (searchTerm, jwtToken) => {
  return async dispatch => {
    try {
      const response = await buddiesServices.fetchAllUsers(searchTerm, jwtToken);
      if (response.status === 200) {
        dispatch(buddiesSlice.setSearchResults(response.data));
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to fetch search results.\n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    }
  };
};

export const fetchBuddyDetails = (userId, jwtToken) => {
  return async dispatch => {
    try {
      const response = await buddiesServices.fetchBuddyDetailsService(userId, jwtToken);
      if (response.status === 200) {
        dispatch(buddiesSlice.setBuddyDetails(response.data));
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to fetch buddy details. ${response.data.message || ""}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      notifyMessage("error", error.message, 1000, "colored", "top-center");
    }
  };
};
