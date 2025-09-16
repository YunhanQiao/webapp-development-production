/*************************************************************************
 * CoursesModeDetailsHeader.js
 * This file defines the CoursesModeDetailsHeader React component, which
 * displays the name of the course whose details are being displayed.
 ************************************************************************/
import {useCourse} from '../../../components/contexts/CourseContext'; 

export default function CoursesModeDetailsHeader() {
	const course = useCourse();

	return (    
		<div className="no-space">
			<h2 className="centered no-space">{course.shortName}</h2>
		</div>
	);
}