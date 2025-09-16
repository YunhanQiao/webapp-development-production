import React from "react";
import { Link } from "react-router-dom";

import { useSelector, useDispatch } from "react-redux";
import { fetchPaginatedFeeds, fetchUserSpecificFeeds } from "./../feedItemServices";
import { addReactionAction, addCommentAction, deleteCommentAction } from "../feeditemActions";
import { removeCommentFromFeed, addCommentToFeed } from "../feeditemSlice";
import { useState } from "react";
import { notifyMessage } from "services/toasterServices";
import { set } from "lodash";
import { convertFeetToKilometers, convertFeetToMiles } from "../../round/utils/utils";
import DefaultProfilePic from "../../../images/DefaultProfilePic.jpg";
import debounce from "lodash.debounce";
import { ViewRound } from "../pages/ViewRound";
import {
  roundPace,
  unitFormattingString,
  formatRoundDate,
  secondsConversion,
  distanceConversion,
} from "../utils/utils";
//import "../styles/styleFeeds.css";
import BuddyDetailsModal from "features/buddies/BuddiesComponents/BuddyDetailsModal";
import {
  fetchBuddyDetails,
  fetchCurrentBuddies,
  fetchIncomingBuddyRequests,
  fetchOutgoingBuddyRequests,
} from "features/buddies/buddiesActions";

