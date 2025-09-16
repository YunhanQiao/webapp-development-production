/**
 * @fileoverview Authentication System Exports
 *
 * Central export file for the authentication protection system.
 * Import everything you need from this single file.
 *
 * @version 1.0.0
 * @author GitHub Copilot
 */

import { initializeAuthInterceptor } from "./authInterceptor";

// Core authentication services
export { initializeAuthInterceptor } from "./authInterceptor";

// Authentication hooks
export { default as useAuthProtection } from "./useAuthProtection";
export { default as AuthStatusNotification } from "./AuthStatusNotification";

// Initialize the authentication interceptor when this module is loaded
initializeAuthInterceptor();
