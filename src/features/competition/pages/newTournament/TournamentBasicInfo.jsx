import CustomUpload from "components/CustomUpload.jsx";
import { MAX_IMAGE_SIZE_IN_KB } from "features/competition/constants";
import AutoCompleteSearch from "features/shared/AutoCompleteSearch";
import ModalDialog from "features/shared/ModalDialog";
import { useMemo, useCallback, useState, useEffect } from "react";
import { Col, Container, Row, Modal, Button, Form } from "react-bootstrap";
import useBasicInfo from "../../hooks/useBasicInfo";
import "../../../../styles/features/competition/newTournament.css";
import {
  activeTournamentSelector,
  allUserNamesSelector,
  tournamentsSelector,
  wizardStateSelector,
  wizardTournamentIdSelector,
} from "features/competition/competitionSelectors";
import {
  generateUniqueTournamentName,
  getTournamentNameAbbr,
} from "features/competition/competitionServices";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllCompetitions } from "features/competition/competitionActions";
import {
  updateWizardTab,
  updateEndDateOffset,
  updateTeeTimeOffsets,
  updateStartDate,
} from "features/competition/competitionSlice";
import { parseLocalDate } from "../../utils/dateUtils";
import {
  convertDateToOffset,
  convertOffsetToDate,
} from "../../../../utils/dateOffsetUtils";
import { divisionRoundOffsetsSelector } from "features/competition/competitionSelectors";

// 🎯 OFFSET-BASED TEE TIME INPUTS - Using startDate + offsets approach
const TeeTimeInputs = () => {
  const dispatch = useDispatch();
  const wizardState = useSelector(wizardStateSelector);
  const basicInfo = useMemo(
    () => wizardState?.basicInfo || {},
    [wizardState?.basicInfo],
  );

  // Read offset-based data from wizard state
  const startDate = basicInfo.startDate;
  const endDateOffset = basicInfo.endDateOffset ?? 1;
  const teeTimeOffsets = useMemo(
    () => basicInfo.teeTimeOffsets || [],
    [basicInfo.teeTimeOffsets],
  );

  // Calculate actual dates from offsets
  const calculatedEndDate = useMemo(() => {
    return startDate ? convertOffsetToDate(endDateOffset, startDate) : null;
  }, [startDate, endDateOffset]);

  const calculatedTeeTimes = useMemo(() => {
    if (!startDate || !teeTimeOffsets.length) return [];
    return teeTimeOffsets.map((teeTimeOffset) => ({
      date: convertOffsetToDate(teeTimeOffset.dayOffset, startDate),
      startTime: teeTimeOffset.startTime,
      dayOffset: teeTimeOffset.dayOffset,
    }));
  }, [startDate, teeTimeOffsets]);

  // Sync tee time offsets when dates change
  useEffect(() => {
    if (!startDate || !calculatedEndDate) return;

    // Validate that endDate is not before startDate
    if (new Date(calculatedEndDate) < new Date(startDate)) {
      console.warn("End date is before start date, skipping tee time sync:", {
        startDate,
        calculatedEndDate,
      });
      return;
    }

    // Generate expected day offsets for the date range
    const expectedOffsets = [];
    for (let i = 0; i <= endDateOffset; i++) {
      expectedOffsets.push(i);
    }

    // Check if current tee time offsets match the expected range
    const currentOffsets = teeTimeOffsets
      .map((t) => t.dayOffset)
      .sort((a, b) => a - b);
    const expectedOffsetsStr = expectedOffsets.join(",");
    const currentOffsetsStr = currentOffsets.join(",");

    if (expectedOffsetsStr !== currentOffsetsStr) {
      // Update tee time offsets to match date range
      const updatedTeeTimeOffsets = expectedOffsets.map((dayOffset) => {
        const existing = teeTimeOffsets.find((t) => t.dayOffset === dayOffset);
        return existing || { startTime: "07:00", dayOffset };
      });

      dispatch(updateTeeTimeOffsets({ teeTimeOffsets: updatedTeeTimeOffsets }));
    }
  }, [startDate, endDateOffset, calculatedEndDate, teeTimeOffsets, dispatch]);

  if (!startDate || calculatedTeeTimes.length === 0) return null;

  // Helper function to format date as MM/DD/YYYY
  const formatDateForDisplay = (dateStr) => {
    const date = parseLocalDate(dateStr);
    if (!date) return dateStr;
    return date.toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
    });
  };

  // Handle tee time changes
  const handleTeeTimeChange = (index, newStartTime) => {
    const updatedOffsets = [...teeTimeOffsets];
    updatedOffsets[index] = {
      ...updatedOffsets[index],
      startTime: newStartTime,
    };
    dispatch(updateTeeTimeOffsets({ teeTimeOffsets: updatedOffsets }));
  };

  return (
    <Form.Group as={Row} className="mb-3">
      <Col sm="2" className="txt-align-right">
        <label className="form-label">Tee Start Times:</label>
      </Col>
      <Col sm="6">
        {calculatedTeeTimes.map((teeTime, index) => (
          <Row key={`teeTime-${index}`} className="mb-2 align-items-center">
            <Col sm="4">
              <label
                htmlFor={`teeTime-${index}`}
              >{`${formatDateForDisplay(teeTime.date)}:`}</label>
            </Col>
            <Col sm="4">
              <Form.Control
                type="time"
                id={`teeTime-${index}`}
                value={teeTime.startTime}
                onChange={(e) => handleTeeTimeChange(index, e.target.value)}
              />
            </Col>
          </Row>
        ))}
      </Col>
    </Form.Group>
  );
};

