# Tournament Basic Info - Test Suite

This directory contains E2E tests for the Tournament Basic Info tab functionality.

## Test Files Overview

| Test File | Test Count | Status | Focus Area |
|-----------|-----------|--------|------------|
| `TournamentBasicInfo.name.spec.js` | 11 | ✅ All Passing | Tournament name validation and short name generation |
| `TournamentBasicInfo.dates.spec.js` | 12 | ✅ All Passing | Date validation and tee time management |
| `TournamentBasicInfo.uploads.spec.js` | 3 | ✅ All Passing | File upload functionality (logo, PDFs) |
| `TournamentBasicInfo.save.spec.js` | 3 | ✅ All Passing | Save, Cancel, and Save & Next button functionality |
| **TOTAL** | **29** | **All Passing** | **Core Basic Info functionality** |

---

## 1. TournamentBasicInfo.name.spec.js (11 tests)

Tests tournament name validation and short name generation algorithm.

### Required Field Validation (2 tests)
- **TEST 1**: Accept name with exactly 4 characters
- **TEST 2**: Accept name with more than 4 characters

### Short Name Generation Algorithm (5 tests)
- **TEST 3**: Show 'New Tournament' as default header
- **TEST 4**: Generate short name from two-word tournament name
- **TEST 5**: Generate short name from single-word tournament name
- **TEST 6**: Generate short name from three-word tournament name
- **TEST 7**: Generate short name from multi-word tournament name

### Year Handling (2 tests)
- **TEST 8**: Update short name year when start date year changes
  - TEST 8-a: Short name shows year 25 for 2025 date
  - TEST 8-b: Short name updates to year 26 for 2026 date
  - TEST 8-c: Short name updates back to year 25 for 2025 date
- **TEST 9**: Show two-digit year in short name

### Uniqueness Handling (1 test)
- **TEST 10**: Update short name when tournament name changes
  - TEST 10-a: 'Spring Open' generates 'SO25'
  - TEST 10-b: 'Summer Championship' generates 'SC25'
  - TEST 10-c: 'Fall Tournament' generates 'FT25'

### Display and UI (1 test)
- **TEST 11**: Preserve name value during form interaction
  - TEST 11-a: Name value preserved after filling dates
  - TEST 11-b: Name value preserved after filling tee time

---

## 2. TournamentBasicInfo.dates.spec.js (12 tests)

Tests date validation and tee time management functionality.

### Validation Tests (6 tests)
- **TEST 1**: Start date required validation
- **TEST 2**: End date required validation
- **TEST 3**: Correct tee time count for date range
- **TEST 4**: Default tee times to 07:00
- **TEST 5**: Modifying tee times
- **TEST 6**: Tee times update when date range changes

### Display Format Tests (3 tests)
- **TEST 7**: Date display in mm/dd/yyyy format
- **TEST 8**: Date picker input types (type="date")
- **TEST 9**: End date min attribute matches start date

### Edge Cases (3 tests)
- **TEST 10**: Single-day tournament handling
- **TEST 11**: Multi-week tournament (14 days)
- **TEST 12**: Date changes preserve other form data

---

## 3. TournamentBasicInfo.uploads.spec.js (3 tests)

Tests file upload button functionality for logo and PDF documents.

### Upload Functionality Tests
- **TEST 1**: Logo PNG upload - verifies file input value changes
- **TEST 2**: Rules PDF upload - verifies "Test.pdf" appears in display field
- **TEST 3**: Prizes PDF upload - verifies second "Test.pdf" appears in display field

**Test Files Used:**
- `test-image.png` - PNG logo file for testing image uploads
- `Test.pdf` - PDF file for testing document uploads

**Notes:**
- No database connection required - only tests UI upload functionality
- Additional Info PDF (4th upload) works in real app but not testable via Playwright
- Verification method: Checks if uploaded filename appears in input field value

---

## 4. TournamentBasicInfo.save.spec.js (3 tests)

Tests Save, Cancel, and Save & Next button functionality with database verification.

### Button Functionality Tests
- **TEST 1**: Cancel Button
  - Returns to competitions list without saving
  
- **TEST 2**: Save & Exit Button
  - TEST 2-a: Navigated back to competitions list
  - TEST 2-b: Tournament appears in list after save
  - TEST 2-c: Tournament data saved in database
  
- **TEST 3**: Save & Next Button
  - TEST 3-a: Advances to Registration & Payment tab
  - TEST 3-b: Success message shown after Save & Next
  - TEST 3-c: All fields preserved after Save & Next
  - TEST 3-d: Tournament data saved in database

**Notes:**
- Requires database connection for verification
- Tests include cleanup to remove test tournaments from database

---

## Running the Tests

### Run all Basic Info tests:
```bash
npx playwright test tests/tournaments/basicInfo/
```

### Run specific test file:
```bash
npx playwright test tests/tournaments/basicInfo/TournamentBasicInfo.name.spec.js
npx playwright test tests/tournaments/basicInfo/TournamentBasicInfo.dates.spec.js
npx playwright test tests/tournaments/basicInfo/TournamentBasicInfo.uploads.spec.js
npx playwright test tests/tournaments/basicInfo/TournamentBasicInfo.save.spec.js
```

### Run specific test:
```bash
npx playwright test tests/tournaments/basicInfo/TournamentBasicInfo.name.spec.js --grep "TEST 1"
```

### Run tests in headed mode (see browser):
```bash
npx playwright test tests/tournaments/basicInfo/ --headed
```

### Debug a specific test:
```bash
npx playwright test tests/tournaments/basicInfo/TournamentBasicInfo.name.spec.js --debug
```

---

## Test Prerequisites

1. **Backend server** must be running on `http://localhost:4000`
2. **Frontend server** must be running on `http://localhost:3000`
3. **Test user account** must exist:
   - Email: `seal-osu@gmail.com`
   - Password: `GoodLuck2025!`
4. **Test files** must exist:
   - `tests/tournaments/basicInfo/Test.pdf`
   - `tests/tournaments/basicInfo/test-image.png`

---

## Test Architecture

### Helper Functions
All test files share common helper functions:
- `loginWithCredentials(page)` - Logs in test user
- `dismissInitialAlerts(page)` - Closes any alert messages
- `navigateToBasicInfoTab(page)` - Navigates to Basic Info tab

### Test Organization
- Each test has a unique number (TEST 1, TEST 2, etc.)
- Tests with multiple validations use sub-labels (TEST 2-a, TEST 2-b, etc.)
- Console logging confirms each test passes with numbered labels
- Tests are independent and can run in any order


