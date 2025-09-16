import { createContext, useContext, useEffect, useState } from "react";
import User from "../../models/user.model";
const UserContext = createContext();

const UserContextProvider = props => {
  // const userObject = {
  //   email: null,
  //   password: null,
  //   userId: null,
  //   authenticated: null
  // };
  // const userObject = new User({
  //   email: null,
  //   password: null,
  //   displayName: null,
  //   profilePic: null
  // });
  const userObject = new User();

  const [user, setUser] = useState(userObject);

  useEffect(() => {
    const storedUser = localStorage.getItem(user.accountInfo.email);
    if (storedUser !== JSON.stringify(user)) {
      console.info("UserContextProvider: setting user from localStorage", user);
      localStorage.setItem(user.accountInfo.email, JSON.stringify(user));
    }
  }, [user]);

  return <UserContext.Provider value={{ user, setUser }}>{props.children}</UserContext.Provider>;
};

export const useUserContext = () => {
  return useContext(UserContext);
};

export default UserContextProvider;
