/*************************************************************************
 * File: CoursesModeDetailsScorecard.js
 * This file defines the CoursesModeDetailsScorecard React component,
 * which enables users to view and edit info on the course's scorecard.
 ************************************************************************/

// import { useCourse, useCourseDispatch } from "../contexts/CourseContext.js";
import { useCourse, useCourseDispatch } from '../../../components/contexts/CourseContext.js';
// import { useTeeUnits } from "../contexts/TeeUnitsContext.js";
import { useTeeUnits } from '../../../components/contexts/TeeUnitsContext.js'; 
import * as Conversions from "../../../conversions.js";
import CoursesModeDetailsScorecardTable from "./CoursesModeDetailsScorecardTable.js";
import CoursesModedetailsScorecardSlopeRating from "./CoursesModedetailsScorecardSlopeRating.js";

export default function CoursesModeDetailsScorecard({ showHideSFPath }) {
  const dispatch = useCourseDispatch();
  const course = useCourse();
  const teeUnits = useTeeUnits();
  const numTabItems = 8;

  function showHideSFPath(path, show) {}

  /*************************************************************************
   * @function handleSlopeRatingDataChange
   * @param e, the event object returned by the event handler
   * @param prop, the property of the slope/rating value being changed
   * @Desc
   * Update the slope/rating property prop to the value entered by the user.
   *************************************************************************/
  function handleSlopeRatingDataChange(e) {
    let newVal = Number(e.target.value);
    dispatch({ type: "UPDATE_SLOPE_RATING_INFO", tee: teeUnits.selectedTee, propName: e.target.name, propVal: newVal });
  }

  /*************************************************************************
   * @function handleHoleDataChange
   * @param e, the event object returned by the event handler
   * @param holeNum, the hole number being changed
   * @param prop, the property of the hole being changed
   * @param minVal, the minimum value allowed for the property
   * @param maxVal, the maximum value allowed for the property
   * @Desc
   * If the user is changing the name of the current tee, update that name.
   * Otherwise, add a new tee with name teeName and set it as current tee.
   *************************************************************************/
  function handleHoleDataChange(e, holeNum, prop, minVal, maxVal) {
    let newVal = Number(e.target.value);
    if (newVal < minVal) newVal = minVal;
    else if (newVal > maxVal) newVal = maxVal;
    // console.log('TEE UNITS: ', teeUnits);
    dispatch({
      type: "UPDATE_HOLE_INFO",
      tee: teeUnits.selectedTee,
      holeNum: holeNum,
      propName: prop,
      propVal: newVal,
      conversions: teeUnits.unitConversions,
    });
  }

  /*************************************************************************
   * @function autoPopulate
   * @param e, the event object returned by the event handler
   * @param holeNum, the hole number being changed
   * @param prop, the property of the hole being changed
   * @param autoProp, the property init value, based on adjacent cell
   * @Desc
   * If the user has entered a hole par or handicap for men, set the
   * corresponding women's value to the same.
   *************************************************************************/
  function autoPopulate(e, holeNum, prop, autoProp) {
    if (
      (e.key === "Enter" || e.key === "Tab") &&
      course.tees[teeUnits.selectedTee].holes[holeNum - 1][autoProp] === ""
    ) {
      if (autoProp === "runDistance") {
        dispatch({
          type: "UPDATE_HOLE_INFO",
          tee: teeUnits.selectedTee,
          holeNum: holeNum,
          propName: autoProp,
          propVal: teeUnits.unitConversions.convertToHoleUnits(
            course.tees[teeUnits.selectedTee].holes[holeNum - 1][prop]
          ),
          conversions: teeUnits.unitConversions,
        });
      } else {
        dispatch({
          type: "UPDATE_HOLE_INFO",
          tee: teeUnits.selectedTee,
          holeNum: holeNum,
          propName: autoProp,
          propVal: course.tees[teeUnits.selectedTee].holes[holeNum - 1][prop],
          conversions: teeUnits.unitConversions,
        });
      }
    }
  }

  /*************************************************************************
   * @function getFullScorecard
   * @param h, the array of holes for the current tee
   * @Desc
   * Return the same array of holes, but include the front 9 totals (OUT),
   * back 9 (IN) totals, and course totals (TOTAL) in the appropriate places
   * in the array. This is the array that will be displayed in the scorecard.
   *************************************************************************/
  function getFullScorecard(h) {
    let s = [];
    let frontGolfDistance = 0;
    let frontRunDistance = 0;
    let frontMensStrokePar = 0;
    let frontWomensStrokePar = 0;
    let frontMensTimePar = 0;
    let frontWomensTimePar = 0;
    let backGolfDistance = 0;
    let backRunDistance = 0;
    let backMensStrokePar = 0;
    let backWomensStrokePar = 0;
    let backMensTimePar = 0;
    let backWomensTimePar = 0;
    for (let i = 0; i < h.length; i++) {
      if (i < 9) {
        frontGolfDistance += h[i].golfDistance === "" ? 0 : h[i].golfDistance;
        frontRunDistance += h[i].runDistance === "" ? 0 : h[i].runDistance;
        frontMensStrokePar += h[i].mensStrokePar === "" ? 0 : h[i].mensStrokePar;
        frontWomensStrokePar += h[i].womensStrokePar === "" ? 0 : h[i].womensStrokePar;
        frontMensTimePar += h[i].mensTimePar === "" ? 0 : h[i].mensTimePar;
        frontWomensTimePar += h[i].womensTimePar === "" ? 0 : h[i].womensTimePar;
        s.push(h[i]);
        if (i === 8 && h.length === 18) {
          s.push({
            number: "OUT",
            golfDistance: frontGolfDistance,
            runDistance: frontRunDistance,
            mensStrokePar: frontMensStrokePar,
            womensStrokePar: frontWomensStrokePar,
            mensTimePar: frontMensTimePar,
            womensTimePar: frontWomensTimePar,
          });
        }
      } else {
        backGolfDistance += h[i].golfDistance === "" ? 0 : h[i].golfDistance;
        backRunDistance += h[i].runDistance === "" ? 0 : h[i].runDistance;
        backMensStrokePar += h[i].mensStrokePar === "" ? 0 : h[i].mensStrokePar;
        backWomensStrokePar += h[i].womensStrokePar === "" ? 0 : h[i].womensStrokePar;
        backMensTimePar += h[i].mensTimePar === "" ? 0 : h[i].mensTimePar;
        backWomensTimePar += h[i].womensTimePar === "" ? 0 : h[i].womensTimePar;
        s.push(h[i]);
        if (i === 17 && h.length === 18) {
          s.push({
            number: "IN",
            golfDistance: backGolfDistance,
            runDistance: backRunDistance,
            mensStrokePar: backMensStrokePar,
            womensStrokePar: backWomensStrokePar,
            mensTimePar: backMensTimePar,
            womensTimePar: backWomensTimePar,
          });
        }
      }
    }
    s.push({
      number: "TOTAL",
      golfDistance: frontGolfDistance + backGolfDistance,
      runDistance: frontRunDistance + backRunDistance,
      mensStrokePar: frontMensStrokePar + backMensStrokePar,
      womensStrokePar: frontWomensStrokePar + backWomensStrokePar,
      mensTimePar: frontMensTimePar + backMensTimePar,
      womensTimePar: frontWomensTimePar + backWomensTimePar,
    });
    return s;
  }

  if (teeUnits.selectedTee === null) {
    return (
      <>
        <p></p>
        <p></p>
        <p className='large-padded-text'>No tees created. Add a tee to edit the scorecard and access the map.</p>
        <p></p>
        <p></p>
      </>
    );
  }
  return (
    <>
      <fieldset style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 auto', width: '100%' }}>
      <legend style={{ textAlign: 'center', width: '100%' }}>{"Scorecard for " + teeUnits.selectedTee + " Tees"}</legend>
  {/* <div style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'center' }}> */}
  <div className="table-responsive" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
    <div style={{ width: '100%' }}>
      <CoursesModeDetailsScorecardTable
        getFullScorecard={getFullScorecard}
        course={course}
        Conversions={Conversions}
        teeUnits={teeUnits}
        numTabItems={numTabItems}
        handleHoleDataChange={handleHoleDataChange}
        autoPopulate={autoPopulate}
      />
      <CoursesModedetailsScorecardSlopeRating
        course={course}
        teeUnits={teeUnits}
        numTabItems={numTabItems}
        handleSlopeRatingDataChange={handleSlopeRatingDataChange}
      />
    </div>
  </div>
</fieldset>

    </>
  );
}
