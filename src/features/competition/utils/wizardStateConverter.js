/**
 * Utility functions for converting between wizard state and database format
 */
import { addDaysToDateString, formatDateForAPI, getDaysDifference } from "./dateUtils";
import { convertOffsetToDate } from "../../../utils/dateOffsetUtils";

/**
 * Convert wizard state to tournament format suitable for database storage
 * @param {Object} wizardState - The current wizard state from Redux
 * @returns {Object} Tournament data ready for API submission
 */
export const convertWizardStateToTournament = wizardState => {
  const { basicInfo, courses, divisions, registrationInfo, regPaymentInfo, divisionRoundOffsets } = wizardState;

  // Convert divisions from offset-based to date-based for DB storage
  const divisionsForDB = divisions
    ? divisions.map(division => {
        const divisionId = division.id || division.clientId || division._id;
        const roundOffsets = divisionRoundOffsets[divisionId] || {};

        const roundsWithDates = division.rounds
          ? division.rounds.map((round, roundIndex) => {
              // Get the day offset for this round (fallback to round position)
              const dayOffset = roundOffsets[roundIndex] ?? roundIndex;

              // Calculate actual date: tournament start + day offset
              const actualDate = basicInfo?.startDate ? addDaysToDateString(basicInfo.startDate, dayOffset) : null;

              // Create a clean round object without existing _id and date to ensure fresh data
              const { _id, date: oldDate, ...roundWithoutIdAndDate } = round;

              return {
                ...roundWithoutIdAndDate,
                date: actualDate ? formatDateForAPI(actualDate) : null,
                dayOffset: dayOffset, // Store offset for future wizard sessions
              };
            })
          : [];

        return {
          ...division,
          rounds: roundsWithDates,
        };
      })
    : [];

  // Prepare complete tournament data for API
  const tournamentData = {
    basicInfo: basicInfo
      ? {
          ...basicInfo,
          // Ensure dates are in correct format for API
          startDate: basicInfo.startDate ? formatDateForAPI(basicInfo.startDate) : null,
          endDate:
            basicInfo.startDate && basicInfo.endDateOffset !== undefined
              ? formatDateForAPI(convertOffsetToDate(basicInfo.endDateOffset, basicInfo.startDate))
              : null,
        }
      : null,
    coursesInfo: courses, // Map wizard courses back to API coursesInfo
    divisions: divisionsForDB,
    registrationInfo,
    regPaymentInfo,
  };

  return tournamentData;
};

/**
 * Extract day offsets from tournament data for wizard state initialization
 * @param {Object} tournament - Tournament data from database
 * @returns {Object} Division round offsets in wizard state format
 */
export const extractDivisionRoundOffsets = tournament => {
  if (!tournament.divisions || !tournament.basicInfo?.startDate) {
    return {};
  }

  const tournamentStartDate = tournament.basicInfo.startDate.split("T")[0];
  const offsets = {};

  tournament.divisions.forEach(division => {
    const divisionId = division.clientId || division._id || division.id;
    offsets[divisionId] = {};

    if (division.rounds) {
      division.rounds.forEach((round, index) => {
        if (round.date) {
          const roundDate = round.date.split("T")[0];
          const dayOffset = getDaysDifference(tournamentStartDate, roundDate);
          offsets[divisionId][index] = dayOffset;
        } else {
          // Fallback to round position
          offsets[divisionId][index] = index;
        }
      });
    }
  });

  return offsets;
};
