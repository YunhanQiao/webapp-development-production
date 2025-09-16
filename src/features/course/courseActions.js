import { notifyMessage } from "../../services/toasterServices";
import { logoutUser, setLoading } from "../user/userSlice";
import { setCourses, updateCourse, updateCourses } from "./courseSlice";
import * as courseServices from "./courseServices";
import { prepareCourseInfoUpdate } from "../../services/formParser";

export const fetchCourses = navigate => {
  return async (dispatch, getState) => {
    await dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const response = await courseServices.fetchCourses(token);
      if (response.status === 200) {
        localStorage.setItem("courses", JSON.stringify(response.data)); //local storage saving of courses
        dispatch(setCourses(response.data));
      } else if (response.status === 401) {
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
        navigate("/login");
      } else {
        const errorMessage = `Failed to fetch Courses! \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const addCourse = (course, navigate, goBack = true) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const userId = state.user.user._id;
      Object.assign(course, { editors: { courseOwner: userId, courseEditors: [] } });
      Object.keys(course).forEach(key => {
        if (course[key] === undefined) {
          course[key] = null;
        }
      });
      course.tees = [];
      const response = await courseServices.addCourses(course, token);
      if (response.status === 200) {
        notifyMessage("success", "Course Added Successfully!", 1000, "colored", "top-center");
        dispatch(setCourses(response.data));
        if (goBack) navigate(-1);
      } else if (response.status === 401) {
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
        navigate("/login");
      } else {
        const errorMessage = `Failed to add Course! \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const searchCourses = ({ searchString, category, limit }, navigate) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const response = await courseServices.searchCourses({ searchString, category, limit }, token);
      if (response.status === 200) {
        // const courses = [];
        // if (response.data) courses.push(response.data) // response.data is an object but not an array. So, we need to push it to an array.
        // dispatch(setCourses(courses));
        if (response.data) {
          dispatch(updateCourse({ id: response.data.id, course: response.data }));
        }
      } else if (response.status === 401) {
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
        navigate("/login");
      } else {
        const errorMessage = `Failed to search Courses! \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 *
 * @param {String} courseId required
 * @param {Object} navigate required
 * @param {Function} setInitialFetch optional -> look courseDetailsPage for more info!
 * @returns async function
 */
export const fetchCourseById = (courseId, navigate, setInitialFetch) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const response = await courseServices.fetchCourseById(courseId, token);
      if (response.status === 200) {
        // dispatch(setCourses(response.data));
        // this course also contains holes and tees information
        // TODO: instead of updating, we can remove old course state and use this as only course. Saves memory.
        // * The above TODO cant be implemented, because of the suggestions in course component in rounds.
        dispatch(updateCourse({ id: courseId, course: response.data }));
        // dispatch(setCourses([response.data]));
        if (setInitialFetch) setInitialFetch(true);
        return response.data;
      } else if (response.status === 401) {
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
        navigate("/login");
      } else {
        const errorMessage = `Failed to fetch Course! \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const fetchCourseByIds = (courseIds, navigate) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const response = await courseServices.fetchCourseByIds(courseIds, token);
      if (response.status === 200) {
        dispatch(updateCourses(response.data));
        return response.data;
      } else if (response.status === 401) {
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
        navigate("/login");
      } else {
        const errorMessage = `Failed to fetch Courses! \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const updateCourseInfo = (courseId, courseInfo, navigate) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const response = await courseServices.updateCourseInfo(courseId, courseInfo, token);
      if (response.status === 200) {
        notifyMessage("success", "Course info updated successfully!", 1000, "colored", "top-center");
        dispatch(updateCourse({ id: courseId, course: response.data }));
        // navigate(-1);
      } else if (response.status === 401) {
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
        navigate("/login");
      } else {
        const errorMessage = `Failed to update Course info! \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};

export const updateCourseAction = (courseId, course, navigate) => {
  return async (dispatch, getState) => {
    dispatch(setLoading(true));
    try {
      const state = getState();
      const token = state.user.tokens.jwtToken;
      const response = await courseServices.updateCourse(courseId, course, token);
      if (response.status === 200) {
        notifyMessage("success", "Course updated successfully!", 1000, "colored", "top-center");
        dispatch(updateCourse({ id: courseId, course: response.data }));
        navigate(-1);
      } else if (response.status === 401) {
        const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
        notifyMessage("error", responseMessage, 1000, "colored", "top-center");
        dispatch(logoutUser());
        navigate("/login");
      } else {
        const errorMessage = `Failed to update Course! \n ${response.data.message ? response.data.message : ""}`;
        throw new Error(errorMessage);
      }
    } catch (err) {
      notifyMessage("error", err.message, 1000, "colored", "top-center");
    } finally {
      dispatch(setLoading(false));
    }
  };
};
