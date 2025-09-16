 /*************************************************************************
 * File: EditImageModal.js
 * This file defines the EditImageModal React component, which 
 * displays a  modal dialog box for editing an image with image preview.
 * Only valid (i.e., unbroken) images may be saved.  
 ************************************************************************/
// import DefaultGolfCoursePic from '../../images/DefaultGolfCoursePic.jpg';
import DefaultGolfCoursePic from '../../../images/DefaultGolfCoursePic.jpg';
import {useRef, useState, useEffect} from 'react';

export default function EditImageModal({title, prompt, imageUrl, updateImage, cancelUpdate}) {
const imageEditModalRef = useRef();
const previewImageRef = useRef();
const updateImageBtnRef = useRef();
const [val, setVal] = useState(imageUrl == undefined ? "" : imageUrl);

useEffect(() => {
    const bsModal =  window.bootstrap.Modal.getOrCreateInstance(imageEditModalRef.current);
    bsModal.show();
},[]);

function handleChange(event) {
    setVal(event.target.value);
}

function invalidImage() {
    updateImageBtnRef.current.classList.add("disable-btn");
    previewImageRef.current.setAttribute("alt","Invalid image");
}

function validImage() {
    updateImageBtnRef.current.classList.remove("disable-btn");
}

function closeAndCancel() {
    const bsModal =  window.bootstrap.Modal.getInstance(imageEditModalRef.current);
    bsModal.hide();
    cancelUpdate();
}

function closeAndUpdate() {
    const bsModal =  window.bootstrap.Modal.getInstance(imageEditModalRef.current);
    bsModal.hide();
    updateImage(val);
}

return(
    <div ref={imageEditModalRef} id="imageEditModal" data-bs-backdrop="static" className="modal fade" tabIndex="-1">
    <div className="modal-dialog">
        <div className="modal-content">
        <div className="modal-header">
            <h5 className="modal-title">Update Course Image</h5>
            <button type="button" className="btn-close" aria-label="Close"
                    onClick={closeAndCancel}>
            </button>
        </div>
        <div className="modal-body centered">
            <h6>Image Preview</h6>
            <img ref={previewImageRef} 
                 src={val === "Default" ? DefaultGolfCoursePic : val} alt="Preview" width="200" 
                 onError={invalidImage} onLoad={validImage} />
            <br></br><br></br>
            <span>Enter URL of Course Image:</span><br></br>
            <input type="url" size="30" className="centered"
                   value={val} onChange={handleChange}/>
        </div>
        <div className="modal-footer">
            <button type="button" className="btn btn-secondary" 
                    onClick={closeAndCancel}>
                Cancel
            </button>
            <button ref={updateImageBtnRef} type="button" className="btn btn-primary" 
                    onClick={closeAndUpdate}>
                Update Image
            </button>
        </div>
        </div>
    </div>
</div>
);

}