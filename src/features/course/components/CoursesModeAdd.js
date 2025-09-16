/*************************************************************************
 * File: coursesModeAdd.js
 * This file defines the CoursesModeAdd react component, which implements
 * the "Add Course" dialog
 ************************************************************************/
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { addCourseToLocalDB } from "../../../services/courseServices";
import { useDispatch } from "react-redux";
import { addCourse } from "../courseActions";

export default function CoursesModeAdd({ closeDialog }) {
  const dispatch = useDispatch();

  const [autocomplete, setAutocomplete] = useState({ boxContents: "", suggestions: [], courseChosen: null });
  const dialog = useRef();
  const addBtn = useRef();
  const cancelBtn = useRef();
  const courseSearch = useRef();
  const attrib = useRef();
  const navigate = useNavigate();

  // Use useRef to ensure Google Maps services are only created once
  const autocompleteServiceRef = useRef(null);

  // Initialize Google Maps service only once
  if (!autocompleteServiceRef.current && window.google?.maps?.places) {
    // TODO: DEPRECATION WARNING - Migrate to google.maps.places.AutocompleteSuggestion
    // AutocompleteService deprecated as of March 1st, 2025
    // See: https://developers.google.com/maps/documentation/javascript/places-migration-overview
    // At least 12 months notice will be given before discontinuation
    autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
  }

  const autocompleteService = autocompleteServiceRef.current;
  let autocompleteSessionToken = null; //null == no current session
  let newSearchValue = "";

  /*************************************************************************
   * @function handleAutocompleteItemClick
   * @Desc
   * When the user clicks on an item in the autocomplete dropdown, we
   * place that item in the autocomplete box and set the list of automatches to
   * empty (signifying the end of an autocomplete session).
   * This forces a re-render.
   *************************************************************************/
  function handleAutocompleteItemClick(item) {
    autocompleteSessionToken = null; //Session is over
    setAutocomplete({ boxContents: item.name, suggestions: [], courseChosen: item }); //Force re-render
  }

  /*************************************************************************
   * @function updateAutocomplete
   * @param suggestions, an array of suggestions returned by getPlacePredictions()
   * @Desc status, the status returned by getPlacePredictions()
   * This is the function called by the Google Places API
   * getPlacePredictions() function after it retrieves the suggestions based on
   * the latest contents of the autocomplete field. We update the
   * autocompleteMatches state variable with the latest suggestions, triggering a
   * re-rendering of the component.
   *************************************************************************/
  function updateAutocomplete(suggestions, status) {
    if (status !== window.google.maps.places.PlacesServiceStatus.OK || !suggestions) {
      setAutocomplete({ boxContents: newSearchValue, suggestions: [], courseChosen: null });
      return;
    }
    let filteredSuggestions = [];
    suggestions.forEach(suggestion => {
      const items = suggestion.description.split(",");
      //  if ((items[0].includes("Golf") || items[0].includes("Country")) &&
      //      (items[0].includes("Course") || items[0].includes("Links") ||
      //          items[0].includes("Resort") || items[0].includes("Club")) &&
      //          !items[0].includes("Disc") && !items[0].includes("Academy") &&
      //          !items[0].includes("Driving Range"))
      //  {
      filteredSuggestions.push({ name: suggestion.description, id: suggestion.place_id });
      //  }
    });
    setAutocomplete({ boxContents: newSearchValue, suggestions: filteredSuggestions, courseChosen: null }); //force re-render
  }

  /*************************************************************************
   * @function handleKeyPress
   * @Desc
   * When the user presses a key, check if it is the tab, enter, or escape
   * key (the three keys we care about). If so, determine which element had
   * the focus and act accordingly: If tab or shift-tab, then shift the focus
   * to next or previous element. If Enter, then call upon handleClick().
   *************************************************************************/
  async function handleKeyPress(event) {
    //event.preventDefault();
    if (event.code === "Escape") {
      closeDialog(null);
      return;
    }
    if (
      event.code === "Enter" &&
      (document.activeElement === addBtn.current || document.activeElement === cancelBtn.current)
    ) {
      closeDialog(autocomplete.courseChosen);
      return;
    }
    if (document.activeElement === dialog.current && event.code === "Tab" && event.shiftKey) {
      cancelBtn.current.focus();
      return;
    }
    if (document.activeElement === dialog.current && event.code === "Tab") {
      addBtn.current.focus();
      return;
    }
    if (document.activeElement === addBtn.current && event.code === "Tab" && event.shiftKey) {
      dialog.current.focus();
      event.stopPropagation();
      return;
    }
    if (document.activeElement === addBtn.current && event.code === "Tab") {
      cancelBtn.current.focus();
      event.stopPropagation();
      return;
    }
    if (document.activeElement === cancelBtn.current && event.code === "Tab" && event.shiftKey) {
      addBtn.current.focus();
      event.stopPropagation();
      return;
    }
    if (document.activeElement === cancelBtn.current && event.code === "Tab") {
      dialog.current.focus();
      event.stopPropagation();
      return;
    }
  }

  /*************************************************************************
   * @function handleAutocompleteChange
   * @param event, the input event
   * @desc
   * When the user types into the autcomplete box, update the autocomplete
   * suggestions.
   *************************************************************************/
  function handleAutocompleteChange(event) {
    newSearchValue = event.target.value;
    if (newSearchValue === "") {
      setAutocomplete({ boxContents: "", suggestions: [], courseChosen: null });
      return;
    }
    if (autocompleteSessionToken === null) {
      //start new session
      autocompleteSessionToken = new window.google.maps.places.AutocompleteSessionToken();
    }
    autocompleteService.getPlacePredictions(
      {
        input: newSearchValue + " Golf",
        // Note: Using broad 'establishment' type because Google Places API
        // doesn't have a specific golf course type. The alternative
        // 'recreational_facility' is too broad and name-based filtering
        // would miss golf courses with non-standard names.
        types: ["establishment"],
        sessionToken: autocompleteSessionToken,
      },
      updateAutocomplete,
    );
  }

  /*************************************************************************
   * @function getDetailsCallback
   * @param course, an object containing the course details from the call
   * to PlacesService.getDetails()
   * @param status, the status of the call to getDetails()
   * @desc
   * This function is called from PlacesService.getDetails to return the
   * results. If status is OK, we can use the results to build an object
   * containing all relevant course info obtainable from Google.
   *************************************************************************/
  function getDetailsCallback(course, status) {
    if (status === window.google.maps.places.PlacesServiceStatus.OK) {
      const courseDetails = {
        shortName: autocomplete.courseChosen.name.substring(0, autocomplete.courseChosen.name.search(",")),
        address: course.formatted_address,
        state: course.address_components.filter(item => item.types.includes("administrative_area_level_1"))[0]
          .long_name,
        country: course.address_components.filter(item => item.types.includes("country"))[0].long_name,
        geoLocation: course.geometry.location,
        viewport: course.geometry.viewport,
        phoneNumber: course.formatted_phone_number,
        website: course.website,
        mapsUrl: course.url,
        imageUrl: "Default",
        numHoles: 18,
        sgContactName: "",
        sgContactDetails: "",
        sgFriendlinessRating: 0,
        sgMembership: false,
        sgRoundDiscount: false,
        sgStandingTeeTimes: false,
        sgPlay: "sgNotAllowed", //Allowable values: "sgNotAllowed", "sgSpecialArrangementOnly", "sgRegularTeeTimesOnly", "sgAnytime"
        sgNotes: "",
        tees: [],
        // tees: {}, // tees should support empty object
        editor: [],
        createdAt: new Date(),
        modifiedAt: new Date(),
      };
      const mergedCourse = Object.assign(autocomplete.courseChosen, courseDetails);
      // closeDialog(mergedCourse);
      /**
       * Instead of calliing closeDialog()... we would update the local storage and call the courses page
       * This way everything gets loaded fresh.
       */
      // addCourseToLocalDB(mergedCourse);
      // navigate('/courses');

      /**
       * Instead of adding the course to local storage, we call redux reducer to add the course to the backend
       */
      dispatch(addCourse(mergedCourse, navigate));
    } else {
      alert("Course could not be added to database. Unknown error occurred");
      closeDialog(null);
    }
  }

  /*************************************************************************
   * @function getCourseDetailsAndClose
   * @desc
   * When the user clicks on the "Add Course" button, we use the Google
   * PlacesService API
   *************************************************************************/
  function getCourseDetailsAndClose() {
    const placesService = new window.google.maps.places.PlacesService(attrib.current);
    const placesDetails = {
      placeId: autocomplete.courseChosen.id,
      fields: ["address_components", "formatted_address", "formatted_phone_number", "geometry", "url", "website"],
      sessionToken: autocompleteSessionToken,
    };
    placesService.getDetails(placesDetails, getDetailsCallback);
  }

  const cancelButtonClickHandler = () => {
    navigate("/courses");
  };

  /* JSX code to render the component */
  return (
    <div
      id="coursesModeDialog"
      ref={dialog}
      tabIndex="0"
      className="action-dialog centered"
      role="dialog"
      aria-modal="true"
      aria-labelledby="newCourseHeader"
      onKeyDown={handleKeyPress}
    >
      <h1>Add Course</h1>
      <div className="mb-3 centered">
        <label htmlFor="courseSearch" className="form-label">
          Search for Course:
        </label>
        <br />
        <div className="autocomplete-wrapper">
          <input
            id="courseSearch"
            ref={courseSearch}
            type="text"
            className="form-control-lg centered autocomplete-input"
            placeholder="Enter a golf course"
            aria-describedby="courseSearchDescr"
            value={autocomplete.boxContents}
            onChange={handleAutocompleteChange}
          />
          <div className="autocomplete-results-wrapper">
            <ul className="autocomplete-results">
              {autocomplete.suggestions.map(item => {
                return (
                  <li key={item.id} className="autocomplete-item" onClick={() => handleAutocompleteItemClick(item)}>
                    {item.name}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
        <div id="courseSearchDescr" className="form-text">
          Enter a golf course to search for
        </div>
        <div id="attributions" ref={attrib}></div>
      </div>
      <div className="mode-page-btn-container">
        <button
          id="coursesModeAddBtn"
          ref={addBtn}
          tabIndex="0"
          className={
            autocomplete.courseChosen != null
              ? "mode-page-btn action-dialog action-button"
              : "mode-page-btn action-dialog action-button disable-btn"
          }
          type="button"
          onClick={getCourseDetailsAndClose}
          onKeyDown={handleKeyPress}
        >
          Add Course
        </button>
        <button
          id="coursesModeCancelBtn"
          ref={cancelBtn}
          tabIndex="0"
          className="mode-page-btn action-dialog cancel-button"
          type="button"
          onClick={/*() => closeDialog(null)*/ cancelButtonClickHandler}
          onKeyDown={handleKeyPress}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
