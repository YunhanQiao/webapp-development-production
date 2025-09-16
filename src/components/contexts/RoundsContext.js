import { createContext, useContext, useEffect, useState } from "react";
import { useUserContext } from "./UserContext";
import { useSelector } from "react-redux";

const RoundsContext = createContext();

const RoundsContextProvider = props => {
  // const { user } = useUserContext();
  const user = useSelector(state => state.user.user);
  // const storedUser = localStorage.getItem(user.email);
  const storedUser = localStorage.getItem(user.accountInfo.email);

  // const [rounds, setRounds] = useState(storedUser && JSON.parse(storedUser).rounds ? JSON.parse(storedUser).rounds : []);

  const [rounds, setRounds] = useState([]);

  // ! come back to this to fix the conflit with 2 copies of rounds  (1 in state and 1 in local db)
  useEffect(() => {
    const storedUser = localStorage.getItem(user.accountInfo.email);
    const newRounds = storedUser && JSON.parse(storedUser).rounds ? JSON.parse(storedUser).rounds : [];
    if (JSON.stringify(newRounds) !== JSON.stringify(rounds)) {
      setRounds(newRounds);
    }
  }, [user]);

  return <RoundsContext.Provider value={{ rounds, setRounds }}>{props.children}</RoundsContext.Provider>;
};

export default RoundsContextProvider;

export const useRoundsContext = () => {
  return useContext(RoundsContext);
};
