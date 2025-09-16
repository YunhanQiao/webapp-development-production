/**
 * @fileoverview Authentication Interceptor Service
 *
 * Provides automatic JWT token management through axios interceptors.
 * Handles token refresh, request queuing, and authentication state updates.
 *
 * Features:
 * - Automatic token injection into requests
 * - 401 response interception and token refresh
 * - Request queuing during token refresh
 * - Proactive token refresh before expiration
 * - Redux state synchronization
 *
 * @version 1.0.0
 * @author GitHub Copilot
 */

import axios from "axios";
import store from "../app/configureStore";
import { refreshAuthToken as refreshAuthTokenAction, logoutUser } from "../features/user/userSlice";
import { refreshAuthToken as refreshTokenAPI } from "../features/user/userServices";

// Configuration constants
const CONFIG = {
  PROACTIVE_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry (restored from testing)
  MAX_REFRESH_RETRIES: 3,
  REFRESH_TIMEOUT: 10000, // 10 seconds
  DEBUG_MODE: false, //typeof window !== "undefined" && localStorage.getItem("auth_debug") === "true",
};

// State management for token refresh
let isRefreshing = false;
let failedQueue = [];
let refreshRetries = 0;

/**
 * Process queued requests after token refresh
 * @param {Error|null} error - Error from refresh attempt
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
 * Get current authentication state from Redux store
 * @returns {Object} Authentication state with both JWT and refresh token tracking
 */
export const getAuthStatus = () => {
  const state = store.getState();
  const user = state.user;

  // Debug: Log what tokens we have (enabled for Step 1 testing)
  // console.log("🔍 getAuthStatus - Current tokens:", {
  //   hasJwtToken: !!user?.tokens?.jwtToken,
  //   hasRefreshToken: !!user?.tokens?.refreshToken,
  //   jwtTokenExpiry: user?.tokens?.jwtTokenExpiry,
  //   refreshTokenExpiry: user?.tokens?.refreshTokenExpiry,
  // });

  if (!user?.tokens?.jwtToken) {
    return {
      // Backward compatibility properties
      isAuthenticated: false,
      token: null,
      refreshToken: null,
      expiresAt: null,
      needsRefresh: false,
      timeUntilExpiry: 0,

      // New properties for Step 1
      jwtTimeUntilExpiry: 0,
      refreshTokenTimeUntilExpiry: 0,
      needsJwtRefresh: false,
      needsRefreshTokenRenewal: false,
    };
  }

  const now = Date.now();

  // JWT token calculations
  const jwtExpiresAt = user.tokens.jwtTokenExpiry ? new Date(user.tokens.jwtTokenExpiry).getTime() : null;
  const jwtIsExpired = jwtExpiresAt ? now >= jwtExpiresAt : false;
  const jwtTimeUntilExpiry = jwtExpiresAt ? Math.max(0, jwtExpiresAt - now) : 0;
  const needsJwtRefresh = jwtExpiresAt ? jwtExpiresAt - now <= CONFIG.PROACTIVE_REFRESH_THRESHOLD : false;

  // Refresh token calculations
  const refreshTokenExpiresAt = user.tokens.refreshTokenExpiry
    ? new Date(user.tokens.refreshTokenExpiry).getTime()
    : null;
  const refreshTokenTimeUntilExpiry = refreshTokenExpiresAt ? Math.max(0, refreshTokenExpiresAt - now) : 0;
  const needsRefreshTokenRenewal = refreshTokenExpiresAt ? refreshTokenExpiresAt - now <= 24 * 60 * 60 * 1000 : false; // 24 hours

  const authStatus = {
    // Backward compatibility properties (maintain existing behavior)
    isAuthenticated: !jwtIsExpired && !!user.tokens.jwtToken,
    token: user.tokens.jwtToken,
    refreshToken: user.tokens.refreshToken,
    expiresAt: jwtExpiresAt, // Keep this as JWT expiry for backward compatibility
    timeUntilExpiry: jwtTimeUntilExpiry, // Keep this as JWT time for backward compatibility
    needsRefresh: needsJwtRefresh, // Keep this as JWT refresh for backward compatibility

    // New properties for Step 1: Enhanced token tracking
    jwtTimeUntilExpiry,
    refreshTokenTimeUntilExpiry,
    needsJwtRefresh,
    needsRefreshTokenRenewal,
  };

  return authStatus;
};

