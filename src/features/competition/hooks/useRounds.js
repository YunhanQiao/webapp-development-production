import { useFormContext } from "react-hook-form";
import { format } from "date-fns";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { activeTournamentSelector } from "../competitionSelectors";

const useRounds = () => {
  const { setValue, getValues, ...methods } = useFormContext();
  const activeTournament = useSelector(state => state.competitions.activeTournament || { roundsInfo: [] });

  // Load roundsInfo from localStorage on initialization
  useEffect(() => {
    const storedRoundsInfo = activeTournament?.rounds?.roundsInfo || [];
    if (storedRoundsInfo.length > 0) {
      storedRoundsInfo.forEach((round, idx) => {
        setValue(`roundsInfo[${idx}].date`, round.date);
        setValue(`roundsInfo[${idx}].format`, round.format);
      });
    }
  }, [setValue, activeTournament]);

  const updateRoundsInfo = rounds => {
    let roundsInfo = getValues("roundsInfo") || [];
    roundsInfo = roundsInfo.slice(0, rounds); // Adjust rounds array to the correct length
    setValue("roundsInfo", roundsInfo);

    // Save updated roundsInfo to localStorage
    localStorage.setItem("roundsInfo", JSON.stringify(roundsInfo));
  };

  const setRoundValue = (idx, date, speedGolfFormat) => {
    setValue(`roundsInfo[${idx}].date`, format(new Date(date), "yyyy-MM-dd"));
    setValue(`roundsInfo[${idx}].format`, speedGolfFormat || "Speedgolf");

    // Update localStorage after setting each round value
    // const updatedRoundsInfo = getValues("roundsInfo");
    // localStorage.setItem("roundsInfo", JSON.stringify(updatedRoundsInfo));
  };

  return {
    methods,
    updateRoundsInfo,
    setRoundValue,
  };
};

export default useRounds;
