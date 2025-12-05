import { createSlice } from "@reduxjs/toolkit";
import { TOURNAMENT_STEPS, TOURNAMENT_STRUCTURE } from "./constants";
import { omit } from "lodash";
import { formatDateForInput } from "./utils/dateUtils";
import {
  convertDateToOffset,
  convertOffsetToDate,
} from "../../utils/dateOffsetUtils";
import { tabConfig } from "./tabConfig";

const initState = {
  tournaments: [],
  activeTournament: null,
  availableSteps: [TOURNAMENT_STEPS.BASIC_INFO],
  allUsers: [],
  isWizardActive: false, // Track if tournament wizard is open
  // Wizard state for tournament creation/editing
  wizardState: {
    tournamentId: null,
    basicInfo: null,
    courses: null, // Renamed from coursesInfo for consistency
    divisions: null, // Already consistent
    registrationInfo: null,
    regPaymentInfo: null, // Consistently named to match API
    dirtyTabs: [], // Track which tabs have been modified
    divisionRoundOffsets: {},
    // Store dropdown options for each division's rounds
    divisionRoundOptions: {}, // { [divisionId]: { [roundIndex]: [dayOptions] } }
  },
};

export const competitionSlice = createSlice({
  name: "tournaments",
  initialState: initState,
  reducers: {
    setTeesets: (state, action) => {
      state.teesets = action.payload;
    },
    // For the active tournament initialization
    setActiveTournamentAction: (state, action) => {
      state.activeTournament = action.payload;

      if (action.payload) {
        // 🎯 CRITICAL FIX: Check if wizard state already exists for this tournament
        // If it does, DON'T reinitialize it to preserve user changes
        const currentWizardTournamentId = state.wizardState?.tournamentId;
        const newTournamentId = action.payload._id;

        if (currentWizardTournamentId === newTournamentId) {
          return; // Exit early, don't reinitialize wizard state
        }

        // 🎯 CONTROLLED COMPONENT ARCHITECTURE: Initialize wizard state when setting active tournament
        // This ensures wizard state is in sync when loading a tournament for editing

        const tournament = action.payload;
        const tournamentId = tournament._id || tournament.tournamentId;
        const basicInfo = tournament.basicInfo;
        let processedBasicInfo = null;

        if (basicInfo) {
          const startDate = formatDateForInput(basicInfo.startDate);
          const endDate = formatDateForInput(basicInfo.endDate);

          // Calculate endDateOffset from existing dates (allow 0 for same-day tournaments)
          const endDateOffset =
            endDate && startDate ? convertDateToOffset(endDate, startDate) : 1;

          // Calculate teeTimeOffsets from existing teeTimes
          const teeTimeOffsets = basicInfo.teeTimes
            ? basicInfo.teeTimes.map((teeTime) => ({
                startTime: teeTime.startTime,
                dayOffset: convertDateToOffset(
                  formatDateForInput(teeTime.date),
                  startDate,
                ),
              }))
            : [
                { startTime: "07:00", dayOffset: 0 },
                { startTime: "07:00", dayOffset: 1 },
              ];

          processedBasicInfo = {
            ...basicInfo,
            tournamentId, // Store the tournament ID in basicInfo for easy access
            startDate,
            endDateOffset,
            teeTimeOffsets,
            // Remove the old endDate and teeTimes to avoid confusion
            endDate: undefined,
            teeTimes: undefined,
          };
        }

        // Convert regPaymentInfo from API format to offset-based format
        let processedRegPaymentInfo = null;
        if (tournament.regPaymentInfo && processedBasicInfo?.startDate) {
          const regPaymentInfo = tournament.regPaymentInfo;
          processedRegPaymentInfo = {
            ...regPaymentInfo,
          };

          // Convert API dates to offsets if they exist
          if (regPaymentInfo.regStartDate) {
            processedRegPaymentInfo.registrationOpenOffset =
              convertDateToOffset(
                formatDateForInput(regPaymentInfo.regStartDate),
                processedBasicInfo.startDate,
              );
            delete processedRegPaymentInfo.regStartDate;
          }

          if (regPaymentInfo.regEndDate) {
            processedRegPaymentInfo.registrationCloseOffset =
              convertDateToOffset(
                formatDateForInput(regPaymentInfo.regEndDate),
                processedBasicInfo.startDate,
              );
            delete processedRegPaymentInfo.regEndDate;
          }

          if (regPaymentInfo.maxAllowedWithdraDate) {
            processedRegPaymentInfo.withdrawalDeadlineOffset =
              convertDateToOffset(
                formatDateForInput(regPaymentInfo.maxAllowedWithdraDate),
                processedBasicInfo.startDate,
              );
            delete processedRegPaymentInfo.maxAllowedWithdraDate;
          }
        } else if (tournament.regPaymentInfo) {
          // If no start date available, use as-is but log warning
          processedRegPaymentInfo = tournament.regPaymentInfo;
          console.warn(
            "🚀 WIZARD STATE INIT - Cannot convert regPaymentInfo to offsets, no start date available",
          );
        }

        // Initialize division round offsets from stored tournament data
        const initialDivisionRoundOffsets = {};

        if (
          tournament.divisions &&
          Array.isArray(tournament.divisions) &&
          processedBasicInfo?.startDate
        ) {
          tournament.divisions.forEach((division) => {
            if (!division.rounds || !Array.isArray(division.rounds)) return;

            const divisionOffsets = {};

            division.rounds.forEach((round, index) => {
              let dayOffset = index; // Default fallback

              // Calculate actual offset from stored round date to preserve user changes
              if (round.date && processedBasicInfo.startDate) {
                try {
                  const roundDate = new Date(round.date);
                  const startDate = new Date(processedBasicInfo.startDate);
                  const calculatedOffset = Math.floor(
                    (roundDate - startDate) / (1000 * 60 * 60 * 24),
                  );

                  // Use calculated offset if it's reasonable (0-6 days), otherwise fall back to index
                  if (calculatedOffset >= 0 && calculatedOffset <= 6) {
                    dayOffset = calculatedOffset;
                  }
                } catch (error) {
                  console.warn(
                    `🎯 WIZARD INIT - Division ${division.name} Round ${index + 1}: Date calculation failed, using fallback offset ${dayOffset}`,
                    error,
                  );
                }
              }

              divisionOffsets[index] = dayOffset;
            });

            if (Object.keys(divisionOffsets).length > 0) {
              // Use the same ID priority as modal lookup: id || clientId || _id
              const divisionKey =
                division.id || division.clientId || division._id;
              initialDivisionRoundOffsets[divisionKey] = divisionOffsets;
            }
          });
        }

        // Initialize wizard state with processed data
        state.wizardState = {
          tournamentId,
          basicInfo: processedBasicInfo,
          courses: tournament.courses || tournament.coursesInfo || null, // Try both courses and coursesInfo
          divisions: tournament.divisions || null, // Already consistent
          registrationInfo: tournament.registrationInfo || null,
          regPaymentInfo: processedRegPaymentInfo, // Now consistent with API naming
          regPayment: processedRegPaymentInfo, // Patch: add for UI compatibility
          dirtyTabs: [], // Initialize dirtyTabs as empty array
          divisionRoundOffsets: initialDivisionRoundOffsets,
          divisionRoundOptions: {},
        };

        /*
        When we want to set an existing tournament as active:
        we take its data, remove the id, version number and published flag from it.
        Also check whether there's anything else present in the field, if it's empty then that is the current tab.
        */
        // Omit irrelevant fields
        const tournamentData = omit(action.payload, [
          "_id",
          "__v",
          "published",
        ]);

        let completedSteps = [];
        let activeStep = "";

        // Iterate over TOURNAMENT_STEPS to determine the active step and completed steps
        for (const step of Object.values(TOURNAMENT_STEPS)) {
          // Map wizard step names to API property names where they differ
          let stepData;
          if (step === "courses") {
            stepData =
              tournamentData["courses"] || tournamentData["coursesInfo"]; // API may use either
          } else {
            stepData = tournamentData[step]; // Most steps have consistent naming now
          }

          const isEmpty =
            stepData === null ||
            stepData === undefined ||
            stepData === "" ||
            (Array.isArray(stepData) && stepData.length === 0) ||
            (typeof stepData === "object" &&
              Object.keys(stepData).length === 0);

          console.log(`🔍 Step validation - ${step}:`, {
            stepData: stepData,
            isEmpty: isEmpty,
            dataType: typeof stepData,
            isArray: Array.isArray(stepData),
            dataLength: Array.isArray(stepData)
              ? stepData.length
              : Object.keys(stepData || {}).length,
          });

          if (isEmpty && !activeStep) {
            activeStep = step;
            break;
          }

          if (!isEmpty) {
            completedSteps.push(step);
          }
        }

        // Set the active step to the first incomplete one, or the last completed if all are filled
        if (!activeStep) {
          activeStep =
            completedSteps[completedSteps.length - 1] ||
            TOURNAMENT_STEPS.BASIC_INFO;
        }

        // Add the next step to the completed steps if it exists
        const nextStep =
          TOURNAMENT_STRUCTURE[completedSteps[completedSteps.length - 1]]?.next;
        if (nextStep) {
          completedSteps.push(nextStep);
        }

        state.availableSteps = completedSteps;
      } else {
        // Clear wizard state when no tournament is active
        state.wizardState = null;
      }
    },
    // To update the active tournament, for example when saving tabs.
    updateActiveTournamentAction: (state, action) => {
      const updatedTournament = {
        _id: action.payload.id || action.payload._id,
        ...state.activeTournament,
        ...action.payload.schema,
      };

      state.activeTournament = updatedTournament;

      console.log("� ACTIVE TOURNAMENT UPDATED:", {
        tournamentId: updatedTournament._id,
        name: updatedTournament.basicInfo?.name,
      });
    },
    // To update the available tabs.
    updateAvailableSteps: (state, action) => {
      const nextStep = TOURNAMENT_STRUCTURE[action.payload].next;
      if (!state.availableSteps.includes(nextStep)) {
        state.availableSteps.push(nextStep);
      }
    },
    // To reset the available tabs.
    resetAvailableSteps: (state) => {
      state.availableSteps = [TOURNAMENT_STEPS.BASIC_INFO];
    },
    // To initialize all tournaments on the tournaments page.
    setTournamentsAction: (state, action) => {
      state.tournaments = action.payload;
    },
    setAllUsers: (state, action) => {
      state.allUsers = action.payload;
    },

    // Wizard state management actions
    initializeWizardState: (state, action) => {
      const tournament = action.payload;
      console.log("🔍 initializeWizardState - tournament:", tournament);
      console.log("🔍 tournament.courses:", tournament?.courses);
      console.log("🔍 tournament.coursesInfo:", tournament?.coursesInfo);

      if (tournament) {
        // Initialize wizard state from existing tournament with offset-based approach
        const tournamentId = tournament._id || tournament.tournamentId;
        const basicInfo = tournament.basicInfo;
        let processedBasicInfo = null;

        if (basicInfo) {
          const startDate = formatDateForInput(basicInfo.startDate);
          const endDate = formatDateForInput(basicInfo.endDate);

          // Calculate endDateOffset from existing dates (allow 0 for same-day tournaments)
          const endDateOffset =
            endDate && startDate ? convertDateToOffset(endDate, startDate) : 1;

          // Calculate teeTimeOffsets from existing teeTimes
          const teeTimeOffsets = basicInfo.teeTimes
            ? basicInfo.teeTimes.map((teeTime) => ({
                startTime: teeTime.startTime,
                dayOffset: convertDateToOffset(
                  formatDateForInput(teeTime.date),
                  startDate,
                ),
              }))
            : [
                { startTime: "07:00", dayOffset: 0 },
                { startTime: "07:00", dayOffset: 1 },
              ];

          processedBasicInfo = {
            ...basicInfo,
            tournamentId, // Store the tournament ID in basicInfo for easy access
            startDate,
            endDateOffset,
            teeTimeOffsets,
            // Remove the old endDate and teeTimes to avoid confusion
            endDate: undefined,
            teeTimes: undefined,
          };
        }

        // Convert regPaymentInfo from API format to offset-based format
        let processedRegPaymentInfo = null;
        if (tournament.regPaymentInfo && processedBasicInfo?.startDate) {
          const regPaymentInfo = tournament.regPaymentInfo;
          processedRegPaymentInfo = {
            ...regPaymentInfo,
          };

          // Convert API dates to offsets if they exist
          if (regPaymentInfo.regStartDate) {
            processedRegPaymentInfo.registrationOpenOffset =
              convertDateToOffset(
                formatDateForInput(regPaymentInfo.regStartDate),
                processedBasicInfo.startDate,
              );
            delete processedRegPaymentInfo.regStartDate;
          }

          if (regPaymentInfo.regEndDate) {
            processedRegPaymentInfo.registrationCloseOffset =
              convertDateToOffset(
                formatDateForInput(regPaymentInfo.regEndDate),
                processedBasicInfo.startDate,
              );
            delete processedRegPaymentInfo.regEndDate;
          }

          if (regPaymentInfo.maxAllowedWithdraDate) {
            processedRegPaymentInfo.withdrawalDeadlineOffset =
              convertDateToOffset(
                formatDateForInput(regPaymentInfo.maxAllowedWithdraDate),
                processedBasicInfo.startDate,
              );
            delete processedRegPaymentInfo.maxAllowedWithdraDate;
          }
        } else if (tournament.regPaymentInfo) {
          // If no start date available, use as-is but log warning
          processedRegPaymentInfo = tournament.regPaymentInfo;
        }

        // 🎯 INITIALIZE DIVISION ROUND OFFSETS: Always recalculate from stored tournament data
        const initialDivisionRoundOffsets = {};

        if (
          tournament.divisions &&
          Array.isArray(tournament.divisions) &&
          processedBasicInfo.startDate
        ) {
          tournament.divisions.forEach((division) => {
            if (!division.rounds || !Array.isArray(division.rounds)) return;

            const divisionOffsets = {};

            division.rounds.forEach((round, index) => {
              let dayOffset = index; // Default fallback

              // 🔧 FIX: Calculate actual offset from stored round date to preserve user changes
              if (round.date && processedBasicInfo.startDate) {
                try {
                  const roundDate = new Date(round.date);
                  const startDate = new Date(processedBasicInfo.startDate);
                  const calculatedOffset = Math.floor(
                    (roundDate - startDate) / (1000 * 60 * 60 * 24),
                  );

                  // Use calculated offset if it's reasonable (0-6 days), otherwise fall back to index
                  if (calculatedOffset >= 0 && calculatedOffset <= 6) {
                    dayOffset = calculatedOffset;
                  } else {
                    // Using fallback offset for out of range calculation
                  }
                } catch (error) {
                  console.warn(
                    `🎯 WIZARD INIT - Division ${division.name} Round ${index + 1}: Date calculation failed, using fallback offset ${dayOffset}`,
                    error,
                  );
                }
              }

              divisionOffsets[index] = dayOffset;
            });

            if (Object.keys(divisionOffsets).length > 0) {
              initialDivisionRoundOffsets[division.clientId || division.id] =
                divisionOffsets;
            }
          });
        }

        // 🔍 DEBUG: Log colorTheme initialization for existing tournaments
        console.log("🎨 Color Theme Debug - Existing Tournament:", {
          tournamentId: tournament._id || tournament.tournamentId,
          hasColorTheme: !!tournament.colorTheme,
          colorThemeValue: tournament.colorTheme,
          defaultValues: tabConfig.colorTheme.defaultValues,
          willUseDefaults: !tournament.colorTheme,
        });

        state.wizardState = {
          tournamentId, // Store at top level for easy access
          basicInfo: processedBasicInfo,
          courses: tournament.courses || tournament.coursesInfo || null, // Try both courses and coursesInfo
          divisions: tournament.divisions || null,
          registrationInfo: tournament.registrationInfo || null,
          regPayment: processedRegPaymentInfo, // Map from API regPaymentInfo to wizard regPayment
          colorTheme:
            tournament.colorTheme || tabConfig.colorTheme.defaultValues, // Initialize with defaults if no existing colorTheme
          dirtyTabs: [], // Initialize dirtyTabs as empty array
          // 🔥 INITIALIZE WITH STORED OFFSETS: Convert division round dates to offsets on first load
          divisionRoundOffsets: initialDivisionRoundOffsets,
          divisionRoundOptions: state.wizardState?.divisionRoundOptions || {},
        };
      } else {
        // Clean slate for new tournament with default offset structure
        state.wizardState = {
          tournamentId: null, // No ID for new tournaments
          basicInfo: {
            tournamentId: null, // Also store in basicInfo for consistency
            startDate: null,
            endDateOffset: 0, // Default: single-day tournament
            teeTimeOffsets: [
              { startTime: "07:00", dayOffset: 0 }, // Day 1
            ],
          },
          courses: null,
          divisions: null,
          registrationInfo: null,
          regPayment: {
            // 🎯 REGISTRATION DATE OFFSETS - Negative values for dates before tournament start
            registrationOpenOffset: -30, // Default: registration opens 30 days before tournament
            registrationCloseOffset: -3, // Default: registration closes 3 days before tournament
            withdrawalDeadlineOffset: -7, // Default: withdrawal deadline 7 days before tournament
            entryFee: null,
            acceptsCash: false,
            acceptsCheck: false,
            acceptsPayPal: false,
            payPalAccount: null,
            acceptsVenmo: false,
            venmoAccount: null,
            acceptsZelle: false,
            zelleAccount: null,
            acceptsCashApp: false,
            cashAppAccount: null,
            refundPolicy: null,
          },
          colorTheme: tabConfig.colorTheme.defaultValues, // Initialize with default color theme values
          dirtyTabs: [], // Initialize dirtyTabs as empty array
          divisionRoundOffsets: {},
          divisionRoundOptions: {},
        };
      }
    },

    updateWizardTab: (state, action) => {
      const { tab, data } = action.payload;
      state.wizardState[tab] = data;

      // Ensure dirtyTabs array exists
      if (!state.wizardState.dirtyTabs) {
        state.wizardState.dirtyTabs = [];
      }

      // Mark tab as dirty if it's not already marked
      if (!state.wizardState.dirtyTabs.includes(tab)) {
        state.wizardState.dirtyTabs.push(tab);
      }
    },

    updateDivisionRoundOffset: (state, action) => {
      const { divisionId, roundIndex, dayOffset } = action.payload;

      // Ensure the division exists in offsets
      if (!state.wizardState.divisionRoundOffsets[divisionId]) {
        state.wizardState.divisionRoundOffsets[divisionId] = {};
      }

      // Update the day offset
      state.wizardState.divisionRoundOffsets[divisionId][roundIndex] =
        dayOffset;

      console.log("💾 ROUND OFFSET UPDATED:", {
        divisionId,
        roundIndex,
        dayOffset,
      });
    },

    clearDirtyTabs: (state) => {
      state.wizardState.dirtyTabs = [];
    },

    // Update dropdown options for a specific division's round
    updateDivisionRoundOptions: (state, action) => {
      const { divisionId, roundIndex, options } = action.payload;

      // Ensure the division exists in options
      if (!state.wizardState.divisionRoundOptions[divisionId]) {
        state.wizardState.divisionRoundOptions[divisionId] = {};
      }

      // Update the dropdown options for this round
      state.wizardState.divisionRoundOptions[divisionId][roundIndex] = options;
    },

    // Update all dropdown options for a division (when constraints change)
    updateDivisionOptions: (state, action) => {
      const { divisionId, allRoundOptions } = action.payload;

      // Ensure the division exists in options
      if (!state.wizardState.divisionRoundOptions[divisionId]) {
        state.wizardState.divisionRoundOptions[divisionId] = {};
      }

      // Update all round options for this division
      state.wizardState.divisionRoundOptions[divisionId] = allRoundOptions;
    },

    // Smart update: Update a round's offset and recalculate all options with constraints
    updateDivisionRoundWithConstraints: (state, action) => {
      const { divisionId, roundIndex, dayOffset, minDate, maxDate, allRounds } =
        action.payload;

      // 1. Update the offset
      if (!state.wizardState.divisionRoundOffsets[divisionId]) {
        state.wizardState.divisionRoundOffsets[divisionId] = {};
      }
      state.wizardState.divisionRoundOffsets[divisionId][roundIndex] =
        dayOffset;

      // 2. Recalculate all dropdown options for this division with constraints
      if (minDate && maxDate && allRounds) {
        // Import generateDayOptions here (we'll need to move this or make it available)
        // For now, we'll handle the option generation in the component and pass it to the reducer
        console.log(
          `🔄 Updated Round ${roundIndex + 1} for division ${divisionId} to dayOffset ${dayOffset}`,
        );
      }
    },

    // Update endDateOffset in basicInfo
    updateEndDateOffset: (state, action) => {
      const { endDateOffset } = action.payload;
      if (state.wizardState.basicInfo) {
        state.wizardState.basicInfo.endDateOffset = Math.max(0, endDateOffset);
      }
    },

    // Update teeTimeOffsets in basicInfo
    updateTeeTimeOffsets: (state, action) => {
      const { teeTimeOffsets } = action.payload;
      if (state.wizardState.basicInfo) {
        state.wizardState.basicInfo.teeTimeOffsets = teeTimeOffsets;
      }
    },

    // Update startDate and recalculate dependent offsets
    updateStartDate: (state, action) => {
      const { startDate } = action.payload;
      if (state.wizardState.basicInfo) {
        state.wizardState.basicInfo.startDate = startDate;
        // Note: endDateOffset and teeTimeOffsets remain unchanged - they're relative offsets
      }
    },

    // 🎯 REGISTRATION DATE OFFSET ACTIONS - Negative offsets for dates before tournament start
    updateRegistrationOpenOffset: (state, action) => {
      const { registrationOpenOffset } = action.payload;
      if (!state.wizardState.regPayment) {
        state.wizardState.regPayment = {};
      }
      state.wizardState.regPayment.registrationOpenOffset =
        registrationOpenOffset;
    },

    updateRegistrationCloseOffset: (state, action) => {
      const { registrationCloseOffset } = action.payload;
      if (!state.wizardState.regPayment) {
        state.wizardState.regPayment = {};
      }
      state.wizardState.regPayment.registrationCloseOffset =
        registrationCloseOffset;
    },

    updateWithdrawalDeadlineOffset: (state, action) => {
      const { withdrawalDeadlineOffset } = action.payload;
      if (!state.wizardState.regPayment) {
        state.wizardState.regPayment = {};
      }
      state.wizardState.regPayment.withdrawalDeadlineOffset =
        withdrawalDeadlineOffset;
    },

    clearWizardState: (state) => {
      state.wizardState = {
        tournamentId: null,
        basicInfo: null,
        courses: null,
        divisions: null,
        registrationInfo: null,
        regPayment: null,
        dirtyTabs: [], // Ensure dirtyTabs is always initialized
        divisionRoundOffsets: {},
        divisionRoundOptions: {},
      };
    },

    // Set wizard active state (hide mode tabs when true)
    setWizardActive: (state, action) => {
      state.isWizardActive = action.payload;
    },

    // Update division round dates when tournament dates change
    updateDivisionRoundDates: (state, action) => {
      const { newStartDate, newEndDate } = action.payload;
      if (!state.activeTournament?.divisions) return;

      const newTournamentStart = new Date(newStartDate);
      const newTournamentEnd = new Date(newEndDate);

      // Collect all existing round dates to determine the actual date range being used
      const allRoundDates = [];
      state.activeTournament.divisions.forEach((division) => {
        if (division.rounds && division.rounds.length > 0) {
          division.rounds.forEach((round) => {
            if (round.date) {
              allRoundDates.push(new Date(round.date));
            }
          });
        }
      });

      if (allRoundDates.length === 0) {
        return;
      }

      // Find the actual date range that existing rounds span
      const actualOldStart = new Date(Math.min(...allRoundDates));
      const actualOldEnd = new Date(Math.max(...allRoundDates));

      // Calculate durations
      const actualOldDurationMs = actualOldEnd - actualOldStart;
      const newDurationMs = newTournamentEnd - newTournamentStart;

      // Helper function to format date as YYYY-MM-DD
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      };

      // Update all divisions
      const updatedDivisions = state.activeTournament.divisions.map(
        (division) => {
          if (!division.rounds || division.rounds.length === 0) return division;

          // Update rounds with proportional mapping
          const updatedRounds = division.rounds.map((round) => {
            if (!round.date) return round;

            const oldRoundDate = new Date(round.date);

            // Calculate the relative position of this round in the actual round date range (0 to 1)
            const relativePosition =
              actualOldDurationMs === 0
                ? 0
                : (oldRoundDate - actualOldStart) / actualOldDurationMs;

            // Map to the new tournament timeline
            const newRoundDateMs =
              newTournamentStart.getTime() + relativePosition * newDurationMs;
            const newRoundDate = new Date(newRoundDateMs);

            // Round to the nearest day
            newRoundDate.setHours(0, 0, 0, 0);

            // Ensure the new date is within bounds
            const boundedDate = new Date(
              Math.max(
                newTournamentStart.getTime(),
                Math.min(newRoundDate.getTime(), newTournamentEnd.getTime()),
              ),
            );

            const newDateString = formatDate(boundedDate);

            return {
              ...round,
              date: newDateString,
            };
          });

          return {
            ...division,
            rounds: updatedRounds,
          };
        },
      );

      // Explicitly assign the updated divisions array
      state.activeTournament.divisions = updatedDivisions;
    },

    // Set tournament ID in wizard state (for new tournaments after first save)
    setWizardTournamentId: (state, action) => {
      const tournamentId = action.payload;
      state.wizardState.tournamentId = tournamentId;
      if (state.wizardState.basicInfo) {
        state.wizardState.basicInfo.tournamentId = tournamentId;
      }
    },

    // Cancel wizard changes by restoring from last saved activeTournament state
    cancelWizardChanges: (state) => {
      if (state.activeTournament) {
        // Re-initialize wizard state from the last saved activeTournament
        // This effectively "cancels" any unsaved changes by restoring clean state
        const tournament = state.activeTournament;
        const tournamentId = tournament._id || tournament.tournamentId;
        const basicInfo = tournament.basicInfo;
        let processedBasicInfo = null;

        if (basicInfo) {
          const startDate = formatDateForInput(basicInfo.startDate);
          const endDate = formatDateForInput(basicInfo.endDate);

          // Calculate endDateOffset from existing dates (allow 0 for same-day tournaments)
          const endDateOffset =
            endDate && startDate ? convertDateToOffset(endDate, startDate) : 1;

          // Calculate teeTimeOffsets from existing teeTimes
          const teeTimeOffsets = basicInfo.teeTimes
            ? basicInfo.teeTimes.map((teeTime) => ({
                startTime: teeTime.startTime,
                dayOffset: convertDateToOffset(
                  formatDateForInput(teeTime.date),
                  startDate,
                ),
              }))
            : [
                { startTime: "07:00", dayOffset: 0 },
                { startTime: "07:00", dayOffset: 1 },
              ];

          processedBasicInfo = {
            ...basicInfo,
            tournamentId,
            startDate,
            endDateOffset,
            teeTimeOffsets,
            endDate: undefined,
            teeTimes: undefined,
          };
        }

        // Convert regPaymentInfo from API format to offset-based format
        let processedRegPaymentInfo = null;
        if (tournament.regPaymentInfo && processedBasicInfo?.startDate) {
          const regPaymentInfo = tournament.regPaymentInfo;
          processedRegPaymentInfo = {
            ...regPaymentInfo,
          };

          // Convert API dates to offsets if they exist
          if (regPaymentInfo.regStartDate) {
            processedRegPaymentInfo.registrationOpenOffset =
              convertDateToOffset(
                formatDateForInput(regPaymentInfo.regStartDate),
                processedBasicInfo.startDate,
              );
            delete processedRegPaymentInfo.regStartDate;
          }

          if (regPaymentInfo.regEndDate) {
            processedRegPaymentInfo.registrationCloseOffset =
              convertDateToOffset(
                formatDateForInput(regPaymentInfo.regEndDate),
                processedBasicInfo.startDate,
              );
            delete processedRegPaymentInfo.regEndDate;
          }

          if (regPaymentInfo.maxAllowedWithdraDate) {
            processedRegPaymentInfo.withdrawalDeadlineOffset =
              convertDateToOffset(
                formatDateForInput(regPaymentInfo.maxAllowedWithdraDate),
                processedBasicInfo.startDate,
              );
            delete processedRegPaymentInfo.maxAllowedWithdraDate;
          }
        } else if (tournament.regPaymentInfo) {
          processedRegPaymentInfo = tournament.regPaymentInfo;
        }

        // Restore wizard state to clean saved state
        state.wizardState = {
          tournamentId,
          basicInfo: processedBasicInfo,
          courses: tournament.courses || tournament.coursesInfo || null, // Try both courses and coursesInfo
          divisions: tournament.divisions || null,
          registrationInfo: tournament.registrationInfo || null,
          regPayment: processedRegPaymentInfo, // Map from API regPaymentInfo to wizard regPayment
          dirtyTabs: [], // Initialize dirtyTabs as empty array
          divisionRoundOffsets: {},
          divisionRoundOptions: {},
        };

        console.log(
          "✅ cancelWizardChanges: Wizard state restored from activeTournament",
        );
        console.log("✅ Restored wizard state:", state.wizardState);
      } else {
        console.log(
          "⚠️ cancelWizardChanges: No activeTournament to restore from",
        );
      }
    },
  },
});

export const {
  setTournamentsAction,
  setActiveTournamentAction,
  updateActiveTournamentAction,
  resetAvailableSteps,
  updateAvailableSteps,
  setAllUsers,
  setTeesets,
  updateDivisionRoundDates,
  // Wizard state actions
  initializeWizardState,
  updateWizardTab,
  clearDirtyTabs,
  updateDivisionRoundOffset,
  updateDivisionRoundOptions,
  updateDivisionOptions,
  updateDivisionRoundWithConstraints,
  updateEndDateOffset,
  updateTeeTimeOffsets,
  updateStartDate,
  updateRegistrationOpenOffset,
  updateRegistrationCloseOffset,
  updateWithdrawalDeadlineOffset,
  clearWizardState,
  setWizardTournamentId,
  cancelWizardChanges,
  setWizardActive,
} = competitionSlice.actions;

export default competitionSlice.reducer;
