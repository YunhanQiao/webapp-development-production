import React, { useEffect } from "react";
import { useDispatch } from "react-redux";
import Cookies from "js-cookie";
import { loginUser, setUser } from "../userSlice"; // Ensure the import path is correct
import { loginUserAction } from "../userActions"; // Ensure the import path is correct
import { set } from "lodash";

const AutoLogin = () => {
  const dispatch = useDispatch();
  // console.log("AutoLogin.js: AutoLogin component");
  useEffect(() => {
    const userCookie = Cookies.get("user-cookie");
    //const userInfo = Cookies.get("user-info");
    //const userRefreshToken = Cookies.get("user-refresh-token");
    // if (userCookie && userInfo && userRefreshToken) {
    // const jwtToken  = JSON.parse(userCookie);

    // const refreshToken = JSON.parse(userRefreshToken)

    //   const accountInfo = JSON.parse(userInfo);

    //   console.log("AutoLogin.js: jwtToken: ", jwtToken);
    //console.log("AutoLogin.js: email: ", email);
    //  console.log("AutoLogin.js: password: ", password);
    //   if (jwtToken && accountInfo && refreshToken) {
    // console.log("AutoLogin.js: dispatching loginUser")
    // dispatch(
    //   loginUser({
    //    // state.tokens.jwtToken: jwtToken,
    //     jwtToken: jwtToken,
    //     //jwtTokenExpiry: response.data.jwtTokenExpiry,
    //    refreshToken: refreshToken,
    //     accountInfo: userInfo,
    //     //personalInfo:personalInfo,
    //     //jwtTokenExpiry: refreshTokenExpiry.expiryAt

    //   })
    // );

    if (userCookie) {
      const jwtToken = JSON.parse(userCookie);
      if (jwtToken) {
        const allKeys = Object.keys(localStorage);
        const emailKeys = allKeys.filter(key => key.includes("@"));
        if (emailKeys.length > 0) {
          const storedUser = localStorage.getItem(emailKeys[0]); // Assuming single user
          if (storedUser) {
            const userState = JSON.parse(storedUser);

            const profilePic = userState.user.personalInfo.profilePic;
            dispatch(
              loginUser({
                //...userState,
                jwtToken: userState.tokens.jwtToken,
                jwtTokenExpiry: userState.tokens.jwtTokenExpiry,
                refreshToken: {
                  token: userState.tokens.refreshToken,
                  expiresAt: userState.tokens.refreshTokenExpiry,
                },
                accountInfo: userState.user.accountInfo,
                personalInfo: {
                  ...userState.user.personalInfo,
                  profilePic: profilePic,
                },
                buddies: userState.user.buddies,
                incomingBuddyRequests: userState.user.incomingBuddyRequests,
                outgoingBuddyRequests: userState.user.outgoingBuddyRequests,
                _id: userState.user._id,
              }),
            );
          }
        }
      }
    }
    //dispatch(loginUserAction({ email, password }));
    // }
    // }
  }, [dispatch]);
  // localStorage.getItem(state.user.accountInfo.email);
  return null;
};

export default AutoLogin;
