import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

const CoursesModedetailsScorecardSlopeRating = ({ course, teeUnits, numTabItems, handleSlopeRatingDataChange }) => {
  return (
    <>
      <table className='table table-sm table-striped table-hover'>
        <caption>Table of Slope and Rating Info</caption>
        <thead>
          <tr>
            <th scope='col' title="Men's course rating, as listed on scorecard">
              Men's Course Rating&nbsp;
              <FontAwesomeIcon icon='circle-info' />
            </th>
            <th scope='col' title="Men's course slope, as listed on scorecard">
              Men's Course Slope&nbsp;
              <FontAwesomeIcon icon='circle-info' />
            </th>
            <th scope='col' title="Women's course slope, as listed on scorecard">
              Women's Course Rating&nbsp;<FontAwesomeIcon icon='circle-info'></FontAwesomeIcon>
            </th>
            <th scope='col' title="Women's course slope, as listed on scorecard">
              Women's Course Slope&nbsp;<FontAwesomeIcon icon='circle-info'></FontAwesomeIcon>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <input
                id='mensRating'
                className='form-control centered'
                tabIndex={numTabItems + course.numHoles * 6 + 1}
                type='number'
                name='mensRating'
                value={course.tees[teeUnits.selectedTee]?.mensRating || ""}
                aria-label={"Men's course rating for" + teeUnits.selectedTee + " tees"}
                onChange={handleSlopeRatingDataChange}
              />
            </td>
            <td>
              <input
                id='mensSlope'
                className='form-control centered'
                tabIndex={numTabItems + course.numHoles * 6 + 2}
                type='number'
                name='mensSlope'
                value={course.tees[teeUnits.selectedTee].mensSlope}
                aria-label={"Men's course slope for" + teeUnits.selectedTee + " tees"}
                onChange={handleSlopeRatingDataChange}
              />
            </td>
            <td>
              <input
                id='womensRating'
                className='form-control centered'
                tabIndex={numTabItems + course.numHoles * 6 + 3}
                type='number'
                name='womensRating'
                value={course.tees[teeUnits.selectedTee].womensRating}
                aria-label={"Women's course rating for" + teeUnits.selectedTee + " tees"}
                onChange={handleSlopeRatingDataChange}
              />
            </td>
            <td>
              <input
                id='womensSlope'
                className='form-control centered'
                tabIndex={numTabItems + course.numHoles * 6 + 4}
                type='number'
                name='womensSlope'
                value={course.tees[teeUnits.selectedTee].womensSlope}
                aria-label={"Women's course slope for" + teeUnits.selectedTee + " tees"}
                onChange={handleSlopeRatingDataChange}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
};

export default CoursesModedetailsScorecardSlopeRating;
