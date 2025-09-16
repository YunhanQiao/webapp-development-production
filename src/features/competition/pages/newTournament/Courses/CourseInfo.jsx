import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import DefaultGolfCoursePic from "../../../../../images/DefaultGolfCoursePic.jpg";
import { useEffect, useState } from "react";
import "../../../../../styles/features/competition/newTournament.css";

const CourseInfo = ({ course, onClose }) => {
  return (
    <>
      <div className="table-responsive">
        <div className="d-flex flex-col m-3">
          <h2>{course.shortName}</h2>
          <button type="button" className="btn-close cls-btn" onClick={onClose}></button>
        </div>

        <div className="img-with-button-container">
          <img
            className="img-course"
            src={course.imageUrl === "Default" ? DefaultGolfCoursePic : course.imageUrl}
            alt={course.shortName}
          />
        </div>
        <div className="centered">
          <div className="mb-3 centered">
            <label className="form-label">Name: {course.shortName}</label>
          </div>
          <div className="mb-3 centered">
            <label className="form-label">Address: {course.address}</label>
          </div>
          <div className="mb-3 centered">
            <label className="form-label">State/Province: {course.state}</label>
          </div>
          <div className="mb-3 centered">
            <label className="form-label">Country: {course.country}</label>
          </div>
          <div className="mb-3 centered">
            <label className="form-label">Phone Number: {course.phoneNumber}</label>
          </div>
          <div className="mb-3 centered">
            <label className="form-label">Number of Holes: {course.numHoles}</label>
            <div id="numHoles-descr" className="form-text">
              Note: Once a set of tees has been added to the course, you may <i>not</i> change this value.
            </div>
          </div>
          <div className="mb-3 centered">
            <label className="form-label">Website: {course.website}</label>
          </div>
          <div className="mb-3 centered">
            <label className="form-label">Google Maps Page: {course.mapsUrl}</label>
          </div>
          <br></br>
        </div>
        <div className="d-flex justify-content-center">
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
};

export default CourseInfo;
