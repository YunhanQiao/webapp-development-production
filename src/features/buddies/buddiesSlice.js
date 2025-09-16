import { createSlice } from "@reduxjs/toolkit";
import { reject } from "lodash";

const buddiesSlice = createSlice({
  name: "buddies",
  initialState: {
    currentBuddies: [], //Array of buddy objects
    outgoingBuddyRequests: [], //Array of outgoing buddy request objects
    incomingBuddyRequests: [], //Array of incoming buddy request objects
    searchResults: [], // Array of search result users
    selectedBuddy: null, // Object for the currently selected buddy
    loading: false,
    error: null,
    buddyDetails: null,
  },
  reducers: {
    setCurrentBuddies(state, action) {
      state.currentBuddies = action.payload; //now stored detailed user objects
    },
    setOutgoingBuddyRequests(state, action) {
      state.outgoingBuddyRequests = action.payload; //now stored detailed user objects
    },
    setIncomingBuddyRequests(state, action) {
      state.incomingBuddyRequests = action.payload; //now stored detailed user objects
    },
    removeCurrentBuddy(state, action) {
      state.currentBuddies = state.currentBuddies.filter(buddy => buddy._id !== action.payload);
    },
    addOutgoingBuddyRequest(state, action) {
      state.outgoingBuddyRequests.push(action.payload);
    },
    cancelOutgoingBuddyRequest(state, action) {
      //state.outgoingBuddyRequests = state.outgoingBuddyRequests.filter(request => request._id !== action.payload);
      state.outgoingBuddyRequests = state.outgoingBuddyRequests.filter(
        request => request._id !== action.payload, // Use payload directly
      );
    },
    acceptIncomingBuddyRequest(state, action) {
      const acceptedBuddy = state.incomingBuddyRequests.find(request => request._id === action.payload);
      if (acceptedBuddy) {
        state.incomingBuddyRequests = state.incomingBuddyRequests.filter(request => request._id !== action.payload);
        state.currentBuddies.push(acceptedBuddy);
      }
    },
    rejectIncomingBuddyRequest(state, action) {
      state.incomingBuddyRequests = state.incomingBuddyRequests.filter(request => request._id !== action.payload);
    },
    setSearchResults(state, action) {
      state.searchResults = action.payload; // Set search results based on user search
    },
    setSelectedBuddy(state, action) {
      state.selectedBuddy = action.payload; // Set selected buddy when clicking on search result
    },
    clearSelectedBuddy(state) {
      state.selectedBuddy = null; // Clear selected buddy
    },
    clearSearchResults(state) {
      state.searchResults = []; // Clear search results
    },
    setBuddyDetails(state, action) {
      state.buddyDetails = action.payload;
    },
    clearBuddyDetails(state) {
      state.buddyDetails = null;
    },
  },
});

export default buddiesSlice.reducer;
export const {
  setCurrentBuddies,
  setOutgoingBuddyRequests,
  setIncomingBuddyRequests,
  removeCurrentBuddy,
  addOutgoingBuddyRequest,
  cancelOutgoingBuddyRequest,
  acceptIncomingBuddyRequest,
  rejectIncomingBuddyRequest,
  setSearchResults,
  setSelectedBuddy,
  clearSelectedBuddy,
  clearSearchResults,
  setBuddyDetails,
  clearBuddyDetails,
} = buddiesSlice.actions;
