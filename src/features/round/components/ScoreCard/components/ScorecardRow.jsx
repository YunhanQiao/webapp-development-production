import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useFormContext } from "react-hook-form";
import TimeToParIcons from "./TimeToParIcons";

import {
  convertFeetToKilometers,
  convertFeetToMeters,
  convertFeetToMiles,
  convertFeetToYards,
  getSecondsFormatHandler,
  MS_IN_SECOND,
  SECONDS_IN_MINUTE,
} from "features/round/utils";
import { format } from "date-fns/format";
import { generateToParComputationObject, isAllStrokesNaN, isAllTimesNaN, sumValues } from "../utils";
import { Circle, DoubleCircle, DoubleSquare, Square, Triangle, TripleCircle } from "./GolfIcons";

const NO_DATA = "ND";
const OUT_STROKES_LENGTH = 9;

function ScorecardRow({ item, parGender, rowName, isMetric = false, selectionType, getVisibilityState }) {
  const { number, runDistance, transRunDistance, golfRunDistance } = item;
  const {
    getValues,
    register,
    setValue,
    watch,
    formState: { errors },
  } = useFormContext();

  const showHoleTimes = watch("showHoleTimes");
  const inputErrors = errors?.holeByHole?.[number - 1];

  const isStrokesInvalid = inputErrors?.strokes;
  const isMinutesInvalid = inputErrors?.minutes;
  const isSecondsInvalid = inputErrors?.seconds;

  const formatDistance = useCallback(
    feet => {
      if (!feet) {
        return NO_DATA;
      }

      if (rowName) {
        return isMetric ? convertFeetToKilometers(feet) + " km" : convertFeetToMiles(feet).toFixed(2) + " mi";
      }

      return isMetric ? convertFeetToMeters(feet) : convertFeetToYards(feet);
    },
    [isMetric],
  );

  /**
   * You **can't** use `date-fns/format` because it treats `timeParInMs`
   * as a **timestamp** (milliseconds since Unix Epoch), not a duration.
   * This causes incorrect formatting, as it interprets the time relative
   * to `1970-01-01T00:00:00Z`.
   */
  const time = useMemo(() => {
    const timeParInMs = parseInt(item[parGender + "TimePar"]) * MS_IN_SECOND;

    if (!timeParInMs) {
      return NO_DATA;
    }

    // return format(new Date(timeParInMs), "mm:ss");
    const timeParInSeconds = parseInt(item[parGender + "TimePar"]);
    const minutes = Math.floor(timeParInSeconds / SECONDS_IN_MINUTE);
    const seconds = timeParInSeconds % 60;
    return `${minutes.toString().padStart(2, 0)}:${seconds.toString().padStart(2, "0")}`;
  }, [parGender]);

  /**
   * Unified handler for every input
   * @param field - "strokes" | "minutes" | "seconds"
   */
  const handleInputChange = field => {
    const values = getValues("holeByHole").map(hole => hole[field]);
    const allValues = getValues("holeByHole");
    // console.log('Value: ', number ? getValues(`holeByHole.${number - 1}.seconds`.toString().padStart(2, "0")) : `${rowName}.seconds`.toString().padStart(2, "0"))
    if (number <= OUT_STROKES_LENGTH) {
      // var is used here because of the hoisting feature (function scope)
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/var#hoisting
      var outInputSum = sumValues(values.slice(0, OUT_STROKES_LENGTH));
      var inInputSum = getValues(`in.${field}`);

      // setValue(`out.${field}`, outInputSum.toString().padStart(2, "0"));
      let offSet = outInputSum;
      if (field === "seconds") {
        if (outInputSum > 59) {
          const minutesSum = sumValues(allValues.map(item => item.minutes).slice(0, OUT_STROKES_LENGTH));
          const minitesIncrement = Math.floor(outInputSum / 60);
          offSet = outInputSum % 60;
          const minutesValue = minutesSum + minitesIncrement;
          setValue(`out.minutes`, minutesValue.toString().padStart(2, "0"));
        }
      }
      setValue(`out.${field}`, offSet.toString().padStart(2, "0"));
    } else {
      inInputSum = sumValues(values.slice(OUT_STROKES_LENGTH));
      outInputSum = getValues(`out.${field}`);
      // setValue(`in.${field}`, inInputSum.toString().padStart(2, "0"));

      let offset = inInputSum;
      if (field === "seconds") {
        if (inInputSum > 59) {
          const minutesSum = sumValues(allValues.map(item => item.minutes).slice(OUT_STROKES_LENGTH));
          const minitesIncrement = Math.floor(inInputSum / 60);
          offset = inInputSum % 60;
          const minutesValue = minutesSum + minitesIncrement;
          setValue(`in.minutes`, minutesValue.toString().padStart(2, "0"));
        }
      }
      setValue(`in.${field}`, offset.toString().padStart(2, "0"));
    }

    let totalSum = null;
    if (selectionType === "Out") {
      totalSum = outInputSum;
    } else if (selectionType === "In") {
      totalSum = inInputSum;
    } else {
      totalSum = outInputSum + inInputSum;
    }
    // setValue(`total.${field}`, (outInputSum + inInputSum).toString().padStart(2, "0"));
    if (field == "strokes" && isAllStrokesNaN(allValues)) {
      totalSum = 80;
    }
    if ((field == "seconds" || field == "minutes") && isAllTimesNaN(allValues)) {
      totalSum = 0;
      setValue(`total.seconds`, "00");
      setValue(`total.minutes`, "60");
      return;
    }
    if (field == "seconds") {
      if (totalSum > 59) {
        const minutesSum = sumValues(allValues.map(item => item.minutes));
        const minitesIncrement = Math.floor(totalSum / 60);
        totalSum = totalSum % 60;
        const minutesValue = minutesSum + minitesIncrement;
        setValue(`total.minutes`, minutesValue.toString().padStart(2, "0"));
      }
    }
    setValue(`total.${field}`, totalSum.toString().padStart(2, "0"));
  };

  const handleSecondsFormat = getSecondsFormatHandler(
    setValue,
    number ? `holeByHole.${number - 1}.seconds` : `${rowName}.seconds`,
  );

  const getScoreClass = (strokePar, strokes, number) => {
    if (!Boolean(number)) {
      return "form-control form-control-sm text-center";
    }
    const isEven = number % 2 === 0;
    const strokesToPar = parseInt(strokes) - parseInt(strokePar);
    if (strokesToPar === -1)
      return "stroke-input circle"; // Birdie
    else if (strokesToPar === 1)
      return "stroke-input square"; // Bogey
    else if (strokesToPar === 0) {
      let cellBgColor = "";
      if (number <= 9) {
        cellBgColor = isEven ? "cell-bg-white" : "cell-bg-gray";
      } else {
        cellBgColor = isEven ? "cell-bg-gray" : "cell-bg-white";
      }
      // if (isEven) return "stroke-input no-border cell-bg-white";
      // else return "stroke-input no-border cell-bg-gray";
      return `stroke-input no-border ${cellBgColor}`;
    } else if (strokesToPar === 2)
      return "stroke-input solid-square"; // Double Bogey
    else if (strokesToPar === -2)
      return "stroke-input solid-circle"; // Eagle
    else if (strokesToPar <= -3)
      return "stroke-input solid-circle"; // Albatross (Triple Circle)
    else if (strokesToPar > 2) return "stroke-input solid-square"; // Higher than Double Bogey
    return "stroke-input normal"; // no input fields
  };

  const getFormattedSeconds = () => {
    const seconds = number ? watch(`holeByHole.${number - 1}.seconds`) : watch(`${rowName}.seconds`);
    return seconds || seconds == 0 ? seconds.toString().padStart(2, "0") : seconds;
  };

  // Added this and the useEffect below to update the seconds value when the scorecard row is visible - For zero padding
  let seconds = getFormattedSeconds();

  const useElementPresence = className => {
    const [isPresent, setIsPresent] = useState(false);

    useEffect(() => {
      const checkPresence = () => {
        const element = document.querySelector(`.${className}`);
        setIsPresent(!!element); // Convert to boolean (true if exists, false otherwise)
      };

      checkPresence(); // Run on mount

      const observer = new MutationObserver(checkPresence);
      observer.observe(document.body, { childList: true, subtree: true });

      return () => observer.disconnect();
    }, [className]);

    return isPresent;
  };

  const isScorecardRowVisible = useElementPresence("scorecard-row");

  useEffect(() => {
    if (isScorecardRowVisible) {
      seconds = getFormattedSeconds();
    }
  }, [isScorecardRowVisible]);

  const calculateTimeToPar = useCallback(() => {
    // For OUT row (1-9)
    if (rowName === "out") {
      const holes = getValues("holeByHole").slice(0, OUT_STROKES_LENGTH);
      const totalTimeEntered = sumValues(
        holes.map(hole => {
          if (!hole.minutes && !hole.seconds) return 0;
          return parseInt(hole.minutes || 0) * 60 + parseInt(hole.seconds || 0);
        }),
      );
      const totalTimePars = sumValues(
        holes.map((_, index) => parseInt(getValues(`holeByHole.${index}.${parGender}TimePar`)) || 0),
      );
      return totalTimeEntered === 0 ? null : totalTimeEntered - totalTimePars;
    }

    // For IN row (10-18)
    if (rowName === "in") {
      const holes = getValues("holeByHole").slice(OUT_STROKES_LENGTH);
      const totalTimeEntered = sumValues(
        holes.map(hole => {
          if (!hole.minutes && !hole.seconds) return 0;
          return parseInt(hole.minutes || 0) * 60 + parseInt(hole.seconds || 0);
        }),
      );
      const totalTimePars = sumValues(
        holes.map(
          (_, index) => parseInt(getValues(`holeByHole.${index + OUT_STROKES_LENGTH}.${parGender}TimePar`)) || 0,
        ),
      );
      return totalTimeEntered === 0 ? null : totalTimeEntered - totalTimePars;
    }

    // For TOTAL row (1-18)
    if (rowName === "total") {
      const holes = getValues("holeByHole");
      const totalTimeEntered = sumValues(
        holes.map(hole => {
          if (!hole.minutes && !hole.seconds) return 0;
          return parseInt(hole.minutes || 0) * 60 + parseInt(hole.seconds || 0);
        }),
      );
      const totalTimePars = sumValues(
        holes.map((_, index) => parseInt(getValues(`holeByHole.${index}.${parGender}TimePar`)) || 0),
      );
      return totalTimeEntered === 0 ? null : totalTimeEntered - totalTimePars;
    }

    // For individual holes
    if (number) {
      const minutes = watch(`holeByHole.${number - 1}.minutes`);
      const seconds = watch(`holeByHole.${number - 1}.seconds`);
      if (!minutes && !seconds) return null;

      const timeEntered = parseInt(minutes || 0) * 60 + parseInt(seconds || 0);
      const timePar = parseInt(item[parGender + "TimePar"]) || 0;
      return timeEntered - timePar;
    }

    return null;
  }, [number, rowName, parGender, getValues, watch, item]);

  const { strokeToPar, timeToPar } = generateToParComputationObject(
    rowName,
    getValues("holeByHole"),
    parGender,
    selectionType,
  );

  return (
    <tr className={`scorecard-row ${getVisibilityState(item.number - 1, rowName) ? "" : "d-none"}`}>
      <td className="text-center align-middle">{number || rowName.toUpperCase()}</td>
      <td className="text-center align-middle">{formatDistance(runDistance)}</td>
      <td className="text-center align-middle">{formatDistance(transRunDistance)}</td>
      <td className="text-center align-middle">{formatDistance(golfRunDistance)}</td>
      <td className="text-center align-middle">{item[parGender + "StrokePar"] || "ND"}</td>
      <td className="text-center align-middle">{time}</td>
      <td className="text-center align-middle">
        {/* <div className="d-flex align-items-center justify-content-center" style={{ padding: '2.5px'}}>
          <input 
            className={`${getScoreClass(item[parGender + "StrokePar"], watch(`holeByHole.${number - 1}.strokes`), number)} ${isStrokesInvalid ? "is-invalid" : ""}`}
            type="number"
            min="1"
            max="99"
            aria-describedby="roundStrokesDescr"
            {...register(number ? `holeByHole.${number - 1}.strokes` : `${rowName}.strokes`, {
              valueAsNumber: true,
              onChange: () => handleInputChange("strokes"),
            })}
            disabled={Boolean(rowName)}
          />
        </div> */}
        <div className="d-flex align-items-center justify-content-center" style={{ padding: "2.5px" }}>
          <input
            className={`${getScoreClass(item[parGender + "StrokePar"], watch(`holeByHole.${number - 1}.strokes`), number)} ${isStrokesInvalid ? "is-invalid" : ""}`}
            type="number"
            min="1"
            max="99"
            aria-describedby="roundStrokesDescr"
            {...register(number ? `holeByHole.${number - 1}.strokes` : `${rowName}.strokes`, {
              valueAsNumber: true,
              onChange: () => handleInputChange("strokes"),
            })}
            disabled={Boolean(rowName)}
          />
          {strokeToPar && <small className="text-nowrap">{!item.number && (strokeToPar || "ND")}</small>}
        </div>
      </td>
      {showHoleTimes && (
        <td className="text-center align-middle p-0" style={{ width: "90px" }}>
          <div className="relative bg-white">
            <div className="d-flex flex-row align-items-center justify-content-center">
              <input
                className={`form-control form-control-sm text-end ${isMinutesInvalid ? "is-invalid" : ""}`}
                type="number"
                size="3"
                min="1"
                max="99"
                style={{
                  width: "50px",
                  height: "24px",
                  padding: "1px 2px",
                  fontSize: "12px",
                }}
                {...register(number ? `holeByHole.${number - 1}.minutes` : `${rowName}.minutes`, {
                  valueAsNumber: true,
                  onChange: () => handleInputChange("minutes"),
                  onBlur: e => {
                    const complementName = number ? `holeByHole.${number - 1}.seconds` : `${rowName}.seconds`;
                    const currentName = number ? `holeByHole.${number - 1}.minutes` : `${rowName}.minutes`;
                    const value = isNaN(parseInt(e.target.value)) ? null : parseInt(e.target.value);
                    const complementValue = getValues(complementName);

                    const nextFocusedElement = e.relatedTarget;
                    if (nextFocusedElement && nextFocusedElement.name === complementName) {
                      return;
                    }

                    if (Number.isFinite(value)) {
                      if (!Number.isFinite(complementValue)) {
                        handleSecondsFormat({ target: { value: 0 } });
                      }
                    } else if (!Number.isFinite(value) && Number.isFinite(complementValue)) {
                      setValue(currentName, 0);
                    }
                  },
                })}
                disabled={Boolean(rowName)}
              />
              :
              <input
                className={`form-control form-control-sm text-end ${isSecondsInvalid ? "is-invalid" : ""}`}
                type="number"
                size="2"
                min="0"
                max="59"
                style={{
                  width: "50px",
                  height: "24px",
                  padding: "1px 2px",
                  fontSize: "12px",
                }}
                value={seconds}
                {...register(number ? `holeByHole.${number - 1}.seconds` : `${rowName}.seconds`, {
                  valueAsNumber: true,
                  onChange: e => {
                    handleSecondsFormat(e);
                    handleInputChange("seconds");
                  },
                  onBlur: e => {
                    const complementName = number ? `holeByHole.${number - 1}.minutes` : `${rowName}.minutes`;
                    const currentName = number ? `holeByHole.${number - 1}.seconds` : `${rowName}.seconds`;
                    const value = isNaN(parseInt(e.target.value)) ? null : parseInt(e.target.value);
                    const complementValue = getValues(complementName);

                    const nextFocusedElement = e.relatedTarget;
                    if (nextFocusedElement && nextFocusedElement.name === complementName) {
                      return;
                    }

                    if (Number.isFinite(value)) {
                      if (!Number.isFinite(complementValue)) {
                        setValue(complementName, 0);
                      }
                    } else if (!Number.isFinite(value) && Number.isFinite(complementValue)) {
                      handleSecondsFormat({ target: { value: 0 } });
                    }
                  },
                })}
                disabled={Boolean(rowName)}
                onKeyDown={e => {
                  if (e.key === "Delete" || e.key === "Backspace") {
                    const secondsValue = e.target.value;
                    if (secondsValue && secondsValue[0] == "0") {
                      const name = number ? `holeByHole.${number - 1}.seconds` : `${rowName}.seconds`;
                      setValue(name, null);
                      handleInputChange("seconds");
                    }
                  }
                }}
              />
              {timeToPar && <small className="text-nowrap">{!item.number && (timeToPar || "ND")}</small>}
            </div>
            {item.number && <TimeToParIcons timeToPar={calculateTimeToPar()} />}
          </div>
        </td>
      )}
    </tr>
  );
}

export default ScorecardRow;
