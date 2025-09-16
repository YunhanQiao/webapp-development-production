/***********************************************************************************************
 * File: CoursesModeDetailsMapStatus.js
 * This file define a react component to display the map status message and 
 * 'auto-advance' selectors for path and polygon definition. The status message gives the user
 * a hint as to what they can do or what is in progress. If 'auto-advance' mode is selected,
 * the user can continuously define paths or polygons for the tee without having to manually
 * select the next hole. The user can terminate auto-advance by triple-clicking. 
 ***********************************************************************************************/
import { useState} from 'react';
import { useTeeUnits, useTeeUnitsDispatch }  from '../../../components/contexts/TeeUnitsContext';
import { useCourse, useCourseDispatch } from '../../../components/contexts/CourseContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

export default function CoursesModeDetailsMapStatus() {

    const teeUnits = useTeeUnits();
    const teeUnitsDispatch = useTeeUnitsDispatch();
    //const [status, setStatus] = useState({message: "Hello world", autoPath: true, autoPoly: true});

     /*************************************************************************
     * @function updateAutoAdvance
     * @param event, the event object returned by the event handler
     * @Desc 
     * Update the auto advance value when the user moves one of the auto
     * advance toggle buttons. 
     *************************************************************************/
     function updateAutoAdvance(event) {
        teeUnitsDispatch({type: "UPDATE_AUTO_ADVANCE", autoAdvanceType: event.target.name, autoAdvanceValue: event.target.checked});
    }

    return(          
            <div className="flex-container-vertical">
                <div className="form-check form-switch">
                    <input className="form-check-input" name="pathAutoAdvance"
                          type="checkbox" role="switch"
                          checked={teeUnits.pathAutoAdvance} onChange={updateAutoAdvance} />
                    <label className="form-check-label" htmlFor="flexSwitchCheckDefault">Auto-advance transition/golf path&nbsp;
                      <FontAwesomeIcon icon="info-circle" size="lg" color="#13294e" title="Streamline path definition by advancing automatically to next path when previous path is defined"/>&nbsp;</label>
                </div>
                <div className="fs-6 fw-bold fst-italic">{teeUnits.statusMessage}</div>
            </div>
    );
}