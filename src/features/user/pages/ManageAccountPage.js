import { useNavigate } from "react-router-dom";
import Navbar from "../../shared/Navbar/Navbar";
import { useEffect, useRef, useState, useMemo } from "react";

import {
  displayNameValidator,
  emailValidator,
  fileToBase64,
  passwordValidator,
} from "../../../services/userAuthenticationServices";
import { useUserContext } from "../../../components/contexts/UserContext";
import { cloneDeep, set, union } from "lodash";
import { notifyMessage } from "../../../services/toasterServices";
import isoCountries from "iso-3166-1-alpha-2";
import iso3166 from "iso-3166-2";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import { useForm } from "react-hook-form";
import { TOOLTIP_CONTENTS, VALIDATION_ERRORS } from "../components/CreateAccountSection/constants";
import AddCourseAutocomplete from "../../../components/AddCourseAutocomplete";
import { useDispatch } from "react-redux";
import { setUser } from "../userSlice";
import { useSelector } from "react-redux";
import { getUser, updateUser } from "../userActions";
import { convertClubsToShorthand, formatDateToMMDDYYYY, getShorthand } from "../utils";
import ProfilePictureCropper from "./ProfilePictureCropper";

// const fetchClubStatus = (clubs, club) => (clubs[club] ? clubs[club] : false);

const fetchClubStatus = (clubs, club) => {
  if (Array.isArray(clubs)) {
    return clubs.includes(getShorthand(club));
  } else if (typeof clubs === "object" && clubs !== null) {
    return clubs[club] !== undefined ? clubs[club] : false;
  }
  return false;
};

