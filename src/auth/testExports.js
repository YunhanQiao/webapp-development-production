// Simple test to verify auth exports work
import useAuthProtection from "./useAuthProtection";
import AuthStatusNotification from "./AuthStatusNotification";
import { initializeAuthInterceptor } from "./authInterceptor";

console.log("Auth exports test:");
console.log("useAuthProtection:", typeof useAuthProtection);
console.log("AuthStatusNotification:", typeof AuthStatusNotification);
console.log("initializeAuthInterceptor:", typeof initializeAuthInterceptor);

export default function testAuthExports() {
  return "Auth exports working!";
}
