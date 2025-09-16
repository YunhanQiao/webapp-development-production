/**
 * @fileoverview Cross-Tab Authentication Synchronization Hook
 *
 * Provides real-time authentication state synchronization across browser tabs
 * using the StorageEvent API. This ensures that login/logout actions in one tab
 * are immediately reflected in all other tabs.
 *
 * Features:
 * - Secure token sharing via localStorage
 * - Real-time cross-tab synchronization
 * - Automatic cleanup on logout
 * - No infinite loops or race conditions
 *
 * @version 1.0.0
 * @author GitHub Copilot
 */

import { useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, logoutUser } from "../features/user/userSlice";

/**
 * Cross-tab authentication synchronization hook
 *
 * Listens for auth state changes in other tabs and synchronizes the current tab.
 * Prevents infinite loops by checking if the current tab initiated the change.
 */
export const useCrossTabAuthSync = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user);

  /**
   * Handle storage events from other tabs
   */
  const handleStorageChange = useCallback(
    event => {
      // Handle any localStorage key changes that might indicate auth changes
      const isAuthRelated =
        event.key &&
        (event.key.includes("@") || // Email-based user keys
          event.key === "jwtToken" || // Direct token storage
          event.key === "authState" || // Generic auth state
          event.key === "auth-logout-signal"); // Explicit logout signal

      if (!isAuthRelated) return;

      try {
        // Handle explicit logout signal
        if (event.key === "auth-logout-signal" && event.newValue) {
          // Only process if we're authenticated and not already processing a logout
          if (currentUser.authenticated && !window.isProcessingCrossTabLogout) {
            window.isProcessingCrossTabLogout = true;
            setTimeout(() => {
              window.isProcessingCrossTabLogout = false;
            }, 1000);

            dispatch(logoutUser());
          }
          return;
        }

        // Handle logout in other tab (key was removed or set to null)
        if (event.oldValue && !event.newValue) {
          if (currentUser.authenticated) {
            // Use a flag to prevent recursive logout calls
            if (!window.isProcessingCrossTabLogout) {
              window.isProcessingCrossTabLogout = true;
              setTimeout(() => {
                window.isProcessingCrossTabLogout = false;
              }, 1000); // Reset flag after 1 second

              dispatch(logoutUser());
            }
          }
          return;
        }

        // Handle login/token update in other tab
        if (event.newValue) {
          try {
            const otherTabState = JSON.parse(event.newValue);

            // Only sync if other tab has valid auth and current tab doesn't,
            // or if tokens are different (refresh occurred)
            const shouldSync =
              (!currentUser.authenticated && otherTabState.authenticated) ||
              (currentUser.authenticated && currentUser.tokens.jwtToken !== otherTabState.tokens.jwtToken);

            if (shouldSync && otherTabState.authenticated && otherTabState.tokens?.jwtToken) {
              // Prevent recursive updates by checking if we're already processing
              if (!window.isProcessingCrossTabLogin) {
                window.isProcessingCrossTabLogin = true;
                setTimeout(() => {
                  window.isProcessingCrossTabLogin = false;
                }, 1000); // Reset flag after 1 second

                dispatch(
                  loginUser({
                    jwtToken: otherTabState.tokens.jwtToken,
                    jwtTokenExpiry: otherTabState.tokens.jwtTokenExpiry,
                    refreshToken: {
                      token: otherTabState.tokens.refreshToken,
                      expiresAt: otherTabState.tokens.refreshTokenExpiry,
                    },
                    accountInfo: otherTabState.user.accountInfo,
                    personalInfo: otherTabState.user.personalInfo,
                    speedgolfInfo: otherTabState.user.speedgolfInfo,
                    preferences: otherTabState.user.preferences,
                    buddies: otherTabState.user.buddies,
                    incomingBuddyRequests: otherTabState.user.incomingBuddyRequests,
                    outgoingBuddyRequests: otherTabState.user.outgoingBuddyRequests,
                    _id: otherTabState.user._id,
                  }),
                );
              }
            }
          } catch (parseError) {
            // If we can't parse the new value, it might be a direct logout signal
            // Non-auth related storage change, ignore silently
          }
        }
      } catch (error) {
        console.error("❌ Error handling cross-tab auth sync:", error);
      }
    },
    [dispatch, currentUser.authenticated, currentUser.tokens.jwtToken],
  );

  /**
   * Set up and clean up storage event listener
   */
  useEffect(() => {
    // Add event listener for storage changes
    window.addEventListener("storage", handleStorageChange);

    // Cleanup on unmount
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [
    handleStorageChange,
    currentUser.authenticated,
    currentUser.tokens?.jwtToken,
    currentUser.user?.accountInfo?.email,
  ]);
};

export default useCrossTabAuthSync;
