/**
 * @fileoverview ScoreControlsBar - Time data entry method selection and enforcement component.
 *
 * This component provides a dropdown interface for selecting different time data entry methods
 * in tournament scoring, with comprehensive validation, data protection, and method enforcement.
 * It serves as the UI enforcement point for the tournament time entry method detection system.
 *
 * **Key Features:**
 * - Dropdown selection for time data entry methods with dynamic option disabling
 * - Prevents switching between incompatible time entry methods when established data exists
 * - Warning dialog for unsaved data loss protection
 * - Real-time feedback about why certain options are disabled
 * - Support for three time entry methods: round start/finish, hole durations, and hole timestamps
 *
 * **Time Entry Method Enforcement:**
 * - Disables "Round start and finish time" when hole-by-hole data exists (saved or established)
 * - Disables "Hole-by-hole durations" when start/finish method is established
 * - Shows explanatory text for each disabled option
 * - Integrates with tournament-wide time entry method detection system
 *
 * **Data Protection:**
 * - Prevents accidental loss of unsaved hole time data
 * - Shows confirmation dialog when switching from hole times to start/finish mode
 * - Maintains data integrity across user interactions
 *
 * @component
 * @example
 * // Basic usage in tournament scoring interface
 * <ScoreControlsBar
 *   holeTimeMode="durations"
 *   onHoleTimeModeChange={handleModeChange}
 *   hasExistingHoleTimeData={false}
 *   hasUnsavedHoleTimeData={true}
 *   onClearUnsavedHoleTimeData={clearUnsavedData}
 *   establishedTimeEntryMethod="hole_by_hole"
 * />
 *
 * @example
 * // Tournament with established start/finish method - hole-by-hole option disabled
 * <ScoreControlsBar
 *   holeTimeMode="none"
 *   onHoleTimeModeChange={handleModeChange}
 *   establishedTimeEntryMethod="start_finish"
 * />
 *
 * @author GitHub Copilot
 * @version 2.1.0
 * @since 2025-01-18
 */

import React, { useState } from "react";

/**
 * ScoreControlsBar - Time data entry method selection and enforcement component.
 *
 * Renders a dropdown for selecting time data entry methods with comprehensive data protection
 * and enforcement features. Integrates with the tournament time entry method detection system
 * to prevent incompatible method switching and maintain data integrity.
 *
 * **Enforcement Logic:**
 * - Uses `establishedTimeEntryMethod` to disable incompatible options
 * - Uses `hasExistingHoleTimeData` for legacy saved data protection
 * - Shows warning dialogs for potentially destructive operations
 * - Provides clear user feedback about disabled options
 *
 * @param {Object} props - The component props
 * @param {string} props.holeTimeMode - Current time data entry mode ("none", "durations", "timestamps")
 * @param {Function} props.onHoleTimeModeChange - Callback for mode changes, receives new mode string
 * @param {boolean} [props.hasExistingHoleTimeData=false] - Whether saved hole time data exists (legacy protection)
 * @param {boolean} [props.hasUnsavedHoleTimeData=false] - Whether unsaved hole time data exists in current state
 * @param {Function|null} [props.onClearUnsavedHoleTimeData=null] - Callback to clear unsaved data, called before mode change
 * @param {string|null} [props.establishedTimeEntryMethod=null] - The established time entry method ("start_finish", "hole_by_hole", "timestamps", or null)
 * @param {boolean} [props.finalResults=false] - Whether this is in final results mode (read-only)
 * @returns {JSX.Element} The rendered ScoreControlsBar component with dropdown and optional warning dialog
 *
 * @see {@link TournamentScoresPage#getEstablishedTimeEntryMethod} For method detection logic
 * @see {@link TournamentScoresPage#handleHoleTimeModeChange} For enforcement implementation
 */