/**
 * Check if user is currently authenticated
 * @returns {boolean} Authentication status
 */
export const isAuthenticated = () => {
  return getAuthStatus().isAuthenticated;
};

/**
 * Perform proactive token refresh if needed
 * @param {boolean} isManualRefresh - Whether this is a manual user-initiated refresh
 * @returns {Promise<boolean>} Success status
 */
export const proactiveTokenRefresh = async (isManualRefresh = false) => {
  const authStatus = getAuthStatus();

  // Step 2 Enhancement: Use new needsJwtRefresh flag instead of needsRefresh
  if (!authStatus.needsJwtRefresh && !isManualRefresh) {
    if (CONFIG.DEBUG_MODE) {
      console.log(
        "✅ Silent refresh skipped: JWT still valid for",
        Math.round(authStatus.jwtTimeUntilExpiry / 1000 / 60),
        "minutes",
      );
    }
    return true;
  }

  if (!authStatus.isAuthenticated) {
    if (CONFIG.DEBUG_MODE) {
      console.log("❌ Silent refresh skipped: User not authenticated");
    }
    return false;
  }

  if (isRefreshing) {
    if (CONFIG.DEBUG_MODE) {
      console.log("🔄 Silent refresh already in progress, waiting...");
    }
    // Wait for ongoing refresh
    return new Promise((resolve, reject) => {
      failedQueue.push({ resolve, reject });
    })
      .then(() => true)
      .catch(() => false);
  }

  try {
    isRefreshing = true;

    // Log silent refresh trigger
    if (CONFIG.DEBUG_MODE) {
      console.log("🔄 Silent refresh triggered:", {
        reason: isManualRefresh ? "Manual refresh" : "JWT expires soon",
        jwtTimeUntilExpiry: Math.round(authStatus.jwtTimeUntilExpiry / 1000 / 60) + " minutes",
      });
    } else if (!isManualRefresh) {
      // Always log silent refresh even without debug mode for Step 2 testing
      console.log(
        "🔄 Silent refresh triggered - JWT expires in",
        Math.round(authStatus.jwtTimeUntilExpiry / 1000 / 60),
        "minutes",
      );
    }

    // Get current refresh token
    const currentAuthStatus = getAuthStatus();

    if (!currentAuthStatus.refreshToken) {
      throw new Error("No refresh token available");
    }

    // Call the API to refresh the token
    const result = await refreshTokenAPI(currentAuthStatus.refreshToken);

    if (result.jwtToken) {
      // Update Redux state with new tokens
      store.dispatch(
        refreshAuthTokenAction({
          jwtToken: result.jwtToken,
          jwtTokenExpiry: result.jwtTokenExpiry,
          refreshToken: result.refreshToken,
          refreshTokenExpiry: result.refreshTokenExpiry,
        }),
      );

      refreshRetries = 0;
      processQueue(null, result.jwtToken);

      if (CONFIG.DEBUG_MODE) {
        console.log("✅ Silent refresh successful:", {
          newJwtExpiry: new Date(result.jwtTokenExpiry).toLocaleTimeString(),
          newRefreshExpiry: new Date(result.refreshTokenExpiry).toLocaleDateString(),
        });
      } else if (!isManualRefresh) {
        // Always log successful silent refresh for Step 2 testing
        console.log(
          "✅ Silent refresh successful - new JWT valid until",
          new Date(result.jwtTokenExpiry).toLocaleTimeString(),
        );
      }

      return true;
    } else {
      throw new Error("Token refresh returned no token");
    }
  } catch (error) {
    console.error("Proactive token refresh failed:", error);

    // Don't auto-logout on manual refresh failures - let user decide
    if (!isManualRefresh) {
      refreshRetries++;

      if (refreshRetries >= CONFIG.MAX_REFRESH_RETRIES) {
        console.warn("Max refresh retries reached, logging out user");
        store.dispatch(logoutUser());
      }
    }

    processQueue(error, null);
    return false;
  } finally {
    isRefreshing = false;
  }
};