const FeedItem = ({ item }) => {
  // Check if it's SSE data or persistence data
  //const isSSE = !!item.round; // SSE data has a 'round' key
  const dispatch = useDispatch();
  const userState = useSelector(state => state.user);
  const jwtToken = userState.tokens.jwtToken;
  const user = userState.user;
  const userId = user._id;
  let feedItems = useSelector(state => state.feeds.items);
  const isRound = item.isRound;
  // Rehydrate comments from Redux
  const comments = useSelector(state => state.feeds.items.find(feed => feed._id === item._id)?.comments || []);
  // Normalize data structure
  const {
    // playerId,
    // courseId,
    // distance,
    // date,
    // sgsToPar,
    // timeToPar,
    // userFirstName,
    // userLastName,
    // userProfilePic,
    // courseShortName
    courseFullName,
    courseId,
    courseShortName,
    courseWebsite,
    createdAt,
    date,
    distance,
    playerId,
    roundType,
    sgsToPar,
    strokes,
    teeId,
    teesetName,
    time,
    timeToPar,
    userFirstName,
    userLastName,
    userParGender,
    userPreferredUnit,
    userProfilePic,
    media,
    userfeedPostsArePublic,
  } = item;

  const formattedRoundDate = new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedRoundTime = new Date(date).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
  const sgsScore = strokes + secondsConversion(time).minutes + ":" + secondsConversion(time).seconds;

  // Format data
  const formattedDate = new Date(date).toLocaleDateString();
  const loggedUserName = `${user?.personalInfo?.firstName} ${user?.personalInfo?.lastName}`;
  //const [comments, setComments] = useState(item.comments || []);
  const [commentText, setCommentText] = useState("");
  const [reactions, setReactions] = useState(item.reactions || []);
  const [isDeleting, setIsDeleting] = useState(false);
  const [newCommentAdded, setNewCommentAdded] = useState(false); // Track new comment addition
  const [showAll, setShowAll] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const buddyDetails = useSelector(state => state.buddies.buddyDetails);
  // Trigger re-sync of comments when local updates are made
  const [clickedReaction, setClickedReaction] = useState(null);
  const [bigEmoji, setBigEmoji] = useState(null);
  const [emojiPosition, setEmojiPosition] = useState({ x: 0, y: 0 });

  // Count reactions by type
  const reactionCounts = reactions.reduce((counts, reaction) => {
    // counts[reaction.reactionType] = (counts[reaction.reactionType] || 0) + 1;
    // return counts;
    counts[reaction.reactionType] = (counts[reaction.reactionType] || 0) + 1;
    // If count is even, reset it to 0 to handle duplicates
    if (counts[reaction.reactionType] % 2 === 0) {
      counts[reaction.reactionType] = 0;
    }
    return counts;
  }, {});

  const handleReaction = debounce(reactionType => {
    const reactionData = {
      reactorId: userId,
      reactName: loggedUserName,
      reactionType,
    };

    // Check if the current user already reacted with the same reaction type

    //Optimistically update the local state
    const existingReaction = reactions.find(
      reaction => reaction.reactorId === userId, //&& reaction.reactionType === reactionType
    );

    let updatedReactions;
    if (existingReaction && existingReaction.reactionType === reactionType) {
      // Remove the user's existing reaction of the same type
      updatedReactions = reactions.filter(reaction => reaction.reactorId !== userId);
    } else {
      // Ensure the user doesn't have multiple reactions for the same type
      // updatedReactions = [...reactions.filter(reaction => reaction.reactorId !== userId), reactionData];
      // Otherwise, replace the existing reaction with the new one
      updatedReactions = [...reactions.filter(reaction => reaction.reactorId !== userId), reactionData];
    }

    // Optimistically update the UI
    setReactions(updatedReactions);
    // Call backend
    dispatch(addReactionAction(item._id, reactionData, jwtToken));
  }, 1000); // 1-second debounce

  const handleReactionClick = (reactionType, e) => {
    // Simple click animation
    setClickedReaction(reactionType);
    setTimeout(() => setClickedReaction(null), 200);

    // Get mouse position
    // Get exact mouse click position
    const x = e.clientX;
    const y = e.clientY;

    // Show big emoji animation
    const emojiMap = {
      Like: "👍",
      love: "❤️",
      yay: "🎉",
      wow: "😮",
      ouch: "😢",
    };
    setEmojiPosition({ x, y });
    setBigEmoji(emojiMap[reactionType]);
    setTimeout(() => setBigEmoji(null), 800); // Vanish after 800ms
    handleReaction(reactionType);
  };
  const linkifyText = text => {
    if (!text) return "";

    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)/g;

    // If there are no URLs, return the text as is
    if (!text.match(urlRegex)) {
      return text;
    }

    // This approach rebuilds the text by replacing matches with React elements
    let lastIndex = 0;
    const elements = [];
    let match;
    let matchCounter = 0;

    // Create a new regex for each execution to avoid state issues
    const regex = new RegExp(urlRegex);

    // Use exec to iterate through matches while keeping track of lastIndex
    while ((match = regex.exec(text)) !== null) {
      // Add the text segment before this match
      if (match.index > lastIndex) {
        elements.push(text.substring(lastIndex, match.index));
      }

      // Get the matched URL
      const url = match[0];

      // Ensure URL has proper protocol for href
      const href = url.startsWith("www.") ? `https://${url}` : url;

      // Add the URL as a link
      elements.push(
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          key={`link-${matchCounter++}`}
          style={{
            color: "#1a73e8",
            textDecoration: "underline",
            wordBreak: "break-all",
          }}
        >
          {url}
        </a>,
      );

      // Update lastIndex to the end of this match
      lastIndex = regex.lastIndex;
    }

    // Add any remaining text after the last match
    if (lastIndex < text.length) {
      elements.push(text.substring(lastIndex));
    }

    return elements;
  };

  const handleCommentSubmit = async e => {
    e.preventDefault();
    if (!commentText.trim()) {
      notifyMessage("error", "Comment cannot be empty.", 2000, "colored", "top-center");
      return;
    }

    const tempId = `${Date.now()}`; // Temporary ID for optimistic update
    const newComment = {
      _id: tempId, // Temporary ID
      profilePic: userProfilePic || DefaultProfilePic, // Use default pic if none provided
      author: userId,
      authorName: loggedUserName,
      textContent: commentText,
      datePosted: new Date().toISOString(), // Use current time for optimistic rendering
    };

    dispatch(addCommentToFeed({ feedId: item._id, comment: newComment }));
    setCommentText(""); // Clear input field

    try {
      const backendComment = await dispatch(addCommentAction(tempId, userId, item._id, newComment, jwtToken));
      //setComments(response.comments); // Sync local comments state with backend response
      // if (response && response.comments) {
      //   setComments(response.comments); // Sync local comments state with backend response
      //const feedItem = feedItems.find(feed => feed._id === item._id); // Sync Redux state
      //etComments(feedItem ? feedItem.comments : []);
      // setComments(response.comments); // Sync local comments state with backend response
      // }
      //setCommentText(""); // Clear input field
      if (backendComment) {
        // Replace the temporary comment with the backend response
        dispatch(removeCommentFromFeed({ feedId: item._id, commentId: tempId })); // Remove temp comment
        dispatch(addCommentToFeed({ feedId: item._id, comment: backendComment })); // Add backend comment
      }
    } catch (err) {
      console.error("Error adding comment:", err);
      dispatch(removeCommentFromFeed({ feedId: item._id, commentId: tempId }));
    }
  };

  // Handle key press events to support multiline input
  const handleKeyPress = e => {
    // Check if Ctrl+Enter is pressed to add a new line
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault(); // Prevent form submission
      setCommentText(prevText => prevText + "\n"); // Add a new line to the text
    }
    // Submit form on Enter without Ctrl
    else if (e.key === "Enter" && !e.ctrlKey) {
      handleCommentSubmit(e);
    }
  };

  const handleDelete = async commentId => {
    if (isDeleting) return; // Prevent concurrent deletes
    setIsDeleting(true);
    // Optimistically update UI
    // setComments(prevComments => prevComments.filter(comment => comment._id !== commentId));
    // Optimistically update Redux state
    dispatch(removeCommentFromFeed({ feedId: item._id, commentId }));

    try {
      // Dispatch the delete action to sync with the backend
      const updatedComments = await dispatch(deleteCommentAction(item._id, commentId, jwtToken, userId));
      //  setComments(updatedComments); // Sync local comments state with backend response
      //  const feedItem = feedItems.find(feed => feed._id === item._id); // Sync Redux state
      // setComments(feedItem ? feedItem.comments : []);
      //}
      if (updatedComments) {
        // Ensure Redux state is updated with the backend response
        // updatedComments.forEach(comment => {
        //   dispatch(addCommentToFeed({ feedId: item._id, comment }));
        // });
        // Ensure backend response is applied to Redux state
        dispatch(removeCommentFromFeed({ feedId: item._id, commentId })); // Remove the comment again to prevent duplication
      }
    } catch (err) {
      console.error("Failed to delete comment:", err);
      // Rollback optimistic update
      // Rollback optimistic update
      // Rollback: Re-add comment to Redux if deletion fails
      const deletedComment = comments.find(c => c._id === commentId);
      if (deletedComment) {
        dispatch(addCommentToFeed({ feedId: item._id, comment: deletedComment }));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  // Format data
  const userNameFull = `${item.userFirstName} ${item.userLastName}`;

  const getReactionUsers = reactionType => {
    const uniqueUsers = new Set(
      reactions.filter(reaction => reaction.reactionType === reactionType).map(reaction => reaction.reactName),
    );
    return Array.from(uniqueUsers).join("\n");
  };

  return (
    <li style={styles.feedItem}>
      <div style={styles.header}>
        <img
          src={item.userProfilePic || DefaultProfilePic}
          alt={item.userProfilePic ? DefaultProfilePic : "Default Profile Picture"}
          //style={styles.profilePic}
          style={{ ...styles.profilePic, cursor: "pointer" }}
          onClick={() => {
            dispatch(fetchBuddyDetails(item.playerId, jwtToken));
            dispatch(fetchCurrentBuddies(jwtToken, userId));
            // dispatch(fetchIncomingBuddyRequests(jwtToken, userId));
            // dispatch(fetchOutgoingBuddyRequests(jwtToken, userId));

            setShowModal(true);
          }}
        />
        <div style={styles.headerText}>
          {/* <span style={styles.userName}>{userNameFull}</span> posted a round
          <div style={styles.date}>{formattedDate}</div> */}
          <div style={styles.date}>
            {" "}
            {formattedRoundDate} at {formattedRoundTime}{" "}
          </div>
          <span>
            <a href={"#"} target={"_blank"} rel="noopener noreferrer" style={styles.userName}>
              {userNameFull}
            </a>
            &nbsp;
            {/* <a href={"#"} target={"_blank"} rel='noopener noreferrer' style={{ textDecoration: "none" }}>
              {roundType.toLowerCase()}
            </a> */}
            &nbsp;
            {isRound ? "posted a round" : "created a post"}
          </span>
        </div>
      </div>

      <div style={styles.content}>
        {isRound ? (
          <>
            <p style={styles.roundInfo}>
              <strong>SGS:</strong>&nbsp;{sgsScore}&nbsp;({strokes}
              &nbsp;strokes&nbsp;in&nbsp;{secondsConversion(time).minutes}:{secondsConversion(time).seconds})
              {/* {item.sgsToPar !== null
            ? `${item.sgsToPar} (${(item.distance / 3.2808).toFixed(2)} meters in ${item.timeToPar || 0} seconds)`
            : "N/A"} */}
            </p>
            <p style={styles.roundInfo}>
              <strong>Distance:</strong>{" "}
              {item.distance ? `${distanceConversion(item.distance, userPreferredUnit)}` : "Unknown Distance"}
              &nbsp;({roundPace(item.distance, userPreferredUnit)}/{unitFormattingString(userPreferredUnit)}&nbsp;pace)
            </p>
            {/* <p style={styles.courseName}>
          <a href={courseWebsite} target='_blank' rel='noopener noreferrer' style={{ textDecoration: "none" }}>
            {item.courseShortName || "Unknown Course"}&nbsp;({item.teesetName || ""})
          </a>
        </p> */}
            <p style={styles.courseName}>
              {/* //TODO here when you click it should go that read only mode of round ID . */}
              <Link to={`/rounds/${item.roundId}/view`} style={{ textDecoration: "none" }}>
                {item.courseShortName || "Unknown Course"}&nbsp;{item.teesetName ? ` (${item.teesetName})` : ""}
              </Link>
            </p>

            <p style={styles.note}>
              This was {item.userFirstName}'s first speedgolf round of {new Date().getFullYear()}
            </p>
          </>
        ) : (
          <>
            {/* <p>{item.textContent}</p> */}
            <p style={styles.postText}>{linkifyText(item.textContent)}</p>
            {item.media.length > 0 && (
              <div style={styles.media}>
                {item.media.map((url, index) => (
                  <img key={index} src={url} alt={`Media ${index + 1}`} style={styles.mediaImage} />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div style={styles.footer}>
        <div style={styles.reactions}>
          {/* Simple CSS animation */}
          <style>{`
    .reaction-click {
      animation: simpleClick 0.2s ease-out;
    }
    @keyframes simpleClick {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }
  `}</style>
          {/* Big emoji animation at click position */}
          <style>{`
    .big-emoji {
      position: fixed;
      font-size: 60px;
      z-index: 9999;
      pointer-events: none;
      animation: bigEmojiPop 0.8s ease-out forwards;
      transform: translate(-50%, -50%);
    }
    @keyframes bigEmojiPop {
      0% { 
        opacity: 0;
        transform: translate(-50%, -50%) scale(0.3);
      }
      30% { 
        opacity: 1;
        transform: translate(-50%, -50%) scale(1.3);
      }
      100% { 
        opacity: 0;
        transform: translate(-50%, -50%) scale(1) translateY(-20px);
      }
    }
  `}</style>

          {/* Big emoji overlay at exact click position */}
          {bigEmoji && (
            <div
              className="big-emoji"
              style={{
                left: `${emojiPosition.x}px`,
                top: `${emojiPosition.y}px`,
              }}
            >
              {bigEmoji}
            </div>
          )}

          {["Like", "love", "yay", "wow", "ouch"].map(reaction => (
            <span
              key={reaction}
              role="img"
              aria-label={reaction.toLowerCase()}
              style={{
                ...styles.icon,
                backgroundColor:
                  reactions.filter(r => r.reactionType === reaction).length > 0 ? "#e3f2fd" : "transparent",
                padding: "6px 10px",
                borderRadius: "15px",
                transition: "all 0.2s ease",
              }}
              className={clickedReaction === reaction ? "reaction-click" : ""}
              onClick={e => handleReactionClick(reaction, e)}
              title={getReactionUsers(reaction) || "No one yet"}
            >
              {reaction === "Like" && "👍"}
              {reaction === "love" && "❤️"}
              {reaction === "yay" && "🎉"}
              {reaction === "wow" && "😮"}
              {reaction === "ouch" && "😢"} {reaction} {reactions.filter(r => r.reactionType === reaction).length}
            </span>
          ))}
        </div>
        <div style={styles.commentSection}>
          {comments.length} comment{comments.length !== 1 && "s"}
          <ul style={styles.commentList}>
            {comments
              .filter(comment => comment.textContent && comment.textContent.trim() !== "") // Filter out empty comments
              .slice(0, showAll ? comments.length : 2) // Show all or only the first 2 comments
              .map((comment, index) => (
                <li key={index} style={styles.commentItem}>
                  <div style={styles.commentWrapper}>
                    <div style={styles.commentText}>
                      <img
                        src={comment.profilePic || DefaultProfilePic} // Use default pic if none provided
                        alt={comment.authorName}
                        style={{ ...styles.commentProfilePic, cursor: "pointer" }} // Add cursor pointer for profile pic
                        onClick={() => {
                          dispatch(fetchBuddyDetails(comment.author, jwtToken));
                          dispatch(fetchCurrentBuddies(jwtToken, userId));
                          // dispatch(fetchIncomingBuddyRequests(jwtToken, userId));
                          // dispatch(fetchOutgoingBuddyRequests(jwtToken, userId));

                          setShowModal(true);
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <strong>{comment.authorName}:&nbsp; </strong>
                        <div style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{comment.textContent}</div>
                        {comment.author === userId && (
                          <button
                            style={styles.deleteButton}
                            disabled={isDeleting} // Disable button during request
                            onClick={() => handleDelete(comment._id)}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </button>
                        )}
                      </div>
                    </div>
                    {/* <sub style={styles.commentTimestamp}>
                      {new Date(comment.datePosted).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric"
                      })}
                      ,{" "}
                      {new Date(comment.datePosted).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </sub> */}
                    <sub style={styles.commentTimestamp}>
                      {comment.datePosted &&
                        new Date(comment.datePosted).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      ,{" "}
                      {comment.datePosted &&
                        new Date(comment.datePosted).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                    </sub>
                  </div>
                </li>
              ))}
          </ul>
          {/* Show more/less toggle */}
          {comments.length > 2 && (
            <button style={styles.showMoreButton} onClick={() => setShowAll(!showAll)}>
              {showAll ? "Show less comments" : `View more comments (${comments.length - 2} more)`}
            </button>
          )}
          {/* <form onSubmit={handleCommentSubmit} style={styles.commentForm}>
            <input
              type="text"
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Comment as ${loggedUserName}`} // Use template literals
              style={styles.commentInput}
            />
            <button type="submit" style={styles.commentButton}>
              Post
            </button>
          </form> */}
          {/* //Functionality to add a comment a multline comment */}
          <form onSubmit={handleCommentSubmit} style={styles.commentForm}>
            <img
              src={user?.personalInfo?.profilePic || DefaultProfilePic}
              alt="Your profile"
              style={{ ...styles.commentUserProfilePic, cursor: "pointer" }}
              onClick={() => {
                dispatch(fetchBuddyDetails(userId, jwtToken));
                dispatch(fetchCurrentBuddies(jwtToken, userId));
                // dispatch(fetchIncomingBuddyRequests(jwtToken, userId));
                // dispatch(fetchOutgoingBuddyRequests(jwtToken, userId));

                setShowModal(true);
              }}
            />
            <textarea
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder={`Comment as ${loggedUserName}   (Press Ctrl+Enter for new line)`}
              style={{
                ...styles.commentInput,
                height: "auto",
                minHeight: "36px",
                resize: "vertical",
                overflow: "auto",
              }}
              rows={commentText.split("\n").length || 1} // Dynamically adjust rows based on content
            />
            <div style={{ width: "80px", flexShrink: 0 }}>
              <button type="submit" style={styles.commentButton}>
                Post
              </button>
            </div>
          </form>
        </div>
      </div>

      {showModal && buddyDetails && <BuddyDetailsModal buddy={buddyDetails} onClose={() => setShowModal(false)} />}
    </li>
  );
};

const styles = {
  commentProfilePic: {
    width: "30px", // Small size for the profile picture
    height: "30px",
    borderRadius: "50%", // Circular profile picture
    marginRight: "8px", // Space between image and text
    verticalAlign: "middle", // Align image with text
  },
  postText: {
    margin: "5px 0",
    lineHeight: "1.4",
    wordBreak: "break-word",
  },

  feedItem: {
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    padding: "15px",
    margin: "15px auto", // Center the card horizontally
    boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
    fontFamily: "Arial, sans-serif",
    maxWidth: "60%", // Adjusted to 75% width
    width: "60%", // Maintain responsiveness
  },
  header: {
    display: "flex",
    alignItems: "center",
    marginBottom: "10px",
  },
  //Below is circular Profile pic
  profilePic: {
    width: "50px",
    height: "50px",
    borderRadius: "50%",
    marginRight: "10px",
    //objectFit: 'cover', // Prevents image distortion by maintaining aspect ratio
  },
  //Below is slightly rounded square profile pic
  // 50% (circular) to 4px (slightly rounded square)
  // profilePic: {
  //   width: '50px',
  //   height: '50px',
  //   borderRadius: '4px', // Changed from 50% (circular) to 4px (slightly rounded square)
  //   marginRight: '10px',
  //   objectFit: 'cover', // Prevents image distortion by maintaining aspect ratio
  //   border: '1px solid #ddd',
  // },
  headerText: {
    display: "flex",
    flexDirection: "column",
  },
  userName: {
    fontSize: "16px",
    fontWeight: "bold",
    textDecoration: "none",
    color: "#333",
  },
  date: {
    fontSize: "12px",
    color: "#777",
  },
  content: {
    paddingLeft: "60px",
  },
  roundInfo: {
    fontSize: "14px",
    color: "#555",
    margin: "5px 0",
  },
  courseName: {
    fontSize: "14px",
    fontWeight: "bold",
    color: "#1a73e8",
    margin: "5px 0",
  },
  note: {
    fontSize: "13px",
    color: "#777",
    fontStyle: "italic",
  },
  footer: {
    marginTop: "15px",
    borderTop: "1px solid #ddd",
    paddingTop: "10px",
  },
  reactions: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
  },
  icon: {
    fontSize: "14px",
    cursor: "pointer",
    color: "#666",
    transition: "all 0.2s ease", // Add smooth transition
  },
  commentSection: {
    marginTop: "10px",
  },
  commentList: {
    listStyle: "none",
    padding: "0",
    margin: "0",
  },
  commentItem: {
    fontSize: "14px",
    marginBottom: "4px",
    display: "flex",
    flexDirection: "column",
  },
  commentForm: {
    display: "flex",
    gap: "10px",
  },
  commentInput: {
    flex: "1",
    padding: "8px",
    borderRadius: "4px",
    border: "1px solid #ddd",
  },
  commentButton: {
    padding: "8px 12px",
    borderRadius: "4px",
    backgroundColor: "var(--main-color)", // Updated color
    color: "var(--text-color)", // Updated text color
    border: "none",
    cursor: "pointer",
  },
  commentUserProfilePic: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    marginRight: "0px",
    flexShrink: 0, // Prevent the image from shrinking
    alignSelf: "flex-start", // Align to top of textarea
  },
  commentWrapper: {
    display: "flex",
    flexDirection: "column", // Align timestamp below text
  },
  commentText: {
    display: "flex",
    alignItems: "center",
  },
  commentTimestamp: {
    fontSize: "10px",
    color: "#777", // Light grey color for subtle display
    marginTop: "0px", // Slight space above timestamp
    lineHeight: "0.4", // Ensure compact spacing
    alignSelf: "flex-end", // Align to the right
    textAlign: "right", // Ensure right alignment for text
    marginBottom: "5px", // Space below the comment
  },

  // deleteButton: {
  //   marginLeft: "10px", // Space from the timestamp
  //   padding: "5px 10px",
  //   backgroundColor: "#f5f5f5",
  //   border: "1px solid #ccc",
  //   borderRadius: "2px",
  //   cursor: "pointer",
  //   fontSize: "12px"
  // },
  deleteButton: {
    marginLeft: "8px", // Slightly reduced margin for compactness
    padding: "3px 8px", // Smaller padding for a compact button
    backgroundColor: "#f5f5f5", // Light gray background
    border: "1px solid #ccc", // Subtle border
    borderRadius: "2px", // Keep subtle rounded corners
    cursor: "pointer", // Maintain pointer style
    fontSize: "10px", // Smaller font size
    height: "22px", // Fixed height for consistency
    lineHeight: "1.2", // Adjust line spacing for better alignment
    display: "inline-flex", // Ensure proper alignment
    alignItems: "center", // Center text vertically
    justifyContent: "center", // Center text horizontally
  },

  showMoreButton: {
    backgroundColor: "transparent",
    color: "#007bff",
    border: "none",
    cursor: "pointer",
    fontSize: "14px",
    marginTop: "0px",
  },

  // content: { marginTop: "10px" },
  media: { display: "flex", gap: "10px" },
  mediaImage: { width: "100px", height: "100px", objectFit: "cover" },
};
export default FeedItem;
