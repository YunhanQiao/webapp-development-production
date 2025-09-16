 /*************************************************************************
 * File: coursesModeEditModal.js
 * This file defines the CoursesModeEditModal React component, which 
 * displays a customizable modal dialog box for updating course details.
 * The component accepts the following props:
 *   title: The title to display in the dialog's header
 *   prompt: The prompt to present to the user in the dialog's body
 *   buttonLabel: The label that appears in the dialog's action button
 *   data: An object containing about the data to obtain through the dialog. 
 *   The data object consists of the following props:
 *     val: Value of the data item
 *     type: The type of the data item, needed so that the correct 
 *           input element can be used to obtain updated value. Recognized
 *           types include text, textarea, number, tel
 *     size: Number of characters a field should display (all types except
 *           number and tel)
 *     lines: Number of lines to display (textarea only)
 *     min:  Minimum value to accept (Number only)
 *     max:  Maximum value to accept (Number only)
 *     emptyAllowed: Whether blank response is allowed. If false, user will
 *                 not be allowed to save a blank value.
 *     disallowed: array of values that are disallowed. The dialog should 
 *                 disable the "Update" button if any of these values is
 *                 entered.
 *   updateData: Function to call to update the data item with new val
 *               when user chooses "Update" button in dialog
 *   cancelUpdate: Function to call to cancel updating data when user
 *                 chooses "Cancel" or "X" button
 *         
 ************************************************************************/

 import {useRef, useState, useEffect} from 'react';

export default function EditTextModal({title, prompt, buttonLabel, data, updateData, cancelUpdate}) {
const editModalRef = useRef();
const [val, setVal] = useState(data.val == undefined ? "" : data.val);

useEffect(() => {
    const bsModal =  window.bootstrap.Modal.getOrCreateInstance(editModalRef.current);
    bsModal.show();
},[]);

function handleChange(event) {
    setVal(event.target.value);
}

function closeAndCancel() {
    const bsModal =  window.bootstrap.Modal.getInstance(editModalRef.current);
    bsModal.hide();
    cancelUpdate();
}

function closeAndSave() {
    const bsModal =  window.bootstrap.Modal.getInstance(editModalRef.current);
    bsModal.hide();
    updateData(val);
}

return(
    <div ref={editModalRef} id="textEditModal" data-bs-backdrop="static" className="modal fade" tabIndex="-1">
    <div className="modal-dialog">
        <div className="modal-content">
        <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" aria-label="Close"
                    onClick={closeAndCancel}></button>
        </div>
        <div className="modal-body centered">
            <span>{prompt}</span><br></br>
            {data.type === "textarea" ? 
              <textarea cols={data.size ? data.size : 40 } 
                        rows={data.lines ? data.lines : 5}
                        value={val} onChange={handleChange} /> : 
            data.type === "number" ?
              <input type="number" value={val} onChange={handleChange} 
                     min={data.min ? data.min: 0}
                     max={data.max ? data.max: 100} /> :
              <input type={data.type} value={val} onChange={handleChange} 
                     size={data.size? data.size : 30} />}
        </div>
        <div className="modal-footer">
            <button type="button" className="btn btn-secondary" 
                    onClick={closeAndCancel}>
                Cancel
            </button>
            <button type="button" 
                    className={"btn btn-primary" + 
                    (((val === "" && !data.emptyAllowed) || 
                    (Array.isArray(data.disallowed) && 
                     data.disallowed.includes(val))) ? " disabled" : "")}
                    onClick={closeAndSave} >
                {buttonLabel}
            </button>
        </div>
        </div>
    </div>
  </div>
);

}