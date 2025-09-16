import axios from "axios";
const apiURL = process.env.REACT_APP_API_BASE_ENDPOINT;

export const fetchCourses = async jwtToken => {
  try {
    // const FETCH_COURSES_ENDPOINT = process.env.REACT_APP_FETCH_COURSES_ENDPOINT;
    const FETCH_COURSES_ENDPOINT = "courses";
    const response = await axios.get(apiURL + `${FETCH_COURSES_ENDPOINT}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const addCourses = async (course, jwtToken) => {
  try {
    console.log("Course to be added: ", course);
    const response = await axios.post(apiURL + "courses", course, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const searchCourses = async (payload, jwtToken) => {
  try {
    const response = await axios.post(apiURL + `courses/search`, payload, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const fetchCourseById = async (courseId, jwtToken) => {
  try {
    const response = await axios.get(apiURL + `courses/${courseId}`, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const fetchCourseByIds = async (courseIds, jwtToken) => {
  try {
    const response = await axios.post(
      apiURL + `courses/fetch-by-ids`,
      { courseIds },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      },
    );
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const updateCourseInfo = async (courseId, courseInfo, jwtToken) => {
  try {
    const response = await axios.put(apiURL + `courses/update-course-info/${courseId}`, courseInfo, {
      headers: {
        Authorization: `Bearer ${jwtToken}`,
      },
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};

export const updateCourse = async (courseId, course, jwt) => {
  try {
    const response = await axios.put(apiURL + `courses/${courseId}`, course, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });
    return {
      status: response.status,
      data: response.data,
    };
  } catch (error) {
    return {
      status: error.response.status,
      data: error.response.data,
    };
  }
};
