import CoursesSection from "../components/CourseSection";
import CoursesMode from "../components/CoursesMode";

const Courses = () => {
  return (
    <div
      id='coursesModeTab'
      role='tabpanel'
      // className="mode-page hidden"
      className='mode-page'
      aria-label='Courses Tab'
      tabIndex='0'
    >
      <button type='button' className='float-btn hidden'></button>
      <CoursesSection />
    </div>
  );
};

export default Courses;
