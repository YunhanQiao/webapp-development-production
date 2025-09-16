//without optionGenerator code , last code working
/*************************************************************************
 * File: coursesModeDetailsMapHoleProfile.js
 * This file defines the CoursesModeDetailsHolePofile React component,
 * which displays the elevation profile of the selected hole in the
 * "Map tab. It uses the react-chartjs-2 library to display the
 * hole profile as a line chart.
 * ************************************************************************/
import { useRef, useEffect, useState, useMemo } from "react";
import { Line } from "react-chartjs-2";
import "chart.js/auto";
import * as SGCalcs from "../../../speedgolfCalculations";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCourse } from "../../../components/contexts/CourseContext";
import { useTeeUnits } from "../../../components/contexts/TeeUnitsContext";
import { elements } from "chart.js/auto";

export default function CoursesModeDetailsMapHoleProfile({
  profileHole,
  setProfileHole,
  summary = {},
  setChartData,
  setChartOptions
}) {
  const course = useCourse();
  const teeUnits = useTeeUnits();
  let conversionFactor = useRef(1); // Use consistent conversion factors for Imperial and Metric units

  const [holeData, setHoleData] = useState({
    labels: [],
    datasets: []
  });

  const [completeHoleData, setCompleteHoleData] = useState({
    labels: [],
    datasets: []
  });

  // const [holeSummaries, setHoleSummaries] = useState([]);
  const [hoveredHoleSummary, setHoveredHoleSummary] = useState(null);
  const [holeSegments, setHoleSegments] = useState([]);
  const [newHoleSegments, setNewHoleSegments] = useState([]);

  const holeoptions = {
    scales: {
      x: {
        type: "linear",
        ticks: {
          display: true,
          stepSize: 50
        },
        grid: {
          drawBorder: true,
          display: true
        }
      },
      y: {
        ticks: {
          display: true,
          beginAtZero: true
        },
        grid: {
          drawBorder: true,
          display: true
        }
      }
    }
  };
  // Use useMemo to recalculate options
  const options = useMemo(
    () => ({
      scales: {
        x: {
          type: "linear",
          ticks: {
            display: true,
            stepSize: teeUnits.selectedUnits === "Imperial" ? 50 : 50,
            callback: function(value) {
              return teeUnits.selectedUnits === "Imperial"
                ? `${(value / 1760).toFixed(2)}`
                : `${(value / 1000).toFixed(2)}`;
            }
          },
          grid: {
            drawBorder: true,
            display: true,
            lineWidth: 1
          },
          title: {
            display: true,
            text: teeUnits.selectedUnits === "Imperial" ? "Distance (miles)" : "Distance (km)",
            font: { size: 14 }
          }
        },
        y: {
          ticks: {
            display: true,
            beginAtZero: true,
            callback: function(value) {
              return teeUnits.selectedUnits === "Imperial" ? `${value} ft` : `${(value * 0.3048).toFixed(2)} m`;
            }
          },
          grid: {
            drawBorder: true,
            display: true,
            lineWidth: 1
          },
          title: {
            display: true,
            text: teeUnits.selectedUnits === "Imperial" ? "Elevation (ft)" : "Elevation (m)",
            font: { size: 14 }
          }
        }
      },
      elements: {
        line: {
          tension: 0.4,
          borderWidth: 3
        }
      },
      plugins: {
        tooltip: {
          callbacks: {
            title: () => null, // removing the default title
            label: context => {
              if (!context || !context.raw) {
                console.warn("Tooltip context or raw data not loaded ....");
                return "";
              }

              const segments = profileHole === "complete" ? holeSegments : newHoleSegments;

              if (!segments || segments.length === 0) {
                console.warn("Segments not yet populated or still loading...");
                return "";
              }

              const hoveredSegment = segments.find(
                segment => context.raw.x >= segment.start && context.raw.x <= segment.end
              );

              if (hoveredSegment) {
                const distanceUnit = teeUnits.selectedUnits === "Imperial" ? "yards" : "metres";
                const elevationUnit = teeUnits.selectedUnits === "Imperial" ? "ft" : "m";
                let elapsedDistance = context.raw.x;
                let elapsedDistanceUnit = "";
                let elevationGain = hoveredSegment.summary.elevationGain;
                let elevationLoss = hoveredSegment.summary.elevationLoss;

                if (teeUnits.selectedUnits === "Imperial") {
                  elapsedDistance = elapsedDistance / 1760;
                  elapsedDistanceUnit = "miles";
                } else {
                  elapsedDistance = elapsedDistance / 1000;
                  elapsedDistanceUnit = "km";
                  // Convert elevation values for Metric display
                  elevationGain = (hoveredSegment.summary.elevationGain * 0.3048).toFixed(2);
                  elevationLoss = (hoveredSegment.summary.elevationLoss * 0.3048).toFixed(2);
                }

                return [
                  `Elapsed distance: ${elapsedDistance.toFixed(2)} ${elapsedDistanceUnit}`,
                  profileHole === "complete"
                    ? `Hole ${hoveredSegment.summary.hole} (${hoveredSegment.type} Path)`
                    : null,
                  `Distance: ${hoveredSegment.summary.distance} ${distanceUnit}`,
                  `Elevation Gain: ${elevationGain} ${elevationUnit}`,
                  `Elevation Loss: ${elevationLoss} ${elevationUnit}`
                ].filter(Boolean); // Filter out any null or undefined entries
              }
              return "";
            }
          }
        },
        annotation: {
          annotations: (profileHole === "complete" ? holeSegments : newHoleSegments).map(segment => ({
            type: "line",
            scaleID: "x",
            value: segment.start,
            borderColor: segment.type === "golf" ? "red" : "yellow",
            borderWidth: 1,
            label: {
              enabled: true,
              content: `Hole ${segment.summary.hole} (${segment.type} Path)`,
              position: "start",
              rotation: -90,
              backgroundColor: "transparent",
              color: segment.type === "golf" ? "red" : "yellow",
              font: { size: 12 }
            }
          }))
        }
      }
    }),
    [teeUnits.selectedUnits, profileHole, holeSegments, newHoleSegments]
  );

  const holeProfileBackground = {
    id: "holeProfileBackground",
    beforeDatasetsDraw(chart, args, chartOptions) {
      const {
        ctx,
        chartArea: { top, bottom, left, right, width, height }
      } = chart;
      ctx.save();
      const grd = ctx.createLinearGradient(left, top, width, height);
      grd.addColorStop(0, "gray");
      grd.addColorStop(1, "white");
      ctx.fillStyle = grd;
      ctx.fillRect(left, top, width, height);
    }
  };

  useEffect(() => {
    if (profileHole === "complete") {
      showCompleteProfile();
    } else {
      showHoleProfile();
    }
  }, [teeUnits.selectedUnit, profileHole, teeUnits]);

  /*************************************************************************
   * @function showHoleProfile
   * @Desc
   * This function is called by the useEffect hook to update the holeData
   * state variable, which is used by the Line component to display the
   * elevation profile of the selected hole.
   * *************************************************************************/
  function showHoleProfile() {
    //setHoleSegments([]); // Clear existing segments
    setNewHoleSegments([]); // Clear new hole segments
    if (teeUnits.selectedUnits === "Imperial") conversionFactor.current = 3;
    else conversionFactor.current = 3.281; //metric

    const currentHoleObj = course.tees[teeUnits.selectedTee].holes[profileHole - 1];
    const tempLabels = [];
    let currentDistance = 0;

    let transitionPathLength = currentHoleObj?.transitionPathSampled?.length || 0;
    let transitionPathSampled = currentHoleObj?.transitionPathSampled || [];

    let golfPathLength = currentHoleObj?.golfPathSampled?.length || 0;
    let golfPathSampled = currentHoleObj?.golfPathSampled || [];

    let transitionPathData = [];
    let golfPathData = [];

    let transitionElevationGain = 0;
    let transitionElevationLoss = 0;

    let golfElevationGain = 0;
    let golfElevationLoss = 0;
    //let newHoleSegments = [];

    // Handle Transition Path
    let segmentStartDistance = currentDistance;
    for (let i = 0; i < transitionPathLength; i++) {
      if (i === 0) {
        tempLabels.push(0);
      } else {
        let tempDist = SGCalcs.getDistance([transitionPathSampled[i - 1], transitionPathSampled[i]]);
        currentDistance += parseFloat(tempDist / conversionFactor.current);
        tempLabels.push(currentDistance.toFixed(2));
      }

      // Calculate elevation gain/loss
      let elevationDiff =
        transitionPathSampled[i].elv - (transitionPathSampled[i - 1]?.elv || transitionPathSampled[i].elv);

      if (elevationDiff > 0) {
        transitionElevationGain += elevationDiff;
      } else {
        transitionElevationLoss += Math.abs(elevationDiff);
      }

      transitionPathData.push({
        x: currentDistance.toFixed(2),
        y: transitionPathSampled[i].elv
      });
    }

    console.log(
      `SHOW_HOLE_PRO Transition Path for Hole ${profileHole}: Distance = ${(
        currentDistance - segmentStartDistance
      ).toFixed(2)} units`
    );

    // Push Transition Path Segment for the current hole
    newHoleSegments.push({
      start: segmentStartDistance,
      end: parseFloat(currentDistance.toFixed(2)),
      type: "Transition",
      summary: {
        hole: profileHole,
        distance: (currentDistance - segmentStartDistance).toFixed(2),
        elevationGain: transitionElevationGain.toFixed(0),
        elevationLoss: transitionElevationLoss.toFixed(0)
      }
    });

    // Handle Golf Path
    segmentStartDistance = currentDistance; // Reset segment start distance for golf path
    for (let i = 0; i < golfPathLength; i++) {
      //commented
      // if (i === 0 && transitionPathLength === 0) {
      //     // If no transition path, push the first label as 0
      //     tempLabels.push(0);
      // } else if (i !== 0) {
      //     let tempDist = SGCalcs.getDistance([golfPathSampled[i - 1], golfPathSampled[i]]);
      //     currentDistance += parseFloat(tempDist / conversionFactor.current);
      //     tempLabels.push(currentDistance.toFixed(2));
      // }
      if (i !== 0) {
        let tempDist = SGCalcs.getDistance([golfPathSampled[i - 1], golfPathSampled[i]]);
        currentDistance += parseFloat(tempDist / conversionFactor.current);
        tempLabels.push(currentDistance.toFixed(2));
      }

      // Calculate elevation gain/loss for golf path
      let elevationDiff = golfPathSampled[i].elv - (golfPathSampled[i - 1]?.elv || golfPathSampled[i].elv);

      if (elevationDiff > 0) {
        golfElevationGain += elevationDiff;
      } else {
        golfElevationLoss += Math.abs(elevationDiff);
      }

      golfPathData.push({
        x: currentDistance.toFixed(2),
        y: golfPathSampled[i].elv
      });
    }
    console.log("SHOW_HOLE_PRO  Current Distance is : ", currentDistance);
    console.log("SHOW_HOLE_PRO Segment Start Distance is : ", segmentStartDistance);
    console.log(
      `SHOW_HOLE_PRO Golf Path for Hole ${profileHole}: Distance = ${(currentDistance - segmentStartDistance).toFixed(
        2
      )} units`
    );

    // Push Golf Path Segment for the current hole
    newHoleSegments.push({
      start: segmentStartDistance,
      end: parseFloat(currentDistance.toFixed(2)),
      type: "Golf",
      summary: {
        hole: profileHole,
        distance: (currentDistance - segmentStartDistance).toFixed(2),
        elevationGain: golfElevationGain.toFixed(0),
        elevationLoss: golfElevationLoss.toFixed(0)
      }
    });

    // Update state with the new data for the specific hole
    setHoleData({
      labels: tempLabels.slice(0, tempLabels.length),
      datasets: [
        {
          label: "Transition Path",
          backgroundColor: "yellow",
          borderColor: "yellow",
          borderWidth: 5,
          data: transitionPathData,
          order: 1
        },
        {
          label: "Golf Path",
          backgroundColor: "red",
          borderColor: "red",
          borderWidth: 5,
          data: golfPathData,
          order: 3
        }
      ]
    });

    // Update holeSegments for tooltips and annotations
    setNewHoleSegments([...newHoleSegments]);

    // Log the elevation gains and losses for both paths for debugging
    console.log(
      `Hole ${profileHole} Transition Path - Elevation Gain: ${transitionElevationGain}, Loss: ${transitionElevationLoss}`
    );
    console.log(`Hole ${profileHole} Golf Path - Elevation Gain: ${golfElevationGain}, Loss: ${golfElevationLoss}`);
  }

  function showCompleteProfile() {
    //setHoleSegments([]);  // Ensure segments are cleared before re-calculation
    //setHoleSegments([]); // Clear existing segments to prevent stale data
    //setNewHoleSegments([]); // Clear new hole segments too
    if (teeUnits.selectedUnits === "Imperial") conversionFactor.current = 3;
    else conversionFactor.current = 3.281; //metric

    const allHoles = course.tees[teeUnits.selectedTee].holes;
    const tempLabels = [];
    // let currentDistance = 0; // Track cumulative distance

    let combinedTransitionPathData = [];
    let combinedGolfPathData = [];
    let currentDistance = 0;

    allHoles.forEach((hole, index) => {
      let transitionPathLength = hole.transitionPathSampled?.length || 0;
      let transitionPathSampled = hole.transitionPathSampled || [];

      let golfPathLength = hole.golfPathSampled?.length || 0;
      let golfPathSampled = hole.golfPathSampled || [];

      let segmentStartDistance = currentDistance; // Start distance for each segment

      // Calculate Transition Path
      let transitionElevationGain = 0;
      let transitionElevationLoss = 0;

      for (let i = 0; i < transitionPathLength; i++) {
        // Calculate distance between points
        if (i > 0) {
          let tempDist = SGCalcs.getDistance([transitionPathSampled[i - 1], transitionPathSampled[i]]);
          currentDistance += parseFloat(tempDist / conversionFactor.current);
          tempLabels.push(currentDistance.toFixed(2)); // Update tempLabels with the cumulative distance
        }

        // Calculate elevation gain/loss
        let elevationChange =
          transitionPathSampled[i].elv - (transitionPathSampled[i - 1]?.elv || transitionPathSampled[i].elv);
        if (elevationChange > 0) {
          transitionElevationGain += elevationChange;
        } else {
          transitionElevationLoss += Math.abs(elevationChange);
        }

        // Update Transition Path Data
        combinedTransitionPathData.push({ x: currentDistance.toFixed(2), y: transitionPathSampled[i].elv });
        combinedGolfPathData.push({ x: currentDistance, y: null }); // Keep golf path null here
      }
      console.log(
        `Transition Path for Hole ${index + 1}: Distance = ${(currentDistance - segmentStartDistance).toFixed(2)} units`
      );

      // Add Transition Path Segment to `holeSegments`
      holeSegments.push({
        start: segmentStartDistance,
        end: parseFloat(currentDistance.toFixed(2)),
        type: "Transition",
        summary: {
          hole: index + 1,
          distance: (currentDistance - segmentStartDistance).toFixed(2),
          elevationGain: transitionElevationGain.toFixed(0),
          elevationLoss: transitionElevationLoss.toFixed(0)
        }
      });

      // Calculate Golf Path
      let golfElevationGain = 0;
      let golfElevationLoss = 0;

      segmentStartDistance = currentDistance; // Reset for Golf Path
      console.log("Transition Segment Start Distance is : ", segmentStartDistance);
      console.log("Transiiton Current Distance is : ", currentDistance);

      for (let i = 0; i < golfPathLength; i++) {
        if (i > 0 && golfPathSampled[i - 1] && golfPathSampled[i]) {
          let tempDist = SGCalcs.getDistance([golfPathSampled[i - 1], golfPathSampled[i]]);
          console.log("Temp Distance is inside golfPathlenth  : ", tempDist);
          //currentDistance += parseFloat(tempDist / conversionFactor.current);
          let distanceIncrement = tempDist / conversionFactor.current;
          console.log("Distance Increment:", distanceIncrement);
          currentDistance += distanceIncrement;
          console.log("Current Distance inside golfpathlenth : ", currentDistance);
          tempLabels.push(currentDistance.toFixed(2));
        }

        // Calculate elevation gain/loss
        let elevationChange = golfPathSampled[i].elv - (golfPathSampled[i - 1]?.elv || golfPathSampled[i].elv);
        if (elevationChange > 0) {
          golfElevationGain += elevationChange;
        } else {
          golfElevationLoss += Math.abs(elevationChange);
        }

        // Update Golf Path Data
        combinedGolfPathData.push({ x: currentDistance.toFixed(2), y: golfPathSampled[i].elv });
        combinedTransitionPathData.push({ x: currentDistance, y: null }); // Keep transition path null here
      }
      //Commented debug lines 
      //console.log("Current Distance is : ", currentDistance);
      //console.log("Segment Start Distance is : ", segmentStartDistance);

      console.log(
        `Golf Path for Hole ${index + 1}: Distance = ${(currentDistance - segmentStartDistance).toFixed(2)} units`
      );

      // Add Golf Path Segment to `holeSegments`
      holeSegments.push({
        start: parseFloat(tempLabels[tempLabels.length - golfPathLength]) || 0,
        end: parseFloat(currentDistance.toFixed(2)),
        type: "Golf",
        summary: {
          hole: index + 1,
          distance: (currentDistance - segmentStartDistance).toFixed(2),
          elevationGain: golfElevationGain.toFixed(0),
          elevationLoss: golfElevationLoss.toFixed(0)
        }
      });
    });

    setCompleteHoleData({
      labels: tempLabels,
      datasets: [
        {
          label: "Transition Path",
          backgroundColor: "yellow",
          borderColor: "yellow",
          borderWidth: 1,
          data: combinedTransitionPathData,
          cubicInterpolationMode: "monotone", // Enable smoothing
          tension: 1.0 // Set tension to smooth the line
        },
        {
          label: "Golf Path",
          backgroundColor: "red",
          borderColor: "red",
          borderWidth: 1,
          data: combinedGolfPathData,
          cubicInterpolationMode: "monotone", // Enable smoothing
          tension: 1.0 // Set tension to smooth the line
        }
      ]
    });

    const chartData = {
      labels: tempLabels,
      datasets: [
        {
          label: "Transition Path",
          backgroundColor: "yellow",
          borderColor: "yellow",
          borderWidth: 3,
          data: combinedTransitionPathData,
          cubicInterpolationMode: "monotone", // Enable smoothing
          tension: 0.4 // Set tension to smooth the line
        },
        {
          label: "Golf Path",
          backgroundColor: "red",
          borderColor: "red",
          borderWidth: 3,
          data: combinedGolfPathData,
          cubicInterpolationMode: "monotone", // Enable smoothing
          tension: 0.4 // Set tension to smooth the line
        }
      ]
    };
    setCompleteHoleData(chartData);
    setHoleSegments(holeSegments); // Save hole segments for mouseover tooltips
    setChartData(chartData); // Call setChartData to update parent state
    setChartOptions(options); // Call setChartOptions to update parent state
  }

  return (
    <div className='hole-profile'>
      <div className='flex-container'>
        <h5>
          {profileHole === "complete"
            ? `Course Elevation Profile:
                  ${
                    teeUnits.selectedUnits === "Imperial"
                      ? `${summary?.totalDistance || "0"} miles`
                      : `${(summary?.totalDistance * 1.60934).toFixed(2)} km`
                  }
                  (${
                    teeUnits.selectedUnits === "Imperial"
                      ? `${summary?.elevationGain || "0"} ft elevation gain, ${summary?.elevationLoss ||
                          "0"} ft elevation loss`
                      : `${(summary?.elevationGain * 0.3048).toFixed(2)} m elevation gain, ${(
                          summary?.elevationLoss * 0.3048
                        ).toFixed(2)} m elevation loss`
                  })`
            : `Hole #${profileHole} Elevation Profile`}
        </h5>
        <div>
          <button onClick={() => setProfileHole(0)}>
            <FontAwesomeIcon icon='xmark' />
          </button>
        </div>
      </div>

      {/* Conditionally render the Line component based on profileHole */}
      {profileHole !== "complete" && (
        <div className='flex-container' style={{ display: profileHole !== "complete" ? "flex" : "none" }}>
          <Line
            id='holeProfile'
            data={holeData}
            options={options}
            plugins={[holeProfileBackground]}
            height={"9%"}
            width={"100%"}
          />
        </div>
      )}
    </div>
  );
}
