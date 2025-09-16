import React, { useState, useCallback, useRef, useEffect } from "react";
import ReactCrop, { centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";

function centerAspectCrop(mediaWidth, mediaHeight, aspect) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  );
}

export default function ProfilePictureCropper({
  onCropComplete,
  showCropper,
  setShowCropper,
  initialImage,
  imageName = "profile_picture.png",
}) {
  const [imgSrc, setImgSrc] = useState("");
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState(null);
  const [scale, setScale] = useState(1);
  const [rotate, setRotate] = useState(0);
  const imageRef = useRef(null);
  const previewCanvasRef = useRef(null);
  const aspect = 1; // Square crop for profile picture

  // Set initial image when component mounts or initialImage changes
  useEffect(() => {
    if (initialImage) {
      setImgSrc(initialImage);
    }
  }, [initialImage]);

  const onImageLoad = useCallback(
    e => {
      const { width, height } = e.currentTarget;
      const newCrop = centerAspectCrop(width, height, aspect);
      setCrop(newCrop);
      setCompletedCrop(newCrop); // Set completedCrop immediately to show preview
    },
    [aspect],
  );

  const handleCancel = () => {
    setShowCropper(false);
  };

  // Function to update the preview canvas
  const updatePreview = useCallback(() => {
    if (!completedCrop || !imageRef.current || !previewCanvasRef.current) {
      return;
    }

    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      return;
    }

    // Calculate scale ratios
    const scaleX = imageRef.current.naturalWidth / imageRef.current.width;
    const scaleY = imageRef.current.naturalHeight / imageRef.current.height;
    const pixelRatio = window.devicePixelRatio || 1;

    // Set canvas dimensions
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;

    // Configure the canvas context
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = "high";

    // Calculate crop dimensions
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;

    // Apply transformations
    ctx.save();
    ctx.translate(canvas.width / (2 * pixelRatio), canvas.height / (2 * pixelRatio));
    ctx.rotate((rotate * Math.PI) / 180);
    ctx.scale(scale, scale);
    ctx.translate(-canvas.width / (2 * pixelRatio), -canvas.height / (2 * pixelRatio));

    // Draw the cropped image to the canvas
    ctx.drawImage(
      imageRef.current,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );

    ctx.restore();
  }, [completedCrop, scale, rotate]);

  // Update preview when completedCrop, scale, or rotate changes
  useEffect(() => {
    if (completedCrop && imageRef.current && previewCanvasRef.current) {
      // Use requestAnimationFrame to ensure the DOM has updated
      requestAnimationFrame(() => {
        updatePreview();
      });
    }
  }, [completedCrop, scale, rotate, updatePreview]);

  const handleApplyCrop = () => {
    if (!completedCrop || !imageRef.current || !previewCanvasRef.current) {
      return;
    }

    const canvas = previewCanvasRef.current;

    // Get data URL and pass to parent component
    canvas.toBlob(blob => {
      if (!blob) return;

      // Create a new File object from the blob
      const file = new File([blob], imageName, { type: "image/png" });

      // Pass both the file and data URL to parent
      onCropComplete({
        file,
        dataUrl: canvas.toDataURL("image/png"),
      });

      setShowCropper(false);
    }, "image/png");
  };

  return (
    <Modal
      show={showCropper}
      onHide={handleCancel}
      centered
      size="lg"
      backdrop="static"
      className="profile-cropper-modal"
      dialogClassName="modal-dialog-centered"
    >
      <Modal.Header closeButton>
        <Modal.Title>Crop Profile Picture</Modal.Title>
      </Modal.Header>
      <Modal.Body className="overflow-auto">
        <div className="profile-cropper-container">
          {imgSrc && (
            <>
              <div className="d-flex flex-row flex-wrap">
                <div className="crop-main-area">
                  <div className="crop-controls mb-3">
                    <div className="mb-2">
                      <label htmlFor="scale-input" className="form-label">
                        Scale: {scale.toFixed(1)}x
                      </label>
                      <input
                        id="scale-input"
                        type="range"
                        min="0.5"
                        max="3"
                        step="0.1"
                        value={scale}
                        className="form-range"
                        onChange={e => setScale(Number(e.target.value))}
                      />
                    </div>
                    <div>
                      <label htmlFor="rotate-input" className="form-label">
                        Rotate: {rotate}°
                      </label>
                      <input
                        id="rotate-input"
                        type="range"
                        min="-180"
                        max="180"
                        step="1"
                        value={rotate}
                        className="form-range"
                        onChange={e => setRotate(Number(e.target.value))}
                      />
                    </div>
                  </div>
                  <div className="crop-container">
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => {
                        setCrop(percentCrop);
                        setCompletedCrop(percentCrop); // Update completedCrop on every change
                      }}
                      onComplete={c => setCompletedCrop(c)}
                      aspect={aspect}
                      circularCrop
                    >
                      <img
                        ref={imageRef}
                        alt="Crop me"
                        src={imgSrc}
                        style={{ transform: `scale(${scale}) rotate(${rotate}deg)` }}
                        onLoad={onImageLoad}
                      />
                    </ReactCrop>
                  </div>
                </div>

                <div className="crop-preview-container">
                  <h6 className="text-center">Preview</h6>
                  <div className="crop-preview">
                    <canvas
                      ref={previewCanvasRef}
                      style={{
                        display: !completedCrop ? "none" : "block",
                        width: 150,
                        height: 150,
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div className="mt-3">
                    <p className="text-muted small">This is how your profile picture will appear</p>
                  </div>
                </div>
              </div>

              <div className="crop-instructions mt-3">
                <p className="text-muted small">
                  Drag to position, use sliders to scale and rotate. The preview updates automatically as you make
                  changes.
                </p>
              </div>
            </>
          )}
          {!imgSrc && (
            <div className="text-center p-4">
              <p>No image loaded. Please select an image first.</p>
            </div>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between">
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleApplyCrop} disabled={!completedCrop}>
          Apply
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
