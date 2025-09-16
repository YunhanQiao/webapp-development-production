import { useNavigate } from "react-router-dom";
import TournamentList from "./TournamentList.jsx";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { confirmStripeSetup } from "features/user/userActions";

const Competitions = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("setup") === "complete") {
      console.log("Stripe setup completed - processing in frontend");
      const stripeAccountId = localStorage.getItem("pending_stripe_account_id");
      if (stripeAccountId) {
        dispatch(confirmStripeSetup(stripeAccountId));
        localStorage.removeItem("pending_stripe_account_id");
      } else {
        console.error("Account ID missing after setup completion");
      }
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [dispatch]);

  const navigateToNewTournament = () => {
    navigate("/competitions/newTournament/basicInfo");
  };

  return (
    <>
      <div id="tournamentsModeTab" className="mode-page" role="tabpanel" aria-label="tournaments Tab" tabIndex="0">
        <h1 className="mode-page-header">Competitions</h1>
        <TournamentList />
        <button id="tournamentModeActionBtn" type="button" className="float-btn" onClick={navigateToNewTournament}>
          New Tournament
        </button>
      </div>
    </>
  );
};

export default Competitions;
