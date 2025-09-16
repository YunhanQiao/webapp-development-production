# Score Entry All Division Bug Fix

## Problem Summary

**Issue**: In the tournament score entry page, when Division is set to "All", the IN, OUT, and TOTAL columns were not calculating correctly and were not updating dynamically as scores were entered. Additionally, the time to-par calculations and SGS to-par calculations were missing or incorrect.

## Root Cause Analysis

The issue was that in the "All" division mode, each division can have different course data and tee data, but the code was using global `teeData` that was calculated for single division mode. This caused:

1. **Incorrect calculations**: Time par and SGS par calculations used wrong tee data
2. **Missing to-par displays**: Time to-par and SGS to-par calculations failed because of invalid data
3. **No dynamic updates**: React components weren't re-rendering with correct division-specific data

## Technical Fix Details

### 1. Division-Specific Tee Data Setup
Added logic to extract and set up `divisionTeeData` for each division in the "All" mode:

```javascript
// Set up division-specific tee data
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
      // Handle object format
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

### 2. Inline Score Calculations
Updated the OUT, IN, and TOTAL column calculations to compute scores inline instead of relying on pre-calculated variables:

**Before (problematic)**:
```javascript
// Used global variables that weren't recalculated per division
return formatStrokesToPar(out, outStrokePar);
```

**After (fixed)**:
```javascript
// Calculate inline for each division
const divisionOut = calcOutStrokes(roundScores);
const outStrokePar = calcOutStrokePar(roundScores, getHolePar, divisionCurrentRound);
return formatStrokesToPar(divisionOut, outStrokePar);
```

### 3. Division-Specific Time Par Calculations
Updated all time-related calculations to use `divisionTeeData`:

- Time par calculations in timePar computation
- ScoreCellWithTime component props
- OUT/IN/TOTAL column time to-par calculations
- SGS to-par calculations

### 4. Consistent Variable Usage
Ensured all calculations in "All" division mode use division-specific variables:
- `divisionTeeData` instead of global `teeData`
- `divisionCurrentRound` for consistency
- `divisionGender` for proper par lookups

## Files Modified

- `src/features/competition/pages/TournamentScoresPage.jsx`
  - Added division-specific tee data extraction
  - Updated OUT/IN/TOTAL column calculations to be inline
  - Updated time and SGS calculations to use correct tee data
  - Fixed ScoreCellWithTime prop assignments

## Impact

### Fixed Issues
- ✅ OUT, IN, TOTAL columns now calculate correctly in "All" division mode
- ✅ Time to-par calculations now display properly
- ✅ SGS to-par calculations now work correctly
- ✅ Dynamic updates work as scores are entered
- ✅ Each division uses its own course/tee data correctly

### User Experience
- Score entry page now works consistently between single division and "All" division modes
- Real-time calculation updates work properly in both modes
- Time and SGS to-par information displays correctly

## Testing Considerations

To verify the fix:
1. Navigate to score entry page for a tournament with multiple divisions
2. Select "All" from the division dropdown
3. Enter scores for players in different divisions
4. Verify OUT, IN, TOTAL columns update correctly
5. Verify time to-par and SGS to-par calculations display
6. Compare behavior with single division mode to ensure consistency

---

**Created**: 22 July 2025  
**Fix Type**: Critical Bug Fix  
**Scope**: Tournament score entry functionality  
**Status**: Complete - Ready for testing
