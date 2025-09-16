import { createSlice } from "@reduxjs/toolkit";

const aboutSlice = createSlice({
  name: "about",
  initialState: {
    showPane: false,
  },
  reducers: {
    enableShowPane: (state) => { state.showPane = true },
    disableShowPane: (state) => { state.showPane = false }
  }
})

export const { enableShowPane, disableShowPane } = aboutSlice.actions;

export default aboutSlice.reducer;