const TournamentBasicInfo = () => {
  // Fix: Define handleClearPrizeDoc and handleClearAdditionalInfoDoc above their usage
  const handleClearPrizeDoc = () => {
    setPrizeDocName("");
    dispatch(
      updateWizardTab({
        tab: "basicInfo",
        data: { ...basicInfo, prizeDoc: null },
      }),
    );
    const prizeTextInput = document.getElementById("prizeText");
    if (prizeTextInput) {
      prizeTextInput.disabled = false;
    }
  };

  const handleClearAdditionalInfoDoc = () => {
    setAdditionalInfoDocName("");
    dispatch(
      updateWizardTab({
        tab: "basicInfo",
        data: { ...basicInfo, additionalInfoDoc: null },
      }),
    );
    const additionalInfoTextInput =
      document.getElementById("additionalInfoText");
    if (additionalInfoTextInput) {
      additionalInfoTextInput.disabled = false;
    }
  };
  const dispatch = useDispatch();
  const allTournaments = useSelector(tournamentsSelector);
  const wizardState = useSelector(wizardStateSelector);
  const divisionRoundOffsets = useSelector(divisionRoundOffsetsSelector);
  const basicInfo = useMemo(
    () => wizardState?.basicInfo || {},
    [wizardState?.basicInfo],
  );

  const [showFileSizeErrorModal, setShowFileSizeErrorModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showDateConflictModal, setShowDateConflictModal] = useState(false);
  const [dateConflictMessage, setDateConflictMessage] = useState("");
  const [logo, setLogo] = useState("");
  const [rulesDocName, setRulesDocName] = useState("");
  const [prizeDocName, setPrizeDocName] = useState("");
  const [additionalInfoDocName, setAdditionalInfoDocName] = useState("");
  const [hasPrizeText, setHasPrizeText] = useState(false);
  const [hasAdditionalInfoText, setHasAdditionalInfoText] = useState(false);
  const user = useSelector((state) => state.user.user);
  const [selectedAdmin, setSelectedAdmin] = useState({});
  // 🎯 CONTROLLED COMPONENT: Use wizard state as source of truth for admins
  const adminList = useMemo(
    () => new Set(basicInfo?.admins || []),
    [basicInfo?.admins],
  );
  const setAdminList = useCallback(
    (newAdminSet) => {
      // Safety check: ensure basicInfo exists before updating
      if (!basicInfo) {
        console.warn("Cannot update admin list: basicInfo is not available");
        return;
      }

      const newAdmins = Array.isArray(newAdminSet)
        ? newAdminSet
        : [...newAdminSet];
      dispatch(
        updateWizardTab({
          tab: "basicInfo",
          data: { ...basicInfo, admins: newAdmins },
        }),
      );
    },
    [dispatch, basicInfo],
  );
  const [adminToDelete, setAdminToDelete] = useState(null);
  const [showDeleteLogoModal, setShowDeleteLogoModal] = useState(false);
  const allUserNamesAndIds = useSelector(allUserNamesSelector);
  const activeTournament = useSelector(activeTournamentSelector);
  const wizardTournamentId = useSelector(wizardTournamentIdSelector);

  const hostEmail = user?.accountInfo?.email || "";
  const hostName =
    `${user?.personalInfo?.firstName || ""} ${user?.personalInfo?.lastName || ""}`.trim();

  // 🎯 CALCULATE DISPLAY VALUES FROM OFFSET-BASED STATE
  const endDateOffset = basicInfo.endDateOffset ?? 1;
  const calculatedEndDate = useMemo(() => {
    return basicInfo.startDate
      ? convertOffsetToDate(endDateOffset, basicInfo.startDate)
      : "";
  }, [basicInfo.startDate, endDateOffset]);

  // 🎯 OFFSET-BASED DATE CHANGE HANDLERS - Clean implementation with validation
  const handleStartDateChange = useCallback(
    (e) => {
      const newStartDate = e.target.value;
      const oldStartDate = basicInfo.startDate;

      // If we have an existing tournament with rounds, validate the change
      if (
        oldStartDate &&
        newStartDate !== oldStartDate &&
        divisionRoundOffsets &&
        Object.keys(divisionRoundOffsets).length > 0
      ) {
        // Get divisions data to map IDs to names
        const divisionsData = wizardState?.divisions || [];
        const divisionIdToName = {};
        divisionsData.forEach((division) => {
          const divisionId = division.clientId || division._id || division.id;
          divisionIdToName[divisionId] = division.name || "Unknown Division";
        });

        // Calculate what the new end date would be (keeping same duration)
        const currentEndDate = calculatedEndDate;
        const newEndDateOffset = currentEndDate
          ? convertDateToOffset(currentEndDate, newStartDate)
          : endDateOffset;

        // Check if any existing division rounds would be outside the new tournament date range
        const conflictingRounds = [];
        Object.keys(divisionRoundOffsets).forEach((divisionKey) => {
          Object.keys(divisionRoundOffsets[divisionKey]).forEach((roundKey) => {
            const currentOffset = divisionRoundOffsets[divisionKey][roundKey];
            if (typeof currentOffset === "number") {
              // Check if this round would be outside the new tournament range
              if (currentOffset < 0 || currentOffset > newEndDateOffset) {
                const currentAbsoluteDate = convertOffsetToDate(
                  currentOffset,
                  oldStartDate,
                );

                // Determine which day this round should move to
                let suggestedDay;
                if (currentOffset < 0) {
                  suggestedDay = "Day 1 (tournament start date)";
                } else {
                  suggestedDay = `Day ${newEndDateOffset + 1} (tournament end date)`;
                }

                // Create user-friendly names
                const divisionName =
                  divisionIdToName[divisionKey] || "Unknown Division";
                const roundName = `Round ${parseInt(roundKey) + 1}`; // Convert 0-based index to 1-based

                conflictingRounds.push({
                  division: divisionName,
                  round: roundName,
                  currentDate: currentAbsoluteDate,
                  suggestedDay: suggestedDay,
                  currentOffset: currentOffset,
                });
              }
            }
          });
        });

        if (conflictingRounds.length > 0) {
          setDateConflictMessage(
            "You cannot change tournament start date because one or more division rounds would then be scheduled outside the tournament date range, based on their current offset from the tournament start date. Please schedule those rounds to occur earlier in the tournament date window before changing the start date.",
          );
          setShowDateConflictModal(true);
          return; // Don't update the start date
        }
      }

      // If validation passes or no conflicts, update the start date
      dispatch(updateStartDate({ startDate: newStartDate }));
    },
    [
      dispatch,
      basicInfo.startDate,
      calculatedEndDate,
      endDateOffset,
      divisionRoundOffsets,
      wizardState,
    ],
  );

  const handleEndDateChange = useCallback(
    (e) => {
      const newEndDate = e.target.value;
      const currentStartDate = basicInfo.startDate;

      if (currentStartDate && newEndDate) {
        // Calculate new offset based on the selected endDate
        const newEndDateOffset = convertDateToOffset(
          newEndDate,
          currentStartDate,
        );

        // Validation: Check if shortening tournament duration would conflict with existing division rounds
        // Get current division round offsets to check for conflicts
        const currentDivisionRoundOffsets = divisionRoundOffsets || {};

        if (Object.keys(currentDivisionRoundOffsets).length > 0) {
          // Collect all day offsets currently used by division rounds
          const allUsedDayOffsets = new Set();
          Object.values(currentDivisionRoundOffsets).forEach(
            (divisionOffsets) => {
              Object.values(divisionOffsets).forEach((offset) => {
                if (typeof offset === "number") {
                  allUsedDayOffsets.add(offset);
                }
              });
            },
          );

          // Check if any rounds are scheduled on days that would be removed
          if (allUsedDayOffsets.size > 0) {
            const maxUsedOffset = Math.max(...allUsedDayOffsets);
            if (newEndDateOffset < maxUsedOffset) {
              const daysToBeRemoved = [];
              allUsedDayOffsets.forEach((offset) => {
                if (offset > newEndDateOffset) {
                  daysToBeRemoved.push(offset + 1); // Convert to 1-based day numbers for user display
                }
              });

              setDateConflictMessage(
                "You cannot change tournament end date because one or more division rounds would then be scheduled outside the tournament date range, based on their current offset from the tournament start date. Please schedule those rounds to occur earlier in the tournament date window before changing the end date.",
              );
              setShowDateConflictModal(true);
              return; // Don't update the state
            }
          }
        }

        dispatch(updateEndDateOffset({ endDateOffset: newEndDateOffset }));
      }
    },
    [dispatch, basicInfo.startDate, divisionRoundOffsets],
  );

  const handleNameChange = useCallback(
    (e) => {
      const newName = e.target.value;
      if (basicInfo.name === newName) return;
      dispatch(
        updateWizardTab({
          tab: "basicInfo",
          data: { ...basicInfo, name: newName },
        }),
      );
    },
    [dispatch, basicInfo],
  );

  const handlePrizeTextChange = useCallback(
    (e) => {
      dispatch(
        updateWizardTab({
          tab: "basicInfo",
          data: { ...basicInfo, prizeText: e.target.value },
        }),
      );
    },
    [dispatch, basicInfo],
  );

  const handleAdditionalInfoTextChange = useCallback(
    (e) => {
      dispatch(
        updateWizardTab({
          tab: "basicInfo",
          data: { ...basicInfo, additionalInfoText: e.target.value },
        }),
      );
    },
    [dispatch, basicInfo],
  );

  useEffect(() => {
    dispatch(fetchAllCompetitions());
  }, [dispatch]);

  const {
    addAdmin,
    removeAdmin,
    handleTournamentLogoUpload,
    handleTournamentRulesUpload,
    handleTournamentPrizesUpload,
    handleTournamentAdditionalInfoUpload,
    handleDeleteLogo,
  } = useBasicInfo({
    adminList,
    setAdminList,
    setLogo,
    setRulesDocName,
    setPrizeDocName,
    setAdditionalInfoDocName,
    setShowFileSizeErrorModal,
    dispatch,
    basicInfo,
    updateWizardTab,
  });

  useEffect(() => {
    dispatch(fetchAllCompetitions());
  }, [dispatch]);

  // 🎯 AUTOMATIC UNIQUE NAME GENERATION - Generate tournament short name from name + year
  useEffect(() => {
    const tournamentName = basicInfo?.name;
    const startDate = basicInfo?.startDate;

    // Only generate uniqueName if we have a tournament name
    if (!tournamentName || !tournamentName.trim()) {
      return;
    }

    // Skip if we're editing an existing tournament (it already has a uniqueName)
    if (wizardTournamentId && basicInfo?.uniqueName) {
      return;
    }

    // Generate unique tournament name using the helper function
    // If no startDate, it will use the current year
    const generatedUniqueName = generateUniqueTournamentName(
      tournamentName,
      allTournaments || [],
      startDate || null, // Pass null if no date, function will use current year
    );

    // Only update if the generated name is different from current
    if (generatedUniqueName && generatedUniqueName !== basicInfo?.uniqueName) {
      console.log(
        `🎯 Generated unique tournament name: ${generatedUniqueName}`,
      );
      dispatch(
        updateWizardTab({
          tab: "basicInfo",
          data: { ...basicInfo, uniqueName: generatedUniqueName },
        }),
      );
    }
  }, [
    basicInfo?.name,
    basicInfo?.startDate,
    allTournaments,
    wizardTournamentId,
    dispatch,
    basicInfo,
  ]);

  const getAdminNameFromId = (id) => {
    if (!allUserNamesAndIds || !allUserNamesAndIds.length) {
      // Gracefully handle when user list is not yet loaded
      return `User ID: ${id}`;
    }
    const user = allUserNamesAndIds.find((user) => user.id === id);
    return user ? user.name : `Unknown User (${id})`;
  };

  const handleCloseFileSizeModal = useCallback(() => {
    setShowFileSizeErrorModal(false);
    // Reset the file input
    const fileInput = document.getElementById("logo");
    if (fileInput) {
      fileInput.value = "";
    }
  }, []);

  return (
    <>
      <Form.Group as={Row} className="mb-3" controlId="tournamentDates">
        <Col sm="2" className="txt-align-right">
          <label className="form-label">Tournament Dates:</label>
        </Col>

        <Col sm="3">
          <input
            id="startDate"
            className="form-control-sm"
            type="date"
            aria-describedby="roundDateDescr"
            value={basicInfo.startDate || ""}
            onChange={handleStartDateChange}
          />
          <span className="mx-2">to</span>
          <input
            id="endDate"
            className="form-control-sm"
            type="date"
            aria-describedby="roundDateDescr"
            min={basicInfo.startDate || new Date().toISOString().split("T")[0]}
            value={calculatedEndDate || ""}
            onChange={handleEndDateChange}
          />
        </Col>
      </Form.Group>
      <input type="hidden" value={basicInfo.uniqueName || ""} readOnly />
      <TeeTimeInputs />
      <Form.Group as={Row} className="mb-3" controlId="name">
        <Col sm="2" className="txt-align-right">
          <label htmlFor="name" className="form-label">
            Tournament Name:
          </label>
        </Col>
        <Col sm="3">
          <input
            type="text"
            className="form-control"
            id="name"
            value={basicInfo.name || ""}
            onChange={handleNameChange}
          />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3" controlId="tournamentCreatorName">
        <Col sm="2" className="txt-align-right">
          <label htmlFor="tournamentCreatorName" className="form-label">
            Tournament Host:
          </label>
        </Col>
        <Col sm="3">
          <input
            type="text"
            className="form-control"
            id="tournamentCreatorName"
            value={hostName}
            readOnly
          />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3" controlId="tournamentCreatorEmail">
        <Col sm="2" className="txt-align-right">
          <label htmlFor="tournamentCreatorEmail" className="form-label">
            Host email:
          </label>
        </Col>
        <Col sm="3">
          <input
            type="text"
            className="form-control"
            id="tournamentCreatorEmail"
            value={hostEmail}
            readOnly
          />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3" controlId="admins">
        <Col sm="2" className="txt-align-right">
          <label htmlFor="admins" className="form-label">
            Tournament Admins:
          </label>
        </Col>
        <Col sm="4">
          <Row className="mb-3">
            {/* <Col sm="8"><input type="text" className="form-control" {...register("admins[0]")} disabled/></Col> */}
            <Col sm="4">
              <Button
                variant="secondary"
                onClick={() => {
                  setShowAdminModal(true);
                }}
              >
                Add Admin...
              </Button>
            </Col>
          </Row>
          {[...adminList].map((id) => (
            <Row className="mb-3" key={id}>
              <Col sm="8">
                <input
                  type="text"
                  className="form-control"
                  value={getAdminNameFromId(id)}
                  disabled
                />
              </Col>
              <Col sm="4">
                <button type="button" onClick={() => setAdminToDelete(id)}>
                  <i className="fa-solid fa-trash" />
                </button>
              </Col>
            </Row>
          ))}
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3" controlId="logo">
        <Col sm="2" className="txt-align-right">
          <label htmlFor="logo" className="form-label">
            Tournament Logo:
          </label>
        </Col>
        <Col sm="3">
          {logo && (
            <img
              alt="Tournament Logo preview"
              className="logo-image"
              src={logo}
            />
          )}
          <CustomUpload
            inputId="logo"
            handleFile={handleTournamentLogoUpload}
            buttonText="Upload Logo..."
            fileType="image/*"
            fileInstruction={`(${MAX_IMAGE_SIZE_IN_KB} KB Limit)`}
          />
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3" controlId="tournamentRules">
        <Col sm="2" className="txt-align-right">
          <label htmlFor="rules" className="form-label">
            Tournament Rules Doc:
          </label>
        </Col>
        <Col sm="5">
          <div className="d-flex align-items-center">
            <input
              type="text"
              className="form-control"
              value={rulesDocName || ""}
              placeholder="No document uploaded"
              disabled
            />
            {rulesDocName && (
              <button type="button" className="btn-transparent ms-2">
                <i
                  className="fa-solid fa-trash"
                  onClick={() => {
                    setRulesDocName("");
                    dispatch(
                      updateWizardTab({
                        tab: "basicInfo",
                        data: { ...basicInfo, rules: null },
                      }),
                    );
                  }}
                ></i>
              </button>
            )}
          </div>
        </Col>
        <Col sm="5">
          {!rulesDocName && (
            <CustomUpload
              handleFile={handleTournamentRulesUpload}
              buttonText="Upload Rules Doc..."
              fileType=".pdf"
            />
          )}
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3" controlId="tournamentPrizes">
        <Col sm="2" className="txt-align-right">
          <label htmlFor="prizeText" className="form-label">
            Prizes:
          </label>
        </Col>
        <Col sm="5">
          {prizeDocName ? (
            <div className="d-flex align-items-center">
              <input
                type="text"
                className="form-control"
                value={prizeDocName}
                disabled
              />
              <button type="button" className="btn-transparent ms-2">
                <i
                  className="fa-solid fa-trash"
                  onClick={handleClearPrizeDoc}
                ></i>
              </button>
            </div>
          ) : (
            <input
              type="text"
              className="form-control"
              id="prizeText"
              disabled={!!prizeDocName}
              value={basicInfo.prizeText || ""}
              onChange={handlePrizeTextChange}
            />
          )}
        </Col>
        <Col sm="5">
          {!hasPrizeText && !prizeDocName && (
            <CustomUpload
              handleFile={handleTournamentPrizesUpload}
              buttonText="Upload Prizes Doc..."
              fileType=".pdf"
            />
          )}
        </Col>
      </Form.Group>

      <Form.Group as={Row} className="mb-3" controlId="additionalInfo">
        <Col sm="2" className="txt-align-right">
          <label htmlFor="additionalInfoText" className="form-label">
            Additional Info:
          </label>
        </Col>
        <Col sm="5">
          {additionalInfoDocName ? (
            <div className="d-flex align-items-center">
              <input
                type="text"
                className="form-control"
                value={additionalInfoDocName}
                disabled
              />
              <button type="button" className="btn-transparent ms-2">
                <i
                  className="fa-solid fa-trash"
                  onClick={handleClearAdditionalInfoDoc}
                ></i>
              </button>
            </div>
          ) : (
            <textarea
              id="additionalInfoText"
              className="form-control"
              rows="5"
              disabled={!!additionalInfoDocName}
              value={basicInfo.additionalInfoText || ""}
              onChange={handleAdditionalInfoTextChange}
            />
          )}
        </Col>
        <Col sm="5">
          {!hasAdditionalInfoText && !additionalInfoDocName && (
            <CustomUpload
              handleFile={handleTournamentAdditionalInfoUpload}
              buttonText="Upload Additional Info Doc..."
              fileType=".pdf"
            />
          )}
        </Col>
      </Form.Group>

      <ModalDialog
        isOpen={showDeleteLogoModal}
        title="Delete Logo?"
        body="Are you sure you want to delete the tournament logo?"
        actionBtnText="Yes, Delete Logo"
        cancelBtnText="No, Cancel"
        close={() => setShowDeleteLogoModal(false)}
        onSubmit={() => {
          handleDeleteLogo();
          setShowDeleteLogoModal(false);
        }}
      />
      <ModalDialog
        isOpen={showFileSizeErrorModal}
        title="File Size Error"
        body={`The file size exceeds ${MAX_IMAGE_SIZE_IN_KB} KB. Please upload a smaller image.`}
        actionBtnText="OK"
        close={handleCloseFileSizeModal}
        onSubmit={handleCloseFileSizeModal}
      />
      <ModalDialog
        isOpen={!!adminToDelete}
        title="Delete Admin?"
        body="Are you sure you want to remove this admin?"
        actionBtnText="Yes, Delete Admin"
        cancelBtnText="No, Cancel"
        close={() => setAdminToDelete(null)}
        onSubmit={() => {
          removeAdmin(adminToDelete);
          setAdminToDelete(null);
        }}
      />

      <ModalDialog
        title="Add Admin"
        body={
          <AutoCompleteSearch
            dataList={allUserNamesAndIds}
            placeholder="Type name of user"
            setSelectedValue={setSelectedAdmin}
          />
        }
        actionBtnText="Add admin"
        actionBtnStyle={{ backgroundColor: "#13294e", borderColor: "#13294e" }}
        cancelBtnVariant="danger"
        size="xl"
        className="admin-modal"
        isOpen={showAdminModal}
        close={() => setShowAdminModal(false)}
        onSubmit={() => addAdmin(selectedAdmin.id, selectedAdmin.email)}
      />

      {/* Date Conflict Modal */}
      <Modal
        show={showDateConflictModal}
        onHide={() => setShowDateConflictModal(false)}
      >
        <Modal.Header closeButton>
          <Modal.Title>Division Round Date Conflict</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{dateConflictMessage}</p>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => setShowDateConflictModal(false)}
          >
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default TournamentBasicInfo;
