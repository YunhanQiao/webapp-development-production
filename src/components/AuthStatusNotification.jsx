/**
 * @fileoverview AuthStatusNotification Component
 *
 * A floating notification component that shows authentication status and warns users
 * about potential session expiration to prevent data loss.
 *
 * Features:
 * - Floating status indicator
 * - Session expiry countdown
 * - Auto-refresh capabilities
 * - Dismissible warnings
 * - Configurable appearance and behavior
 *
 * @version 1.0.0
 * @author GitHub Copilot
 */

import React, { useState, useEffect } from "react";
import { Alert, Button, Badge } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldAlt, faExclamationTriangle, faSpinner, faTimes, faRefresh } from "@fortawesome/free-solid-svg-icons";
import useAuthProtection from "../auth/useAuthProtection";

/**
 * AuthStatusNotification - Shows authentication status and warnings
 *
 * @param {Object} props - Component props
 * @param {boolean} props.show - Whether to show the notification
 * @param {string} props.position - Position: 'top-right', 'top-left', 'bottom-right', 'bottom-left'
 * @param {boolean} props.showWhenSecure - Show notification even when auth is secure
 * @param {number} props.warningThreshold - Minutes before expiry to show warning
 * @param {Function} props.onDismiss - Callback when notification is dismissed
 *
 * @returns {JSX.Element|null} Notification component or null if hidden
 */
