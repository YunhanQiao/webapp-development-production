const GolfCourseInfoTable = ({
  course,
  selectedRound,
  units,
  gender,
  finalResults = false,
  onUnitsChange = null,
  showUnitsToggle = false,
}) => {
  // const gender = useSelector(state => state?.user?.user?.personalInfo?.parGender);
  if (!gender) return "No Gender found to display the table";
  if (!course || !selectedRound) return null;
  const golfDistances = [];
  const golfPars = [];
  const runDistances = [];
  const timePars = [];

  const numHoles = selectedRound.numHoles;

  // Handle both array and object formats for tees (same fix as in leaderboard)
  let teesArray = null;
  if (Array.isArray(course.tees)) {
    teesArray = course.tees;
  } else if (course.tees && typeof course.tees === "object") {
    // Convert object to array if needed
    teesArray = Object.values(course.tees);
  }

  const teeData = teesArray?.filter(tee => {
    return tee._id === selectedRound.teeId;
  });
  let holes = teeData?.[0]?.holes || [];
  if (numHoles === "Front 9") {
    holes = holes.slice(0, 9);
  } else if (numHoles === "Back 9") {
    holes = holes.slice(9, 18);
  }

  function formatDistance(value, isSum) {
    if (units === "metric") {
      return isSum ? (value / 1000).toFixed(2) : Math.round(value); // km or meters
    } else {
      return isSum ? (value / 5280).toFixed(2) : value; // miles or feet
    }
  }

  const formatToMMSS = secondsFloat => {
    const minutes = Math.floor(secondsFloat / 60);
    const seconds = Math.floor(secondsFloat % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  let frontGolfDistance = 0;
  let frontRunDistance = 0;
  let frontGolfPar = 0;
  let frontTimePar = 0;
  let backGolfDistance = 0;
  let backRunDistance = 0;
  let backGolfPar = 0;
  let backTimePar = 0;

  holes.forEach((hole, index) => {
    const golfDist = parseInt(hole.golfDistance);
    const runDist = parseInt(hole.runDistance);

    const convertedGolfDist = units === "metric" ? Math.round(golfDist * 0.3048) : Math.round(golfDist / 3);
    const convertedRunDist = units === "metric" ? Math.round(runDist * 0.3048) : Math.round(runDist / 3);

    golfDistances.push(parseInt(convertedGolfDist));
    runDistances.push(parseInt(convertedRunDist));
    golfPars.push(parseInt(hole[`${gender}StrokePar`]));

    const rawTime = parseFloat(hole[`${gender}TimePar`]);
    timePars.push(formatToMMSS(Math.round(rawTime)));

    if (index === 8) {
      frontRunDistance = holes.slice(0, 9).reduce((acc, h) => {
        const dist = parseInt(h.runDistance);
        return acc + (units === "metric" ? Math.round(dist * 0.3048) : dist);
      }, 0);
      frontGolfDistance = golfDistances.reduce((a, b) => a + b, 0);
      frontGolfPar = golfPars.reduce((a, b) => a + b, 0);
      frontTimePar = holes.slice(0, 9).reduce((sum, h) => sum + Math.round(parseFloat(h[`${gender}TimePar`])), 0);

      golfDistances.push(frontGolfDistance);
      runDistances.push(formatDistance(frontRunDistance, true));
      golfPars.push(frontGolfPar);
      timePars.push(formatToMMSS(frontTimePar));
    } else if (index === 17) {
      backRunDistance = holes.slice(9, 18).reduce((sum, h) => {
        const d = parseInt(h.runDistance);
        return sum + (units === "Metric" ? Math.round(d * 0.3048) : d);
      }, 0);
      runDistances.push(formatDistance(backRunDistance, true));

      runDistances.push(formatDistance(frontRunDistance + backRunDistance, true));
      backGolfDistance = golfDistances.slice(10, 19).reduce((a, b) => a + b, 0);
      golfDistances.push(backGolfDistance);
      golfDistances.push(frontGolfDistance + backGolfDistance);

      backGolfPar = golfPars.slice(10, 19).reduce((a, b) => a + b, 0);

      golfPars.push(backGolfPar);
      golfPars.push(frontGolfPar + backGolfPar);

      backTimePar = holes.slice(9, 18).reduce((sum, h) => sum + Math.round(parseFloat(h[`${gender}TimePar`])), 0);

      timePars.push(formatToMMSS(backTimePar), formatToMMSS(frontTimePar + backTimePar));
    }
  });
  // console.log('run distances length: ', runDistances.length);
  const generateUnit = (array, index) => {
    if (index === 9 || index >= 19) {
      return units === "Imperial" ? " mi" : " km";
    }
    // return array[index];
    return;
  };
  return (
    // <table className="w-full mb-4 border-collapse">
    <>
      <tr>
        {!finalResults && (
          <th colSpan={4} style={{ border: "none", backgroundColor: "transparent", position: "relative" }}>
            {showUnitsToggle && onUnitsChange && (
              <div className="d-flex align-items-center justify-content-end pe-2">
                <label className="fw-bold text-dark me-2 mb-0" style={{ fontSize: "0.9rem" }}>
                  Units:
                </label>
                <span
                  className={`me-1 fw-normal ${units === "imperial" ? "" : "text-muted"}`}
                  style={{ fontSize: "0.9rem" }}
                >
                  Imperial
                </span>
                <div className="form-check form-switch mx-1">
                  <input
                    id="unitToggleTable"
                    className="form-check-input form-check-input-sm"
                    type="checkbox"
                    checked={units === "metric"}
                    onChange={e => {
                      onUnitsChange(e.target.checked ? "metric" : "imperial");
                    }}
                    style={{ transform: "scale(0.8)" }}
                  />
                </div>
                <span
                  className={`ms-1 fw-normal ${units === "metric" ? "" : "text-muted"}`}
                  style={{ fontSize: "0.9rem" }}
                >
                  Metric
                </span>
              </div>
            )}
          </th>
        )}
        <th colSpan={1} className="p-2 border text-right" style={{ textAlign: "right" }}>
          Golf Distance
        </th>
        {golfDistances.map((h, index) => (
          <td key={`dist-${index}`} className="p-2 border text-center w-12">
            {golfDistances[index]}
          </td>
        ))}
        {/* <td className="p-2 border text-center">{golfDistances}</td> */}
      </tr>
      <tr>
        {!finalResults && <th colSpan={4} style={{ border: "none", backgroundColor: "transparent" }}></th>}
        <th
          colSpan={1}
          className="p-2 border text-right"
          style={{ textAlign: "right", backgroundColor: "#13294E", color: "white" }}
        >
          Stroke Par
        </th>
        {golfPars.map((h, index) => (
          <td
            key={`par-${index}`}
            className="p-2 border text-center w-12"
            style={{ backgroundColor: "#13294E", color: "white" }}
          >
            {golfPars[index]}
          </td>
        ))}
        {/* <td className="p-2 border text-center">{totalPar}</td> */}
      </tr>
      <tr>
        {!finalResults && <th colSpan={4} style={{ border: "none", backgroundColor: "transparent" }}></th>}
        <th colSpan={1} className="p-2 border text-right" style={{ textAlign: "right" }}>
          Run Distance
        </th>
        {runDistances.map((h, index) => (
          <td key={`run-${index}`} className="p-2 border text-center w-12">
            {runDistances[index]}
            {(index === 9 || index >= 19) && generateUnit(runDistances, index)}
          </td>
        ))}
        {/* <td className="p-2 border text-center">{totalRun}</td> */}
      </tr>
      <tr>
        {!finalResults && <th colSpan={4} style={{ border: "none", backgroundColor: "transparent" }}></th>}
        <th
          colSpan={1}
          className="p-2 border text-right"
          style={{ textAlign: "right", backgroundColor: "#ff0f00", color: "white" }}
        >
          Time Par
        </th>
        {timePars.map((h, index) => (
          <td
            key={`timePar-${index}`}
            className="p-2 border text-center w-12"
            style={{ backgroundColor: "#ff0f00", color: "white" }}
          >
            {timePars[index]}
          </td>
        ))}
        {/* <td className="p-2 border text-center">{totalTimePar}</td> */}
      </tr>
    </>
    // </table>
  );
};

export default GolfCourseInfoTable;
