/*************************************************************************
 * CourseContext.js
 * This file defines the CourseContext and CourseDispatchContext objects, 
 * which make the course and dispatch variables available to child compnents 
 * of CoursesModeDetails through custom useCourse and 
 * useCourseDispatch hooks. In addition, the file defines the
 * courseChangeReducer function, which is called by the useReducer hook
 * to update the course object in response actions dispatched by 
 * child components of CoursesModeDetails.
************************************************************************/
import { createContext, useContext, useEffect, useReducer } from 'react';
import * as SGCalcs from '../../speedgolfCalculations.js';

const CourseContext = createContext(null);
const CourseDispatchContext = createContext(null);

export function CourseProvider ({children, initialCourse})  {

    const [course, dispatch] = useReducer(courseChangeReducer, initialCourse);

    useEffect(() => {
        dispatch({ type: 'SET_COURSE', payload: initialCourse });
    }, [initialCourse]);
    // console.log('State inside CourseProvider: ', course);
    return (
        <CourseContext.Provider value={course}>
            <CourseDispatchContext.Provider value={dispatch}>
                {children}
            </CourseDispatchContext.Provider>
        </CourseContext.Provider>
    );
}

export function useCourse() {
    return useContext(CourseContext);
}

export function useCourseDispatch() {
    return useContext(CourseDispatchContext);
}

 /*************************************************************************
     * @function updateNumHolesPathDataComplete
     * @param newHoles, the updated holes array
     * @returns the number of holes for which we have complete path data (i.e.,
     * transitionPath, golfPath, and possibly startPath and finishPath)
     *************************************************************************/
//  function updateNumHolesPathDataComplete(hasStartLine, hasFinishLine, newHoles) {
//     let count = 0;
//     for (let i=0; i < newHoles.length; ++i) {
//         switch (i) {
//             case 0: //Special case: First hole
//               if (hasStartLine) {
//                 if (newHoles[0].startPath !== "" && newHoles[0].golfPath !== "") {
//                   count++;
//                 } 
//               }  else {
//                 if (newHoles[0].golfPath !== "") {
//                   count++
//                 }
//               }
//             break;
//             case newHoles.length-1: //Special case: Last hole
//                 if (hasFinishLine) {
//                     if (newHoles[newHoles.length-1].finishPath !== "" && newHoles[newHoles.length-1].golfPath !== "" && 
//                       newHoles[newHoles.length-1].transitionPath !== "") {
//                       count++;
//                     } 
//                   }  else {
//                     if (newHoles[newHoles.length-1].transitionPath !== "" && newHoles[newHoles.length-1].golfPath !== "") {
//                       count++;
//                     }
//                   }
//             break;
//             default: //General case
//               if (newHoles[i].golfPath !== "" && 
//                   newHoles[i].transitionPath !== "") {
//                     count++;
//               }
//             break;
//         }

//     }
//     return count;
// }
function updateNumHolesPathDataComplete(hasStartLine, hasFinishLine, newHoles) {
    let count = 0;
    for (let i=0; i < newHoles.length; ++i) {
        switch (i) {
            case 0: //Special case: First hole
                if (newHoles[0].golfPath !== "") {
                  count++
                }         
            break;
            case newHoles.length-1: //Special case: Last hole  
                if (newHoles[newHoles.length-1].transitionPath !== "" && newHoles[newHoles.length-1].golfPath !== "") {
                    count++;
                }         
            break;
            default: //General case
              if (newHoles[i].golfPath !== "" && 
                  newHoles[i].transitionPath !== "") {
                    count++;
              }
            break;
        }

    }
    return count;
}


