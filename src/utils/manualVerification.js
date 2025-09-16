import {
  convertDateToOffset,
  convertOffsetToDate,
  generateDayOptions,
  validateDayOffset,
  getTournamentDuration,
} from "./dateOffsetUtils.js";

/**
 * Phase 1.2: Manual Verification Test
 */
export const runManualVerification = () => {
  console.log("=== Phase 1.2: Manual Verification of Utility Functions ===");

  const tournamentStart = "2025-08-15";
  const tournamentEnd = "2025-08-17";

  console.log("1. Basic date-offset conversion:");
  console.log(`  Date '2025-08-15' -> Offset: ${convertDateToOffset("2025-08-15", tournamentStart)}`);
  console.log(`  Date '2025-08-16' -> Offset: ${convertDateToOffset("2025-08-16", tournamentStart)}`);
  console.log(`  Date '2025-08-17' -> Offset: ${convertDateToOffset("2025-08-17", tournamentStart)}`);

  console.log("2. Basic offset-date conversion:");
  console.log(`  Offset 0 -> Date: ${convertOffsetToDate(0, tournamentStart)}`);
  console.log(`  Offset 1 -> Date: ${convertOffsetToDate(1, tournamentStart)}`);
  console.log(`  Offset 2 -> Date: ${convertOffsetToDate(2, tournamentStart)}`);

  console.log("3. Generate day options for dropdown:");
  const options = generateDayOptions(tournamentStart, tournamentEnd);
  console.log("  Options:", options);

  console.log("4. Validate day offsets:");
  console.log(`  Offset 0 valid: ${validateDayOffset(0, tournamentStart, tournamentEnd)}`);
  console.log(`  Offset 1 valid: ${validateDayOffset(1, tournamentStart, tournamentEnd)}`);
  console.log(`  Offset 2 valid: ${validateDayOffset(2, tournamentStart, tournamentEnd)}`);
  console.log(`  Offset 3 valid: ${validateDayOffset(3, tournamentStart, tournamentEnd)}`);

  console.log("5. Tournament duration:");
  console.log(`  Duration: ${getTournamentDuration(tournamentStart, tournamentEnd)} days`);

  console.log("6. Round-trip accuracy test:");
  const testDate = "2025-08-16";
  const offset = convertDateToOffset(testDate, tournamentStart);
  const backToDate = convertOffsetToDate(offset, tournamentStart);
  console.log(`  '${testDate}' -> offset ${offset} -> '${backToDate}' (match: ${testDate === backToDate})`);

  console.log("7. Date object handling:");
  const dateObj = new Date("2025-08-16");
  const offsetFromDate = convertDateToOffset(dateObj, tournamentStart);
  const dateFromOffset = convertOffsetToDate(1, dateObj);
  console.log(`  Date object -> offset: ${offsetFromDate}`);
  console.log(`  Offset -> Date object start: ${dateFromOffset}`);

  console.log("✅ Phase 1.2 manual verification complete!");

  return {
    basicConversions: [
      convertDateToOffset("2025-08-15", tournamentStart),
      convertDateToOffset("2025-08-16", tournamentStart),
      convertDateToOffset("2025-08-17", tournamentStart),
    ],
    offsetConversions: [
      convertOffsetToDate(0, tournamentStart),
      convertOffsetToDate(1, tournamentStart),
      convertOffsetToDate(2, tournamentStart),
    ],
    dayOptions: options,
    roundTripAccuracy: testDate === backToDate,
    tournamentDuration: getTournamentDuration(tournamentStart, tournamentEnd),
  };
};
