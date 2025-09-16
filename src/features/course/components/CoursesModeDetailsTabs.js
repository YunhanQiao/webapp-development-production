
import CoursesModeDetailsCourseInfo from './CoursesModeDetailsCourseInfo';
import CoursesModeDetailsSGInfo from './CoursesModeDetailsSGInfo';
import CoursesModeDetailsScorecard from './CoursesModeDetailsScorecard';
import CoursesModeDetailsMap from './CoursesModeDetailsMap';
import { useTeeUnits } from '../../../components/contexts/TeeUnitsContext';
import { useCourse } from '../../../components/contexts/CourseContext';

export default function CousesModeDetailsTabs({setSelectedTab}) {

    const course = useCourse();
    const teeUnits = useTeeUnits();

    return(
        <>
        <span id="details-tabs-label" hidden>Course Details dialog tabs</span>
        <ul className="nav nav-tabs" id="myTab" role="tablist" 
            aria-labelledby='details-tabs-label'>
            <li className="nav-item" role="presentation">
                <button className="nav-link active" 
                        id="courseInfo-tab" data-bs-toggle="tab" data-bs-target="#course-info" 
                        type="button" role="tab" aria-controls="course-info" 
                        aria-selected="true"
                        title="The 'Course Info' tab allows you to view and modify the basic course information, and to specify a course image. "
                        onClick={()=>setSelectedTab("courseInfo")}>
                    Course Info
                </button>
            </li>
            <li className="nav-item" role="presentation">
                <button className="nav-link" id="sgInfo-tab" 
                        data-bs-toggle="tab" data-bs-target="#speedgolf-info" 
                        type="button" role="tab" aria-controls="speedgolf-info" 
                        aria-selected="false"
                        title="The 'Speedgolf Info' tab allows you to specify the speedgolf contact name and info, and the speedgolf policy and perks for the course"
                        onClick={()=>setSelectedTab("sgInfo")}>
                    Speedgolf Info
                </button>
            </li>
            <li className="nav-item" role="presentation">
              <span className="d-inline-block" title="The 'Scorecard' tab allows you to specify a tee's scorecard information. To enable the 'Scorecard' tab, fill in the speedgolf contact name and info (on 'Speedgolf Info' tab) and choose any 'Speedgolf Policy' other than 'Speedgolf not allowed'"> 
                <button className={course.sgContactName === "" || course.sgContactEmail === "" ||
                                   course.sgPlay === "sgNotAllowed" ? "nav-link disabled" : "nav-link"}
                        id="scorecard-tab" 
                        data-bs-toggle="tab"  data-bs-target="#scorecard"
                        type="button" role="tab" aria-controls="scorecard"
                        aria-selected="false"
                        onClick={()=>setSelectedTab("scorecard")}>
                    Scorecard
                </button>
              </span>
            </li>
            <li className="nav-item" role="presentation">
                <span className="d-inline-block" title="The 'Map' tab allows you to specify a tee's running paths. To enable the 'Map' tab, create a tee and fill in all scorecard info for the tee"> 
                <button className={course.sgContactName === "" || course.sgContactEmail === "" ||
                                    course.sgPlay === "sgNotAllowed"  || teeUnits.selectedTee === null 
                                    || !course.tees[teeUnits.selectedTee] ||course.tees[teeUnits.selectedTee].numHolesGolfDataComplete < course.numHoles ? "nav-link disabled" : "nav-link"}
                        id="map-tab" 
                        data-bs-toggle="tab" data-bs-target="#map"
                        type="button" role="tab" aria-controls="map"
                        aria-selected="false"
                        onClick={()=>setSelectedTab("map")}>
                    Map
                </button>
                </span>
            </li>
        </ul>
        <div className="tab-content" id="detailsTabContent">
            <div className="tab-pane fade show active" id="course-info" role="tabpanel" aria-labelledby="home-tab">
                <CoursesModeDetailsCourseInfo /> 
            </div>
            <div className="tab-pane fade" id="speedgolf-info" role="tabpanel" aria-labelledby="speedgolf-tab">
                <CoursesModeDetailsSGInfo /> 
            </div>
            <div className="tab-pane fade" id="scorecard" role="tabpanel" aria-labelledby="scorecard-tab">
                <CoursesModeDetailsScorecard /> 
            </div>
            <div className="tab-pane fade" id="map" role="tabpanel" aria-labelledby="map-tab">
            {teeUnits.selectedTee === null ? null :
                <CoursesModeDetailsMap /> }
            </div>    
        </div>
        </>
    );
}