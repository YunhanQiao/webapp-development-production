const clubMapping = {
  sgDriver: '1W',
  sg3W: '3W',
  sg4W: '4W',
  sg5W: '5W',
  sgHybrid: 'HY',
  sg7W: '7W',
  sg2I: '2I',
  sg3I: '3I',
  sg4I: '4I',
  sg5I: '5I',
  sg6I: '6I',
  sg7I: '7I',
  sg8I: '8I',
  sg9I: '9I',
  sgPW: 'PW',
  sgGW: 'GW',
  sgSW: 'SW',
  sgLW: 'LW',
  sgPutter: 'P'
};

// Function to get the shorthand notation
export const getShorthand = (longForm) => {
  return clubMapping[longForm] || null;
};

export const convertClubsToShorthand = (clubs) => {
  let clubShorthand = [];
  for (let club of clubs) {
    clubShorthand.push(getShorthand(club));
  }
  // console.log('CLUB SHORTHAND: ', clubShorthand);
  return clubShorthand;
}

export const formatDateToMMDDYYYY = (dateString) => {
  if (dateString == null) {
    return null;
  }
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  // return `${month}/${day}/${year}`;
  return `${year}-${month}-${day}`
};

export const getCourseIdByName = (courses, courseName) => {
  console.log('course name from utils: ', courseName);
  const course = courses.find(course => course.shortName === courseName);
  if (course)
  return course.id;
  return null;
}