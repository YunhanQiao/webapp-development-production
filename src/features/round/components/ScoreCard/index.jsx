import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";

import { Button, Modal, Table, ToggleButton } from "react-bootstrap";
import ScorecardRow from "./components/ScorecardRow";

import { userSelector } from "features/user";
import { scorecardDataSelector, setScorecardData } from "features/round";

import { getScoreCardSchema, scoreCardSchema } from "./schema";
import { get } from "lodash";
import { getHoleRange } from "../../utils/";

const ScoreCardModal = ({
  onClose,
  holeByHoleData,
  onSubmit,
  totalData,
  selectedCourseName = "",
  teeName,
  holeType,
}) => {
  const dispatch = useDispatch();
  const { user } = useSelector(userSelector);
  const scoreCardData = useSelector(scorecardDataSelector);

  const userPreferredUnits = user.preferences?.preferredUnits || "imperial";
  const userGender = user?.personalInfo?.parGender;
  const isMetric = userPreferredUnits === "metric";
  const showHoleTimes =
    holeByHoleData.in.minutes > 0 ||
    holeByHoleData.in.seconds > 0 ||
    holeByHoleData.out.minutes > 0 ||
    holeByHoleData.out.seconds > 0;

  const units = useMemo(() => (isMetric ? "Meters" : "Yards"), [userPreferredUnits]);

  const [startIndex, endIndex, selectionType] = useMemo(() => getHoleRange(holeType), [holeType]);

  const scoreCardSchema = useMemo(() => {
    return getScoreCardSchema(startIndex, endIndex);
  }, [holeType]);

  const methods = useForm({
    defaultValues: scoreCardData || {
      ...holeByHoleData,
      total: Object.assign(holeByHoleData.total, totalData),
      showHoleTimes,
    },
    reValidateMode: "onBlur",
    // resolver: yupResolver(scoreCardSchema),
    resolver: yupResolver(scoreCardSchema),
  });

  const handleClose = () => {
    dispatch(setScorecardData(methods.getValues()));
    onClose();
  };

  const handleFormSubmit = data => {
    onSubmit(data);
    handleClose();
  };

  const getVisibilityState = (index, type) => {
    if (index >= startIndex && index < endIndex) {
      return true;
    }
    if (type === selectionType.toLowerCase() || type == "total" || selectionType.toLowerCase() == "total") return true;
    return false;
  };

  const watchedHoleByHole = methods.watch("holeByHole");

  useEffect(() => {
    const someHoleTimesPresent = watchedHoleByHole
      .slice(startIndex, endIndex)
      .some(elem => Number.isFinite(elem.minutes) || Number.isFinite(elem.seconds));
    const allHoleTimesPresent = watchedHoleByHole
      .slice(startIndex, endIndex)
      .every(elem => Number.isFinite(elem.minutes) && Number.isFinite(elem.seconds));
    if (someHoleTimesPresent && !allHoleTimesPresent) {
      methods.setError("globalTime", {
        type: "manual",
        message: "Please enter both minutes and seconds for all holes",
      });
    } else {
      methods.clearErrors("globalTime");
    }
  }, [watchedHoleByHole, JSON.stringify(watchedHoleByHole)]);

  return (
    <FormProvider {...methods}>
      <Modal show size="xl" scrollable onHide={handleClose} backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>Round Scorecard</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-2">
            <h5>{selectedCourseName.split(",")[0] + " ( " + teeName + " )"}</h5>
            <Controller
              name="showHoleTimes"
              control={methods.control}
              render={({ field: { value: checked, onChange, ref } }) => (
                <ToggleButton
                  id="toggle-check"
                  ref={ref}
                  size="sm"
                  variant="outline-dark"
                  checked={checked}
                  value={checked}
                  onClick={() => onChange(!checked)}
                >
                  {checked ? "<< Hide Hole Times" : "Show Hole Times >>"}
                </ToggleButton>
              )}
            />
          </div>
          <Table size="sm" responsive striped bordered id="scorecard">
            <thead className="sticky-top">
              <tr>
                <th className="text-center" scope="col">
                  Hole
                </th>
                <th className="text-center" scope="col">
                  RUN DIST ({units})
                </th>
                <th className="text-center" scope="col">
                  TRANS DIST ({units})
                </th>
                <th className="text-center" scope="col">
                  GOLF DIST ({units})
                </th>
                <th className="text-center" scope="col">
                  STROKE PAR
                </th>
                <th className="text-center" scope="col">
                  TIME PAR
                </th>
                <th className="text-center" scope="col">
                  STR
                </th>
                {methods.watch("showHoleTimes") && (
                  <th className="text-center" scope="col">
                    TIME (MM:SS)
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="table-group-divider">
              {holeByHoleData.holeByHole.map((item, key) => (
                <>
                  <ScorecardRow
                    key={key}
                    item={item}
                    parGender={userGender}
                    selectionType={selectionType}
                    getVisibilityState={getVisibilityState}
                  />
                  {item?.number == 9 && (
                    <ScorecardRow
                      rowName="out"
                      item={holeByHoleData.out}
                      parGender={userGender}
                      isMetric={isMetric}
                      selectionType={selectionType}
                      getVisibilityState={getVisibilityState}
                    />
                  )}
                  {item?.number == 18 && (
                    <ScorecardRow
                      rowName="in"
                      item={holeByHoleData.in}
                      parGender={userGender}
                      isMetric={isMetric}
                      selectionType={selectionType}
                      getVisibilityState={getVisibilityState}
                    />
                  )}
                </>
              ))}
              <ScorecardRow
                rowName="total"
                item={holeByHoleData.total}
                parGender={userGender}
                isMetric={isMetric}
                selectionType={selectionType}
                getVisibilityState={getVisibilityState}
              />
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" className="scorecard-cancel" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            className="scorecard-save"
            onClick={methods.handleSubmit(handleFormSubmit, inv => console.log(inv))}
            disabled={!methods.formState.isValid || methods.formState.errors.globalTime}
          >
            Save Scorecard
          </Button>
        </Modal.Footer>
      </Modal>
    </FormProvider>
  );
};

export default ScoreCardModal;
