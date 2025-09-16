import { useEffect, useState } from "react";

import { useForm, useFormContext } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { divisionSchema } from "../../../tournamentSchema";

import { Form, Row, Modal, Button, Col } from "react-bootstrap";
import DivisionRound from "./DivisionRound";
import ErrorMessage from "../../../../shared/BaseFormComponents/ErrorMessage";

import isEmpty from "lodash/isEmpty";
import { useSelector, useDispatch } from "react-redux";
import {
  activeTournamentSelector,
  divisionsWithDatesSelector,
  wizardStateSelector,
} from "../../../competitionSelectors";
import { updateDivisionRoundOffset, updateDivisionOptions } from "../../../competitionSlice";
import { format } from "date-fns/format";
import { uuidv4 } from "features/competition/competitionServices";
import { calculateDivisionRoundOptions } from "../../../../../utils/dateOffsetUtils";
// import { watch } from "fs";

const AddDivisionModal = ({ division, handleUpdate, handleClose }) => {
  const dispatch = useDispatch();
  const activeTournament = useSelector(activeTournamentSelector);
  const divisionsWithDates = useSelector(divisionsWithDatesSelector);
  const wizardState = useSelector(wizardStateSelector);

  const currency = activeTournament?.regPayment?.currencyType;
  const courses = activeTournament?.courses;

  // Get dates from wizard state (single source of truth)
  const wizardBasicInfo = wizardState?.basicInfo;
  const parentFormContext = useFormContext();
  const parentFormDates = parentFormContext
    ? {
        startDate: parentFormContext.watch?.("startDate"),
        endDate: parentFormContext.watch?.("endDate"),
      }
    : {};

  // Priority: wizard state > form context > activeTournament
  const startDate =
    wizardBasicInfo?.startDate ||
    parentFormDates.startDate ||
    activeTournament?.startDate ||
    activeTournament?.basicInfo?.startDate;
  const endDate =
    wizardBasicInfo?.endDate ||
    parentFormDates.endDate ||
    activeTournament?.endDate ||
    activeTournament?.basicInfo?.endDate;

  // Timezone-neutral date parsing utility that handles ISO strings correctly
  const parseLocalDate = dateInput => {
    if (!dateInput) return null;
    if (dateInput instanceof Date) return dateInput;
    if (typeof dateInput === "string") {
      // Extract just the date part from ISO strings (YYYY-MM-DDTHH:mm:ss.sssZ -> YYYY-MM-DD)
      const dateOnly = dateInput.split("T")[0];

      // Handle YYYY-MM-DD format as local timezone
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
        const [year, month, day] = dateOnly.split("-").map(Number);
        return new Date(year, month - 1, day); // month is 0-indexed
      }

      // Handle other formats
      return new Date(dateInput);
    }
    return new Date(dateInput);
  };

  const minDate = startDate ? format(parseLocalDate(startDate), "yyyy-MM-dd") : undefined;
  const maxDate = endDate ? format(parseLocalDate(endDate), "yyyy-MM-dd") : undefined;
  const formattedDate = date => (date ? format(new Date(date), "yyyy-MM-dd") : undefined);

  // Use computed divisions (just-in-time calculation) instead of legacy activeTournament.divisions
  const currentDivision = division
    ? divisionsWithDates.find(
        d => d.id === division.id || d.clientId === division.clientId || d._id === division._id,
      ) || division // Fallback to prop if not found in computed divisions
    : null;

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "Open",
      entryFee: 200,
      gender: "Male",
      minAge: 18,
      maxAge: 39,
      rounds: [], // Don't include division rounds in defaultValues - we'll set them manually
      // Include other division properties but exclude rounds to avoid conflicts
      ...(division
        ? {
            name: division.name,
            entryFee: division.entryFee,
            gender: division.gender,
            minAge: division.minAge,
            maxAge: division.maxAge,
            // Explicitly exclude rounds from defaultValues
          }
        : {}),
    },
    resolver: yupResolver(divisionSchema),
    reValidateMode: "onSubmit",
    shouldUnregister: true,
  });

  const [roundsState, setRoundsState] = useState([]);

  useEffect(() => {
    if (currentDivision && currentDivision.rounds && currentDivision.rounds.length > 0) {
      // CRITICAL: Use original division prop ID for wizard offset lookup, not currentDivision ID
      const originalDivisionId = division?.id || division?.clientId || division?._id;
      // Get division ID for looking up offsets - USE ORIGINAL DIVISION ID
      const divisionId = originalDivisionId;
      const wizardOffsets = wizardState?.divisionRoundOffsets?.[divisionId] || {};

      // Use the computed dates directly from wizard state (same as table uses)
      const initialRounds = currentDivision.rounds.map((round, idx) => {
        // CRITICAL FIX: Use wizard state offset if available, otherwise fall back to stored offset
        const dayOffset = wizardOffsets[idx] !== undefined ? wizardOffsets[idx] : round.dayOffset;

        return {
          ...round,
          clientId: round.clientId || round.id || uuidv4(),
          // Use the dayOffset from wizard state (this is the latest value)
          dayOffset,
          // Ensure date is always a string for Redux serialization
          date: round.date
            ? round.date instanceof Date
              ? format(round.date, "yyyy-MM-dd")
              : round.date
            : minDate || startDate,
        };
      });

      setRoundsState(initialRounds);

      initialRounds.forEach((round, idx) => {
        // 🎯 CRITICAL FIX: Calculate date from current tournament start + dayOffset
        let calculatedDate = minDate;
        if (round.dayOffset !== undefined && minDate) {
          const startDateObj = new Date(minDate);
          startDateObj.setDate(startDateObj.getDate() + round.dayOffset);
          calculatedDate = format(startDateObj, "yyyy-MM-dd");
        }

        const formattedRoundData = {
          ...round,
          // Use calculated date based on current tournament dates, not stored date
          date: calculatedDate,
          // Use the latest dayOffset from wizard state
          dayOffset: round.dayOffset,
        };

        setValue(`rounds[${idx}]`, formattedRoundData);
      });

      // Initialize dropdown options for this division in Redux
      const modalDivisionId = currentDivision.clientId || currentDivision.id || currentDivision._id;
      if (modalDivisionId && minDate && maxDate) {
        // Calculate dropdown options with constraints for all rounds
        const roundsWithOffsets = initialRounds.map((round, idx) => ({
          dayOffset: round.dayOffset ?? 0,
        }));

        const allRoundOptions = calculateDivisionRoundOptions(minDate, maxDate, roundsWithOffsets);

        // Update Redux with calculated options
        dispatch(
          updateDivisionOptions({
            divisionId: modalDivisionId,
            allRoundOptions,
          }),
        );
      }
    } else {
      // For new divisions, create rounds with proper default dates
      const initialRound = {
        clientId: uuidv4(),
        date: startDate ? format(parseLocalDate(startDate), "yyyy-MM-dd") : undefined,
        dayOffset: 0, // Default to day 1
      };
      setRoundsState([initialRound]);
      setValue("rounds[0]", initialRound);

      // Initialize dropdown options for new division
      if (minDate && maxDate) {
        const tempDivisionId = `temp-${Date.now()}`; // Temporary ID for new divisions

        const allRoundOptions = calculateDivisionRoundOptions(minDate, maxDate, [{ dayOffset: 0 }]);

        dispatch(
          updateDivisionOptions({
            divisionId: tempDivisionId,
            allRoundOptions,
          }),
        );
      }
    }
  }, [
    currentDivision,
    setValue,
    getValues,
    startDate,
    minDate,
    maxDate,
    dispatch,
    wizardState?.divisionRoundOffsets,
    division?.id,
    division?.clientId,
    division?._id,
  ]);

  const submit = values => {
    const processedRounds = values.rounds.map((round, index) => ({
      ...round,
      clientId: round.clientId || uuidv4(),
      // Ensure date is stored as string (YYYY-MM-DD format) for Redux serialization
      date: round.date instanceof Date ? format(round.date, "yyyy-MM-dd") : round.date,
      // CRITICAL: Ensure dayOffset is included in the processed data
      dayOffset: round.dayOffset !== undefined ? round.dayOffset : index,
    }));

    const processedValues = {
      ...values,
      rounds: processedRounds,
    };

    // Update wizard state with round offsets for this division
    const divisionId = division ? division.clientId || division.id : uuidv4();

    console.log("� DIVISION MODAL SUBMIT:", {
      divisionId,
      rounds: processedRounds.length,
      offsets: processedRounds.map(r => r.dayOffset),
    });

    processedRounds.forEach((round, index) => {
      if (round.dayOffset !== undefined) {
        dispatch(
          updateDivisionRoundOffset({
            divisionId: divisionId,
            roundIndex: index,
            dayOffset: round.dayOffset,
          }),
        );
      }
    });

    if (division) {
      handleUpdate(false)({
        ...processedValues,
        id: division.id,
        clientId: division.id,
      });
    } else {
      handleUpdate(true)({
        ...processedValues,
        id: divisionId,
        clientId: divisionId,
      });
    }
    handleClose();
  };

  const onError = (errs, event) => {
    // console.log("validation errors:", errs);
    // const currentFormValues = getValues();
    // console.log("current form values:", currentFormValues);
  };

  // const rounds = watch("rounds");
  // useEffect(() => {
  //   const currentFormValues = getValues();
  //   console.log("current form values:", currentFormValues);
  // }, [rounds])

  const addRound = () => {
    if (roundsState.length < 4) {
      const newRound = { clientId: uuidv4() };
      setRoundsState([...roundsState, newRound]);

      const currentRounds = getValues("rounds") || [];
      setValue("rounds", [...currentRounds, newRound]);

      // Update wizard state with default offset for new round
      const divisionId = currentDivision?.clientId || currentDivision?.id;
      if (divisionId) {
        const newRoundIndex = roundsState.length; // This will be the index of the new round
        dispatch(
          updateDivisionRoundOffset({
            divisionId: divisionId,
            roundIndex: newRoundIndex,
            dayOffset: newRoundIndex, // Default to round position
          }),
        );
      }
    }
  };

  const removeRound = roundClientId => {
    const updatedRounds = roundsState.filter(round => round.clientId !== roundClientId);
    setRoundsState(updatedRounds);

    const currentFormRounds = getValues("rounds");
    const updatedFormRounds = currentFormRounds.filter(round => round.clientId !== roundClientId);
    setValue("rounds", updatedFormRounds);

    // Update wizard state to remove offsets for removed rounds
    const divisionId = currentDivision?.clientId || currentDivision?.id;
    if (divisionId) {
      // Re-index remaining rounds in wizard state
      updatedFormRounds.forEach((round, index) => {
        if (round.dayOffset !== undefined) {
          dispatch(
            updateDivisionRoundOffset({
              divisionId: divisionId,
              roundIndex: index,
              dayOffset: round.dayOffset,
            }),
          );
        }
      });
    }
  };

  return (
    <Modal show onHide={handleClose} scrollable>
      <Modal.Header closeButton>
        <Modal.Title>{division ? "Edit" : "Add"} Division</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit(submit, onError)}>
          {!isEmpty(errors) && (
            <p id="updateDivisionErrorBox" className="alert alert-danger centered">
              {Object.entries(errors).map(([key, error]) => {
                if (key === "rounds") {
                  return (
                    <ErrorMessage key={key} id={key}>
                      {`Please fill in information for Round${error.length > 1 ? "s" : ""} ${error
                        .map((_, index) => index + 1)
                        .join(", ")
                        .replace(/,([^,]*)$/, " and$1")}`}
                    </ErrorMessage>
                  );
                }
                return (
                  <ErrorMessage key={key} id={key}>
                    {error.message}
                  </ErrorMessage>
                );
              })}
            </p>
          )}
          <Form.Group as={Row} controlId="name" className="mb-3">
            <Form.Label column sm="4" className="text-end">
              Division Name:
            </Form.Label>
            <Col sm="6">
              <Form.Control type="text" placeholder="Open" {...register("name")} />
            </Col>
          </Form.Group>
          <Form.Group as={Row} controlId="entryFee" className="mb-3">
            <Form.Label column sm="4" className="text-end">
              Entry Fee:
            </Form.Label>
            <Col sm="3">
              <Form.Control type="number" min="0" placeholder="200" {...register("entryFee")} />
            </Col>
            <Col sm="2" className="d-flex align-items-center">
              {currency}
            </Col>
          </Form.Group>
          <Form.Group as={Row} controlId="gender" className="mb-3">
            <Form.Label column sm="4" className="text-end">
              Gender:
            </Form.Label>
            <Col sm="4">
              <Form.Select {...register("gender")}>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="All">All</option>
              </Form.Select>
            </Col>
          </Form.Group>
          <Row className="mb-3 gap-3">
            <Col className="p-0">
              <Form.Group as={Row} controlId="minAge">
                <Form.Label column className="text-end">
                  Min Age:
                </Form.Label>
                <Col sm={4}>
                  <Form.Control type="number" min="0" placeholder="18" {...register("minAge")} />
                </Col>
              </Form.Group>
            </Col>
            <Col className="p-0">
              <Form.Group as={Row} controlId="maxAge">
                <Form.Label column sm={5}>
                  Max Age:
                </Form.Label>
                <Col sm={4}>
                  <Form.Control type="number" min={0} max={99} placeholder="39" {...register("maxAge")} />
                </Col>
              </Form.Group>
            </Col>
          </Row>
          <Form.Group as={Row} controlId="rounds" className="mb-3">
            <Form.Label column sm="4" className="text-end">
              Rounds in Division:
            </Form.Label>
            <Col sm="8" className="d-flex align-items-center">
              <div className="me-2">{roundsState.length}</div>
              <Button
                variant="primary"
                onClick={addRound}
                disabled={roundsState.length >= 4}
                className="d-flex align-items-center"
              >
                <i className="fa fa-solid fa-plus me-1" />
                Add Round
              </Button>
            </Col>
          </Form.Group>

          {roundsState.map((round, index) => (
            <DivisionRound
              key={round.clientId}
              position={index}
              roundId={round.clientId}
              divisionId={currentDivision?.clientId || currentDivision?._id || currentDivision?.id}
              register={register}
              control={control}
              courses={courses}
              minDate={minDate}
              maxDate={maxDate}
              getValues={getValues}
              setValue={setValue}
              watch={watch}
              errors={errors.rounds?.[index]}
              defaultDate={formattedDate(round.date)}
              defaultFormat={round.format}
              removeRound={roundsState.length > 1 ? removeRound : undefined}
            />
          ))}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={handleClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" onClick={handleSubmit(submit, onError)}>
          {division ? (
            <>
              <i className="fas" />
              &nbsp; Save
            </>
          ) : (
            <>
              <i className="fa" />
              &nbsp; Save
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AddDivisionModal;
