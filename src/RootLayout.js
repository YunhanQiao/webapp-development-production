import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Tabs from "./features/shared/Tabs/Tabs";
import { useEffect, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import logo from "./images/sslogo_sm.png";
import DefaultProfilePic from "./images/DefaultProfilePic.jpg";
import { exportNullUser } from "./services/userAuthenticationServices";
// import { useAppContext } from "./components/contexts/AppContext";
import About from "./features/about/pages";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";
import { useDispatch } from "react-redux";
import { logoutUser, setUser } from "./features/user/userSlice";
import { useSelector } from "react-redux";
import { enableShowPane } from "./features/about/aboutSlice";
import AuthStatusNotification from "./components/AuthStatusNotification";
import useAuthProtection from "./auth/useAuthProtection";
import { useCrossTabAuthSync } from "./hooks/useCrossTabAuthSync";

// TODO: Fix React setState warning during render
// Warning: "Cannot update a component (`RouterProvider`) while rendering a different component (`RootLayout`)"
// This warning likely occurs when useAuthProtection or useCrossTabAuthSync hooks dispatch Redux actions
// during the render cycle. Consider moving auth state updates to useEffect or event handlers.
// Related to authentication synchronization between tabs.

/**
 *
 * * The idea of root layout is to create a seperate copy of the navigation bar that has config options
 */
const RootLayout = () => {
  const user = useSelector(state => state.user.user);
  const userAuthenticated = useSelector(state => state.user.authenticated);
  const dispatch = useDispatch();
  const [menuOpened, setMenuOpened] = useState(false);
  const navigate = useNavigate();

  // Use our authentication protection system (after navigate is initialized)
  const { isAuthenticated } = useAuthProtection({
    onAuthLost: () => {
      navigate("/login");
    },
  });

  // Enable cross-tab authentication synchronization
  useCrossTabAuthSync();

  // Load Google Maps API for course and tournament functionality
  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google?.maps) {
      return;
    }

    // Check if script already exists to prevent duplicates
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_PLACES_KEY}&libraries=places&loading=async`;
    script.async = true;
    script.defer = true;
    script.onerror = () => console.error("Google Maps script failed to load.");

    document.body.appendChild(script);

    // Don't remove script in cleanup - let it persist for the whole app lifecycle
    // return () => {
    //   document.body.removeChild(script);
    // };
  }, []);

  const menuBtnClickHandler = event => {
    event.stopPropagation();
    setMenuOpened(!menuOpened);
  };

  const profileButtonClickHandler = () => {
    navigate("/manageAccount");
  };

  const logoutClickHandler = () => {
    // setUser(exportNullUser());
    // dispatch(setUser(logoutUser()));
    dispatch(logoutUser());
  };

  const handleLogoClick = () => {
    navigate("/feed");
  };

  // const aboutClickHandler = () => setShowAboutPane(true);
  const aboutClickHandler = () => dispatch(enableShowPane(true));

  useEffect(() => {
    const handleClick = event => {
      setMenuOpened(false);
    };

    document.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("click", handleClick);
    };
  }, []);

  useEffect(() => {
    // TEMPORARILY DISABLED FOR TESTING FORM PROTECTION
    // Use our auth protection system's more reliable authentication state
    // Add a small delay to prevent navigation during brief auth state transitions
    // const timeoutId = setTimeout(() => {
    //   if (!isAuthenticated && !userAuthenticated) {
    //     console.log('🚨 RootLayout: Redirecting to login due to unauthenticated state');
    //     navigate("/login");
    //   }
    // }, 100); // 100ms delay to allow for state synchronization
    // return () => clearTimeout(timeoutId);
  }, [userAuthenticated, isAuthenticated, navigate]);

  const renderUserTooltip = props => (
    <Tooltip id="user-tooltip" {...props} className="d-flex flex-column">
      {user.personalInfo.firstName} {user.personalInfo.lastName}
      <br />
      Click to open account & profile settings
    </Tooltip>
  );

  return (
    <>
      <About />
      {/* Authentication status notification */}
      {userAuthenticated && (
        <AuthStatusNotification show={true} position="top-right" showWhenSecure={false} warningThreshold={10} />
      )}
      <header className="navbar">
        <a id="sLink" className="skip-link" tabIndex="0">
          Skip to content
        </a>
        <button
          id="menuBtn"
          type="button"
          className={`navbar-btn ${userAuthenticated ? "" : "hidden"}`}
          title="Menu"
          aria-controls="sideMenu"
          aria-label="Actions"
          aria-haspopup="true"
          aria-expanded="false"
          onClick={menuBtnClickHandler}
        >
          {/* <span id="menuBtnIcon" className="navbar-btn-icon fas fa-bars"></span> */}
          <span id="menuBtnIcon" className="navbar-btn-icon fas">
            <FontAwesomeIcon icon={`${menuOpened ? "times" : "bars"}`} />
          </span>
        </button>
        <img src={logo} className="navbar-app-icon" alt="SpeedScore logo" onClick={handleLogoClick} />
        <h1 id="appName" className="navbar-title" onClick={handleLogoClick}>
          SpeedScore
        </h1>
        <div className="navbar-right-items">
          {/* <div id="coursesModeSearchDiv" className="navbar-right-items hidden"> -->
        For React coursesModeSearch component 
      </div>  */}
          <OverlayTrigger overlay={renderUserTooltip} placement="left" delay={{ show: 150, hide: 300 }}>
            <button
              id="profileBtn"
              type="button"
              className={`navbar-btn navbar-profile-btn ${userAuthenticated ? "" : "hidden"}`}
              aria-label="Account and Profile Settings"
              // style={{backgroundImage: `url(${user.identityInfo.profilePic ? user.identityInfo.profilePic : DefaultProfilePic})`}}
              style={{
                backgroundImage: `url(${userAuthenticated && user.personalInfo.profilePic ? user.personalInfo.profilePic : DefaultProfilePic})`,
              }}
              onClick={profileButtonClickHandler}
            />
          </OverlayTrigger>
        </div>
        {/* <!--THE SIDE MENU --> */}
        <ul
          id="sideMenu"
          role="menu"
          className={`sidemenu ${userAuthenticated ? "" : "hidden"} ${menuOpened ? "sidemenu-open" : ""}`}
          arial-labelledby="menuBtn"
        >
          <li role="menuitem" tabIndex="-1" onClick={profileButtonClickHandler}>
            Account & Profile
          </li>
          <li role="menuitem" tabIndex="-1" onClick={aboutClickHandler}>
            About
          </li>
          <li role="menuitem" tabIndex="-1" onClick={logoutClickHandler}>
            Log Out
          </li>
        </ul>
      </header>
      <main>
        <Tabs />
        <Outlet />
      </main>
    </>
  );
};

export default RootLayout;
