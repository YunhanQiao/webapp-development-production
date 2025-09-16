import { useEffect, useState } from "react";
import CoursesModeSearchFilter from "./CoursesModeSearchFilter";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useNavigate } from "react-router-dom";
import CoursesModeTable from "./CoursesModeTable";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourses } from "../courseActions";

const CoursesSection = () => {
  const coursesDB = JSON.parse(localStorage.getItem("courses"));
  // const [courses, setCourses] = useState(coursesDB === null ? {} : coursesDB);
  const courses = useSelector(state => state.courses);
  // console.log('Courses from redux state', courses);
  // const [displayedCourses, setDisplayedCourses] = useState(courses);
  const [displayedCourses, setDisplayedCourses] = useState([]);
  const [searchParam, setSearchParam] = useState('');
  const [searchState, setSearchState] = useState('Name');
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    dispatch(fetchCourses(navigate))
  }, []);

  useEffect(() => {
    if (JSON.stringify(courses) !== JSON.stringify(displayedCourses)) {
      setDisplayedCourses(courses);
    }
  }, [courses])

  /*************************************************************************
   * @function updatedDisplayedCourses
   * @param searchString, the target search string
   * @param searchScope: the scope of the search (either "Name", "State",
   *         or "Country"
   * @Desc
   * Update displayedCourses to include only those courses that meet
   * the current search criteria entered by the user.
   *************************************************************************/
  function updateDisplayedCourses(searchString, searchScope) {
    if (courses === null) return;
    let coursesList = {};
    if (searchString === "") {
      coursesList = { ...courses };
    } else {
      Object.keys(courses).forEach((c) => {
        if (
          searchScope === "Name" &&
          courses[c].shortName
            .toUpperCase()
            .includes(searchString.toUpperCase())
        ) {
          coursesList[c] = courses[c];
        } else if (
          searchScope === "State" &&
          courses[c].state.toUpperCase().includes(searchString.toUpperCase())
        ) {
          coursesList[c] = courses[c];
        } else if (
          searchScope === "Country" &&
          courses[c].country.toUpperCase().includes(searchString.toUpperCase())
        ) {
          coursesList[c] = courses[c];
        }
      });
    }
    setDisplayedCourses(coursesList);
    setSearchParam(searchString);
    setSearchState(searchScope);
  }

  const addCourseHandler = () => {
    navigate('/courses/newCourse');
  }

  return (
    <>
      <h1 className="centered">Courses</h1>
      <CoursesModeSearchFilter
        updateDisplayedCourses={updateDisplayedCourses}
        searchParam={searchParam}
        searchState={searchState}
      />
      <CoursesModeTable
        coursesToDisplay={displayedCourses}
        numCourses={courses !== null ? Object.keys(courses).length : 0}
        // showCourseDetails={openCourseDetailsDialog}
        showCourseDetails={() => {}}
      />
      {/* <button className="float-btn" onClick={openAddCourseDialog}> */}
      <button className="float-btn" id="addCourse" onClick={addCourseHandler}>
        <FontAwesomeIcon icon="map-pin" />
        &nbsp;Add Course
      </button>
    </>
  );
};

export default CoursesSection;
