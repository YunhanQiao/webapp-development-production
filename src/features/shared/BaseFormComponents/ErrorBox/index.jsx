import isEmpty from "lodash/isEmpty";
import ErrorMessage from "../ErrorMessage";
import React from "react";

const ErrorBox = ({ errors, entity = '' }) => {
  if (isEmpty(errors)) {
    return null;
  }

  return (
    <p id={`${entity}ErrorBox`} className="alert alert-danger centered">
      {Object.entries(errors).map(([key, error]) => {
        return <ErrorMessage key={key} id={key} ref={error.ref}>{error.message}</ErrorMessage>
      })}
    </p>
  )
}

export default ErrorBox;