/*************************************************************************
 * @function getPathInsertionPoint
 * @param hasStartLine, true if the tee has a start line
 * @param hasFinishLine, true if the tee has a finish line
 * @param newHoles, the updated holes array
 * @Desc 
 * Return an object indicating the path type ('startPath', 'transitionPath',
 * 'golfPath' or 'finishPath) and hole number where the user must define
 * the next path. If all paths have been defined, the object's 'path' 
 * prop is set to ""
 *************************************************************************/
 function getPathInsertionPoint(hasStartLine, hasFinishLine, newHoles) {
    const pt = {
        path: "",
        holeNum: newHoles.length
    };
    for (let i=0; i < newHoles.length; ++i) {
        if (i===0 && hasStartLine && newHoles[i].startPath === "") {
            pt.path = 'startPath';
            pt.holeNum = i+1;
            return pt;
        }
        if (i !== 0 && newHoles[i].transitionPath === "") {
            pt.path = 'transitionPath';
            pt.holeNum = i+1;
            return pt;
        }
        if (newHoles[i].golfPath === "") {
            pt.path = 'golfPath';
            pt.holeNum = i+1;
            return pt;
        }
        if (i===newHoles.length-1 && hasFinishLine && newHoles[i].finishPath === "") {
            pt.path = 'finishPath';
            pt.hole = i+1;
            return pt;
        }
    }
    return pt;
}


/*************************************************************************
 * @function updateNumHolesPolyDataComplete
 * @param newHoles, the updated holes array
 * @returns the number of holes for which we have complete polygon data (i.e.,
 * teebox and green data)
 *************************************************************************/
function updateNumHolesPolyDataComplete(newHoles) {
    let count = 0;
    for (let i = 0; i < newHoles.length; ++i) {
        if (newHoles[i].teebox !== "" && newHoles[i].green !== "") {
            count++;
        }
    }
    return count;
}

 /*************************************************************************
 * @function updatePolyInsertionPoint
 * @param newHoles, the updated holes array
 * @returns an object indicating the poly type ('teebox', 'green') and 
 * hole number where the user must define
 * the next polygon. If all polygons have been defined, the object's 
 * 'poly' prop is set to "".
 *************************************************************************/
 function updatePolyInsertionPoint(newHoles) {
    const pt = {
        poly: "",
        holeNum: newHoles.length
    };
    for (let i = 0; i < newHoles.length; ++i) {
        if (newHoles[i].teebox === "") {
            pt.poly = 'teebox';
            pt.holeNum = i+1;
            return pt;
        }
        if (newHoles[i].green === "") {
            pt.poly = 'green';
            pt.holeNum = i+1;
            return pt;
        }
    }
    return pt;
}

/*************************************************************************
 * @function updateNumHolesGolfDataComplete
 * @param newHoles, the updated holes array
 * @returns the number of holes for which we have complete golf data (i.e.,
 * golfDistance, womensStrokePar, and mensStrokePar data)
 *************************************************************************/
function updateNumHolesGolfDataComplete(newHoles) {
    let count = 0;
    for (let i=0; i < newHoles.length; ++i) {
        if (newHoles[i].golfDistance !== "" && 
            newHoles[i].womensStrokePar !== "" &&
            newHoles[i].mensStrokePar !== "") {
            count++;
        }
    }
    return count;
}

/*************************************************************************
 * @function courseChangeReducer
 * @param state, the current state of the course
 * @param action, the action to be performed to change the course
 * @Desc
 * This function is called by the useReducer hook to update the course
 * object in response to a call to the dispatch() function to update
 * the state of the course object. 
 * @returns the updated course object
 *************************************************************************/
