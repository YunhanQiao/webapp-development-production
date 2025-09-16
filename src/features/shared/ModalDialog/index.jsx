import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";

const ModalDialog = ({
  title,
  body,
  actionBtnText,
  cancelBtnText = "Close",
  isOpen,
  close,
  onSubmit,
  actionBtnVariant = "danger",
  cancelBtnVariant = "secondary",
  actionBtnStyle,
  cancelBtnStyle,
  size = "md",
  className = "",
}) => {
  return (
    <Modal show={isOpen} onHide={close} centered size={size} className={className}>
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{body}</Modal.Body>
      <Modal.Footer>
        <Button variant={cancelBtnVariant} style={cancelBtnStyle} onClick={close}>
          {cancelBtnText}
        </Button>
        {actionBtnText && (
          <Button
            variant={actionBtnVariant}
            style={actionBtnStyle}
            onClick={() => {
              onSubmit();
              close();
            }}
          >
            {actionBtnText}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ModalDialog;
