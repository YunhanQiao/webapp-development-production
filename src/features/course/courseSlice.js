import { createSlice } from "@reduxjs/toolkit";
import { logoutUser } from "../user/userSlice";

const courseSlice = createSlice({
  name: "course",
  initialState: [],
  reducers: {
    setCourses(state, action) {
      return action.payload;
    },
    addCourse(state, action) {
      state.push(action.payload);
    },
    updateCourse(state, action) {
      const courseIndex = state.findIndex(course => course.id === action.payload.id);
      // if (Object.values(action.payload.course.tees).length === 0) action.payload.course.tees = [];
      state[courseIndex] = action.payload.course;
    },
    updateCourses(state, action) {
      const courses = action.payload;
      for (let i = 0; i < courses.length; i++) {
        const courseIndexInState = state.findIndex(course => course.id === courses[i].id);
        if (courseIndexInState !== -1) {
          state[courseIndexInState] = courses[i];
        } else {
          state.push(courses[i]);
        }
      }
    },
    deleteCourse(state, action) {
      return state.filter(course => course._id !== action.payload);
    },
    searchCourses(state, action) {
      const { searchString, category } = action.payload;
      // console.log('SEARCH STRING: ', searchString);
      // console.log('Payload: ', action.payload);
      const coursesData = localStorage.getItem("courses");
      if (!coursesData || coursesData == "[]") return state;
      const courses = JSON.parse(coursesData);
      const keywords = searchString.split(/[\s,]+/);
      const regexPattern = keywords.map(word => `(?=.*${word})`).join("");
      const regex = new RegExp(regexPattern, "i");
      const filteredCourses = courses.filter(course => {
        if (searchString.trim().length === 0) return true;
        const valueToTest = course[category.toLowerCase()];
        return regex.test(valueToTest);
      });
      // console.log('Filltered Courses: ', filteredCourses);
      return filteredCourses;
    },
  },
  extraReducers: builder => {
    builder.addCase(logoutUser, (state, action) => {
      return [];
    });
  },
});

export default courseSlice.reducer;
export const { setCourses, addCourse, updateCourse, deleteCourse, searchCourses, updateCourses } = courseSlice.actions;
