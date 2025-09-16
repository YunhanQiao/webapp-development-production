/**
 * @fileoverview Form Activity Context
 *
 * React context for tracking active form interactions to prevent
 * automatic redirects when users are working on forms.
 *
 * @version 1.0.0
 * @author GitHub Copilot
 */

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from "react";

const FormActivityContext = createContext({
  isFormActive: false,
  formData: {},
  registerFormActivity: () => {},
  unregisterFormActivity: () => {},
  hasFormData: () => false,
  clearFormData: () => {},
});

/**
 * Provider component for form activity tracking
 */
export const FormActivityProvider = ({ children }) => {
  const [isFormActive, setIsFormActive] = useState(false);
  const [formData, setFormData] = useState({});
  const [activeFormIds, setActiveFormIds] = useState(new Set());

  /**
   * Register a form as active (user is interacting with it)
   * @param {string} formId - Unique identifier for the form
   * @param {Object} data - Current form data to preserve
   */
  const registerFormActivity = useCallback((formId, data = {}) => {
    console.log("📝 Registering form activity:", formId, "with data:", Object.keys(data));

    setActiveFormIds(prev => {
      const newSet = new Set(prev);
      newSet.add(formId);
      return newSet;
    });

    setFormData(prev => ({
      ...prev,
      [formId]: data,
    }));

    setIsFormActive(true);
  }, []);

  /**
   * Unregister a form (user finished or left the form)
   * @param {string} formId - Unique identifier for the form
   */
  const unregisterFormActivity = useCallback(formId => {
    console.log("📝 Unregistering form activity:", formId);

    setActiveFormIds(prev => {
      const newSet = new Set(prev);
      newSet.delete(formId);
      return newSet;
    });

    setFormData(prev => {
      const { [formId]: removed, ...rest } = prev;
      return rest;
    });
  }, []);

  // Update isFormActive whenever activeFormIds changes
  useEffect(() => {
    setIsFormActive(activeFormIds.size > 0);
  }, [activeFormIds]);

  /**
   * Check if any form has data that would be lost
   * @returns {boolean} True if forms have data
   */
  const hasFormData = useCallback(() => {
    return Object.values(formData).some(data => data && typeof data === "object" && Object.keys(data).length > 0);
  }, [formData]);

  /**
   * Clear all form data (use after successful submission)
   */
  const clearFormData = useCallback(() => {
    console.log("🧹 Clearing all form data");
    setFormData({});
    setActiveFormIds(new Set());
    setIsFormActive(false);
  }, []);

  const value = {
    isFormActive,
    formData,
    registerFormActivity,
    unregisterFormActivity,
    hasFormData,
    clearFormData,
  };

  return <FormActivityContext.Provider value={value}>{children}</FormActivityContext.Provider>;
};

/**
 * Hook to access form activity context
 */
export const useFormActivity = () => {
  const context = useContext(FormActivityContext);
  if (!context) {
    throw new Error("useFormActivity must be used within a FormActivityProvider");
  }
  return context;
};

export default FormActivityContext;
