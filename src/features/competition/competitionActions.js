import {
  setActiveTournamentAction,
  setAllUsers,
  setTournamentsAction,
  updateActiveTournamentAction,
  updateAvailableSteps,
  setWizardTournamentId,
  cancelWizardChanges,
} from "./competitionSlice";
import { notifyMessage } from "../../services/toasterServices";
import { logoutUser, setLoading } from "../user/userSlice";
import { updateCourses } from "../course/courseSlice";
import * as CompetitionServices from "./competitionServices";
import * as CoursesServices from "../course/courseServices";
import * as UserServices from "../user/userServices";
// import { activeTournamentSelector } from "./competitionSelectors";
// import { set } from "lodash";
import { prepareFormData } from "services/competitionServices";
import { setTeesets } from "./competitionSlice";
import { convertWizardStateToTournament } from "./utils/wizardStateConverter";
import { convertOffsetToDate } from "../../utils/dateOffsetUtils";
// import useLocalStorageService from './useLocalStorageService.js';
// import { useSelector } from "react-redux";

// Transform offset-based wizard state to API format with actual dates
const transformWizardToApiFormat = (tournamentPaymentInfo, startDate) => {
  if (!tournamentPaymentInfo || !startDate) {
    return tournamentPaymentInfo;
  }

  const transformed = { ...tournamentPaymentInfo };

  // Convert offset-based dates to actual date strings
  if (typeof tournamentPaymentInfo.registrationOpenOffset === "number") {
    transformed.regStartDate = convertOffsetToDate(tournamentPaymentInfo.registrationOpenOffset, startDate);
    delete transformed.registrationOpenOffset;
  }

  if (typeof tournamentPaymentInfo.registrationCloseOffset === "number") {
    transformed.regEndDate = convertOffsetToDate(tournamentPaymentInfo.registrationCloseOffset, startDate);
    delete transformed.registrationCloseOffset;
  }

  if (typeof tournamentPaymentInfo.withdrawalDeadlineOffset === "number") {
    transformed.withdrawalDeadline = convertOffsetToDate(tournamentPaymentInfo.withdrawalDeadlineOffset, startDate);
    delete transformed.withdrawalDeadlineOffset;
  }

  // Ensure required fields are present with defaults
  if (transformed.capReg === undefined) {
    transformed.capReg = false;
  }

  if (transformed.askSwag === undefined) {
    transformed.askSwag = false;
  }

  return transformed;
};

const getJWTToken = getState => {
  try {
    const state = getState();
    return state.user.tokens.jwtToken;
  } catch (error) {
    notifyMessage("error", error.message, 5000, "colored", "top-center");
  }
};

