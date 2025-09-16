/*************************************************************************
 * File: StarRating.js
 * This file defines the StarRating React component, which displays a
 * graphical representation of a rating on a scale of 1 to maxStars.
 * To support accessibility, the component gives 
 * itself a tabIndex of 0, and an aria-label that includes the label
 * prop and also a string of the form "numStars stars out of maxStars"
 ************************************************************************/ 
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';

export default function StarRating({label, numStars, maxStars}) {
    const starArray = Array.from({length: maxStars}, (_, i) => i + 1);

    return(
        <div tabIndex="0" aria-label={label + numStars + " stars out of " + maxStars}>
            {starArray.map((i) => {
                return(
                <span key={i}
                      className={(i <= numStars) ? 
                                   "star-selected" : "star-unselected"}>
                    <FontAwesomeIcon icon="star"/>
                </span> );
                })
            }
        </div>
    );
}