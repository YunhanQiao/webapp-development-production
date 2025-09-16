import { useNavigate } from "react-router-dom";
import { TOURNAMENT_STRUCTURE, TOURNAMENT_STEPS } from "../constants";

const useTabHandlers = (tab, id) => {
  const navigate = useNavigate();

  // Safety check: if tab is undefined or not in TOURNAMENT_STRUCTURE, default to basicInfo
  const safeTab = tab && TOURNAMENT_STRUCTURE[tab] ? tab : TOURNAMENT_STEPS.BASIC_INFO;

  const { next, prev } = TOURNAMENT_STRUCTURE[safeTab];

  // Add an id to the links if we are editing a tournament
  const withId = id ? id + "/" : "";

  const handleTabClose = () => {
    console.log("Navigating to /competitions");
    navigate("/competitions", { replace: true });
  };
  const handleNextTab = next ? () => navigate(`/competitions/newTournament/${withId}${next}`) : null;
  const handlePrevTab = prev ? () => navigate(`/competitions/newTournament/${withId}${prev}`) : null;
  const moveTab = tab => navigate(`/competitions/newTournament/${withId}${tab}`);

  return {
    handleTabClose,
    handleNextTab,
    handlePrevTab,
    moveTab,
  };
};

export default useTabHandlers;