const AuthStatusNotification = ({
  show = true,
  position = "top-right",
  showWhenSecure = false,
  warningThreshold = 24 * 60, // 24 hours in minutes (Step 3: Changed from 10 minutes)
  onDismiss,
}) => {
  const [isDismissed, setIsDismissed] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);

  // Step 3: Get enhanced token tracking from useAuthProtection
  const {
    isAuthenticated,
    needsRefresh,
    timeUntilExpiry,
    isRefreshing,
    refreshToken,
    formatTimeUntilExpiry,
    // New Step 3 properties for refresh token notifications
    refreshTokenTimeUntilExpiry,
    needsRefreshTokenRenewal,
  } = useAuthProtection({
    enableProactiveRefresh: true,
    refreshInterval: 30000, // Check every 30 seconds for UI updates
  });

  // Step 3: Reset dismissal based on refresh token renewal, not JWT refresh
  useEffect(() => {
    if (!isAuthenticated) {
      setIsDismissed(false);
    }
    // Reset dismissed state if refresh token was successfully renewed (much more time remaining)
    if (refreshTokenTimeUntilExpiry > 48 * 60 * 60 * 1000) {
      // Reset only if more than 48 hours remaining (indicates successful refresh token renewal)
      setIsDismissed(false);
    }
  }, [isAuthenticated, refreshTokenTimeUntilExpiry]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (onDismiss) {
      onDismiss();
    }
  };

  const handleRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      const success = await refreshToken(true); // Pass true for manual refresh
      if (success) {
        // Don't auto-dismiss - let the component hide naturally when needsRefresh becomes false
      } else {
        console.warn("⚠️ Manual token refresh failed");
        const timeLeft = formatTimeUntilExpiry();
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
      console.error("❌ Manual token refresh error:", error);
      alert("Session refresh failed due to an error. Please save your work and log in again.");
    } finally {
      setIsManualRefreshing(false);
    }
  };

  // Step 3: Determine if we should show the notification based on REFRESH TOKEN expiry
  const shouldShow = () => {
    if (!show || isDismissed) return false;

    if (!isAuthenticated) return true;

    // Step 3: Show notification when refresh token is near expiry (NOT JWT expiry)
    if (needsRefreshTokenRenewal) return true;

    // Show if refresh token expiring within warning threshold (24 hours)
    const hoursUntilRefreshTokenExpiry = refreshTokenTimeUntilExpiry / (1000 * 60 * 60);
    if (hoursUntilRefreshTokenExpiry <= warningThreshold / 60) return true;

    return showWhenSecure;
  };

  // Step 3: Get notification style based on REFRESH TOKEN status (not JWT)
  const getVariant = () => {
    if (!isAuthenticated) return "danger";

    // Use refresh token renewal status instead of JWT refresh
    if (needsRefreshTokenRenewal) return "warning";

    const hoursUntilRefreshTokenExpiry = refreshTokenTimeUntilExpiry / (1000 * 60 * 60);
    if (hoursUntilRefreshTokenExpiry <= warningThreshold / 60) return "warning";

    return "success";
  };

  // Step 3: Get icon based on REFRESH TOKEN status (not JWT)
  const getIcon = () => {
    if (isRefreshing) return faSpinner;
    if (!isAuthenticated) return faExclamationTriangle;
    if (needsRefreshTokenRenewal) return faRefresh;
    return faShieldAlt;
  };

  // Get position styles
  const getPositionStyles = () => {
    const base = {
      position: "fixed",
      zIndex: 1060,
      maxWidth: "400px",
      minWidth: "300px",
    };

    switch (position) {
      case "top-left":
        return { ...base, top: "20px", left: "20px" };
      case "top-right":
        return { ...base, top: "20px", right: "20px" };
      case "bottom-left":
        return { ...base, bottom: "20px", left: "20px" };
      case "bottom-right":
        return { ...base, bottom: "20px", right: "20px" };
      default:
        return { ...base, top: "20px", right: "20px" };
    }
  };

  if (!shouldShow()) {
    return null;
  }

  const variant = getVariant();
  const icon = getIcon();

  return (
    <Alert
      variant={variant}
      style={getPositionStyles()}
      dismissible={variant !== "danger"}
      onClose={variant !== "danger" ? handleDismiss : undefined}
      className="shadow-sm"
    >
      <div className="d-flex align-items-center justify-content-between">
        <div className="d-flex align-items-center">
          <FontAwesomeIcon
            icon={icon}
            className={`me-2 ${isRefreshing ? "fa-spin" : ""}`}
            style={{ color: variant === "danger" ? "#dc3545" : variant === "warning" ? "#ffc107" : "#198754" }}
          />
          <div>
            <strong>
              {!isAuthenticated && "Session Expired"}
              {isAuthenticated && needsRefreshTokenRenewal && "Session Expiring Soon"}
              {isAuthenticated && !needsRefreshTokenRenewal && "Session Active"}
            </strong>
            {isAuthenticated && (
              <div className="small">
                {needsRefreshTokenRenewal ? (
                  <>
                    Session expires in:{" "}
                    <Badge bg="warning" text="dark">
                      {Math.round(refreshTokenTimeUntilExpiry / (1000 * 60 * 60))}h
                    </Badge>
                  </>
                ) : (
                  <>
                    Session expires in:{" "}
                    <Badge bg="secondary">{Math.round(refreshTokenTimeUntilExpiry / (1000 * 60 * 60 * 24))}d</Badge>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="d-flex align-items-center ms-2">
          {isAuthenticated && needsRefreshTokenRenewal && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleRefresh}
              disabled={isRefreshing || isManualRefreshing}
              className="me-2"
            >
              <FontAwesomeIcon icon={faRefresh} className={isRefreshing || isManualRefreshing ? "fa-spin" : ""} />
              {isManualRefreshing ? " Refreshing..." : isRefreshing ? " Refreshing..." : " Refresh"}
            </Button>
          )}

          {!isAuthenticated && (
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => (window.location.href = "/login")}
              className="me-2"
            >
              Log In
            </Button>
          )}

          {variant !== "danger" && (
            <Button variant="outline-secondary" size="sm" onClick={handleDismiss} title="Dismiss notification">
              <FontAwesomeIcon icon={faTimes} />
            </Button>
          )}
        </div>
      </div>

      {/* Detailed information (expandable) */}
      {isAuthenticated && (
        <div className="mt-2">
          <Button
            variant="link"
            size="sm"
            className="p-0 text-decoration-none"
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? "Hide" : "Show"} details
          </Button>

          {showDetails && (
            <div className="mt-2 small">
              <div>Status: {isAuthenticated ? "Authenticated" : "Not authenticated"}</div>
              <div>Needs refresh: {needsRefresh ? "Yes" : "No"}</div>
              <div>Time until expiry: {formatTimeUntilExpiry()}</div>
              {timeUntilExpiry > 0 && (
                <div>Expires at: {new Date(Date.now() + timeUntilExpiry).toLocaleTimeString()}</div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Critical warning for expired sessions */}
      {!isAuthenticated && (
        <div className="mt-2 small">
          <strong>⚠️ Important:</strong> Your session has expired. Any form submissions or data changes may be lost.
          Please log in again to continue safely.
        </div>
      )}
    </Alert>
  );
};

export default AuthStatusNotification;
