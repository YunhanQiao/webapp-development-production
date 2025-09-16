# Tournament Score Entry "All Division" Mode Fixes

## Overview

This document details the comprehensive fixes implemented for the tournament score entry page when Division is set to "All". The fixes address multiple critical bugs that prevented proper functionality in multi-division tournaments.

## Issues Fixed

### 1. ❌ IN/OUT/TOTAL Column Calculation Bug
**Problem**: IN, OUT, and TOTAL columns were not calculating correctly and not updating dynamically as scores were entered.

**Root Cause**: Global `teeData` variable was being used for all divisions, but each division has different course and tee configurations.

**Solution**: 
- Added division-specific tee data extraction for each division
- Updated calculations to use inline computation instead of pre-calculated global variables
- Ensured each division uses its own course/tee data

### 2. ❌ Missing Time To-Par Calculations
**Problem**: Time to-par displays were missing or showing "ND" instead of proper calculations.

**Root Cause**: Time par calculations were using incorrect tee data from wrong division.

**Solution**: 
- Updated all time par calculations to use division-specific `divisionTeeData`
- Fixed ScoreCellWithTime component props to use correct tee data
- Updated OUT/IN/TOTAL column time calculations

### 3. ❌ Incorrect SGS To-Par Calculations  
**Problem**: SGS (Speedgolf Score) to-par calculations were incorrect due to wrong par values.

**Root Cause**: SGS calculations were using global tee data instead of division-specific data.

**Solution**:
- Updated SGS calculations to use division-specific par values
- Fixed time and stroke par lookups for accurate SGS computation

### 4. ❌ Save Button Not Enabling
**Problem**: Save button would not enable even when all scores and times were filled in.

