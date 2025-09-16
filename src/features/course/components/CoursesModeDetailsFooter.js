/*************************************************************************
 * CoursesModeDetailsFooter.js
 * This file defines the CoursesModeDetailsFooter React component, which
 * displays the "Save Changes" and "Cancel" buttons available from all
 * tabs of the CoursesModeDetails dialog. The closeCourseDetails function
 * prop is called when the user clicks on either button. If the user
 * chooses to save changes, the updated course object is passed to the
 * function; otherwise, null is passed.
 ************************************************************************/
import { useNavigate, useParams } from "react-router-dom";
import { useCourse } from "../../../components/contexts/CourseContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faSave } from "@fortawesome/free-solid-svg-icons";
import { updateCourseInLocalDB } from "../../../services/courseServices";
import { useDispatch, useSelector } from "react-redux";
import { COURSE_INFO, MAP, SCORECARD, SPEEDGOLF_INFO } from "../constants";
import { updateCourseAction, updateCourseInfo } from "../courseActions";
import _ from 'lodash';

export default function CoursesModeDetailsFooter({ closeCourseDetails }) {
  const course = useCourse();
  const navigate = useNavigate();
  const selectedTab = useSelector((state) => state.courseTabs);
  const dispatch = useDispatch();
  const { courseId } = useParams();
  const saveChangesHandler = (course) => {
    console.log("Save changes handler: ", course);
    /*
        switch (selectedTab) {
            case COURSE_INFO:
                const payload = {
                    name: course.shortName + course.name.substring(course.name.indexOf(',')),
                    address: course.address,
                    state: course.state,
                    country: course.country,
                    phoneNumber: course.phoneNumber,
                    numHoles: course.numHoles,
                    website: course.website,
                    mapsUrl: course.mapsUrl,
                    imageUrl: course.imageUrl,
                }
                dispatch(updateCourseInfo(courseId, payload, navigate));
                break;
            case SPEEDGOLF_INFO:
                break;
            case SCORECARD:
                break;
            case MAP:
                break;
            }
            */
    //    During update we want the tees to be an object type
    if (JSON.stringify(course.tees) === "[]") course.tees = {};
    //    course.name = course.shortName + course.name.substring(course.name.indexOf(','));
    let address = "";
    if (!(course.name.split(",").length == 1)) {
      address = course.name.substring(course.name.indexOf(","));
    }
    const updatedCourse = {
      ...course,
      name: course.shortName + address,
    };
    dispatch(updateCourseAction(courseId, updatedCourse, navigate));

    // updateCourseInLocalDB(course);
    // navigate('/courses');
    // check the selected tab and update the information accordingly
  };

  return (
    <div className='mode-page-btn-container'>
      
      <button
        className='dialog-primary-btn'
        // type="button" onClick={()=>closeCourseDetails(course)}>
        type='button'
        onClick={() => course.lockedCourse ? navigate(-1) : saveChangesHandler(course)}
        //disabled={course.lockedCourse}  // Disable the button when course.lockedCourse is true(by deafault it is true)
        >   
        <FontAwesomeIcon icon={course.lockedCourse ? faArrowLeft : faSave} />
        &nbsp;{course.lockedCourse ? 'Return Back' : 'Save Changes'}
      </button>
      <button
        className='dialog-cancel-btn'
        // type="button" onClick={()=>closeCourseDetails(null)}>
        type='button'
        onClick={() => navigate("/courses")}>
        <FontAwesomeIcon icon='xmark' />
        &nbsp;Cancel
      </button>
    </div>
  );
}
