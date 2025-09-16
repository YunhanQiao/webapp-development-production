import CoursesModeAdd from "../components/CoursesModeAdd";
import Navbar from "../../shared/Navbar/Navbar";

const NewCourse = () => {
  return (
    <>
      <Navbar />
      <div id='coursesModeTab' role='tabpanel' className='mode-page' aria-label='Courses Tab' tabIndex='0'>
        <CoursesModeAdd closeDialog={() => {}} />
      </div>
    </>
  );
};

export default NewCourse;