const ManageAccount = () => {
  const navigate = useNavigate();
  // const { user, setUser } = useUserContext();
  const userState = useSelector(state => state.user);
  const user = userState.user;
  const dispatch = useDispatch();
  // let userAuthenticated = user?.accountInfo?.authenticated || false;
  let userAuthenticated = userState.authenticated;
  const userId = user._id;
  const jwt = userState.tokens.jwtToken;
  const loadingState = user.isLoading;

  const cancelButtonClickHandler = () => {
    navigate(-1);
  };

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitted },
  } = useForm({
    reValidateMode: "onSubmit",
    shouldFocusError: false,
    defaultValues: {
      country: user?.personalInfo?.homeCountry || "US",
      parPreference: "",
    },
  });

  // const { data, isLoading, isFetching, error: fetchError} = useGetUserQuery()

  const [email, setEmail] = useState(user?.accountInfo?.email || null);
  const [password, setPassword] = useState(user?.accountInfo?.password || null);
  const [securityAnswer, setSecurityAnswer] = useState(user?.accountInfo?.securityAnswer || null);
  // const [displayName, setDisplayName] = useState(user.identityInfo.displayName);
  const [displayName, setDisplayName] = useState(user?.personalInfo?.firstName || null);
  const [firstName, setFirstName] = useState(user?.personalInfo?.firstName || null);
  const [lastName, setLastName] = useState(user?.personalInfo?.lastName || null);
  const dobParsed = formatDateToMMDDYYYY(user?.personalInfo?.birthdate || null);
  const [dateOfBirth, setDateOfBirth] = useState(dobParsed);
  const [hometown, sethometown] = useState(user?.personalInfo?.hometown || null);
  const [state, setState] = useState(user?.personalInfo?.homeState || null);
  const [country, setCountry] = useState(user?.personalInfo?.homeCountry || null);
  const [profilePic, setProfilePic] = useState(user?.personalInfo?.profilePic || null);
  const [profilePicPreview, setProfilePicPreview] = useState(user?.personalInfo?.profilePic || null);
  // const [parPreference, setParPreference] = useState(user.identityInfo.parPreference);

  const [parPreference, setParPreference] = useState(user?.personalInfo?.parGender || null);
  // const [isSensitiveInfoPublic, setIsSensitiveInfoPublic] = useState(user.privacyInfo.isSensitiveInfoPublic);
  const [isSensitiveInfoPublic, setIsSensitiveInfoPublic] = useState({
    parGenderIsPrivate: user?.preferences?.parGenderIsPrivate || false,
    homeLocationIsPrivate: user?.preferences?.homeLocationIsPrivate || false,
    birthdateIsPrivate: user?.preferences?.birthdateIsPrivate || false,
    speedgolfInfoIsPrivate: user?.preferences?.speedgolfInfoIsPrivate || false,
    speedgolfRoundsArePublic: user?.preferences?.speedgolfRoundsArePublic || false,
    speedgolfStatsArePublic: user?.preferences?.speedgolfStatsArePublic || false,
    feedPostsArePublic: user?.preferences?.feedPostsArePublic || false,
  });

  const pU = user?.preferences?.preferredUnits || "";
  const [preferredUnit, setPreferredUnit] = useState(pU);
  // const [parGender, setParGender] = useState(user.privacyInfo.isSensitiveInfoPublic.parGender);
  // const [birthdate, setBirthdate] = useState(user.privacyInfo.isSensitiveInfoPublic.birthdate);
  // const [location, setLocation] = useState(user.privacyInfo.isSensitiveInfoPublic.location);
  // const [speedgolfInfo, setSpeedgolfInfo] = useState(user.speedgolfInfo.bio);

  // const [rounds, setRounds] = useState(user.privacyInfo.isSensitiveInfoPublic.rounds);
  // const [stats, setStats] = useState(user.privacyInfo.isSensitiveInfoPublic.stats);
  // const [posts, setPosts] = useState(user.privacyInfo.isSensitiveInfoPublic.posts);

  const [bio, setBio] = useState(user?.speedgolfInfo?.bio || null);
  const [firstRound, setFirstRound] = useState(
    (userAuthenticated && user.speedgolfInfo?.firstRound) || false ? user.speedgolfInfo.firstRound : "2021-07",
  );
  const [homeCourse, setHomeCourse] = useState(
    (userAuthenticated && user.speedgolfInfo?.homeCourse) || false ? user.speedgolfInfo.homeCourse : "",
  );
  // ['1W','3W','4W','5W','7W', 'HY', '2I','3I','4I',
  // '5I','6I','7I','8I','9I','PW','SW','GW','LW','P']
  const [clubs, setClubs] = useState({
    sgDriver: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sgDriver"),
    sg3W: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sg3W"),
    sg4W: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sg4W"),
    sg5W: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sg5W"),
    sg7W: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sg7W"),
    sgHybrid: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sgHybrid"),
    // sg1I: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sg1I"),
    sg2I: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sg2I"),
    sg3I: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sg3I"),
    sg4I: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sg4I"),
    sg5I: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sg5I"),
    sg6I: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sg6I"),
    sg7I: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sg7I"),
    sg8I: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sg8I"),
    sg9I: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sg9I"),
    sgPW: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sgPW"),
    sgGW: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sgGW"),
    sgSW: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sgSW"),
    sgLW: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sgLW"),
    sgPutter: fetchClubStatus(user.speedgolfInfo?.clubs || {}, "sgPutter"),
  });
  const [clubComments, setClubComments] = useState(user.speedgolfInfo?.clubNotes || "");
  const [profilePicChanged, setProfilePicChanged] = useState(false);

  // Course states
  const [formFields, setFormFields] = useState({ course: null, validCourse: null });

  // useEffect(() => {
  //   setHomeCourse(formFields.course);
  // }, [formFields]);

  // ERROR STATES
  const [emailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [dobError, setDobError] = useState(false);
  const [hometownError, setHometownError] = useState(false);
  const [stateError, setStateError] = useState(false);
  const [parPreferenceError, setParPreferenceError] = useState(false);
  const [error, setError] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [showGenderModal, setShowGenderModal] = useState(false);
  const [showAgeModal, setShowAgeModal] = useState(false);
  const [showHomeTownModal, setShowHomeTownModal] = useState(false);
  const [showStateModal, setShowStateModal] = useState(false);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [showProfilePicModal, setShowProfilePicModal] = useState(false);
  // Add these state variables in your component
  const [showCropper, setShowCropper] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const emailChangeHandler = event => setEmail(event.target.value);
  const passwordChangeHandler = event => setPassword(event.target.value);
  const firstNameChangeHandler = event => setFirstName(event.target.value);
  // const firstNameChangeHandler = (e) => {
  //   const value = e.target.value;
  //   if (value.length >= 1) {
  //     setFirstName(value); // Assuming you have a setFirstName function to update the first name
  //   } else {
  //     // Optionally show a message to the user
  //     console.log('First Name must be at least 1 character long.');
  //   }
  // };

  // const lastNameChangeHandler = (e) => {
  //   const value = e.target.value;
  //   if (value.length >= 1) {
  //     setLastName(value);
  //   } else {
  //     // Optionally show a message to the user
  //     console.log('Last Name must be at least 1 character long.');
  //   }
  // };
  const lastNameChangeHandler = event => setLastName(event.target.value);
  const dateOfBirthChangeHandler = event => setDateOfBirth(event.target.value);
  const hometownChangeHandler = event => sethometown(event.target.value);
  const stateChangeHandler = event => setState(event.target.value);
  const countryChangeHandler = event => setCountry(event.target.value);
  const handleParPreferenceChange = event => setParPreference(event.target.value);

  const handleSensitiveInfoChange = (event, property) => {
    setIsSensitiveInfoPublic(prevState => ({
      ...prevState,
      [property]: event.target.checked,
    }));
  };

  // const profilePicChangeHandler = event => {
  //   const file = event.target.files[0];
  //   if (file) {
  //     const reader = new FileReader();
  //     reader.onloadend = () => {
  //       setProfilePic(file);
  //       // setProfilePic(reader.result);
  //       setProfilePicChanged(true);
  //       setProfilePicPreview(reader.result);
  //     };
  //     reader.readAsDataURL(file);
  //   } else {
  //     setProfilePic(`https://avatars.dicebear.com/api/human/${email}.svg`);
  //     setProfilePicPreview(`https://avatars.dicebear.com/api/human/${email}.svg`);
  //   }
  // };
  // Add this state variable for temporary image data
  const [tempImageData, setTempImageData] = useState(null);

  // Add this handler function for when cropping is complete
  const handleCropComplete = ({ file, dataUrl }) => {
    setProfilePic(file);
    setProfilePicPreview(dataUrl);
    setProfilePicChanged(true);
  };

  const profilePicChangeHandler = event => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedFile(file);
        setShowCropper(true);
        // Save original file data for cropper
        setTempImageData(reader.result);
      };
      reader.readAsDataURL(file);
    } else {
      setProfilePic(`https://avatars.dicebear.com/api/human/${email}.svg`);
      setProfilePicPreview(`https://avatars.dicebear.com/api/human/${email}.svg`);
    }
  };

  const handlePreferredUnitChange = event => {
    setPreferredUnit(event.target.value.toLowerCase());
  };

  const bioChangeHandler = event => setBio(event.target.value);
  const firstRoundChangeHandler = event => setFirstRound(event.target.value);
  const homeCourseChangeHandler = item => {
    setHomeCourse(item.name ?? "");
  };

  const clubCommentsChangeHandler = event => setClubComments(event.target.value);
  const clubsChangeHandler = event => {
    setClubs(clubs => {
      return {
        ...cloneDeep(clubs),
        [event.target.id]: event.target.checked,
      };
    });
  };
  // const handleClose = () => setShow(false);
  // const handleShow = () => setShow(true);
  const sortedCountryList = useMemo(() => {
    // Countries to show first inside select input
    const firstCountries = ["US", "GB", "NZ", "AU", "JP", "SE", "FI", "FR", "IE"];
    // Remove duplicates from the original list
    return union(firstCountries, isoCountries.getCodes());
  }, []);

  const submitForm = async event => {
    event.preventDefault();
    const enteredEmail = email;
    const enteredPassword = password;
    const enteredFirstName = firstName;
    const enteredLastName = lastName;
    // const enteredProfilePic = profilePicChanged ? (profilePic != "" ? await fileToBase64(profilePic) : "") : profilePic;
    const enteredProfilePic = profilePic;
    const enterdob = dateOfBirth;
    const enterState = state;
    const enterHomeTown = hometown;

    if (!enterdob) {
      setDobError(true);
    } else {
      setDobError(false);
    }
    if (!enterHomeTown) {
      setHometownError(true);
    } else {
      setHometownError(false);
    }
    if (!enterState) {
      setStateError(true);
    } else {
      setStateError(false);
    }

    const emailValid = emailValidator(enteredEmail);
    // const passwordValid = passwordValidator(enteredPassword);
    const passwordValid = true; // defaulting this to true always. Since allow the user to update the password.
    const firstNameValid = displayNameValidator(enteredFirstName);
    const lastNameValid = displayNameValidator(enteredLastName);
    const genderValid = parPreference === "mens" || parPreference === "womens";
    const validated =
      emailValid &&
      passwordValid &&
      firstNameValid &&
      lastNameValid &&
      enterdob &&
      enterHomeTown &&
      enterState &&
      genderValid;
    if (validated) {
      setError(!validated);
      /*
      setUser(previousState => {
        const deepClonedState = cloneDeep(previousState);
        deepClonedState.accountInfo.password = password;
        deepClonedState.accountInfo.securityQuestion = securityQuestion;
        deepClonedState.accountInfo.securityAnswer = securityAnswer;
        deepClonedState.identityInfo.displayName = displayName;
        deepClonedState.identityInfo.firstName = firstName;
        deepClonedState.identityInfo.lastName = lastName;
        deepClonedState.identityInfo.dateOfBirth = dateOfBirth;
        deepClonedState.identityInfo.hometown = hometown;
        deepClonedState.identityInfo.state = state;
        deepClonedState.identityInfo.country = country;
        if (enteredProfilePic !== "") deepClonedState.identityInfo.profilePic = enteredProfilePic;
        deepClonedState.speedgolfInfo.bio = bio;
        deepClonedState.speedgolfInfo.homeCourse = homeCourse;
        deepClonedState.speedgolfInfo.firstRound = firstRound;
        deepClonedState.speedgolfInfo.clubs = clubs;
        deepClonedState.speedgolfInfo.clubComments = clubComments;
        deepClonedState.identityInfo.parPreference = parPreference;
        deepClonedState.privacyInfo.isSensitiveInfoPublic = isSensitiveInfoPublic;
        deepClonedState.privacyInfo.preferredUnit = preferredUnit;
        return deepClonedState;
      });*/
      // const deepClonedState = cloneDeep(user);
      // deepClonedState.accountInfo.password = password;
      // deepClonedState.accountInfo.securityQuestion = securityQuestion;
      // deepClonedState.accountInfo.securityAnswer = securityAnswer;
      // deepClonedState.identityInfo.displayName = displayName;
      // deepClonedState.identityInfo.firstName = firstName;
      // deepClonedState.identityInfo.lastName = lastName;
      // deepClonedState.identityInfo.dateOfBirth = dateOfBirth;
      // deepClonedState.identityInfo.hometown = hometown;
      // deepClonedState.identityInfo.state = state;
      // deepClonedState.identityInfo.country = country;
      // if (enteredProfilePic !== "") deepClonedState.identityInfo.profilePic = enteredProfilePic;
      // deepClonedState.speedgolfInfo.bio = bio;
      // deepClonedState.speedgolfInfo.homeCourse = homeCourse;
      // deepClonedState.speedgolfInfo.firstRound = firstRound;
      // deepClonedState.speedgolfInfo.clubs = clubs;
      // deepClonedState.speedgolfInfo.clubComments = clubComments;
      // deepClonedState.identityInfo.parPreference = parPreference;
      // deepClonedState.privacyInfo.isSensitiveInfoPublic = isSensitiveInfoPublic;
      // deepClonedState.privacyInfo.preferredUnit = preferredUnit;

      /**
       * ALL THE FIELDS WE KEEP TRACK IN MANAGE ACCOUNT
       * email -
       * password -
       * firstname -
       * lastname -
       * dateOfBirth -
       * hometown -
       * state -
       * country -
       * profilepic -
       * parPreference -
       * isSensitiveInfoPublic
       * preferredUnit
       * bio -
       * firstRound -
       * homeCourse -
       * clubs -
       * clubComments -
       * parGenderIsPrivate -
       * homeLocationIsPrivate -
       * birthdateIsPrivate -
       * speedgolfInfoIsPrivate -
       * speedgolfRoundsArePublic -
       * speedgolfStatsArePublic -
       * feedPostsArePublic -
       */
      const updatedUserData = {
        accountInfo: {
          email: email,
        },
        personalInfo: {
          firstName: firstName,
          lastName: lastName,
          birthdate: dateOfBirth,
          hometown: hometown,
          homeState: state,
          homeCountry: country,
          ...(profilePicChanged && { profilePic: enteredProfilePic }),
          parGender: parPreference,
        },
        buddies: user.buddies,
        incomingBuddyRequests: user.incomingBuddyRequests,
        outgoingBuddyRequests: user.outgoingBuddyRequests,
        speedgolfInfo: {
          bio: bio,
          homeCourse: homeCourse,
          firstRound: firstRound,
          clubs: convertClubsToShorthand(
            Object.keys(clubs).reduce((acc, club) => {
              if (clubs[club]) {
                acc.push(club);
              }
              return acc;
            }, []),
          ),
          clubNotes: clubComments,
        },
        preferences: {
          ...isSensitiveInfoPublic,
          ...(preferredUnit !== "" && preferredUnit !== null && { preferredUnits: preferredUnit }),
        },
      };
      console.log("Updated User Data before sending to dispatcher: ", updatedUserData);
      // dispatch(setUser(deepClonedState));
      // navigate(-1);
      dispatch(updateUser(updatedUserData, jwt, userId, navigate));
    } else {
      setError(!validated);
      setEmailError(!emailValid);
      setPasswordError(!passwordValid);
      setFirstNameError(!firstNameValid);
      setLastNameError(!lastNameValid);
      setParPreferenceError(!genderValid);
    }
  };

  const formSubmitHandler = e => {
    submitForm(e).then(() => {
      // Workaround for focusing the first error TODO refactor
      const errors = document.getElementsByClassName("alert-link");

      for (let error of errors) {
        if (!error.classList.contains("hidden")) {
          error.focus();
          break;
        }
      }
    });
  };

  useEffect(() => {
    if (user && user.accountInfo && user.personalInfo && user.speedgolfInfo && user.preferences) {
      if (user.accountInfo.email && user.accountInfo.email != email) {
        setEmail(user.accountInfo.email);
      }
      if (user.personalInfo.firstName && user.personalInfo.firstName != firstName) {
        setFirstName(user?.personalInfo?.firstName);
      }
      if (user.personalInfo.lastName && user.personalInfo.lastName != lastName) {
        setLastName(user?.personalInfo?.lastName);
      }
      if (user.personalInfo.birthdate && user.personalInfo.birthdate != dateOfBirth) {
        setDateOfBirth(formatDateToMMDDYYYY(user.personalInfo.birthdate));
      }
      if (user.personalInfo.hometown && user.personalInfo.hometown != hometown) {
        sethometown(user.personalInfo.hometown);
      }
      if (user.personalInfo.homeState && user.personalInfo.homeState != state) {
        setState(user.personalInfo.homeState);
      }
      if (user.personalInfo.homeCountry && user.personalInfo.homeCountry != country) {
        setCountry(user.personalInfo.homeCountry);
      }
      if (user.personalInfo.profilePic && user.personalInfo.profilePic != profilePic) {
        setProfilePic(user.personalInfo.profilePic);
      }
      if (user.personalInfo.parGender && user.personalInfo.parGender != parPreference) {
        setParPreference(user.personalInfo.parGender);
      }
      if (user.preferences && JSON.stringify(user.preferences) != JSON.stringify(isSensitiveInfoPublic)) {
        setIsSensitiveInfoPublic({
          parGenderIsPrivate: user.preferences.parGenderIsPrivate,
          homeLocationIsPrivate: user.preferences.homeLocationIsPrivate,
          birthdateIsPrivate: user.preferences.birthdateIsPrivate,
          speedgolfInfoIsPrivate: user.preferences.speedgolfInfoIsPrivate,
          speedgolfRoundsArePublic: user.preferences.speedgolfRoundsArePublic,
          speedgolfStatsArePublic: user.preferences.speedgolfStatsArePublic,
          feedPostsArePublic: user.preferences.feedPostsArePublic,
        });
      }
      if (user.preferences.preferredUnits && user.preferences.preferredUnits != preferredUnit) {
        setPreferredUnit(user.preferences.preferredUnits);
      }
      if (user.speedgolfInfo.bio && user.speedgolfInfo.bio != bio) {
        setBio(user.speedgolfInfo.bio);
      }
      if (user.speedgolfInfo.firstRound && user.speedgolfInfo.firstRound != firstRound) {
        setFirstRound(user.speedgolfInfo.firstRound);
      }
      if (user.speedgolfInfo.homeCourse && user.speedgolfInfo.homeCourse != homeCourse) {
        setHomeCourse(user.speedgolfInfo.homeCourse);
      }
      if (user.speedgolfInfo.clubs) {
        setClubs({
          sgDriver: fetchClubStatus(user.speedgolfInfo.clubs, "sgDriver"),
          sg3W: fetchClubStatus(user.speedgolfInfo.clubs, "sg3W"),
          sg4W: fetchClubStatus(user.speedgolfInfo.clubs, "sg4W"),
          sg5W: fetchClubStatus(user.speedgolfInfo.clubs, "sg5W"),
          sg7W: fetchClubStatus(user.speedgolfInfo.clubs, "sg7W"),
          sgHybrid: fetchClubStatus(user.speedgolfInfo.clubs, "sgHybrid"),
          // sg1I: fetchClubStatus(user.speedgolfInfo.clubs, "sg1I"),
          sg2I: fetchClubStatus(user.speedgolfInfo.clubs, "sg2I"),
          sg3I: fetchClubStatus(user.speedgolfInfo.clubs, "sg3I"),
          sg4I: fetchClubStatus(user.speedgolfInfo.clubs, "sg4I"),
          sg5I: fetchClubStatus(user.speedgolfInfo.clubs, "sg5I"),
          sg6I: fetchClubStatus(user.speedgolfInfo.clubs, "sg6I"),
          sg7I: fetchClubStatus(user.speedgolfInfo.clubs, "sg7I"),
          sg8I: fetchClubStatus(user.speedgolfInfo.clubs, "sg8I"),
          sg9I: fetchClubStatus(user.speedgolfInfo.clubs, "sg9I"),
          sgPW: fetchClubStatus(user.speedgolfInfo.clubs, "sgPW"),
          sgGW: fetchClubStatus(user.speedgolfInfo.clubs, "sgGW"),
          sgSW: fetchClubStatus(user.speedgolfInfo.clubs, "sgSW"),
          sgLW: fetchClubStatus(user.speedgolfInfo.clubs, "sgLW"),
          sgPutter: fetchClubStatus(user.speedgolfInfo.clubs, "sgPutter"),
        });
      }
      if (user.speedgolfInfo.clubNotes && user.speedgolfInfo.clubNotes != clubComments) {
        setClubComments(user.speedgolfInfo.clubNotes);
      }
      //TODO: Home course needs to be updated after course schema is fixed on the backend.
    }
  }, [user]);
  // aved preference from local storage when the component mounts
  useEffect(() => {
    // const savedPreference = localStorage.getItem("parPreference");
    // if (savedPreference) {
    //   setParPreference(savedPreference);
    // }
    if (userAuthenticated && jwt && userId) {
      dispatch(getUser(jwt, userId, navigate));
    }
  }, []);

  useEffect(() => {
    if (!userAuthenticated) navigate("/login");
  }, [userAuthenticated]);

  if (loadingState) return null;

  return (
    <>
      <Navbar />
      <div
        id="profileSettingsDialog"
        className="mode-page"
        role="dialog"
        aria-modal="true"
        aria-labelledby="accountProfileHeader"
      >
        <h1 id="accountProfileHeader" className="mode-page-header">
          Account & Profile
        </h1>
        <p id="profileErrorBox" className={`alert alert-danger centered ${error ? "" : "hidden"}`}>
          <a id="profileEmailError" href="#profileEmail" className={`alert-link ${emailError ? "" : "hidden"}`}>
            Please enter a valid email address
            <br />
          </a>
          <a id="acctPasswordError" href="#acctPassword" className={`alert-link ${passwordError ? "" : "hidden"}`}>
            Please enter a valid password
            <br />
          </a>
          <a id="profileFirstNameError" href="#firstName" className={`alert-link ${firstNameError ? "" : "hidden"}`}>
            Please enter a valid first name
            <br />
          </a>
          <a id="profileLastNameError" href="#lastName" className={`alert-link ${lastNameError ? "" : "hidden"}`}>
            Please enter a valid last name
            <br />
          </a>
          <a
            id="parPreferenceError"
            href="#parPreference"
            className={`alert-link ${parPreferenceError ? "" : "hidden"}`}
          >
            Please specify a gender
            <br />
          </a>
          <a id="dobError" href="#dob" className={`alert-link ${dobError ? "" : "hidden"}`}>
            Please enter a valid date of birth
            <br />
          </a>
          <a id="hometownError" href="#hometown" className={`alert-link ${hometownError ? "" : "hidden"}`}>
            Please enter a valid hometown
            <br />
          </a>
          <a id="stateError" href="#state" className={`alert-link ${stateError ? "" : "hidden"}`}>
            Please enter a valid state/province
            <br />
          </a>
        </p>
        <form id="editProfileForm" className="centered" noValidate onSubmit={formSubmitHandler}>
          <div id="profileFormAccordion" className="accordion">
            <div className="accordion-item">
              <fieldset>
                <h2 className="accordion-header" id="accountHeader">
                  <button
                    id="accountSettingsBtn"
                    className="accordion-button"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#accountSettingsPanel"
                    aria-expanded="true"
                    aria-controls="accountSettingsPanel"
                  >
                    <legend>Account</legend>
                  </button>
                </h2>
                <div
                  id="accountSettingsPanel"
                  className="accordion-collapse collapse show"
                  aria-labelledby="accountHeader"
                  data-bs-parent="#profileFormAccordion"
                >
                  <div className="accordion-body">
                    <div className="mb-3">
                      <label for="profileEmail" className="form-label">
                        Email:
                        <input
                          id="profileEmail"
                          type="email"
                          className="form-control centered"
                          aria-describedby="profileEmailDescr"
                          required
                          onChange={emailChangeHandler}
                          value={email}
                          disabled
                        />
                      </label>
                      <div id="profileEmailDescr" className="form-text">
                        Enter a valid email address (e.g., 'name@domain.com').
                      </div>
                    </div>
                    <div className="mb-3">
                      <label for="profilePassword" className="form-label">
                        Password:
                        <input
                          id="profilePassword"
                          type="password"
                          className="form-control centered"
                          pattern="^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$"
                          aria-describedby="profilePasswordDescr"
                          readonly
                          onChange={passwordChangeHandler}
                          value={password}
                          disabled
                        />
                      </label>
                      <div id="profilePasswordDescr" className="form-text">
                        Use the "Reset Password" option on the Log In page to reset your password.
                      </div>
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>
            <div className="accordion-item">
              <fieldset>
                <h2 id="profileHeader" className="accordion-header">
                  <button
                    id="profileSettingsBtn"
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#profileSettingsPanel"
                    aria-expanded="false"
                    aria-controls="profileSettingsPanel"
                  >
                    <legend>Personal Info</legend>
                  </button>
                </h2>
                <div
                  id="profileSettingsPanel"
                  className="accordion-collapse collapse"
                  aria-labelledby="profileHeader"
                  data-bs-parent="#profileFormAccordion"
                >
                  <div className="accordion-body">
                    <div className="mb-3">
                      <label htmlFor="firstName" className="form-label">
                        First Name:
                        <br />
                        <input
                          id="firstName"
                          type="text"
                          className="form-control centered"
                          minLength="1"
                          required
                          onChange={firstNameChangeHandler}
                          value={firstName}
                        />
                      </label>
                      <a
                        href="#"
                        onClick={() => setShowNameModal(true)}
                        style={{ fontSize: "0.8rem", display: "block", margin: "0 auto", width: "fit-content" }}
                      >
                        What if I don't want to reveal my name?
                      </a>
                      <Modal show={showNameModal} onHide={() => setShowNameModal(false)}>
                        <Modal.Header closeButton>
                          <Modal.Title>Why First Name?</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                          SpeedScore brings together folks who share a passion for speedgolf. We want folks to get to
                          know each other by name. To make this possible, we encourage you to use your real name in the
                          app. If you are not comfortable with this, feel free to use a pseudonym, but keep in mind that
                          if you ever use SpeedScore to enter competitions, you should use your real name.
                        </Modal.Body>
                        <Modal.Footer>
                          <Button variant="secondary" onClick={() => setShowNameModal(false)}>
                            Close
                          </Button>
                        </Modal.Footer>
                      </Modal>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="lastName" className="form-label">
                        Last Name:
                        <br />
                        <input
                          id="lastName"
                          type="text"
                          className="form-control centered"
                          minLength="1"
                          required
                          onChange={lastNameChangeHandler}
                          value={lastName}
                        />
                      </label>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="dob" className="form-label">
                        Date of Birth:
                        <br />
                        <input
                          id="dob"
                          type="date"
                          className="form-control centered"
                          required
                          onChange={dateOfBirthChangeHandler}
                          value={dateOfBirth}
                          // value={"06/04/2024"}
                          placeholder="mm/dd/yyyy"
                        />
                      </label>
                      {dobError && <p className="error">{dobError}</p>}
                      <a
                        href="#"
                        onClick={() => setShowAgeModal(true)}
                        style={{ fontSize: "0.8rem", display: "block", margin: "0 auto", width: "fit-content" }}
                      >
                        Why are you asking for my date of birth?
                      </a>
                      <Modal show={showAgeModal} onHide={() => setShowAgeModal(false)}>
                        <Modal.Header closeButton>
                          <Modal.Title>Why are you asking for my date of birth?</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                          In SpeedScore, you can sign up for speedgolf competitions with age divisions. We need your age
                          so that we can present you with the competitions you are eligible for and place you in the
                          correct age division.
                        </Modal.Body>
                        <Modal.Footer>
                          <Button variant="secondary" onClick={() => setShowAgeModal(false)}>
                            Close
                          </Button>
                        </Modal.Footer>
                      </Modal>
                    </div>
                    <div className="mb-3">
                      <fieldset>
                        <label htmlFor="parPreference" className="form-label">
                          Gender for Stroke and Time Pars:
                        </label>
                        <select
                          id="parPreference"
                          name="parPreference"
                          style={{ display: "block", margin: "0 auto", width: "fit-content" }} // Adjusted styles here
                          //style={{ width: 'auto' }}
                          className="form-control centered"
                          required
                          onChange={handleParPreferenceChange}
                          defaultValue={parPreference}
                        >
                          <option value="default" disabled>
                            Select your gender (required)
                          </option>
                          <option value="mens">I use men's stroke and time pars</option>
                          <option value="womens">I use women's stroke and time pars</option>
                        </select>
                        {parPreferenceError && <p className="error">{parPreferenceError}</p>}
                        <a
                          href="#"
                          onClick={() => setShowGenderModal(true)}
                          style={{ fontSize: "0.8rem", display: "block", margin: "0 auto", width: "fit-content" }}
                        >
                          Why are you asking for my gender?
                        </a>
                        <Modal show={showGenderModal} onHide={() => setShowGenderModal(false)}>
                          <Modal.Header closeButton>
                            <Modal.Title>Why are you asking for my gender?</Modal.Title>
                          </Modal.Header>
                          <Modal.Body>
                            SpeedScore values users of all gender identities. However, tournament divisions are often
                            based on binary gender. In addition, stroke and time pars are based on binary gender to
                            facilitate fair handicap calculations and competitions. Therefore, even if you do not
                            identify as male or female, you need to provide a binary designation so that you can
                            register for gender-based competition divisions, and so that the most appropriate stroke and
                            time pars can be applied in the rounds you log with the app.
                          </Modal.Body>
                          <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowGenderModal(false)}>
                              Close
                            </Button>
                          </Modal.Footer>
                        </Modal>
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
                          required
                          onChange={hometownChangeHandler}
                          value={hometown}
                        />
                      </label>
                      {hometownError && <p className="error">{hometownError}</p>}
                      <a
                        href="#"
                        onClick={() => setShowHomeTownModal(true)}
                        style={{ fontSize: "0.8rem", display: "block", margin: "0 auto", width: "fit-content" }}
                      >
                        Why are you asking for my hometown?
                      </a>
                      <Modal show={showHomeTownModal} onHide={() => setShowHomeTownModal(false)}>
                        <Modal.Header closeButton>
                          <Modal.Title>Why are you asking for my hometown?</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                          In SpeedScore competitions, we list your hometown, state/povince, and country in leaderboards
                          and scorecards, so that others know where you're from. These items will not be shared with
                          non-buddies in the app unless you choose to reveal them.
                        </Modal.Body>
                        <Modal.Footer>
                          <Button variant="secondary" onClick={() => setShowHomeTownModal(false)}>
                            Close
                          </Button>
                        </Modal.Footer>
                      </Modal>
                    </div>
                    <div className="mb-3">
                      <div className="form-group">
                        <label htmlFor="country" className="form-label">
                          Country:
                          <br />
                          <select
                            id="country"
                            className="form-control centered"
                            {...register("country", { required: VALIDATION_ERRORS.COUNTRY })}
                            onChange={event => {
                              setCountry("country", event.target.value);
                              setCountry(event.target.value);
                            }}
                          >
                            {sortedCountryList.map(code => (
                              <option key={code} value={code}>
                                {isoCountries.getCountry(code)} ({code})
                              </option>
                            ))}
                          </select>
                        </label>
                        <a
                          href="#"
                          onClick={() => setShowCountryModal(true)}
                          style={{ fontSize: "0.8rem", display: "block", margin: "0 auto", width: "fit-content" }}
                        >
                          Why are you asking for my home country?
                        </a>
                        <Modal show={showCountryModal} onHide={() => setShowCountryModal(false)}>
                          <Modal.Header closeButton>
                            <Modal.Title>Why are you asking for my home country?</Modal.Title>
                          </Modal.Header>
                          <Modal.Body>
                            In SpeedScore competitions, we list your hometown, state/povince, and country in
                            leaderboards and scorecards, so that others know where you're from. These items will not be
                            shared with non-buddies in the app unless you choose to reveal them.
                          </Modal.Body>
                          <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowCountryModal(false)}>
                              Close
                            </Button>
                          </Modal.Footer>
                        </Modal>
                      </div>
                    </div>
                    <div className="mb-3">
                      <div className="form-group">
                        <label htmlFor="state" className="form-label">
                          State/Province:
                          <br />
                          <select
                            id="state"
                            required
                            onChange={stateChangeHandler}
                            value={state}
                            className="form-control centered"
                          >
                            <option value="">Select a state/province</option>
                            {country &&
                              Object.values(iso3166.country(country).sub).map(subdivision => (
                                <option key={subdivision.iso} value={subdivision.iso}>
                                  {subdivision.name}
                                </option>
                              ))}
                          </select>
                          {stateError && <p className="error">{stateError}</p>}
                          <a
                            href="#"
                            onClick={() => setShowStateModal(true)}
                            style={{ fontSize: "0.8rem", display: "block", margin: "0 auto", width: "fit-content" }}
                          >
                            Why are you asking for my home state/province?
                          </a>
                          <Modal show={showStateModal} onHide={() => setShowStateModal(false)}>
                            <Modal.Header closeButton>
                              <Modal.Title>Why are you asking for my state/province?</Modal.Title>
                            </Modal.Header>
                            <Modal.Body>
                              In SpeedScore competitions, we list your hometown, state/povince, and country in
                              leaderboards and scorecards, so that others know where you're from. These items will not
                              be shared with non-buddies in the app unless you choose to reveal them.
                            </Modal.Body>
                            <Modal.Footer>
                              <Button variant="secondary" onClick={() => setShowStateModal(false)}>
                                Close
                              </Button>
                            </Modal.Footer>
                          </Modal>
                        </label>
                      </div>
                    </div>
                    <div className="mb-3">
                      <label htmlFor="profilePic" className="form-label">
                        Profile Picture{" "}
                        <a
                          href="#"
                          onClick={() => setShowProfilePicModal(true)}
                          style={{ fontSize: "0.8rem", margin: "0 auto", width: "fit-content" }}
                        >
                          (Optional but recommended)
                        </a>
                        <br />
                        <img
                          id="profilePicImage"
                          // src={profilePic}
                          src={profilePicPreview || `https://avatars.dicebear.com/api/human/${email}.svg`}
                          className="fm-profile-pic"
                          height="46"
                          width="auto"
                          style={{ objectFit: "cover", borderRadius: "50%" }} //added style to make it circular
                        />
                        <input
                          id="profilePic"
                          type="file"
                          className="form-control centered"
                          accept=".png, .gif, .jpg"
                          aria-describedby="profilePicDescr"
                          required
                          //onChange={profilePicChangeHandler}
                          {...register("profilePic", {
                            onChange: e => {
                              profilePicChangeHandler(e);
                            },
                          })}
                          // value={profilePic}
                        />
                      </label>
                      <div id="profilePicDescr" className="form-text">
                        Upload a profile picture as a .png, .gif, or .jpg file. A rectangular head shot works best.
                      </div>

                      {/* Image Cropper Modal */}
                      {showCropper && (
                        <ProfilePictureCropper
                          onCropComplete={handleCropComplete}
                          showCropper={showCropper}
                          setShowCropper={setShowCropper}
                          initialImage={tempImageData}
                          imageName={selectedFile?.name || `https://avatars.dicebear.com/api/human/${email}.svg`}
                        />
                      )}
                      <Modal show={showProfilePicModal} onHide={() => setShowProfilePicModal(false)}>
                        <Modal.Header closeButton>
                          <Modal.Title>Why are you asking me to upload a profile picture?</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                          Providing a rectangular picture of your face is a great way to help other speedgolfers
                          associate your name with your face. Your picture will be shared with others in the app. In
                          addition, in competitions, we include profile pictures in leaderboards and scorecards.
                        </Modal.Body>
                        <Modal.Footer>
                          <Button variant="secondary" onClick={() => setShowProfilePicModal(false)}>
                            Close
                          </Button>
                        </Modal.Footer>
                      </Modal>
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>
            <div className="accordion-item">
              <fieldset>
                <h2 id="sgHeader" className="accordion-header">
                  <button
                    id="sgSettingsBtn"
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#sgSettingsPanel"
                    aria-expanded="false"
                    aria-controls="sgSettingsPanel"
                  >
                    <legend>Speedgolf Info</legend>
                  </button>
                </h2>
                <div
                  id="sgSettingsPanel"
                  className="accordion-collapse collapse"
                  aria-labelledby="sgHeader"
                  data-bs-parent="#profileFormAccordion"
                >
                  <div className="accordion-body">
                    <div className="mb-3">
                      <label for="sgBio" className="form-label">
                        Personal Speedgolf Bio (optional):
                      </label>
                      <textarea
                        id="sgBio"
                        className="form-control"
                        aria-describedby="sgBioDescr"
                        rows="5"
                        cols="40"
                        maxLength="500"
                        onChange={bioChangeHandler}
                        value={bio}
                      ></textarea>
                      <div id="sgBioDescr" className="form-text">
                        A short personal bio about your speedgolf journey. Maximum of 500 characters.
                      </div>
                    </div>
                    <div className="mb-3">
                      <label for="sgFirstRound" className="form-label">
                        Date of First Speedgolf Round (optional):
                      </label>
                      <input
                        type="month"
                        id="sgFirstRound"
                        className="form-control centered"
                        // value='2021-07'
                        aria-describedby="sgFirstRoundDescr"
                        onChange={firstRoundChangeHandler}
                        value={firstRound}
                      />
                      <div id="sgFirstRoundDescr" className="form-text">
                        Month and year in which you played your first speedgolf round.
                      </div>
                    </div>
                    <div className="mb-3">
                      <label for="sgHomeCourser" className="form-label">
                        Home Course (optional):
                        <AddCourseAutocomplete value={homeCourse} onChange={homeCourseChangeHandler} />
                      </label>
                      {/* <input
                        type='text'
                        id='sgHomeCourse'
                        className='form-control centered'
                        aria-describedby='sgHomeCourseDescr'
                        onChange={homeCourseChangeHandler}
                        value={homeCourse}
                      /> */}

                      <div id="sgHomeCourseDescr" className="form-text">
                        Course where you play most of your speedgolf.
                      </div>
                    </div>
                    <fieldset>
                      <legend className="fm-legend-sm">Clubs in Bag (optional)</legend>
                      <div id="clubsDiv" className="mb-3">
                        <input
                          id="sgDriver"
                          type="checkbox"
                          name="Driver"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sgDriver}
                        />
                        <label for="sgDriver">&nbsp;Driver&nbsp;&nbsp;</label>
                        <input
                          id="sg3W"
                          type="checkbox"
                          name="3W"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sg3W}
                        />
                        <label for="sg3W">&nbsp;3W&nbsp;&nbsp;</label>
                        <input
                          id="sg4W"
                          type="checkbox"
                          name="4W"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sg4W}
                        />
                        <label for="sg4W">&nbsp;4W&nbsp;&nbsp;</label>
                        <input
                          id="sg5W"
                          type="checkbox"
                          name="5W"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sg5W}
                        />
                        <label for="sg5W">&nbsp;5W&nbsp;&nbsp;</label>
                        <input
                          id="sgHybrid"
                          type="checkbox"
                          name="Hybrid"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sgHybrid}
                        />
                        <label for="sgHybrid">&nbsp;Hybrid&nbsp;&nbsp;</label>
                        <br />
                        <input
                          id="sg7W"
                          type="checkbox"
                          name="7W"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sg7W}
                        />
                        <label for="sg7W">&nbsp;1I&nbsp;&nbsp;</label>
                        <input
                          id="sg2I"
                          type="checkbox"
                          name="2I"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sg2I}
                        />
                        <label for="sg2I">&nbsp;2I&nbsp;&nbsp;</label>
                        <input
                          id="sg3I"
                          type="checkbox"
                          name="3I"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sg3I}
                        />
                        <label for="sg3I">&nbsp;3I&nbsp;&nbsp;</label>
                        <input
                          id="sg4I"
                          type="checkbox"
                          name="4I"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sg4I}
                        />
                        <label for="sg4I">&nbsp;4I&nbsp;&nbsp;</label>
                        <input
                          id="sg5I"
                          type="checkbox"
                          name="5I"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sg5I}
                        />
                        <label for="sg5I">&nbsp;5I&nbsp;&nbsp;</label>
                        <input
                          id="sg6I"
                          type="checkbox"
                          name="6I"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sg6I}
                        />
                        <label for="sg6I">&nbsp;6I&nbsp;&nbsp;</label>
                        <input
                          id="sg7I"
                          type="checkbox"
                          name="7I"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sg7I}
                        />
                        <label for="sg7I">&nbsp;7I&nbsp;&nbsp;</label>
                        <input
                          id="sg8I"
                          type="checkbox"
                          name="8I"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sg8I}
                        />
                        <label for="sg8I">&nbsp;8I&nbsp;&nbsp;</label>
                        <input
                          id="sg9I"
                          type="checkbox"
                          name="9I"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sg9I}
                        />
                        <label for="sg9I">&nbsp;9I&nbsp;&nbsp;</label>
                        <br />
                        <input
                          id="sgPW"
                          type="checkbox"
                          name="PW"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sgPW}
                        />
                        <label for="sgPW">&nbsp;PW&nbsp;&nbsp;</label>
                        <input
                          id="sgGW"
                          type="checkbox"
                          name="GW"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sgGW}
                        />
                        <label for="sgGW">&nbsp;GW&nbsp;&nbsp;</label>
                        <input
                          id="sgSW"
                          type="checkbox"
                          name="SW"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sgSW}
                        />
                        <label for="sgSW">&nbsp;SW&nbsp;&nbsp;</label>
                        <input
                          id="sgLW"
                          type="checkbox"
                          name="LW"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sgLW}
                        />
                        <label for="sgLW">&nbsp;LW&nbsp;&nbsp;</label>
                        <br />
                        <input
                          id="sgPutter"
                          type="checkbox"
                          name="Putter"
                          aria-describedby="sgClubsDescr"
                          onChange={clubsChangeHandler}
                          checked={clubs.sgPutter}
                        />
                        <label for="sgPutter">&nbsp;Putter&nbsp;&nbsp;</label>
                        <div id="sgClubsDescr" className="form-text">
                          Select the clubs you normally carry during a speedgolf round.
                        </div>
                        <label for="sgClubComments" className="form-label">
                          Comments on Clubs (optional):
                        </label>
                        <textarea
                          id="sgClubComments"
                          className="form-control"
                          aria-describedby="sgClubCommentsDescr"
                          onChange={clubCommentsChangeHandler}
                          value={clubComments}
                        ></textarea>
                        <div id="sgClubCommentsDescr" className="form-text">
                          Describe your clubs in greater detail.
                        </div>
                      </div>
                    </fieldset>
                  </div>
                </div>
              </fieldset>
            </div>
            <div className="accordion-item">
              <fieldset>
                <h2 id="preferencesHeader" className="accordion-header">
                  <button
                    id="preferencesBtn"
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#preferencesPanel"
                    aria-expanded="false"
                    aria-controls="preferencesPanel"
                  >
                    <legend>Preferences</legend>
                  </button>
                </h2>
                <div id="preferencesPanel" className="accordion-collapse collapse" aria-labelledby="preferencesHeader">
                  <div className="accordion-body">
                    {/* <div>
                      <input
                        type='checkbox'
                        id='publicInfo'
                        onChange={handleSensitiveInfoChange}
                        checked={isSensitiveInfoPublic}
                      />
                      <label htmlFor='publicInfo'>Make my birthdate, address and other sensitive info public</label>
                    </div> */}
                    <fieldset>
                      <legend className="fm-legend-sm">Privacy Settings</legend>
                      <p>
                        Your personal and speedgolf info above will be shown in the profile page viewable by your
                        buddies. Use the checkboxes below to hide certain personal information in the public profile
                        page available to all SpeedScore users.
                      </p>
                      <div>
                        <input
                          type="checkbox"
                          id="hideParGender"
                          onChange={event => handleSensitiveInfoChange(event, "parGenderIsPrivate")}
                          checked={isSensitiveInfoPublic.parGenderIsPrivate}
                        />
                        <label htmlFor="hideParGender">&nbsp;Hide my par gender in my public profile</label>
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          id="hideLocation"
                          onChange={event => handleSensitiveInfoChange(event, "homeLocationIsPrivate")}
                          checked={isSensitiveInfoPublic.homeLocationIsPrivate}
                        />
                        <label htmlFor="hideLocation">
                          &nbsp;Hide my hometown, state/province and country in my public profile
                        </label>
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          id="hideBirthdate"
                          onChange={event => handleSensitiveInfoChange(event, "birthdateIsPrivate")}
                          checked={isSensitiveInfoPublic.birthdateIsPrivate}
                        />
                        <label htmlFor="hideBirthdate">&nbsp;Hide my birthdate in my public profile</label>
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          id="hideSpeedgolfInfo"
                          onChange={event => handleSensitiveInfoChange(event, "speedgolfInfoIsPrivate")}
                          checked={isSensitiveInfoPublic.speedgolfInfoIsPrivate}
                        />
                        <label htmlFor="hideSpeedgolfInfo">&nbsp;Hide my speedgolf info in my public profile</label>
                      </div>
                    </fieldset>
                    <br />
                    <fieldset>
                      <p>
                        In addition, while your speedgolf rounds, stats, and feed posts are viewable only to your
                        buddies by default, you can choose to make them public by checking the following options:
                      </p>
                      <div>
                        <input
                          type="checkbox"
                          id="publicRounds"
                          onChange={event => handleSensitiveInfoChange(event, "speedgolfRoundsArePublic")}
                          checked={isSensitiveInfoPublic.speedgolfRoundsArePublic}
                        />
                        <label htmlFor="publicRounds">&nbsp;Make my speedgolf rounds public</label>
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          id="publicStats"
                          onChange={event => handleSensitiveInfoChange(event, "speedgolfStatsArePublic")}
                          checked={isSensitiveInfoPublic.speedgolfStatsArePublic}
                        />
                        <label htmlFor="publicStats">&nbsp;Make my speedgolf stats public</label>
                      </div>
                      <div>
                        <input
                          type="checkbox"
                          id="publicPosts"
                          onChange={event => handleSensitiveInfoChange(event, "feedPostsArePublic")}
                          checked={isSensitiveInfoPublic.feedPostsArePublic}
                        />
                        <label htmlFor="publicPosts">
                          &nbsp;Make my feed posts public (your comments on buddies' feed posts remain private)
                        </label>
                      </div>
                    </fieldset>
                    <fieldset>
                      <legend className="fm-legend-sm">Preferred Units</legend>
                      <div>
                        <input
                          type="radio"
                          id="imperial"
                          name="preferredUnit"
                          value="Imperial"
                          onChange={handlePreferredUnitChange}
                          checked={preferredUnit.toLowerCase() === "imperial"}
                          style={{ marginRight: "0.2rem" }}
                        />
                        <label htmlFor="imperial">&nbsp;Imperial</label>
                      </div>
                      <div>
                        <input
                          type="radio"
                          id="metric"
                          name="preferredUnit"
                          value="Metric"
                          onChange={handlePreferredUnitChange}
                          checked={preferredUnit.toLowerCase() === "metric"}
                          style={{ marginRight: "0.2rem" }}
                        />
                        <label htmlFor="metric">&nbsp;Metric</label>
                      </div>
                    </fieldset>
                  </div>
                </div>
              </fieldset>
            </div>
          </div>
          <div className="mode-page-btn-container">
            <button
              type="submit"
              id="submitUpdateProfileBtn"
              className="btn btn-primary dialog-primary-btn"
              aria-live="polite"
              aria-busy="false"
            >
              <span id="editProfileBtnIcon" className="fas fa-user-edit" aria-hidden="true"></span>
              &nbsp;Update
            </button>
            <button
              type="button"
              id="cancelUpdateProfileBtn"
              onClick={cancelButtonClickHandler}
              className="btn btn-secondary dialog-cancel-btn"
            >
              <span className="fas fa-window-close" aria-hidden="true"></span>
              &nbsp;Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default ManageAccount;
