import { useState } from "react";
import { Controller } from "react-hook-form";
import { capitalize, isEmpty, set } from "lodash";
import { OverlayTrigger, Tooltip } from "react-bootstrap";

import useLogRound from "../hooks/functions";
import { validationErrorMap } from "../utils";
import { format } from "date-fns/format";

import Navbar from "features/shared/Navbar/Navbar";
import ModalDialog from "features/shared/ModalDialog";
import ErrorMessage from "features/shared/BaseFormComponents/ErrorMessage";
import AddCourseAutocomplete from "components/AddCourseAutocomplete";
import { DistanceInput } from "../components/FormComponents/DistanceInput";
import ScoreCardModal from "../components/ScoreCard";

import "../../../styles/features/round/style.css";

const LogRound = () => {
  const {
    selectedCourse,
    fullyMappedTees,
    selectedTeeId,
    selectedTee,
    isNew,
    methods,
    onSubmit,
    sgsHandler,
    distanceUnit,
    setDistanceUnit,
    closeLogPage,
    pace,
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

    // Additional imports
    seconds,
    onError,
    onCourseDelete,
    isScorecardEnabled,
    timeFieldActive,
    noOfficialScore,
  } = useLogRound();
  const {
    control,
    handleSubmit,
    watch,
    register,
    getValues,
    setValue,
    formState: { errors },
  } = methods;

  const [isScoreCardModalOpen, setIsScoreCardModalOpen] = useState(false);
  const [deleteDialogId, setDeleteDialogId] = useState(null);

  const isTimeToParNegative = timeToPar < 0;

  const showScorecard = () => setIsScoreCardModalOpen(true);

  const hideScorecard = () => setIsScoreCardModalOpen(false);

  return (
    <>
      <Navbar />
      <div
        id="roundsModeDialog"
        className="mode-page action-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="roundFormHeader"
        tabIndex="0"
      >
        <h1 id="roundFormHeader" className="mode-page-header">
          {isNew ? "Add" : "Edit"} Round
        </h1>
        {!isEmpty(errors) && (
          <p id="roundErrorBox" className="alert alert-danger centered">
            {Object.keys(errors).map(field => {
              const id = "round" + capitalize(field);
              return (
                <ErrorMessage key={id} id={id}>
                  {validationErrorMap[id]}
                </ErrorMessage>
              );
            })}
          </p>
        )}
        <form id="logRoundForm" className="centered" noValidate onSubmit={handleSubmit(onSubmit, onError)}>
          <div className="mb-3">
            <label htmlFor="roundDate" className="form-label">
              Date:
              <input
                id="roundDate"
                className="form-control centered"
                type="date"
                aria-describedby="roundDateDescr"
                {...register("date", {
                  required: true,
                })}
              />
            </label>
            <div id="roundDateDescr" className="form-text">
              Enter a valid date
            </div>
          </div>
          <div className="d-flex flex-row flex-wrap justify-content-center">
            <div className="course-container">
              <label htmlFor="roundCourse" className="form-label">
                Course:
                <Controller
                  name="course"
                  control={control}
                  rules={{ required: true }}
                  render={({ field: { value, ref, onChange, ...rest } }) => (
                    <AddCourseAutocomplete
                      {...rest}
                      ref={ref}
                      value={value}
                      onChange={item => onChange(item?.name || "")}
                      fetchCourseDetailsCallBack={fetchCourseDetailsCallBack}
                      onCourseDelete={onCourseDelete}
                    />
                  )}
                />
                <div className="form-text mb-2">Choose a course from the dropdown list</div>
              </label>
            </div>
            <div className="tee-container">
              <label htmlFor="roundTee">
                Tee:
                <select
                  className="form-control centered roundTee"
                  disabled={fullyMappedTees.length === 0}
                  value={selectedTeeId || ""}
                  {...register("tee")}
                >
                  <option value="">No Data</option>
                  {fullyMappedTees.map(tee => (
                    <option key={tee._id} value={tee._id}>
                      {tee.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="roundType">
              Type:
              <select name="roundType" id="roundType" className="form-control centered" {...register("roundType")}>
                <option value="Practice">Practice</option>
                <option value="Tournament">Tournament</option>
              </select>
            </label>
          </div>
          <div className="mb-3">
            <label htmlFor="roundHoles">
              Holes:
              <select
                name="roundHoles"
                id="roundHoles"
                className="form-control centered"
                {...register("numHoles")}
                defaultValue="18"
                onChange={e => {
                  const newValue = e.target.value;
                  const holeByHoleChecked = getValues("scorecardEnable");
                  if (holeByHoleChecked) {
                    const userConfirmed = window.confirm(`Changing this will reset the scorecard data. Continue?`);
                    if (userConfirmed) {
                      setValue("numHoles", newValue);
                      setValue("scorecardEnable", false);
                      setValue("holesChanged", true);
                    } else {
                      e.target.value = getValues("numHoles");
                    }
                  } else {
                    setValue("numHoles", newValue);
                  }
                }}
              >
                {/* <option value="9">9</option> */}
                <option value="Front-9">Front-9</option>
                <option value="Back-9">Back-9</option>
                <option value="18">18</option>
              </select>
            </label>
          </div>

          {selectedTee && (
            <div className="d-flex flex-column align-items-center mb-3">
              <div className="d-flex align-items-center">
                <input
                  type="checkbox"
                  className="custom-control-input me-1"
                  id="scorecardButtonEnable"
                  {...register("scorecardEnable", {
                    disabled: !selectedTee,
                    onChange: e => {
                      const holeByHoleChecked = getValues("scorecardEnable");
                      if (!holeByHoleChecked) {
                        const userConfirmed = window.confirm(`Changing this will reset the scorecard data. Continue?`);
                        if (userConfirmed) {
                          setValue("scorecardEnable", false);
                          setValue("clearScorecard", true);
                        } else {
                          setValue("scorecardEnable", true);
                          setValue("clearScorecard", false);
                        }
                      } else {
                        setValue("holesChanged", true);
                        setValue("noOfficialScore", false);
                      }
                    },
                  })}
                />
                <label className="custom-control-label me-2" htmlFor="scorecardButtonEnable">
                  Hole-By-Hole Data
                </label>
              </div>
              <button
                type="button"
                className="btn btn-outline-dark mt-2"
                disabled={!isScorecardEnabled}
                onClick={showScorecard}
              >
                <span id="scoreCardDetails" className="fas fa-table" />
              </button>
            </div>
          )}

          {isScoreCardModalOpen && (
            <ScoreCardModal
              onClose={hideScorecard}
              selectedCourseName={selectedCourse?.name}
              holeByHoleData={holeByHoleData}
              teeName={selectedTee?.name}
              totalData={{
                strokes: getValues("strokes"),
                seconds: getValues("seconds"),
                minutes: getValues("minutes"),
              }}
              selectedTee={selectedTee}
              onSubmit={scoreCardSubmitHandler}
              holeType={getValues("numHoles")}
            />
          )}

          <div className="mb-3">
            <label htmlFor="roundStrokes">
              Strokes:
              <input
                id="roundStrokes"
                className="form-control centered"
                type="number"
                size="3"
                min="0"
                max="200"
                disabled={isScorecardEnabled || noOfficialScore}
                aria-describedby="roundStrokesDescr"
                {...register("strokes", {
                  onChange: sgsHandler,
                  valueAsNumber: true,
                  validate: value => {
                    if (noOfficialScore) return value === 0;
                    else return value >= 9 && value <= 200;
                  },
                  min: 0,
                  max: 200,
                  required: true,
                })}
              />
            </label>
          </div>

          <div className="d-flex align-items-center justify-content-center mb-2">
            <input
              type="checkbox"
              className="custom-control-input me-1"
              id="scorecardButtonEnable"
              {...register("noOfficialScore")}
              onChange={e => {
                const checked = e.target.checked;
                const holeByHoleChecked = getValues("scorecardEnable");
                if (checked && holeByHoleChecked) {
                  const userConfirmed = window.confirm(`Changing this will reset the scorecard data. Continue?`);
                  if (userConfirmed) {
                    setValue("scorecardEnable", false);
                    // setValue("holesChanged", true);
                    setValue("clearScorecard", true);
                    setValue("strokes", 0);
                    setValue("noOfficialScore", true);
                  } else {
                    setValue("noOfficialScore", false);
                  }
                } else {
                  setValue("noOfficialScore", checked);
                  setValue("strokes", 60);
                }
                if (checked) {
                  setValue("strokes", 0);
                }
              }}
            />
            <label className="custom-control-label me-2" htmlFor="scorecardButtonEnable">
              No Official Score
            </label>
          </div>
          <div id="roundStrokesDescr" className="form-text mb-3">
            Enter a strokes value between 9 and 200
          </div>
          {selectedTeeId && (
            <div className="centered">
              <h6 style={{ color: strokesToPar < 0 ? "red" : "inherit" }}>
                Strokes to par: {strokesToPar === 0 ? "E" : strokesToPar}
              </h6>
            </div>
          )}
          <div className="mb-3">
            <label htmlFor="roundTime">
              Time:
              <br />
              <input
                id="roundMinutes"
                type="number"
                size="3"
                aria-describedby="roundTimeDescr"
                min="10"
                max="400"
                className="txt-align-right"
                disabled={!timeFieldActive}
                {...register("minutes", {
                  onBlur: timeHandler,
                  onChange: sgsHandler,
                  valueAsNumber: true,
                  min: 10,
                  max: 400,
                  required: true,
                })}
              />
              :
              <input
                id="roundSeconds"
                type="number"
                size="2"
                min="0"
                max="59"
                aria-describedby="roundTimeDescr"
                value={seconds.toString().padStart(2, "0")}
                disabled={!timeFieldActive}
                {...register("seconds", {
                  onChange: e => {
                    secondsFormatHandler(e);
                    sgsHandler();
                  },
                  onBlur: timeHandler,
                  min: 0,
                  max: 59,
                  required: true,
                })}
              />
            </label>
            <div id="roundTimeDescr" className="form-text">
              Enter a minutes value between 10 and 400, and a seconds value between 0 and 59
            </div>
          </div>
          {selectedTeeId && (
            <div className="centered mb-3">
              <h6 style={{ color: isTimeToParNegative ? "red" : "inherit" }}>
                Time to par: {isTimeToParNegative && "-"}
                {timeToPar ? format(new Date(Math.abs(timeToPar)), "mm:ss") : "E"}
              </h6>
            </div>
          )}
          {!Boolean(noOfficialScore) && (
            <>
              <div className="mb-3">
                <label htmlFor="roundSGS">
                  Speedgolf Score:
                  <br />
                  <input
                    id="roundSGS"
                    className="form-control centered"
                    type="text"
                    size="6"
                    disabled
                    {...register("SGS")}
                  />
                </label>
              </div>
              {selectedTeeId && (
                <div className="centered mb-3">
                  <h6 style={{ color: sgsToParNegative ? "red" : "inherit" }}>
                    SGS to par: {sgsToPar.replace("(", "").replace(")", "")}
                    {/* {sgsToPar ? format(new Date(Math.abs(timeToPar)), "mm:ss") : "EVEN"} */}
                  </h6>
                </div>
              )}
            </>
          )}
          <DistanceInput methods={methods} distanceUnit={distanceUnit} setDistanceUnit={setDistanceUnit} />
          {pace && (
            <div className="mb-3">
              <h6 className="centered">Pace: {pace}</h6>
            </div>
          )}
          <div className="mb-3">
            <label htmlFor="roundNotes">
              Notes:
              <br />
              <textarea
                id="roundNotes"
                className="form-control"
                aria-describedby="roundNotesDescr"
                rows="6"
                cols="75"
                {...register("notes")}
              />
            </label>
            <div id="roundNotesDescr" className="form-text">
              Enter optional round notes
            </div>
          </div>
          <div className="container mt-3 mb-3">
            <div className="form-group text-center">
              <div className="custom-control custom-checkbox">
                <input
                  id="keepPrivate"
                  type="checkbox"
                  className="custom-control-input me-1"
                  {...register("keepPrivate")}
                />
                <label className="custom-control-label" htmlFor="keepPrivate">
                  Keep this round private
                </label>
              </div>
            </div>

            <OverlayTrigger
              placement="top"
              overlay={props => (
                <Tooltip {...props} className="d-flex flex-column">
                  By default, the rounds you log are shared with your buddies. You may also choose to share them with
                  all SpeedScore users through the Account & Profile page. Check this box if you do not wish to share
                  this round with your buddies (or with the public, if you have chosen that option).
                </Tooltip>
              )}
            >
              <span className="text-primary text-decoration-underline">What does this mean?</span>
            </OverlayTrigger>
          </div>

          <div className="mode-page-btn-container">
            <button id="roundFormSubmitBtn" className="mode-page-btn action-dialog action-button" type="submit">
              <span id="roundFormSubmitBtnIcon" className={`fa ${isNew ? "fa-save" : "fa-edit"}`} />
              <span id="roundFormSubmitBtnLabel">
                &nbsp;
                {isNew ? "Add" : "Update"} Round
              </span>
            </button>
            {roundId && (
              <>
                <button
                  className="btn btn-danger delete-round-btn"
                  type="button"
                  onClick={() => setDeleteDialogId(roundId)}
                >
                  Delete Round
                </button>
                <ModalDialog
                  isOpen={deleteDialogId}
                  title="Delete Round?"
                  body="Do you really want to delete that round?"
                  actionBtnText="Yes, Delete Round"
                  cancelBtnText="No, Cancel"
                  close={() => setDeleteDialogId(null)}
                  onSubmit={() => deleteRoundHandler(deleteDialogId)}
                />
              </>
            )}
            <button
              id="roundsModeLogCancelBtn"
              className="mode-page-btn-cancel action-dialog cancel-button"
              type="button"
              onClick={closeLogPage}
            >
              <span className="fa fa-window-close" />
              &nbsp;Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default LogRound;
