/**
 * @fileoverview Authentication Protection Hook
 *
 * React hook providing authentication protection for forms and components.
 * Prevents data loss by checking authentication before form submissions.
 *
 * Features:
 * - Pre-submission authentication checks
 * - Automatic token refresh attempts
 * - Form submission protection wrapper
 * - Real-time authentication status monitoring
 * - Customizable error handling
 *
 * @version 1.0.0
 * @author GitHub Copilot
 */

import { useState, useEffect, useCallback, useRef } from "react";
import { useSelector } from "react-redux";
import { getAuthStatus, proactiveTokenRefresh } from "./authInterceptor";

/**
 * Custom hook for authentication protection
 *
 * @param {Object} options - Configuration options
 * @param {boolean} options.enableProactiveRefresh - Enable automatic token refresh
 * @param {boolean} options.warnBeforeSubmit - Show warnings before form submission
 * @param {Function} options.onAuthLost - Callback when authentication is lost
 * @returns {Object} Authentication protection utilities
 */
const useAuthProtection = (options = {}) => {
  const { enableProactiveRefresh = true, warnBeforeSubmit = true, onAuthLost = null } = options;

  // Use ref to store the callback to avoid dependency issues
  const onAuthLostRef = useRef(onAuthLost);
  onAuthLostRef.current = onAuthLost;

  // Redux state for user authentication
  const user = useSelector(state => state.user);

  // Local state for real-time auth monitoring
  const [authStatus, setAuthStatus] = useState(() => getAuthStatus());
  const [lastRefreshAttempt, setLastRefreshAttempt] = useState(0);

  /**
   * Update authentication status
   */
  const updateAuthStatus = useCallback(() => {
    const status = getAuthStatus();

    // Step 3 Testing: Check for global test override
    let finalStatus = status;
    if (typeof window !== "undefined" && window.getAuthStatus && window.getAuthStatus !== getAuthStatus) {
      // Use the overridden function for testing
      finalStatus = window.getAuthStatus();
    }

    setAuthStatus(prevStatus => {
      // Call onAuthLost callback if authentication was lost
      if (!finalStatus.isAuthenticated && prevStatus.isAuthenticated && onAuthLostRef.current) {
        onAuthLostRef.current();
      }
      return finalStatus;
    });
  }, []);

  /**
   * Format time until expiry as human-readable string
   */
  const formatTimeUntilExpiry = useCallback(() => {
    const { timeUntilExpiry } = authStatus;

    if (!timeUntilExpiry || timeUntilExpiry <= 0) {
      return "Expired";
    }

    const minutes = Math.floor(timeUntilExpiry / (1000 * 60));
    const seconds = Math.floor((timeUntilExpiry % (1000 * 60)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }, [authStatus]);

  /**
   * Check authentication before form submission
   *
   * @param {Object} options - Check options
   * @param {Function} options.onAuthFail - Callback when auth check fails
   * @returns {Promise<boolean>} True if safe to submit, false otherwise
   */
  const checkAuthBeforeSubmit = useCallback(
    async (checkOptions = {}) => {
      const { onAuthFail = null } = checkOptions;

      updateAuthStatus();
      const currentStatus = getAuthStatus();

      // If not authenticated, fail immediately
      if (!currentStatus.isAuthenticated) {
        console.warn("🚨 Form submission blocked: User not authenticated");
        if (onAuthFail) onAuthFail();
        return false;
      }

      // If token needs refresh, try to refresh it
      if (currentStatus.needsRefresh) {
        console.log("🔄 Token needs refresh before submission, attempting refresh...");

        const refreshSuccess = await proactiveTokenRefresh(true); // Manual refresh for form submissions
        setLastRefreshAttempt(Date.now());

        if (!refreshSuccess) {
          console.error("🚨 Form submission blocked: Token refresh failed");
          if (onAuthFail) onAuthFail();
          return false;
        }

        console.log("✅ Token refreshed successfully, submission can proceed");
      }

      // Show warning if configured
      if (warnBeforeSubmit && currentStatus.timeUntilExpiry < 2 * 60 * 1000) {
        // Less than 2 minutes
        const proceed = window.confirm(
          `⚠️ SESSION EXPIRING SOON ⚠️\n\n` +
            `Your session expires in ${formatTimeUntilExpiry()}.\n\n` +
            `If your session expires during submission, your data will be protected!\n` +
            `Just open a new tab, log in, return here, and submit again.\n\n` +
            `Do you want to continue with the submission now?`,
        );

        if (!proceed) {
          console.log("ℹ️ Form submission cancelled by user");
          return false;
        }
      }

      return true;
    },
    [updateAuthStatus, warnBeforeSubmit, formatTimeUntilExpiry],
  );

  /**
   * Protected form submission wrapper
   *
   * @param {Function} submitFunction - Async function to execute if auth is valid
   * @returns {Promise} Result of submission function or error
   */
  const protectedSubmit = useCallback(
    async submitFunction => {
      if (typeof submitFunction !== "function") {
        throw new Error("protectedSubmit requires a function argument");
      }

      const canSubmit = await checkAuthBeforeSubmit({
        onAuthFail: () => {
          throw new Error(
            "🔐 SESSION EXPIRED - BUT YOUR DATA IS SAFE! 🔐\n\n" +
              "✅ Your form data is protected and will NOT be lost.\n\n" +
              "📋 To continue:\n" +
              "1. Open a NEW TAB (Ctrl+T or Cmd+T)\n" +
              "2. Navigate to the login page (/login)\n" +
              "3. Log in with your credentials\n" +
              "4. Return to THIS TAB\n" +
              '5. Click "Save" again - your data will still be here!\n\n' +
              "💡 No need to re-enter anything!",
          );
        },
      });

      if (!canSubmit) {
        throw new Error(
          "🛡️ FORM SUBMISSION PROTECTED 🛡️\n\n" +
            "✅ Your data is safe and preserved.\n\n" +
            "📋 To submit your form:\n" +
            "1. Open a new tab and log in\n" +
            "2. Return here and try again\n" +
            "3. Your work will still be here!",
        );
      }

      // Execute the protected submission
      try {
        console.log("🛡️ Executing protected form submission");
        const result = await submitFunction();
        console.log("✅ Protected form submission completed successfully");
        return result;
      } catch (error) {
        console.error("❌ Protected form submission failed:", error);
        throw error;
      }
    },
    [checkAuthBeforeSubmit],
  );

  // Update auth status when user state changes
  useEffect(() => {
    const status = getAuthStatus();
    setAuthStatus(prevStatus => {
      // Call onAuthLost callback if authentication was lost
      if (!status.isAuthenticated && prevStatus.isAuthenticated && onAuthLostRef.current) {
        onAuthLostRef.current();
      }
      return status;
    });
  }, [user.tokens?.jwtToken, user.tokens?.jwtTokenExpiry]);

  // Set up periodic auth status updates
  useEffect(() => {
    if (!enableProactiveRefresh) return;

    const interval = setInterval(() => {
      // Avoid excessive refresh attempts
      const timeSinceLastRefresh = Date.now() - lastRefreshAttempt;
      if (timeSinceLastRefresh < 30000) {
        // Skip update if we just attempted a refresh
        return;
      }

      updateAuthStatus();
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [enableProactiveRefresh, lastRefreshAttempt, updateAuthStatus]);

  // Step 3 Testing: Listen for test events to force auth status updates
  useEffect(() => {
    const handleTestUpdate = event => {
      updateAuthStatus();
    };

    const handleTestRestore = event => {
      updateAuthStatus();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("authStatusTestUpdate", handleTestUpdate);
      window.addEventListener("authStatusTestRestore", handleTestRestore);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("authStatusTestUpdate", handleTestUpdate);
        window.removeEventListener("authStatusTestRestore", handleTestRestore);
      }
    };
  }, [updateAuthStatus]);

  return {
    // Authentication status
    isAuthenticated: authStatus.isAuthenticated,
    needsRefresh: authStatus.needsRefresh,
    timeUntilExpiry: authStatus.timeUntilExpiry,

    // Step 1 & 3: Enhanced token tracking
    jwtTimeUntilExpiry: authStatus.jwtTimeUntilExpiry,
    refreshTokenTimeUntilExpiry: authStatus.refreshTokenTimeUntilExpiry,
    needsJwtRefresh: authStatus.needsJwtRefresh,
    needsRefreshTokenRenewal: authStatus.needsRefreshTokenRenewal,

    // Utility functions
    formatTimeUntilExpiry,

    // Protection methods
    checkAuthBeforeSubmit,
    protectedSubmit,

    // Manual refresh trigger
    refreshToken: (isManual = true) => proactiveTokenRefresh(isManual),
  };
};

export default useAuthProtection;
