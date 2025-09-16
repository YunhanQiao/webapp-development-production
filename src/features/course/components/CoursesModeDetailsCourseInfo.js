/*************************************************************************
 * File: CoursesModeDetailsCourseInfo.js
 * This file defines the CoursesModeDetails React component, which enables
 * users to view and edit the basicd ata on a golf course.
 ************************************************************************/

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DefaultGolfCoursePic from "../../../images/DefaultGolfCoursePic.jpg";
import { faGolfBallTee } from "@fortawesome/free-solid-svg-icons"; // Import the FontAwesome golf tee icon
import { useCourse, useCourseDispatch } from "../../../components/contexts/CourseContext";
import { useState } from "react";
import EditImageModal from "./EditImageModal";

const autoWidth = {
  width: "auto"
};

const marginBottonZero = {
  marginBottom: "0px"
};

const centeredFlexContainer = {
  // {{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center" }}
  display: "flex",
  alignItems: "center",
  gap: "10px",
  justifyContent: "center"
};

const teeColorMap = {
  orange: "#FFA500",
  green: "#00FF00",
  black: "#000000",
  gray: "#808080",
  blue: "#0000FF",
  crimson: "#DC143C",
  brown: "#A52A2A",
  white: "#E3E3E3",
  red: "#FF0000",
  yellow: "#FFFF00",
  gold: "#FFD700",
  silver: "#C0C0C0",
  purple: "#800080",
  pink: "#FFC0CB",
};

