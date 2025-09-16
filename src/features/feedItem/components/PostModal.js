import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { setMedia, resetMedia } from "../feeditemSlice";

const PostModal = ({ isOpen, onClose, children }) => {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [fileInputKey, setFileInputKey] = useState(Date.now()); // Unique key to reset file input
  const dispatch = useDispatch();
  const media = useSelector(state => state.feeds.media);

  if (!isOpen) return null;

  const handleFileChange = event => {
    const file = event.target.files[0];
    if (file) {
      const fileData = {
        name: file.name,
        dataUrl: URL.createObjectURL(file),
      };
      dispatch(setMedia(fileData));
    }
  };

  // const handleRemoveFile = () => {
  //   setUploadedImage(null); // Clear the uploaded image
  //   setFileInputKey(Date.now()); // Reset the file input by changing its key
  // };

  const handleRemoveFile = () => {
    dispatch(resetMedia());
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(0, 0, 0, 0.5)", // Semi-transparent overlay
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "8px",
          width: "700px",
          padding: "20px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          position: "relative",
          animation: "fadeIn 0.3s ease-out",
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            background: "transparent",
            border: "none",
            fontSize: "24px",
            color: "#666",
            cursor: "pointer",
          }}
          onClick={onClose}
        >
          &times;
        </button>

        {/* Add File Upload */}
        <input type="file" accept="image/*,video/*" onChange={handleFileChange} />

        {/* Preview Media File */}
        {/* {media && (
          <div style={{ marginTop: "10px" }}>
            <button
              onClick={handleRemoveFile}
              style={{
            
                backgroundColor: "red",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                cursor: "pointer",
              }}
            >
              &times;
            </button>
            <img
              src={media.dataUrl}
              alt={media.name}
              style={{ maxWidth: "100px", maxHeight: "100px" }}
            />
          </div>
        )} */}
        {/* Preview Media File */}
        {/* Preview Media File */}
        {/* Preview Media File */}
        {media && (
          <div
            style={{
              marginTop: "10px",
              // position: "relative",  // Make the container relative for absolute positioning
              // display: "inline-block" // Keep elements inline
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
              }}
            >
              <img src={media.dataUrl} alt={media.name} style={{ maxWidth: "100px", maxHeight: "100px" }} />
              <button
                onClick={handleRemoveFile}
                style={{
                  backgroundColor: "#888888", // Changed to gray
                  color: "#fff",
                  border: "none",
                  borderRadius: "50%",
                  width: "18px", // Smaller size
                  height: "18px", // Smaller size
                  cursor: "pointer",
                  marginLeft: "5px", // Add space between image and button
                  fontSize: "12px", // Smaller text
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "0",
                }}
              >
                &times;
              </button>
            </div>
          </div>
        )}
        {/* Children passed from parent */}
        {children}
      </div>
    </div>
  );
};

export default PostModal;