export const saveAndUpdate =
  ({ id, tab, schema, skipActiveTournamentUpdate = false }) =>
  async (dispatch, getState) => {
    // 🎯 SPECIAL HANDLING: For divisions tab, convert wizard state to API format
    if (tab === "divisions") {
      const state = getState();
      const wizardState = state.competitions.wizardState;

      if (wizardState) {
        const tournamentData = convertWizardStateToTournament(wizardState);
        // Update schema to use converted data
        schema.divisions = tournamentData.divisions;
      }
    }

    let saveResult = null;

    switch (tab) {
      case "basicInfo":
        // Transform offset-based basic info to API format
        let basicInfoData = schema.basicInfo;
        if (basicInfoData) {
          basicInfoData = { ...basicInfoData };

          // Convert endDateOffset to actual endDate if present
          if (basicInfoData.endDateOffset !== undefined && basicInfoData.startDate) {
            // Convert endDateOffset to actual endDate
            basicInfoData.endDate = convertOffsetToDate(basicInfoData.endDateOffset, basicInfoData.startDate);
            // Remove the offset field as the API doesn't expect it
            delete basicInfoData.endDateOffset;
          }
        }

        if (id === -1) {
          saveResult = await dispatch(createNewCompetition(tab, basicInfoData));
        } else {
          saveResult = await dispatch(updateBasicInfo(id, tab, basicInfoData));
        }
        break;
      case "regPaymentInfo":
        // Always use the latest controlled state from wizardState.regPayment
        const state = getState();
        const wizardStartDate = state.competitions.wizardState?.basicInfo?.startDate;
        const regPayment = state.competitions.wizardState?.regPayment;
        let regPaymentData = regPayment ? { ...regPayment } : {};
        // Transform offset-based data if present
        if (
          regPaymentData &&
          (regPaymentData.registrationOpenOffset !== undefined || regPaymentData.registrationCloseOffset !== undefined)
        ) {
          regPaymentData = transformWizardToApiFormat(regPaymentData, wizardStartDate);
        }
        // Ensure required fields are present and valid
        regPaymentData.regStartDate = regPaymentData.regStartDate || wizardStartDate || new Date().toISOString();
        regPaymentData.regEndDate = regPaymentData.regEndDate || wizardStartDate || new Date().toISOString();
        regPaymentData.capReg = typeof regPaymentData.capReg === 'boolean' ? regPaymentData.capReg : false;
        regPaymentData.askSwag = typeof regPaymentData.askSwag === 'boolean' ? regPaymentData.askSwag : false;
        regPaymentData.currencyType = regPaymentData.currencyType || 'USD';
        // Detailed debug log for final payload
        console.log('[DEBUG] FINAL regPaymentInfo payload:', JSON.stringify({
          regStartDate: regPaymentData.regStartDate,
          regEndDate: regPaymentData.regEndDate,
          capReg: regPaymentData.capReg,
          askSwag: regPaymentData.askSwag,
          currencyType: regPaymentData.currencyType,
          ...regPaymentData
        }, null, 2));
        saveResult = await dispatch(updateRegPaymentInfo(id, tab, regPaymentData));
        break;
      case "colorTheme":
        saveResult = await dispatch(updateColorTheme(id, tab, schema.colorTheme));
        break;
      case "courses":
  // Always use the latest wizardState.courses for saving
  const competitionState = getState();
  let coursesData = competitionState.competitions.wizardState?.courses;
        // Defensive: ensure coursesData is always an array
        if (!Array.isArray(coursesData)) {
          if (coursesData && typeof coursesData === 'object') {
            coursesData = [coursesData];
          } else {
            coursesData = [];
          }
        }
        // Ensure each course has required fields for the API
        coursesData = coursesData
          .map(course => {
            // Guarantee courseId is present and non-empty
            let courseId = course.courseId || course._id || "";
            return {
              _id: course._id || courseId,
              courseId,
              name: course.name,
              location: course.location,
            };
          })
          .filter(course => course.courseId); // Only send courses with a valid courseId
        console.log('[DEBUG] Frontend sending courses array:', JSON.stringify(coursesData, null, 2));
        saveResult = await dispatch(updateCourse(id, tab, coursesData));
        break;
      // case "rounds":
      //   await dispatch(updateRounds(id, tab, schema.rounds));
      //   break;
      case "divisions":
        saveResult = await dispatch(updateDivisions(id, "divisions", schema.divisions));
        break;
      default:
        break;
    }

    // Check if save was successful
    if (saveResult && saveResult.error) {
      throw new Error(`Failed to save ${tab}: ${saveResult.error.message || saveResult.error}`);
    }

    if (saveResult?.success) {
      console.log("💾 WIZARD SAVE SUCCESS:", {
        tab,
        wizardState: getState().competitions.wizardState?.divisionRoundOffsets,
      });
      console.log("💾 ACTIVE TOURNAMENT UPDATED:", {
        tab,
        activeTournament: getState().competitions.activeTournament?.divisions?.length,
      });
    }

    return saveResult;
  };

