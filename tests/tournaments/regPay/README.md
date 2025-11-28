# Tournament Registration & Payment - Test Suite

This directory contains E2E tests for the Tournament Registration & Payment tab functionality.

## Test Files Overview

| Test File | Test Count | Status | Focus Area |
|-----------|-----------|--------|------------|
| `TournamentRegPay.save.spec.js` | 4 | ✅ All Passing | Button functionality (Previous, Cancel, Save & Exit, Save & Next) |
| `TournamentRegPay.checkboxes.spec.js` | 4 | ✅ All Passing | Checkbox functionality (Entry Fee, Swag, Size selections) |
| **TOTAL** | **8** | **All Passing** | **Core RegPay functionality** |

---

## 1. TournamentRegPay.save.spec.js (4 tests)

Tests all button functionality in the Registration & Payment tab with database verification.

### Button Functionality Tests

- **TEST 1**: Previous Button
  - Returns to Basic Info tab
  - Verifies aria-selected attribute
  - Cleans up test tournament from database

- **TEST 2**: Cancel Changes & Exit Button
  - Returns to competitions list without saving RegPay changes
  - Basic Info data remains saved (from prerequisite)
  - Cleans up test tournament from database

- **TEST 3**: Save & Exit Button
  - TEST 3-a: Navigated back to competitions list
  - TEST 3-b: Tournament appears in list after save
  - TEST 3-c: Registration & Payment data saved in database
  - Cleans up test tournament from database

- **TEST 4**: Save & Next Button
  - TEST 4-a: Advances to Color & Theme tab
  - TEST 4-b: Success message shown after Save & Next
  - TEST 4-c: All fields preserved after Save & Next
  - TEST 4-d: Registration & Payment data saved in database
  - Cleans up test tournament from database

**Prerequisites:**
- Each test creates a tournament in Basic Info tab first (required dependency)
- Fills: Tournament Name, Start Date, End Date
- Uses "Save & Next" to navigate to RegPay tab

**Database Integration:**
- Connects to MongoDB production database
- Verifies `regPayInfo.regStartDate` and `regPayInfo.regEndDate` are saved
- Automatic cleanup after each test using `cleanupTestTournament()`
- Error handling with cleanup in catch block

**Test Data:**
- Tournament Name: `E2E RegPay Save Test ${timestamp}`
- Basic Info Dates: 2026-06-01 to 2026-06-05
- Registration Dates: Various (2026-05-01 to 2026-05-31, etc.)
- Withdrawal Date: 2026-05-25 or 2026-05-28

---

## 2. TournamentRegPay.checkboxes.spec.js (4 tests)

Tests all checkbox functionality in the Registration & Payment tab.

### TEST 1: Entry Fee Checkbox (Pay Through App)
- **TEST 1-a**: Checkbox starts unchecked
- **TEST 1-b**: Can check the checkbox
- **TEST 1-c**: Processing fields enabled when checkbox checked
  - `#processingPercent` becomes enabled
  - `#processingFee` becomes enabled
- **TEST 1-d**: Can uncheck the checkbox

### TEST 2: Swag Checkbox
- **TEST 2-a**: Checkbox starts unchecked
- **TEST 2-b**: Can check the checkbox
- **TEST 2-c**: Swag name field enabled when checkbox checked
  - `#swagName` becomes visible/enabled
- **TEST 2-d**: Can uncheck the checkbox

### TEST 3: Swag Size Checkboxes (7 sizes)
- **TEST 3-a**: All 7 swag size checkboxes exist and are visible
  - Sizes: XS, S, M, L, XL, XXL, XXXL
  - Each has corresponding label with correct text
- **TEST 3-b**: Can check individual size checkboxes (S, M, L)
- **TEST 3-c**: Can uncheck individual size checkboxes (S, M, L)
- **TEST 3-d**: Can check multiple size checkboxes simultaneously
  - Tests checking: XS, M, XL, XXL
- **TEST 3-e**: Can check all 7 size checkboxes
- **TEST 3-f**: Can uncheck all size checkboxes

### TEST 4: Checkbox State Persistence
- Multiple checkboxes can be checked simultaneously
- All maintain their checked state
- Tests: Entry Fee + Swag + Size checkboxes (M, L, XL)

**Prerequisites:**
- Creates test tournament in Basic Info tab first
- Tournament Name: "Checkbox Test Tournament"
- Dates: 2026-06-01 to 2026-06-05
- Navigates to RegPay tab via "Save & Next"

**Checkbox IDs:**
- `#payThroughApp` - Entry Fee checkbox
- `#askSwag` - Swag checkbox
- `#XS`, `#S`, `#M`, `#L`, `#XL`, `#XXL`, `#XXXL` - Size checkboxes

---

## Running the Tests

### Run all RegPay tests:
```bash
npx playwright test tests/tournaments/regPay/
```

### Run specific test file:
```bash
npx playwright test tests/tournaments/regPay/TournamentRegPay.save.spec.js
npx playwright test tests/tournaments/regPay/TournamentRegPay.checkboxes.spec.js
```

### Run specific test:
```bash
npx playwright test tests/tournaments/regPay/TournamentRegPay.save.spec.js --grep "TEST 1"
```

### Run tests in headed mode (see browser):
```bash
npx playwright test tests/tournaments/regPay/ --headed
```

### Debug a specific test:
```bash
npx playwright test tests/tournaments/regPay/TournamentRegPay.checkboxes.spec.js --debug
```

---

## Test Prerequisites

1. **Backend server** must be running on `http://localhost:4000`
2. **Frontend server** must be running on `http://localhost:3000`
3. **Test user account** must exist:
   - Email: `seal-osu@gmail.com`
   - Password: `GoodLuck2025!`
4. **Database connection** (for save tests):
   - MongoDB Atlas connection
   - Backend models loaded from `/Users/yunhanqiao/Desktop/SpeedScore-backend/src/models/index.js`

---

## Test Architecture

### Helper Functions
All test files share common helper functions:
- `loginWithCredentials(page)` - Logs in test user
- `dismissInitialAlerts(page)` - Closes any alert messages
- `navigateToRegPayTab(page)` - Navigates to RegPay tab (includes Basic Info prerequisite)

### Database Functions (save.spec.js only)
- `connectToDatabase()` - Establishes MongoDB connection
- `disconnectFromDatabase()` - Closes database connection
- `verifyRegPayInfoInDB(name, startDate, endDate)` - Verifies data in database
- `cleanupTestTournament(name)` - Removes test tournament from database

### Test Organization
- Each test has a unique number (TEST 1, TEST 2, etc.)
- Tests with multiple validations use sub-labels (TEST 3-a, TEST 3-b, etc.)
- Console logging confirms each test passes with numbered labels
- Tests are independent and can run in any order

