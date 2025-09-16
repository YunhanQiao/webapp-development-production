import React, { useMemo, useState } from "react";
import { Col, Form, ListGroup, Modal, Row } from "react-bootstrap";
import Table from "react-bootstrap/Table";
import { useDispatch, useSelector } from "react-redux";
import CourseInfo from "./Courses/CourseInfo";
import { useTournamentCourses } from "features/competition/hooks/useCourses";
import { activeTournamentSelector, wizardStateSelector } from "features/competition/competitionSelectors";
import { updateWizardTab } from "features/competition/competitionSlice";
import ModalDialog from "features/shared/ModalDialog";
import "../../../../styles/features/competition/newTournament.css";

const TournamentCourses = () => {
  const dispatch = useDispatch();
  const wizardState = useSelector(wizardStateSelector);

  // 🎯 DEBUG: Log the entire wizard state
  console.log("🔍 Full wizardState:", wizardState);
  console.log("🔍 wizardState.courses:", wizardState?.courses);

  // 🎯 CONTROLLED COMPONENT: Use wizard state as source of truth for courses
  const coursesInfo = useMemo(() => wizardState?.courses || [], [wizardState?.courses]);

  console.log("🔍 coursesInfo:", coursesInfo);

  // 🎯 WIZARD STATE HANDLER: Update courses in wizard state
  const handleCoursesChange = updatedCourses => {
    dispatch(
      updateWizardTab({
        tab: "courses",
        data: updatedCourses,
      }),
    );
  };

  const {
    searchQuery,
    setSearchQuery,
    searchResult,
    selectedCourse,
    fields,
    handleCourseSelectFromSearch,
    handleRemoveCourse,
    showCourseInfo,
    closeCourseInfoModal,
    duplicateCourse,
    setDuplicateCourse,
    isSearching,
    dropDownOpen,
    setDropDownOpen,
  } = useTournamentCourses(coursesInfo, handleCoursesChange);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const activeTournament = useSelector(activeTournamentSelector);

  // Debug logging
  console.log("📊 TournamentCourses render - fields:", fields);
  console.log("📊 TournamentCourses render - coursesInfo:", coursesInfo);

  // Helper function to format course name with line breaks
  const formatCourseNameForDisplay = name => {
    if (!name) return "";

    // Split on commas and create smart line breaks for better readability
    const parts = name.split(",").map(part => part.trim());

    let displayParts = [];

    if (parts.length <= 2) {
      // If 2 or fewer parts, just use them as-is
      displayParts = parts;
    } else if (parts.length === 3) {
      // Course Name, Street, City State Country
      displayParts = parts;
    } else {
      // 4+ parts: Course Name, Street, "City State Country" (combine last parts)
      displayParts = [
        parts[0], // Course name
        parts[1], // Street address
        parts.slice(2).join(", "), // Combine city, state, country
      ];
    }

    // Return JSX with line breaks between parts
    return displayParts.map((part, index) => (
      <React.Fragment key={index}>
        {part}
        {index < displayParts.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  const usedCourseIds = useMemo(() => {
    const ids = new Set();
    activeTournament?.divisions?.forEach(division => {
      division.rounds?.forEach(round => {
        ids.add(round.courseId);
      });
    });
    return ids;
  }, [activeTournament?.divisions]);

  return (
    <div className="container d-flex flex-column align-items-center" name="coursesContainer">
      <Form.Group as={Row} className="mb-1">
        <Col>
          <Form.Label htmlFor="courseInputBox">Add a Course: </Form.Label>
        </Col>
        <Col sm={7} className="autocomplete-container">
          <Form.Control
            type="text"
            id="courseInputBoxId"
            name="courseInputBox"
            value={searchQuery}
            onChange={async event => {
              setSearchQuery(event.target.value);
              setDropDownOpen(event.target.value.length > 0);
            }}
            placeholder="Enter a course name"
            required
          />
          {dropDownOpen && searchQuery && (
            <ListGroup variant="flush" mb="1" className="autocomplete-results-wrapper">
              {isSearching ? (
                <ListGroup.Item className="text-center py-2">
                  <small className="text-muted">Searching...</small>
                </ListGroup.Item>
              ) : searchResult.length > 0 ? (
                searchResult.map(object => (
                  <ListGroup.Item key={object.id} className="autocomplete-item">
                    <button
                      type="button"
                      className="list-group-item btn-transparent"
                      id={object.id}
                      onClick={() => handleCourseSelectFromSearch(object.id)}
                      value={object.id}
                    >
                      {object.shortName}
                    </button>
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item className="text-center py-2">
                  <small className="text-muted">No results found</small>
                </ListGroup.Item>
              )}
            </ListGroup>
          )}
        </Col>
      </Form.Group>

      <div className="courses-container text-center" id="listOfCoursesDiv">
        <Table className="table table-striped align-middle courses-table">
          <thead>
            <tr>
              <th scope="col">Course</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {fields.map((field, index) => {
              const isCourseUsed = usedCourseIds.has(field.courseId);
              const isOnlyOneCourse = fields.length === 1;
              const cannotDelete = isCourseUsed || isOnlyOneCourse;

              let tooltipText = "Remove course";
              let ariaLabel = `Remove ${field.name} from tournament`;

              if (isOnlyOneCourse) {
                tooltipText = "Cannot delete the last course - at least one course is required";
                ariaLabel = `Cannot remove ${field.name} - at least one course is required`;
              } else if (isCourseUsed) {
                tooltipText = "Cannot remove course that is used in divisions";
                ariaLabel = `Cannot remove ${field.name} - course is used in divisions`;
              }

              return (
                <tr key={field.courseId}>
                  <td>{formatCourseNameForDisplay(field.name)}</td>
                  <td>
                    <i
                      type="button"
                      className="fa-solid fa-eye"
                      onClick={() => showCourseInfo(field)}
                      title="View course details"
                      aria-label={`View details for ${field.name}`}
                      style={{ cursor: "pointer" }}
                    ></i>
                    &nbsp;&nbsp;&nbsp;
                    <span
                      style={{
                        cursor: cannotDelete ? "not-allowed" : "pointer",
                        color: cannotDelete ? "gray" : "inherit",
                        pointerEvents: cannotDelete ? "none" : "auto",
                      }}
                    >
                      <i
                        type="button"
                        className={`fa-solid fa-trash ${cannotDelete ? "text-muted" : ""}`}
                        onClick={() => !cannotDelete && setCourseToDelete(field._id)}
                        title={tooltipText}
                        aria-label={ariaLabel}
                      ></i>
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      </div>
      <Modal
        show={!!selectedCourse}
        onHide={closeCourseInfoModal}
        size="xl"
        fullscreen="xl-down"
        contentLabel="Course Info"
      >
        {selectedCourse && <CourseInfo course={selectedCourse} onClose={closeCourseInfoModal} />}
      </Modal>
      <ModalDialog
        isOpen={!!courseToDelete}
        title="Delete Course?"
        body="Are you sure you want to delete this course?"
        actionBtnText="Yes, Delete Course"
        cancelBtnText="No, Cancel"
        close={() => setCourseToDelete(null)}
        onSubmit={() => {
          handleRemoveCourse(courseToDelete);
          setCourseToDelete(null);
        }}
      />
      <ModalDialog
        isOpen={!!duplicateCourse}
        title="Duplicate Course"
        body={`The course "${duplicateCourse?.name}" has already been added.`}
        actionBtnText="OK"
        close={() => setDuplicateCourse(null)}
        onSubmit={() => setDuplicateCourse(null)}
      />
    </div>
  );
};

export default TournamentCourses;
