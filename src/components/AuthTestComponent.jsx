/**
 * @fileoverview Authentication Test Component
 *
 * Test component for manually testing authentication protection features.
 * Use this component to simulate various authentication scenarios.
 */

import React, { useState } from "react";
import { Button, Card, Alert, Form } from "react-bootstrap";
import useAuthProtection from "../auth/useAuthProtection";
import { useSelector, useDispatch } from "react-redux";
import { refreshAuthToken } from "../features/user/userSlice";

const AuthTestComponent = () => {
  const [testResult, setTestResult] = useState("");
  const [formData, setFormData] = useState("Test data to save");
  const dispatch = useDispatch();
  const user = useSelector(state => state.user.user);
  const userTokens = useSelector(state => state.user.tokens); // Get tokens from correct location

  const { isAuthenticated, needsRefresh, formatTimeUntilExpiry, protectedSubmit, checkAuthBeforeSubmit } =
    useAuthProtection({
      enableProactiveRefresh: true,
      warnBeforeSubmit: true,
      onAuthLost: () => {
        setTestResult("❌ Authentication lost detected!");
      },
    });

  // Test 1: Simulate token expiration
  const simulateTokenExpiry = () => {
    if (!userTokens?.jwtToken) {
      setTestResult("❌ Cannot simulate expiry: No JWT token found in user state");
      console.log("🧪 simulateTokenExpiry - Current tokens:", userTokens);
      return;
    }

    dispatch(
      refreshAuthToken({
        jwtToken: userTokens.jwtToken, // Keep existing token
        jwtTokenExpiry: new Date(Date.now() - 1000).toISOString(), // 1 second ago
        refreshToken: userTokens.refreshToken || null,
        refreshTokenExpiry: userTokens.refreshTokenExpiry || null,
      }),
    );
    setTestResult("🕐 Token set to expired - try submitting form now");
  };

  // Test 2: Simulate near expiry (5 minutes)
  const simulateNearExpiry = () => {
    if (!userTokens?.jwtToken) {
      setTestResult("❌ Cannot simulate expiry: No JWT token found in user state");
      console.log("🧪 simulateNearExpiry - Current tokens:", userTokens);
      return;
    }

    dispatch(
      refreshAuthToken({
        jwtToken: userTokens.jwtToken, // Keep existing token
        jwtTokenExpiry: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // 5 minutes from now
        refreshToken: userTokens.refreshToken || null,
        refreshTokenExpiry: userTokens.refreshTokenExpiry || null,
      }),
    );
    setTestResult("⚠️ Token set to expire in 5 minutes - notification should appear");
  };

  // Test 2.5: Simulate very near expiry (2 minutes)
  const simulateVeryNearExpiry = () => {
    console.log("🧪 simulateVeryNearExpiry - Current user:", user);
    console.log("🧪 simulateVeryNearExpiry - Current tokens:", userTokens);

    if (!userTokens?.jwtToken) {
      setTestResult("❌ Cannot simulate expiry: No JWT token found in user state");
      return;
    }

    try {
      dispatch(
        refreshAuthToken({
          jwtToken: userTokens.jwtToken, // Keep existing token
          jwtTokenExpiry: new Date(Date.now() + 2 * 60 * 1000).toISOString(), // 2 minutes from now
          refreshToken: userTokens.refreshToken || null,
          refreshTokenExpiry: userTokens.refreshTokenExpiry || null,
        }),
      );
      setTestResult("🚨 Token set to expire in 2 minutes - urgent notification should appear");
    } catch (error) {
      console.error("🚨 Error simulating token expiry:", error);
      setTestResult(`❌ Failed to simulate token expiry: ${error.message}`);
    }
  };

  // Test 2.7: Simulate imminent expiry (30 seconds) for visible notification
  const simulateImminentExpiry = () => {
    console.log("🧪 simulateImminentExpiry - Current tokens:", userTokens);

    if (!userTokens?.jwtToken) {
      setTestResult("❌ Cannot simulate expiry: No JWT token found in user state");
      return;
    }

    try {
      dispatch(
        refreshAuthToken({
          jwtToken: userTokens.jwtToken, // Keep existing token
          jwtTokenExpiry: new Date(Date.now() + 30 * 1000).toISOString(), // 30 seconds from now
          refreshToken: userTokens.refreshToken || null,
          refreshTokenExpiry: userTokens.refreshTokenExpiry || null,
        }),
      );
      setTestResult("🔥 Token set to expire in 30 seconds - red notification should appear immediately");
    } catch (error) {
      console.error("🚨 Error simulating token expiry:", error);
      setTestResult(`❌ Failed to simulate token expiry: ${error.message}`);
    }
  };

  // Test 3: Test protected form submission
  const testProtectedSubmission = async () => {
    setTestResult("🔄 Testing protected submission...");

    try {
      await protectedSubmit(async () => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setTestResult("✅ Protected submission successful!");
      });
    } catch (error) {
      setTestResult(`❌ Protected submission failed: ${error.message}`);
    }
  };

  // Test 4: Manual auth check
  const testAuthCheck = async () => {
    setTestResult("🔄 Checking authentication...");

    const canSubmit = await checkAuthBeforeSubmit({
      onAuthFail: () => {
        setTestResult("❌ Authentication check failed!");
      },
    });

    if (canSubmit) {
      setTestResult("✅ Authentication check passed!");
    }
  };

  // Test 5: Reset to normal expiry
  const resetTokenExpiry = () => {
    if (!userTokens?.jwtToken) {
      setTestResult("❌ Cannot reset expiry: No JWT token found in user state");
      console.log("🧪 resetTokenExpiry - Current tokens:", userTokens);
      return;
    }

    dispatch(
      refreshAuthToken({
        jwtToken: userTokens.jwtToken, // Keep existing token
        jwtTokenExpiry: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
        refreshToken: userTokens.refreshToken || null,
        refreshTokenExpiry: userTokens.refreshTokenExpiry || null,
      }),
    );
    setTestResult("🔄 Token reset to normal expiry (1 hour)");
  };

  // Test 6: Complete authentication failure (both JWT and refresh token invalid)
  const simulateCompleteAuthFailure = () => {
    console.log("🧪 simulateCompleteAuthFailure - Clearing all authentication");

    try {
      // Clear all tokens - this simulates complete authentication failure
      dispatch(
        refreshAuthToken({
          jwtToken: null,
          jwtTokenExpiry: null,
          refreshToken: null,
          refreshTokenExpiry: null,
        }),
      );
      setTestResult("💥 Complete authentication failure simulated - both tokens cleared");
    } catch (error) {
      console.error("🚨 Error simulating complete auth failure:", error);
      setTestResult(`❌ Failed to simulate complete auth failure: ${error.message}`);
    }
  };

  return (
    <div className="container mt-4">
      <Card>
        <Card.Header>
          <h3>🧪 Authentication Protection Test Suite</h3>
          <small className="text-muted">Use these tests to verify the authentication protection system</small>
        </Card.Header>
        <Card.Body>
          {/* Current Status */}
          <Alert variant={isAuthenticated ? (needsRefresh ? "warning" : "success") : "danger"}>
            <strong>Current Status:</strong>
            <br />
            📊 Authenticated: {isAuthenticated ? "✅ Yes" : "❌ No"}
            <br />⏰ Needs Refresh: {needsRefresh ? "⚠️ Yes" : "✅ No"}
            <br />
            🕐 Time Until Expiry: {formatTimeUntilExpiry()}
            <br />
            👤 User ID: {user?._id || "Not logged in"}
          </Alert>

          {/* Test Results */}
          {testResult && (
            <Alert variant="info">
              <strong>Test Result:</strong>
              <br />
              {testResult}
            </Alert>
          )}

          {/* Test Buttons */}
          <div className="row">
            <div className="col-md-6">
              <h5>🔧 Token Manipulation Tests</h5>
              <div className="d-grid gap-2 mb-3">
                <Button variant="warning" onClick={simulateTokenExpiry}>
                  1️⃣ Simulate Expired Token
                </Button>
                <Button variant="info" onClick={simulateNearExpiry}>
                  2️⃣ Simulate Near Expiry (5min)
                </Button>
                <Button variant="warning" onClick={simulateVeryNearExpiry}>
                  2.5️⃣ Simulate Very Near Expiry (2min)
                </Button>
                <Button variant="danger" onClick={simulateImminentExpiry}>
                  2.7️⃣ Simulate Imminent Expiry (30sec)
                </Button>
                <Button variant="success" onClick={resetTokenExpiry}>
                  3️⃣ Reset to Normal Expiry
                </Button>
                <Button variant="danger" onClick={simulateCompleteAuthFailure}>
                  💥 Complete Auth Failure
                </Button>
              </div>
            </div>

            <div className="col-md-6">
              <h5>🛡️ Protection Tests</h5>
              <div className="d-grid gap-2 mb-3">
                <Button variant="primary" onClick={testAuthCheck}>
                  4️⃣ Test Auth Check
                </Button>
                <Button variant="primary" onClick={testProtectedSubmission}>
                  5️⃣ Test Protected Submission
                </Button>
              </div>
            </div>
          </div>

          {/* Sample Form */}
          <hr />
          <h5>📝 Sample Protected Form</h5>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Test Data</Form.Label>
              <Form.Control
                value={formData}
                onChange={e => setFormData(e.target.value)}
                placeholder="Enter some test data"
              />
            </Form.Group>
            <Button variant="primary" onClick={testProtectedSubmission} disabled={!isAuthenticated}>
              Submit with Protection
            </Button>
          </Form>

          {/* Instructions */}
          <hr />
          <div className="small">
            <h6>📋 Testing Instructions:</h6>
            <ol>
              <li>
                <strong>Normal State:</strong> When logged in with valid token, all should work
              </li>
              <li>
                <strong>Near Expiry:</strong> Click "Simulate Near Expiry" → notification should appear
              </li>
              <li>
                <strong>Expired Token:</strong> Click "Simulate Expired Token" → submissions should fail gracefully
              </li>
              <li>
                <strong>Protection Test:</strong> Use protected submission with expired token → should show error
              </li>
              <li>
                <strong>Recovery:</strong> Click "Reset to Normal" → everything should work again
              </li>
            </ol>

            <h6>🔍 What to Look For:</h6>
            <ul>
              <li>AuthStatusNotification appears when near expiry</li>
              <li>Protected submissions fail gracefully when token expired</li>
              <li>Console shows authentication events (if debug enabled)</li>
              <li>No data loss during failed submissions</li>
              <li>Automatic token refresh attempts</li>
            </ul>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default AuthTestComponent;
