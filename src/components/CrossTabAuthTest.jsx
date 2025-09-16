/**
 * @fileoverview Test Component for Cross-Tab Authentication
 *
 * Simple component to test and debug cross-tab authentication synchronization.
 * Shows current auth state and provides manual login/logout buttons.
 *
 * @version 1.0.0
 * @author GitHub Copilot
 */

import React from "react";
import { useSelector, useDispatch } from "react-redux";
import { loginUser, logoutUser } from "../features/user/userSlice";

const CrossTabAuthTest = () => {
  const dispatch = useDispatch();
  const user = useSelector(state => state.user);

  const handleTestLogin = () => {
    // Simulate a login with test data
    dispatch(
      loginUser({
        jwtToken: "test-jwt-token-" + Date.now(),
        jwtTokenExpiry: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
        refreshToken: {
          token: "test-refresh-token-" + Date.now(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
        },
        accountInfo: {
          email: "test@example.com",
          name: "Test User",
        },
        personalInfo: {
          firstName: "Test",
          lastName: "User",
        },
        _id: "test-user-id",
        buddies: [],
        incomingBuddyRequests: [],
        outgoingBuddyRequests: [],
      }),
    );
  };

  const handleTestLogout = () => {
    dispatch(logoutUser());
  };

  // Only show in development
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        background: "#f8f9fa",
        border: "1px solid #dee2e6",
        borderRadius: "8px",
        padding: "15px",
        zIndex: 9999,
        minWidth: "300px",
        fontSize: "12px",
      }}
    >
      <h6 style={{ margin: "0 0 10px 0", color: "#495057" }}>🔄 Cross-Tab Auth Test</h6>

      <div style={{ marginBottom: "10px" }}>
        <strong>Status:</strong> {user.authenticated ? "✅ Authenticated" : "❌ Not Authenticated"}
      </div>

      {user.authenticated && (
        <div style={{ marginBottom: "10px" }}>
          <strong>User:</strong> {user.user?.accountInfo?.email || "Unknown"}
        </div>
      )}

      <div style={{ marginBottom: "10px" }}>
        <strong>Token:</strong> {user.tokens?.jwtToken ? `${user.tokens.jwtToken.substring(0, 20)}...` : "None"}
      </div>

      <div style={{ display: "flex", gap: "10px" }}>
        <button
          onClick={handleTestLogin}
          style={{
            padding: "5px 10px",
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "11px",
          }}
        >
          Test Login
        </button>

        <button
          onClick={handleTestLogout}
          style={{
            padding: "5px 10px",
            background: "#dc3545",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "11px",
          }}
        >
          Test Logout
        </button>
      </div>

      <div style={{ marginTop: "10px", fontSize: "10px", color: "#6c757d" }}>
        Tab ID: {Math.random().toString(36).substr(2, 9)}
      </div>
    </div>
  );
};

export default CrossTabAuthTest;
