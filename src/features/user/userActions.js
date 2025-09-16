/*************************************************************************
 * @file: userActions.js
 * @descr
 * Defines redux action creator functions that update the user slide of
 * the redux store.
 ************************************************************************/
import { setUser, setLoading, loginUser, setError, logoutUser, refreshAuthToken } from "./userSlice";
import userSchema from "./userSchema";
import * as userServices from "./userServices";
import { createAccount, fileToBase64 } from "../../services/userAuthenticationServices";
import { notifyMessage } from "../../services/toasterServices";
import User from "../../models/user.model";
import Cookies from "js-cookie";
import { prepareRegistrationFormData } from "../../services/formParser";
import { getCourseIdByName } from "./utils";
import { fetchCompetitionByID } from "../competition/competitionActions";

// * The following code is commented, use these functions only when connecting to backend APIs

export const loginUserAction = credentials => {
  return async dispatch => {
    dispatch(setLoading(true));
    try {
      const response = await userServices.loginUser(credentials.email, credentials.password);

      if (response.status == 200) {
        dispatch(
          loginUser({
            jwtToken: response.data.jwtToken,
            jwtTokenExpiry: response.data.jwtTokenExpiry,
            refreshToken: response.data.refreshToken,
            accountInfo: response.data.user.accountInfo,
            personalInfo: response.data.user.personalInfo,
            speedgolfInfo: response.data.user.speedgolfInfo,
            preferences: response.data.user.preferences,
            buddies: response.data.user.buddies,
            incomingBuddyRequests: response.data.user.incomingBuddyRequests,
            outgoingBuddyRequests: response.data.user.outgoingBuddyRequests,
            _id: response.data.user._id,
          }),
        );
        //console.log("RESPONSE DATA: ", response.data);
        //console.log ('VERIFY email Verified : ', response.data.emailVerified);

        //localStorage.setItem(`${credentials.email}`, JSON.stringify(response.data));
        // Set cookies with an expiration time of 2 hours for JWT token
        const TokenExpiry = new Date(new Date().getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
        // Cookies.set('user-cookie', response.data.jwtToken, { expires: jwtTokenExpiry, secure: true, sameSite: 'Strict', httpOnly: true });
        Cookies.set("user-cookie", JSON.stringify(response.data.jwtToken), { expires: TokenExpiry });
        //TODO add a device info stored in cookie
        // Cookies.set('device-info', JSON.stringify(deviceInfo), { expires: TokenExpiry });
        // notifyMessage("success", "User logged in successfully", 1000, "colored", "top-center");
      } else if (response.status == 202) {
        let errorMessage = `Failed to login to user account, User email is not verified , please check your email again to verify it \n ${
          response.data.message ? response.data.message : ""
        }`;
        // throw new Error(errorMessage);
        notifyMessage("warning", errorMessage, 500, "colored", "top-center");
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        const errorMessage = "Invalid email or password. Please check your credentials and try again.";
        notifyMessage("error", errorMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const backendMessage = response.data?.message || "Unknown error occurred";
        const errorMessage = `Login failed: ${backendMessage}`;
        notifyMessage("error", errorMessage, 1000, "colored", "top-center");
        //return { success: false, error: "UNKNOWN_ERROR", message: errorMessage };
      }
    } catch (err) {
      //notifyMessage("error", err.message, 1000, "colored", "top-center");
      const backendMessage = "Unknown error occurred";
      const errorMessage = `Login failed: ${backendMessage}`;
      notifyMessage("error", errorMessage, 1000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// export const logoutUserAction = () => (dispatch) => {
//   dispatch(logoutUser());
// };

// export const refreshAuthTokenAction = (token) => (dispatch) => {
//   dispatch(refreshAuthToken(token));
// }

// export const updateUserAction = (updatedUser) => async (dispatch) => {
//   dispatch(setLoading(true));
//   try {
//     const response = await userServices.updateUser(updatedUser); // replace with your actual API call
//     if (response === null) {
//       throw new Error('Failed to update user');
//     }
//     await userSchema.validate(response);
//     dispatch(setUser(response));
//     dispatch(setLoading(false));
//   } catch (err) {
//     dispatch(setError(err.message));
//     dispatch(setLoading(false));
//   }
// };
// */
//Add additional action creators to handle common tasks involving the user object, e.g., adding or removing a buddy
export const createUserAccount = (values, enteredProfilePicFilePath, navigate, isTournamentRegistration = false) => {
  return async dispatch => {
    dispatch(setLoading(true));
    try {
      // const response = await userServices.createUser(new User(values));

      const formData = prepareRegistrationFormData(values, enteredProfilePicFilePath);

      // Add the tournament registration flag if coming from tournament page
      // Create form data from user values
      if (isTournamentRegistration) {
        formData.append("isTournamentRegistration", "true");
        // headers['X-Tournament-Registration'] = 'true';
      }

      const response = await userServices.createUser(formData, isTournamentRegistration);

      // const response = await userServices.createUser(prepareRegistrationFormData(values, enteredProfilePicFilePath));
      if (response.status == 200) {
        // Check if this is a tournament registration
        if (isTournamentRegistration) {
          const pendingTournamentRegistration = JSON.parse(sessionStorage.getItem("pendingTournamentRegistration"));
          console.log("response datat below");
          console.log(response.data);
          if (pendingTournamentRegistration && pendingTournamentRegistration.tournamentId) {
            // Store JWT token for authenticated access
            localStorage.setItem("jwtToken", response.data.jwtToken);

            // Set cookies with an expiration time of 2 hours for JWT token
            //  const TokenExpiry = new Date(new Date().getTime() + 2 * 60 * 60 * 1000);
            //  Cookies.set("user-cookie", JSON.stringify(response.data.jwtToken), { expires: TokenExpiry })

            //    if (response.data && response.data.user) {
            dispatch(
              loginUser({
                jwtToken: response.data.jwtToken,
                jwtTokenExpiry: response.data.jwtTokenExpiry,
                refreshToken: response.data.refreshToken,
                accountInfo: response.data.user.accountInfo,
                personalInfo: response.data.user.personalInfo,
                speedgolfInfo: response.data.user.speedgolfInfo,
                preferences: response.data.user.preferences,
                buddies: response.data.user.buddies,
                incomingBuddyRequests: response.data.user.incomingBuddyRequests,
                outgoingBuddyRequests: response.data.user.outgoingBuddyRequests,
                _id: response.data.user._id,
              }),
            );

            // Set user cookie for persistent login
            const TokenExpiry = new Date(new Date().getTime() + 2 * 60 * 60 * 1000); // 2 hours from now
            Cookies.set("user-cookie", JSON.stringify(response.data.jwtToken), { expires: TokenExpiry });

            // Show success message
            notifyMessage(
              "success",
              "Account created successfully! You can now register for the tournament.",
              1000,
              "colored",
              "top-center",
            );

            // Attempt the navigation first, then fetch competition data
            // This ensures the navigation happens immediately
            // Add a small delay to ensure Redux state is updated
            navigate(`/competitions/detail/${pendingTournamentRegistration.tournamentId}`);

            await dispatch(fetchCompetitionByID(pendingTournamentRegistration.tournamentId));
            setTimeout(() => {
              navigate(`/competitions/detail/${pendingTournamentRegistration.tournamentId}`);
            }, 300);

            //navigate(-1)
            //  dispatch(fetchCompetitionByID(pendingTournamentRegistration.tournamentId));
            // Navigate directly to tournament page
            // navigate(`/competitions/detail/${pendingTournamentRegistration.tournamentId}`);
            return;
          }
        }
        // Standard (non-tournament) registration flow
        notifyMessage(
          "success",
          "Account created successfully! Please verify your email by clicking the link we sent. The link is valid for 2 minutes.",
          1000,
          "colored",
          "top-center",
        );
        // const { accountStoredInLocalDb, newAcct } = createAccount({
        //   ...values,
        //   profilePic: enteredProfilePicFilePath && (await fileToBase64(enteredProfilePicFilePath)),
        // });
        // dispatch(setUser(newAcct));
        navigate("/login");
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! Session Expired\n \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        // * every thing other than 200 is an error
        let errorMessage = `Failed to create user account \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};
//TODO we are calling s
export const updateUser = (values, jwt, userId, navigate) => {
  return async (dispatch, getState) => {
    console.log("UPDATE USER ACTION");
    dispatch(setLoading(true));
    try {
      // console.log('Variable type:', typeof values.personalInfo.profilePic);
      const courses = getState().courses;
      if (values.speedgolfInfo.homeCourse) {
        // this converts the course name to course id and then sends the request to the backend.
        values.speedgolfInfo.homeCourse = getCourseIdByName(courses, values.speedgolfInfo.homeCourse);
        if (!values.speedgolfInfo.homeCourse) {
          throw new Error("Failed to update user account, Home course not found in the database");
        }
      }
      const parsedData = prepareRegistrationFormData(values, values.personalInfo.profilePic, false);

      console.log("Values sent to parse registration form data function: ", JSON.stringify(parsedData, null, 2));
      const response = await userServices.updateUser(parsedData, jwt, userId);
      if (response.status == 200) {
        notifyMessage("success", "User account updated successfully", 1000, "colored", "top-center");
        dispatch(
          setUser({
            accountInfo: response.data.accountInfo,
            personalInfo: response.data.personalInfo,
            speedgolfInfo: response.data.speedgolfInfo,
            preferences: response.data.preferences,
            buddies: response.data.buddies,
            incomingBuddyRequests: response.data.incomingBuddyRequests,
            outgoingBuddyRequests: response.data.outgoingBuddyRequests,
            _id: response.data._id,
          }),
        );
        navigate(-1);
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! Session Expired\n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
        navigate("/login");
      } else {
        let errorMessage = `Failed to update user account \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.log("Error occured");
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const getUser = (jwt, userId, navigate) => {
  return async dispatch => {
    dispatch(setLoading(true));
    try {
      console.log("BEFORE MAKING GET USER API CALL");
      const response = await userServices.getUser(jwt, userId);
      console.log("API RESPONSE - GET USER: ", response);
      if (response.status == 200) {
        dispatch(
          setUser({
            accountInfo: response.data.accountInfo,
            personalInfo: response.data.personalInfo,
            speedgolfInfo: response.data.speedgolfInfo,
            preferences: response.data.preferences,
            buddies: response.data.buddies,
            incomingBuddyRequests: response.data.incomingBuddyRequests,
            outgoingBuddyRequests: response.data.outgoingBuddyRequests,
            _id: response.data._id,
          }),
        );
      } else if (response.status == 401) {
        // 401 is by default un-authorized user
        // const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        // notifyMessage("error", "Please Login Again!", 1000, "colored", "top-center");
        const responseMessage = `Please Login Again! Session Expired\n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
        navigate("/login");
      } else {
        let errorMessage = `Failed to get user information \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const sendPasswordResetLink = email => {
  return async dispatch => {
    dispatch(setLoading(true));
    try {
      const response = await userServices.sendPasswordResetLink(email);
      if (response.status == 200) {
        notifyMessage("success", "Password reset link sent successfully", 1000, "colored", "top-center");
      } else {
        let errorMessage = `Failed to send password reset link \n ${
          response.data.message ? response.data.message : ""
        }`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const setupStripeAccount = () => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const token = getState().user.tokens.jwtToken;
      const response = await userServices.createStripeAccount(token);
      console.log("Stripe Account Setup Response:", response.data);

      if (response.status === 200) {
        // Store stripeAccountId in localStorage before redirect
        localStorage.setItem("pending_stripe_account_id", response.data.stripeAccountId);
        window.location.href = response.data.accountLink;
      } else {
        throw new Error(response.data.message || "Failed to setup Stripe account");
      }
    } catch (err) {
      console.error("Error during Stripe Account Setup:", err);
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const fetchCurrentUser = () => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const token = getState().user.tokens.jwtToken;

      const response = await userServices.getUser(token);
      console.log("Fetched user from backend:", response.data);

      if (response.status === 200) {
        dispatch(setUser(response.data));
      } else {
        throw new Error(response.data.message || "Failed to fetch user");
      }
    } catch (err) {
      console.error("Error fetching user:", err);
      notifyMessage("error", err.message, 5000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const confirmStripeSetup = stripeAccountId => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const token = getState().user.tokens.jwtToken;

      const response = await userServices.confirmStripeSetup(token, stripeAccountId);
      console.log("Stripe Setup Confirmation Response:", response.data);

      if (response.status === 200) {
        // Fetch updated user details
        await dispatch(fetchCurrentUser());
        notifyMessage("success", "Stripe setup confirmed successfully!", 5000, "colored", "top-center");
      } else {
        throw new Error(response.data.message || "Failed to confirm Stripe setup");
      }
    } catch (err) {
      console.error("Error confirming Stripe setup:", err);
      notifyMessage("error", err.message, 5000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// export const userAPI = createApi({
//   reducerPath: 'userApi',
//   baseQuery: fetchBaseQuery({ baseUrl: 'http://localhost:3000' }),
//   tagTypes: ['User'],
//   endpoints: (builder) => {
//     getUser: builder.query({
//       queryFn: async (payload, { dispatch, getState }) => {
//         dispatch(setLoading(true));
//         const state = getState();
//         const user = state.user;
//         const jwt = user.tokens.jwtToken;
//         const userId = user.user._id;
//         try {
//           const response = await userServices.getUser(jwt, userId);
//           if (response.status == 200) {
//             // update the central store with the user information
//             dispatch(setUser(response.data));
//             return {
//               data: response.data
//             }
//           } else {
//             const message = `Failed to get user information \n ${response.data.message ? response.data.message : ""}`
//             throw new Error(message);
//           }
//         } catch (error) {
//           return { error: error.message }
//         }
//         finally {
//           // dispatch(setLoading(false));
//         }
//       }
//     })
//   }
// })

// export const { useGetUserQuery } = userAPI;

// export const tempAPI = createApi({
//   baseQuery: fetchBaseQuery({ url: '/' }),
//   endpoints: (build) => ({
//     // normal HTTP endpoint using fetchBaseQuery
//     getPosts: build.query({
//       query: () => ({ url: 'posts' }),
//     }),
//     // endpoint with a custom `queryFn` and separate async logic
//     getUser: build.query({
//       queryFn: async (userId) => {
//         try {
//           // const user = await userApi.getUserById(userId)
//           // Return the result in an object with a `data` field
//           return { data: "This is user Data" }
//         } catch (error) {
//           // Catch any errors and return them as an object with an `error` field
//           return { error }
//         }
//       },
//     }),
//   }),
// })

// export const { useGetUserQuery } = tempAPI;
