/*************************************************************************
 * @file configureStore.js
 * @descr
 * Configures the Redux store with the rootReducer. The Redux store
 * maintains the single source of truth for the application's state.
 * The rootReducer combines the individual reducers for each of
 * SpeedScore's modes (user, course, round, feedItem, and competitions).
 * We send dispatch() actions to the store's rootReducer to update the
 * state. We use useSelector() hook from the react-redux library to
 * access the state from the store.
 * @exports store
 * ************************************************************************/
import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";
import { setupListeners } from "@reduxjs/toolkit/query";
// import { userAPI } from "../features/user/userActions";

const store = configureStore({
  reducer: rootReducer,
  devTools: true,
  // middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(userAPI.middleware),
});

// setupListeners(store.dispatch);

export default store;
