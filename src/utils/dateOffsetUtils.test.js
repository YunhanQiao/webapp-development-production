/**
 * Unit tests for Tournament Division Date Offset Utilities
 *
 * Tests all conversion functions and edge cases for the hybrid date approach
 *
 * @author GitHub Copilot
 * @created August 17, 2025
 */

import {
  convertDateToOffset,
  convertOffsetToDate,
  generateDayOptions,
  validateDayOffset,
  convertRoundsToOffsets,
  convertRoundsToAbsoluteDates,
  getTournamentDuration,
} from "../utils/dateOffsetUtils";

describe("dateOffsetUtils", () => {
  // Test data
  const tournamentStart = "2025-08-15";
  const tournamentEnd = "2025-08-17";

  describe("convertDateToOffset", () => {
    test("converts start date to offset 0", () => {
      expect(convertDateToOffset("2025-08-15", tournamentStart)).toBe(0);
    });

    test("converts dates to correct offsets", () => {
      expect(convertDateToOffset("2025-08-16", tournamentStart)).toBe(1);
      expect(convertDateToOffset("2025-08-17", tournamentStart)).toBe(2);
    });

    test("handles Date objects", () => {
      const date = new Date("2025-08-16");
      const startDate = new Date(tournamentStart);
      expect(convertDateToOffset(date, startDate)).toBe(1);
    });

    test("handles dates before tournament start (returns 0)", () => {
      expect(convertDateToOffset("2025-08-14", tournamentStart)).toBe(0);
    });

    test("handles missing parameters gracefully", () => {
      expect(convertDateToOffset(null, tournamentStart)).toBe(0);
      expect(convertDateToOffset("2025-08-15", null)).toBe(0);
      expect(convertDateToOffset(null, null)).toBe(0);
    });

    test("handles invalid dates gracefully", () => {
      expect(convertDateToOffset("invalid-date", tournamentStart)).toBe(0);
      expect(convertDateToOffset("2025-08-15", "invalid-date")).toBe(0);
    });
  });

  describe("convertOffsetToDate", () => {
    test("converts offset 0 to start date", () => {
      expect(convertOffsetToDate(0, tournamentStart)).toBe("2025-08-15");
    });

    test("converts offsets to correct dates", () => {
      expect(convertOffsetToDate(1, tournamentStart)).toBe("2025-08-16");
      expect(convertOffsetToDate(2, tournamentStart)).toBe("2025-08-17");
    });

    test("handles Date object as start date", () => {
      const startDate = new Date(tournamentStart);
      expect(convertOffsetToDate(1, startDate)).toBe("2025-08-16");
    });

    test("handles negative offsets (returns start date)", () => {
      expect(convertOffsetToDate(-1, tournamentStart)).toBe("2025-08-15");
    });

    test("handles missing parameters gracefully", () => {
      expect(convertOffsetToDate(null, tournamentStart)).toBe("2025-08-15");
      expect(convertOffsetToDate(1, null)).toBe("");
      expect(convertOffsetToDate("invalid", tournamentStart)).toBe("2025-08-15");
    });

    test("handles invalid start date gracefully", () => {
      expect(convertOffsetToDate(1, "invalid-date")).toBe("");
    });
  });

  describe("generateDayOptions", () => {
    test("generates correct options for date range", () => {
      const options = generateDayOptions(tournamentStart, tournamentEnd);

      expect(options).toHaveLength(3);
      expect(options[0]).toEqual({
        value: 0,
        label: "Day 1 (8/15/2025)",
        date: "2025-08-15",
      });
      expect(options[1]).toEqual({
        value: 1,
        label: "Day 2 (8/16/2025)",
        date: "2025-08-16",
      });
      expect(options[2]).toEqual({
        value: 2,
        label: "Day 3 (8/17/2025)",
        date: "2025-08-17",
      });
    });

    test("handles single day tournament", () => {
      const options = generateDayOptions("2025-08-15", "2025-08-15");

      expect(options).toHaveLength(1);
      expect(options[0]).toEqual({
        value: 0,
        label: "Day 1 (8/15/2025)",
        date: "2025-08-15",
      });
    });

    test("handles Date objects", () => {
      const start = new Date("2025-08-15");
      const end = new Date("2025-08-16");
      const options = generateDayOptions(start, end);

      expect(options).toHaveLength(2);
      expect(options[0].value).toBe(0);
      expect(options[1].value).toBe(1);
    });

    test("handles invalid date range (end before start)", () => {
      const options = generateDayOptions("2025-08-17", "2025-08-15");
      expect(options).toEqual([]);
    });

    test("handles missing parameters gracefully", () => {
      expect(generateDayOptions(null, tournamentEnd)).toEqual([]);
      expect(generateDayOptions(tournamentStart, null)).toEqual([]);
      expect(generateDayOptions(null, null)).toEqual([]);
    });

    test("handles invalid dates gracefully", () => {
      expect(generateDayOptions("invalid-date", tournamentEnd)).toEqual([]);
      expect(generateDayOptions(tournamentStart, "invalid-date")).toEqual([]);
    });
  });

  describe("validateDayOffset", () => {
    test("validates offsets within range", () => {
      expect(validateDayOffset(0, tournamentStart, tournamentEnd)).toBe(true);
      expect(validateDayOffset(1, tournamentStart, tournamentEnd)).toBe(true);
      expect(validateDayOffset(2, tournamentStart, tournamentEnd)).toBe(true);
    });

    test("rejects offsets outside range", () => {
      expect(validateDayOffset(-1, tournamentStart, tournamentEnd)).toBe(false);
      expect(validateDayOffset(3, tournamentStart, tournamentEnd)).toBe(false);
      expect(validateDayOffset(10, tournamentStart, tournamentEnd)).toBe(false);
    });

    test("handles single day tournament", () => {
      expect(validateDayOffset(0, "2025-08-15", "2025-08-15")).toBe(true);
      expect(validateDayOffset(1, "2025-08-15", "2025-08-15")).toBe(false);
    });

    test("handles invalid parameters", () => {
      expect(validateDayOffset("invalid", tournamentStart, tournamentEnd)).toBe(false);
      expect(validateDayOffset(1, null, tournamentEnd)).toBe(false);
      expect(validateDayOffset(1, tournamentStart, null)).toBe(false);
      expect(validateDayOffset(1, "invalid-date", tournamentEnd)).toBe(false);
    });
  });

  describe("convertRoundsToOffsets", () => {
    test("converts round dates to offsets", () => {
      const rounds = [
        { date: "2025-08-15", format: "Speedgolf", courseId: "course1" },
        { date: "2025-08-17", format: "Sprintgolf", courseId: "course2" },
      ];

      const result = convertRoundsToOffsets(rounds, tournamentStart);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        date: "2025-08-15",
        format: "Speedgolf",
        courseId: "course1",
        dayOffset: 0,
      });
      expect(result[1]).toEqual({
        date: "2025-08-17",
        format: "Sprintgolf",
        courseId: "course2",
        dayOffset: 2,
      });
    });

    test("handles rounds without date field", () => {
      const rounds = [
        { format: "Speedgolf", courseId: "course1" },
        { date: "2025-08-16", format: "Sprintgolf", courseId: "course2" },
      ];

      const result = convertRoundsToOffsets(rounds, tournamentStart);

      expect(result).toHaveLength(2);
      expect(result[0].dayOffset).toBe(0); // Default for missing date
      expect(result[1].dayOffset).toBe(1);
    });

    test("handles invalid parameters", () => {
      expect(convertRoundsToOffsets(null, tournamentStart)).toEqual([]);
      expect(convertRoundsToOffsets([], null)).toEqual([]);
      expect(convertRoundsToOffsets("invalid", tournamentStart)).toEqual([]);
    });
  });

  describe("convertRoundsToAbsoluteDates", () => {
    test("converts round offsets to absolute dates", () => {
      const rounds = [
        { dayOffset: 0, format: "Speedgolf", courseId: "course1" },
        { dayOffset: 2, format: "Sprintgolf", courseId: "course2" },
      ];

      const result = convertRoundsToAbsoluteDates(rounds, tournamentStart);

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        dayOffset: 0,
        format: "Speedgolf",
        courseId: "course1",
        date: "2025-08-15",
      });
      expect(result[1]).toEqual({
        dayOffset: 2,
        format: "Sprintgolf",
        courseId: "course2",
        date: "2025-08-17",
      });
    });

    test("handles rounds without dayOffset field", () => {
      const rounds = [
        { format: "Speedgolf", courseId: "course1" },
        { dayOffset: 1, format: "Sprintgolf", courseId: "course2" },
      ];

      const result = convertRoundsToAbsoluteDates(rounds, tournamentStart);

      expect(result).toHaveLength(2);
      expect(result[0]).not.toHaveProperty("date"); // No conversion for missing offset
      expect(result[1].date).toBe("2025-08-16");
    });

    test("handles invalid parameters", () => {
      expect(convertRoundsToAbsoluteDates(null, tournamentStart)).toEqual([]);
      expect(convertRoundsToAbsoluteDates([], null)).toEqual([]);
      expect(convertRoundsToAbsoluteDates("invalid", tournamentStart)).toEqual([]);
    });
  });

  describe("getTournamentDuration", () => {
    test("calculates duration for multi-day tournament", () => {
      expect(getTournamentDuration(tournamentStart, tournamentEnd)).toBe(3);
    });

    test("calculates duration for single day tournament", () => {
      expect(getTournamentDuration("2025-08-15", "2025-08-15")).toBe(1);
    });

    test("handles Date objects", () => {
      const start = new Date("2025-08-15");
      const end = new Date("2025-08-17");
      expect(getTournamentDuration(start, end)).toBe(3);
    });

    test("handles missing parameters", () => {
      expect(getTournamentDuration(null, tournamentEnd)).toBe(0);
      expect(getTournamentDuration(tournamentStart, null)).toBe(0);
      expect(getTournamentDuration(null, null)).toBe(0);
    });

    test("handles invalid dates", () => {
      expect(getTournamentDuration("invalid-date", tournamentEnd)).toBe(0);
      expect(getTournamentDuration(tournamentStart, "invalid-date")).toBe(0);
    });
  });

  describe("Round-trip conversion accuracy", () => {
    test("date → offset → date conversion maintains accuracy", () => {
      const originalDate = "2025-08-16";
      const offset = convertDateToOffset(originalDate, tournamentStart);
      const convertedDate = convertOffsetToDate(offset, tournamentStart);

      expect(convertedDate).toBe(originalDate);
    });

    test("offset → date → offset conversion maintains accuracy", () => {
      const originalOffset = 1;
      const date = convertOffsetToDate(originalOffset, tournamentStart);
      const convertedOffset = convertDateToOffset(date, tournamentStart);

      expect(convertedOffset).toBe(originalOffset);
    });

    test("full rounds conversion round-trip accuracy", () => {
      const originalRounds = [
        { date: "2025-08-15", format: "Speedgolf" },
        { date: "2025-08-16", format: "Sprintgolf" },
        { date: "2025-08-17", format: "Speedgolf" },
      ];

      // Convert to offsets and back to dates
      const withOffsets = convertRoundsToOffsets(originalRounds, tournamentStart);
      const backToDates = convertRoundsToAbsoluteDates(withOffsets, tournamentStart);

      // Should maintain original dates
      expect(backToDates[0].date).toBe("2025-08-15");
      expect(backToDates[1].date).toBe("2025-08-16");
      expect(backToDates[2].date).toBe("2025-08-17");
    });
  });

  describe("Edge cases", () => {
    test("handles multiple rounds on same day", () => {
      const rounds = [
        { date: "2025-08-15", format: "Speedgolf", numHoles: "18" },
        { date: "2025-08-15", format: "Sprintgolf", numHoles: "9" },
        { date: "2025-08-16", format: "Speedgolf", numHoles: "18" },
      ];

      const withOffsets = convertRoundsToOffsets(rounds, tournamentStart);

      expect(withOffsets[0].dayOffset).toBe(0);
      expect(withOffsets[1].dayOffset).toBe(0); // Same day as first round
      expect(withOffsets[2].dayOffset).toBe(1);
    });

    test("handles leap year dates", () => {
      const leapYearStart = "2024-02-28";
      const leapYearEnd = "2024-03-01";

      const duration = getTournamentDuration(leapYearStart, leapYearEnd);
      expect(duration).toBe(3); // Feb 28, Feb 29, Mar 1
    });

    test("handles year boundary crossing", () => {
      const yearEnd = "2024-12-31";
      const yearStart = "2025-01-02";

      const duration = getTournamentDuration(yearEnd, yearStart);
      expect(duration).toBe(3); // Dec 31, Jan 1, Jan 2
    });
  });
});
