import { useState, useRef, forwardRef, useEffect } from "react";
import SaveCourseModal from "../../features/shared/SaveNewCourse";
import useOutsideClick from "../../hooks/useOutsideClick";
import { addCourseToLocalDB } from "../../services/courseServices";
import { useDispatch, useSelector } from "react-redux";
import { fetchCourses, searchCourses } from "../../features/course/courseActions";
import { useLocation, useNavigate } from "react-router-dom";
import { getPlaceId } from "./services";

const AddCourseAutocomplete = forwardRef(
  ({ value, onChange, name, fetchCourseDetailsCallBack = null, onCourseDelete }, ref) => {
    const coursesDB = JSON.parse(localStorage.getItem("courses"));
    // const [courses, setCourses] = useState(coursesDB === null ? {} : coursesDB);
    const courses = useSelector(state => state.courses);
    const isLoading = useSelector(state => state.user.isLoading);
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [autocomplete, setAutocomplete] = useState({
      boxContents: value?.name ? value?.name : value,
      suggestions: [],
      courseChosen: null,
    });
    const attrib = useRef();
    const courseList = useRef();
    const listItem = useRef();

    const [showModal, setShowModal] = useState(false);
    const [remember, setRemember] = useState(false);

    const fetchAllCoursesAndOneCourseById = async () => {
      await dispatch(fetchCourses(navigate));
      await fetchCourseDetailsCallBack();
    };
    useEffect(() => {
      // This is to keep track of which courses are in DB and which are not in DB
      if (!fetchCourseDetailsCallBack) {
        dispatch(fetchCourses(navigate));
      } else {
        fetchAllCoursesAndOneCourseById();
      }
    }, []);

    useEffect(() => {
      // setAutocomplete({boxContents: value, suggestions: [], courseChosen: null});
      // This is not ideal solution, but this is the only way to handle onCourseDelete
      // Idea is to keep the courseName null in use form hook but different here.
      if (remember) {
        setRemember(false);
        return;
      }
      setAutocomplete(previousState => {
        return { ...previousState, boxContents: value };
      });
    }, [value]);

    const handleCancel = () => {
      setAutocomplete({ boxContents: "", suggestions: [], courseChosen: null });
      setShowModal(false);
    };
    useOutsideClick(courseList, handleCancel);

    const [mergedCourse, setMergedCourse] = useState({});

    // Initialize these variables but don't create Google Maps objects until needed
    let autocompleteService = null;
    let autocompleteSessionToken = null; //null == no current session
    let newSearchValue = "";
    let courseName = {
      name: String,
      id: String,
    };

    function handleSave() {
      // Check if Google Maps API is loaded before using it
      if (!window.google || !window.google.maps) {
        console.warn("Google Maps API not loaded yet");
        return;
      }

      // console.log("didnt find course " + courseName.name.toString);
      const placesService = new window.google.maps.places.PlacesService(attrib.current);
      const placesDetails = {
        placeId: courseName.id,
        fields: ["address_components", "formatted_address", "formatted_phone_number", "geometry", "url", "website"],
        sessionToken: autocompleteSessionToken,
      };
      placesService.getDetails(placesDetails, getDetailsCallback);

      setAutocomplete({ boxContents: "", suggestions: [], courseChosen: null });
      setShowModal(false);
    }

    function waitForModal() {
      setShowModal(true);
      // console.log("in modal")
    }

    /*************************************************************************
     * @function handleAutocompleteItemClick
     * @Desc
     * When the user clicks on an item in the autocomplete dropdown, we
     * place that item in the autocomplete box and set the list of automatches to
     * empty (signifying the end of an autocomplete session).
     * This forces a re-render.
     *************************************************************************/
    async function handleAutocompleteItemClick(item) {
      autocompleteSessionToken = null; //Session is over
      courseName = item;
      // we need this in add rounds mode.
      // we need this commonly in all places. Need to double check
      // if (!location.pathname.toLowerCase().includes('manageaccount')) {
      //     courseName.name = courseName.name.split(',')[0];
      // }
      courseName.name = courseName.name.split(",")[0];
      setAutocomplete({
        ...autocomplete,
        boxContents: courseName.name.split(",")[0],
        suggestions: [],
        courseChosen: courseName,
      }); //Force re-render
      // onChange(courseName.name.split(',')[0]); // seems like this has no effect on the name controlled by useForm hook
      // console.log("item id: " + courseName.name)

      //* Adding this logic here is un necessary. It should be in the parent component

      const pathsToCheck = ["newround", "editround"];
      const isPathIncluded = pathsToCheck.some(path => location.pathname.toLowerCase().includes(path));
      if (isPathIncluded) {
        /**
         * Search courses will return a singular course object with all tees info included.
         * Once that course data is fetched, we just update the local state of the course by its index
         * * IMPORTANT NOTE: The fetched course by search courses will be present in local state, as in-order to search this course
         * * we need to have it in local state. So, we can just update the course by its index.
         */
        await dispatch(
          searchCourses({ searchString: courseName.name.split(",")[0], category: "Name", limit: 1 }, navigate),
        );
      }
      // MAJOR CHANGE: Change; Changed this function call from line 93 to here
      getCourseDetailsAndAddCourse(courseName);
      ref?.current?.focus();
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
    async function updateAutocomplete(suggestions, status) {
      if (status !== window.google.maps.places.PlacesServiceStatus.OK || !suggestions) {
        setAutocomplete({ boxContents: newSearchValue, suggestions: [], courseChosen: null });
        return;
      }
      let filteredSuggestions = [];
      let courseDbId = [];
      let courseDb = [];
      let coursePlaceIds = [];
      let placeIdPromises = [];
      let i = 0;

      Object.keys(courses).forEach(c => {
        if (courses[c].shortName.toUpperCase().includes(newSearchValue.toUpperCase())) {
          // console.log(courses[c].id)
          filteredSuggestions.push({
            name: `${courses[c].shortName}, ${courses[c].address}`,
            id: i,
            tees: courses[c].tees,
            courseId: courses[c].id,
          });
          courseDbId.push(courses[c].id);
          courseDb.push(courses[c]);
          i += 1;
        }
      });

      for (let i = 0; i < courseDb.length; i++) {
        // const placeId = await getPlaceId(courseDb[i], window, attrib);
        // coursePlaceIds.push(placeId);
        placeIdPromises.push(getPlaceId(courseDb[i], window, attrib));
      }
      coursePlaceIds = await Promise.all(placeIdPromises);

      if (filteredSuggestions.length > 0) {
        filteredSuggestions.splice(0, 0, { name: "Current DB Courses", id: "db" });
      }

      let tempSuggestions = [];
      suggestions.forEach(suggestion => {
        const items = suggestion.description.split(",");
        // console.log(suggestion.description);
        if (
          ((items[0].includes("Golf") &&
            (items[0].includes("Course") ||
              items[0].includes("Links") ||
              items[0].includes("Resort") ||
              items[0].includes("Club"))) ||
            (items[0].includes("Country") && items[0].includes("Club"))) &&
          !(items[0].includes("Disc") || items[0].includes("Academy") || items[0].includes("Driving Range"))
        ) {
          /*if ((items[0].includes("Golf") || items[0].includes("Country")) && 
                (items[0].includes("Course") || items[0].includes("Links") || 
                    items[0].includes("Resort") || items[0].includes("Club")) &&
                    !items[0].includes("Disc") && !items[0].includes("Academy") &&
                    !items[0].includes("Driving Range"))*/ let duplicateEntry = false;
          courseDbId.forEach((id, idx) => {
            if (id === suggestion.place_id) {
              duplicateEntry = true;
            }
          });
          coursePlaceIds.forEach((id, idx) => {
            if (id === suggestion.place_id) {
              duplicateEntry = true;
            }
          });
          if (!duplicateEntry) {
            tempSuggestions.push({ name: suggestion.description, id: suggestion.place_id });
          }
        }
      });

      if (tempSuggestions.length > 0) {
        filteredSuggestions.push({ name: "Courses Not in DB", id: "notdb" });
        tempSuggestions.forEach(sugg => {
          filteredSuggestions.push(sugg);
        });
      }
      setAutocomplete({
        boxContents: newSearchValue,
        suggestions: filteredSuggestions,
        courseChosen: null,
      }); //force re-render
    }

    /*************************************************************************
     * @function handleKeyPress
     * @Desc
     * When the user presses a key, check if it is the tab, enter, or escape
     * key (the three keys we care about). If so, determine which element had
     * the focus and act accordingly: If tab or shift-tab, then shift the focus
     * to next or previous element. If Enter, then call upon handleClick().
     *************************************************************************/
    var listItems = [];
    var currentIndex = 0;
    async function handleKeyPress(event) {
      event.stopPropagation();
      if (!event.code.includes("Key")) {
        listItems = document.getElementsByClassName("autocomplete-item");

        if (event.code === "Escape") {
          setAutocomplete({ boxContents: "", suggestions: [], courseChosen: null });
          return;
        }

        if (event.code === "Tab" && !autocomplete.courseChosen) {
          handleCancel();
        }

        if (event.code === "ArrowUp") {
          event.preventDefault();
          if (currentIndex != 0) {
            currentIndex--;
          } else {
            currentIndex = listItems.length - 1;
          }
          listItems[currentIndex].focus();
        } else if (event.code === "ArrowDown") {
          event.preventDefault();
          if (currentIndex <= listItems.length - 1) {
            if (currentIndex === listItems.length - 1) {
              currentIndex = 0;
            } else if (listItems[currentIndex] === document.activeElement) {
              currentIndex++;
            }
            listItems[currentIndex].focus();
          }
        } else if (event.code === "Enter") {
          event.preventDefault();
          if (listItems[currentIndex] === document.activeElement) {
            listItems[currentIndex]?.click();
          }
        } else if (event.code === "Space") {
          if (listItems[currentIndex] === document.activeElement) {
            event.preventDefault();
            listItems[currentIndex]?.click();
          }
        }
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
        onChange("");
        return;
      }

      // Check if Google Maps API is loaded
      if (!window.google || !window.google.maps) {
        console.warn("Google Maps API not loaded yet");
        return;
      }

      // Initialize autocompleteService if not already done
      if (!autocompleteService) {
        // TODO: DEPRECATION WARNING - Migrate to google.maps.places.AutocompleteSuggestion
        // AutocompleteService deprecated as of March 1st, 2025
        // See: https://developers.google.com/maps/documentation/javascript/places-migration-overview
        // At least 12 months notice will be given before discontinuation
        autocompleteService = new window.google.maps.places.AutocompleteService();
      }

      if (autocompleteSessionToken === null) {
        //start new session
        autocompleteSessionToken = new window.google.maps.places.AutocompleteSessionToken();
      }
      autocompleteService.getPlacePredictions(
        {
          input: "golf course " + newSearchValue,
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
          shortName: courseName.name.split(",")[0],
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
          tees: {},
          editor: [],
          createdAt: new Date(),
          modifiedAt: new Date(),
        };

        setMergedCourse(Object.assign(courseName, courseDetails));
        waitForModal();
      } else {
        alert("Course could not be added to database. Unknown error occurred");
        addCourseToLocalDB(null);
      }
    }

    /*************************************************************************
     * @function getCourseDetailsAndClose
     * @desc
     * When the user clicks on the selected list item, we use the Google
     * PlacesService API
     *************************************************************************/
    function getCourseDetailsAndAddCourse(item) {
      let courseInDb = false;

      Object.keys(courses).forEach(c => {
        if (courses[c].shortName === courseName.name) {
          courseInDb = true;
        }
      });

      if (!courseInDb) {
        const placesService = new window.google.maps.places.PlacesService(attrib.current);
        const placesDetails = {
          placeId: item.id,
          fields: ["address_components", "formatted_address", "formatted_phone_number", "geometry", "url", "website"],
          sessionToken: autocompleteSessionToken,
        };
        placesService.getDetails(placesDetails, getDetailsCallback);
      } else {
        onChange(item);
      }
    }

    if (isLoading) {
      return <p>Loading Courses...</p>;
    }

    // JSX code to render the component
    return (
      <div
        id="coursesModeDialog"
        className="action-dialog centered"
        role="dialog"
        aria-modal="true"
        aria-labelledby="newCourseHeader"
        onKeyDown={handleKeyPress}
      >
        <div id="centeredBody" className="centered autocomplete-input-b">
          <div id="courseGroup" className="autocomplete-wrapper-a centered">
            <input
              name={name}
              ref={ref}
              role="combobox"
              aria-autocomplete="list"
              aria-expanded={autocomplete.suggestions.length > 0 ? "true" : "false"}
              aria-controls="results"
              id="roundCourse"
              autoComplete="off"
              type="text"
              className="form-control-sm centered autocomplete-input-a"
              placeholder="Enter a golf course"
              aria-describedby="roundCourseDescr"
              value={autocomplete.boxContents}
              onChange={handleAutocompleteChange}
              onKeyDown={e => {
                if (onCourseDelete) {
                  onCourseDelete(e, onChange, setAutocomplete, setRemember);
                }
              }}
              // onBlur={e => {
              //   onChange(e.target.value);
              // }}
            />
            <div id="resultsWrapper" className="autocomplete-results-wrapper" onKeyDown={handleKeyPress}>
              {autocomplete.suggestions.length > 0 && (
                <ul
                  id="results"
                  className="autocomplete-results"
                  ref={courseList}
                  tabIndex={"-1"}
                  role="listbox"
                  aria-label="Courses"
                >
                  {autocomplete.suggestions.map((item, idx) => {
                    if (item.id == "db" || item.id == "notdb" || item.id == "blank") {
                      return (
                        <li key={item.id} className="autocomplete-item-1">
                          {item.name}
                        </li>
                      );
                    } else {
                      return (
                        <li
                          id={"listItem-" + idx}
                          key={item.id}
                          className="autocomplete-item"
                          ref={listItem}
                          tabIndex={"-1"}
                          role="option"
                          onClick={async () => handleAutocompleteItemClick(item)}
                        >
                          {item.name}
                        </li>
                      );
                    }
                  })}
                </ul>
              )}
            </div>
          </div>
          <div id="attributions" ref={attrib}></div>
        </div>
        {showModal && (
          <div>
            <SaveCourseModal
              course={autocomplete.boxContents}
              id={autocomplete.courseChosen?.id}
              mergedCourse={mergedCourse}
              onChange={onChange}
              clearBox={handleCancel}
              setShowModal={setShowModal}
            />
          </div>
        )}
      </div>
    );
  },
);

export default AddCourseAutocomplete;
