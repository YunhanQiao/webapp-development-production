import { useNavigate, useParams } from "react-router-dom";
import CoursesModeDetails from "../components/CoursesModeDetails";

import { useUserContext } from "../../../components/contexts/UserContext";
import Navbar from "../../shared/Navbar/Navbar";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourseById } from "../courseActions";

const CourseDetail = () => {
  const params = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const courseId = params.courseId;
  // console.log('COURSE ID :', courseId);

  // const coursesDB = JSON.parse(localStorage.getItem("courses"));
  // const courseObject = coursesDB && coursesDB[courseId] ? coursesDB[courseId] : {};
  const courseObject = useSelector(state => state.courses.filter(course => course.id === courseId))[0];
  // console.log('COURSE OBJECT FROM REDUX STATE: ', courseObject);
  // const { user } = useUserContext();
  const user = useSelector(state => state.user.user);
  const [initialFetch, setInitialFetch] = useState(false);
  const userAuthenticated = useSelector(state => state.user.authenticated);
  // const userAuthenticated = user.accountInfo.authenticated;

  useEffect(() => {
    dispatch(fetchCourseById(courseId, navigate, setInitialFetch));
  }, [])

  useEffect(() => {
    if (!userAuthenticated) navigate("/login");
  }, [userAuthenticated]);

  // if (initialFetch) {
  //   console.log('After initial fetch: ', courseObject);
  // }
  if (!userAuthenticated || !initialFetch) return <><Navbar /></>;
  return (
    // <CoursesModeDetails currentCourse={showCourseDetailsDialog} closeCourseDetails={closeCourseDetailsDialog} /> :
    <>
      <Navbar />
      <div id='coursesModeTab' role='tabpanel' className='mode-page' aria-label='Courses Tab' tabIndex='0'>
        <CoursesModeDetails currentCourse={courseObject} closeCourseDetails={() => {}} />
      </div>
    </>
  );
};

export default CourseDetail;
