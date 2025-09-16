# Console Cleanup Tasks

Based on the console output analysis, here are the systematic changes needed to clean up debug messages and warnings:

## 1. Authentication Flow Console Messages
**Priority: High**
- [x] **userSlice.js:128** - Remove: `🚪 LOGOUT USER REDUCER - Starting logout process`
- [x] **userSlice.js:128** - Remove: `🗑️ Removing localStorage key: speedscore.live@gmail.com`
- [x] **userSlice.js:134** - Remove: `📢 Adding logout signal for cross-tab sync`
- [x] **userSlice.js:153** - Remove: `✅ Logout complete {user: {…}, isLoading: false, error: null, tokens: {…}, buddies: null, …}`
- [x] **useAuthProtection.js:198** - Remove: `🚨 Auth lost - calling onAuthLost callback`
- [x] **userSlice.js** - Remove: `🧹 Removed logout signal`
- [x] **userActions.js:42** - Remove: `LOGIN RESPONSE DATA: {jwtToken: '...', ...}`
- [x] **userActions.js:49** - Remove: `Setting cookie with expiry time: Sat Aug 16 2025 15:09:51 GMT-0700`

## 2. Rounds Management Console Messages
**Priority: Medium**
- [x] **roundSlice.js** - Remove: `Setting rounds in state (4) [{…}, {…}, {…}, {…}]`
- [x] **functions.js:142** - Remove repeated: `Selected course: undefined` (appears 3 times)

## 3. Course Autocomplete Console Messages
**Priority: Medium**
- [ ] **index.jsx:443** - Remove: `handler: key down handler : Shift`
- [ ] **index.jsx:443** - Remove: `handler: key down handler : P`
- [ ] **index.jsx:303** - Remove: `handler: autocomplete change handler`
- [ ] **services.js:46** - Remove debug output from Place ID lookup
- [ ] **places.js:77** - Address Google Places API deprecation warning (migrate to AutocompleteSuggestion)

## 4. Google Maps Loading Issues
**Priority: High - Affects Performance**
- [ ] **VM4723 main.js:183** - Fix: `Element with name "gmp-internal-google-attribution" already defined`
- [ ] **VM4723 main.js:183** - Fix: `Element with name "gmp-internal-dialog" already defined`
- [ ] **VM4723 main.js:183** - Fix: `Element with name "gmp-internal-element-support-verification" already defined`
- [ ] **VM4723 main.js:183** - Fix: `Element with name "gmp-internal-pin" already defined`
- [ ] **VM4723 main.js:265** - Fix: `You have included the Google Maps JavaScript API multiple times on this page`

## Implementation Strategy

### Phase 1: Authentication Console Cleanup (Safe)
1. Remove debug console messages from `userSlice.js`
2. Remove debug console messages from `userActions.js`
3. Remove debug console messages from `useAuthProtection.js`

### Phase 2: Rounds Management Console Cleanup (Safe)
1. Remove debug console messages from `roundSlice.js`
2. Remove debug console messages from `functions.js`

### Phase 3: Course Autocomplete Console Cleanup (Moderate Risk)
1. Remove debug console messages from autocomplete components
2. Remove debug console messages from services

### Phase 4: Google Maps Duplicate Loading Fix (High Risk)
1. Identify where Google Maps is being loaded multiple times
2. Implement single loading mechanism
3. Test autocomplete functionality thoroughly

### Phase 5: Google Places API Migration (Optional)
1. Migrate from deprecated `AutocompleteService` to `AutocompleteSuggestion`
2. Test thoroughly to ensure no functionality is lost
3. This can be deferred if it causes issues

## Testing Requirements
- [ ] Cross-tab authentication still works
- [ ] Course autocomplete works in Add Round dialog
- [ ] Course autocomplete works in Add Course dialog
- [ ] Database courses still appear in autocomplete suggestions
- [ ] Google Maps loads properly without duplicate warnings
- [ ] No functional regressions introduced

## Notes
- Focus on console cleanup first, leave Google Maps API migration for last
- Test each phase thoroughly before moving to the next
- If any phase breaks functionality, revert that specific change and document the issue
