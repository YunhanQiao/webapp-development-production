// Simple test to verify the hook can be imported and called
import React from "react";

// Test if we can import the hook
const TestCrossTabHook = () => {
  console.log("🧪 TestCrossTabHook component rendered");

  try {
    // Try to import the hook
    const { useCrossTabAuthSync } = require("../hooks/useCrossTabAuthSync");
    console.log("✅ Hook import successful");

    // Try to call the hook
    useCrossTabAuthSync();
    console.log("✅ Hook called successfully");
  } catch (error) {
    console.error("❌ Error with hook:", error);
  }

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        background: "red",
        color: "white",
        padding: "10px",
        zIndex: 9999,
      }}
    >
      Hook Test Component
    </div>
  );
};

export default TestCrossTabHook;