export const createNewCompetition = (tab, basicInfoSchema) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;

      //making the formdata to be sent to the backend
      const basicInfoFormData = prepareFormData(basicInfoSchema);

      // Debug: Log FormData contents before API call
      if (basicInfoFormData instanceof FormData) {
        console.log("[DEBUG] FormData about to be sent to /newCompetition:");
        for (let pair of basicInfoFormData.entries()) {
          console.log(`  ${pair[0]}:`, pair[1]);
        }
      }

      // const { setDataInLocalStorage } = useLocalStorageService();
      const response = await CompetitionServices.createCompetition(basicInfoFormData, token);
      if (response.status === 200) {
        notifyMessage("success", "Information Saved!", 5000, "colored", "top-center");
        // update state
        // save on redux state only when it saves on the database successfully
        let competitionId = response.data.competitionId;

        // 🎯 NEW ARCHITECTURE: Set tournament ID in wizard state for single source of truth
        await dispatch(setWizardTournamentId(competitionId));

        // await dispatch(setActiveTournamentAction(tournament));
        await dispatch(updateAvailableSteps(tab));
        await dispatch(updateActiveTournamentAction({ id: competitionId, schema: { basicInfo: basicInfoSchema } }));
        // setDataInLocalStorage(competitionId, basicInfoSchema);
        // navigate(-1);
      } else if (response.status === 401) {
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 5000, "colored", "top-center");
        dispatch(logoutUser());
        // navigate("/login");
      } else {
        const errorMessage = `Failed to save Info! \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 5000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const updateBasicInfo = (id, tab, basicInfoSchema) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const competitionId = id;

      // Get current tournament to check if dates are changing
      const currentTournament = state.competitions.activeTournament;
      const oldStartDate = currentTournament?.startDate || currentTournament?.basicInfo?.startDate;
      const oldEndDate = currentTournament?.endDate || currentTournament?.basicInfo?.endDate;
      const newStartDate = basicInfoSchema.startDate;
      const newEndDate = basicInfoSchema.endDate;

      // Check if tournament dates are changing
      const datesChanged =
        (oldStartDate && newStartDate && oldStartDate !== newStartDate) ||
        (oldEndDate && newEndDate && oldEndDate !== newEndDate);

      // Validate that new date range can accommodate existing division rounds
      if (datesChanged && currentTournament?.divisions?.length > 0) {
        const existingRoundDates = new Set();

        // Collect all unique round dates from all divisions
        currentTournament.divisions.forEach(division => {
          if (division.rounds && division.rounds.length > 0) {
            division.rounds.forEach(round => {
              if (round.date) {
                // Normalize the date to YYYY-MM-DD format
                const roundDate = new Date(round.date);
                const normalizedDate = `${roundDate.getFullYear()}-${String(roundDate.getMonth() + 1).padStart(2, "0")}-${String(roundDate.getDate()).padStart(2, "0")}`;
                existingRoundDates.add(normalizedDate);
              }
            });
          }
        });

        if (existingRoundDates.size > 0) {
          // Calculate days available in new tournament window
          const newStart = new Date(newStartDate);
          const newEnd = new Date(newEndDate);
          const daysDifference = Math.ceil((newEnd - newStart) / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates

          console.log("Date range validation:", {
            oldStartDate,
            oldEndDate,
            newStartDate,
            newEndDate,
            existingUniqueDates: existingRoundDates.size,
            newWindowDays: daysDifference,
          });

          // Check if new date window is too narrow for existing rounds
          if (daysDifference < existingRoundDates.size) {
            const errorMessage = `Cannot reduce tournament date range. You have ${existingRoundDates.size} unique round dates but the new date range only spans ${daysDifference} day(s). Please ensure the new date range can accommodate all existing division rounds.`;
            throw new Error(errorMessage);
          }
        }
      }

      //making the formdata to be sent to the backend

      // 🎯 Convert teeTimes dates to Date objects to match staging format
      const basicInfoForAPI = { ...basicInfoSchema };

      // Note: startDate and endDate should remain as strings (YYYY-MM-DD format)
      // Only teeTimes dates need to be converted to Date objects

      if (basicInfoForAPI.teeTimes && Array.isArray(basicInfoForAPI.teeTimes)) {
        basicInfoForAPI.teeTimes = basicInfoForAPI.teeTimes.map(teeTime => {
          if (teeTime.date && typeof teeTime.date === "string") {
            // Convert string date to Date object like staging does (using midnight to match staging exactly)
            const dateObj = new Date(teeTime.date + "T00:00:00");
            return { ...teeTime, date: dateObj };
          }
          return teeTime;
        });
      }

      const basicInfoFormData = prepareFormData(basicInfoForAPI, competitionId);

      // Object.assign(course, { editors: { courseOwner: userId, courseEditors: [] } });
      // Object.keys(course).forEach((key) => {
      //   if (course[key] === undefined) {
      //     course[key] = null;
      //   }
      // });
      // const { setDataInLocalStorage } = useLocalStorageService();
      const response = await CompetitionServices.saveBasicInfo(competitionId, basicInfoFormData, token);

      if (response.status === 200) {
        console.log("✅ API call successful (status 200)");
        notifyMessage("success", "Information Saved!", 5000, "colored", "top-center");
        // update state
        // save on redux state only when it saves on the database successfully
        await dispatch(updateAvailableSteps(tab));

        await dispatch(updateActiveTournamentAction({ _id: competitionId, schema: { basicInfo: basicInfoSchema } }));

        // setDataInLocalStorage(competitionId, basicInfoSchema);
        // setDataInLocalStorage
        // navigate(-1);
        return { success: true, data: response.data };
      } else if (response.status === 401) {
        console.log("❌ API call failed (status 401 - Unauthorized)");
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 5000, "colored", "top-center");
        dispatch(logoutUser());
        // navigate("/login");
        return { success: false, error: responseMessage };
      } else {
        console.log(`❌ API call failed (status ${response.status}):`, response.data);
        const errorMessage = `Failed to save Info! \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("💥 updateBasicInfo error:", err);
      notifyMessage("error", err.message, 5000, "colored", "top-center");
      return { success: false, error: err.message };
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const updateRegPaymentInfo = (id, tab, regPaymentInfoSchema) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const competitionId = id;
      // Defensive: ensure we use the transformed regPaymentInfo with required fields
      let regPaymentInfo = { ...regPaymentInfoSchema };
      // If offsets are present, transform them to actual dates
      const wizardStartDate = state.competitions.wizardState?.basicInfo?.startDate;
      if (
        regPaymentInfo.registrationOpenOffset !== undefined ||
        regPaymentInfo.registrationCloseOffset !== undefined
      ) {
        regPaymentInfo = transformWizardToApiFormat(regPaymentInfo, wizardStartDate);
      }
      // Ensure required fields
      regPaymentInfo.regStartDate = regPaymentInfo.regStartDate || wizardStartDate || new Date().toISOString();
      regPaymentInfo.regEndDate = regPaymentInfo.regEndDate || wizardStartDate || new Date().toISOString();
      regPaymentInfo.capReg = typeof regPaymentInfo.capReg === 'boolean' ? regPaymentInfo.capReg : false;
      regPaymentInfo.askSwag = typeof regPaymentInfo.askSwag === 'boolean' ? regPaymentInfo.askSwag : false;
      regPaymentInfo.currencyType = regPaymentInfo.currencyType || 'USD';
      // Debug log for final API payload
        console.log('[DEBUG] API regPaymentInfo payload:', JSON.stringify(regPaymentInfo, null, 2));
        const apiPayload = { ...regPaymentInfo };
      const response = await CompetitionServices.saveRegPaymentInfo(
        competitionId,
          JSON.stringify(apiPayload),
        token,
      );
      if (response.status === 200) {
        notifyMessage("success", "Information Saved!", 5000, "colored", "top-center");
        await dispatch(updateAvailableSteps(tab));
        // Update activeTournament with the correct API key
        console.log("🎯 Updating activeTournament with: transformed API data (not wizard data)", apiPayload);
        await dispatch(
          updateActiveTournamentAction({ _id: competitionId, schema: { regPaymentInfo } }),
        );
      } else if (response.status === 401) {
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 5000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to save Info! \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 5000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const updateColorTheme = (id, tab, colorThemeSchema) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      // const directorId = state.user.user._id;
      const token = state.user.tokens.jwtToken;
      // const userId = state.user.user._id;
      const competitionId = id;
      // const regPaymentFormData = prepareFormData(regPaymentInfoSchema, competitionId);
      // console.log(regPaymentFormData);
      const response = await CompetitionServices.saveColorThemeInfo(
        competitionId,
        JSON.stringify(colorThemeSchema),
        token,
      );
      if (response.status === 200) {
        notifyMessage("success", "Information Saved!", 5000, "colored", "top-center");
        // update state
        // save on redux state only when it saves on the database successfully
        await dispatch(updateAvailableSteps(tab));
        await dispatch(updateActiveTournamentAction({ _id: competitionId, schema: { colorTheme: colorThemeSchema } }));
        // setDataInLocalStorage(competitionId, basicInfoSchema);
        // setDataInLocalStorage
        // navigate(-1);
      } else if (response.status === 401) {
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 5000, "colored", "top-center");
        dispatch(logoutUser());
        // navigate("/login");
      } else {
        const errorMessage = `Failed to save Info! \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 5000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const updateCourse = (id, tab, coursesSchema) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const competitionId = id;
      // Always send the array of courses directly
      const response = await CompetitionServices.saveCoursesInfo(
        competitionId,
        JSON.stringify(coursesSchema),
        token,
      );
      console.log('[DEBUG] Backend response after saving courses:', response);
      if (response.status === 200) {
        notifyMessage("success", "Information Saved!", 5000, "colored", "top-center");
        await dispatch(updateAvailableSteps(tab));
        // Fetch the tournament again to ensure Redux state is in sync with backend
        await dispatch(fetchCompetitionByID(competitionId));
      } else if (response.status === 401) {
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 5000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to save Info! \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 5000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// export const updateRounds = (id, tab, roundsSchema) => {
//   console.log("dateriound", id, tab, roundsSchema);
//   return async (dispatch, getState) => {
//     dispatch(setLoading(true));
//     try {
//       const state = getState();
//       const token = state.user.tokens.jwtToken;
//       const competitionId = id;

//       const response = await CompetitionServices.saveRoundsInfo(
//         competitionId,
//         JSON.stringify(roundsSchema.roundsInfo),
//         token
//       );
//       if (response.status === 200) {
//         notifyMessage("success", "Information Saved!", 5000, "colored", "top-center");
//         // update state
//         // save on redux state only when it saves on the database successfully
//         await dispatch(updateAvailableSteps(tab));
//         await dispatch(updateActiveTournamentAction({ _id: competitionId, schema: { rounds: roundsSchema } }));
//       } else if (response.status === 401) {
//         const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
//         notifyMessage("error", responseMessage, 5000, "colored", "top-center");
//         dispatch(logoutUser());
//       } else {
//         const errorMessage = `Failed to save Info! \n ${response.data.message ? response.data.message : ""}`;
//         throw new Error(errorMessage);
//       }
//     } catch (err) {
//       notifyMessage("error", err.message, 5000, "colored", "top-center");
//     } finally {
//       dispatch(setLoading(false));
//     }
//   };
// };

export const updateDivisions = (id, tab, divisionSchema) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const competitionId = id;

      // Get either the new divisions or keep existing ones from active tournament
      const divisionsToSave = divisionSchema || state.competitions.activeTournament?.divisions || [];

      const processedDivisions = divisionsToSave.map(division => {
        const divisionClientId = division.clientId || division.id || CompetitionServices.uuidv4();
        const processedRounds = (division.rounds || []).map(round => {
          return {
            ...round,
            clientId: round.clientId || round.id || CompetitionServices.uuidv4(),
          };
        });

        return {
          ...division,
          clientId: divisionClientId,
          rounds: processedRounds,
        };
      });

      const response = await CompetitionServices.saveDivisionsInfo(
        competitionId,
        JSON.stringify(processedDivisions),
        token,
      );

      if (response.status === 200) {
        notifyMessage("success", "Information Saved!", 5000, "colored", "top-center");
        // update state
        // save on redux state only when it saves on the database successfully
        await dispatch(updateAvailableSteps(tab));

        await dispatch(
          updateActiveTournamentAction({
            _id: competitionId,
            schema: { divisions: processedDivisions },
          }),
        );

        // CRITICAL FIX: Do NOT re-initialize wizard state after division save
        // because it would recalculate dayOffsets from saved dates, overriding user changes
        // The wizard state already has the correct offsets from the modal form submission
        console.log("💾 DIVISION SAVE SUCCESS - preserved wizard state");

        return { success: true, data: response.data };
      } else if (response.status === 401) {
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 5000, "colored", "top-center");
        dispatch(logoutUser());
        return { success: false, error: responseMessage };
      } else {
        const errorMessage = `Failed to save Info! \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error("💥 updateDivisions error:", err);
      notifyMessage("error", err.message, 5000, "colored", "top-center");
      return { success: false, error: err.message };
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const registerPlayerForTournament = (
  competitionId,
  divisionId,
  swagSize,
  golfScore,
  runningTime,
  playerName,
  divisionName,
  paymentIntentId = null,
  totalFeesPaid = null,
  homeCountry = null,
) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const user = state.user.user;
      if (!user?._id) {
        throw new Error("User not found");
      }

      const selectedDivision = state.competitions.activeTournament.divisions.find(div => div._id === divisionId);
      const tournament = state.competitions.activeTournament;

      let totalFeesPaid = null;
      let processingFee = 0;
      let flatFee = 0;

      if (selectedDivision && tournament.regPaymentInfo.payThroughApp) {
        const entryFee = selectedDivision.entryFee || 0;
        const processingPercent = tournament.regPaymentInfo.processingPercent || 0;
        const flatTransactionFee = tournament.regPaymentInfo.processingFee || 0;

        processingFee = (entryFee * processingPercent) / 100;
        flatFee = flatTransactionFee;
        totalFeesPaid = entryFee + processingFee + flatFee;
      }

      const playerData = {
        userId: user._id,
        division: divisionId,
        swagSize: swagSize || null,
        billingEmail: user.accountInfo.email,
        paymentIntentId,
        avgGolfScore: parseInt(golfScore),
        fiveKRunningTime: parseInt(runningTime),
        playerName,
        divisionName,
        totalFeesPaid,
        processingFee,
        flatFee,
        homeCountry: homeCountry || user.personalInfo.homeCountry || null,
        homeTown: user.personalInfo.hometown || null,
        profilePic: user.personalInfo.profilePic || null,
        homeState: user.personalInfo.homeState || null,
        gender: user.personalInfo.parGender || null,
      };
      const response = await CompetitionServices.registerPlayerToTournament(competitionId, playerData, token);
      if (response.status === 200) {
        notifyMessage("success", "Successfully registered for tournament!", 5000, "colored", "top-center");
        if (response.data) {
          dispatch(setActiveTournamentAction(response.data));
        }
        return true;
      } else {
        throw new Error(response.data?.message || "Failed to register for tournament");
      }
    } catch (err) {
      console.error("Registration error:", err);
      notifyMessage("error", err.message, 5000, "colored", "top-center");
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const adminAddPlayerToTournament = (competitionId, selectedPlayer) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const tournament = state.competitions.activeTournament;

      // Check if player is already in tournament with withdrawn status
      const existingPlayer = tournament.players?.find(p => p.userId === selectedPlayer.id);
      if (existingPlayer && existingPlayer.status === "withdrawn") {
        // Player exists but is withdrawn - we should reactivate instead of creating new registration
        console.log("Player is withdrawn, should reactivate instead of creating new registration");
        console.log("Existing player data:", existingPlayer);

        // For now, we'll proceed with the regular registration which may create a duplicate
        // TODO: Implement proper reactivation endpoint or modify backend to handle this case
        notifyMessage(
          "info",
          `${selectedPlayer.name} was previously withdrawn. Creating new registration...`,
          3000,
          "colored",
          "top-center",
        );
      }

      // Fetch complete user profile to get all necessary data
      const userResponse = await UserServices.getUserById(token, selectedPlayer.id);
      if (userResponse.status !== 200) {
        throw new Error("Failed to fetch user profile");
      }

      const fullUserData = userResponse.data;

      // Use default division (first division available)
      const defaultDivision = tournament.divisions?.[0];

      if (!defaultDivision) {
        throw new Error("No divisions available in tournament");
      }

      // Create player data using the complete user profile
      const playerData = {
        userId: selectedPlayer.id,
        division: defaultDivision._id,
        swagSize: null,
        billingEmail: fullUserData.accountInfo?.email || "",
        paymentIntentId: null,
        avgGolfScore: 85, // default golf score
        fiveKRunningTime: 25, // default 5K time (25 minutes)
        playerName: selectedPlayer.name,
        divisionName: defaultDivision.name,
        totalFeesPaid: 0, // admin added players pay 0
        processingFee: 0,
        flatFee: 0,
        homeCountry: fullUserData.personalInfo?.homeCountry || null,
        homeTown: fullUserData.personalInfo?.hometown || null,
        profilePic: fullUserData.personalInfo?.profilePic || null,
        homeState: fullUserData.personalInfo?.homeState || null,
        gender: fullUserData.personalInfo?.parGender || null,
      };

      // Use the existing registerPlayerToTournament service with selected player data
      const response = await CompetitionServices.registerPlayerToTournament(competitionId, playerData, token);
      if (response.status === 200) {
        notifyMessage(
          "success",
          `Successfully added ${selectedPlayer.name} to tournament!`,
          5000,
          "colored",
          "top-center",
        );
        if (response.data) {
          dispatch(setActiveTournamentAction(response.data));

          // Check for duplicate players after adding
          const addedPlayerRegistrations = response.data.players?.filter(p => p.userId === selectedPlayer.id);
          if (addedPlayerRegistrations && addedPlayerRegistrations.length > 1) {
            console.warn(
              `DUPLICATE DETECTED: ${selectedPlayer.name} now has ${addedPlayerRegistrations.length} registrations:`,
            );
          }
        }
        return true;
      } else {
        console.error("Registration failed with response:", response);
        throw new Error(response.data?.message || "Failed to add player to tournament");
      }
    } catch (err) {
      console.error("Admin add player error:", err);
      console.error("Error response data:", err.response?.data);
      notifyMessage("error", err.response?.data?.message || err.message, 5000, "colored", "top-center");
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// export const processPlayerRefund = (competitionId, playerId, reason) => {
//   return async (dispatch, getState) => {
//     dispatch(setLoading(true));
//     try {
//       const state = getState();
//       const token = state.user.tokens.jwtToken;

//       const response = await CompetitionServices.processRefund(competitionId, playerId, reason, token);

//       if (response.status === 200) {
//         notifyMessage("success", response.data.message || "Withdrawal successful.", 5000, "colored", "top-center");

//         await dispatch(fetchAllCompetitions());

//         return true;
//       } else {
//         throw new Error(response.data?.message || "Failed to process withdrawal and refund");
//       }
//     } catch (error) {
//       console.error("Refund error:", error);
//       notifyMessage(
//         "error",
//         error.message || "An error occurred while processing your withdrawal",
//         5000,
//         "colored",
//         "top-center"
//       );
//       return false;
//     } finally {
//       dispatch(setLoading(false));
//     }
//   };
// };

export const processPlayerRefund = (competitionId, playerId, reason) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;

      const response = await CompetitionServices.processRefund(competitionId, playerId, reason, token);

      if (response.status === 200) {
        const message =
          response.data.refundEligible === false
            ? "Withdrawal successful, but refund was denied because the withdrawal deadline has passed."
            : response.data.message || "Withdrawal successful.";

        notifyMessage("success", message, 5000, "colored", "top-center");

        await dispatch(fetchAllCompetitions());

        return true;
      } else {
        throw new Error(response.data?.message || "Failed to process withdrawal and refund");
      }
    } catch (error) {
      console.error("Refund error:", error);
      notifyMessage(
        "error",
        error.message || "An error occurred while processing your withdrawal",
        5000,
        "colored",
        "top-center",
      );
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const processPayout = competitionId => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const response = await CompetitionServices.processTournamentPayout(competitionId, token);

      if (response.status === 200) {
        notifyMessage("success", "Tournament payout processed successfully!", 5000, "colored", "top-center");
        await dispatch(fetchAllCompetitions());
        return true;
      } else {
        throw new Error(response.data?.message || "Failed to process tournament payout");
      }
    } catch (err) {
      notifyMessage("error", err.message, 5000, "colored", "top-center");
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

// async thunk for fetching all users from the database and saving it in the redux state
export const fetchAllUsers = () => {
  return async (dispatch, getState) => {
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const response = await CompetitionServices.fetchUsers(token);
      if (response.status === 200) {
        // update state
        await dispatch(setAllUsers(response.data));
      } else if (response.status === 401) {
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 5000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to fetch Users! \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      notifyMessage("error", error.message, 5000, "colored", "top-center");
    }
  };
};

// 🎯 CLEAN/DIRTY STATE MANAGEMENT: Cancel wizard changes and restore from last saved state
export const cancelWizardChangesAction = () => (dispatch, getState) => {
  console.log("🚫 Canceling wizard changes - restoring from activeTournament");

  // Simply dispatch the slice action that handles the restore logic
  dispatch(cancelWizardChanges());

  console.log("✅ Wizard changes canceled - state restored from last saved data");
};

// 🎯 CANCEL AND STAY: Reset current tab only without closing wizard
export const cancelCurrentTabChanges = currentTab => (dispatch, getState) => {
  console.log(`🚫 Canceling changes for tab: ${currentTab} - restoring from activeTournament`);

  // Simply dispatch the slice action that handles the restore logic
  dispatch(cancelWizardChanges());

  console.log(`✅ Tab ${currentTab} restored from last saved data`);
};

export const fetchAllCompetitions = () => {
  return async (dispatch, getState) => {
    try {
      const token = getJWTToken(getState);
      const response = await CompetitionServices.getAllCompetitions(token);
      if (response.status === 200) {
        // update state
        await dispatch(setTournamentsAction(response.data));
      } else if (response.status === 401) {
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 5000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to fetch all competitions! \n ${
          response.data.message ? response.data.message : ""
        }`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      notifyMessage("error", error.message, 5000, "colored", "top-center");
    }
  };
};

// GET CALL
export const fetchCompetitionByID = id => {
  return async (dispatch, getState) => {
    try {
      const token = getJWTToken(getState);
      const competitionId = id;

      const response = await CompetitionServices.getCompetitionById(competitionId, token);
      console.log('[DEBUG] Backend response after fetching tournament:', response);
      if (response.status === 200) {
        const courseIds = response.data.courses.map(course => course.courseId);
        const coursesResponse = await CoursesServices.fetchCourseByIds(courseIds, token);
        if (coursesResponse.status === 200) {
          await dispatch(updateCourses(coursesResponse.data));
          await dispatch(setActiveTournamentAction(response.data));
        } else if (coursesResponse.status === 401) {
          const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
          notifyMessage("error", responseMessage, 5000, "colored", "top-center");
          dispatch(logoutUser());
        }
        // update state
      } else if (response.status === 401) {
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 5000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        const errorMessage = `Failed to fetch all competitions! \n ${
          response.data.message ? response.data.message : ""
        }`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      notifyMessage("error", error.message, 5000, "colored", "top-center");
    }
  };
};

export const saveTeeSheet = (id, teeSheetData) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const response = await CompetitionServices.saveTeeSheetInfo(id, teeSheetData, token);
      console.log("SaveTeeSheet Full Response:", response);
    } catch (err) {
      console.error("COMPLETE saveTeeSheet Error:", err);
      notifyMessage("error", err.message, 5000, "colored", "top-center");
      throw err;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const fetchTeeSheet = competitionId => {
  return async (dispatch, getState) => {
    try {
      const token = getJWTToken(getState);
      const response = await CompetitionServices.getTeeSheet(competitionId, token);
      if (response.status === 200) {
        return response.data;
      } else {
        throw new Error(`Failed to fetch tee sheet: ${response.data.message || ""}`);
      }
    } catch (error) {
      notifyMessage("error", error.message, 5000, "colored", "top-center");
      return null;
    }
  };
};

const formatToAMPM = time => {
  if (!time || time === "--:--") return "";
  if (time.includes("AM") || time.includes("PM")) {
    return time;
  }
  const [hours, minutes, seconds = "00"] = time.split(":").map(Number);
  const period = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  return `${String(formattedHours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(
    2,
    "0",
  )} ${period}`;
};

export const saveTournamentScores = (
  competitionId,
  playerId,
  roundId,
  scores,
  out,
  inTotal,
  totalScore,
  startTime,
  finishTime,
  totalTime,
  speedGolfScore,
) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;

      const scoreData = {
        playerId,
        roundId,
        scores,
        out,
        in: inTotal,
        totalScore,
        startTime,
        finishTime: finishTime.includes("AM") || finishTime.includes("PM") ? finishTime : formatToAMPM(finishTime), // Make sure it's in HH:mm:ss AM/PM format
        totalTime,
        speedGolfScore,
      };

      const response = await CompetitionServices.savePlayerScores(competitionId, scoreData, token);
      if (response.status === 200) {
        notifyMessage("success", "Scores saved successfully!", 5000, "colored", "top-center");
        return true;
      } else {
        throw new Error(response.data?.message || "Failed to save scores.");
      }
    } catch (error) {
      notifyMessage("error", error.message, 5000, "colored", "top-center");
      return false;
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const togglePublishStatus = (id, publishStatus, stripeAccountId = null) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const response = await CompetitionServices.updatePublishStatus(id, publishStatus, stripeAccountId, token);

      if (response.status === 200) {
        notifyMessage(
          "success",
          `Tournament ${publishStatus ? "published" : "unpublished"} successfully!`,
          5000,
          "colored",
          "top-center",
        );
        // Refresh the tournaments list
        await dispatch(fetchAllCompetitions());
      } else {
        throw new Error(response.data?.message || "Failed to update tournament status");
      }
    } catch (err) {
      notifyMessage("error", err.message, 5000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const fetchTeesets = () => {
  return async (dispatch, getState) => {
    try {
      const token = getJWTToken(getState);
      const response = await CompetitionServices.fetchAllTeesets(token);
      if (response.status === 200) {
        dispatch(setTeesets(response.data)); // Save teesets
      } else if (response.status === 401) {
        const responseMessage = `Please Login Again! \n ${response.data.message || ""}`;
        notifyMessage("error", responseMessage, 5000, "colored", "top-center");
        dispatch(logoutUser());
      } else {
        throw new Error(`Failed to fetch teesets! ${response.data.message || ""}`);
      }
    } catch (error) {
      notifyMessage("error", error.message, 5000, "colored", "top-center");
    }
  };
};

// export const searchCourses = (query) => {
//   return async (dispatch, getState) => {
//     dispatch(setLoading(true));
//     try {
//       const state = getState();
//       const token = state.user.tokens.jwtToken;
//       const response = await CoursesServices.searchCourses({searchString: query, category: "Name", limit: 1});
//       if (response.status === 200) {
//         return response.data;
//       }
//     } catch (error) {
//       notifyMessage("error", error.message, 5000, "colored", "top-center");
//     } finally {
//       dispatch(setLoading(false));
//     }
//   }
// }
