import { createSlice } from "@reduxjs/toolkit";
import { COURSE_INFO, MAP, SCORECARD, SPEEDGOLF_INFO } from "./constants";

const tabSlice = createSlice({
  name: 'selectedTab',
  initialState: COURSE_INFO, // default is course info
  reducers: {
    setSelectedTab(state, action) {
      return action.payload;
    }
  }
})

export default tabSlice.reducer;
export const tabActions = tabSlice.actions;