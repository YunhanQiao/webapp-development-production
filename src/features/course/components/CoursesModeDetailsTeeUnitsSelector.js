import { useState } from "react";
import { useTeeUnits, useTeeUnitsDispatch } from "../../../components/contexts/TeeUnitsContext";
import { useCourse, useCourseDispatch } from "../../../components/contexts/CourseContext";
import EditTextModal from "./EditTextModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function CoursesModeDetailsTeeUnitsSelector() {
  const teeUnits = useTeeUnits();
  const teeUnitsDispatch = useTeeUnitsDispatch();
  const courseDispatch = useCourseDispatch();
  const currentCourse = useCourse();
  const [addEditTeeDialog, setAddEditTeeDialog] = useState({ show: false });

  /*************************************************************************
   * @function toggleUnits
   * @param event, the event object returned by the event handler
   * @Desc
   * Set the distance units when the user clicks on "Imperial" or "Metric"
   * radio button.
   *************************************************************************/
  function toggleUnits(event) {
    teeUnitsDispatch({ type: "UPDATE_SELECTED_UNITS", selectedUnits: event.target.value });
  }

  /*************************************************************************
   * @function handleSelectedTeeChange
   * @param event, the event object returned by the event handler
   * @Desc
   * Update the selected tee when the user wants to change the tee from the
   * dropdown.
   *************************************************************************/
  function handleSelectedTeeChange(event) {
    teeUnitsDispatch({ type: "UPDATE_SELECTED_TEE", selectedTee: event.target.value });
  }

  /*************************************************************************
   * @function addEditTee
   * @param teeName, the name of the tee being added or edited
   * @Desc
   * If the user is changing the name of the current tee, update that name.
   * Otherwise, add a new tee with name teeName and set it as current tee.
   *************************************************************************/
  function addEditTee(teeName) {
    if (addEditTeeDialog.prevTee === "") {
      // Adding a new tee
      courseDispatch({ type: "ADD_TEE", teeName: teeName });
      teeUnitsDispatch({ type: "UPDATE_SELECTED_TEE", selectedTee: teeName });
    } else {
      // Editing the name of the current tee
      courseDispatch({ type: "UPDATE_TEE_NAME", prevTeeName: addEditTeeDialog.prevTee, newTeeName: teeName });
      teeUnitsDispatch({ type: "UPDATE_SELECTED_TEE", selectedTee: teeName });
    }
    setAddEditTeeDialog({ show: false });
  }

  /*************************************************************************
   * @function cancelAddEditTee
   * @Desc
   * Close the Add/Edit tee dialog box without making changes.
   *************************************************************************/
  function cancelAddEditTee() {
    setAddEditTeeDialog({ show: false });
  }

  /*************************************************************************
   * @function openAddEditTeeDialog
   * @param editing, a boolean indicating whether the user is editing the
   * name of the current tee
   * @Desc
   * Open a dialog box to allow the user to either edit the current tee's
   * name or add a new tee.
   *************************************************************************/
  function openAddEditTeeDialog(editing) {
    const dialogData = {
      val: editing ? teeUnits.selectedTee : "",
      type: "text",
      size: 20,
      emptyAllowed: false,
      disallowed: currentCourse.tees === "" ? [] : Object.keys(currentCourse.tees)
    };
    setAddEditTeeDialog({ show: true, data: dialogData, prevTee: editing ? teeUnits.selectedTee : "" });
  }

  return addEditTeeDialog.show ? (
    <EditTextModal
      title={addEditTeeDialog.prevTee === "" ? "Add Tee" : "Update Tee Name"}
      prompt={addEditTeeDialog.prevTee === "" ? "Enter a new tee name:" : "Enter updated name for tee:"}
      buttonLabel={addEditTeeDialog.prevTee === "" ? "Add" : "Update"}
      data={addEditTeeDialog.data}
      updateData={addEditTee}
      cancelUpdate={cancelAddEditTee}
    />
  ) : (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
    <div style={{ marginRight: '70px', textAlign: 'center' }}>
      <label className='form-label-center' htmlFor='selectedTee'>
        Selected Tee:
      </label>
    </div>
    <div style={{ textAlign: 'center' }}>
      <label className='form-label-center'>
        Distance Units:
      </label>
    </div>
  </div>
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: '10px' }}>
    <div style={{ marginRight: '20px', display: 'flex', alignItems: 'center' }}>
      <select
        className='form-select-sm centered'
        tabIndex='4'
        value={teeUnits.selectedTee === null ? "" : teeUnits.selectedTee}
        id='selectedTee'
        onChange={handleSelectedTeeChange}
        style={{ marginRight: '10px' }}
      >
        {teeUnits.selectedTee === null ? (
          <option value='No tees defined'>Choose '+' to add a tee</option>
        ) : (
          Object.keys(currentCourse.tees).map(t => {
            return (
              <option key={t} value={t}>
                {t}
              </option>
            );
          })
        )}
      </select>
      <button
        className='btn-theme'
        aria-label='Add New Tee'
        tabIndex='5'
        onClick={() => openAddEditTeeDialog(false)}
        title='Add a set of tees'
        style={{ marginRight: '10px' }}
      >
        <FontAwesomeIcon icon='plus' />
      </button>
      {teeUnits.selectedTee === null ? null : (
        <button
          className='btn-theme'
          aria-label='Edit Name of Tee'
          tabIndex='6'
          onClick={() => openAddEditTeeDialog(true)}
          title='Edit name of selected set of tees'
        >
          <FontAwesomeIcon icon='edit' />
        </button>
      )}
    </div>
    <div style={{ display: 'flex', alignItems: 'center' }}>
      <div className='form-check form-check-inline' style={{ marginRight: '10px' }}>
        <input
          className='form-check-input'
          type='radio'
          name='Imperial'
          id='Imperial'
          tabIndex='7'
          onChange={toggleUnits}
          value='Imperial'
          checked={teeUnits.selectedUnits === "Imperial"}
        />
        <label className='form-check-label' htmlFor='Imperial'>
          Imperial
        </label>
      </div>
      <div className='form-check form-check-inline'>
        <input
          className='form-check-input'
          type='radio'
          name='Metric'
          id='Metric'
          tabIndex='8'
          onChange={toggleUnits}
          value='Metric'
          checked={teeUnits.selectedUnits === "Metric"}
        />
        <label className='form-check-label' htmlFor='Metric'>
          Metric
        </label>
      </div>
    </div>
  </div>
</div>

  );
}