const ScoreControlsBar = ({
  holeTimeMode,
  onHoleTimeModeChange,
  hasExistingHoleTimeData = false,
  hasUnsavedHoleTimeData = false,
  onClearUnsavedHoleTimeData = null,
  establishedTimeEntryMethod = null,
  finalResults = false,
}) => {
  const [showWarningDialog, setShowWarningDialog] = useState(false);

  // Don't render the controls in final results mode
  if (finalResults) {
    return null;
  }

  /**
   * Handles time data entry mode changes with validation.
   * Shows warning dialog when switching to "none" mode with unsaved data.
   *
   * @param {string} newMode - The new time data entry mode
   */
  const handleHoleTimeModeChange = newMode => {
    // If switching to "none" and there's unsaved hole time data, show warning
    if (newMode === "none" && hasUnsavedHoleTimeData && !hasExistingHoleTimeData) {
      setShowWarningDialog(true);
    } else {
      onHoleTimeModeChange(newMode);
    }
  };

  /**
   * Handles confirmation to clear unsaved data and switch to "none" mode.
   * Closes the warning dialog, clears unsaved data, and changes mode.
   */
  const handleConfirmClearData = () => {
    setShowWarningDialog(false);
    if (onClearUnsavedHoleTimeData) {
      onClearUnsavedHoleTimeData();
    }
    onHoleTimeModeChange("none");
  };

  /**
   * Handles cancellation of data clearing operation.
   * Closes the warning dialog without making any changes.
   */
  const handleCancelClearData = () => {
    setShowWarningDialog(false);
    // Don't change the mode, keep it as is
  };
  return (
    <>
      <div className="d-flex align-items-center flex-wrap gap-4 mb-2">
        {/* Hole-by-Hole Time Data dropdown */}
        <div className="d-flex align-items-center">
          <label
            htmlFor="holeTimeMode"
            className="form-label fw-bold text-dark me-2 mb-0"
            style={{ fontSize: "0.9rem" }}
          >
            Time Data Entry Method:
          </label>
          <div className="position-relative">
            <select
              id="holeTimeMode"
              className="form-select form-select-sm"
              style={{ width: "auto", minWidth: "150px" }}
              value={holeTimeMode}
              onChange={e => handleHoleTimeModeChange(e.target.value)}
            >
              <option
                value="none"
                disabled={
                  hasExistingHoleTimeData ||
                  establishedTimeEntryMethod === "hole_by_hole" ||
                  establishedTimeEntryMethod === "timestamps"
                }
                style={{
                  color:
                    hasExistingHoleTimeData ||
                    establishedTimeEntryMethod === "hole_by_hole" ||
                    establishedTimeEntryMethod === "timestamps"
                      ? "#6c757d"
                      : "inherit",
                }}
              >
                Round start and finish time
                {hasExistingHoleTimeData
                  ? " (Disabled because players have saved hole time data)"
                  : establishedTimeEntryMethod === "hole_by_hole"
                    ? " (Disabled because tournament has hole-by-hole time data)"
                    : establishedTimeEntryMethod === "timestamps"
                      ? " (Disabled because tournament has timestamp data)"
                      : ""}
              </option>
              <option
                value="durations"
                disabled={establishedTimeEntryMethod === "start_finish" || establishedTimeEntryMethod === "timestamps"}
                style={{
                  color:
                    establishedTimeEntryMethod === "start_finish" || establishedTimeEntryMethod === "timestamps"
                      ? "#6c757d"
                      : "inherit",
                }}
              >
                Hole durations
                {establishedTimeEntryMethod === "start_finish"
                  ? " (Disabled because tournament has start/finish time data)"
                  : establishedTimeEntryMethod === "timestamps"
                    ? " (Disabled because tournament has timestamp data)"
                    : ""}
              </option>
              <option
                value="timestamps"
                disabled={true}
                style={{
                  color: "#6c757d",
                }}
              >
                Hole finish timestamps (Coming soon!)
              </option>
            </select>
          </div>
        </div>
      </div>

      {/* Warning Dialog */}
      {showWarningDialog && (
        <div
          className="modal fade show d-block"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered" style={{ margin: "auto" }}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Loss of Unsaved Data</h5>
              </div>
              <div className="modal-body">
                <p>If you choose 'Round start and finish time', you will lose unsaved hole time data. Proceed?</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={handleCancelClearData}>
                  Cancel
                </button>
                <button type="button" className="btn btn-danger" onClick={handleConfirmClearData}>
                  Yes, delete unsaved time data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ScoreControlsBar;
