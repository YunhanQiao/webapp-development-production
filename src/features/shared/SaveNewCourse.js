import { useRef, useEffect } from "react";
// import { addCourseToLocalDB } from '../../services/courseServices';
import { addCourseToLocalDB } from "../../services/courseServices";
import { isNull } from "lodash";
import { Bounce, toast } from "react-toastify";
import cloneDeep from 'lodash/cloneDeep';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { addCourse } from '../course/courseActions';

export default function SaveCourseModal({course, id, mergedCourse, formFields, setFormFields, clearBox, onChange, setShowModal}) { //validCourse, setValidCourse
const editModalRef = useRef();
const dispatch = useDispatch();
const navigate = useNavigate();

useEffect(() => {
    const bsModal =  window.bootstrap.Modal.getOrCreateInstance(editModalRef.current);
    bsModal.show();
  }, []);

function handleSave() {
    if (!isNull(id)){
        mergedCourse.id = id;
        // onChange(mergedCourse.shortName);
        dispatch(addCourse(mergedCourse, navigate, false));
        onChange(mergedCourse)
        setShowModal(false);
    } else {
      displayToastErrorMessage(mergedCourse.shortName);
    }
  }
  function displayToastMessage(course) {
    // call the toaster function
    let message = `Course: ${course} Added!`;

    toast.success(message, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
    });
  }

  function displayToastErrorMessage(course) {
    // call the toaster function
    let message = `Course: ${course} not Added!`;

    toast.error(message, {
      position: "top-center",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
      transition: Bounce,
    });
  }

  function closeAndCancel() {
    const bsModal = window.bootstrap.Modal.getInstance(editModalRef.current);
    bsModal.hide();
    clearBox();
  }

  function closeAndSave() {
    const bsModal = window.bootstrap.Modal.getInstance(editModalRef.current);
    bsModal.hide();
    handleSave();
  }
  return (
    <div ref={editModalRef} id='textEditModal' data-bs-backdrop='static' className='modal fade' tabIndex='-1'>
      <div className='modal-dialog'>
        <div className='modal-content'>
          <div className='modal-header'>
            <h5 className='modal-title'>Save New Course</h5>
            <button type='button' className='btn-close' aria-label='Close' onClick={closeAndCancel}></button>
          </div>
          <div className='modal-body centered'>
            <span>"Do you want to save {course}?"</span>
            <br></br>
          </div>
          <div className='modal-footer'>
            <button type='button' className='btn btn-secondary' onClick={closeAndCancel}>
              Cancel
            </button>
            <button type='button' className='btn btn-primary' onClick={closeAndSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