function courseChangeReducer(course, action) {
    const newCourse = JSON.parse(JSON.stringify(course)); //deep copy
    
    /* Note: In "Strict" mode, dispatch functions call the reducer twice 
       to ensure the reducer is a pure function. Read about it here:
       https://github.com/facebook/react/issues/16295
       Without a deep copy, the second call to the reducer 
       will involve a course object that has potentially been modified
    */

    switch(action.type) {
        case "SET_COURSE": {
            return action.payload;
        }
        case "UPDATE_COURSE_INFO": {
            newCourse[action.propName] = action.propVal;
            return newCourse;
        }
        case "UPDATE_SG_INFO": {    
            newCourse[action.propName] = action.propVal;
            const sgRatingFactors = ["sgMembership", "sgRoundDiscount", "sgStandingTeeTimes", "sgPlay"];
            if (newCourse.sgPlay === "sgNotAllowed") {
                newCourse.sgMembership = false;
                newCourse.sgRoundDiscount = false;
                newCourse.sgStandingTeeTimes = false;
                newCourse.sgFriendlinessRating = 0;
                return newCourse;
            }
            if (sgRatingFactors.includes(action.propName)) {
                //Recompute rating
                let rating = 0;
                switch (newCourse.sgPlay) {
                    case "sgAnytime":
                        rating = 3;
                    break;
                    case "sgRegularTeeTimesOnly":
                        rating = 2;
                    break;
                    case "sgSpecialArrangementOnly":
                        rating = 1;
                    break;
                    default:
                    break;
                }
                if (newCourse.sgStandingTeeTimes)
                    rating++;
                if (newCourse.sgMembership || newCourse.sgRoundDiscount)
                    rating++;
                newCourse.sgFriendlinessRating = rating;
            }
            return newCourse;
        }
        case "UPDATE_HOLE_INFO": {
            const newHoles = newCourse.tees[action.tee].holes;
            if (action.propName === 'golfDistance') { //need to convert to feet
                newHoles[action.holeNum-1].golfDistance = action.conversions.convertToFt(action.propVal);
            } else if (action.propName === 'runDistance') { //need to convert to feet and update time pars
                newHoles[action.holeNum-1].runDistance = action.conversions.convertToFt(action.propVal);
                  newHoles[action.holeNum-1].mensTimePar = SGCalcs.getTimePar(newHoles[action.holeNum-1].runDistance, newHoles[action.holeNum-1].mensStrokePar, SGCalcs.parRunPaceMen, SGCalcs.parShotBoxSecMen);
                  newHoles[action.holeNum-1].womensTimePar = SGCalcs.getTimePar(newHoles[action.holeNum-1].runDistance, newHoles[action.holeNum-1].womensStrokePar, SGCalcs.parRunPaceWomen, SGCalcs.parShotBoxSecWomen);
            } else if (action.propName === 'mensStrokePar') { //need also to change timePar, which depends on stroke par
                newHoles[action.holeNum-1].mensStrokePar = action.propVal;
                newHoles[action.holeNum-1].mensTimePar = SGCalcs.getTimePar(newHoles[action.holeNum-1].runDistance, newHoles[action.holeNum-1].mensStrokePar, SGCalcs.parRunPaceMen, SGCalcs.parShotBoxSecMen);
            } else if (action.propName === 'womensStrokePar') { //need also to change timePar, which depends on stroke par
                newHoles[action.holeNum-1].womensStrokePar = action.propVal;
                newHoles[action.holeNum-1].womensTimePar = SGCalcs.getTimePar(newHoles[action.holeNum-1].runDistance, newHoles[action.holeNum-1].womensStrokePar, SGCalcs.parRunPaceWomen, SGCalcs.parShotBoxSecWomen);
            }  else {
                newHoles[action.holeNum-1][action.propName] = action.propVal;
            }
           newCourse.tees[action.tee].numHolesGolfDataComplete = updateNumHolesGolfDataComplete(newHoles);
           //newCourse.tees[action.tee].holes = newHoles; //should not be needed because newHoles is a reference to the holes array in the newCourse object
           return newCourse;
        }
        case "UPDATE_HOLE_FEATURE": {
            console.log("In UPDATE_HOLE_FEATURE, tee: " + action.tee + ", holeNum: " + action.holeNum + ", featureType: " + action.featureType);
            const newHoles = newCourse.tees[action.tee].holes;
            const thisHole = newHoles[action.holeNum-1];
            let runStats;
            thisHole[action.featureType] = action.featureCoords;
            if (action.featureType === 'teebox' || action.featureType === 'green') {
                //Feature is a polygon.
                thisHole[action.featureType] = [...action.featureCoords];
                newHoles[action.holeNum-1] = thisHole;
                newCourse.tees[action.tee].numHolesPolyDataComplete = updateNumHolesPolyDataComplete(newHoles);
                newCourse.tees[action.tee].polyInsertionPoint = updatePolyInsertionPoint(newHoles);
                return newCourse;
            } else {
                //Feature is a path
                thisHole[action.featureType + "Sampled"] = action.sampledPathCoords;
                if (action.holeNum === 1) {
                    //CASE 1: Starting hole--could have startPath
                    if (newCourse.tees[action.tee].hasStartLine && thisHole.startPath !== "")  {
                        runStats = SGCalcs.getHoleRunningStats(thisHole.startPathSampled, thisHole.golfPathSampled,
                            thisHole.womensStrokePar, thisHole.mensStrokePar);
                    }
                    else {
                        //Calculate stats based on empty start path
                        runStats = SGCalcs.getHoleRunningStats([], thisHole.golfPathSampled,
                            thisHole.womensStrokePar, thisHole.mensStrokePar);
                    }
                } else if (action.holeNum === newHoles.length) {
                    //CASE 2: Finishing hole--could have finishPath
                    if (newCourse.tees[action.tee].hasFinishLine && thisHole.finishPath !== "")  {
                        runStats = SGCalcs.getHoleRunningStats(thisHole.transitionPathSampled, thisHole.golfPathSampled,
                            thisHole.womensStrokePar, thisHole.mensStrokePar, thisHole.finishPathSampled);
                    }
                    else {
                        //Calculate stats based on no finish path
                        runStats = SGCalcs.getHoleRunningStats(thisHole.transitionPathSampled, thisHole.golfPathSampled,
                            thisHole.womensStrokePar, thisHole.mensStrokePar);
                    }
                } else {
                    //CASE 3: General case: Not start or finish hole
                    runStats = SGCalcs.getHoleRunningStats(thisHole.transitionPathSampled, thisHole.golfPathSampled,
                        thisHole.womensStrokePar, thisHole.mensStrokePar);
                }
                thisHole.runDistance = runStats.runDistance;
                if (newCourse.tees[action.tee].hasStartLine && action.holeNum === 1 && thisHole.startPath !== "") {
                    thisHole.startRunDistance = runStats.transPathRunDistance;
                } else {
                    thisHole.transRunDistance = runStats.transPathRunDistance;
                }
                thisHole.golfRunDistance = runStats.golfPathRunDistance;
                if (newCourse.tees[action.tee].hasFinishLine && action.holeNum === newHoles.length && thisHole.finishPath !== "") {
                    thisHole.finishRunDistance = runStats.finishPathRunDistance;
                }
                thisHole.womensTimePar = runStats.womensTimePar;
                thisHole.mensTimePar = runStats.mensTimePar;
                //newHoles[action.holeNum-1] = thisHole; //Don't need this; thisHole is a reference to the hole in the newHoles array
                newCourse.tees[action.tee].numHolesPathDataComplete = 
                  updateNumHolesPathDataComplete(newCourse.tees[action.tee].hasStartLine, newCourse.tees[action.tee].hasFinishLine, newHoles);
                newCourse.tees[action.tee].pathInsertionPoint = 
                  getPathInsertionPoint(newCourse.tees[action.tee].hasStartLine,
                                           newCourse.tees[action.tee].hasFinishLine, 
                                           newHoles);
                return newCourse;
            }
        }
        case "UPDATE_TEE_NAME": {
            newCourse.tees[action.newTeeName] = newCourse.tees[action.prevTeeName];
            newCourse.tees[action.newTeeName].name = action.newTeeName;
            delete newCourse.tees[action.prevTeeName];
            return newCourse;
        }
        case "ADD_TEE" : {
            console.log("In ADD_TEE, teeName: " + action.teeName);
            const newTee = {
                name: action.teeName,
                hasStartLine: false,
                hasFinishLine: false,
                golfDistance: "",
                runningDistance: "",
                mensStrokePar: "",
                womensStrokePar: "",
                womensTimePar: "",
                mensTimePar: "",
                mensSlope: "",
                womensSlope: "",
                mensRating: "",
                womensRating: "",
                holes: Array.from({length: course.numHoles}, (_, i) => ({
                    number: i+1,
                    name: "",
                    golfDistance: "",
                    runDistance: "",
                    transRunDistance: "",
                    golfRunDistance: "",
                    womensHandicap: "",
                    mensHandicap: "",
                    womensStrokePar: "",
                    mensStrokePar: "",
                    womensTimePar: "",
                    mensTimePar: "",
                    teeLoc: "",
                    flagLoc: "",
                    golfPath: "",
                    golfPathSampled: "",
                    transitionPath: "",
                    transitionPathSampled: "",
                    green: "",
                    teebox: "",
                })),
                numHolesGolfDataComplete: 0,
                numHolesPathDataComplete: 0,
                numHolesPolyDataComplete: 0,
                pathInsertionPoint: {path: 'golfPath', holeNum: 1},
                polyInsertionPoint: {poly: 'teebox', holeNum: 1}
            };
            newTee.holes[0].startPath = "";
            newTee.holes[0].startPathSampled = "";
            newTee.holes[0].startRunDistance = 0;
            newTee.holes[newTee.holes.length-1].finishPath = "";
            newTee.holes[newTee.holes.length-1].finishPathSampled = "";
            newTee.holes[newTee.holes.length-1].finishRunDistance = 0;
            newCourse.tees[action.teeName] = newTee;
            console.log('New Course in ADD_TEE: ', newCourse);
            return newCourse;

        }
        case "UPDATE_SLOPE_RATING_INFO": {
            newCourse.tees[action.tee][action.propName] = action.propVal;
            return newCourse;
        }   
        case "SET_HAS_TEE_SF_LINE": {
            newCourse.tees[action.tee][action.propName] = action.has; //1. update hasStartLine or hasFinishLine
            //2. update pathInsertionPoint
            newCourse.tees[action.tee].pathInsertionPoint = getPathInsertionPoint(newCourse.tees[action.tee].hasStartLine,
                newCourse.tees[action.tee].hasFinishLine, newCourse.tees[action.tee].holes);
            //3. update numHolesPathDataComplete
            newCourse.tees[action.tee].numHolesPathDataComplete = 
              updateNumHolesPathDataComplete(newCourse.tees[action.tee].hasStartLine, newCourse.tees[action.tee].hasFinishLine, newCourse.tees[action.tee].holes); 
            //4. Potentially update hole statistics for start or finish hole
            const pathType = action.propName === 'hasStartLine' ? 'startPath' : 'finishPath';
            const thisHole = action.propName === 'hasStartLine' ? newCourse.tees[action.tee].holes[0] : 
                             newCourse.tees[action.tee].holes[newCourse.tees[action.tee].holes.length-1];
            let runStats;
            if (pathType === 'startPath' && newCourse.tees[action.tee].holes[0].startPath !== "") {
                if (newCourse.tees[action.tee].hasStartLine && newCourse.tees[action.tee].holes[0].startPath !== "")  {
                    runStats = SGCalcs.getHoleRunningStats(thisHole.startPathSampled, thisHole.golfPathSampled,
                        thisHole.womensStrokePar, thisHole.mensStrokePar);
                }
                else {
                    //Calculate stats based on empty start path
                    runStats = SGCalcs.getHoleRunningStats([], thisHole.golfPathSampled,
                        thisHole.womensStrokePar, thisHole.mensStrokePar);
                }
                thisHole.runDistance = runStats.runDistance;
                if (newCourse.tees[action.tee].hasStartLine) {
                    thisHole.startRunDistance = runStats.transPathRunDistance;
                }
                thisHole.womensTimePar = runStats.womensTimePar;
                thisHole.mensTimePar = runStats.mensTimePar;
            } else if (pathType === 'finishPath' && newCourse.tees[action.tee].holes[newCourse.tees[action.tee].holes.length-1].finishPath !== "") {
                if (newCourse.tees[action.tee].hasFinishLine && thisHole.finishPath !== "")  {
                    runStats = SGCalcs.getHoleRunningStats(thisHole.transitionPathSampled, thisHole.golfPathSampled,
                        thisHole.womensStrokePar, thisHole.mensStrokePar, thisHole.finishPathSampled);
                }
                else {
                    //Calculate stats based on no finish path
                    runStats = SGCalcs.getHoleRunningStats(thisHole.transitionPathSampled, thisHole.golfPathSampled,
                        thisHole.womensStrokePar, thisHole.mensStrokePar);
                }
                thisHole.runDistance = runStats.runDistance;
                if (newCourse.tees[action.tee].hasFinishLine) {
                    thisHole.finishRunDistance = runStats.finishPathRunDistance;
                } 
                thisHole.womensTimePar = runStats.womensTimePar;
                thisHole.mensTimePar = runStats.mensTimePar;
            }
            return newCourse;
        }
        default: {
            throw Error('Unknown action: ' + action.type);
        }
    }
}