import { createSlice } from "@reduxjs/toolkit";
// The Redux slice manages items in the state.
// setFeedItems sets the list, and addFeedItemToList appends a new item to the list.
const feedItemSlice = createSlice({
  name: "feeds",
  initialState: {
    items: [],
    filteredItems: [],
    currentPage: 1,
    totalPages: 1,
    totalFeeds: 0,
    media: null, //Store media file for non-round post
    selectedRound: null,
  },
  reducers: {
    setFeedItems(state, action) {
      state.items = action.payload.items || [];
      state.filteredItems = action.payload.items || []; // Initialize filteredItems
      state.currentPage = action.payload.page;
      state.totalPages = action.payload.totalPages;
      state.totalFeeds = action.payload.totalFeeds;
    },
    setFilteredItems(state, action) {
      state.filteredItems = action.payload;
    },
    addFeedItemToList(state, action) {
      //state.items.push(action.payload); // Add new item to the end of the list
      // Use nullish coalescing to handle both structures
      const newItem = action.payload?.items || action.payload;
      // Only add if item is valid
      if (newItem && newItem._id) {
        state.filteredItems.unshift(newItem);
        state.items.unshift(newItem);
      }
    },
    addReactionToFeed(state, action) {
      const { feedId, reaction } = action.payload;
      const feedItem = state.items.find(item => item._id === feedId);
      if (feedItem) {
        //feedItem.reactions.push(reaction); // Add new reaction
        // Remove any existing reaction by the same user
        feedItem.reactions = feedItem.reactions.filter(r => r.reactorId !== reaction.reactorId);
        // Add the new reaction
        feedItem.reactions.push(reaction);
      }
    },
    addCommentToFeed(state, action) {
      const { feedId, comment } = action.payload;
      const feedItem = state.items.find(item => item._id === feedId);
      if (feedItem) {
        // Prevent duplicate comments (check by comment ID)
        const exists = feedItem.comments.some(c => c._id === comment._id);
        if (!exists) {
          feedItem.comments.push(comment); // Add new comment
        }
        // feedItem.comments.push(comment); // Add new comment
      }
    },
    removeCommentFromFeed(state, action) {
      const { feedId, commentId } = action.payload;
      const feedItem = state.items.find(item => item._id === feedId);
      if (feedItem) {
        // Remove the comment from the feed item's comments array
        feedItem.comments = feedItem.comments.filter(comment => comment._id !== commentId);
      }
    },
    setSelectedRound(state, action) {
      state.selectedRound = action.payload;
    },
    setMedia(state, action) {
      state.media = action.payload;
    },
    resetMedia(state) {
      state.media = null;
    },
  },
});

export const {
  setFeedItems,
  setFilteredItems,
  addFeedItemToList,
  addReactionToFeed,
  addCommentToFeed,
  removeCommentFromFeed,
  setMedia,
  resetMedia,
  setSelectedRound,
} = feedItemSlice.actions;

export default feedItemSlice.reducer;
