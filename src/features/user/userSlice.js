/***********************************************************************
 * @file: userSlice.js
 * @descr:
 * The userSlice.js file defines the user slice of the Redux store.
 * The user slice maintains the state of the user object in the Redux store.
 ***********************************************************************/
import { createSlice } from "@reduxjs/toolkit";
import User from "../../models/user.model";
import Cookies from "js-cookie";
import _ from "lodash";
import Buddies from "features/buddies/pages/BuddiesPage";

const initialState = {
  user: {},
  isLoading: false,
  error: null,
  tokens: {
    jwtToken: null,
    jwtTokenExpiry: null,
    refreshToken: null,
    refreshTokenExpiry: null,
  },
  buddies: null,
  incomingBuddyRequests: null,
  outgoingBuddyRequests: null,
  authenticated: false,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUser: (state, action) => {
      // state.user = action.payload;
      state.user = {
        accountInfo: { ...action.payload.accountInfo },
        personalInfo: { ...action.payload.personalInfo },
        speedgolfInfo: action.payload.speedgolfInfo,
        preferences: action.payload.preferences,
        buddies: action.payload.buddies,
        incomingBuddyRequests: action.payload.incomingBuddyRequests,
        outgoingBuddyRequests: action.payload.outgoingBuddyRequests,
        _id: action.payload._id,
      };
      state.authenticated = true;
      //TODO get item user object from local storage
      // let tempObj = localStorage.getItem(state.user.accountInfo.email);
      // if (tempObj) {
      //   tempObj = JSON.parse(tempObj);
      // }
      // tempObj.accountInfo= action.payload.accountInfo;
      // tempObj.personalInfo = action.payload.personalInfo;
      // tempObj.speedgolfInfo = action.payload.speedgolfInfo;
      // tempObj.preferences = action.payload.preferences;
      // tempObj._id = action.payload._id;
      // localStorage.setItem(state.user.accountInfo.email, JSON.stringify(tempObj));
      const stateClone = _.cloneDeep(state);
      localStorage.setItem(state.user.accountInfo.email, JSON.stringify(stateClone));
      //localStorage.setItem(state.user.accountInfo.email, JSON.stringify(state));
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    // updateUser: (state, action) => {

    //   state.user = {
    //     accountInfo: { ...state.user.accountInfo},
    //     personalInfo: action.payload.personalInfo,
    //     speedgolfInfo: action.payload.speedgolfInfo,
    //     preferences: action.payload.preferences,
    //     _id: action.payload._id
    //   };
    //   state.authenticated = true;
    //   //update state.user
    // },
    loginUser: (state, action) => {
      state.user = {
        accountInfo: { ...action.payload.accountInfo },
        personalInfo: {
          ...action.payload.personalInfo,
          //authenticated: true,
          profilePic: action.payload.personalInfo.profilePic || "https://avatars.dicebear.com/api/human/hello1.svg",
        },
        speedgolfInfo: action.payload.speedgolfInfo,
        preferences: action.payload.preferences,
        _id: action.payload._id,
        buddies: action.payload.buddies,
        incomingBuddyRequests: action.payload.incomingBuddyRequests,
        outgoingBuddyRequests: action.payload.outgoingBuddyRequests,
      };
      state.tokens = {
        jwtToken: action.payload.jwtToken,
        jwtTokenExpiry: action.payload.jwtTokenExpiry,
        refreshToken: action.payload.refreshToken.token,
        refreshTokenExpiry: action.payload.refreshToken.expiresAt,
      };

      state.authenticated = true;
      //localStorage.setItem(state.user.accountInfo.email, JSON.stringify(state));
      const stateClone = _.cloneDeep(state);
      //saving the cloned state to local storage
      localStorage.setItem(state.user.accountInfo.email, JSON.stringify(stateClone));
    },

    logoutUser: state => {
      state.user = {};
      state.tokens = {
        jwtToken: null,
        jwtTokenExpiry: null,
        refreshToken: null,
        refreshTokenExpiry: null,
      };
      state.authenticated = false;

      Cookies.remove("user-cookie");
      Cookies.remove("user-info");
      Cookies.remove("user-refresh-token");

      // Clear the user-related data from localStorage
      const allKeys = Object.keys(localStorage);
      const emailKeys = allKeys.filter(key => key.includes("@"));
      emailKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      // Only add logout signal if this isn't a cross-tab sync operation
      if (!window.isProcessingCrossTabLogout) {
        localStorage.setItem("auth-logout-signal", Date.now().toString());
        // Remove the signal after a short delay to trigger storage events
        setTimeout(() => {
          localStorage.removeItem("auth-logout-signal");
        }, 100);
      } else {
        console.log("🔄 Skipping logout signal - this is a cross-tab sync operation");
      }

      state.isLoading = false;
      state.error = null;

      //TODO Clear local storage here
      localStorage.removeItem("courses");
      localStorage.removeItem("rounds");
      localStorage.removeItem("tournaments");
      sessionStorage.removeItem("pendingTournamentRegistration");
    },

    refreshAuthToken: (state, action) => {
      // Update tokens with new authentication data
      // Handle both setting new tokens and clearing tokens (when null is passed)
      if (action.payload.jwtToken !== undefined) {
        state.tokens.jwtToken = action.payload.jwtToken;
      }
      if (action.payload.jwtTokenExpiry !== undefined) {
        state.tokens.jwtTokenExpiry = action.payload.jwtTokenExpiry;
      }
      if (action.payload.refreshToken !== undefined) {
        state.tokens.refreshToken = action.payload.refreshToken;
      }
      if (action.payload.refreshTokenExpiry !== undefined) {
        state.tokens.refreshTokenExpiry = action.payload.refreshTokenExpiry;
      }

      // Update localStorage with new token data
      if (state.user?.accountInfo?.email) {
        const stateClone = _.cloneDeep(state);
        localStorage.setItem(state.user.accountInfo.email, JSON.stringify(stateClone));
      }
    },
  },
});

export const { setUser, setLoading, setError, loginUser, logoutUser, refreshAuthToken } = userSlice.actions;

export default userSlice.reducer;
