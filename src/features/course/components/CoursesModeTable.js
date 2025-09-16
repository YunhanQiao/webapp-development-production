import { Link, useNavigate } from "react-router-dom";
import DefaultGolfCoursePic from "../../../images/DefaultGolfCoursePic.jpg";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
// import "./CoursesModeTable.css";
import "../../../styles/features/course/CoursesModeTable.css";
import { faGolfBallTee } from "@fortawesome/free-solid-svg-icons"; // Import the FontAwesome golf tee icon

// Function to map tee names to colors (you can define this according to your logic)
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

/*************************************************************************
 * File: coursesModeTable.js
 * This file defines the CoursesModeTable React component, which displays
 * the courses in SpeedScore's database that match the current search
 * criteria.
 ************************************************************************/
export default function CoursesModeTable({ coursesToDisplay, numCourses }) {
  //const navigate = useNavigate();

  // function truncateAddress(address) {
  //   address = "H & H Golf Carts & Outdoor Power,Texas , USA "
  //   if (!address) {
  //     return "Address not available";
  //   }
  //   const parts = address.split(',').map(part => part.trim());
  //   if (parts.length < 3) { //since the length is less than 3
  //     return address.length > 25 ? address.substring(0, 25) + '' : address;
  //   }
  //   let city = parts.length >= 3 ? parts[parts.length - 3] : '';
  //   city = city.length > 20 ? city.substring(0, 17) + '' : city;
  //   //const city = parts[parts.length - 3];
  //   const state = parts[parts.length - 2].split(' ')[0];
  //   const country = parts[parts.length - 1];
  //   return `${city}, ${state}\n${country}`; // City and state on one line, country on a new line
  // }
  function truncateAddress(address, maxLength = 28) {
    // Return a default message if the address is not available
    if (!address) {
      return "Address not available";
    }

    // Split the address into parts, trim each part
    const parts = address.split(",").map(part => part.trim());

    // Extract city, state, and country based on the parts length
    let city = parts.length >= 3 ? parts[parts.length - 3] : "";
    let state = parts.length >= 2 ? parts[parts.length - 2] : "";
    let country = parts.length >= 1 ? parts[parts.length - 1] : "";

    // Truncate city, state, and country to maxLength if necessary
    city = city.length > maxLength ? city.substring(0, maxLength - 3) + ".." : city;
    state = state.length > maxLength ? state.substring(0, maxLength - 3) + ".." : state;
    country = country.length > maxLength ? country.substring(0, maxLength - 3) + ".." : country;

    // Return formatted address with city, state, and country
    // const formattedAddress = `${city}, ${state}\n${country}`;
    // return formattedAddress;
    return (
      <span className="text-adjust">
        {city}, {state}
        <br />
        {country}
      </span>
    );
  }

  return Object.keys(coursesToDisplay).length === 0 ? (
    <>
      <p></p>
      <p className="centered">
        <i>No courses match search criteria</i>
      </p>
    </>
  ) : (
    <div className="container">
      <div className="row">
        <div className="col-12">
          <div className="caption-center mb-4" aria-live="polite">
            {Object.keys(coursesToDisplay).length === numCourses
              ? "Displaying all " + numCourses + " golf courses in SpeedScore's database"
              : "Displaying " + Object.keys(coursesToDisplay).length + " golf course(s) meeting search/filter criteria"}
          </div>
        </div>
      </div>
      <div className="row">
        {Object.keys(coursesToDisplay).map(c => (
          <div key={c} className="col-12 col-md-6 col-lg-4 mb-4">
            <div className="card course-card">
              <div className="row no-gutters">
                <div className="col-4">
                  {" "}
                  {/* Adjusted to 40% */}
                  <Link to={`/courses/CourseDetail/${coursesToDisplay[c].id}`} className="course-link">
                    <img
                      src={
                        coursesToDisplay[c].imageUrl === "Default" ? DefaultGolfCoursePic : coursesToDisplay[c].imageUrl
                      }
                      alt={coursesToDisplay[c].shortName}
                      className="img-course "
                    />
                  </Link>
                </div>
                <div className="col-8">
                  {" "}
                  {/* Adjusted to 60% */}
                  <div className="card-body d-flex flex-column justify-content-center">
                    <Link to={`/courses/CourseDetail/${coursesToDisplay[c].id}`} className="course-link text-adjust">
                      <strong>
                        {coursesToDisplay[c].shortName.length > 28
                          ? coursesToDisplay[c].shortName.slice(0, 28) + ".."
                          : coursesToDisplay[c].shortName}
                      </strong>

                      <br />
                      <span className="course-address text-adjust">{truncateAddress(coursesToDisplay[c].address)}</span>
                    </Link>
                    {/* Display the mapped tees icons if courseMappingInfo exists */}
                    {/* Display mapped tees FontAwesome icons */}
                    {/* {coursesToDisplay[c].courseMappingInfo &&
                      Object.keys(coursesToDisplay[c].courseMappingInfo).length > 0 &&
                      coursesToDisplay[c].courseMappingInfo[coursesToDisplay[c].id].length > 0 && ( */}
                    {coursesToDisplay[c].courseMappingInfo &&
                      Array.isArray(coursesToDisplay[c].courseMappingInfo[coursesToDisplay[c].id]) &&
                      coursesToDisplay[c].courseMappingInfo[coursesToDisplay[c].id].length > 0 && (
                        <div style={{ position: "absolute", top: "1px", right: "10px", display: "flex", gap: "10px" }}>
                          {coursesToDisplay[c].courseMappingInfo[coursesToDisplay[c].id].map((teeName, index) => (
                            <FontAwesomeIcon
                              key={`${c}-${index}`}
                              icon={faGolfBallTee}
                              style={{
                                color: teeColorMap[teeName.toLowerCase()] || "#FF33A1", // Default bright pink color
                                fontSize: "18px",
                              }}
                              title={teeName} // Tooltip showing the tee name
                            />
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
