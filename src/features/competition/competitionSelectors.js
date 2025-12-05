import { createSelector } from "@reduxjs/toolkit";

export const tournamentsSelector = (state) => state.competitions.tournaments;

export const availableStepsSelector = (state) =>
  state.competitions.availableSteps;

export const activeTournamentSelector = (state) =>
  state.competitions.activeTournament;

export const allUserNamesSelector = (state) => state.competitions.allUsers;

export const isWizardActiveSelector = (state) =>
  state.competitions.isWizardActive;

export const teesetsSelector = createSelector(
  [(state) => state.competitions.teesets],
  (teesets) => {
    return teesets || [];
  },
);

// Wizard state selectors
export const wizardStateSelector = (state) => state.competitions.wizardState;

export const wizardTournamentIdSelector = (state) =>
  state.competitions.wizardState.tournamentId;

export const wizardDirtyTabsSelector = createSelector(
  [(state) => state.competitions.wizardState.dirtyTabs],
  (dirtyTabs) => {
    // Always return a new array to ensure proper memoization
    return Array.isArray(dirtyTabs) ? [...dirtyTabs] : [];
  },
);

export const wizardTabSelector = (tab) => (state) =>
  state.competitions.wizardState[tab];

export const divisionRoundOffsetsSelector = (state) =>
  state.competitions.wizardState.divisionRoundOffsets;

export const divisionRoundOptionsSelector = (state) =>
  state.competitions.wizardState.divisionRoundOptions;

// Memoized selector for divisions with calculated dates
export const divisionsWithDatesSelector = createSelector(
  [
    (state) => state.competitions.wizardState.basicInfo,
    (state) => state.competitions.wizardState.divisions,
    (state) => state.competitions.wizardState.divisionRoundOffsets,
  ],
  (basicInfo, divisions, offsets) => {
    if (!basicInfo?.startDate || !divisions) {
      return divisions || [];
    }

    const tournamentStartDate = basicInfo.startDate.split("T")[0];

    // Helper function to add days to date string (timezone-safe)
    const addDaysToDate = (dateStr, days) => {
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      date.setUTCDate(date.getUTCDate() + days);

      const newYear = date.getUTCFullYear();
      const newMonth = String(date.getUTCMonth() + 1).padStart(2, "0");
      const newDay = String(date.getUTCDate()).padStart(2, "0");
      return `${newYear}-${newMonth}-${newDay}`;
    };

    const result = divisions.map((division) => {
      const divisionId = division.clientId || division._id || division.id;
      const divisionOffsets = offsets[divisionId] || {};

      if (division.rounds) {
        const roundsWithDates = division.rounds.map((round, index) => {
          const dayOffset = divisionOffsets[index] ?? index; // Fallback to round position
          const calculatedDate = addDaysToDate(tournamentStartDate, dayOffset);

          return {
            ...round,
            date: calculatedDate, // Computed for display
            dayOffset: dayOffset, // Computed for form controls
          };
        });

        return {
          ...division,
          rounds: roundsWithDates,
        };
      }

      return division;
    });

    return result;
  },
);

// Memoized selector for activeTournament with courses fallback
export const activeTournamentWithCoursesSelector = createSelector(
  [activeTournamentSelector],
  (activeTournament) => {
    return activeTournament || { courses: [] };
  },
);

// Memoized selector for courses array
export const coursesArraySelector = createSelector(
  [(state) => state.courses],
  (courses) => {
    return Array.isArray(courses) ? courses : [];
  },
);
