import { notifyMessage } from "../../services/toasterServices";
import { logoutUser, setLoading } from "../user/userSlice";
import { deleteRound, fetchRoundById, fetchRounds, logRound, updateRound as updateRoundService } from "./roundServices";
import { addRound, removeRound, setRound, setRounds, setSelectedRound, updateRound } from "./roundSlice";

const handle401Response = (response, dispatch, navigate) => {
  const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
  notifyMessage("error", responseMessage, 1000, "colored", "top-center");
  dispatch(logoutUser());
  navigate("/login");
};

const notifyError = errorMessage => {
  notifyMessage("error", errorMessage, 1000, "colored", "top-center");
};

const notifySuccess = successMessage => {
  notifyMessage("success", successMessage, 1000, "colored", "top-center");
};

const getCourseId = (courses, courseName) => {
  // There will be only single course in the courses array after an auto selected item is picked.
  // All the previous courses array will be replaced by the new item
  if (courses.length < 0) return null;
  const selectedCourse = courses.filter(course => course.shortName.toLowerCase() === courseName.toLowerCase());
  if (!selectedCourse.length) return null;
  return selectedCourse[0].id;
};

const getTeeId = (courses, courseId, teeName) => {
  // There will be only single course in the courses array after an auto selected item is picked.
  // All the previous courses array will be replaced by the new item
  if (courses.length < 0 || !teeName) return null;
  const selectedCourse = courses.find(course => course.id === courseId);
  if (!selectedCourse) return null;
  const selectedTee = Object.values(selectedCourse.tees).find(tee => tee.name.toLowerCase() === teeName.toLowerCase());
  if (!selectedTee) return null;
  return selectedTee._id;
};

const generateRoundDataWithJunctionIds = (roundData, state) => {
  const userId = state.user.user._id;
  const courses = state.courses;
  const courseId = getCourseId(courses, roundData.course);
  const teeId = getTeeId(courses, courseId, roundData.tee?.name);
  return {
    ...roundData,
    playerId: userId,
    courseId: courseId,
    teeId: teeId,
    time: parseInt(roundData.minutes) * 60 + parseInt(roundData.seconds),
  };
};

export const logRoundAction = (roundData, navigate) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      // const userId = state.user.user._id;
      // const courses = state.courses;
      // const courseId = getCourseId(courses, roundData.course);
      // const teeId = getTeeId(courses, courseId, roundData.tee.name);
      // const roundDataWithIDs = {
      //   ...roundData,
      //   playerId: userId,
      //   courseId: courseId,
      //   teeId: teeId,
      //   time: (parseInt(roundData.minutes) * 60) + parseInt(roundData.seconds),
      // };
      const roundDataWithIDs = generateRoundDataWithJunctionIds(roundData, state);
      const response = await logRound(roundDataWithIDs, token);
      if (response.status == 200) {
        dispatch(addRound(response.data));
        notifySuccess("Round logged successfully!");
        navigate(-1);
      } else if (response.status == 401) {
        handle401Response(response, dispatch, navigate);
      } else {
        const errorMessage = `Failed to log round. \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.log("ERROR in ADD ROUND ACTION", error);
      notifyError(error.message);
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const fetchAllRoundsAction = navigate => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const response = await fetchRounds(token);
      if (response.status == 200) {
        localStorage.setItem("rounds", JSON.stringify(response.data));
        dispatch(setRounds(response.data));
      } else if (response.status == 401) {
        handle401Response(response, dispatch, navigate);
      } else {
        const errorMessage = `Failed to fetch rounds. \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      notifyError(error.message);
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const deleteRoundAction = (roundId, navigate) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const response = await deleteRound(roundId, token);
      if (response.status == 200) {
        notifySuccess("Round deleted successfully!");
        localStorage.setItem("rounds", JSON.stringify(response.data));
        dispatch(removeRound(roundId));
        navigate("/rounds");
      } else if (response.status == 401) {
        handle401Response(response, dispatch, navigate);
      } else {
        const errorMessage = `Failed to delete round. \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      notifyError(error.message);
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const updateRoundAction = (roundId, roundData, navigate) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      // const userId = state.user.user._id;
      // const courses = state.courses;
      // const courseId = getCourseId(courses, roundData.course);
      // const teeId = getTeeId(courses, courseId, roundData.tee.name);
      // const roundDataWithIDs = {
      //   ...roundData,
      //   playerId: userId,
      //   courseId: courseId,
      //   teeId: teeId,
      //   time: (parseInt(roundData.minutes) * 60) + parseInt(roundData.seconds),
      // };
      const roundDataWithIDs = generateRoundDataWithJunctionIds(roundData, state);
      const response = await updateRoundService(roundId, roundDataWithIDs, token);
      if (response.status == 200) {
        // dispatch(addRound(response.data));
        dispatch(updateRound({ id: roundId, round: response.data }));
        notifySuccess("Round updated successfully!");
        navigate("/rounds");
      } else if (response.status == 401) {
        handle401Response(response, dispatch, navigate);
      } else {
        const errorMessage = `Failed to update round. \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      notifyError(error.message);
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const fetchRoundByIdAction = (roundId, navigate) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const response = await fetchRoundById(roundId, token);
      if (response.status == 200) {
        console.log("Round fetched successfully-----------------");
        dispatch(setRound(response.data));
      } else if (response.status == 401) {
        handle401Response(response, dispatch, navigate);
      } else {
        const errorMessage = `Failed to fetch round. \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (error) {
      notifyError(error.message);
    } finally {
      dispatch(setLoading(false));
    }
  };
};
