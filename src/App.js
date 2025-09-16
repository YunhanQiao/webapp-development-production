import { lazy, Suspense } from "react";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Login from "./features/user/pages/LoginPage";
import RootLayout from "./RootLayout";
import { Navigate } from "react-router";
// import { useUserContext } from "./components/contexts/UserContext";
// import { validAccount } from "./services/userAuthenticationServices";
// import { useUserContext } from "./components/contexts/UserContext";

// Initialize authentication system
import "./auth";

import Buddies from "./features/buddies/pages/BuddiesPage";
import Courses from "./features/course/pages/CoursePage";
import Error from "./features/error/pages/ErrorPage";
import Feed from "./features/feedItem/pages/FeedPage";
import LogRound from "./features/round/pages/LogRound";
import Rounds from "./features/round/pages/RoundsPage";
import ViewRound from "./features/feedItem/pages/ViewRound";
// need to remove this line.
// import Courses from "./components/CoursesComponents/CourseSection";
import CourseDetail from "./features/course/pages/CourseDetailPage";
import NewCourse from "./features/course/pages/NewCoursePage";
import Loader from "./features/shared/Loader";
import CreateAccountPage from "./features/user/pages/CreateAccountPage";
import SpeedScoreInfo from "./features/user/components/SpeedScoreInfo";
import ManageAccount from "./features/user/pages/ManageAccountPage";
import { useSelector, useDispatch } from "react-redux";
import AutoLogin from "./features/user/components/autoLogin";
import EmailVerificationPage from "./features/user/pages/EmailVerificationPage";
import VerifyPasswordPage from "./features/user/pages/VerifyPasswordPage";
import EmailVerify from "./features/user/pages/EmailVerifyPage";
import ResetPassword from "./features/user/pages/ResetPassword";
import { roundsSelector, setRounds } from "./features/round";

const Tournaments = lazy(() => import("./features/competition/pages/TournamentPage"));
const TournamentDetailPage = lazy(() => import("./features/competition/pages/TournamentDetailPage"));
const TeeSheetPage = lazy(() => import("./features/competition/pages/TournamentTeeSheetPage"));
const TournamentScoresPage = lazy(() => import("./features/competition/pages/TournamentScoresPage"));
const TournamentLeaderboardPage = lazy(() => import("./features/competition/pages/TournamentLeaderboardPage"));
const AddTournament = lazy(() => import("./features/competition/pages/AddTournament"));
const PublicTournamentsPage = lazy(() => import("./features/competition/publicPages/publicTournamentsPage.jsx"));
const PublicTournamentDetail = lazy(() => import("./features/competition/publicPages/publicTournamentDetail"));
const PublicTournamentLeaderboard = lazy(
  () => import("./features/competition/publicPages/publicTournamentLeaderboard.jsx"),
);
const PublicTournamentTeesheet = lazy(() => import("./features/competition/publicPages/publicTournamentTeesheet.jsx"));
const AuthTestComponent = lazy(() => import("./components/AuthTestComponent"));

