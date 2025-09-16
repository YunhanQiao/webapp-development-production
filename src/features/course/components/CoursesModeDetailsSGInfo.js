/*************************************************************************
 * File: coursesModeDetailsSGInfo.js
 * This file defines the CoursesModeDetailsSGInfo React component,
 * which enables users to view and edit speedgolf-specific info
 * about the golf course.
 ************************************************************************/
import StarRating from "./StarRating";
import { useCourse, useCourseDispatch } from "../../../components/contexts/CourseContext"; // NEW

export default function CoursesModeDetailsSGInfo() {
  const dispatch = useCourseDispatch();
  const course = useCourse();

  function handleChange(event) {
    dispatch({ type: "UPDATE_SG_INFO", propName: event.target.name, propVal: event.target.value });
  }

  function handleChecked(event) {
    dispatch({ type: "UPDATE_SG_INFO", propName: event.target.name, propVal: event.target.checked });
  }

  function handleRadio(event) {
    dispatch({ type: "UPDATE_SG_INFO", propName: "sgPlay", propVal: event.target.value });
  }

  return (
    <div className='table-responsive'>
      <form>
        <div className='mb-3 centered'>
          <label className='form-label' htmlFor='contactName'>
            Speedgolf Contact Name:
            <input
              id='contactName'
              className='form-control centered'
              type='text'
              size='50'
              name='sgContactName'
              aria-describedby='contactName-descr'
              value={course.sgContactName}
              onChange={handleChange}
            />
          </label>
          <div id='contactName-descr' className='form-text'>
            Name of person to contact if you want to inquire about speedgolf at this course
          </div>
        </div>
        <div className='mb-3 centered'>
          <label className='form-label' htmlFor='contactEmail'>
            Speedgolf Contact Details:
            <input
              id='contactEmail'
              className='form-control centered'
              type='email'
              size='50'
              name='sgContactDetails'
              aria-describedby='contactEmail-descr'
              value={course.sgContactDetails}
              onChange={handleChange}
            />
          </label>
          <div id='contactEmail-descr' className='form-text'>
            Email address, phone number, and/or other means of reaching speedgolf contact person
          </div>
        </div>
        <div className='mb-3 centered'>
          <label className='form-label' htmlFor='starRating'>
            Speedgolf Friendliness Rating:
            <StarRating
              label='Speedgolf friendliness rating, automatically calculated based on factors below'
              numStars={course.sgFriendlinessRating}
              maxStars={5}
            />
          </label>
          <div id='friendlinessRating-descr' className='form-text'>
            Course's speedgolf friendliness rating (0 to 5 stars), automatically calculated based on factors below.
          </div>
        </div>
        <fieldset className='centered'>
          <legend id='playPolicyLabel' className='form-label' htmlFor='sgAllowed'>
            Speedgolf Play Policy
          </legend>
          <div className='mb-3'>
            <div className='form-check' role='radiogroup' aria-labelledby='playPolicyLabel'>
              <div >
                <input
                  id='sgAnytime'
                  className='centered'
                  type='radio'
                  value='sgAnytime'
                  checked={course.sgPlay === "sgAnytime"}
                  aria-checked={course.sgPlay === "sgAnytime"}
                  onChange={handleRadio}
                  aria-labelledby='sgAnytimeLabel'
                />
                <label htmlFor='sgAnytime' style={{ marginLeft: "4px" }}>
                  Allowed <i>anytime</i>, including before regular tee times
                </label>
              </div>
         
              <div>
              <input
                id='sgRegularOnly'
                className='centered'
                type='radio'
                value='sgRegularTeeTimesOnly'
                checked={course.sgPlay === "sgRegularTeeTimesOnly"}
                aria-checked={course.sgPlay === "sgRegularTeeTimesOnly"}
                onChange={handleRadio}
                aria-labelledby='sgRegularOnlyLabel'
              />
              <label id='sgRegularOnlyLabel' htmlFor='sgRegularOnly' >
                &nbsp;Allowed only within regular tee times
              </label>
              </div>
              <div>
              <input
                id='sgSpecialOnly'
                className='centered'
                type='radio'
                value='sgSpecialArrangementOnly'
                checked={course.sgPlay === "sgSpecialArrangementOnly"}
                aria-checked={course.sgPlay === "sgSpecialArrangementOnly"}
                onChange={handleRadio}
                aria-labelledby='sgSpecialArrangementOnlyLabel'
              />
              <label id='sgSpecialArrangementOnlyLabel' htmlFor='sgSpecialOnly'>
                &nbsp;Allowed only by special arrangement
              </label>
              </div>
              <div >
              <input
                id='sgNotAllowed'
                className='centered'
                type='radio'
                value='sgNotAllowed'
                checked={course.sgPlay === "sgNotAllowed"}
                aria-checked={course.sgPlay === "sgNotAllowed"}
                onChange={handleRadio}
                arial-labelledby='sgNotAllowedlabel'
              />
              <label id='sgNotAllowedLabel' htmlFor='sgSpecialOnly'>
                &nbsp;Not allowed
              </label>
              </div>
            </div>
          </div>
        </fieldset>
        <fieldset className='centered' disabled={course.sgPlay === "sgNotAllowed"}>
          <legend id='perksLegend'>Speedgolf Perks</legend>
          <div className='mb-3'>
            <div className='form-checked' role='group'>
              <input
                id='membership'
                className='form-check-input'
                type='checkbox'
                name='sgMembership'
                checked={course.sgMembership}
                aria-checked={course.sgMembership}
                aria-labelledby='membershipLabel'
                onChange={handleChecked}
              />
              <label id='membershiplabel' className='form-check-label' htmlFor='membership'>
                &nbsp;Speedgolf Memberships Available
              </label>
            </div>
          </div>
          <div className='mb-3'>
            <div className='form-checked'>
              <input
                id='roundDiscount'
                className='form-check-input'
                type='checkbox'
                name='sgRoundDiscount'
                checked={course.sgRoundDiscount}
                aria-checked={course.sgRoundDiscount}
                aria-labelledby='roundDiscountLabel'
                onChange={handleChecked}
              />
              <label id='roundDiscountLabel' className='form-check-label' htmlFor='roundDiscount'>
                &nbsp;Speedgolf Round Discounts Available
              </label>
            </div>
          </div>
          <div className='mb-3'>
            <div className='form-checked'>
              <input
                id='standingTeeTimes'
                className='form-check-input'
                type='checkbox'
                name='sgStandingTeeTimes'
                checked={course.sgStandingTeeTimes}
                aria-checked={course.sgStandingTeeTimes}
                aria-labelledby='standingTeeTimesLabel'
                onChange={handleChecked}
              />
              <label id='standingTeeTimesLabel' className='form-check-label' htmlFor='standingTeeTimes'>
                &nbsp;Standing Speedgolf Tee Times Available
              </label>
            </div>
          </div>
        </fieldset>
        <div className='mb-3 centered'>
          <label htmlFor='sgNotes' className='centered'>
            Speedgolf Notes:
          </label>
          <br></br>
          <textarea
            id='sgNotes'
            className='text-wrap'
            rows='7'
            cols='75'
            name='sgNotes'
            value={course.sgNotes}
            onChange={handleChange}
            aria-describedby='notes-descr'
          />
          <div id='notes-descr' className='form-text'>
            Notes and tips for speedgolfers who want to play this course, including details on the course's speedgolf
            policies and perks.
          </div>
        </div>
      </form>
    </div>
  );
}
