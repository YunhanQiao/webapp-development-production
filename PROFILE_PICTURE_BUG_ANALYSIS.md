# Profile Picture Bug Analysis & Backend Fix Requirements

## Problem Summary

**Issue**: User profile pictures are inconsistently displayed in tournament pages, showing default/fallback images instead of users' actual uploaded profile pictures.

**Specific Case**: Kathy Leppard's profile picture shows correctly in her user profile when logged in, but displays as a default image in tournament contexts (leaderboard, tee sheet, registrants list).

## Root Cause Analysis

### Investigation Findings

1. **Data Sync Issue**: Tournament player records contain stale profile picture URLs that don't reflect current user profile data.

2. **Console Log Evidence**:
   ```
   Leaderboard Player 5: {
     name: "Kathy Leppard",
     profilePic: "https://avatars.dicebear.com/api/human/hello1.svg", // ❌ Stale fallback URL
     personalInfo: undefined
   }
   
   // Compare to working player:
   Leaderboard Player 1: {
     name: "Chris Hundhausen", 
     profilePic: "https://speedscore-media.s3.us-east-1.amazonaws.com/profile-images/...", // ✅ Current S3 URL
     personalInfo: undefined
   }
   ```

3. **Auto-login shows correct data**:
   ```
   AutoLogin.js: profilePic: https://speedscore-media.s3.us-east-1.amazonaws.com/profile-images/c875d318-a4eb-4e4b-9cdd-4e3ce996aee4_1749011217878
   ```

### The Problem Pattern

- **User Profile Data**: Contains current, correct S3 profile picture URLs
- **Tournament Player Data**: Contains outdated dicebear fallback URLs from registration time
- **API Behavior**: Tournament endpoints serve stale player data instead of joining with current user profiles

## Backend Fix Requirements

### 1. Tournament API Endpoints to Update

The following endpoints need to be modified to always fetch current user profile data:

```
GET /api/competitions/u/{uniqueName}                    - Tournament details
GET /api/competitions/u/{uniqueName}/leaderboard       - Tournament leaderboard  
GET /api/competitions/u/{uniqueName}/teesheet          - Tournament tee sheet
```

### 2. Required Backend Changes

#### Option A: Real-time Join (Recommended)
Modify tournament APIs to join with current user collection data:

```javascript
// Example pseudo-code for leaderboard endpoint
const tournamentData = await Tournament.findOne({ uniqueName })
  .populate({
    path: 'players.userId',
    select: 'personalInfo.profilePic personalInfo.firstName personalInfo.lastName'
  });

// Merge current user data with tournament player data
tournamentData.players = tournamentData.players.map(player => ({
  ...player,
  profilePic: player.userId?.personalInfo?.profilePic || player.profilePic,
  // Always use current profile data, fallback to tournament record
}));
```

#### Option B: Background Sync Job
Create a scheduled job to periodically sync tournament player records:

```javascript
// Background job to update tournament player profile pictures
async function syncTournamentPlayerProfiles() {
  const tournaments = await Tournament.find({ status: 'active' });
  
  for (const tournament of tournaments) {
    for (const player of tournament.players) {
      const currentUser = await User.findById(player.userId);
      if (currentUser?.personalInfo?.profilePic !== player.profilePic) {
        player.profilePic = currentUser.personalInfo.profilePic;
      }
    }
    await tournament.save();
  }
}
```

### 3. Data Model Considerations

#### Current Issue
Tournament player records store denormalized user data that becomes stale:
```javascript
// Tournament.players schema (current - problematic)
{
  userId: ObjectId,
  playerName: String,
  profilePic: String,  // ❌ Gets stale over time
  homeCountry: String, // ❌ Gets stale over time
  // ... other denormalized data
}
```

#### Recommended Solution
Always join with user collection for display data:
```javascript
// Tournament.players schema (recommended)
{
  userId: ObjectId,           // ✅ Reference to user
  playerName: String,         // ✅ Can cache display name
  divisionName: String,       // ✅ Tournament-specific data
  registrationDate: Date,     // ✅ Tournament-specific data
  // Remove denormalized user profile data
}

// At query time, populate current user data
.populate({
  path: 'players.userId',
  select: 'personalInfo.profilePic personalInfo.homeCountry personalInfo.hometown'
})
```

## Frontend Improvements Implemented

While investigating, we implemented frontend improvements for better UX:

1. **Fallback Handling**: Detect broken dicebear URLs and show default images
2. **S3 URL Validation**: Prioritize valid S3 URLs over fallback URLs  
3. **Consistent Error Handling**: Graceful degradation when profile pictures fail to load

### Code Changes Made
```javascript
// Helper function to get best available profile picture
const getPlayerProfilePic = (player) => {
  // If we have a valid S3 URL, use it
  if (player.profilePic && player.profilePic.includes('speedscore-media.s3')) {
    return player.profilePic;
  }
  
  // If it's a dicebear fallback URL or missing, use default
  if (!player.profilePic || player.profilePic.includes('dicebear.com') || player.profilePic.includes('hello1.svg')) {
    return '/images/DefaultProfilePic.jpg';
  }
  
  // Otherwise use what we have
  return player.profilePic || '/images/DefaultProfilePic.jpg';
};
```

## Priority & Impact

**Priority**: High - Affects user experience and data accuracy
**Impact**: Medium - Some users see incorrect profile pictures in tournaments
**Scope**: All tournament public pages (detail, leaderboard, tee sheet)

## Testing Requirements

Once backend fixes are implemented:

1. **Verify Profile Picture Sync**: 
   - User updates profile picture
   - Tournament pages immediately reflect the change

2. **Test Data Consistency**:
   - Compare user profile data with tournament display data
   - Ensure no stale data is served

3. **Performance Testing**:
   - Measure impact of joins/population on API response times
   - Consider caching strategies if needed

## Files Modified (Frontend)

- `src/features/competition/publicPages/publicTournamentDetail.jsx`
- `src/features/competition/publicPages/publicTournamentLeaderboard.jsx` 
- `src/features/competition/publicPages/publicTournamentTeesheet.jsx`

---

**Created**: January 22, 2025  
**Status**: Backend fix required  
**Next Steps**: Implement backend tournament API modifications to join with current user profile data