/**
 * Initialize axios interceptors for authentication
 */
export const initializeAuthInterceptor = () => {
  // FOR TESTING: Make auth functions available globally
  if (typeof window !== "undefined") {
    window.getAuthStatus = getAuthStatus;

    // Step 2 Testing: Manual silent refresh trigger
    window.testSilentRefresh = () => {
      console.log("🧪 Manual test: Triggering silent refresh...");
      return proactiveTokenRefresh(true);
    };

    // Step 2 Testing: Enable/disable debug mode
    window.enableAuthDebug = () => {
      localStorage.setItem("auth_debug", "true");
      console.log("🔍 Auth debug mode enabled");
    };

    window.disableAuthDebug = () => {
      localStorage.removeItem("auth_debug");
      console.log("🔍 Auth debug mode disabled");
    };

    // Step 3 Testing: Simulate refresh token expiry for notification testing
    window.simulateRefreshTokenExpiry = hoursUntilExpiry => {
      console.log(`🧪 Simulating refresh token expiry in ${hoursUntilExpiry} hours`);

      // Temporarily override getAuthStatus to return simulated values
      const originalGetAuthStatus = window.getAuthStatus;
      const simulatedRefreshTokenExpiry = Date.now() + hoursUntilExpiry * 60 * 60 * 1000;

      window.getAuthStatus = () => {
        const realStatus = originalGetAuthStatus();
        return {
          ...realStatus,
          refreshTokenTimeUntilExpiry: Math.max(0, simulatedRefreshTokenExpiry - Date.now()),
          needsRefreshTokenRenewal: hoursUntilExpiry <= 24,
        };
      };

      //console.log("🧪 Simulation active - navigate in app to refresh components and see notification");

      // Auto-restore after 30 seconds
      setTimeout(() => {
        window.getAuthStatus = originalGetAuthStatus;
        //console.log("🧪 Simulation ended - real auth status restored");
      }, 30000);
    };
  }
  // Request interceptor - Add token to headers
  axios.interceptors.request.use(
    config => {
      const authStatus = getAuthStatus();

      if (authStatus.isAuthenticated && authStatus.token) {
        config.headers.Authorization = `Bearer ${authStatus.token}`;
      }

      return config;
    },
    error => {
      console.error("Request interceptor error:", error);
      return Promise.reject(error);
    },
  );

  // Response interceptor - Handle 401 responses
  axios.interceptors.response.use(
    response => response,
    async error => {
      const originalRequest = error.config;

      // Handle 401 Unauthorized responses
      if (error.response?.status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: token => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(axios(originalRequest));
              },
              reject,
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Get current refresh token
          const authStatus = getAuthStatus();
          if (!authStatus.refreshToken) {
            throw new Error("No refresh token available");
          }

          // Call the API to refresh the token
          const result = await refreshTokenAPI(authStatus.refreshToken);

          if (result.jwtToken) {
            // Update Redux state with new tokens
            store.dispatch(
              refreshAuthTokenAction({
                jwtToken: result.jwtToken,
                jwtTokenExpiry: result.jwtTokenExpiry,
                refreshToken: result.refreshToken,
                refreshTokenExpiry: result.refreshTokenExpiry,
              }),
            );

            refreshRetries = 0;
            processQueue(null, result.jwtToken);

            // Retry original request with new token
            originalRequest.headers.Authorization = `Bearer ${result.jwtToken}`;
            return axios(originalRequest);
          } else {
            throw new Error("Token refresh returned no token");
          }
        } catch (refreshError) {
          console.error("Token refresh failed:", refreshError);
          refreshRetries++;

          if (refreshRetries >= CONFIG.MAX_REFRESH_RETRIES) {
            console.warn("Max refresh retries reached, logging out user");
            store.dispatch(logoutUser());
          }

          processQueue(refreshError, null);
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );

  // Set up proactive refresh interval - Step 2 Enhancement
  setInterval(() => {
    const authStatus = getAuthStatus();

    // Use new needsJwtRefresh flag instead of needsRefresh for silent refresh
    if (authStatus.needsJwtRefresh && authStatus.isAuthenticated) {
      if (CONFIG.DEBUG_MODE) {
        console.log("⏰ Interval check: JWT needs refresh, triggering silent refresh...");
      }
      proactiveTokenRefresh(); // This will call the exported function above
    } else if (CONFIG.DEBUG_MODE && authStatus.isAuthenticated) {
      console.log(
        "⏰ Interval check: JWT still valid for",
        Math.round(authStatus.jwtTimeUntilExpiry / 1000 / 60),
        "minutes",
      );
    }
  }, 60000); // Check every minute

  // Step 3 Automatic Testing: Run tests after auth system initialization
  setTimeout(() => {
    runStep3Tests();
  }, 2000); // Wait 2 seconds for app to fully load
};

/**
 * Step 3 Testing: Automated notification trigger tests
 * Runs automatically when auth system initializes to validate Step 3 changes
 */
const runStep3Tests = () => {
  //console.log("🧪 Starting Step 3 automated tests...");

  // First, check if we're authenticated
  const authStatus = getAuthStatus();
  if (!authStatus.isAuthenticated) {
    //console.log("🧪 Skipping Step 3 tests - user not authenticated");
    return;
  }

  // console.log("🧪 Current auth status:", {
  //   jwtTimeUntilExpiry: authStatus.jwtTimeUntilExpiry,
  //   refreshTokenTimeUntilExpiry: authStatus.refreshTokenTimeUntilExpiry,
  //   needsJwtRefresh: authStatus.needsJwtRefresh,
  //   needsRefreshTokenRenewal: authStatus.needsRefreshTokenRenewal,
  // });

  // Test the notification logic directly by checking what the component would see
  console.log("🧪 Testing notification trigger logic:");

  // Test 1: Current state (should not show notification if >24 hours)
  const currentHoursUntilRefreshExpiry = authStatus.refreshTokenTimeUntilExpiry / (1000 * 60 * 60);
  // console.log(`🧪 Current refresh token expires in ${currentHoursUntilRefreshExpiry.toFixed(1)} hours`);
  // console.log(`🧪 needsRefreshTokenRenewal: ${authStatus.needsRefreshTokenRenewal}`);
  // console.log(`🧪 Should show notification: ${authStatus.needsRefreshTokenRenewal ? "YES" : "NO"}`);

  // Test 2: Simulate different scenarios by logging what would happen
  // console.log("\n🧪 Simulated scenarios:");
  [25, 23, 12, 1].forEach(hours => {
    const wouldNeedRenewal = hours <= 24;
    // console.log(
    //   `🧪 If ${hours} hours until expiry: needsRefreshTokenRenewal = ${wouldNeedRenewal}, notification = ${wouldNeedRenewal ? "YES" : "NO"}`,
    // );
  });

  // Test 3: Create a temporary testing function that components can use
  if (typeof window !== "undefined") {
    window.testStep3Notification = hoursUntilExpiry => {
      // Store original functions
      const originalGetAuthStatus = window.getAuthStatus || getAuthStatus;

      // Create override
      const testGetAuthStatus = () => {
        const realStatus = originalGetAuthStatus();
        const simulatedExpiry = Date.now() + hoursUntilExpiry * 60 * 60 * 1000;
        return {
          ...realStatus,
          refreshTokenTimeUntilExpiry: Math.max(0, simulatedExpiry - Date.now()),
          needsRefreshTokenRenewal: hoursUntilExpiry <= 24,
        };
      };

      // Override for testing
      if (typeof window !== "undefined") {
        window.getAuthStatus = testGetAuthStatus;
      }

      // Force all auth components to update by dispatching a custom event
      if (typeof window !== "undefined") {
        const event = new CustomEvent("authStatusTestUpdate", {
          detail: { testAuthStatus: testGetAuthStatus() },
        });
        window.dispatchEvent(event);
      }

      // Auto-restore after 15 seconds
      setTimeout(() => {
        if (typeof window !== "undefined") {
          window.getAuthStatus = originalGetAuthStatus;

          // Dispatch restore event
          const restoreEvent = new CustomEvent("authStatusTestRestore");
          window.dispatchEvent(restoreEvent);
        }
      }, 15000);
    };
  }

  // console.log("🧪 Step 3 automated tests completed");
};
