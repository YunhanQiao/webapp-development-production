import { useEffect, useMemo, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { format } from "date-fns/format";
import { useCallback } from "react";

import {
  roundsSelector,
  logRoundAction,
  updateRoundAction,
  deleteRoundAction,
  setScorecardData,
  setOuterScorecardTime,
  scorecardDataSelector,
} from "features/round";
import { coursesSelector, fetchCourseById } from "features/course";
import { userSelector } from "features/user";

import {
  convertFeetToMiles,
  convertFeetToKilometers,
  SECONDS_IN_MINUTE,
  MS_IN_SECOND,
  computeFullyMappedTees,
  convertMilesToFeet,
  convertKmToMiles,
  prepareHoleData,
  getSecondsFormatHandler,
  computeSGSToPar,
} from "../utils";
// import { getHoleByHoleData, getHoleRange, holeDataAdapterByGender, mergeHoleData } from "../components/ScoreCard/utils";
import { getHoleByHoleData, holeDataAdapterByGender, mergeHoleData } from "../components/ScoreCard/utils";
import { getHoleRange } from "../utils";
import { resetInnerTimeInScorecard, resetUserValuesInScorecard, updateScorecardData } from "../roundSlice";
import { isSGSToParNegative } from "../utils/utils";

const useLogRound = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const user = useSelector(userSelector);
  const rounds = useSelector(roundsSelector);
  const courses = useSelector(coursesSelector);
  const scorecardData = useSelector(scorecardDataSelector);

  const { index: roundId } = useParams();
  const isNew = roundId == null;
  const round = rounds.find(({ _id }) => _id == roundId);
  const [distanceUnit, setDistanceUnit] = useState(
    user?.user?.preferences?.preferredUnits == "imperial" ? "miles" : "km",
  );
  const userGender = user?.user?.personalInfo?.parGender;

  const resetScoreCard = () => dispatch(setScorecardData(null));
  const resetScorecardTime = () => dispatch(resetInnerTimeInScorecard());

  const methods = useForm({
    defaultValues: round
      ? {
          ...round,
          noOfficialScore: round.noOfficialScore || false,
          strokes: round.strokes,
          distance:
            distanceUnit === "miles"
              ? convertFeetToMiles(round.distance)?.toFixed(2)
              : convertFeetToKilometers(round.distance),
          minutes: Math.round(round.time / SECONDS_IN_MINUTE),
          seconds: (round.time % SECONDS_IN_MINUTE).toString().padStart(2, "0"),
          date: format(new Date(round.date), "yyyy-MM-dd"),
          course: round.courseId.shortName,
          SGS: (() => {
            const strokes = round.strokes;
            const minutes = Math.floor(round.time / SECONDS_IN_MINUTE);
            const seconds = (round.time % SECONDS_IN_MINUTE).toString().padStart(2, "0");
            return strokes + minutes + ":" + seconds;
          })(),
          scorecardEnable: round.holeData.length > 0,
        }
      : {
          course: "",
          date: format(new Date(), "yyyy-MM-dd"),
          type: "Practice",
          holes: 18,
          strokes: 80,
          minutes: 60,
          seconds: "00",
          time: 3600,
          SGS: "140:00",
          holeByHole: [],
          tee: "",
          keepPrivate: false,
          scorecardEnable: false,
          noOfficialScore: false,
        },
    reValidateMode: "onSubmit",
    shouldFocusError: false, // this is required to prevent onBlur trigger on seconds, minutes which resets scorecard
  });

  const { setValue, getValues, watch } = methods;

  const selectedCourseName = watch("course");
  const selectedTeeId = watch("tee");
  const minutes = watch("minutes");
  const seconds = watch("seconds");
  const strokes = watch("strokes");
  const distance = watch("distance");
  const holeType = watch("numHoles");
  const isScorecardEnabled = watch("scorecardEnable");
  const noOfficialScore = watch("noOfficialScore");

  // const selectedCourse = useMemo(
  //   () => courses.find(({ shortName }) => shortName === selectedCourseName),
  //   [selectedCourseName, courses],
  // );
  const selectedCourse = useMemo(() => {
    return courses.find(({ shortName }) => shortName === selectedCourseName);
  }, [courses, selectedCourseName]);

  const [fullyMappedTees, setFullyMappedTees] = useState(computeFullyMappedTees(selectedCourse));

  /**
   * Additional methods added by UMAKANTH - To fix the issues with SGS
   * Fetch course by ID returns complete information about that course including tee information.
   * Fetch all courses will only return course information without tee information. (insted we keep tee id in place of tees)
   */

  async function fetchCourseDetailsCallBack() {
    if (!round || !round.courseId) return;
    if (!isNew) {
      await dispatch(fetchCourseById(round.courseId.id), navigate);
    }
  }

  // useEffect(() => {
  //   if (selectedCourse?.id) {
  //     dispatch(fetchCourseById(selectedCourse.id), navigate).then(course =>
  //       setFullyMappedTees(computeFullyMappedTees(course)),
  //     );
  //     resetScoreCard();
  //   }
  // }, [selectedCourse?.id]);
  useEffect(() => {
    if (selectedCourse?.id) {
      setFullyMappedTees(computeFullyMappedTees(selectedCourse));
      resetScoreCard();
    }
  }, [selectedCourse?.id, selectedCourse?.tees]);

  useEffect(() => {
    sgsHandler();
  }, [noOfficialScore]);

  const pace = useMemo(() => {
    if (!minutes || !seconds || !distance || !distanceUnit) return null;

    const totalMinutes = parseInt(minutes) + parseInt(seconds) / SECONDS_IN_MINUTE;

    const pace = totalMinutes / parseFloat(distance);

    const paceMinutes = Math.floor(pace);
    const paceSeconds = Math.round((pace - paceMinutes) * SECONDS_IN_MINUTE);

    const unitLabel = distanceUnit === "km" ? "Min/Km" : "Min/Mile";

    return `${paceMinutes}:${paceSeconds.toString().padStart(2, "0")} ${unitLabel}`;
  }, [minutes, seconds, distance, distanceUnit]);

  const getActiveTeeId = (fullyMappedTees, teeIdFromRound) => {
    const result = fullyMappedTees.find(tee => tee._id == teeIdFromRound);
    if (!result) return fullyMappedTees[0]._id;
    return result._id;
  };

  useEffect(() => {
    const teeIdFromRound = round?.teeId;
    // const activeTeeId = fullyMappedTees.length > 0 ? fullyMappedTees[0]._id : null;
    const activeTeeId = fullyMappedTees.length > 0 ? getActiveTeeId(fullyMappedTees, teeIdFromRound) : null;
    setValue("tee", activeTeeId);
  }, [fullyMappedTees]);

  const selectedTee = useMemo(() => {
    resetScoreCard();
    return fullyMappedTees.find(({ _id }) => _id === selectedTeeId);
  }, [selectedTeeId]);

  const holeByHoleData = useMemo(() => {
    if (selectedTee) {
      const holesChanged = getValues("holesChanged") || getValues("clearScorecard");
      // if holes are changed, then no need to check holetype.. set null to all strokes, minutes and seconds
      const holeData = holeDataAdapterByGender(userGender)(selectedTee?.holes, round?.holeData, holeType, holesChanged);
      const result = getHoleByHoleData(mergeHoleData(selectedTee.holes, holeData), holeType, userGender);
      // console.log("Hole-by-hole data: ", result);
      setValue("holesChanged", false);
      if (isScorecardEnabled) {
        setValue("clearScorecard", false);
      }
      return result;
    }
    return null;
    // no need to add holeType as dependency here ? Maybe its needed.
  }, [selectedTeeId, holeType, isScorecardEnabled]);

  const updateScoreCardData = useMemo(() => {
    // update scorecard data
    // dispatch(updateScorecardData(getHoleRange(holeType)));
    // resetScoreCard();
    dispatch(resetUserValuesInScorecard(getHoleRange(holeType)));
  }, [holeType, isScorecardEnabled]);

  const timeFieldActive = useMemo(() => {
    if (!isScorecardEnabled) return true;
    const holeData = scorecardData?.holeByHole || holeByHoleData?.holeByHole || null;
    if (!holeData) return true;
    return !holeData.some(hole => Number.isFinite(hole.minutes) || Number.isFinite(hole.seconds));
  }, [isScorecardEnabled, scorecardData, holeByHoleData]);

  const sgsHandler = () => {
    const [strokes, minutes, seconds] = getValues(["strokes", "minutes", "seconds"]);
    let formattedSeconds = seconds.toString().padStart(2, "0");
    if (formattedSeconds.length > 2) {
      formattedSeconds = formattedSeconds.slice(-2);
    }
    setValue("SGS", strokes + minutes + ":" + formattedSeconds);
    // resetScoreCard();
    resetScorecardTime();
  };

  const timeToPar = useMemo(() => {
    if (holeByHoleData) {
      const timeInMs = ((minutes || 0) * SECONDS_IN_MINUTE + Number(seconds)) * MS_IN_SECOND;
      const timeInMsToPar = holeByHoleData.total[`${userGender}TimePar`] * MS_IN_SECOND;

      return timeInMs - timeInMsToPar;
    }

    return 0;
  }, [minutes, seconds, selectedTeeId]);

  const strokesToPar = useMemo(() => {
    if (holeByHoleData) {
      return strokes - holeByHoleData.total[`${userGender}StrokePar`];
    }

    return 0;
  }, [strokes, selectedTeeId]);

  const sgsToPar = useMemo(() => {
    return computeSGSToPar(timeToPar / MS_IN_SECOND, strokesToPar);
  }, [timeToPar, strokesToPar]);

  const sgsToParNegative = useMemo(() => {
    return isSGSToParNegative(timeToPar / MS_IN_SECOND, strokesToPar);
  }, [timeToPar, strokesToPar]);

  const timeHandler = () => {
    const [minutes, seconds] = getValues(["minutes", "seconds"]);
    // This is the case where we want to update the time field is
    // editable if the holes are not complete in scorecard
    // But that is not the case. So, we dont have to worry about dispatch
    dispatch(
      setOuterScorecardTime({
        minutes,
        seconds,
      }),
    );
  };

  const secondsFormatHandler = getSecondsFormatHandler(setValue, "seconds");

  const deleteRoundHandler = id => dispatch(deleteRoundAction(id, navigate));

  const closeLogPage = () => navigate("/rounds");

  const onSubmit = data => {
    const distance = convertMilesToFeet(distanceUnit === "miles" ? +data.distance : convertKmToMiles(+data.distance));
    const holeData = prepareHoleData(
      scorecardData?.holeByHole || holeByHoleData?.holeByHole || null,
      userGender,
      holeType,
    );
    const roundData = {
      ...data,
      distance,
      holeData: getValues("scorecardEnable") ? holeData : [],
      timeToPar,
      strokesToPar,
      tee: selectedTee,
    };

    if (isNew) {
      dispatch(logRoundAction(roundData, navigate)).then(resetScoreCard);
    } else {
      dispatch(updateRoundAction(roundId, roundData, navigate)).then(resetScoreCard);
    }
  };

  const onError = errors => {
    console.log("Validation errors:", errors);
    window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll to top on error
  };

  const scoreCardSubmitHandler = ({ total }) => {
    setValue("strokes", total.strokes);

    if (Number.isFinite(total.seconds)) {
      setValue("seconds", total.seconds);
    }

    if (Number.isFinite(total.minutes)) {
      setValue("minutes", total.minutes);
    }
  };

  const onCourseDelete = (e, onChange, setAutocomplete, setRemember) => {
    if (e.key === "Backspace" || e.key === "Delete") {
      e.preventDefault();
      // return;
      const scorecardEnabled = getValues("scorecardEnable");
      if (scorecardEnabled) {
        const userConfirmed = window.confirm(`Changing this will reset the scorecard data. Continue?`);
        if (userConfirmed) {
          // e.preventDefault();
          onChange("");
          // e.target.value = "";
          setRemember(true);
          setAutocomplete(previousState => {
            return {
              ...previousState,
              boxContents: previousState.boxContents.slice(0, -1),
            };
          });
          setFullyMappedTees([]);
          resetScoreCard();
          setValue("seconds", 0);
          setValue("minutes", 60);
          setValue("strokes", 80);
          if (!scorecardEnabled) return;
          setValue("scorecardEnable", false);
          setValue("holesChanged", true);
        } else {
          // e.preventDefault();
          // handleAutocompleteChange(e);
          return;
          setAutocomplete(previousState => {
            return {
              ...previousState,
              boxContents: previousState.boxContents,
            };
          });
        }
      } else {
        const value = (e?.target?.value ?? "").slice(0, -1);
        // onChange("");
        // onChange(value);
        setAutocomplete(previousState => {
          return {
            ...previousState,
            boxContents: previousState.boxContents.slice(0, -1),
          };
        });
        setFullyMappedTees([]);
        resetScoreCard();
      }
    }
  };

  return {
    selectedCourse,
    fullyMappedTees,
    selectedTeeId,
    selectedTee,
    isNew,
    methods,
    onSubmit,
    sgsHandler,
    distanceUnit,
    pace,
    setDistanceUnit,
    closeLogPage,
    holeByHoleData,
    timeHandler,
    deleteRoundHandler,
    roundId,
    strokesToPar,
    timeToPar,
    sgsToPar,
    sgsToParNegative,
    scoreCardSubmitHandler,
    secondsFormatHandler,
    fetchCourseDetailsCallBack,
    seconds,
    onError,
    onCourseDelete,
    isScorecardEnabled,
    timeFieldActive,
    noOfficialScore,
  };
};

export default useLogRound;
