import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

const FloatingButton = ({ action, icon, label }) => {
  return (
    <button id="roundsModeActionBtn" type="button"
            className="float-btn" onClick={action}>
      <FontAwesomeIcon icon={icon} />
      &nbsp;{label}
    </button>
  );
};

export default FloatingButton;
