import { useDispatch, useSelector } from "react-redux";

const useLocalStorageService = () => {
  const user = useSelector(state => state.user.user);
  const { email } = user.accountInfo;

  const setDataInLocalStorage = (tournamentId, schema) => {
    const userData = JSON.parse(localStorage.getItem(email));
    if (!userData.tournaments) {
      userData.tournaments = [];
    }
    console.log("saving to local storage");
    console.log(tournamentId, schema);
    const tournament = userData.tournaments.find(({ id }) => tournamentId === id);

    if (!tournament) {
      userData.tournaments.push({ id: tournamentId, ...schema });
    } else {
      userData.tournaments = userData.tournaments.map(tournament => {
        if (tournament.id === tournamentId) {
          return { ...tournament, ...schema };
        }
        return tournament;
      });
    }

    localStorage.setItem(email, JSON.stringify(userData));
  };

  return { setDataInLocalStorage };
};

export default useLocalStorageService;
