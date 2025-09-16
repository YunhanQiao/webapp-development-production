import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCurrentFeeds, fetchPaginatedFeed } from "../feeditemActions";
import { enableSSEconnection, fetchPaginatedFeeds } from "../feedItemServices";
import { logoutUser } from "features/user/userSlice";
import { setFeedItems } from "../feeditemSlice";
//import { fetchCurrentFeeds } from '../feeditemActions';

const FeedManager = ({ children }) => {
  const feedItems = useSelector(state => state.feeds.items);
  const dispatch = useDispatch();
  //const userId = useSelector((state) => state.user.userId); // Assuming user ID is stored in Redux state
  const buddies = useSelector(state => state.buddies.currentBuddies); // Get buddies from Redux
  // const { user, setUser } = useUserContext();
  const userState = useSelector(state => state.user);
  const user = userState.user;
  const currentPage = useSelector(state => state.feeds.currentPage);
  const totalPages = useSelector(state => state.feeds.totalPages);
  // let userAuthenticated = user?.accountInfo?.authenticated || false;
  let userAuthenticated = userState.authenticated;
  const userId = user._id;
  const jwtToken = userState.tokens.jwtToken;

  // Fetch current buddies and existing feed items on mount
  // useEffect(() => {
  //  // dispatch(getUserBuddies(userId));
  //  if (jwtToken && userId) {
  //  // dispatch(fetchCurrentBuddies(jwtToken, userId));
  //   //dispatch(enableSSEconnection(jwtToken, userId));
  // } else {
  //   console.error("JWT Token or userId is not defined");
  // }
  // }, [jwtToken, userId]);
  //===================================================================================================
  //Below code is working well but commented out to test the new code
  //WORKING CODE :
  // useEffect(() => {
  //   if ( jwtToken && userId) {
  //   const eventSource = enableSSEconnection(jwtToken, userId, dispatch);
  //   // Cleanup on component unmount
  //   return () => {
  //     if (eventSource && eventSource.close) {
  //       eventSource.close();
  //     }
  //   };
  //   }

  // }, [jwtToken, userId, dispatch]);

  //===================================================================================================

  useEffect(() => {
    // Fetch paginated feeds on component mount
    const loadFeeds = async () => {
      try {
        const res = await fetchPaginatedFeeds(jwtToken, 1, dispatch); // Fetch page 1 by default
        const { feeds, page: currentPage, totalPages } = res;
        dispatch(setFeedItems({ items: feeds, currentPage, totalPages }));
        //dispatch(setFeedItems(data));
      } catch (error) {
        console.error("Error fetching feeds:", error);
      }
    };

    // // Establish SSE connection for real-time updates
    const establishSSE = () => {
      if (jwtToken && userId) {
        return enableSSEconnection(jwtToken, userId, dispatch);
      }
    };

    //loadFeeds(); // Fetch persistent feeds
    const eventSource = establishSSE(); // Start SSE connection

    return () => {
      //if (eventSource) eventSource.close(); // Cleanup SSE connection on unmount
      if (eventSource && eventSource.close) {
        eventSource.close();
      }
    };
  }, [dispatch, jwtToken, userId]);

  return null; // No UI rendered by FeedManager, only manages state
};
// Set up SSE connection for real-time updates
//   useEffect(() => {

//     if (!jwtToken || !userId) return;

//     const sseUrl = getSSEFeedUrl(userId, jwtToken);

//     const eventSource = new EventSource(sseUrl);

//     eventSource.onmessage = (event) => {
//       const newRound = JSON.parse(event.data);

//       // Only add the round to feed if it's from a buddy or the user themselves
//       if (
//         buddies.some((buddy) => buddy._id === newRound.playerId) ||
//         newRound.playerId === userId
//       ) {
//         setFeedItems((prevItems) => [...prevItems, newRound]);
//        // dispatch(addFeedItem(newRound)); // Optional: add to Redux if needed
//       }
//     };
//     eventSource.onerror = () => {
//       eventSource.close();
//       console.error('SSE connection error');
//     };

//     // Cleanup SSE on component unmount
//     return () => {
//       eventSource.close();
//     };
//   }, [userId, buddies, jwtToken, dispatch]);

//   return children(feedItems); // Pass feed items to children as a render prop
//};

export default FeedManager;
