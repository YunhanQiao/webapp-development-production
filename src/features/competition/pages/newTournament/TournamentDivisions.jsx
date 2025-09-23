import { useState } from "react";
import { Col, Container, Row, Table } from "react-bootstrap";
import ModalDialog from "../../../shared/ModalDialog";
import AddDivisionModal from "./Divisions/AddDivisionModal";
import DivisionsList from "./Divisions/DivisionsList";
import { useSelector, useDispatch } from "react-redux";
import { activeTournamentSelector, divisionsWithDatesSelector, wizardStateSelector } from "../../competitionSelectors";
import { useFormContext } from "react-hook-form";
import { updateWizardTab } from "../../competitionSlice";
import { uuidv4 } from "../../competitionServices";
import { convertOffsetToDate } from "../../../../utils/dateOffsetUtils";

// Utility to serialize dates in division data to prevent Redux serialization errors
const serializeDivisionsData = divisions => {
  if (!divisions || !Array.isArray(divisions)) {
    return [];
  }

  const serialized = divisions.map(division => {
    const rounds =
      division.rounds?.map(round => ({
        ...round, // Preserve all round fields
        date: round.date,
        dayOffset: round.dayOffset,
        teeTime: round.teeTime || "09:00",
      })) || [];

    return {
      ...division, // Preserve all division fields including name, entryFee, gender, etc.
      rounds,
    };
  });

  return serialized;
};

const TournamentDivisions = () => {
  const dispatch = useDispatch();

  // Get data from Redux selectors
  const activeTournament = useSelector(activeTournamentSelector);
  const wizardState = useSelector(wizardStateSelector);
  const divisionsWithDates = useSelector(divisionsWithDatesSelector);

  // 🎯 NEW ARCHITECTURE: Get currency from wizard state as primary source
  const currency = wizardState?.regPayment?.currencyType || activeTournament?.regPaymentInfo?.currencyType || "USD";
  const { watch, setValue } = useFormContext();

  // 🎯 SINGLE SOURCE OF TRUTH: Get divisions from wizard state
  // Use computed divisions (just-in-time calculation) which reads from wizard state
  const divisions = divisionsWithDates;

  // Get current tournament dates from wizard state (single source of truth)
  const wizardBasicInfo = wizardState?.basicInfo;
  const formStartDate = watch("startDate");
  const formEndDate = watch("endDate");

  // Priority: wizard state > form values > activeTournament
  const currentStartDate =
    wizardBasicInfo?.startDate ||
    formStartDate ||
    activeTournament?.basicInfo?.startDate ||
    activeTournament?.startDate;

  // FORCE our calculated end date if we have valid start date and offset
  const forceCalculatedEndDate = () => {
    if (currentStartDate && wizardBasicInfo?.endDateOffset !== undefined) {
      return convertOffsetToDate(wizardBasicInfo.endDateOffset, currentStartDate);
    }
    // Fallback to form or activeTournament end date
    return formEndDate || activeTournament?.basicInfo?.endDate || activeTournament?.endDate;
  };

  const finalEndDate = forceCalculatedEndDate();

  const [divisionToEdit, setDivisionToEdit] = useState(null);
  const [divisionToDelete, setDivisionToDelete] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const handleAddDivision = isNew => division => {
    // 🎯 SINGLE SOURCE OF TRUTH: Update wizard state instead of form

    const currentDivisions = wizardState?.divisions || [];
    let newDivisions;

    if (isNew) {
      const newId = uuidv4();
      newDivisions = [...currentDivisions, { ...division, id: newId, clientId: newId }];
    } else {
      const existingId = divisionToEdit.clientId || divisionToEdit.id;
      newDivisions = [...currentDivisions];

      // CRITICAL FIX: When updating an existing division, preserve the updated round data
      // The division object coming from the modal should have the correct dayOffset values
      newDivisions[divisionToEdit.index] = {
        ...division,
        id: existingId,
        clientId: existingId,
        // Ensure rounds array has the updated dayOffset values from the form
        rounds: division.rounds?.map(round => ({
          ...round,
          // Preserve the dayOffset that was set in the modal form
          dayOffset: round.dayOffset !== undefined ? round.dayOffset : 0,
          // Ensure date is a string for serialization
          date: typeof round.date === "string" ? round.date : round.date,
        })),
      };
    }

    // Serialize the data to prevent Redux serialization errors with Date objects
    const serializedDivisions = serializeDivisionsData(newDivisions);

    // 🎨 UI-ONLY: Skip wizard state update
    console.log("🎨 UI-ONLY: Skipping wizard state update for divisions");

    // Also update form for backward compatibility (some components might still read from it)
    setValue("divisions", serializedDivisions);

    setDivisionToEdit(null);
    setShowModal(false);
  };

  const handleDeleteDivision = () => {
    // � UI-ONLY: Skip wizard state update
    console.log("� UI-ONLY: Skipping wizard state update for division deletion, index:", divisionToDelete);

    const currentDivisions = wizardState?.divisions || [];
    const newDivisions = currentDivisions.filter((_, index) => index !== divisionToDelete);

    // Serialize the data to prevent Redux serialization errors
    const serializedDivisions = serializeDivisionsData(newDivisions);

    // 🎨 UI-ONLY: Skip wizard state update
    console.log("🎨 UI-ONLY: Skipping wizard state update for deleted divisions");

    // Also update form for backward compatibility
    setValue("divisions", serializedDivisions);

    setDivisionToDelete(null);
  };

  const handleOpenDivisionModal = (division, index) => {
    if (division) {
      setDivisionToEdit({ ...division, index });
    } else {
      setDivisionToEdit(null);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setDivisionToEdit(null);
    setShowModal(false);
  };

  const handleDeleteDivisionModal = index => setDivisionToDelete(index);

  return (
    <>
      <Container className="h-50">
        <Row className="justify-content-center">
          <Col sm="9">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>Division Name</th>
                  <th>Fee</th>
                  <th>Gender</th>
                  <th>Min. Age</th>
                  <th>Max. Age</th>
                  <th>Rounds & Courses</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {divisions.length ? (
                  <DivisionsList
                    currency={currency}
                    divisions={divisions}
                    tournamentStartDate={currentStartDate}
                    tournamentEndDate={finalEndDate}
                    editDivision={(division, index) => handleOpenDivisionModal(division, index)}
                    deleteDivision={handleDeleteDivisionModal}
                  />
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center">
                      No Data
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </Col>
        </Row>
        <Row className="d-flex justify-content-center mb-4">
          <Col sm="9" className="d-flex justify-content-end">
            <button
              className="mode-page-btn m-0 p-2"
              type="button"
              style={{ fontSize: "16px" }}
              onClick={() => handleOpenDivisionModal()}
            >
              <i className="fa fa-solid fa-plus" />
              &nbsp; Add Division to Tournament
            </button>
          </Col>
        </Row>
      </Container>
      {showModal && (
        <AddDivisionModal
          key={`division-modal-${divisionToEdit?.index || "new"}`}
          division={divisionToEdit}
          handleUpdate={handleAddDivision}
          handleClose={handleCloseModal}
        />
      )}
      <ModalDialog
        isOpen={divisionToDelete !== null}
        title="Delete Division?"
        body="Do you really want to delete that division?"
        actionBtnText="Yes, Delete Division"
        cancelBtnText="No, Cancel"
        close={() => setDivisionToDelete(null)}
        onSubmit={handleDeleteDivision}
      />
    </>
  );
};

export default TournamentDivisions;
