import axios from "axios";

const apiURL = process.env.REACT_APP_API_BASE_ENDPOINT;

const setAuthHeaders = token => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

/*
- Get current user's buddies
- Get current user's outgoing buddy requests
- Get current user's incoming buddy requests
- Send buddy request
- Accept buddy request
- Reject buddy request
- Remove buddy
- Cancel outgoing buddy request
*/

// export const fetchCurrentBuddies = async (jwtToken) => {
//   const state = getState();
//   const token = state.user.tokens.jwtToken;
//   const userId = state.user.user._id;
//     try {
//       const FETCH_CURRENT_BUDDIES_ENDPOINT = process.env.REACT_APP_FETCH_CURRENT_BUDDIES_ENDPOINT;
//       const response = await axios.get(apiURL + `${FETCH_CURRENT_BUDDIES_ENDPOINT}`, {
//         headers: {
//           Authorization: `Bearer ${jwtToken}`,
//         },
//       });
//       return {
//         status: response.status,
//         data: response.data,
//       };
//     } catch (error) {
//       return {
//         status: error.response.status,
//         data: error.response.data,
//       };
//     }
//   };

export const fetchBuddyDetails = async (buddyIds, jwtToken) => {
  try {
    // Create the endpoint for fetching buddy details
    const FETCH_BUDDY_DETAILS_ENDPOINT = `${apiURL}users/buddies/personalInfo`;

    // Make a POST request to get all buddy details concurrently
    const response = await axios.post(
      FETCH_BUDDY_DETAILS_ENDPOINT,
      { buddyIds }, // Send buddyIds in the request body
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      },
    );

    // Mapping responses to only the required fields (firstName, lastName, profilePic, and _id).
    if (!response || !response.data || !Array.isArray(response.data)) {
      console.error("Invalid response received from backend:", response);
      return [];
    }
    // Mapping responses to only the required fields (firstName, lastName, profilePic, and _id).
    return response.data
      .map(buddy => {
        if (!buddy) {
          return null;
        }
        const { _id, firstName, lastName, profilePic } = buddy;
        return {
          _id,
          firstName,
          lastName,
          profilePic: profilePic || null, // Leave profilePic as null if not provided; front-end can handle default
        };
      })
      .filter(buddy => buddy !== null); // Filter out any null values in case of missing data.
  } catch (error) {
    console.error("Error fetching buddy details:", error);
    return [];
  }
};

export const fetchCurrentBuddies = async (jwtToken, userId) => {
  try {
    // const response = await axios.get(apiURL + "users/get-user", {
    //   headers: {
    //     Authorization: `Bearer ${jwtToken}`
    //   }
    // });
    const FETCH_CURRENT_BUDDIES_ENDPOINT = `${apiURL}users/${userId}/buddies`;
    const response = await axios.get(FETCH_CURRENT_BUDDIES_ENDPOINT, setAuthHeaders(jwtToken));

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      data: error.response?.data || "An error occurred",
    };
  }
};

export const fetchOutgoingBuddyRequests = async (jwtToken, userId) => {
  try {
    const FETCH_OUTGOING_BUDDIES_ENDPOINT = `${apiURL}users/${userId}/buddies/requests/outgoing`;

    const response = await axios.get(FETCH_OUTGOING_BUDDIES_ENDPOINT, setAuthHeaders(jwtToken));

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      data: error.response?.data || "An error occurred",
    };
  }
};

export const fetchIncomingBuddyRequests = async (jwtToken, userId) => {
  try {
    const FETCH_INCOMING_BUDDIES_ENDPOINT = `${apiURL}users/${userId}/buddies/requests/incoming`;

    const response = await axios.get(FETCH_INCOMING_BUDDIES_ENDPOINT, setAuthHeaders(jwtToken));

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      data: error.response?.data || "An error occurred",
    };
  }
};

export const sendBuddyRequest = async (userId, buddyId, jwtToken) => {
  try {
    const SEND_BUDDIES_ENDPOINT = `${apiURL}users/${userId}/buddies/${buddyId}/send`;
    const response = await axios.post(
      SEND_BUDDIES_ENDPOINT,
      {}, // No request body
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      },
    );
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const acceptBuddyRequest = async (userId, buddyId, jwtToken) => {
  try {
    const ACCEPT_BUDDIES_ENDPOINT = `${apiURL}users/${userId}/buddies/${buddyId}/accept`;
    // const response = await axios.put(ACCEPT_BUDDIES_ENDPOINT, setAuthHeaders(jwtToken)); This doesnt work because the backend expects an empty body
    const response = await axios.put(
      ACCEPT_BUDDIES_ENDPOINT,
      {}, // No request body
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      },
    );

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const rejectBuddyRequest = async (userId, buddyId, jwtToken) => {
  try {
    const REJECT_BUDDIES_ENDPOINT = `${apiURL}users/${userId}/buddies/${buddyId}/cancel/incoming`;
    const response = await axios.delete(REJECT_BUDDIES_ENDPOINT, setAuthHeaders(jwtToken));

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const removeBuddy = async (userId, buddyId, jwtToken) => {
  try {
    const REMOVE_CURRENT_BUDDIES_ENDPOINT = `${apiURL}users/${userId}/buddies/${buddyId}/remove/existing`;
    const response = await axios.delete(REMOVE_CURRENT_BUDDIES_ENDPOINT, setAuthHeaders(jwtToken));
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const cancelOutgoingBuddyRequest = async (userId, buddyId, jwtToken) => {
  try {
    const CANCEL_OUTGOING_BUDDIES_ENDPOINT = `${apiURL}users/${userId}/buddies/${buddyId}/cancel/outgoing`;

    const response = await axios.delete(CANCEL_OUTGOING_BUDDIES_ENDPOINT, setAuthHeaders(jwtToken));

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const fetchAllUsers = async (searchTerm, jwtToken) => {
  try {
    const FETCH_ALL_USERS_ENDPOINT = `${apiURL}users`;
    const response = await axios.get(FETCH_ALL_USERS_ENDPOINT, {
      params: {
        firstName: searchTerm,
      },
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const fetchBuddyDetailsService = async (userId, jwtToken) => {
  const FETCH_BUDDY_DETAILS_ENDPOINT = `${apiURL}users/${userId}/allBuddiesInfo`;

  try {
    const response = await axios.get(FETCH_BUDDY_DETAILS_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      data: error.response?.data || "An error occurred",
    };
  }
};
