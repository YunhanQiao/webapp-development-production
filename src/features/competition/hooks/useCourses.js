import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useFormContext } from "react-hook-form";
import { teesetsSelector, coursesArraySelector } from "features/competition/competitionSelectors";
import { fetchTeesets } from "features/competition/competitionActions";
import * as CourseServices from "../../course/courseServices";
import { notifyMessage } from "services/toasterServices";
import { logoutUser } from "features/user/userSlice";
import { useNavigate } from "react-router-dom";

export const useTournamentCourses = (initialCourses = [], onCoursesChange) => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [duplicateCourse, setDuplicateCourse] = useState(null);
  const [isLoadingTeesets, setIsLoadingTeesets] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [dropDownOpen, setDropDownOpen] = useState(false);

  const { setValue } = useFormContext();

  const courses = useSelector(coursesArraySelector);
  const teesets = useSelector(teesetsSelector);
  const navigate = useNavigate();
  const token = useSelector(state => state.user.tokens.jwtToken);

  const coursesInDB = useMemo(() => {
    console.log("🔍 Building coursesInDB from courses:", courses);
    return courses.reduce((acc, course) => {
      // Handle both id and _id fields for maximum compatibility
      const courseId = course.id || course._id;
      if (courseId) {
        acc[courseId] = course;
      }
      return acc;
    }, {});
  }, [courses]);

  // 🎯 CONTROLLED COMPONENT: Use initialCourses directly instead of local fields state
  const fields = useMemo(() => {
    console.log("🎯 Computing fields from initialCourses:", initialCourses);
    if (!initialCourses || initialCourses.length === 0) return [];

    return initialCourses.map(course => ({
      _id: course._id || course.courseId,
      courseId: course.courseId || course._id,
      name: course.name || coursesInDB[course.courseId]?.name,
      location: course.location || coursesInDB[course.courseId]?.address,
    }));
  }, [initialCourses, coursesInDB]);

  useEffect(() => {
    const loadTeesets = async () => {
      setIsLoadingTeesets(true);
      try {
        await dispatch(fetchTeesets());
      } finally {
        setIsLoadingTeesets(false);
      }
    };
    loadTeesets();
  }, [dispatch]);

  // Initialize form with current fields
  useEffect(() => {
    if (fields.length > 0) {
      setValue("courseInfo", fields);
    }
  }, [fields, setValue]);

  const handleRemoveCourse = id => {
    console.log("🎯 Removing course:", id);
    console.log("🎯 Current initialCourses:", initialCourses);

    const updatedCourses = initialCourses.filter(course => (course._id || course.courseId) !== id);
    console.log("🎯 Updated courses after removal:", updatedCourses);

    setValue("courseInfo", updatedCourses, {
      shouldDirty: true,
      shouldTouch: true,
    });

    // Update wizard state immediately
    if (onCoursesChange) {
      console.log("🎯 Calling onCoursesChange with:", updatedCourses);
      onCoursesChange(updatedCourses);
    }
  };

  const handleCourseSelectFromSearch = async id => {
    console.log("🎯 Adding course:", id);
    console.log("🎯 Current initialCourses:", initialCourses);
    console.log("🔍 Available coursesInDB keys:", Object.keys(coursesInDB));

    // Check if course already exists in tournament
    const isDuplicate = initialCourses.some(course => (course.courseId || course._id) === id);
    if (isDuplicate) {
      console.log("� Course already added to tournament");
      // Find the course for duplicate modal
      let duplicateCourseInfo = coursesInDB[id];
      if (!duplicateCourseInfo) {
        // If not in local state, create a basic info object
        duplicateCourseInfo = { id, name: `Course ${id}` };
      }
      setDuplicateCourse(duplicateCourseInfo);
      return;
    }

    // Try to get course from existing state first
    let selectedCourse = coursesInDB[id];

    // If course not found in state, try to find it in search results
    if (!selectedCourse) {
      console.log("🔄 Course not in local state, checking search results...");
      selectedCourse = searchResult.find(course => (course.id || course._id) === id);

      if (!selectedCourse) {
        console.error("❌ Course not found in search results either");
        notifyMessage("error", "Course not available. Please search again.", 5000, "colored", "top-center");
        return;
      }

      console.log("✅ Found course in search results:", selectedCourse);
    }

    const newCourse = {
      _id: id,
      courseId: id,
      name: selectedCourse.name,
      location: selectedCourse.address,
    };

    const updatedCourses = [...initialCourses, newCourse];
    console.log("🎯 Updated courses:", updatedCourses);

    setValue("courseInfo", updatedCourses, {
      shouldDirty: true,
      shouldTouch: true,
    });

    // Update wizard state immediately
    if (onCoursesChange) {
      console.log("🎯 Calling onCoursesChange with:", updatedCourses);
      onCoursesChange(updatedCourses);
    }

    setSearchQuery("");
    setSearchResult([]);
    setDropDownOpen(false);
  };

  const showCourseInfo = field => {
    setSelectedCourse(coursesInDB[field.courseId]);
  };

  const closeCourseInfoModal = () => {
    setSelectedCourse(null);
  };

  // Search functionality
  // useEffect(() => {
  //   if (searchQuery !== "" && !isLoadingTeesets) {
  //     const filteredCourses = Object.values(coursesInDB).filter((course) => {
  //       if (
  //         !course?.tees ||
  //         course.tees.length === 0 ||
  //         !course.shortName?.toLowerCase().startsWith(searchQuery.toLowerCase())
  //       ) {
  //         return false;
  //       }
  //       const hasMappedTee = course.tees.some((teeId) => {
  //         const tee = teesets.find((t) => t?.id === teeId);
  //         return tee && (tee.numHolesPathDataComplete === 9 || tee.numHolesPathDataComplete === 18);
  //       });
  //       return hasMappedTee;
  //     });
  //     setSearchResult(filteredCourses);
  //   } else {
  //     setSearchResult([]);
  //   }
  // }, [searchQuery, coursesInDB, teesets, isLoadingTeesets]);

  // Search functionality
  useEffect(() => {
    /*
    let timeoutId;
    if (searchQuery !== "") {
      setIsSearching(true);
      const currentTeesets = teesets; // Capture current value inside effect
      timeoutId = setTimeout(() => {
        const filteredCourses = Object.values(coursesInDB).filter(course => {
          if (
            !course?.tees ||
            course.tees.length === 0 ||
            !course.shortName?.toLowerCase().startsWith(searchQuery.toLowerCase())
          ) {
            return false;
          }
          const hasMappedTee = course.tees.some(teeId => {
            const tee = currentTeesets.find(t => t?.id === teeId);
            return tee && (tee.numHolesPathDataComplete === 9 || tee.numHolesPathDataComplete === 18);
          });
          return hasMappedTee;
        });
        setSearchResult(filteredCourses);
        setIsSearching(false);
      }, 300);
    } else {
      setSearchResult([]);
      setIsSearching(false);
    }
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };*/
    const fetchCourses = async () => {
      try {
        if (searchQuery === "") {
          setSearchResult([]);
          setDropDownOpen(false);
          return;
        }
        setIsSearching(true);
        setDropDownOpen(true); // Open dropdown when searching
        const response = await CourseServices.searchCourses(
          { searchString: searchQuery, category: "Name", limit: 50 },
          token,
        );
        if (response.status === 200) {
          const fetchedCourses = response.data;
          const currentTeesets = teesets;
          const filteredCourses = fetchedCourses.filter(course => {
            if (!course.tees || course.tees.length === 0) {
              return false;
            }
            const hasMappedTee = course.tees.some(teeId => {
              const tee = currentTeesets.find(t => t?.id === teeId);
              return tee && (tee.numHolesPathDataComplete === 9 || tee.numHolesPathDataComplete === 18);
            });
            return hasMappedTee;
          });
          setSearchResult(filteredCourses);
          setDropDownOpen(filteredCourses.length > 0); // Only keep open if results found
        } else if (response.status === 401) {
          const responseMessage = `Please Login Again! \n ${response.data.message ? response.data.message : ""}`;
          notifyMessage("error", responseMessage, 1000, "colored", "top-center");
          dispatch(logoutUser());
          navigate("/login");
        } else {
          const errorMessage = `Failed to fetch Courses! \n ${response.data.message ? response.data.message : ""}`;
          throw new Error(errorMessage);
        }
      } catch (err) {
        notifyMessage("error", err.message, 1000, "colored", "top-center");
        setDropDownOpen(false); // Close dropdown on error
      } finally {
        setIsSearching(false);
      }
    };
    if (searchQuery) {
      fetchCourses();
    }
  }, [searchQuery, coursesInDB, token, teesets, dispatch, navigate]);

  return {
    searchQuery,
    setSearchQuery,
    searchResult,
    selectedCourse,
    fields,
    handleCourseSelectFromSearch,
    handleRemoveCourse,
    showCourseInfo,
    closeCourseInfoModal,
    coursesInDB,
    duplicateCourse,
    setDuplicateCourse,
    isLoadingTeesets,
    isSearching,
    dropDownOpen,
    setDropDownOpen,
  };
};
export default useTournamentCourses;
