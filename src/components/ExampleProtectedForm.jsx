/**
 * @fileoverview Example: Protected Form Component
 *
 * This is an example component showing how to use the authentication protection
 * system to prevent data loss from expired JWT tokens.
 *
 * Copy this pattern to your existing forms to add authentication protection.
 *
 * @version 1.0.0
 * @author GitHub Copilot
 */

import React, { useState } from "react";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import { useAuthProtection } from "../auth";

/**
 * Example protected form component
 *
 * This demonstrates how to:
 * 1. Check authentication before form submission
 * 2. Show authentication warnings to users
 * 3. Automatically refresh tokens when needed
 * 4. Protect against data loss
 */
const ExampleProtectedForm = () => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    // ... other form fields
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState("");

  // Use the authentication protection hook
  const { isAuthenticated, needsRefresh, formatTimeUntilExpiry, protectedSubmit, checkAuthBeforeSubmit } =
    useAuthProtection({
      enableProactiveRefresh: true,
      warnBeforeSubmit: true,
      onAuthLost: () => {
        setSubmitError("Your session has expired. Please save your work and log in again.");
      },
    });

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Example of manual authentication check before submission
   */
  const handleSubmitWithManualCheck = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      // Manual authentication check
      const canSubmit = await checkAuthBeforeSubmit({
        onAuthFail: () => {
          setSubmitError("Authentication check failed. Please log in again.");
        },
      });

      if (!canSubmit) {
        setSubmitError("Form submission cancelled for your protection.");
        return;
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));

      setSubmitSuccess("Form submitted successfully!");
      setFormData({ title: "", description: "" });
    } catch (error) {
      setSubmitError(error.message || "An error occurred while submitting the form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Example using the protectedSubmit wrapper
   */
  const handleSubmitWithWrapper = async e => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");
    setSubmitSuccess("");

    try {
      await protectedSubmit(async () => {
        // Your actual form submission logic here
        console.log("Submitting form data:", formData);

        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));

        setSubmitSuccess("Form submitted successfully with protection!");
        setFormData({ title: "", description: "" });
      });
    } catch (error) {
      setSubmitError(error.message || "An error occurred while submitting the form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mt-4">
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-header">
              <h3>Example Protected Form</h3>
              <small className="text-muted">
                This form demonstrates authentication protection to prevent data loss
              </small>
            </div>
            <div className="card-body">
              {/* Authentication Status Display */}
              <div className="mb-3">
                <Alert variant={isAuthenticated ? (needsRefresh ? "warning" : "success") : "danger"}>
                  <strong>Authentication Status:</strong>{" "}
                  {isAuthenticated ? (
                    <>
                      ✅ Authenticated
                      {needsRefresh && " (needs refresh)"}
                      <br />
                      <small>Session expires in: {formatTimeUntilExpiry()}</small>
                    </>
                  ) : (
                    "❌ Not authenticated"
                  )}
                </Alert>
              </div>

              {/* Error/Success Messages */}
              {submitError && (
                <Alert variant="danger" dismissible onClose={() => setSubmitError("")}>
                  {submitError}
                </Alert>
              )}

              {submitSuccess && (
                <Alert variant="success" dismissible onClose={() => setSubmitSuccess("")}>
                  {submitSuccess}
                </Alert>
              )}

              {/* The Form */}
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="Enter a title"
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Description</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter a description"
                  />
                </Form.Group>

                <div className="d-grid gap-2">
                  {/* Submit with manual check */}
                  <Button
                    variant="primary"
                    onClick={handleSubmitWithManualCheck}
                    disabled={isSubmitting || !formData.title.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Submitting...
                      </>
                    ) : (
                      "Submit with Manual Check"
                    )}
                  </Button>

                  {/* Submit with wrapper */}
                  <Button
                    variant="outline-primary"
                    onClick={handleSubmitWithWrapper}
                    disabled={isSubmitting || !formData.title.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Submitting...
                      </>
                    ) : (
                      "Submit with Protection Wrapper"
                    )}
                  </Button>
                </div>
              </Form>

              {/* Integration Instructions */}
              <div className="mt-4">
                <h5>How to integrate this into your forms:</h5>
                <ol className="small">
                  <li>
                    Import <code>useAuthProtection</code> from <code>'../auth'</code>
                  </li>
                  <li>Use the hook in your component</li>
                  <li>Choose between manual checking or the wrapper method</li>
                  <li>Handle authentication failures gracefully</li>
                  <li>Show authentication status to users when appropriate</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExampleProtectedForm;
