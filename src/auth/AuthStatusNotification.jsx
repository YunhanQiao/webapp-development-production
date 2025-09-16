/**
 * @fileoverview Authentication Status Notification Component
 *
 * Displays a floating notification when user session is about to expire.
 * Provides countdown timer and manual refresh option.
 *
 * Features:
 * - Session expiry countdown timer
 * - Manual token refresh button
 * - Dismissible notification alerts
 * - Responsive design
 * - Auto-hide when session is healthy
 *
 * @version 1.0.0
 * @author GitHub Copilot
 */

import React, { useState, useEffect } from "react";
import { Alert, Button } from "react-bootstrap";
import useAuthProtection from "./useAuthProtection";

/**
 * Authentication status notification component
 *
 * Step 3 Update: Shows when refresh token is about to expire (weekly),
 * NOT when JWT expires (hourly)
 *
 * Shows when:
 * - User is authenticated
 * - Refresh token expires within 24 hours
 * - User hasn't dismissed the notification
 */
const AuthStatusNotification = () => {
  const {
    isAuthenticated,
    refreshToken,
    // Step 3: Use refresh token tracking instead of JWT tracking
    refreshTokenTimeUntilExpiry,
    needsRefreshTokenRenewal,
  } = useAuthProtection({
    enableProactiveRefresh: true,
  });

  const [isDismissed, setIsDismissed] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Step 3: Reset dismissed state based on refresh token, not JWT token
  useEffect(() => {
    if (!isAuthenticated) {
      setIsDismissed(false);
    }
    // Reset dismissed state if refresh token was successfully refreshed (much more time remaining)
    if (refreshTokenTimeUntilExpiry > 48 * 60 * 60 * 1000) {
      // Reset only if more than 48 hours remaining (indicates successful refresh token renewal)
      setIsDismissed(false);
    }
  }, [isAuthenticated, refreshTokenTimeUntilExpiry]);

  // Step 3: Show notification based on refresh token expiry (24 hour threshold), not JWT expiry
  const shouldShow = isAuthenticated && !isDismissed && needsRefreshTokenRenewal;

  // Step 3 Testing: Add debug logging
  useEffect(() => {
    if (typeof window !== "undefined" && window.getAuthStatus && refreshTokenTimeUntilExpiry !== undefined) {
      console.log("🧪 AuthStatusNotification render:", {
        isAuthenticated,
        isDismissed,
        needsRefreshTokenRenewal,
        refreshTokenTimeUntilExpiry,
        shouldShow,
        refreshTokenHours: Math.round((refreshTokenTimeUntilExpiry / (1000 * 60 * 60)) * 10) / 10,
      });
    }
  }, [isAuthenticated, isDismissed, needsRefreshTokenRenewal, refreshTokenTimeUntilExpiry, shouldShow]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const success = await refreshToken(true); // Pass true for manual refresh
      if (success) {
        // Refresh successful - notification will hide automatically when needsRefreshTokenRenewal becomes false
        console.log("✅ Manual session refresh successful");
      } else {
        // Refresh failed - show error message but don't auto-dismiss
        console.warn("⚠️ Manual session refresh failed");
        const timeLeft = formatRefreshTokenTimeUntilExpiry();
        const message =
          `Session refresh failed. This can happen when:\n\n` +
          `• Your refresh token has expired\n` +
          `• Server maintenance is in progress\n` +
          `• You've been logged in too long\n\n` +
          `Time remaining: ${timeLeft}\n\n` +
          `Please save your work and log in again to continue.`;
        alert(message);
      }
    } catch (error) {
      console.error("❌ Manual session refresh error:", error);
      alert("Session refresh failed due to an error. Please save your work and log in again.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
  };

  // Step 3: Helper function to format refresh token time until expiry
  const formatRefreshTokenTimeUntilExpiry = () => {
    if (refreshTokenTimeUntilExpiry <= 0) return "expired";

    const hours = Math.floor(refreshTokenTimeUntilExpiry / (1000 * 60 * 60));
    const minutes = Math.floor((refreshTokenTimeUntilExpiry % (1000 * 60 * 60)) / (1000 * 60));

    if (hours >= 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days !== 1 ? "s" : ""}`;
    } else if (hours > 0) {
      return `${hours} hour${hours !== 1 ? "s" : ""} ${minutes} min`;
    } else {
      return `${minutes} minute${minutes !== 1 ? "s" : ""}`;
    }
  };

  if (!shouldShow) {
    return null;
  }

  // Step 3: Determine alert variant based on refresh token time remaining
  const getAlertVariant = () => {
    if (refreshTokenTimeUntilExpiry <= 2 * 60 * 60 * 1000) {
      // 2 hours
      return "danger";
    } else if (refreshTokenTimeUntilExpiry <= 12 * 60 * 60 * 1000) {
      // 12 hours
      return "warning";
    } else {
      return "info";
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        zIndex: 9999,
        maxWidth: "400px",
        width: "100%",
      }}
    >
      <Alert variant={getAlertVariant()} dismissible onClose={handleDismiss} className="shadow-sm">
        <Alert.Heading className="h6 mb-2">⏰ Session Expiring Soon</Alert.Heading>

        <p className="mb-2 small">
          Your session will expire in <strong>{formatRefreshTokenTimeUntilExpiry()}</strong>.
          {refreshTokenTimeUntilExpiry <= 2 * 60 * 60 * 1000 && (
            <span className="text-danger">
              <br />
              <strong>Save your work immediately!</strong>
            </span>
          )}
          {refreshTokenTimeUntilExpiry <= 30 * 60 * 1000 && (
            <span className="text-warning">
              <br />
              <em>Session extension may not be possible at this point.</em>
            </span>
          )}
        </p>

        <div className="d-flex gap-2">
          <Button
            variant={getAlertVariant() === "danger" ? "danger" : "primary"}
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="d-flex align-items-center"
          >
            {isRefreshing ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Refreshing...
              </>
            ) : (
              <>🔄 Extend Session</>
            )}
          </Button>

          <Button variant="outline-secondary" size="sm" onClick={handleDismiss}>
            Dismiss
          </Button>
        </div>
      </Alert>
    </div>
  );
};

export default AuthStatusNotification;
