const CircleInput = ({ isStrokesInvalid, registerStrokesInput, getDisabledStatus }) => {
  const classNames = `form-control form-control-sm text-center ${isStrokesInvalid ? "is-invalid" : ""} single-circular-input`;
  return (
    <>
      <style>
        {`
          .single-circular-input {
            width: 25px; /* Circular size */
            height: 25px;
            text-align: center;
            font-size: 10px; /* Font size for number */
            font-weight: bold; /* Bold number */
            color: #333; /* Text color */
            border: 2px solid #888; /* Border color */
            border-radius: 50%; /* Makes the input circular */
            background-color: #fff; /* White background */
            outline: none; /* Remove blue outline on focus */
            appearance: textfield; /* Remove spinner (optional) */
          }

          .single-circular-input:focus {
            border-color: #555; /* Darker border on focus */
            box-shadow: 0 0 5px rgba(0, 0, 0, 0.2); /* Subtle shadow on focus */
          }
        `}
      </style>
      <input
        type="number"
        className={classNames}
        min="1"
        max="99"
        aria-describedby="roundStrokesDescr"
        {...registerStrokesInput()}
        disabled={getDisabledStatus()}
      />
    </>
  );
};

export default CircleInput;
