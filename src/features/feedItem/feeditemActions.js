import {
  enableSSEconnection,
  getSSEFeedUrl,
  fetchPaginatedFeeds,
  reactionsServices,
  commentsServices,
  addFeedPost,
  fetchRoundById,
} from "./feedItemServices";
import {
  setFeedItems,
  addFeedItemToList,
  addCommentToFeed,
  addReactionToFeed,
  removeCommentFromFeed,
  setSelectedRound,
} from "./feeditemSlice";
import { notifyMessage } from "services/toasterServices";
import { logoutUser } from "features/user/userSlice";

// Defines actions for fetching initial feed items and adding new items to the Redux store.
// fetchFeedItems calls the service function and dispatches the result to setFeedItems.
//TODO
// addFeedItem adds new feed items (e.g., received from SSE) to the Redux store.

// Fetch initial feed items for the user
export const fetchCurrentFeeds = (jwtToken, userId, dispatch) => {
  return async dispatch => {
    try {
      const response = await enableSSEconnection(jwtToken, userId, dispatch);
      if (response.status === 200) {
        const feedItems = response.data; // Assuming data is an array of buddy IDs
        // Fetched feed items to Redux store
        dispatch(setFeedItems(feedItems));
        // return feedItems; // Return items to be used by FeedManager if needed
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

// // Action to add a new feed item
// export const addFeedItem = (item) => (dispatch) => {
//   dispatch(addFeedItemToList(item));
// };

export const fetchPaginatedFeed = async (jwtToken, page = 1, limit = 20) => {
  return async dispatch => {
    try {
      const response = await fetchPaginatedFeeds(jwtToken, page, limit);
      if (response.status === 200) {
        console.log("Inside Fetched feeds:", response.data);
        const { feeds, page: currentPage, totalPages } = response.data;
        // Update Redux store
        dispatch(setFeedItems({ items: feeds, currentPage, totalPages }));
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to fetch feeds.\n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    }
  };
};

export const addReactionAction = (feedId, reactionData, jwtToken) => {
  return async dispatch => {
    try {
      const response = await reactionsServices.postReaction(feedId, reactionData, jwtToken);

      if (response.status === 200) {
        dispatch(addReactionToFeed({ feedId, reaction: reactionData }));
        // notifyMessage('success', 'Reaction added successfully', 2000, 'colored', 'top-center');
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        throw new Error(response.data.message || "Failed to add reaction.");
      }
    } catch (err) {
      notifyMessage("error", err.message, 2000, "colored", "top-center");
      //REVERT UI CHANGES not required since it would sync with old data
      // dispatch(removeReactionFromFeed({ feedId, reaction: reactionData }));
      // notifyMessage('error', 'Reaction failed to update', 2000, 'colored', 'top-center');
    }
  };
};

export const addCommentAction = (tempId, userId, feedId, commentData, jwtToken) => {
  return async dispatch => {
    //  const tempId = `${Date.now()}`;
    // const optimisticComment = { ...commentData, _id: tempId };
    //dispatch(addCommentToFeed({ feedId, comment: optimisticComment }));
    // console.log ("the user id is", commentData.author);
    try {
      // Sync with the backend
      const response = await commentsServices.postComment(feedId, commentData, jwtToken);

      if (response.status === 200) {
        const backendComment = response.data.comments; // Get updated comments from backend
        // dispatch(addCommentToFeed({ feedId, comment: updatedComments }));
        // Replace the temporary comment in Redux state with the backend comment
        console.log("Backend Comment: from the API call with optimistic commit", backendComment);
        //  dispatch(removeCommentFromFeed({ feedId, commentId: tempId })); // Remove the temp comment
        //  dispatch(addCommentToFeed({ feedId, comment: backendComment  })); // Add the backend comment
        console.log("Backend Comment: from the API call after removal of optimistic commit ", backendComment);
        const singlebackendComment = response.data.comments.find(
          comment => comment.author === userId && comment.textContent === commentData.textContent,
        );

        console.log("Single Backend Comment: ", singlebackendComment);

        notifyMessage("success", "Comment added successfully", 2000, "colored", "top-center");

        return singlebackendComment; // Return updated comments
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        throw new Error(response.data.message || "Failed to add comment.");
      }
    } catch (err) {
      // Rollback optimistic update if backend fails
      dispatch(removeCommentFromFeed({ feedId, commentId: tempId }));
      notifyMessage("error", err.message, 2000, "colored", "top-center");
    }
  };
};

export const deleteCommentAction = (feedId, commentId, jwtToken, userId) => {
  return async dispatch => {
    try {
      if (!commentId) {
        console.error("Comment ID is undefined.");
        return;
      }

      // Optimistically remove the comment from Redux
      // dispatch(removeCommentFromFeed({ feedId, commentId }))

      // Make the API call
      const response = await commentsServices.deleteComment(feedId, commentId, jwtToken, userId);

      if (response.status === 200) {
        // dispatch(removeCommentFromFeed({ feedId, commentId }));
        dispatch(removeCommentFromFeed({ feedId, commentId }));
        notifyMessage("success", "Comment deleted successfully", 2000, "colored", "top-center");
        return response.data.comments; // Return updated comments
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        throw new Error(response.data.message || "Failed to delete comment.");
      }
    } catch (err) {
      // Rollback: Re-add the comment to Redux if the API call fails
      dispatch(addCommentToFeed({ feedId, comment: { _id: commentId } }));
      notifyMessage("error", err.message, 2000, "colored", "top-center");
    }
  };
};

export const addFeedPostAction = (userId, postData, jwtToken) => {
  return async dispatch => {
    try {
      console.log("insied addFeedPostAction");
      //This postDtat contains the tempId which _id will it get the new value from the backend?
      console.log("Post Data to be validated to send to backend: ", postData);

      const response = await addFeedPost(userId, postData, jwtToken);
      console.log("Response from the API call", response.data);
      console.log("Post Data", postData);
      if (response.status === 201) {
        const newFeedPost = response.data;
        dispatch(addFeedItemToList(newFeedPost)); // Add new post to Redux
        // dispatch(setFeedItems(newFeedPost));
        notifyMessage("success", "Post created successfully", 2000, "colored", "top-center");
        console.log("Post created successfully: Data from backend ", response.data);
        return newFeedPost; // Return the new post
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        throw new Error(response.data.message || "Failed to create post.");
      }
    } catch (error) {
      console.error("Error creating post:", error.message);
      throw new Error("Post creation failed. Please try again.");
    }
  };
};

export const fetchRoundByIdAction = (jwtToken, roundId) => {
  return async dispatch => {
    try {
      const response = await fetchRoundById(jwtToken, roundId);
      if (response.status === 200) {
        const round = response.data;
        console.log("Round fetched successfully: ", round);
        // Update Redux store
        dispatch(setSelectedRound(round));
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to fetch round.\n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    }
  };
};

// /**
//  * Fetch a single round by roundId
//  * @param {string} jwtToken   The user’s JWT token
//  * @param {string} roundId    The round ID to fetch
//  * @returns {Object}          The round data from the server
//  */
// export const fetchRoundById = async (jwtToken, roundId) => {
//   if (!roundId) {
//     throw new Error("Round ID is required to fetch a specific round.");
//   }

//   // e.g. GET /api/rounds/{roundId}
//   const FETCH_ROUND_ENDPOINT = `${apiURL}rounds/${roundId}`;

//   try {
//     const response = await axios.get(
//       FETCH_ROUND_ENDPOINT,
//       setAuthHeaders(jwtToken)
//     );
//     // Typically 200 OK => round data in response.data
//     return response;
//   } catch (error) {
//     console.error("Failed to fetch round:", error);
//     // re-throw so the calling code can handle it
//     throw error;
//   }
// };
