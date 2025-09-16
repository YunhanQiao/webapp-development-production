/*************************************************************************
 * @file rootReducer.js
 * @descr
 * The rootReducer combines the individual reducers for each of
 * SpeedScore's modes (user, course, round, feedItem, and competitions).
 * The rootReducer is used to configure the Redux store in configureStore.js.
 * Redux is designed to work with a single reducer to maintain a single source
 * of truth and keep state logic consolidated in the same place. Combining all
 * reducers into a single reducer allows us to manage each slice of state
 * independently while still maintaining a single source of truth.
 * @exports rootReducer
 * ************************************************************************/
import { combineReducers } from "@reduxjs/toolkit";
// import userReducer from '../slices/userSlice';
// import courseReducer from '../slices/courseSlice';
// import roundReducer from '../slices/roundSlice';
// import feedItemReducer from '../slices/feedItemSlice';
// import competitionsReducer from './competitionsSlice';
import userReducer from "../features/user/userSlice";
import courseReducer from "../features/course/courseSlice";
import roundReducer from "../features/round/roundSlice";
import aboutReducer from "../features/about/aboutSlice";
import tabsReducer from "../features/course/tabSlice";
import buddiesReducer from "../features/buddies/buddiesSlice";
import feedsReducer from "../features/feedItem/feeditemSlice";

// import { userAPI } from '../features/user/userActions';
// import feedItemReducer from '../features/feedItem/feedItemSlice';
// import competitionsReducer from '../features/competitions/competitionsSlice';
import competitionReducer from "../features/competition/competitionSlice";

const rootReducer = combineReducers({
  user: userReducer,
  courses: courseReducer,
  courseTabs: tabsReducer,
  rounds: roundReducer,
  about: aboutReducer,
  buddies: buddiesReducer,
  feeds: feedsReducer,
  // [tempAPI.reducerPath]: tempAPI.reducer,

  //feedItems: feedItemReducer,
  competitions: competitionReducer,
});

export default rootReducer;
