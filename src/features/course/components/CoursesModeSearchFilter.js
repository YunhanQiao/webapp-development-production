import { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
// import { searchCourses } from '../courseActions';
import { useNavigate } from 'react-router-dom';
import { searchCourses } from '../courseSlice';

/*************************************************************************
* File: coursesModeSearch.js
* This file defines the CoursesModeSearch React component, which allows
* users to search for and filter golf courses
************************************************************************/

export default function CoursesModeSearchFilter({ updateDisplayedCourses, searchParam, searchState }) {

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const [searchBoxContents, setSearchBoxContents] = useState(searchParam);
    const [searchScope, setSearchScope] = useState(searchState);

    function setData(key, value) {
        let tempFilters = JSON.parse(localStorage.getItem('filters'));
        localStorage.setItem('filters', JSON.stringify({
            ...tempFilters,
            courses: {
                ...tempFilters.courses,
                [key]: value,
            }
        }));
    }

    function handleSearchBoxChange(event) {
        /*
        THIS is old code to manage local storage
        setSearchBoxContents(event.target.value);
        updateDisplayedCourses(event.target.value, searchScope);
        setData("searchBoxContents", event.target.value);
        */
        // Call the async reducer function to update the displayed courses
        /**
         * Make redux call to get data from the backend for each search key entered.
         */
        setSearchBoxContents(event.target.value);
        // dispatch(searchCourses({ searchString: event.target.value, category: searchScope }, navigate));
        dispatch(searchCourses({ searchString: event.target.value, category: searchScope }))
    }

    function handleOptionChange(event) {
        setSearchScope(event.target.value);
        dispatch(searchCourses({ searchString: searchBoxContents, category: event.target.value }));
        /**
         * We do not want to change the box contents when search scope changed.
         * TODO: need to deal with how we want to handle the database.
         */
        // setData("searchScope", event.target.value);
        // if (searchBoxContents != '') {
        //     setSearchBoxContents('');
        //     updateDisplayedCourses('', searchScope);
        // } else {
        //     updateDisplayedCourses('', searchScope);
        // };
    }

    // useEffect(() => {
    //     const filterData = JSON.parse(localStorage.getItem('filters'));
    //     if (!filterData?.courses) {
    //         localStorage.setItem('filters', JSON.stringify({
    //             courses: {
    //                 searchBoxContents: '',
    //                 searchScope: 'Name'
    //             }
    //         }));
    //     } else {
    //         setSearchBoxContents(filterData.courses.searchBoxContents);
    //         setSearchScope(filterData.courses.searchScope);
    //         updateDisplayedCourses(filterData.courses.searchBoxContents, filterData.courses.searchScope);
    //     }
    // }, [])

    return (
        <>
            <div className="container d-flex justify-content-center align-items-center">
                <label className="form-label" htmlFor="searchBox">Search/Filter:&nbsp;</label>
                <div className="w-50">
                    <input className="form-control" id="searchBox"
                        aria-label="Search Courses"
                        type="search" value={searchBoxContents}
                        onChange={handleSearchBoxChange} />
                </div>
            </div>
            <div className="radio-centered">
                <div className="form-check form-check-inline">
                    <input className="form-check-input" type="radio"
                        id="courseName" aria-label="Course Name Radio Button"
                        value="Name" checked={searchScope === "Name"}
                        onChange={handleOptionChange} />
                    <label className="form-check-label" htmlFor="courseName">Name</label>
                </div>
                <div className="form-check form-check-inline">
                    <input className="form-check-input" type="radio"
                        id="courseState" aria-label="Course State Radio Button"
                        value="State" checked={searchScope === "State"}
                        onChange={handleOptionChange} />
                    <label className="form-check-label" htmlFor="courseState">State/Province</label>
                </div>
                <div className="form-check form-check-inline">
                    <input className="form-check-input" type="radio"
                        id="courseCountry" aria-label="Course Country Radio Button"
                        value="Country" checked={searchScope === "Country"}
                        onChange={handleOptionChange} />
                    <label className="form-check-label" htmlFor="courseCountry">Country</label>
                </div>
            </div>
        </>
    );
};