export default function CoursesModeDetailsCourseInfo() {
  // NEW: Removed props
  const [showEditImageModal, setShowEditImageModal] = useState(false);
  const dispatch = useCourseDispatch();
  const course = useCourse(); 
  /*************************************************************************
   * @function handleChange
   * @param event, the event object returned by the event handler
   * @Desc
   * Update the specified property of the course object with the value
   * entered by the user.
   * ***********************************************************************/
  function handleChange(event) {
    dispatch({ type: "UPDATE_COURSE_INFO", propName: event.target.name, propVal: event.target.value });
  }

  /*************************************************************************
   * @function handleNumHolesChange
   * @param event, the event object returned by the event handler
   * @Desc
   * Update numHoles with value entered by user, constraining it to equal
   * an integer between 1 and 22.
   *************************************************************************/
  function handleNumHolesChange(event) {
    let val = Number(event.target.value) > 22 ? 22 : Number(event.target.value) < 1 ? 1 : Number(event.target.value);
    dispatch({ type: "UPDATE_COURSE_INFO", propName: event.target.name, propVal: val });
  }

  /*************************************************************************
   * @function updateImageFromModal
   * @param newVal, the new value for the course's image URL
   * @Desc
   *  Update the course's image URL with the new value entered by the user
   * in the EditImageModal dialog.
   * ***********************************************************************/
  function updateImageFromModal(newVal) {
    dispatch({ type: "UPDATE_COURSE_INFO", propName: "imageUrl", propVal: newVal });
    //updateCourseVal("imageUrl",newVal);
    setShowEditImageModal(false);
  }
  
  return (
    <>
      {showEditImageModal ? (
        <EditImageModal
          title={"Update Course Image"}
          prompt={"Enter new URL for Course Image"}
          imageUrl={course.imageUrl}
          updateImage={updateImageFromModal}
          cancelUpdate={() => setShowEditImageModal(false)}
        />
      ) : null}
      <div className='table-responsive'>
        <div className='img-with-button-container'>
          <img
            className='img-course'
            src={course.imageUrl === "Default" ? DefaultGolfCoursePic : course.imageUrl}
            alt={course.shortName}
          />
          {/* Display mapped tees FontAwesome icons */}
          {course.mappedTeesCount && course.mappedTeesCount.length > 0 && (
            <div style={{ position: "absolute", top: "10px", right: "10px", display: "flex", gap: "10px" }}>
            
              {course.mappedTeesCount.map((teeName, index) => (
                <FontAwesomeIcon
                  key={index}
                  icon={faGolfBallTee}
                  style={{
                    color: teeColorMap[teeName.toLowerCase()] || "#FF33A1", // Default Bright pink color 
                    fontSize: "24px"
                  }}
                  title={teeName} // Tooltip showing the tee name
                />
              ))}
            </div>
          )}
          <button
            className='btn-overlaid'
            aria-label='Edit golf course image'
            onClick={() => setShowEditImageModal(true)}
          >
            <FontAwesomeIcon icon='edit' />
          </button>
        </div>
        <form className='centered'>
          <div className='mb-3 centered'>
            <label className='form-label' htmlFor='contactName'>
              Name:
              <input
                id='name'
                className='form-control centered'
                type='text'
                size='50'
                name='shortName'
                value={course.shortName}
                onChange={handleChange}
              />
            </label>
          </div>
          <div className='mb-3 centered'>
            <label className='form-label' htmlFor='contactName'>
              Address:
              <input
                id='address'
                className='form-control centered'
                type='text'
                size='50'
                name='address'
                value={course.address}
                onChange={handleChange}
              />
            </label>
          </div>
          <div className='mb-3 centered'>
            <label className='form-label' htmlFor='state'>
              State/Province:
              <input
                id='state'
                className='form-control centered'
                type='text'
                size='30'
                name='state'
                value={course.state}
                onChange={handleChange}
              />
            </label>
          </div>
          <div className='mb-3 centered'>
            <label className='form-label' htmlFor='country'>
              Country:
              <input
                id='country'
                className='form-control centered'
                type='text'
                size='30'
                name='country'
                value={course.country}
                onChange={handleChange}
              />
            </label>
          </div>
          <div className='mb-3 centered'>
            <label className='form-label' htmlFor='phone'>
              Phone Number:
            </label>
            <div style={{ ...centeredFlexContainer, marginLeft: "6vw" }}>
              <input
                id='phone'
                className='form-control centered'
                type='tel'
                size='30'
                name='phoneNumber'
                value={course.phoneNumber}
                onChange={handleChange}
                // style={{ width: "auto" }}
                style={autoWidth}
              />
              <a
                href={"tel:" + course.phoneNumber}
                target='_blank'
                className='btn btn-sm info-btn'
                style={marginBottonZero}
              >
                <FontAwesomeIcon icon='phone' />
                &nbsp;Call
              </a>
            </div>
          </div>
          <div className='mb-3 centered'>
            <label className='form-label' htmlFor='numHoles'>
              Number of Holes:
              <input
                id='numHoles'
                className='form-control centered'
                type='number'
                min='1'
                max='22'
                name='numHoles'
                value={course.numHoles}
                onChange={handleNumHolesChange}
                aria-describedby='numHoles-descr'
                disabled={course.tees === "" ? false : true}
              />
            </label>
            <div id='numHoles-descr' className='form-text'>
              Note: Once a set of tees has been added to the course, you may <i>not</i> change this value.
            </div>
          </div>
          <div className='mb-3 centered'>
            <label className='form-label' htmlFor='website'>
              Website:
            </label>
            <div style={centeredFlexContainer}>
              <input
                id='website'
                className='form-control centered'
                type='url'
                size='50'
                name='website'
                value={course.website}
                onChange={handleChange}
                style={autoWidth}
              />

              <a href={course.website} target='_blank' className='btn btn-sm info-btn' style={marginBottonZero}>
                <FontAwesomeIcon icon='globe' />
                &nbsp;Web
              </a>
            </div>
          </div>
          <div className='mb-3 centered'>
            <label className='form-label' htmlFor='maps'>
              Google Maps Page:
            </label>
            <div style={centeredFlexContainer}>
              <input
                id='maps'
                className='form-control centered'
                type='text'
                size='50'
                name='mapsUrl'
                value={course.mapsUrl}
                onChange={handleChange}
                style={autoWidth}
              />
              <a href={course.mapsUrl} target='_blank' className='btn btn-sm info-btn' style={marginBottonZero}>
                <FontAwesomeIcon icon='map' />
                &nbsp;Map
              </a>
            </div>
          </div>
          <br />
        </form>
      </div>
    </>
  );
}
