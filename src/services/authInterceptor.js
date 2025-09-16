/**
 * @fileoverview Authentication Interceptor Service
 *
 * This service provides comprehensive JWT token management including:
 * - Automatic token refresh on 401 responses
 * - Proactive token renewal before expiration
 * - Graceful authentication failure handling
 * - User notification system for auth events
 *
 * Prevents data loss from silent authentication failures by:
 * 1. Intercepting API responses and auto-refreshing expired tokens
 * 2. Monitoring token expiration and refreshing proactively
 * 3. Notifying users when authentication is lost
 * 4. Providing hooks for forms to check auth status before submission
 *
 * @version 1.0.0
 * @author GitHub Copilot
 */

import axios from "axios";
import store from "../app/configureStore";
import { refreshAuthToken, logoutUser, setError } from "../features/user/userSlice";
import { refreshAuthToken as refreshAuthTokenService } from "../features/user/userServices";

// Track ongoing refresh attempts to prevent multiple simultaneous calls
let isRefreshing = false;
let failedQueue = [];

/**
 * Process queued requests after token refresh
 * @param {Error|null} error - Error if refresh failed
 * @param {string|null} token - New token if refresh succeeded
 */
const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Check if token is expired or will expire soon
 * @param {string} tokenExpiry - Token expiry timestamp
 * @param {number} bufferMinutes - Minutes before expiry to consider "expired"
 * @returns {boolean} True if token needs refresh
 */
const isTokenExpired = (tokenExpiry, bufferMinutes = 5) => {
  if (!tokenExpiry) return true;

  const expiryDate = new Date(tokenExpiry);
  const bufferTime = bufferMinutes * 60 * 1000; // Convert to milliseconds
  const now = new Date();

  return expiryDate.getTime() - now.getTime() <= bufferTime;
};

/**
 * Attempt to refresh the authentication token
 * @returns {Promise<string>} New JWT token
 * @throws {Error} If refresh fails
 */
const attemptTokenRefresh = async () => {
  const state = store.getState();
  const { refreshToken } = state.user.tokens;

  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await refreshAuthTokenService(refreshToken);

    if (response.jwtToken) {
      // Update Redux store with new tokens
      store.dispatch(
        refreshAuthToken({
          jwtToken: response.jwtToken,
          jwtTokenExpiry: response.jwtTokenExpiry,
          refreshToken: response.refreshToken || refreshToken,
        }),
      );

      return response.jwtToken;
    } else {
      throw new Error("Invalid refresh response");
    }
  } catch (error) {
    // Refresh failed - user needs to log in again
    store.dispatch(logoutUser());
    store.dispatch(setError("Your session has expired. Please log in again."));
    throw error;
  }
};

/**
 * Setup Axios request interceptor to add auth headers and check token expiration
 */
axios.interceptors.request.use(
  config => {
    const state = store.getState();
    const { jwtToken, jwtTokenExpiry } = state.user.tokens;

    // Add auth header if token exists
    if (jwtToken) {
      config.headers.Authorization = `Bearer ${jwtToken}`;

      // Check if token is expired/expiring soon
      if (isTokenExpired(jwtTokenExpiry)) {
        console.warn(
          "Token is expired or expiring soon, but request is proceeding. Response interceptor will handle refresh.",
        );
      }
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

/**
 * Setup Axios response interceptor to handle 401 responses and refresh tokens
 */
axios.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    const originalRequest = error.config;

    // Handle 401 Unauthorized responses
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch(err => {
            return Promise.reject(err);
          });
      }

      isRefreshing = true;

      try {
        const newToken = await attemptTokenRefresh();
        processQueue(null, newToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axios(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Notify user about authentication failure
        const event = new CustomEvent("authenticationLost", {
          detail: {
            error: "Your session has expired. Please save your work and log in again.",
            originalError: error,
          },
        });
        window.dispatchEvent(event);

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

/**
 * Proactive token refresh service
 * Call this periodically to refresh tokens before they expire
 */
export const proactiveTokenRefresh = async () => {
  const state = store.getState();
  const { jwtToken, jwtTokenExpiry } = state.user.tokens;

  if (!jwtToken || !state.user.authenticated) {
    return false;
  }

  // Check if token needs refresh (5 minutes before expiry)
  if (isTokenExpired(jwtTokenExpiry, 5)) {
    try {
      await attemptTokenRefresh();
      console.log("Token refreshed proactively");
      return true;
    } catch (error) {
      console.error("Proactive token refresh failed:", error);
      return false;
    }
  }

  return false;
};

/**
 * Check if user is currently authenticated with a valid token
 * Use this before important operations like form submissions
 */
export const isAuthenticated = () => {
  const state = store.getState();
  const { jwtToken, jwtTokenExpiry } = state.user.tokens;

  if (!jwtToken || !state.user.authenticated) {
    return false;
  }

  // Consider expired if less than 1 minute remaining
  return !isTokenExpired(jwtTokenExpiry, 1);
};

/**
 * Get current authentication status with details
 * @returns {object} Authentication status details with both JWT and refresh token tracking
 */
export const getAuthStatus = () => {
  const state = store.getState();
  const { jwtToken, jwtTokenExpiry, refreshTokenExpiry } = state.user.tokens;

  if (!jwtToken || !state.user.authenticated) {
    return {
      // Backward compatibility properties
      isAuthenticated: false,
      timeUntilExpiry: 0,
      needsRefresh: true,

      // New properties for Step 1
      jwtTimeUntilExpiry: 0,
      refreshTokenTimeUntilExpiry: 0,
      needsJwtRefresh: true,
      needsRefreshTokenRenewal: true,
    };
  }

  const now = Date.now();

  // JWT token calculations
  const jwtExpiryDate = new Date(jwtTokenExpiry);
  const jwtTimeUntilExpiry = Math.max(0, jwtExpiryDate.getTime() - now);
  const needsJwtRefresh = isTokenExpired(jwtTokenExpiry, 5);

  // Refresh token calculations
  const refreshTokenExpiryDate = refreshTokenExpiry ? new Date(refreshTokenExpiry) : null;
  const refreshTokenTimeUntilExpiry = refreshTokenExpiryDate ? Math.max(0, refreshTokenExpiryDate.getTime() - now) : 0;
  const needsRefreshTokenRenewal = refreshTokenExpiry
    ? refreshTokenExpiryDate.getTime() - now <= 24 * 60 * 60 * 1000
    : false; // 24 hours

  return {
    // Backward compatibility properties (maintain existing behavior)
    isAuthenticated: true,
    timeUntilExpiry: jwtTimeUntilExpiry,
    needsRefresh: needsJwtRefresh,
    expiresAt: jwtExpiryDate,

    // New properties for Step 1: Enhanced token tracking
    jwtTimeUntilExpiry,
    refreshTokenTimeUntilExpiry,
    needsJwtRefresh,
    needsRefreshTokenRenewal,
  };
};

const authInterceptor = {
  proactiveTokenRefresh,
  isAuthenticated,
  getAuthStatus,
};

export default authInterceptor;
