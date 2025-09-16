import { createSlice } from "@reduxjs/toolkit";
import { logoutUser } from "../user/userSlice";

const initialState = {
  rounds: [],
  scorecardData: null,
};

const roundsSlice = createSlice({
  name: "rounds",
  initialState,
  reducers: {
    setRounds(state, action) {
      state.rounds = action.payload;
    },
    setRound(state, action) {
      state.rounds = state.rounds.map(round => {
        if (round._id === action.payload._id) {
          console.log("Round Id matched");
          return action.payload;
        }
        return round;
      });
    },
    addRound(state, action) {
      state.rounds.push(action.payload);
    },
    removeRound(state, action) {
      const updatedRounds = state.rounds.filter(round => round._id !== action.payload);
      localStorage.setItem("rounds", JSON.stringify(updatedRounds));
      state.rounds = updatedRounds;
    },
    updateRound(state, action) {
      const { id, round } = action.payload;
      const roundIndex = state.rounds.findIndex(round => round.id === id);
      state.rounds[roundIndex] = round;
    },
    setScorecardData(state, action) {
      // if (!action.payload) {
      //   state.scorecardData = null;
      //   return;
      // }
      // state.scorecardData = action.payload.scorecardData;
      // if (!action.payload.scorecardData) return;
      // const startIndex = action.payload.startIndex;
      // const endIndex = action.payload.endIndex;
      // for (let i = 0; i < 18; i++) {
      //   if (i >= startIndex && i < endIndex) continue;
      //   else {
      //     state.scorecardData.holeByHole[i].minutes = null;
      //     state.scorecardData.holeByHole[i].seconds = null;
      //     state.scorecardData.holeByHole[i].strokes = null;
      //   }
      // }
      state.scorecardData = action.payload;
    },
    resetUserValuesInScorecard(state, action) {
      const [startIndex, endIndex, selectionType] = action.payload;
      if (!state.scorecardData) {
        return;
      }
      state.scorecardData.holeByHole = state.scorecardData.holeByHole.map((hole, index) => {
        // if (index >= startIndex && index < endIndex) {
        //   return {
        //     ...hole,
        //   };
        // }
        hole.minutes = null;
        hole.seconds = null;
        hole.strokes = null;
        return hole;
      });
      // if (selectionType === "Out") {
      state.scorecardData.in.minutes = 0;
      state.scorecardData.in.seconds = "00";
      state.scorecardData.in.strokes = 0;
      // } else if (selectionType === "In") {
      state.scorecardData.out.minutes = 0;
      state.scorecardData.out.seconds = "00";
      state.scorecardData.out.strokes = 0;
      // }
      // we dont change the total data here cause it is being set in logRound page
    },
    resetInnerTimeInScorecard(state, action) {
      if (!state.scorecardData) {
        return;
      }
      state.scorecardData.holeByHole = state.scorecardData.holeByHole.map(hole => {
        hole.minutes = null;
        hole.seconds = null;
        return hole;
      });
      state.scorecardData.in.minutes = 0;
      state.scorecardData.in.seconds = "00";
      state.scorecardData.out.minutes = 0;
      state.scorecardData.out.seconds = "00";
    },
    setOuterScorecardTime(state, action) {
      if (state.scorecardData) {
        state.scorecardData.in.minutes = 0;
        state.scorecardData.out.minutes = 0;
        state.scorecardData.in.seconds = 0;
        state.scorecardData.out.seconds = 0;

        for (let i = 0; i < state.scorecardData.holeByHole.length; i++) {
          state.scorecardData.holeByHole[i].minutes = null;
          state.scorecardData.holeByHole[i].seconds = null;
        }

        state.scorecardData.total = {
          ...state.scorecardData.total,
          ...action.payload,
        };
      }
    },
  },
  extraReducers: builder => {
    builder.addCase(logoutUser, (state, action) => {
      return {
        rounds: [],
        scorecardData: null,
      };
    });
  },
});

export const {
  setRounds,
  addRound,
  removeRound,
  updateRound,
  setRound,
  setScorecardData,
  setOuterScorecardTime,
  resetUserValuesInScorecard,
  resetInnerTimeInScorecard,
} = roundsSlice.actions;
export default roundsSlice.reducer;
