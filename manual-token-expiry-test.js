// Manual Token Expiry Test
// Paste this in browser console to manually expire your token

// Method 1: Set token expiry to now
localStorage.setItem("jwtTokenExpiry", Date.now().toString());

// Method 2: Clear token entirely
localStorage.removeItem("jwtToken");
localStorage.removeItem("jwtTokenExpiry");

// Then try to submit a form - it should be protected!
console.log("Token expired! Try submitting a form now.");
