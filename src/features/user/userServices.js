/********************************************************************
 * @file userServices.js
 * @descr
 * Defines functions to update the user data in the database
 * via API calls.
 ********************************************************************/
import axios from "axios";

// import { env } from 'dotenv';
const apiURL = process.env.REACT_APP_API_BASE_ENDPOINT;

export const loginUser = async (email, password) => {
  try {
    const response = await axios.post(apiURL + "auth/login", {
      email,
      password,
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const verifyEmailService = async (userId, token) => {
  try {
    // const EMAIL_VERIFICATION_ENDPOINT = process.env.REACT_APP_EMAIL_VERIFICATION_ENDPOINT;
    const EMAIL_VERIFICATION_ENDPOINT = "auth/email-verify/";
    const response = await axios.post(apiURL + `${EMAIL_VERIFICATION_ENDPOINT}`, {
      userId,
      token,
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const verifyPasswordService = async (token, password, confirmPassword) => {
  try {
    // const PASSWORD_VERIFICATION_ENDPOINT = process.env.REACT_APP_PASSWORD_VERIFICATION_ENDPOINT;
    const PASSWORD_VERIFICATION_ENDPOINT = "auth/reset-password";
    const response = await axios.post(apiURL + `${PASSWORD_VERIFICATION_ENDPOINT}`, {
      token,
      password,
      confirmPassword,
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response?.status || 500,
      data: error.response?.data || { message: "Server error" },
    };
  }
};

export const resendVerificationEmailService = async email => {
  try {
    // const RESEND_EMAIL_ENDPOINT = process.env.REACT_APP_RESEND_EMAIL_ENDPOINT;
    const RESEND_EMAIL_ENDPOINT = "auth/resend-email-verification/";
    const response = await axios.post(apiURL + `${RESEND_EMAIL_ENDPOINT}`, {
      email,
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const fakerUserGenerator = async () => {
  try {
    const response = await axios.post(apiURL + "users/generate-fake-users");
    console.log(
      "The default timeout value is 0, which means there is no timeout. The request will wait indefinitely until the server responds.",
    );
    console.log(axios.defaults.timeout); // Output: 0

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const logoutUser = async refreshToken => {
  try {
    const response = await axios.post(apiURL + "auth/logout", {
      refreshToken,
    });
    return response.data;
  } catch (error) {
    return error.response.data;
  }
};

export const refreshAuthToken = async refreshToken => {
  try {
    console.log("🔄 API Call: Attempting to refresh token with:", {
      refreshToken: refreshToken ? `${refreshToken.substring(0, 20)}...` : "null",
      apiURL: apiURL + "auth/refresh-token",
    });

    const response = await axios.post(apiURL + "auth/refresh-token", {
      refreshToken,
    });

    console.log("✅ API Success: Token refresh successful:", {
      hasJwtToken: !!response.data.jwtToken,
      hasRefreshToken: !!response.data.refreshToken,
      status: response.status,
    });

    return response.data;
  } catch (error) {
    console.error("❌ API Error: Token refresh failed:", {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      data: error.response?.data,
    });
    return error.response?.data || { error: error.message };
  }
};

export const updateUser = async (updatedUser, jwt, userId) => {
  try {
    const response = await axios.put(apiURL + "users/update-user/" + userId, updatedUser, {
      headers: {
        Authorization: `Bearer ${jwt}`,
        "Content-Type": "multipart/form-data",
      },
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const createUser = async (newUserData, isTournamentRegistration = false) => {
  try {
    // const response = await axios.post(apiURL + "users/register", newUserData, {
    //   headers: {
    //     "Content-Type": "multipart/form-data",
    //   },
    // });
    // Create headers object with content type for FormData
    const headers = {
      "Content-Type": "multipart/form-data",
    };

    // Add tournament registration flag as a custom header if true
    if (isTournamentRegistration) {
      headers["X-Tournament-Registration"] = "true";
      console.log("Adding tournament registration header:", headers);
    }

    // Log the request being sent for debugging
    console.log("Sending registration request with headers:", headers);

    const response = await axios.post(apiURL + "users/register", newUserData, {
      headers: headers,
    });

    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const getUser = async jwtToken => {
  try {
    const response = await axios.get(apiURL + "users/get-user", {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const getUserById = async (jwtToken, userId) => {
  try {
    const response = await axios.get(apiURL + `users/${userId}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const sendPasswordResetLink = async email => {
  try {
    const response = await axios.post(apiURL + "auth/send-password-reset-link", {
      email,
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const createStripeAccount = async jwtToken => {
  try {
    const response = await axios.post(
      `${apiURL}users/stripe/create-account`,
      {},
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      },
    );
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const confirmStripeSetup = async (jwtToken, stripeAccountId) => {
  try {
    const response = await axios.post(
      `${apiURL}users/stripe/confirm-setup`,
      { stripeAccountId },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

/* Service functions that make API calls involving the user object go in this file */
