import React, { useEffect, useState } from "react";
import FeedManager from "../components/FeedManager";
import { useLocation, useNavigate } from "react-router-dom";
import FeedItem from "../components/FeedItem";
import FeedPagination from "../components/FeedPagination";
import { useSelector, useDispatch } from "react-redux";
import { fetchPaginatedFeeds, fetchUserSpecificFeeds } from "./../feedItemServices";
import { addFeedPostAction } from "../feeditemActions";
import { addFeedItemToList, setFeedItems, setFilteredItems } from "./../feeditemSlice";
import PostModal from "../components/PostModal";
import { resetMedia } from "./../feeditemSlice";

const Feed = props => {
  const location = useLocation();
  const navigate = useNavigate();
  const feedData = useSelector(state => state.feeds); // Get feed data from Redux state
  const media = useSelector(state => state.feeds.media);
  const { items, filteredItems } = feedData;
  const dispatch = useDispatch();
  const userState = useSelector(state => state.user);
  const jwtToken = userState?.tokens?.jwtToken;
  const user = userState?.user;
  const userId = user?._id;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newPostText, setNewPostText] = useState(""); // State for text content of the new post

  // Extract current page from query parameters
  const searchParams = new URLSearchParams(location.search);
  const currentPage = Number(searchParams.get("page")) || 1;

  const totalPages = feedData?.totalPages || 1;

  const handlePostSubmit = async () => {
    if (!newPostText.trim()) {
      alert("Post content cannot be empty!");
      return;
    }

    setLoading(true);
    const tempId = `${Date.now()}`; // Temporary ID for optimistic update
    const postData = {
      _id: tempId, // Temporary ID for optimistic update
      isRound: false,
      textContent: newPostText,
      media: media ? media.dataUrl : null, // Attach the single media file if available
      tags: [],
      userFirstName: user.personalInfo?.firstName || "Unknown",
      userLastName: user.personalInfo?.lastName || "Unknown",
      userProfilePic: user.personalInfo?.profilePic || "",
      date: new Date().toISOString(),
    };

    // Optimistically add the post to the Redux state
    //dispatch(setFeedItems({ filteredItems: [{ ...postData }, ...items] }));
    dispatch(addFeedItemToList(postData)); // Optimistically add the post to the Redux state
    try {
      const response = dispatch(addFeedPostAction(userId, postData, jwtToken)); // Use the Redux action
      const backendPost = response.items; // Get the backend response

      // Replace the temporary post with the backend response
      const updatedItems = items.map(item => (item._id === tempId ? backendPost : item));
      dispatch(setFeedItems({ items: updatedItems }));
      setIsModalOpen(false); // Close modal
      setNewPostText(""); // Clear input
      dispatch(resetMedia()); // Clear media after successful upload
    } catch (error) {
      console.error("Error creating post:", error.message);
      // Rollback: Remove temporary post if backend fails
      dispatch(setFeedItems({ items: items.filter(item => item._id !== tempId) }));
    } finally {
      setLoading(false);
    }
  };

  const [searchTerm, setSearchTerm] = useState(""); // Search term state

  // const normalizedItems = Array.isArray(items[0]?.items) ? items[0].items : items;
  // console.log('Flattened Feed Items:', normalizedItems);

  //const hasFeeds = Array.isArray(items) && items.length > 0;

  const hasFeeds = Array.isArray(filteredItems) && filteredItems.length > 0;

  // Handle search functionality
  const handleSearchChange = e => {
    const term = e.target.value;
    setSearchTerm(term);

    if (!term.trim()) {
      // Reset to full list when search term is cleared
      dispatch(setFilteredItems(items));
    } else {
      const regex = new RegExp(term, "i"); // Case-insensitive search
      const filtered = items.filter(
        item =>
          regex.test(item.userFirstName) || // Search by user first name
          regex.test(item.userLastName) || // Search by user last name
          regex.test(item.courseShortName) || // Search by course short name
          regex.test(item.roundType) || // Search by round type
          regex.test(item.courseFullName) ||
          regex.test(item.createdAt) ||
          regex.test(item.date) ||
          regex.test(item.distance) ||
          regex.test(item.comments) ||
          regex.test(item.sgsToPar) ||
          regex.test(item.strokes) ||
          regex.test(item.teesetName) ||
          regex.test(item.time) ||
          regex.test(item.timeToPar) ||
          regex.test(item.userParGender) ||
          regex.test(item.userPreferredUnit) ||
          (item.textContent && item.textContent.split(/\s+/).some(word => regex.test(word))) || // Match any word in textContent
          (Array.isArray(item.comments) && item.comments.some(comment => regex.test(comment.textContent || ""))), // Safeguard for comments // Search in comments
      );
      dispatch(setFilteredItems(filtered));
    }
  };

  // Fetch feeds on page or query change
  useEffect(() => {
    const loadFeeds = async () => {
      try {
        // Only fetch if both jwtToken and userId are available
        if (!jwtToken || !userId) {
          // User not authenticated yet, skip feed fetch
          return;
        }

        //const res = await fetchPaginatedFeeds(jwtToken, currentPage  );
        const res = await fetchUserSpecificFeeds(jwtToken, userId, currentPage);
        const { feeds, page: currenPage, totalPages } = res;
        dispatch(setFeedItems({ items: feeds, currenPage, totalPages }));
      } catch (error) {
        console.error("Error fetching feeds:", error);
      }
    };
    loadFeeds();
  }, [dispatch, jwtToken, currentPage, userId]);

  // Redirect to the first page if no data is available
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      navigate(`${location.pathname}?page=1`);
    }
  }, [currentPage, totalPages, navigate, location.pathname]);

  return (
    <div id="feedModeTab" className="mode-page" role="tabpanel" aria-label="Feed Tab" tabIndex="0">
      {/* Page Header */}
      <h1 className="mode-page-header">Feed</h1>

      {/* Button for creating a new post */}
      {/* <button id='feedModeActionBtn' type='button' className='float-btn'>
        <span className='fas fa-comment-medical fa-fw' aria-hidden='true'></span>
        New Post
      </button> */}

      {/* Button for creating a new post */}
      <button id="feedModeActionBtn" type="button" className="float-btn" onClick={() => setIsModalOpen(true)}>
        <span className="fas fa-comment-medical fa-fw" aria-hidden="true"></span>
        New Post
      </button>

      {/* AddPostModal */}
      <PostModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h2 style={{ marginBottom: "10px" }}>Share your thoughts ?</h2>
        <textarea
          placeholder="What's on your mind?"
          value={newPostText}
          onChange={e => setNewPostText(e.target.value)}
          style={{
            width: "100%",
            height: "120px", // Taller and rectangular
            marginBottom: "15px",
            borderRadius: "10px", // Rectangular with slight rounding
            border: "1px solid #ddd",
            padding: "12px", // Spacious padding for better usability
            fontSize: "1rem",
            resize: "none",
          }}
        />
        <div style={{ textAlign: "right" }}>
          <button
            onClick={handlePostSubmit}
            style={{
              backgroundColor: "var(--main-color)", // Updated color
              color: "var(--text-color)", // Updated text color
              padding: "10px 20px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              marginRight: "10px",
            }}
            disabled={loading}
          >
            {loading ? "Posting..." : "Post"}
          </button>
          <button
            onClick={() => setIsModalOpen(false)}
            style={{
              backgroundColor: "#ccc",
              color: "#000",
              padding: "10px 20px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </PostModal>

      {/* Search Bar */}
      <div className="d-flex justify-content-center align-items-center mb-4">
        <div className="me-2">Search/Filter:</div>
        <div className="w-25">
          <input
            type="text"
            className="form-control"
            placeholder="Enter keywords to search..."
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Feed items list */}
      <div className="feed-items">
        <FeedManager />
        {hasFeeds ? (
          <ul>
            {/* {items.map((item, index) => (
               <FeedItem key={item._id || index} item={item} /> // Pass individual feed item
            ))} */}

            {/* {filteredItems.map((item, index) => (
              <FeedItem key={item._id || index} item={item} />
            ))} */}
            {Array.isArray(filteredItems) &&
              filteredItems
                .filter(item => item && item._id) // Filter out invalid items
                .map((item, index) => <FeedItem key={item._id || index} item={item} />)}
          </ul>
        ) : (
          <p>
            <span>No feed available at the moment</span>
          </p>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="pagination">
            <FeedPagination currentPage={currentPage} totalPages={totalPages} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Feed;

// import React from 'react';
// import FeedManager from './FeedManager';
// import FeedItem from './FeedItem';
// import FeedPagination from './FeedPagination';
// import { useSelector } from 'react-redux';
// // Displays the feed with the FeedManager render prop, which supplies feedItems for rendering.
// // Includes a button for adding new posts.
// const Feed = (props) => {
//   const feedData = useSelector((state) => state.feeds); // Grab the entire feeds object
//  // const feedItems = feedData.items || feedData.feeds || feedData.round || []; // Default to 'feeds' if 'items' is undefined
//  // Determine feed items
//  const feedItems = Array.isArray(feedData) ? feedData : feedData.items || [feedData]; // Handle array or single object
//   const currentPage = feedData.currentPage || feedData.page || 1;
//   const totalPages = feedData.totalPages || 1;

//   console.log('Feed items: Inside feed rounds page', feedItems);

//   // /*<div className="feed-items">
//   //       <FeedManager />
//   //       <ul>
//   //         {feedItems.map((item, index) => (
//   //           <FeedItem key={index} item={item} />
//   //         ))}
//   //       </ul>
//   //       <div className="pagination">
//   //       {/* <span>Page {currentPage} of {totalPages}</span> */}
//   //       /*<FeedPagination />
//   //     </div> */ *

//   // Ensure feedItems is an array
//   //let items = feedItems?.items || feedItems?.round || []; // Safely access items array from persistence format

//   // Normalize feedItems to always be an array
//   // let items = Array.isArray(feedData.items)
//   //   ? feedData.items
//   //   : feedData.items
//   //   ? [feedData.items] // Wrap single object into an array
//   //   : feedData.round
//   //   ? [feedData.round] // Handle SSE round data as a single feed
//   //   : [];

//   // Normalize feed items to always be an array
//   const items = Array.isArray(feedData?.items)
//     ? feedData.items // Handle persistence data
//     : feedData?.items?.length === undefined && feedData?.items // Handle single persistence object
//     ? [feedData.items]
//     : feedData?.round // Handle SSE data
//     ? [feedData.round]
//     : []; // Default to an empty array if nothing matches
//   console.log('Normalized Feed Items:', items);
//   //items = Object.values(items); // Convert object to array
//   const hasFeeds = Array.isArray(items) && items.length > 0;
//   console.log('hadfeeeeeeds', hasFeeds);
//   console.log('Feed items: Inside feed page', items);
//   return (
//     <div id="feedModeTab" className="mode-page" role="tabpanel" aria-label="Feed Tab" tabIndex="0">
//       {/* Button for creating a new post */}
//       <button id="feedModeActionBtn" type="button" className="float-btn">
//         <span className="fas fa-comment-medical fa-fw" aria-hidden="true"></span>
//         New Post
//       </button>

//       {/* Feed items list */}
//       <div className="feed-items">
//         <FeedManager />
//         {hasFeeds ? (
//           <ul>
//             {items.map((item, index) => (
//               <FeedItem key={item._id || index} item={item} /> // Pass individual feed item
//             ))}

//               {/* {items.map((item, index) => (
//             <FeedItem key={index} item={item} />
//           ))} */}
//           </ul>
//         ) : (
//           <p>No feeds available</p>
//         )}

//         {/* Pagination */}
//         {totalPages && totalPages > 1 && (
//           <div className="pagination">
//             <FeedPagination currentPage={currentPage} totalPages={totalPages} />
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Feed;
