import { cloneDeep } from "lodash";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";

const Tabs = () => {
  // const { user } = useUserContext();
  const user = useSelector(state => state.user.user);
  const navigate = useNavigate();
  const location = useLocation();
  // let userAuthenticated = user.authenticated;
  // let userAuthenticated = false;
  // if (JSON.stringify(user) !== "{}") {
  //   userAuthenticated = user.accountInfo.authenticated;
  // }
  const userAuthenticated = useSelector(state => state.user.authenticated);

  const tabsOriginal = {
    feedActive: true,
    roundsActive: false,
    courseActive: false,
    buddiesActive: false,
    tournamentsActive: false,
  };

  const [tabsStatus, setTabStatus] = useState(tabsOriginal);

  const feedBtnClickHandler = () => {
    // Reset tab container scroll position
    const tabContainer = document.getElementById("modeTabs");
    if (tabContainer) {
      tabContainer.scrollLeft = 0;
    }
    navigate("/feed");
  };

  const roundsBtnClickHandler = () => {
    // Reset tab container scroll position
    const tabContainer = document.getElementById("modeTabs");
    if (tabContainer) {
      tabContainer.scrollLeft = 0;
    }
    navigate("/rounds");
  };

  const courseBtnClickHandler = () => {
    // Reset tab container scroll position
    const tabContainer = document.getElementById("modeTabs");
    if (tabContainer) {
      tabContainer.scrollLeft = 0;
    }
    navigate("/courses");
  };

  const buddiesBtnClickHandler = () => {
    // Reset tab container scroll position
    const tabContainer = document.getElementById("modeTabs");
    if (tabContainer) {
      tabContainer.scrollLeft = 0;
    }
    navigate("/buddies");
  };

  const tournamentsBtnClickHandler = () => {
    // Reset tab container scroll position
    const tabContainer = document.getElementById("modeTabs");
    if (tabContainer) {
      tabContainer.scrollLeft = 0;
    }
    navigate("/competitions");
  };

  useEffect(() => {
    const path = location.pathname;

    // Reset tab container scroll position on route change
    const tabContainer = document.getElementById("modeTabs");
    if (tabContainer) {
      tabContainer.scrollLeft = 0;
    }

    if (path === "/feed") {
      setTabStatus(() => {
        return cloneDeep({ ...tabsOriginal, ...{ feedActive: true } });
      });
    } else if (path === "/rounds" || path.startsWith("/rounds/")) {
      setTabStatus(() => {
        return cloneDeep({ ...tabsOriginal, ...{ roundsActive: true, feedActive: false } });
      });
    } else if (path === "/courses" || path.startsWith("/courses/")) {
      setTabStatus(() => {
        return cloneDeep({ ...tabsOriginal, ...{ courseActive: true, feedActive: false } });
      });
    } else if (path === "/buddies" || path.startsWith("/buddies/")) {
      setTabStatus(() => {
        return cloneDeep({ ...tabsOriginal, ...{ buddiesActive: true, feedActive: false } });
      });
    } else if (path === "/competitions" || path.startsWith("/competitions/")) {
      setTabStatus(() => {
        return cloneDeep({ ...tabsOriginal, ...{ tournamentsActive: true, feedActive: false } });
      });
    }
  }, [location.pathname]);

  return (
    <div
      id="modeTabs"
      className={`modetab-container ${userAuthenticated ? "" : "hidden"}`}
      role="tablist"
      aria-label="App Modes"
    >
      <button
        id="feedMode"
        type="button"
        className={`modetab-btn ${tabsStatus.feedActive ? "modetab-selected" : ""}`}
        role="tab"
        tabIndex="0"
        aria-selected={`${tabsStatus.feedActive ? "true" : "false"}`}
        aria-controls="feedModeTab"
        onClick={feedBtnClickHandler}
      >
        Feed
      </button>
      <button
        id="roundsMode"
        type="button"
        className={`modetab-btn ${tabsStatus.roundsActive ? "modetab-selected" : ""}`}
        role="tab"
        tabIndex="-1"
        aria-selected={`${tabsStatus.roundsActive ? "true" : "false"}`}
        aria-controls="roundsModeTab"
        onClick={roundsBtnClickHandler}
      >
        Rounds
      </button>
      <button
        id="coursesMode"
        type="button"
        className={`modetab-btn ${tabsStatus.courseActive ? "modetab-selected" : ""}`}
        role="tab"
        tabIndex="-1"
        aria-selected={`${tabsStatus.courseActive ? "true" : "false"}`}
        aria-controls="coursesModeTab"
        onClick={courseBtnClickHandler}
      >
        Courses
      </button>
      <button
        id="buddiesMode"
        type="button"
        className={`modetab-btn ${tabsStatus.buddiesActive ? "modetab-selected" : ""}`}
        role="tab"
        tabIndex="-1"
        aria-selected={`${tabsStatus.buddiesActive ? "true" : "false"}`}
        aria-controls="buddiesModeTab"
        onClick={buddiesBtnClickHandler}
      >
        Buddies
      </button>
      <button
        id="tournamentsMode"
        type="button"
        className={`modetab-btn ${tabsStatus.tournamentsActive ? "modetab-selected" : ""}`}
        role="tab"
        tabIndex="-1"
        aria-selected={`${tabsStatus.tournamentsActive ? "true" : "false"}`}
        aria-controls="tournamentsModeTab"
        onClick={tournamentsBtnClickHandler}
      >
        Competitions
      </button>
    </div>
  );
};

export default Tabs;