**Root Cause**: `isSaveEnabled` function was looking for players in `tournament.divisions[].players` (which doesn't exist) instead of `tournament.players`.

**Solution**:
- Fixed player lookup to use `tournament.players` (where players are actually stored)
- Added division-specific validation for holes and round data
- Updated function to work correctly in both single division and "All" division modes

### 5. ❌ "Division Not Found" Error on Save
**Problem**: When saving scores in "All" division mode, got "Division not found" error.

**Root Cause**: Save function was looking for a division named "All" instead of finding the player's actual division.

**Solution**:
- Updated `handleSaveScores` to find player's actual division when `selectedDivision` is "All"
- Added proper division lookup logic using `tournament.players` and `findDivisionById`

### 6. ❌ "Invalid Time Calculations" Error on Save
**Problem**: Save operation failed with "Invalid time calculations" error.

**Root Cause**: Finish time calculation logic wasn't handling hole time mode properly.

**Solution**:
- Added dynamic finish time calculation based on time entry mode
- In hole time mode: Calculate finish time from hole times
- In start/finish mode: Use manually entered finish time
- Added better error messages for validation failures

### 7. ❌ Division Selection Reset After Save
**Problem**: After saving, page would switch from "All" to the first division.

**Root Cause**: Tournament data refresh after save triggered useEffect that reset division selection.

**Solution**:
- Modified useEffect to preserve current division selection when tournament data updates
- Only reset division if current selection no longer exists
- Prevents save-induced division switching

## Technical Implementation Details

### Division-Specific Tee Data Setup
```javascript
// Set up division-specific tee data for each division
let divisionTeeData = null;
if (divisionCourseData && divisionCurrentRound?.teeId) {
  const divisionTeesArray = divisionCourseData.tees;
  if (divisionTeesArray) {
    let filteredTeeData = null;
    if (Array.isArray(divisionTeesArray)) {
      filteredTeeData = divisionTeesArray.filter(tee => {
        return tee.id === divisionCurrentRound.teeId || tee._id === divisionCurrentRound.teeId;
      });
    } else if (typeof divisionTeesArray === "object") {
      filteredTeeData = Object.values(divisionTeesArray).filter(tee => {
        return tee.id === divisionCurrentRound.teeId || tee._id === divisionCurrentRound.teeId;
      });
    }
    if (filteredTeeData && Array.isArray(filteredTeeData) && filteredTeeData.length > 0) {
      divisionTeeData = filteredTeeData[0];
    }
  }
}
```

### Inline Score Calculations
```javascript
// Before (problematic)
return formatStrokesToPar(out, outStrokePar);

// After (fixed)
const divisionOut = calcOutStrokes(roundScores);
const outStrokePar = calcOutStrokePar(roundScores, getHolePar, divisionCurrentRound);
return formatStrokesToPar(divisionOut, outStrokePar);
```

### Save Button Validation Fix
```javascript
// Fixed player lookup to use correct data structure
if (selectedDivision === "All") {
  // FIX: Use tournament.players (where players are actually stored)
  const player = tournament.players?.find(p => p.userId === playerId);
  // ... get division-specific holes and round data
}
```

### Save Function Division Lookup Fix
```javascript
// Find the correct division for this player
let currentDivision;

if (selectedDivision === "All") {
  // In "All" division mode, find the player's actual division
  const tournamentPlayer = tournament.players?.find(p => p.userId === player.userId);
  if (tournamentPlayer) {
    currentDivision = findDivisionById(tournamentPlayer.division);
  }
} else {
  // In single division mode, find division by name
  currentDivision = tournament.divisions?.find(d => d.name === selectedDivision);
}
```

### Dynamic Finish Time Calculation
```javascript
// Calculate finish time based on the current mode
let finishTime;
if (showHoleTimes) {
  // In hole time mode, calculate finish time from hole times
  finishTime = calculateFinishTimeFromHoleTimes(startTime, roundHoleTimes);
} else {
  // In start/finish time mode, use the stored finish time
  finishTime = finishTimes[player.userId]?.[selectedRound] || "--:--";
}
```

### Division Selection Persistence
```javascript
// Check if currently selected division still exists (including "All")
const divisionExists = selectedDivision === "All" || 
                     tournament.divisions.some(d => d.name === selectedDivision);

// Only set division if no division is selected or if current selection no longer exists
// This prevents resetting to first division after save operations
if (!selectedDivision || !divisionExists) {
  // ... reset logic only when necessary
}
```

## Files Modified

- `src/features/competition/pages/TournamentScoresPage.jsx`
  - Added division-specific tee data extraction and setup
  - Updated all score calculation logic to use inline computation
  - Fixed save button validation (`isSaveEnabled` function)
  - Fixed save function division lookup (`handleSaveScores` function)
  - Added proper finish time calculation logic
  - Fixed division selection persistence after saves
  - Added comprehensive JSDoc documentation

## Impact

### ✅ Fixed Functionality
- OUT, IN, TOTAL columns now calculate correctly in "All" division mode
- Time to-par calculations display properly for all divisions
- SGS to-par calculations work correctly with proper par values
- Save button enables correctly when all data is complete
- Save operations work without "Division not found" errors
- Save operations work without "Invalid time calculations" errors
- Division selection persists after save operations

### ✅ User Experience Improvements
- Score entry page now works consistently between single and "All" division modes
- Real-time calculation updates work properly in both modes
- Clear error messages help users understand validation requirements
- No unexpected division switching during score entry workflow

### ✅ Code Quality Improvements
- Comprehensive JSDoc documentation for all modified functions
- Better error handling with specific validation messages
- Consistent data handling patterns across single and multi-division modes
- Removed unused functions (cleanup)

## Testing Verification

To verify all fixes:

1. **Navigation**: Go to tournament score entry page with multiple divisions
2. **Division Selection**: Select "All" from division dropdown
3. **Score Entry**: Enter scores for players in different divisions
4. **Real-time Updates**: Verify OUT, IN, TOTAL columns update correctly as scores are entered
5. **To-Par Displays**: Verify time to-par and SGS to-par calculations display properly
6. **Save Button**: Verify save button enables when all data is complete
7. **Save Operation**: Save scores and verify no errors occur
8. **Division Persistence**: Verify page stays on "All" after save, doesn't switch to first division
9. **Cross-Division Comparison**: Compare behavior with single division mode for consistency

## Breaking Changes

None - all changes are backward compatible and enhance existing functionality.

## Dependencies

No new dependencies added. Uses existing tournament data structures and calculation functions.

---

**Created**: July 22, 2025  
**Fix Type**: Critical Bug Fixes  
**Scope**: Tournament score entry multi-division functionality  
**Status**: Complete ✅
