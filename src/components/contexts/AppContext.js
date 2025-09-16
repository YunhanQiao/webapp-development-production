import { createContext, useContext, useState } from "react";


const AppContext = createContext();
/**
 * 
 * The purpose of app context is to provide access to general
 * variables across all general components.
 */
const AppContextProvider = ({ children }) => {
  
  const [showAboutPane, setShowAboutPane] = useState(false);

  return (
    <AppContext.Provider value={{ showAboutPane, setShowAboutPane }}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContextProvider;

export const useAppContext = () => {
  return useContext(AppContext);
}