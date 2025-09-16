import axios from "axios";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import { setFeedItems, addFeedItemToList } from "./feeditemSlice";

const setAuthHeaders = token => ({
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const apiURL = process.env.REACT_APP_API_BASE_ENDPOINT;

const transformSSEDataToList = sseData => {
  if (!Array.isArray(sseData)) return [];

  return sseData.map(sseItem => ({
    ...sseItem.round, // Spread the `round` data into the object
    message: sseItem.message, // Include the message from SSE data
  }));
};

export const enableSSEconnection = (jwtToken, userId, dispatch) => {
  if (!userId || !jwtToken) {
    console.error("Missing userId or jwtToken for SSE connection");
    return null;
  }

  const FETCH_SSE_ENDPOINT = `${apiURL}rounds/${userId}/stream`;

  try {
    const eventSource = fetchEventSource(FETCH_SSE_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
      credentials: "include", // ← Include credentials for CORS
      onmessage(event) {
        try {
          // Check if event.data is not empty before parsing
          if (event.data && event.data.trim() !== ":heartbeat") {
            const newRound = JSON.parse(event.data);
            //const newRoundList = transformSSEDataToList(newRound);
            dispatch(addFeedItemToList(newRound));
            return newRound;
            // Handle the new data (e.g., update your state)
          }
        } catch (error) {
          console.error("Failed to parse SSE message:", error);
        }
      },
    });
    return eventSource;
  } catch (error) {
    console.error("Failed to establish SSE connection:", error);
    return null; // Return null if the connection fails
  }
};
// Function to get SSE URL (considering token handling)
export const getSSEFeedUrl = (userId, jwtToken) => {
  // Since EventSource doesn't support headers, tokens can be passed via query params (be cautious with security)

  return `${apiURL}rounds/${userId}/stream?token=${encodeURIComponent(jwtToken)}`;
};

export const fetchPaginatedFeeds = async (jwtToken, page, limit = 10) => {
  const FETCH_FEEDS_ENDPOINT = `${apiURL}feeds?page=${page}&limit=${limit}`;

  try {
    const response = await axios.get(FETCH_FEEDS_ENDPOINT, setAuthHeaders(jwtToken));
    return response.data;
  } catch (error) {
    console.error("Failed to fetch feeds:", error);
    throw error;
  }
};

export const fetchUserSpecificFeeds = async (jwtToken, userId, page = 1, limit = 10) => {
  if (!userId) {
    throw new Error("User ID is required to fetch user-specific feeds");
  }

  const FETCH_FEEDS_ENDPOINT = `${apiURL}users/${userId}/feeds?page=${page}&limit=${limit}`;
  try {
    const response = await axios.get(FETCH_FEEDS_ENDPOINT, setAuthHeaders(jwtToken));
    return response.data;
  } catch (error) {
    console.error("Failed to fetch user-specific feeds:", error);
    throw error;
  }
};

export const reactionsServices = {
  async postReaction(feedId, reactionData, jwtToken) {
    try {
      const url = `${apiURL}feeds/${feedId}/reaction`;
      const response = await axios.post(url, reactionData, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      return {
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      return {
        status: error.response?.status || 500,
        data: error.response?.data || { message: "An error occurred" },
      };
    }
  },
};

export const commentsServices = {
  async postComment(feedId, commentData, jwtToken) {
    try {
      const url = `${apiURL}feeds/${feedId}/comment`;
      const response = await axios.post(url, commentData, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      return {
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      return {
        status: error.response?.status || 500,
        data: error.response?.data || { message: "An error occurred" },
      };
    }
  },
  async deleteComment(feedId, commentId, jwtToken, userId) {
    try {
      const url = `${apiURL}feeds/${feedId}/comment/${commentId}?userId=${userId}`;
      const response = await axios.delete(url, {
        headers: { Authorization: `Bearer ${jwtToken}` },
      });
      return {
        status: response.status,
        data: response.data,
      };
    } catch (error) {
      return {
        status: error.response?.status || 500,
        data: error.response?.data || { message: "An error occurred" },
      };
    }
  },
};

export const preparePostFormData = (postData, mediaFile) => {
  const formData = new FormData();

  // Add text fields to FormData
  Object.keys(postData).forEach(key => {
    formData.append(key, postData[key]);
  });

  // Add the media file if it exists
  if (mediaFile) {
    formData.append("media", mediaFile); // 'media' is the field name expected by the backend
  }

  return formData;
};

export const addFeedPost = async (userId, postData, jwtToken) => {
  try {
    const sanitizedPostData = { ...postData };
    delete sanitizedPostData._id; // Remove the temporary ID
    const formData = new FormData();
    // Convert blob URL to file if media exists
    if (postData.media && postData.media.startsWith("blob:")) {
      const response = await fetch(postData.media);
      const blob = await response.blob(); // Convert Blob URL to Blob
      const file = new File([blob], `media-${Date.now()}.png`, { type: blob.type }); // Convert Blob to File

      formData.append("media", file); // Attach proper file object
    }
    formData.append("textContent", postData.textContent);
    formData.append("isRound", postData.isRound);
    formData.append("userFirstName", postData.userFirstName);
    formData.append("userLastName", postData.userLastName);
    formData.append("userProfilePic", postData.userProfilePic);
    formData.append("tags", JSON.stringify(postData.tags));
    formData.append("date", postData.date);
    const url = `${apiURL}feeds/addPost?userId=${userId}`; // Pass userId as query parameter
    const response = await axios.post(url, formData, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
        "Content-Type": "multipart/form-data", // This tells the server that the request contains a file
      },
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      data: error.response?.data || { message: "An error occurred" },
    };
  }
};

export const fetchRoundById = async (jwtToken, roundId) => {
  if (!roundId) {
    throw new Error("Round ID is required to fetch a specific round.");
  }
  const FETCH_ROUND_ENDPOINT = `${apiURL}rounds/${roundId}`;

  try {
    const response = await axios.get(FETCH_ROUND_ENDPOINT, setAuthHeaders(jwtToken));
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    console.error("Failed to fetch round by ID:", error);
    throw error;
  }
};
