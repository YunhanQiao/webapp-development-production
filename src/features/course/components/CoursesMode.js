 /*************************************************************************
 * File: coursesMode.js
 * This file defines the CoursesMode react component, which implements
 * SpeedScore's "Courses" mode
 ************************************************************************/
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {useState} from 'react';
import CoursesModeAdd from './CoursesModeAdd.js';
import CoursesModeSearchFilter from './CoursesModeSearchFilter.js';
import CoursesModeTable from './CoursesModeTable.js';
import CoursesModeDetails from './CoursesModeDetails.js';

export default function CoursesMode() {
    const coursesDB = JSON.parse(localStorage.getItem("courses"));
    const [courses, setCourses] = useState(coursesDB === null ? {} : coursesDB);
    const [showAddCourseDialog, setShowAddCourseDialog] = useState(false);
    const [showCourseDetailsDialog, setShowCourseDetailsDialog] = useState(null);
    const [displayedCourses, setDisplayedCourses] = useState(courses);
    const [searchParam, setSearchParam] = useState('');
    const [searchState, setSearchState] = useState('Name');

    /*************************************************************************
     * @function openCourseDetailsDialog 
     * @Desc 
     * When the user clicks on the "Details" button for a course, call the 
     * external JavaScript function transitionToDialog to hide banner bar 
     * and mode tabs. Finally, set the showCourseDetails state variable to
     * the course whose details are to be displayed, which will trigger
     * the component to be rerendered to display the "Course Details" dialog.
     *************************************************************************/
    function openCourseDetailsDialog(c) {
        window.transitionToDialog(null,"View/Edit Course Details for " + c.shortName,function(){});
        setShowCourseDetailsDialog(c);
    }

    /*************************************************************************
     * @function closeAddCourseDialog 
     * @Desc 
     * When the user closes the "Course Details" dialog, update the selected
     * course's details and commit to database if necessary, and then call
     * the JavaScript function transitionFromDialog to redisplay banner bar 
     * and mode tabs. Finally, set the selectedCourse state variable to null
     * to re-render the component to display the "main" page.
     *************************************************************************/
    function closeCourseDetailsDialog(updatedCourse) {
        if (updatedCourse !== null) {
            const newCourses = {...courses};
            const newDisplayedCourses = {...displayedCourses};
            newCourses[updatedCourse.id] = updatedCourse;
            newDisplayedCourses[updatedCourse.id] = updatedCourse;
            localStorage.setItem("courses",JSON.stringify(newCourses));
            setCourses(newCourses);
            setDisplayedCourses(newDisplayedCourses);
        }
        window.transitionFromDialog(null);
        setShowCourseDetailsDialog(null);
    }

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
            coursesList = {...courses};
        } else {
            Object.keys(courses).forEach((c) => {
            if (searchScope==="Name" && courses[c].shortName.toUpperCase().includes(searchString.toUpperCase())) {
                coursesList[c] = courses[c];
            } else if (searchScope==="State" && courses[c].state.toUpperCase().includes(searchString.toUpperCase())) {
                coursesList[c] = courses[c]; 
            } else if (searchScope==="Country" && courses[c].country.toUpperCase().includes(searchString.toUpperCase())) {
                coursesList[c] = courses[c];
            }
            });
        }
        setDisplayedCourses(coursesList);
        setSearchParam(searchString);
        setSearchState(searchScope);
    }


    

    /*************************************************************************
     * @function addCourse
     * @param course, an object containing course info merged the Google 
     * 'getPlacePredictions() and getDetails() functions.  
     * @Desc 
     * Add the object to the courses database in local storage, and update
     * courses set state.
     *************************************************************************/
    function addCourse(course) {
        const newCourses = {...courses,[course.id]:course};
        localStorage.setItem("courses",JSON.stringify(newCourses));
        setCourses(newCourses);
        setDisplayedCourses(newCourses);
    }
    
    /*************************************************************************
     * @function openAddCourseDialog 
     * @Desc 
     * When the user opens the "Add Course" dialog, call the 
     * external JavaScript function transitionToDialog hide banner bar 
     * and mode tabs. Finally, set the addCourse state variable to true to
     * re-render the component to display the "Add Course" dialog.
     *************************************************************************/
    function openAddCourseDialog() {
        window.transitionToDialog(null,"Add Course",function(){});
        setShowAddCourseDialog(true);
    }

    /*************************************************************************
     * @function closeAddCourseDialog 
     * @Desc 
     * When the user closes the "Add Course" dialog, add the selected course
     * (if any) to SpeedScore's database and then call the 
     * external JavaScript function transitionFromDialog redisplay banner bar 
     * and mode tabs. Finally, set the addCourse state variable to false
     * re-render the component to display the "main" page.
     *************************************************************************/
    function closeAddCourseDialog(course) {
        if (course != null) {
            addCourse(course);
        } 
        window.transitionFromDialog(null);
        setShowAddCourseDialog(false);
    }

    /* JSX code to render the component */
    return(
      (showAddCourseDialog) ?
         <CoursesModeAdd closeDialog={closeAddCourseDialog} /> :
      (showCourseDetailsDialog !== null) ?
         <CoursesModeDetails currentCourse={showCourseDetailsDialog} closeCourseDetails={closeCourseDetailsDialog} /> :
         <>
            <h1 className="centered">Courses</h1>
            <CoursesModeSearchFilter updateDisplayedCourses={updateDisplayedCourses}
                                    searchParam={searchParam}
                                    searchState={searchState} 
            />
            <CoursesModeTable coursesToDisplay={displayedCourses} numCourses={courses !== null ? Object.keys(courses).length : 0} showCourseDetails={openCourseDetailsDialog} />
            <button className="float-btn" onClick={openAddCourseDialog}>
              <FontAwesomeIcon icon="map-pin" />
              &nbsp;Add Course
            </button>
        </>
    );
}  