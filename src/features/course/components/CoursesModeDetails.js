/*************************************************************************
 * File: CoursesModeDetails.js
 * This file defines the CoursesModeDetails react component, which 
 * implements the "Details" page of SpeedScore's "Courses" mode
 ************************************************************************/
import { useState } from 'react';
import {CourseProvider} from '../../../components/contexts/CourseContext'; 
import {TeeUnitsProvider} from '../../../components/contexts/TeeUnitsContext';
import CoursesModeDetailsMapStatus from './CoursesModeDetailsMapStatus';
import CoursesModeDetailsHeader from './CoursesModeDetailsHeader';
import CoursesModeDetailsTabs from './CoursesModeDetailsTabs';
import CoursesModeDetailsFooter from './CoursesModeDetailsFooter';
import CoursesModeDetailsTeeUnitsSelector from './CoursesModeDetailsTeeUnitsSelector';
import { useDispatch, useSelector } from 'react-redux';
import { tabActions } from '../tabSlice'; 

export default function CoursesModeDetails({currentCourse, closeCourseDetails}) {

    const [selectedTab, setSelectedTab] = useState("courseInfo");
    const dispatch = useDispatch();
    // const selectedTab = useSelector(state => state.courseTabs);
    // console.log('Selected tab in course mode details: ', selectedTab);
    // const setSelectedTab = (tab) => {
    //   dispatch(tabActions.setSelectedTab(tab));
    // }
  return(
    <CourseProvider initialCourse={currentCourse}>
        <TeeUnitsProvider initialValues={{selectedTee: Object.keys(currentCourse.tees).length === 0 ? null :
                                          Object.keys(currentCourse.tees)[0], 
                                          selectedUnits: "Imperial"}} >
        <section>
            <CoursesModeDetailsHeader />
            {selectedTab === "scorecard" || selectedTab === "map" ?
              <CoursesModeDetailsTeeUnitsSelector /> : null}
            {selectedTab === "map" ?
              <CoursesModeDetailsMapStatus /> : null}
            <CoursesModeDetailsTabs setSelectedTab={setSelectedTab} />
            <div className="mt-3">
                <CoursesModeDetailsFooter closeCourseDetails={closeCourseDetails} />
            </div>
        </section> 
      </TeeUnitsProvider>
    </CourseProvider>
  );
}