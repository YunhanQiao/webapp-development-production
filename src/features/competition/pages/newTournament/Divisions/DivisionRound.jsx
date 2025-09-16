import { useEffect, useMemo, useState, useCallback } from "react";
import { Col, Form, Row } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { Controller } from "react-hook-form";
import isEmpty from "lodash/isEmpty";
import ErrorMessage from "../../../../shared/BaseFormComponents/ErrorMessage";
import { fetchTeesets } from "features/competition/competitionActions";
import { teesetsSelector, divisionRoundOffsetsSelector } from "features/competition/competitionSelectors";
import ModalDialog from "features/shared/ModalDialog";
import { updateDivisionRoundOffset } from "features/competition/competitionSlice";
import { convertOffsetToDate, generateDayOptions } from "../../../../../utils/dateOffsetUtils";

const DivisionRound = ({
  position,
  roundId,
  divisionId,
  register,
  control,
  courses,
  minDate,
  maxDate,
  getValues,
  setValue,
  watch,
  defaultDate,
  defaultFormat,
  errors,
  removeRound,
}) => {
  const dispatch = useDispatch();
  const coursesInDB = useSelector(state => state.courses);
  const teesets = useSelector(teesetsSelector);

  // Get division round offsets from Redux wizardState (single source of truth)
  const divisionRoundOffsets = useSelector(divisionRoundOffsetsSelector);

  const [selectedCourse, setSelectedCourse] = useState("");
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

  // Get current day offset from Redux wizardState instead of form watch
  const currentDayOffset = divisionRoundOffsets[divisionId]?.[position] ?? 0;

  // Generate dropdown options for this round with chronological constraints
  const dayOptions = useMemo(() => {
    if (!minDate || !maxDate) return [];

    // Generate all possible day options
    const allOptions = generateDayOptions(minDate, maxDate);

    // Apply chronological constraints: round n+1 cannot occur before round n
    return allOptions.map(option => {
      let isDisabled = option.disabled || false;
      let disabledReason = "";

      // For round position > 0, check if this day is before the previous round's day
      if (position > 0) {
        const previousRoundOffset = divisionRoundOffsets[divisionId]?.[position - 1];
        if (typeof previousRoundOffset === "number" && option.value < previousRoundOffset) {
          isDisabled = true;
          disabledReason = `Cannot occur before Round ${position}`;
        }
      }

      // For round position < total rounds - 1, check if this day is after the next round's day
      if (divisionRoundOffsets[divisionId]) {
        const totalRounds = Object.keys(divisionRoundOffsets[divisionId]).length;
        if (position < totalRounds - 1) {
          const nextRoundOffset = divisionRoundOffsets[divisionId]?.[position + 1];
          if (typeof nextRoundOffset === "number" && option.value > nextRoundOffset) {
            isDisabled = true;
            disabledReason = `Cannot occur after Round ${position + 2}`;
          }
        }
      }

      return {
        ...option,
        disabled: isDisabled,
        disabledReason: disabledReason || option.disabledReason,
      };
    });
  }, [minDate, maxDate, position, divisionRoundOffsets, divisionId]);

  // Get the current form value for other round data (course, tee, etc.)
  const currentRoundData = getValues(`rounds[${position}]`) || {};

  // Compute current date from offset and minDate
  let currentDate = currentRoundData.date || defaultDate;
  if (minDate && typeof currentDayOffset === "number") {
    currentDate = convertOffsetToDate(currentDayOffset, minDate);
  }

  // Ensure currentDate is in YYYY-MM-DD format (strip time if present)
  if (currentDate && currentDate.includes("T")) {
    currentDate = currentDate.split("T")[0];
  }

  // Use dropdown options from Redux instead of calculating here
  // Options are pre-calculated in wizardState with all constraints applied

  // Simple initialization - just ensure form is synced
  useEffect(() => {
    if (!minDate || !maxDate || !divisionId) return;
  }, [minDate, maxDate, divisionId, position]);
  // const { control, setValue } = useForm();

  useEffect(() => {
    const formRound = getValues(`rounds[${position}]`) || {};
    if (!formRound.clientId && roundId) {
      setValue(`rounds[${position}].clientId`, roundId);
    }
  }, [position, roundId, getValues, setValue]);

  useEffect(() => {
    if (!teesets || teesets.length === 0) {
      dispatch(fetchTeesets());
    }
  }, [dispatch, teesets]);

  // Enhanced day offset change handler with automatic conflict resolution
  const handleDayOffsetChange = useCallback(
    newDayOffset => {
      const offsetNumber = parseInt(newDayOffset, 10);

      // 1. Update form state for compatibility with other components
      setValue(`rounds[${position}].dayOffset`, offsetNumber);

      // 2. Update date field for backward compatibility
      if (minDate) {
        const newDate = convertOffsetToDate(offsetNumber, minDate);
        setValue(`rounds[${position}].date`, newDate);
      }

      // 3. Update Redux wizardState
      if (divisionId) {
        dispatch(
          updateDivisionRoundOffset({
            divisionId: divisionId,
            roundIndex: position,
            dayOffset: offsetNumber,
          }),
        );

        // 4. Check for and resolve conflicts with other rounds
        const currentOffsets = divisionRoundOffsets[divisionId] || {};
        const totalRounds = Object.keys(currentOffsets).length;

        // Auto-adjust subsequent rounds if they now occur before this round
        for (let i = position + 1; i < totalRounds; i++) {
          const subsequentOffset = currentOffsets[i];
          if (typeof subsequentOffset === "number" && subsequentOffset < offsetNumber) {
            // Move the subsequent round to at least the same day as the current round
            const adjustedOffset = offsetNumber;

            // Update Redux for the adjusted round
            dispatch(
              updateDivisionRoundOffset({
                divisionId: divisionId,
                roundIndex: i,
                dayOffset: adjustedOffset,
              }),
            );

            // Update form for the adjusted round
            setValue(`rounds[${i}].dayOffset`, adjustedOffset);
            if (minDate) {
              const adjustedDate = convertOffsetToDate(adjustedOffset, minDate);
              setValue(`rounds[${i}].date`, adjustedDate);
            }
          }
        }

        // Auto-adjust previous rounds if they now occur after this round
        for (let i = position - 1; i >= 0; i--) {
          const previousOffset = currentOffsets[i];
          if (typeof previousOffset === "number" && previousOffset > offsetNumber) {
            // Move the previous round to at most the same day as the current round
            const adjustedOffset = offsetNumber;

            // Update Redux for the adjusted round
            dispatch(
              updateDivisionRoundOffset({
                divisionId: divisionId,
                roundIndex: i,
                dayOffset: adjustedOffset,
              }),
            );

            // Update form for the adjusted round
            setValue(`rounds[${i}].dayOffset`, adjustedOffset);
            if (minDate) {
              const adjustedDate = convertOffsetToDate(adjustedOffset, minDate);
              setValue(`rounds[${i}].date`, adjustedDate);
            }
          }
        }
      }
    },
    [position, setValue, minDate, divisionId, dispatch, divisionRoundOffsets],
  );

  // Initialize form round data (run only once when component mounts)
  useEffect(() => {
    const formRound = getValues(`rounds[${position}]`) || {};
    if (!formRound.clientId && roundId) {
      setValue(`rounds[${position}].clientId`, roundId);
    }
  }, [position, roundId, setValue, getValues]); // Removed changing dependencies

  // Sync form with Redux wizardState dayOffset when it changes
  useEffect(() => {
    const formRound = getValues(`rounds[${position}]`) || {};
    if (typeof currentDayOffset === "number" && formRound.dayOffset !== currentDayOffset) {
      setValue(`rounds[${position}].dayOffset`, currentDayOffset);

      // Update date field too
      if (minDate) {
        const newDate = convertOffsetToDate(currentDayOffset, minDate);
        setValue(`rounds[${position}].date`, newDate);
      }
    }
  }, [currentDayOffset, position, setValue, getValues, minDate]); // Only run when currentDayOffset changes

  // Set selected course based on form values (only when position changes)
  useEffect(() => {
    const roundValues = getValues(`rounds[${position}]`);
    if (roundValues?.courseId) {
      setSelectedCourse(roundValues.courseId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position]); // Removed getValues from dependencies to prevent infinite loops

  const coursesDB = useMemo(() => {
    return coursesInDB.reduce((acc, course) => {
      acc[course.id] = course;
      return acc;
    }, {});
  }, [coursesInDB]);

  const teeColorMap = useMemo(() => {
    if (!teesets) return {};
    return teesets.reduce((acc, teeset) => {
      acc[teeset._id] = teeset.name;
      return acc;
    }, {});
  }, [teesets]);

  const [coursesInfo, setCoursesInfo] = useState([]);
  const initialCourseId = coursesInfo[0]?.courseId || "";

  useEffect(() => {
    // Safety check: ensure courses exists before accessing courseInfo
    if (!courses) {
      setCoursesInfo([]);
      return;
    }

    const coursesArray = Array.isArray(courses.courseInfo) ? courses.courseInfo : courses;
    if (coursesArray.length > 0 && Object.keys(coursesDB).length > 0) {
      const expandedCourseInfo = coursesArray
        .flatMap(course => {
          const courseData = coursesDB[course.courseId];
          if (courseData) {
            // Handle both array and object formats for tees (same fix as in leaderboard)
            let tees = [];
            if (Array.isArray(courseData.tees)) {
              tees = courseData.tees;
            } else if (courseData.tees && typeof courseData.tees === "object") {
              // Convert object to array if needed
              tees = Object.values(courseData.tees);
            }

            if (tees.length > 0) {
              // Filter tees to only include complete/mapped ones
              const completeTees = tees.filter(teeId => {
                const tee = teesets.find(t => t?.id === teeId.id || t?.id === teeId);
                return (
                  tee &&
                  courseData.numHoles &&
                  ((courseData.numHoles === 9 && tee.numHolesPathDataComplete === 9) ||
                    (courseData.numHoles === 18 && tee.numHolesPathDataComplete === 18))
                );
              });

              if (completeTees.length > 0) {
                return completeTees.map(teeId => {
                  const teeName = teeColorMap[teeId.id] || "Pink";
                  return {
                    name: `${courseData.name} (${teeName})`,
                    courseId: course.courseId,
                    teeId: teeId,
                  };
                });
              } else {
                // If no complete tees, don't include this course
                return null;
              }
            } else {
              return [{ name: courseData.name, courseId: course.courseId }];
            }
          }
          return null;
        })
        .filter(Boolean);
      setCoursesInfo(expandedCourseInfo);
    }
  }, [courses, coursesDB, teeColorMap, teesets]);

  useEffect(() => {
    if (coursesInfo.length > 0 && !selectedCourse) {
      setSelectedCourse(coursesInfo[0].courseId);
      setValue(`rounds[${position}].courseId`, coursesInfo[0].courseId);
      setValue(`rounds[${position}].teeId`, coursesInfo[0].teeId.id || null);
    }
  }, [coursesInfo, selectedCourse, position, setValue]);

  const handleDeleteClick = () => {
    setConfirmDeleteOpen(true);
  };

  const handleConfirmDelete = () => {
    if (removeRound) {
      removeRound(roundId);
    }
    setConfirmDeleteOpen(false);
  };

  return (
    <>
      <fieldset className="d-flex flex-column px-4 py-3 m-3 bg-light rounded">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <legend className="text-dark h5">Round {position + 1}</legend>
          {removeRound && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleDeleteClick}
              aria-label={`Remove Round ${position + 1}`}
            >
              <i className="fas fa-trash"></i>
            </button>
          )}
        </div>

        <input type="hidden" {...register(`rounds[${position}].clientId`)} defaultValue={roundId} />

        {!isEmpty(errors) && (
          <div className="alert alert-danger">
            {Object.entries(errors).map(([key, { message }]) => (
              <ErrorMessage key={key} id={key}>
                {message}
              </ErrorMessage>
            ))}
          </div>
        )}

        <Form.Group as={Row} controlId={`round-date-${position}`} className="mb-2">
          <Form.Label column sm={3} className="text-end">
            Date:
          </Form.Label>
          <Col sm={6}>
            <Controller
              name={`rounds[${position}].dayOffset`}
              control={control}
              rules={{ required: true }}
              render={({ field }) => {
                return (
                  <Form.Select
                    {...field}
                    value={field.value ?? ""}
                    onChange={e => {
                      const offsetNumber = parseInt(e.target.value, 10);

                      // Check if the selected option is disabled
                      const selectedOption = dayOptions.find(opt => opt.value === offsetNumber);
                      if (selectedOption?.disabled) {
                        // Prevent the change by not calling field.onChange or handleDayOffsetChange
                        return;
                      }

                      field.onChange(offsetNumber);
                      handleDayOffsetChange(offsetNumber);
                    }}
                  >
                    <option value="" disabled>
                      Select Date
                    </option>
                    {dayOptions.map(option => (
                      <option
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled}
                        title={option.disabled ? option.disabledReason : ""}
                        style={
                          option.disabled
                            ? {
                                color: "#6c757d",
                                backgroundColor: "#f8f9fa",
                                fontStyle: "italic",
                              }
                            : {}
                        }
                      >
                        {option.label}
                        {option.disabled && ` (${option.disabledReason})`}
                      </option>
                    ))}
                  </Form.Select>
                );
              }}
            />
            {/* Hidden field to maintain backward compatibility */}
            <input type="hidden" {...register(`rounds[${position}].date`)} value={currentDate || ""} />
          </Col>
        </Form.Group>

        <Form.Group as={Row} controlId={`round-format-${position}`} className="mb-2">
          <Form.Label column sm={3} className="text-end">
            Format:
          </Form.Label>
          <Col sm={7}>
            <Form.Select
              {...register(`rounds[${position}].format`, { required: true })}
              defaultValue={defaultFormat || "Speedgolf"}
            >
              <option value="" disabled>
                Select Format
              </option>
              <option value="Speedgolf">Speedgolf</option>
              <option value="Sprintgolf">Sprintgolf</option>
            </Form.Select>
          </Col>
        </Form.Group>

        <Form.Group as={Row} controlId={`round-holes-${position}`} className="mb-2">
          <Form.Label column sm={3} className="text-end">
            Holes:
          </Form.Label>
          <Col sm={7}>
            <Form.Select
              {...register(`rounds[${position}].numHoles`)}
              defaultValue={getValues(`rounds[${position}].numHoles`) || "18"}
            >
              <option value="" disabled>
                Select Holes
              </option>
              <option value="18">18</option>
              <option value="Front 9">Front 9</option>
              <option value="Back 9">Back 9</option>
            </Form.Select>
          </Col>
        </Form.Group>

        <Form.Group as={Row} controlId={`round-course-${position}`} className="mb-2">
          <Form.Label column sm={3} className="text-end">
            Course/Tee:
          </Form.Label>
          <Col sm={8}>
            <Form.Select
              {...register(`rounds[${position}].courseId`)}
              value={selectedCourse || initialCourseId}
              defaultValue={coursesInfo[0]?.courseId}
              onChange={e => {
                const courseId = e.target.value;
                const selectedOption = e.target.options[e.target.selectedIndex];
                const teeId = selectedOption.dataset.teeid;
                // const [courseId, teeId] = value.split("--");
                setSelectedCourse(courseId);
                setValue(`rounds[${position}].courseId`, courseId ? courseId : initialCourseId);
                setValue(`rounds[${position}].teeId`, teeId ? teeId : null);
              }}
            >
              {/* <option value='' disabled>
                Select Course/Tee
              </option> */}
              {coursesInfo.map(({ courseId, name, teeId }) => (
                <option key={`${courseId}-${teeId?.id || "default"}`} value={`${courseId}`} data-teeid={teeId?.id}>
                  {name}
                </option>
              ))}
            </Form.Select>
          </Col>
        </Form.Group>
      </fieldset>
      <ModalDialog
        isOpen={confirmDeleteOpen}
        title="Delete Round?"
        body={`Are you sure you want to delete Round ${position + 1}?`}
        actionBtnText="Yes, Delete Round"
        cancelBtnText="No, Cancel"
        close={() => setConfirmDeleteOpen(false)}
        onSubmit={handleConfirmDelete}
      />
    </>
  );
};

export default DivisionRound;
