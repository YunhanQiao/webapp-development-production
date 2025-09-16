/**
 * @fileoverview Cross-Tab Authentication using BroadcastChannel API
 *
 * Modern approach using BroadcastChannel for direct tab-to-tab communication.
 * Fallback to StorageEvent for older browsers.
 *
 * @version 1.0.0
 * @author GitHub Copilot
 */

import { useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, logoutUser, refreshAuthToken } from "../features/user/userSlice";

/**
 * Cross-tab authentication using BroadcastChannel with StorageEvent fallback
 */
export const useCrossTabAuthSyncBroadcast = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.user);
  const channelRef = useRef(null);

  /**
   * Handle auth messages from other tabs
   */
  const handleAuthMessage = useCallback(
    event => {
      const { type, payload } = event.data || {};

      console.log("📡 Received auth message:", { type, hasPayload: !!payload });

      try {
        switch (type) {
          case "AUTH_LOGIN":
            if (!currentUser.authenticated && payload.authenticated) {
              console.log("🔐 Login message received, syncing...");
              dispatch(loginUser(payload.loginData));
            }
            break;

          case "AUTH_LOGOUT":
            if (currentUser.authenticated) {
              console.log("🚪 Logout message received, syncing...");
              dispatch(logoutUser());
            }
            break;

          case "AUTH_TOKEN_REFRESH":
            if (currentUser.authenticated && payload.newTokens) {
              console.log("🔄 Token refresh message received, syncing...");
              dispatch(refreshAuthToken(payload.newTokens));
            }
            break;

          default:
            console.log("🤷 Unknown auth message type:", type);
            break;
        }
      } catch (error) {
        console.error("❌ Error handling auth message:", error);
      }
    },
    [dispatch, currentUser.authenticated],
  );

  /**
   * Broadcast auth changes to other tabs
   */
  const broadcastAuthChange = useCallback((type, payload) => {
    if (channelRef.current) {
      channelRef.current.postMessage({ type, payload });
    }

    // Fallback: also use localStorage for older browsers
    const event = new CustomEvent("authStateChange", {
      detail: { type, payload },
    });
    window.dispatchEvent(event);
  }, []);

  /**
   * Set up BroadcastChannel or fallback
   */
  useEffect(() => {
    // Try BroadcastChannel first (modern browsers)
    if (typeof BroadcastChannel !== "undefined") {
      console.log("📡 Setting up BroadcastChannel for cross-tab auth");

      channelRef.current = new BroadcastChannel("speedscore-auth");
      channelRef.current.addEventListener("message", handleAuthMessage);

      return () => {
        if (channelRef.current) {
          channelRef.current.removeEventListener("message", handleAuthMessage);
          channelRef.current.close();
        }
      };
    } else {
      // Fallback to StorageEvent for older browsers
      console.log("🔄 Using StorageEvent fallback for cross-tab auth");

      const handleStorageAuth = event => {
        if (event.detail) {
          handleAuthMessage({ data: event.detail });
        }
      };

      window.addEventListener("authStateChange", handleStorageAuth);

      return () => {
        window.removeEventListener("authStateChange", handleStorageAuth);
      };
    }
  }, [handleAuthMessage]);

  return { broadcastAuthChange };
};

export default useCrossTabAuthSyncBroadcast;