const App = () => {
  /**
   * All the contexts related use effects will be placed here
   */
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.user);
  const rounds = useSelector(roundsSelector);
  AutoLogin(); // This will automatically attempt to log in the user if they have a valid cookie
  // useEffect(() => {
  //   const storedUser = localStorage.getItem(user.accountInfo.email);
  //   if (storedUser !== JSON.stringify(user)) {
  //     console.info("UserContextProvider: setting user from localStorage", user);
  //     localStorage.setItem(user.accountInfo.email, JSON.stringify(user));
  //   }
  // }, [user]);

  /**
   * COMMENTED -- We are not dependent on local storage for now
   */
  // useEffect(() => {
  //   console.log("USER FROM USE EFFECT: ", user);
  //   if (!user || JSON.stringify(user) == "{}") return;
  //   const storedUser = localStorage.getItem(user.accountInfo.email);
  //   const newRounds = storedUser && JSON.parse(storedUser).rounds ? JSON.parse(storedUser).rounds : [];
  //   if (JSON.stringify(newRounds) !== JSON.stringify(rounds)) {
  //     // console.log('Updating global rounds state', newRounds);
  //     dispatch(setRounds(newRounds));
  //   }
  // }, [user]);

  const router = createBrowserRouter([
    {
      path: "/login",
      element: <Login />,
    },
    {
      path: "/info",
      element: <SpeedScoreInfo />,
    },
    {
      path: "/signup",
      element: <CreateAccountPage />,
    },
    { path: "/manageAccount", element: <ManageAccount /> },
    {
      path: "account/verify-email",
      element: <EmailVerificationPage />,
    },
    {
      path: "auth/resend-email",
      element: <EmailVerify />,
    },
    {
      path: "account/forgot-password",
      element: <ResetPassword />,
    },
    {
      path: "account/reset-password",
      element: <VerifyPasswordPage />,
    },
    {
      path: "/competitions/public",
      element: (
        <Suspense fallback={<Loader />}>
          <PublicTournamentsPage />
        </Suspense>
      ),
    },
    {
      path: "/competitions/u/:uniqueName",
      element: (
        <Suspense fallback={<Loader />}>
          <PublicTournamentDetail />
        </Suspense>
      ),
    },
    {
      path: "/competitions/u/:uniqueName/leaderboard",
      element: (
        <Suspense fallback={<Loader />}>
          <PublicTournamentLeaderboard />
        </Suspense>
      ),
    },
    {
      path: "/competitions/u/:uniqueName/teesheet",
      element: (
        <Suspense fallback={<Loader />}>
          <PublicTournamentTeesheet />
        </Suspense>
      ),
    },
    {
      path: "/auth-test",
      element: (
        <Suspense fallback={<Loader />}>
          <AuthTestComponent />
        </Suspense>
      ),
    },
    {
      path: "/",
      element: (
        <Suspense fallback={<Loader />}>
          <RootLayout />
        </Suspense>
      ),
      children: [
        { index: true, element: <Navigate to="/login" replace /> },
        { path: "feed", element: <Feed heading="Activity Feed" /> },
        { path: "rounds", element: <Rounds /> },
        { path: "courses", element: <Courses /> },
        { path: "buddies", element: <Buddies /> },
        { path: "competitions", element: <Tournaments /> },
        { path: "rounds/:roundId/view", element: <ViewRound /> },
        {
          path: "competitions/detail/:tournamentId",
          element: (
            <Suspense fallback={<Loader />}>
              <TournamentDetailPage />
            </Suspense>
          ),
        },
        {
          path: "competitions/newTournament",
          element: (
            <Suspense fallback={<Loader />}>
              <AddTournament />
            </Suspense>
          ),
        },
        {
          path: "competitions/newTournament/:tab",
          element: (
            <Suspense fallback={<Loader />}>
              <AddTournament />
            </Suspense>
          ),
        },
        {
          path: "competitions/newTournament/:id/:tab",
          element: (
            <Suspense fallback={<Loader />}>
              <AddTournament />
            </Suspense>
          ),
        },
      ],
    },
    {
      path: "/rounds/newRound",
      element: <LogRound />,
    },
    {
      path: "/rounds/editRound/:index",
      element: <LogRound />,
    },
    {
      path: "/courses/newCourse",
      element: <NewCourse />,
    },
    {
      path: "/courses/CourseDetail/:courseId",
      element: <CourseDetail />,
    },
    {
      path: "/competitions/:competitionId/teesheet",
      element: (
        <Suspense fallback={<Loader />}>
          <TeeSheetPage />
        </Suspense>
      ),
    },
    {
      path: "/competitions/:competitionId/scores",
      element: (
        <Suspense fallback={<Loader />}>
          <TournamentScoresPage />
        </Suspense>
      ),
    },
    {
      path: "/competitions/:competitionId/leaderboard",
      element: (
        <Suspense fallback={<Loader />}>
          <TournamentLeaderboardPage />
        </Suspense>
      ),
    },
    {
      path: "*",
      element: <Error />,
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
