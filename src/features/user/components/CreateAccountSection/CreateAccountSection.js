import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { calculatePasswordStrength } from "../../../../services/userAuthenticationServices";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";

import {
  checkIfUserExistsInLocalDB,
  createAccount,
  fileToBase64,
} from "../../../../services/userAuthenticationServices";
import { useUserContext } from "../../../../components/contexts/UserContext";
import { notifyMessage } from "../../../../services/toasterServices";
import { useForm } from "react-hook-form";
import { TOOLTIP_CONTENTS, VALIDATION_ERRORS } from "./constants";
import isEmpty from "lodash/isEmpty";
import ErrorMessage from "../../../shared/BaseFormComponents/ErrorMessage";
import isoCountries from "iso-3166-1-alpha-2";
import iso3166 from "iso-3166-2";
import ProfilePictureCropper from "../../pages/ProfilePictureCropper";
import ModalDialog from "../../../shared/ModalDialog";
import { union } from "lodash";
import { useDispatch } from "react-redux";
import { createUserAccount } from "../../userActions";

const CreateAccountSection = () => {
  const navigate = useNavigate();
  // const { setUser } = useUserContext();

  const dispatch = useDispatch();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitted },
  } = useForm({
    reValidateMode: "onSubmit",
    shouldFocusError: false,
    defaultValues: {
      country: "US",
      parPreference: "",
    },
  });

  useEffect(() => {
    firstErrorRef?.current?.focus();
  }, [isSubmitted]);
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [tempImageData, setTempImageData] = useState(null);
  const [profilePic, setProfilePic] = useState(null);
  const [profilePicChanged, setProfilePicChanged] = useState(false);

  // Check if this registration is coming from a tournament page
  const [isRegistration, setIsRegistration] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passShow, setPassShow] = useState(false);
  const [repeatPassShow, setRepeatPassShow] = useState(false);
  const [previewSrc, setPreviewSrc] = useState(`https://avatars.dicebear.com/api/human/hello1.svg`);
  const firstErrorRef = useRef(null);
  const sortedCountryList = useMemo(() => {
    // Countries to show first inside select input
    const firstCountries = ["US", "GB", "NZ", "AU", "JP", "SE", "FI", "FR", "IE"];
    // Remove duplicates from the original list
    return union(firstCountries, isoCountries.getCodes());
  }, []);

  const openTooltipHandler = name => setActiveTooltip(name);
  const closeTooltipHandler = () => setActiveTooltip(null);
  const country = watch("country");
  useEffect(() => {
    const pendingTournamentRegistration = sessionStorage.getItem("pendingTournamentRegistration");
    setIsRegistration(!!pendingTournamentRegistration);
  }, []);

  const submitHandler = async values => {
    // Check if the user exists in local database
    // if (checkIfUserExistsInLocalDB(values.email)) {
    //   notifyMessage("error", "User account already exists", 3000, "colored", "top-center");
    //   navigate("/login");
    // } else {
    // * store the user in local db.
    // Check if this registration is coming from a tournament page
    //////////////////////////////////////////Not required...........................
    const pendingTournamentRegistration = sessionStorage.getItem("pendingTournamentRegistration");
    const isTournamentRegistration = !!pendingTournamentRegistration;
    // if (isTournamentRegistration) {
    //   setIsRegistration(true);
    // }

    const formValues = { ...values };
    if (profilePicChanged && profilePic) {
      formValues.profilePic = [profilePic];
    }
    //const enteredProfilePicFilePath = values.profilePic[0] || "";
    const enteredProfilePicFilePath = values && values.profilePic ? values.profilePic[0] : "";

    /*
      const { accountStoredInLocalDb, newAcct } = createAccount({
        ...values,
        profilePic: enteredProfilePicFilePath && (await fileToBase64(enteredProfilePicFilePath))
        // authenticated: newAcct.accountInfo.authenticated // most of the cases this will be true.
      });

      if (accountStoredInLocalDb) {
        // TODO: Remove the rounds property from user object to keep the user context clean
        setUser(newAcct);
        notifyMessage("success", "New Account created with email", 3000, "colored", "top-center");
        navigate("/login");
      } */

    // dispatch(createUserAccount(values, enteredProfilePicFilePath, navigate));
    // Pass the tournament registration flag to the action creator
    console.log("Pending tournament registration:", pendingTournamentRegistration);
    console.log("Is tournament registration?", isTournamentRegistration);
    console.log("checking the state of isRegistration", isRegistration);

    dispatch(createUserAccount(values, enteredProfilePicFilePath, navigate, isTournamentRegistration));
    // notifyMessage("success", "New Account created with email", 3000, "colored", "top-center");
    // navigate('/login');
    // }
  };
  const handleFileChange = event => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        //setPreviewSrc(reader.result);
        // Instead of immediately setting the preview, open the cropper
        setSelectedFile(file);
        setTempImageData(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviewSrc(`https://avatars.dicebear.com/api/human/hello1.svg`);
    }
  };
  const cancelButtonHandler = () => navigate("/login");
  // Add this handler function for when cropping is complete
  const handleCropComplete = ({ file, dataUrl }) => {
    setProfilePic(file);
    setPreviewSrc(dataUrl);
    setProfilePicChanged(true);
  };
  return (
    <div
      id="createAccountDialog"
      // class='mode-page hidden'
      className="mode-page"
      role="dialog"
      aria-modal="true"
      aria-labelledby="createAccountHeader"
    >
      <h1 id="createAccountHeader" className="mode-page-header">
        {isRegistration ? "Create Account & Register" : "Create Account"}
      </h1>
      {!isEmpty(errors) && (
        <p id="acctErrorBox" className="alert alert-danger centered">
          {Object.values(errors).map(({ ref, message }, idx) => (
            <ErrorMessage ref={idx === 0 ? firstErrorRef : null} key={ref.id} id={ref.id}>
              {message}
            </ErrorMessage>
          ))}
        </p>
      )}
      <form id="createAccountForm" className="centered" noValidate onSubmit={handleSubmit(submitHandler)}>
        <div className="mb-3">
          <label htmlFor="acctEmail" className="form-label">
            Email:
            <br />
            <input
              id="acctEmail"
              type="email"
              className="form-control centered"
              aria-describedby="acctEmailDescr"
              {...register("email", {
                pattern: {
                  value: /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/,
                  message: VALIDATION_ERRORS.EMAIL,
                },
                required: VALIDATION_ERRORS.EMAIL,
              })}
            />
          </label>
          <div id="acctEmailDescr" className="form-text">
            Enter a valid email address (e.g., 'name@domain.com').
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="password" className="form-label">
            Password:
            <br />
            <div className="password-field-wrapper">
              <input
                id="acctPassword"
                type={!passShow ? "password" : "text"}
                className="form-control centered"
                aria-describedby="acctPasswordDescr"
                style={{ paddingRight: "40px" }} // Add padding to make room for the icon
                {...register("password", {
                  required: VALIDATION_ERRORS.PASSWORD,
                  pattern: {
                    value: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/,
                    message: VALIDATION_ERRORS.PASSWORD,
                  },
                  onChange: e => setPasswordStrength(calculatePasswordStrength(e.target.value)),
                })}
              />
              <div
                className="show-hide-pass"
                style={{
                  backgroundColor: "transparent",
                  position: "absolute",
                  top: "50%",
                  right: "10px",
                  transform: "translateY(-50%)",
                }}
                onClick={() => setPassShow(!passShow)}
              >
                <FontAwesomeIcon icon={!passShow ? faEye : faEyeSlash} />
              </div>
            </div>
          </label>
          <div
            className={`password-strength strength-${passwordStrength}`}
            style={{ width: `${passwordStrength * 2}%` }}
          ></div>
          <p>Password strength: {passwordStrength}/5</p>
          <div id="acctPasswordDescr" className="form-text">
            Passwords must be at least 8 characters long with at least one number, one lower case letter, and one upper
            case letter.
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="acctPasswordRepeat" className="form-label">
            Repeat Password:
            <br />
            <div className="password-field-wrapper">
              <input
                id="acctPasswordRepeat"
                type={!repeatPassShow ? "password" : "text"}
                className="form-control centered"
                aria-describedby="acctPasswordRepeatDescr"
                style={{ paddingRight: "40px" }}
                {...register("passwordRepeat", {
                  required: VALIDATION_ERRORS.PASSWORD_REPEAT,
                  validate: val => {
                    if (watch("password") != val) {
                      return VALIDATION_ERRORS.PASSWORD_REPEAT;
                    }
                  },
                })}
              />
              <div
                className="show-hide-pass"
                style={{
                  backgroundColor: "transparent",
                  position: "absolute",
                  top: "50%",
                  right: "10px",
                  transform: "translateY(-50%)", // Center vertically
                }}
                onClick={() => setRepeatPassShow(!repeatPassShow)}
              >
                <FontAwesomeIcon icon={!repeatPassShow ? faEye : faEyeSlash} />
              </div>
            </div>
          </label>

          <div id="acctPasswordRepeatDescr" className="form-text">
            Re-enter password, making sure it exactly matches.
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="acctDisplayName" className="form-label">
            {/* Display Name: */}
            First Name:
            <br />
            <input
              id="userFirstName"
              type="text"
              className="form-control centered"
              minLength="1"
              aria-describedby="displayNameDescr"
              {...register("firstName", {
                required: VALIDATION_ERRORS.FIRST_NAME,
                minLength: {
                  value: 1,
                  message: VALIDATION_ERRORS.FIRST_NAME,
                },
              })}
            />
          </label>
          <div id="acctDisplayNameDescr" className="form-text">
            Your first name is your identity within SpeedScore. It must be at least 1 character.
          </div>
          <a
            href="#"
            onClick={() => openTooltipHandler("NAME")}
            style={{ fontSize: "0.8rem", display: "block", margin: "0 auto", width: "fit-content" }}
          >
            What if I don't want to reveal my name?
          </a>
          <ModalDialog
            isOpen={activeTooltip == "NAME"}
            close={closeTooltipHandler}
            {...TOOLTIP_CONTENTS[activeTooltip]}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="acctDisplayName" className="form-label">
            Last Name:
            <br />
            <input
              id="userLastName"
              type="text"
              className="form-control centered"
              minLength="1"
              aria-describedby="displayNameDescr"
              {...register("lastName", {
                required: VALIDATION_ERRORS.LAST_NAME,
                minLength: {
                  value: 1,
                  message: VALIDATION_ERRORS.LAST_NAME,
                },
              })}
            />
          </label>
          <div id="acctDisplayNameDescr" className="form-text">
            Your last name is your identity within SpeedScore. It must be at least 1 character.
          </div>
        </div>
        <div className="mb-3">
          <label htmlFor="dob" className="form-label">
            Date of Birth:
            <br />
            <input
              id="dob"
              type="date"
              className="form-control centered"
              {...register("dateOfBirth", { required: VALIDATION_ERRORS.DATE_OF_BIRTH })}
            />
          </label>
          <a
            href="#"
            onClick={() => openTooltipHandler("DATE_OF_BIRTH")}
            style={{ fontSize: "0.8rem", display: "block", margin: "0 auto", width: "fit-content" }}
          >
            Why are you asking for my date of birth?
          </a>
          <ModalDialog
            isOpen={activeTooltip == "DATE_OF_BIRTH"}
            close={closeTooltipHandler}
            {...TOOLTIP_CONTENTS[activeTooltip]}
          />
        </div>
        <div className="mb-3">
          <fieldset>
            <label htmlFor="parPreference" className="form-label">
              Gender for Stroke and Time Pars:
            </label>
            <select
              id="parPreference"
              style={{ display: "block", margin: "0 auto", width: "fit-content" }} // Adjusted styles here
              className="form-control centered"
              defaultValue="default"
              {...register("parPreference", { required: VALIDATION_ERRORS.GENDER })}
            >
              <option value="" disabled>
                Select one
              </option>
              <option value="mens">I will use men's stroke and time pars</option>
              <option value="womens">I will use women's stroke and time pars</option>
            </select>
            <a
              href="#"
              onClick={() => openTooltipHandler("NON_BINARY")}
              style={{ fontSize: "0.8rem", display: "block", margin: "0 auto", width: "fit-content" }}
            >
              What if I'm non-binary?
            </a>
            <ModalDialog
              isOpen={activeTooltip == "NON_BINARY"}
              close={closeTooltipHandler}
              {...TOOLTIP_CONTENTS[activeTooltip]}
            />
          </fieldset>
        </div>

        <div className="mb-3">
          <label htmlFor="hometown" className="form-label">
            Hometown:
            <br />
            <input
              id="city"
              type="text"
              className="form-control centered"
              {...register("hometown", { required: VALIDATION_ERRORS.HOMETOWN })}
            />
          </label>
          <a
            href="#"
            onClick={() => openTooltipHandler("HOMETOWN")}
            style={{ fontSize: "0.8rem", display: "block", margin: "0 auto", width: "fit-content" }}
          >
            Why are you asking for my hometown?
          </a>
          <ModalDialog
            isOpen={activeTooltip == "HOMETOWN"}
            close={closeTooltipHandler}
            {...TOOLTIP_CONTENTS[activeTooltip]}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="country" className="form-label">
            Country:
          </label>
          <select
            id="country"
            style={{ display: "block", margin: "0 auto", width: "fit-content" }} // Adjusted styles here
            className="form-control centered"
            {...register("country", { required: VALIDATION_ERRORS.COUNTRY })}
          >
            {sortedCountryList.map(code => (
              <option key={code} value={code}>
                {isoCountries.getCountry(code)} ({code})
              </option>
            ))}
          </select>
          <a
            href="#"
            onClick={() => openTooltipHandler("COUNTRY")}
            style={{ fontSize: "0.8rem", display: "block", margin: "0 auto", width: "fit-content" }}
          >
            Why are you asking for my home country?
          </a>
          <ModalDialog
            isOpen={activeTooltip == "COUNTRY"}
            close={closeTooltipHandler}
            {...TOOLTIP_CONTENTS[activeTooltip]}
          />
        </div>
        <div className="mb-3">
          <label htmlFor="state" className="form-label">
            Home State/Province:
            <br />
            <select
              id="state"
              className="form-control centered"
              {...register("state", { required: VALIDATION_ERRORS.STATE })}
            >
              {country &&
                Object.values(iso3166.country(country).sub).map(subdivision => (
                  <option key={subdivision.iso} value={subdivision.iso}>
                    {subdivision.name}
                  </option>
                ))}
            </select>
          </label>
          <a
            href="#"
            onClick={() => openTooltipHandler("STATE")}
            style={{ fontSize: "0.8rem", display: "block", margin: "0 auto", width: "fit-content" }}
          >
            Why are you asking for my home state/province?
          </a>
          <ModalDialog
            isOpen={activeTooltip == "STATE"}
            close={closeTooltipHandler}
            {...TOOLTIP_CONTENTS[activeTooltip]}
          />
        </div>
        <div className="mb-3">
          {/* <label htmlFor='profilePic' className='form-label'>
            Profile Picture{" "}
            <a
              href='#'
              onClick={() => openTooltipHandler("PICTURE")}
              style={{ fontSize: "0.8rem", margin: "0 auto", width: "fit-content" }}
            >
              (Optional but recommended)
            </a>
            <br />
            <img
              id='profilePicImage'
              src={profilePic || `https://avatars.dicebear.com/api/human/hello1.svg`}
              className='fm-profile-pic'
              height='46'
              width='auto'
            />
            <input
              id='profilePic'
              type='file'
              className='form-control centered'
              accept='.png, .gif, .jpg'
              aria-describedby='profilePicDescr'
              {...register("profilePic")}
            />
          </label> */}
          <label htmlFor="profilePic" className="form-label">
            Profile Picture{" "}
            <a
              href="#"
              onClick={() => openTooltipHandler("PICTURE")}
              style={{ fontSize: "0.8rem", margin: "0 auto", width: "fit-content" }}
            >
              (Optional but recommended)
            </a>
            <br />
            <img id="profilePicImage" src={previewSrc} className="fm-profile-pic" height="46" width="auto" />
            <input
              id="profilePic"
              type="file"
              className="form-control centered"
              accept=".png, .gif, .jpg"
              aria-describedby="profilePicDescr"
              //onChange={handleFileChange}
              //{...register("profilePic")}
              {...register("profilePic", {
                onChange: e => {
                  handleFileChange(e);
                  e.target.value = null; // Clear input value
                },
              })}
            />
          </label>
          <div id="profilePicDescr" className="form-text">
            Upload a profile picture as a .png, .gif, or .jpg file. You'll be able to crop and adjust it after
            selection..
          </div>
          {/* Image Cropper Modal */}
          {showCropper && (
            <ProfilePictureCropper
              onCropComplete={handleCropComplete}
              showCropper={showCropper}
              setShowCropper={setShowCropper}
              initialImage={tempImageData}
              imageName={selectedFile?.name || "profile_picture.png"}
            />
          )}
          <ModalDialog
            isOpen={activeTooltip == "PICTURE"}
            close={closeTooltipHandler}
            {...TOOLTIP_CONTENTS[activeTooltip]}
          />
        </div>
        <div className="mode-page-btn-container">
          <button
            type="submit"
            id="submitCreateAccountBtn"
            className="btn btn-primary dialog-primary-btn"
            aria-live="polite"
            aria-loading="false"
          >
            <span id="createAccountBtnIcon" className="fas fa-user-plus" aria-hidden="true"></span>
            &nbsp;{isRegistration ? "Log In & Register" : "Create Account"}
          </button>
          <button
            type="button"
            id="cancelCreateAccountBtn"
            className="btn btn-secondary dialog-cancel-btn"
            onClick={cancelButtonHandler}
          >
            <span className="fas fa-window-close" aria-hidden="true"></span>
            &nbsp;Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateAccountSection;
