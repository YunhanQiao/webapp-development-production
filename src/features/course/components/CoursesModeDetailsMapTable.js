/*************************************************************************
 * File: coursesModeDetailsMapTable.js
 * This file defines the CoursesModeDetailsMapTable React component,
 * which displays the table of hole features on the left-hand side of
 * the "Map" tab. In addition to displaying statistics on the hole
 * features that have been defined (e.g., lengths of transition and
 * golf paths), it allows the user to define hole features and select
 * a hole for which to display a profile elevation chart.
 * ************************************************************************/
import { useCourse, useCourseDispatch } from "../../../components/contexts/CourseContext";
import { useTeeUnits } from "../../../components/contexts/TeeUnitsContext";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Modal, Button } from "react-bootstrap";
import { useState , useRef, useEffect, useMemo} from "react";
import { Line } from "react-chartjs-2";
import CoursesModeDetailsMapHoleProfile from './CoursesModeDetailsMapHoleProfile';

export default function CoursesModeDetailsMapTable({
  showHideSFPath,
  handleProfileClick,
  handleDefineFeature,
  selectFeature,
  enablePathCreation,
  enablePolyCreation,
  setChartData,
  setChartOptions,
  chartData,
  chartOptions, 
  summary
}) {
  const course = useCourse();
  const dispatch = useCourseDispatch();
  const teeUnits = useTeeUnits();

  const [showModal, setShowModal] = useState(false);
  const [selectedHole, setSelectedHole] = useState(null); // Track selected hole
  const chartRef = useRef(null);

  const handleCloseModal = () => setShowModal(false);
  const handleShowModal = () => {
    handleProfileClick("complete"); // Trigger the complete profile generation
    setShowModal(true);
  };

  
  
  function CompleteProfileModal({ show, handleClose, chartData, chartOptions }) {
    const [isResizing, setIsResizing] = useState(false);
    const [modalDimensions, setModalDimensions] = useState({ width: 800, height: 600 });
    const modalRef = useRef(null);


    
    useEffect(() => {
      const updateDimensions = () => {
        const screenWidth = window.innerWidth;
        const newWidth = Math.min(1.0 * screenWidth, 2000); // Width is 100% of the screen
        const newHeight = newWidth * 0.22; // Height is 30% of screen width
        //const newHeight = 50 //Fixd height 
        setModalDimensions({
          width: newWidth,
          height: newHeight,
        });
      };
      updateDimensions();
      window.addEventListener("resize", updateDimensions);
      return () => window.removeEventListener("resize", updateDimensions);
    }, []);
    
  
    useEffect(() => {
      const handleMouseMove = (e) => {
        if (!isResizing) return;
        const newWidth = e.clientX - modalRef.current.getBoundingClientRect().left;
        const newHeight = e.clientY - modalRef.current.getBoundingClientRect().top;
        setModalDimensions({
          width: Math.max(newWidth, 800),   // Set minimum width to 500px
          height: Math.max(newHeight, 400), // Set minimum height to 500px
        });
      };
  
      const handleMouseUp = () => setIsResizing(false);
  
      if (isResizing) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
      }
  
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }, [isResizing]);
  
    const startResizing = () => setIsResizing(true);
    
    
  
    const completeProfileBackground = {
      id: "completeProfileBackground",
      beforeDatasetsDraw(chart, args, pluginOptions) {
        const { ctx, chartArea: { top, bottom, left, right, width, height } } = chart;
        ctx.save();
        const grd = ctx.createLinearGradient(left, top, left, bottom);
        grd.addColorStop(0, "lightblue");
        grd.addColorStop(1, "white");
        ctx.fillStyle = grd;
        ctx.fillRect(left, top, width, height);
        ctx.restore();
      }
    };


    return (
      <Modal
        show={show}
        onHide={handleClose}
        centered
        dialogAs={({ children, ...props }) => (
          <div {...props} style={{
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            margin: 0,
            padding: 0,
            width: `${modalDimensions.width}px`,
            height: `${modalDimensions.height}px`,
          }}>
            {children}
          </div>
        )}
      >
        <div
          ref={modalRef}
          style={{
            width: `${modalDimensions.width}px`,
            height: `${modalDimensions.height}px`,
            minWidth: '500px',
            minHeight: '20px',
            position: 'relative',
            background: 'white',
            border: '1px solid rgba(0,0,0,.2)',
            borderRadius: '.3rem',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Modal.Header closeButton style={{ padding: '0.5rem' }}>
            <Modal.Title>Complete Elevation Profile
            {summary ? (
              teeUnits.selectedUnits === "Imperial" ? (
                ` (${summary.elevationGain ?? 0} ft elevation gain, ${summary.elevationLoss ?? 0} ft elevation loss)`
              ) : (
                ` (${(summary.elevationGain * 0.3048 || 0).toFixed(2)} m elevation gain, ${(summary.elevationLoss * 0.3048 || 0).toFixed(2)} m elevation loss)`
              )
            ) : (
              "(No elevation data available)"
            )}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body
            style={{
              flex: 1,
              overflow: 'auto',
              padding: '10px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {chartData && chartOptions ? (
              <div style={{ flex: 1 }}>
                <Line 
                  data={chartData}
                  options={{
                    ...chartOptions, // Merge the passed chartOptions here
                    maintainAspectRatio: false, // Ensure it scales
                    responsive: true,
                    plugins: {
                      tooltip: {
                        enabled: true,  // Ensure tooltips are enabled
                        mode: 'index',
                        intersect: false,
                        ...chartOptions.plugins.tooltip // Include your custom tooltip logic
                      },
                      legend: {
                        display: true,
                        ...chartOptions.plugins.legend // Add legend settings
                      },
                      annotation: chartOptions.plugins.annotation, // Keep annotations intact
                    },
                  }}
        
                  plugins={[completeProfileBackground]}
                />
              </div>
            ) : (
              <p>Loading chart data...</p>
            )}
          </Modal.Body>
          <Modal.Footer style={{ padding: '1rem' }}>
            <Button variant="secondary" onClick={handleClose}>
              Close
            </Button>
          </Modal.Footer>
          <div
            style={{
              position: 'absolute',
              right: '-5px',
              bottom: '-5px',
              width: '10px',
              height: '10px',
              background: '#007bff',
              cursor: 'se-resize',
            }}
            onMouseDown={startResizing}
          />
        </div>
      </Modal>
    );
  }
  

  /*************************************************************
   * @function handleTeeSFLineChange
   * @param e, the event object returned by the event handler
   * @Desc
   * Update the tee's hasStartLine or hasFinishLine property based on
   * whether the corresopnding toggle switch is selected. This has two
   * important side effects: (a) the insertion point for paths may be
   * updated, and (b) the map may be updated to hide or show a start
   * or finish path that was previously defined. The first side effect
   * is addressed by updating the course state variable. We address
   * the second side effect in this function by invoking the
   * showHideSFPath prop function.
   *************************************************************************/
  function handleTeeSFLineChange(e) {
    if (
      e.target.name === "hasStartLine" &&
      e.target.checked &&
      course.tees[teeUnits.selectedTee].holes[0].startPath !== ""
    ) {
      //Show existing start path
      showHideSFPath("startPath", true);
    } else if (
      e.target.name === "hasStartLine" &&
      !e.target.checked &&
      course.tees[teeUnits.selectedTee].holes[0].startPath !== ""
    ) {
      //Hide existing start path
      showHideSFPath("startPath", false);
    } else if (
      e.target.name === "hasFinishLine" &&
      e.target.checked &&
      course.tees[teeUnits.selectedTee].holes[course.numHoles - 1].finishPath !== ""
    ) {
      //Show existing finish path
      showHideSFPath("finishPath", true);
    } else if (
      e.target.name === "hasFinishLine" &&
      !e.target.checked &&
      course.tees[teeUnits.selectedTee].holes[course.numHoles - 1].finishPath !== ""
    ) {
      //Hide existing finish path
      showHideSFPath("finishPath", false);
    }
    //Update the course state variable
    dispatch({
      type: "SET_HAS_TEE_SF_LINE",
      tee: teeUnits.selectedTee,
      propName: e.target.name,
      has: e.target.checked
    });
  }

  function showHoleProfileBtn(h) {
    if (h.transitionPath !== "" || h.golfPath !== "") {
      return true;
    }
    if (
      h.number === 1 &&
      course.tees[teeUnits.selectedTee].hasStartLine &&
      (h.startLine !== "") & (h.golfPath !== "")
    ) {
      return true;
    }
    if (
      h.number === course.numHoles &&
      course.tees[teeUnits.selectedTee].hasFinishLine &&
      (h.finishLine !== "") & (h.transitionPath !== "") &&
      h.golfPath !== ""
    ) {
      return true;
    }
    return false;
  }

  return (
    <table className='table table-light table-sm map-table-width'>
      <thead>
        <tr className='font-small'>
          <th>Hole</th>
          <th>
            Scrcd
            <br />
            Dist
          </th>
          <th>
            <span className='txt-yellow bg-black'>
              Trans
              <br />
              Path
            </span>
          </th>
          <th>
            <span className='txt-red'>
              Golf
              <br />
              Path
            </span>
          </th>
          <th>
            Run
            <br />
            Dist
          </th>
        </tr>
      </thead>
      <tbody>
        {/* Row with button spanning across 5 columns */}
        <tr>
          <td colSpan={5}>
            <div className='d-flex justify-content-center'>
              <button
                className='btn btn-sm'
                onClick={handleShowModal}
                style={{
                  backgroundColor: "var(--main-color)",
                  borderColor: "var(--main-color)",
                  color: "white"
                }}
              >
                Course Elevation Profile ...
              </button>
            </div>
          </td>
        </tr>

        <tr>
          <td colSpan={5}>
            <div className='flex-container-left'>
              {/* <button className="btn btn-sm btn-primary" onClick={() => handleProfileClick("complete")}> */}
              <div className='form-check form-switch'>
                <input
                  className='form-check-input'
                  name='hasStartLine'
                  type='checkbox'
                  role='switch'
                  onChange={handleTeeSFLineChange}
                  checked={course.tees[teeUnits.selectedTee]?.hasStartLine || false}
                />
                <label
                  className={
                    "form-check-label" + (!course.tees[teeUnits.selectedTee]?.hasStartLine ? " text-muted" : "")
                  }
                  htmlFor='flexSwitchCheckDefault'
                >
                  Start Path:&nbsp;
                </label>
              </div>
              <button
                className={
                  "btn btn-sm" +
                  (course.tees[teeUnits.selectedTee].holes[0].startPath === ""
                    ? enablePathCreation(1, "startPath")
                      ? ""
                      : " btn-gray"
                    : course.tees[teeUnits.selectedTee].hasStartLine
                    ? " btn-start"
                    : " btn-muted-start")
                }
                aria-label={
                  "Start path for " +
                  teeUnits.selectedTee +
                  " " +
                  (course.tees[teeUnits.selectedTee].holes[0].startPath === "" ? "(not yet defined)" : "(defined)")
                }
                onClick={
                  course.tees[teeUnits.selectedTee].holes[0].startPath === ""
                    ? enablePathCreation(1, "startPath")
                      ? () => handleDefineFeature(1, "startPath")
                      : null
                    : () => selectFeature(1, "startPath")
                }
              >
                {course.tees[teeUnits.selectedTee].holes[0].startPath === "" ? (
                  <FontAwesomeIcon icon='plus' />
                ) : (
                  teeUnits.unitConversions.convertToHoleUnits(
                    course.tees[teeUnits.selectedTee].holes[0].startRunDistance
                  )
                )}
              </button>
            </div>
          </td>
        </tr>
        {course.tees[teeUnits.selectedTee].holes.map(h => {
          return (
            <tr key={h.number}>
              <td>
                <span
                  className='d-inline-block'
                  title={
                    showHoleProfileBtn(h)
                      ? "Click to view or hide elevation profile for hole " + h.number
                      : "Elevation profile for hole " +
                        h.number +
                        " not available because its paths are not yet defined"
                  }
                >
                  <button
                    className={"btn btn-sm " + (showHoleProfileBtn(h) ? "btn-profile" : "btn-gray")}
                    onClick={() => handleProfileClick(h.number)}
                  >
                    <b>
                      {h.number}&nbsp;
                      {showHoleProfileBtn(h) ? <FontAwesomeIcon icon='chart-line' color='gray' size='sm' /> : null}{" "}
                    </b>
                  </button>
                </span>
              </td>
              <td>{teeUnits.unitConversions.convertToHoleUnits(h.golfDistance)}</td>
              <td>
                <button
                  className={
                    "btn btn-sm" +
                    (h.number === 1
                      ? " btn-gray"
                      : h.transitionPath === ""
                      ? enablePathCreation(h.number, "transitionPath")
                        ? ""
                        : " btn-gray"
                      : " btn-trans")
                  }
                  aria-label={
                    "Hole " +
                    h.number +
                    " transition path " +
                    (h.transitionPath === "" ? "(not yet defined)" : "(defined)")
                  }
                  onClick={
                    h.number !== 1 && h.transitionPath === ""
                      ? () => handleDefineFeature(h.number, "transitionPath")
                      : () => selectFeature(h.number, "transitionPath")
                  }
                >
                  {h.number === 1 ? (
                    <FontAwesomeIcon icon='xmark' />
                  ) : h.transitionPath === "" ? (
                    <FontAwesomeIcon icon='plus' />
                  ) : (
                    teeUnits.unitConversions.convertToHoleUnits(h.transRunDistance)
                  )}
                </button>
              </td>
              <td>
                <button
                  className={
                    "btn btn-sm" +
                    (h.golfPath !== "" ? " btn-golf" : enablePathCreation(h.number, "golfPath") ? "" : " btn-gray")
                  }
                  aria-label={
                    "Hole " + h.number + " golf path " + (h.golfPath === "" ? "(not yet defined)" : "(defined)")
                  }
                  onClick={
                    h.golfPath === ""
                      ? () => handleDefineFeature(h.number, "golfPath")
                      : () => selectFeature(h.number, "golfPath")
                  }
                >
                  {h.golfPath === "" ? (
                    <FontAwesomeIcon icon='plus' />
                  ) : (
                    teeUnits.unitConversions.convertToHoleUnits(h.golfRunDistance)
                  )}
                </button>
              </td>
              <td>{teeUnits.unitConversions.convertToHoleUnits(h.runDistance)}</td>
            </tr>
          );
        })}
        <tr>
          <td colSpan={5}>
            <div className='flex-container-left'>
              <div className='form-check form-switch'>
                <input
                  className='form-check-input'
                  name='hasFinishLine'
                  id='hasFinishLine'
                  type='checkbox'
                  role='switch'
                  onChange={handleTeeSFLineChange}
                  checked={course.tees[teeUnits.selectedTee].hasFinishLine}
                />
                <label
                  className={
                    "form-check-label" + (!course.tees[teeUnits.selectedTee].hasFinishLine ? " text-muted" : "")
                  }
                  htmlFor='hasFinishLine'
                >
                  Finish Path:&nbsp;
                </label>
              </div>
              <button
                className={
                  "btn btn-sm" +
                  (course.tees[teeUnits.selectedTee].holes[course.numHoles - 1].finishPath === ""
                    ? enablePathCreation(course.numHoles, "finishPath")
                      ? ""
                      : " btn-gray"
                    : course.tees[teeUnits.selectedTee].hasFinishLine
                    ? " btn-start"
                    : " btn-muted-start")
                }
                aria-label={
                  "Finish path for " +
                  teeUnits.selectedTee +
                  " " +
                  (course.tees[teeUnits.selectedTee].holes[course.numHoles - 1].finishPath === ""
                    ? "(not yet defined)"
                    : "(defined)")
                }
                onClick={
                  course.tees[teeUnits.selectedTee].holes[course.numHoles - 1].finishPath === ""
                    ? enablePathCreation(course.numHoles, "finishPath")
                      ? () => handleDefineFeature(course.numHoles, "finishPath")
                      : null
                    : () => selectFeature(course.numHoles, "finishPath")
                }
              >
                {course.tees[teeUnits.selectedTee].holes[course.numHoles - 1].finishPath === "" ? (
                  <FontAwesomeIcon icon='plus' />
                ) : (
                  teeUnits.unitConversions.convertToHoleUnits(
                    course.tees[teeUnits.selectedTee].holes[course.numHoles - 1].finishRunDistance
                  )
                )}
              </button>
             {/* Include the modal component */}
             <CompleteProfileModal 
             show={showModal} 
             handleClose={handleCloseModal} 
             chartData={chartData}
              chartOptions={chartOptions} />
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
