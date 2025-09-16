

export const addCourseToLocalDB = (courseObject) => {
  const coursesDB = JSON.parse(localStorage.getItem('courses'));
  const modifiedCourses = {...coursesDB, ...{[courseObject.id]:courseObject}};
  localStorage.setItem('courses', JSON.stringify(modifiedCourses));
  return true;
}

export const updateCourseInLocalDB = (updatedCourseObject) => {
  const coursesDB = JSON.parse(localStorage.getItem('courses'));
  coursesDB[updatedCourseObject.id] = updatedCourseObject;
  localStorage.setItem("courses", JSON.stringify(coursesDB));
  return true;
}

