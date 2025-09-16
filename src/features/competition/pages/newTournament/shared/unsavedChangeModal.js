import React from "react";
import { Modal, Button } from "react-bootstrap";

const UnsavedChangesModal = ({ isOpen, onConfirm, onCancel, onClose }) => {
  return (
    <Modal show={isOpen} onHide={onClose} keyboard={true}>
      <Modal.Header closeButton>
        <Modal.Title>Unsaved Changes</Modal.Title>
      </Modal.Header>
      <Modal.Body>You have unsaved changes. Do you want to save before leaving?</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onCancel}>
          No, Discard Changes
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Yes, Save Changes
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

const ExitConfirmationModal = ({ isOpen, onConfirm, onClose }) => {
  return (
    <Modal show={isOpen} onHide={onClose} keyboard={true}>
      <Modal.Header closeButton>
        <Modal.Title>Confirm Exit</Modal.Title>
      </Modal.Header>
      <Modal.Body>Are you sure you want to exit?</Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onConfirm}>
          Yes, Exit
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default { UnsavedChangesModal, ExitConfirmationModal };
