import cloneDeep from "lodash/cloneDeep";

export const roundsSelector = state => state.rounds.rounds;

// export const scorecardDataSelector = state => state.rounds.scorecardData;
export const scorecardDataSelector = state => {
  const scorecardData = cloneDeep(state.rounds.scorecardData);
  if (!scorecardData) {
    return null;
  }
  scorecardData.holeByHole = scorecardData.holeByHole.map(hole => {
    return {
      ...hole,
      // Avoid using this because, scorecard is storing this as string and the elapsed time is being concatinated rather than addition
      // seconds: hole.seconds?.toString().padStart(2, "0") ?? null,
    };
  });
  scorecardData.in.seconds = scorecardData.in.seconds?.toString().padStart(2, "0");
  scorecardData.out.seconds = scorecardData.out.seconds?.toString().padStart(2, "0");
  scorecardData.total.seconds = scorecardData.total.seconds?.toString().padStart(2, "0");
  return scorecardData;
};
