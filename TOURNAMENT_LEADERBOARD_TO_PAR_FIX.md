# TournamentLeaderboardPage "To Par" Column Fix

## Problem
The "To Par" column in the tournament leaderboard was displaying incorrect values. Instead of showing the player's performance relative to speedgolf par (stroke par + time par), it was showing incorrect calculations that didn't match the correct values shown in individual player scorecards.

## Root Cause
The issue was in the speedgolf par calculation within the `TournamentLeaderboardPage.jsx` file. The leaderboard was using an incorrect speedgolf par calculation:

```javascript
// INCORRECT - treating stroke par as pure seconds
const speedgolfParSeconds = totalStrokePar * 60 + totalTimePar;
```

However, the correct calculation (used in scorecards) properly handles the time components:

```javascript
// CORRECT - matches scorecard logic from calcTotalSGSToPar
const timeParMinutes = Math.floor(totalTimePar / 60);
const timeParSecondsRemainder = totalTimePar % 60;
const sgsParMinutes = totalStrokePar + timeParMinutes;
const speedgolfParSeconds = sgsParMinutes * 60 + timeParSecondsRemainder;
```

## Solution
Fixed the speedgolf par calculation to match the logic used in `calcTotalSGSToPar` from `parCalcUtils.js`, which is used by the scorecard modal and correctly calculates "To Par" values.

**Key Changes:**
1. Convert time par (in seconds) to minutes and seconds components
2. Add stroke par to time par minutes (speedgolf scoring: strokes become minutes)
3. Calculate final speedgolf par in seconds using the correct minute/second breakdown

## Speedgolf Scoring Formula
- **Speedgolf Score** = Strokes + Time
  - Where strokes are treated as minutes in the final display
  - Time is the actual round time in minutes:seconds
- **Speedgolf Par** = Stroke Par + Time Par (correctly decomposed)
- **To Par** = Actual Speedgolf Score - Speedgolf Par

## Files Modified
- `src/features/competition/pages/TournamentLeaderboardPage.jsx`
  - Fixed speedgolf par calculation in "All Divisions" view (lines ~625-629)
  - Fixed speedgolf par calculation in division-specific view (lines ~822-826)

## Testing Reference
After this fix, the "To Par" column should match exactly what's shown in individual player scorecard modals.

**Example Verification:**
- Player shoots 73 strokes in 54:49
- SGS = 127:49
- If scorecard shows +2:14, leaderboard should now also show +2:14
- Previously leaderboard incorrectly showed +55:49
