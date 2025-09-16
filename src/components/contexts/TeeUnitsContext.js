/*************************************************************************
 * TeeUnitsContext.js
 * This file implements the Provider pattern to make the selectedTee and
 * selectedUnits variables available to children of CoursesModeDetails.
 * It defines custom useTeeUnits and useTeeUnitsDispatch hooks, which 
 * are called by child components of CoursesModeDetails to access
 * the selectedTee and selectedUnits variables and to dispatch actions
 * to update those variablese.
************************************************************************/
import { createContext, useContext, useReducer } from 'react';
import * as Conversions from '../../conversions.js';
const TeeUnitsContext = createContext(null);
const TeeUnitsDispatch = createContext(null);

//This object contains the conversion functions and abbreviations
//for imperial and metric units. One of its subobjects is assigned to the 
//unitConversions variable in the TeeUnitsProvider
const imperialMetricConversions ={
    'Imperial': {
        convertToFt : Conversions.yardsToFeet,
        convertToHoleUnits : Conversions.toYards,
        golfUnitsAbbrev : "yds",
        convertToTotalUnits : Conversions.toMiles,
        runUnitsAbbrev : "mi"
        },
    'Metric': {
        convertToFt : Conversions.metersToFeet,
        convertToHoleUnits : Conversions.toMeters,
        golfUnitsAbbrev : "m",
        convertToTotalUnits : Conversions.toKilometers,
        runUnitsAbbrev : "km",
    }
}

/*************************************************************************
 * @function TeeUnitsProvider
 * @param children, the child components of CoursesModeDetails
 * @param initialValues, the initial values of the selectedTee and     
 * selectedUnits variables, provided in an object wtih those props.
 * SelectedTee can be any string and selectedUnits can be either
 * "Imperial" or "Metric".
 * @Desc    
 * This function implements the Provider pattern to make the selectedTee,
 * selectedUnits, and unitConversions variables available to children of
 * CoursesModeDetails. 
 * @returns the TeeUnitsContext.Provider component
 * @see https://reactjs.org/docs/context.html
 *************************************************************************/
export function TeeUnitsProvider ({children, initialValues})  {

    const initialTeeUnits = {selectedTee: initialValues.selectedTee,
                             selectedUnits: initialValues.selectedUnits,
                             unitConversions: imperialMetricConversions[initialValues.selectedUnits],
                             pathAutoAdvance: true,
                             polyAutoAdvance: true,
                             statusMessage: ""}

    const [teeUnits, dispatch] = useReducer(teeUnitsReducer, initialTeeUnits); 
        
    return (
        <TeeUnitsContext.Provider value={teeUnits}>
            <TeeUnitsDispatch.Provider value={dispatch}>
                {children}
            </TeeUnitsDispatch.Provider>
        </TeeUnitsContext.Provider>
    );
}

export function useTeeUnits(){
    return useContext(TeeUnitsContext);
}

export function useTeeUnitsDispatch(){
    return useContext(TeeUnitsDispatch);
}

/*************************************************************************
 * @function teeUnitsReducer
 * @param selectedValues, a tuple of strings containing the selected tee
 * and units
 * @param action, the action to be performed to change selectedValues
 * @Desc
 * This function is called by the useReducer hook to update selectedvalues
 * tuple in response to a change event initiated by the user.
 * @returns the updated selectedValues tuple
 *************************************************************************/
function teeUnitsReducer(selectedValues, action) {
    const newSelectedValues = {...selectedValues};

    switch(action.type){
        case "UPDATE_SELECTED_TEE": {
            newSelectedValues.selectedTee = action.selectedTee;
            return newSelectedValues;
        }
        case "UPDATE_SELECTED_UNITS": {
            newSelectedValues.selectedUnits = action.selectedUnits;
            newSelectedValues.unitConversions = imperialMetricConversions[action.selectedUnits];
            return newSelectedValues;
        }   
        case "UPDATE_AUTO_ADVANCE": {
            newSelectedValues[action.autoAdvanceType] = action.autoAdvanceValue;
            return newSelectedValues;
        }
        case "UPDATE_STATUS_MESSAGE": {
            newSelectedValues.statusMessage = action.statusMessage;
            return newSelectedValues;
        }
        default:{
            throw Error("Unknown action: " + action.type);
        }
    }
}