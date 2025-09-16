 /*************************************************************************
 * File: coursesModeDetailsMapHoleMap.js
 * This file defines the CoursesModeDetails React component, which enables
 * users to view and edit the basic data on a golf course.
 ************************************************************************/

import { useEffect, useState, useRef } from 'react';
//import 'chart.js/auto';
import mapboxgl from 'mapbox-gl';
import CustomMap from './CustomMap';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css'
import FontawesomeMarker from 'mapbox-gl-fontawesome-markers'
import * as SGCalcs from '../../../speedgolfCalculations'
import * as Conversions from '../../../conversions'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useCourse, useCourseDispatch } from '../../../components/contexts/CourseContext';
import { useTeeUnits, useTeeUnitsDispatch } from '../../../components/contexts/TeeUnitsContext';
import CoursesModeDetailsMapTable from './CoursesModeDetailsMapTable';
import CoursesModeDetailsMapHoleProfile from './CoursesModeDetailsMapHoleProfile';
import CoursesMode from './CoursesMode';

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;
 
export default function CoursesModeDetailsMap()  {

  const course = useCourse();
  const courseDispatch = useCourseDispatch();
  const teeUnits = useTeeUnits();
  const teeUnitsDispatch = useTeeUnitsDispatch();
 
  //previous props to account for: {xholes, xpathInsertionPt, xpolyInsertionPt, xmapCenter, xupdateFeature, xdistUnits}
 
   /* Enumerated type for top-level state of "Hole Map" */
   const holeMapTool = {
     SELECT: 0,
     DEFINE_PATH: 1,
     DEFINE_POLYGON: 2
   };
   Object.freeze(holeMapTool);
 
    /* Static object mapping hole features to line colors */
    const lineColor = {
     golfPath: '#FF0000',
     transitionPath: '#FFFF00',
     startPath: '#A9A9A9',
     finishPath: '#A9A9A9',
     teebox: '#0000FF',
     green: '#90EE90',
   };
   Object.freeze(lineColor);
 
   /* Static object mapping hole features to text labels displayed on map */
   const featureLabel = {
     startPath: 'Start',
     transitionPath: 'Transition',
     golfPath: 'Golf',
     finishPath: 'Finish',
     teebox: 'Tee',
     green: 'Green',
   };
   Object.freeze(featureLabel);
 
   /* defineFeature describes the feature currently being edited, e.g., hole 1's transition path . */
   const [defineFeature, setDefineFeature]  = useState(null);
   //const feature = useRef(null);
 
   /* profileHole keeps track hole currently displayed in profile view. Will become part of 'status. */
   const [profileHole, setProfileHole] = useState(0);
   
   /* zoom, lng, and lat keep track of current zoom and focus of map */
   const [zoom, setZoom] = useState(15);
   const [lng, setLng] = useState(course.geoLocation.lng);
   const [lat, setLat] = useState(course.geoLocation.lat);
 
   //The div containing the mapbox map object
   const mapContainer = useRef();
 
   //The mapbox map object
   const map = useRef();
 
   //The mapbox draw object
   const draw = useRef();
 
   //Array of layer ids of all paths, labels, polygons, and markers added to the map
   const mapFeatures = useRef({});
   const prevTee = useRef(null);
    
   //Popup for displaying distance info when path is hovered over
   const pathPopup = useRef(new mapboxgl.Popup({closeButton: false}));
 
   //Layer Id of feature currently selected.
   const selectedFeatureId = useRef(null); 

   const [chartData, setChartData] = useState(null); // Initialize state for chart data
    const [chartOptions, setChartOptions] = useState(null); // Initialize state for chart options
    /*********************************************************************
    * @function handleDefineFeature 
    * @desc 
    * When the user chooses to define a feature (path or polygon) by
    * (a) clicking on the item in the table or (b) through auto-advance,
    * we set the defineFeature state variable, which triggers the
    * useEffect toggle the draw tool.
    * @param holeNum, the hole number where the feature will be defined
    * @param featureType: startPath, transitionPath, golfPath, teebox,
    *        green, or finishPath
    ********************************************************************/
   function handleDefineFeature(holeNum, featureType) { 
     setDefineFeature({holeNum: holeNum, featureType: featureType});
     //feature.current = {holeNum: holeNum, featureType: featureType};
   }

   
   /*********************************************************************
    * PATH & POINT UTILITY FUNCTIONS
    * *******************************************************************/
 
   /*********************************************************************
    * @function computeDestinationPoint 
    * @desc 
    * Compute a point along line defined by start and end that lies
    * d2 feet from start. Serves as ancillary function for getSampledPath().
    * @param start, end, the start and end points of the line
    * @param d2, the distance along the line to find the point
    * @returns the coordinates of the line on the path.
    ********************************************************************/
   function computeDestinationPoint(start, end, d2) {
     let xa = start.lng
     let ya = start.lat
     let xb = end.lng
     let yb = end.lat
     let d = Math.sqrt(Math.pow((xa - xb), 2) + Math.pow((ya - yb), 2))
     let xc = xa - ((d2 * (xa - xb)) / d)
     let yc = ya - ((d2 * (ya - yb)) / d)
     return {lng: xc, lat: yc}
   }
 
   /*********************************************************************
   * @function getSampledPath 
   * @desc 
   * Given a set of coords defining a line, create a new line
   * where the distance between each point is spaced
   * samplingDistanceInFeet apart.
   * @param map -- the mapbox GL object where the path is plotted
   * @param coords -- a set of coords ({lat, lng, elv} defining
   *        the path.
   * @param samplingDistInFeet -- the amount of distance in feet 
   *        between each point on the new line.
   * @returns an array of coordinates defining the newly sampled path 
   ********************************************************************/
   function getSampledPath(coords) {
     const metersTo10Km = 0.00001;
     const feetTo10Km = 0.3048 * metersTo10Km;
     const samplingDistance = SGCalcs.samplingDistInFeet * feetTo10Km;
     let arr = [];
     for(let i = 0; i < coords.length-1; i++) {
       const distance = Math.sqrt(Math.pow((coords[i].lng - coords[i+1].lng), 2) + Math.pow((coords[i].lat - coords[i+1].lat), 2))
       for(let j = 0; j <= distance / samplingDistance; j++) {
         const dest = computeDestinationPoint(coords[i], coords[i+1], samplingDistance * j)
         const elv = map.current.queryTerrainElevation(dest, {exaggerated: false}) * 3.280839895 // convert meters to feet
         arr.push({lat: dest.lat, lng: dest.lng, elv: elv})
       }
     }
     arr.push(coords[coords.length-1]); //Add final point of path to sampled path to ensure sampled path has same length.
     //console.dir(arr)
     return arr;
   }

   /*********************************************************************
    * @function getPathInsertionPoint
    * @desc
    * Returns the location (an object with holeNum and path props) where 
    * the user must define the next path. If all paths have been defined, 
    * returns {holeNum: -1, path: ""}.
    * *******************************************************************/
   function getPathInsertionPoint() {
      if (Object.keys(mapFeatures.current).length === 0) return {holeNum: -1, path: ""};
      const paths = mapFeatures.current[teeUnits.selectedTee].pathIds;
      if (course.tees[teeUnits.selectedTee].hasStartLine && !paths.includes(getFeatureId(1,'startPath'))) {
        return {holeNum: 1, path: 'startPath'};
      }
      if (!paths.includes(getFeatureId(1,'golfPath'))) {
        return {holeNum: 1, path: 'golfPath'};
      }
      for (let i = 2; i <= course.tees[teeUnits.selectedTee].holes.length; ++i) {
        if (!paths.includes(getFeatureId(i,'transitionPath'))) {
          return {holeNum: i, path: 'transitionPath'};
        }
        if (!paths.includes(getFeatureId(i,'golfPath'))) {
          return {holeNum: i, path: 'golfPath'};
        }  
      }
      if (course.tees[teeUnits.selectedTee].hasFinishLine && !paths.includes(getFeatureId(course.tees[teeUnits.selectedTee].holes.length,'finishPath'))) {
        return {holeNum: course.tees[teeUnits.selectedTee].holes.length, path: 'finishPath'};
      }
      return {holeNum: -1, path: ""};
   }

    /*********************************************************************
     * MAP TABLE HELPER FUNCTIONS
     * *******************************************************************/
 
   /*************************************************************************
    * @function enablePathCreation
    * @param holeNum, the hole number of the path
    * @param pathType, the type of the path 
    * @Desc 
    * Determines whether the '+' button associated with the path in the hole
    * pane should be enabled or disabled. Only the path at the current 
    * insertion point may be defined.
    * @return true if path is at current insertion point, false otherwise
    *************************************************************************/
   function enablePathCreation(holeNum, pathType) {
     return (holeNum === course.tees[teeUnits.selectedTee].pathInsertionPoint.holeNum && 
             pathType === course.tees[teeUnits.selectedTee].pathInsertionPoint.path);
   }
 
   /*************************************************************************
    * @function enablePolyCreation
    * @param holeNum, the hole number of the polygon
    * @param pathType, the type of polygon 
    * @Desc 
    * Determines whether the '+' button associated with the polygon in the hole
    * pane should be enabled or disabled. Only the polygon at the current 
    * insertion point may be defined.
    * @return true if polygon is at current insertion point, false otherwise
    *************************************************************************/
   function enablePolyCreation(holeNum, polyType) {
     return (holeNum === course.tees[teeUnits.selectedTee].polyInsertionPoint.holeNum && 
             polyType === course.tees[teeUnits.selectedTee].polyInsertionPoint.poly);
   }

    /*************************************************************************
     * @function getFeatureId
     * @param holeNum, the hole number of the feature
     * @param featureType, the type of feature (golfPath, transitionPath, etc.)
     * @Desc
     * Returns the unique layer id of the feature, e.g., H01golfPath_White
     * ************************************************************************/
   function getFeatureId(holeNum, featureType) {
      return (holeNum < 10) ? `H0${holeNum}${featureType}_${mapFeatures.current[teeUnits.selectedTee].origTeeName}` :
                              `H${holeNum}${featureType}_${mapFeatures.current[teeUnits.selectedTee].origTeeName}`;
    }

     /*************************************************************************
     * @function getFeatureLabelId
     * @param holeNum, the hole number of the feature
     * @param featureType, the type of feature (golfPath, transitionPath, etc.)
     * @Desc
     * Returns the unique layer id of the feature label, 
     * e.g., H01golfPath_White_label
     * ************************************************************************/
    function getFeatureLabelId(holeNum, featureType) {
      return (holeNum < 10) ? `H0${holeNum}${featureType}_${mapFeatures.current[teeUnits.selectedTee].origTeeName}_label` :
                              `H${holeNum}${featureType}_${mapFeatures.current[teeUnits.selectedTee].origTeeName}_label`;
    }

    /*************************************************************************
     * @function showHideSFPath
     * @param pathType, the type of path (startPath or finishPath)
     * @param show, true to show, false to hide
     * @Desc
     * Shows or hides the start or finish path, depending on the value of
     * the show parameter. This function is called when the slides the
     * toggle switch for the start or finish path. 
     * ************************************************************************/
   function showHideSFPath(pathType, show) {
      let pathId, pathLabel, marker
      if (pathType === 'startPath') {
        pathId = getFeatureId(1,'startPath');
        pathLabel = getFeatureLabelId(1,'startPath');
        marker = mapFeatures.current[teeUnits.selectedTee].markers[0].start;
      }
      else if (pathType === 'finishPath') {
        pathId = getFeatureId(course.numHoles,'finishPath');
        pathLabel =  getFeatureLabelId(course.numHoles,'finishPath');
        marker = mapFeatures.current[teeUnits.selectedTee].markers[course.numHoles-1].finish;
      } else {
        throw Error(`Invalid pathType: ${pathType}`);
      }
      if (show) {
        map.current.setLayoutProperty(pathId,'visibility','visible');
        map.current.setLayoutProperty(pathLabel,'visibility','visible');
        marker.getElement().style.visibility = 'visible'; 
      } else { //hide
        map.current.setLayoutProperty(pathId,'visibility','none');
        map.current.setLayoutProperty(pathLabel,'visibility','none');
        marker.getElement().style.visibility = 'hidden';
      }
    }

 
   /*************************************************************************
    * BEGIN USEEFFECT HOOKS
    ************************************************************************/

   /*************************************************************************
    * useEffect() for map instantiation
    * Create the mapbox map object and attach to mapContainer DOM element
    *************************************************************************/
   useEffect(() => {  
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY;
     if (map.current) return;
     //Instantiate a mapbox Map object and attach to mapContainer DOM element
      map.current = new CustomMap({
       container: mapContainer.current,
       style: 'mapbox://styles/mapbox/satellite-streets-v12',
       center: [lng, lat],
       zoom: zoom
     });
                  
   }, [lat,lng,zoom]); //end use effect; should be executed only once
 
 
  /*************************************************************************
  * @function on render handler
  * @Desc 
  * This handler appears necessary to allow the user to scale the map to
  * consume the entire window
  *************************************************************************/
  useEffect(() => {
    if (!map.current) return;
    map.current.on('render', () => {
      map.current.resize();
    });
  });
  
  /*************************************************************************
  * @function map on load handler (in useEffect)
  * @Desc 
  * When map is first loaded, add the mapbox 'terrain-rgb' source 
  * (satellite imagery with street and place labels), and set the terrain
  * to the source with an exaggeration of 1 (to give slight 3D appearance)
  *************************************************************************/
   useEffect(() => {
     if (!map.current) return;
     console.log("In useEffect with map load");
     function onLoad() {
      if (map.current.getSource('mapbox-golf') === undefined) {
        console.log("Map load: Adding source");
        map.current.addSource('mapbox-golf', {
        'type': 'raster-dem',
        'url': 'mapbox://mapbox.terrain-rgb',
        'tileSize': 256,
        'maxzoom': 15
        });
        map.current.setTerrain({ 'source': 'mapbox-golf', 'exaggeration': 1 });
        console.log("In onload: Calling displayCurrentTeeFeaturesInMap");
        displayCurrentTeeFeaturesInMap();
      } 

     }
     map.current.on('load', onLoad);
        
    return () => {
      if (map.current.loaded() && map.current.getSource('mapbox-golf') !== undefined) {
        console.log("Map unload: Cleaning");
        map.current.setTerrain(); //remove terrain
        map.current.removeSource('mapbox-golf'); //remove source
        map.current.off('load', onLoad); //remove load event handler
        console.log("Map unoad: Destroying map...")
        map.current.remove(); //remove map on cleanup
        map.current = null;
        
      }
      }
  },[]); 

 /*************************************************************************
  * @function useEffect to display tee features in map
  * @Desc
  * Whenever the selected tee changes, use displayCurrentTeeFeaturesInMap()
  * to hide the tee features (paths, labels, and markers) of the previously-
  * selected tee and show the tee features of the newly-selected tee. 
  * Note: displayCurrentTeeFeaturesInMap() is called for the first time
  * from the onload handler, to ensure that the map is loaded. All
  * subsequent calls to displayCurrentTeeFeaturesInMap() are from this
  * useEffect hook.
  * ***********************************************************************/

  useEffect(() => { 
    //We only display features if the initial set of tees has been displayed and
    //the selected tee has changed.
    if (prevTee.current !== null && teeUnits.selectedTee !== prevTee.current) { 
      displayCurrentTeeFeaturesInMap(teeUnits.selectedTee);
    }
   
  },[teeUnits.selectedTee]);
 
     /*************************************************************************
     * @function on move handler
     * @Desc 
     * Update state vars when pan and zoom change, to ensure current pan
     * and zoom are maintained.
     *************************************************************************/
     useEffect(() => {
       map.current.on('move', () => {
         setLng(map.current.getCenter().lng.toFixed(4));
         setLat(map.current.getCenter().lat.toFixed(4));
         setZoom(map.current.getZoom().toFixed(2));
       });
       
     },[lng, lat, zoom]);

    /*************************************************************************
     * map.current event handlers must go in useEffect() hook because they
     * are not available until the map is loaded.
     * ***********************************************************************/
    useEffect(() => {
      if (!map.current) return;
    
      /*************************************************************************
      * @function map click event handler for path selection
      * @param e, the event object
      * @Desc 
      * Invoked when the user clicks on the map in simpleSelect mode. Select
      * the feature clicked on and potentially unselect the currently 
      * selected feature.
      * Note: We use queryRenderedFeatures() to determine if a feature was
      * clicked on. This avoids the need to define a 'click' handler for
      * the specific layers that contain features and labels.
      *************************************************************************/
      map.current.on('click', function (e) {
        const featureIds = mapFeatures.current[teeUnits.selectedTee].pathIds.concat(mapFeatures.current[teeUnits.selectedTee].labelIds);
        const features = map.current.queryRenderedFeatures(e.point,{layers: featureIds});
        if (features.length === 0) { //feature NOT clicked on; may need to unselect current selection
          if (selectedFeatureId.current !== null) {
            //unselect current selection
            console.log("Unselect current selection")
            map.current.setPaintProperty(selectedFeatureId.current,'line-width',3);
            selectedFeatureId.current = null;
          }
          return;
        }
        if (features[0].layer.id.includes('Path')) {
          const selectedLayer = features[0].layer.id.includes("_label") ? 
            features[0].layer.id.substr(0,features[0].layer.id.indexOf("_label")) 
            : features[0].layer.id;
          selectFeature(null, null, selectedLayer);
          console.log("Selected path: " + selectedLayer);
        }
      });

      /*************************************************************************
      * @function map mousemove event handler 
      * @param e, the event object
      * @Desc 
      * Invoked when the user clicks moves the mouse within the map.
      * Checks whether the mouse is over a path. If it is, the cursor
      * is changed to a pointer and the path's distance is displayed in a popup.
      * Note: We use queryRenderedFeatures() to determine if a feature is
      * under the cursor. This avoids the need to define a 'mouseenter'
      * and 'mouseleave' handlers for the feature layers. 
      *************************************************************************/
      map.current.on('mousemove', function (e) { 
        const featureIds = mapFeatures.current[teeUnits.selectedTee].pathIds.concat(mapFeatures.current[teeUnits.selectedTee].labelIds);
        const features = map.current.queryRenderedFeatures(
          e.point,
          {layers: featureIds});
        if (features.length === 0) { //feature NOT moused over
          map.current.getCanvas().style.cursor = '';
          if (pathPopup.current.isOpen)
            pathPopup.current.remove();
          return;
        }
        if (features[0].layer.id.includes('Path')) {
          map.current.getCanvas().style.cursor = 'pointer';
          const pathId = features[0].layer.id.includes("_label") ?
            features[0].layer.id.substr(0,features[0].layer.id.indexOf("_label")) 
            : features[0].layer.id;
          //Display a pop up with distance
          const hNum = parseInt(pathId.substr(1,2));
          const distProp = ((pathId[3] === 'g') ? 'golfRunDistance' :
                              (pathId[3] === 't') ? 'transRunDistance' :
                                (pathId[3] === 's') ? 'startRunDistance' : 'finishRunDistance');
          const dist = ((teeUnits.selectedUnits === 'Imperial') ? 
            `${Conversions.toYards(course.tees[teeUnits.selectedTee].holes[hNum-1][distProp])} yards` :
            `${Conversions.toMeters(course.tees[teeUnits.selectedTee].holes[hNum-1][distProp])} meters`);
          /*Uncomment to display the path type in the popup and additional tooltip in mapbox*/
          // const slicedDistProp = distProp.slice(0, distProp.indexOf('RunDistance'));

          // console.log(slicedDistProp); // This will log 'golf', 'trans', 'start', or 'finish'

          //  //Retrieve the path coordinates
          //  const pathCoordinates = course.tees[teeUnits.selectedTee].holes[hNum-1][pathId[3] === 'g' ? 'golfPath' : 'transitionPath'];
   
          //   // Calculate total elevation gain and loss
          //   let totalElevationGain = 0;
          //   let totalElevationLoss = 0;

          //   for (let i = 1; i < pathCoordinates.length; i++) {
          //     const elevationChange = pathCoordinates[i].elv - pathCoordinates[i - 1].elv;
          //     if (elevationChange > 0) {
          //       totalElevationGain += elevationChange;
          //     } else {
          //       totalElevationLoss -= elevationChange;
          //     }
          //   }
          //   const elevationSummary = `${totalElevationLoss.toFixed(3)} ft Elevation Loss, ${totalElevationGain.toFixed(3)} ft Elevation Gain `;
          //   const distInMiles = Conversions.toMiles(course.tees[teeUnits.selectedTee].holes[hNum - 1][distProp]);
          //    // elevation at the current hovered point
          //   const currentPoint = e.lngLat;
          //   const elevation = map.current.queryTerrainElevation(currentPoint, { exaggerated: false }) * 3.280839895; // convert meters to feet
          // // pathPopup.current.setText(`hole ${hNum} ${slicedDistProp}, ${distInMiles} miles, ${elevation.toFixed(2)} ft elv`)
          // // Set popup text with distance, elevation summary, and current point elevation
          // pathPopup.current
          // .setText(`Hole ${hNum} ${distProp.slice(0, distProp.indexOf('RunDistance'))}, ${distInMiles} miles, ${elevation.toFixed(2)} ft elv\n${elevationSummary}`)
          // .setLngLat(e.lngLat)
          // .addTo(map.current);

          /***************************** */
          pathPopup.current.setText(`Running distance: ${dist}`).setText(`Running distance: ${dist}`)
            .setLngLat(e.lngLat)
            .addTo(map.current);
        } else {
          map.current.getCanvas().style.cursor = '';
        } 
      });
    }); //end useEffect() for map.current event handlers
 
    /**********************************************************************
    * DEFINITION OF DRAW OBJECT AND ASSOCIATED EVENT HANDLERS
    **********************************************************************/
  
  /*************************************************************************
   * Define Mapbox draw object
   * @Desc 
   * On map load, and when the draw mode changes, we need to instantiate 
   * a map draw object to accommondate the current mode. This is defined
   * within a useEffect
   *************************************************************************/
  const [summary, setSummary] = useState(0);
  
  // Function to calculate the summary
  const calculateSummary = () => {
    let elevationGain = 0;
    let elevationLoss = 0;
    let totalRunDistance = 0;

    for (let h = 0; h < course.tees[teeUnits.selectedTee].holes.length; h++) {
      const hole = course.tees[teeUnits.selectedTee].holes[h];
      //console.log("Tran Run + golf RUn  : ", hole.transRunDistance+ " : " + hole.golfRunDistance, hole.transRunDistance + hole.golfRunDistance);
      //console.log("Run Distance : ", hole.runDistance);
      // Accumulate golf and transition distances
      //console.log("Hole property : ", hole);
      // totalGolfDistance += hole.golfRunDistance;
      // totalTransDistance += hole.transRunDistance;
      totalRunDistance += hole.runDistance

      // Calculate elevation gain/loss for transition path
      if (Array.isArray(hole.transitionPathSampled)) {
          const transElevations = hole.transitionPathSampled.map(pt => pt.elv);
          for (let i = 1; i < transElevations.length; i++) {
              const diff = transElevations[i] - transElevations[i - 1];
              if (diff > 0) {
                  elevationGain += diff;
              } else {
                  elevationLoss += Math.abs(diff);
              }
          }
      }

      // Calculate elevation gain/loss for golf path 
      if (Array.isArray(hole.golfPathSampled)) {
        // Calculate elevation gain/loss
        const golfelevations = hole.golfPathSampled.map(pt => pt.elv);
        for (let i = 1; i < golfelevations.length; i++) {
          const diff = golfelevations[i] - golfelevations[i - 1];
          if (diff > 0) {
            elevationGain += diff;
          } else {
            elevationLoss += Math.abs(diff);
          }
        }
      }
    }

    //const tempDist = (totalGolfDistance + totalTransDistance) ;
    //const totalDistanceMiles = parseInt(tempDist/conversionFactor.current)
    //totalRunDistance = parseFloat(totalRunDistance/5280)
      // Convert total distance and elevation units based on the selected units
    
    if (teeUnits.selectedUnits === "Imperial") {
      totalRunDistance = parseFloat(totalRunDistance / 5280); // Convert feet to miles
  } else {
     totalRunDistance = parseFloat( totalRunDistance / 3280.84); // Convert feet to kilometers
      // elevationGain *= 0.3048; // Convert feet to meters
      // elevationLoss *= 0.3048; // Convert feet to meters
  }
    // console.log("Total distance in miles : ", totalRunDistance);
    // console.log("Elevation Gain in course mode detail map  : ", elevationGain);
    // console.log("Elevation Loss in course mode detail map : ", elevationLoss);
   
    setSummary({
      //totalDistance: totalDistanceMiles.toFixed(2),
      totalDistance: totalRunDistance.toFixed(2),
      elevationGain: elevationGain.toFixed(0),
      elevationLoss: elevationLoss.toFixed(0),
    });

  };


    useEffect(() => {
      if (!map.current) return;
       const lineStyleObj = {
        'id': 'gl-draw-line',
        'type': 'line', 
        'filter': ['all', ['==', '$type', 'LineString'], ['!=', 'mode', 'static']], 
        'layout': { 
          'line-cap': 'round', 
          'line-join': 'round' 
        },
        'paint': { 
          'line-width': 3, 
          'line-dasharray': [0.2, 2],
          'line-color': (defineFeature !== null ? 
            lineColor[defineFeature.featureType] : '#FFFFFF')
        }
      };
      const pointStyleObj =  {
        "id": "gl-draw-polygon-and-line-vertex-halo-active",
        "type": "circle",
       "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
       "paint": {
         "circle-radius": 5,
         "circle-color": (defineFeature !== null ? 
           lineColor[defineFeature.featureType] : '#FFFFFF')
       }
      };
      draw.current = new MapboxDraw({
        displayControlsDefault: false,
        defaultMode: defineFeature === null ? 'simple_select' :
          (defineFeature.featureType.includes('Path') ? 'draw_line_string' : 
            'draw_polygon'),
        styles: [lineStyleObj, pointStyleObj]
      });
      if (defineFeature !== null) { 
        teeUnitsDispatch({type: "UPDATE_STATUS_MESSAGE", statusMessage: `Define ${featureLabel[defineFeature.featureType]} path for hole # ${defineFeature.holeNum}. Click 'Escape' key to cancel defining current path`});
      } else {
        const pt = getPathInsertionPoint();
        let msg;
        if (pt.path === "") {
          msg = "Congratulations! All paths are defined for this tee set.";
          calculateSummary();
        } else {
          msg = `Click '+' button to define ${featureLabel[pt.path]} path for hole ${pt.holeNum}`;
        }
        teeUnitsDispatch({type: "UPDATE_STATUS_MESSAGE", statusMessage: msg});
      }
      map.current.addControl(draw.current);
      
      return () => {if (map.current) map.current.removeControl(draw.current);}//removeControl on cleanup
     },[defineFeature]);
  
     /*************************************************************************
    * useEffect() to keep map in synch with course object
    * @Desc 
    * This  useEffect() hook is called whenever the course object changes.
    * We need to update the map to reflect the changes as follows:
    * (a) stale 'dragend' event handlers, which depend on the course state
    * variable, need to be updated. For info on state function closures,
    * see https://stackoverflow.com/questions/62806541/how-to-solve-the-react-hook-closure-issue
    * (b) start and finish paths may need to be shown or hidden. 
    *************************************************************************/
  useEffect(() => {
    if (!Object.hasOwn(mapFeatures.current,teeUnits.selectedTee)) return;
    function updateMarkerEventHandlers() {
      for (let i = 0; i < mapFeatures.current[teeUnits.selectedTee].markers.length; ++i) {
        const teeMarker = mapFeatures.current[teeUnits.selectedTee].markers[i].tee;
        const flagMarker = mapFeatures.current[teeUnits.selectedTee].markers[i].flag;
        if (teeMarker !== null) {
          teeMarker.off('dragend'); //remove stale event handler
          teeMarker.on('dragend',()=>handleTeeDragEnd(i+1,teeMarker));
        }
        if (flagMarker !== null) {
          flagMarker.off('dragend'); //remove stale event handler
          flagMarker.on('dragend',()=>handleFlagDragEnd(i+1,flagMarker));
        }
      }
    }
    updateMarkerEventHandlers();
},[course]);
 
    /*************************************************************************
     * useEffect() to define 'draw.create' event handler
     *************************************************************************/
   useEffect(() => {   
     /*************************************************************************
      * @function 'draw.create' event handler
      * @desc
      * Called when the user 
      * completes definition of a path or polygon by double-clicking. Based on
      * the feature being defined (in the feature ref variable), 
      * we do any snapping that's required, get the elevations of the points 
      * in the path, and finally add the new path to the course object.
      * NOTE: We have isolated this in its own function so that a new function 
      * closure can be formed every time the defineFeature state variable is updated. 
      *************************************************************************/
      function processDrawnFeature() {
        const lineData = draw.current.getAll();
        if (lineData.features.length === 0) return;
        //If here, we have a feature to add to the map
        const line = lineData.features[0].geometry.coordinates;
        let startVertex, endVertex;
        if (defineFeature.featureType.includes('Path')) {
          startVertex = getSnapStartVertex(defineFeature.holeNum, defineFeature.featureType);
          endVertex = getSnapEndVertex(defineFeature.holeNum, defineFeature.featureType);
        } else {
          startVertex = null;
          endVertex = null;
        }
        const featureCoords = [];
        for (let i = 0; i < line.length; ++i) {
          if (i===0 && startVertex !== null)
              featureCoords.push(startVertex);
          else if (i === line.length-1 && endVertex !== null)
              featureCoords.push(endVertex);
          else {
              const pt = {lng: line[i][0], lat: line[i][1]};
              const elev = map.current.queryTerrainElevation(pt, { exaggerated: false }) * 3.280839895 // convert meters to feet
              pt.elv = elev;
              featureCoords.push(pt);
          }    
        }
        //Add to map
        addFeatureToMap(defineFeature.holeNum, featureCoords, defineFeature.featureType, true);
        //Update for possible save to storage
        let sampledPath = null; //assume polygon, which doesn't need sampled path
        if (defineFeature.featureType.includes('Path')) { //get sampled path
          sampledPath = getSampledPath(featureCoords);
        }
        courseDispatch({type: "UPDATE_HOLE_FEATURE", tee: teeUnits.selectedTee, 
                        holeNum: defineFeature.holeNum, featureType: defineFeature.featureType, 
                        featureCoords: featureCoords, sampledPathCoords: sampledPath});
        //We don't need the draw items anymore;
        draw.current.deleteAll();
        draw.current.changeMode('simple_select');
        teeUnitsDispatch({type: "UPDATE_STATUS_MESSAGE", statusMessage: "Click on '+' button to define next path."});
        //setTimeout(() => teeUnitsDispatch({type: "UPDATE_STATUS_MESSAGE", statusMessage: "Select a feature to define..."}), 1000);

        if (!teeUnits.pathAutoAdvance) { //Switch back to simple_select mode
          draw.current.changeMode('simple_select');
          return;
        }
        // //If here, auto-advance is on and we potentially need to auto-advance to the next feature
        const nextPath = getPathInsertionPoint();
        if (nextPath.path === "") {
          draw.current.changeMode('simple_select');
        } else {
          setTimeout(()=>handleDefineFeature(nextPath.holeNum, nextPath.path),1000);
        }
      }
      map.current.on('draw.create', processDrawnFeature);
      return () => {if (map.current) map.current.off('draw.create', processDrawnFeature);} //remove stale event handler on cleanup
   },[defineFeature]); //end useEffect() for draw.create event handler

    
   /**********************************************************************
    * PATH DRAWING, SELECTION, & DELETION
    **********************************************************************/
 
   /*************************************************************************
    * @function selectFeature
    * @param holeNum, the integer of the hole whose feature is to be selected.
    * @param featureType, the type of feature to be selected
    *        (transitionPath, golfPath, teebox, green)
    * @param id, the id of the feature to be selected. If null, the id is
    *       computed from holeNum and featureType.
    * @Desc 
    * Invoked when the user clicks on a feature on the map. If the feature
    * is already selected, it remains selected. If the feature is not 
    * currently selected, it is unselected and the previously selected
    * feature (if any) is unselected. 
    *************************************************************************/
   function selectFeature(holeNum, featureType, id=null) {
      let featureId;
      if (id === null) {
       featureId = getFeatureId(holeNum, featureType);
      } else {
        featureId = id;
      }
      map.current.setPaintProperty(featureId,'line-width',6); //thick width
      if (selectedFeatureId.current !== null && selectedFeatureId.current !== featureId) {
       //unselect currently selected path
        map.current.setPaintProperty(selectedFeatureId.current,'line-width',3);
      }
      //Set current selection
      selectedFeatureId.current = featureId;
   }
 
   /*************************************************************************
    * @function getSnapStartVertex
    * @param holeNum, the hole number for which the user is drawing a path
    * @param featureType: 'golfPath', 'transitionPath', 'startPath' or 'finishPath'
    * @desc Determine if the start of the path currently being drawn should
    * snap to the end of the previous path. If so, return the coordinates of
    * the vertex to snap to; otherwise return null
    *************************************************************************/
   function getSnapStartVertex(holeNum, featureType) {
     if (featureType === 'golfPath') {
       if (holeNum === 1 && course.tees[teeUnits.selectedTee].hasStartLine && course.tees[teeUnits.selectedTee].holes[0].startPath !== "") {
         //Only case in which hole 1 golfPath startpoint should be snapped
         return course.tees[teeUnits.selectedTee].holes[0].startPath[course.tees[teeUnits.selectedTee].holes[0].startPath.length-1];
       }
       if (holeNum === 1) {
         return null;
       }
       //If here, can assume hole >= 2
       if (course.tees[teeUnits.selectedTee].holes[holeNum-1].transitionPath !== "") {
         //Snap to transition pah
         return course.tees[teeUnits.selectedTee].holes[holeNum-1].transitionPath[course.tees[teeUnits.selectedTee].holes[holeNum-1].transitionPath.length-1];
       }
       return null;
     } 
     if (featureType === 'transitionPath') {
       if (holeNum > 1 && course.tees[teeUnits.selectedTee].holes[holeNum-2].golfPath !== "") {
         //Snap to previous hole's golf path
         return course.tees[teeUnits.selectedTee].holes[holeNum-2].golfPath[course.tees[teeUnits.selectedTee].holes[holeNum-2].golfPath.length-1];
       }
       return null;
     }
     if (featureType === 'startPath') {
      return null;
     }
     if (featureType === 'finishPath') {
      if (course.tees[teeUnits.selectedTee].holes[course.tees[teeUnits.selectedTee].holes.length-1].golfPath !== "") {
        //Snap to previous hole's golf path
        return course.tees[teeUnits.selectedTee].holes[course.tees[teeUnits.selectedTee].holes.length-1].golfPath[course.tees[teeUnits.selectedTee].holes[course.tees[teeUnits.selectedTee].holes.length-1].golfPath.length-1];
      }
      return null;
     }
     throw Error("Invalid featureType in getSnapStartVertex");
   }
 
    /*************************************************************************
    * @function getSnapEndVertex
    * @param holeNum, the hole number for which the user is drawing a path
    * @param featureType, either 'golfPath' 'transPath', 'startPath' or 'finishPath'
    * @desc Determine if the end of the path currently being drawn should
    * snap to the start of the next path. If so, return the coordinates of
    * the vertex to snap to; otherwise return null
    *************************************************************************/
   function getSnapEndVertex(holeNum, featureType) {
     if (featureType === 'golfPath') {
       if (holeNum === course.tees[teeUnits.selectedTee].holes.length && 
           Object.hasOwn(course.tees[teeUnits.selectedTee].holes[course.tees[teeUnits.selectedTee].holes.length-1],'finishPath') &&
           course.tees[teeUnits.selectedTee].holes[course.tees[teeUnits.selectedTee].holes.length-1].finishPath !== "") {
         //Only case in which hole 1 golfPath endpoint should be snapped
         return course.tees[teeUnits.selectedTee].holes[course.tees[teeUnits.selectedTee].holes.length-1].finishPath[0];
       }
       if (holeNum === course.tees[teeUnits.selectedTee].holes.length) {
         return null;
       }
       //If here, can assume hole is at least one less than last hole
       if (course.tees[teeUnits.selectedTee].holes[holeNum].transitionPath !== "") {
         //Snap to transition pah
         return course.tees[teeUnits.selectedTee].holes[holeNum].transitionPath[0];
       }
       return null;
     } 
     if (featureType === 'transitionPath') {
       if (holeNum < course.tees[teeUnits.selectedTee].holes.length && course.tees[teeUnits.selectedTee].holes[holeNum-1].golfPath !== "") {
         //Snap to current hole's golf path
         return course.tees[teeUnits.selectedTee].holes[holeNum-1].golfPath[0];
       }
       return null;
     }
      if (featureType === 'startPath') {
        if (course.tees[teeUnits.selectedTee].holes[0].golfPath !== "") {
          //Snap to first hole's golf path
          return course.tees[teeUnits.selectedTee].holes[0].golfPath[0];
        }
        return null;
      }
      if (featureType === 'finishPath') {
        //No snapping for finish path
        return null;
      }
     throw Error("Invalid featureType in getSnapEndVertex");
   }
 
   /**********************************************************************
    * END OF PATH DRAWING, SELECTION, DELETION, & EVENT HANDLING
    **********************************************************************/
 
 
   /**********************************************************************
    * FUNCTIONS TO ADD COURSE FEATURES TO MAP
    **********************************************************************/

   /*************************************************************************
    * @function addFeatureToMap
    * @param the holeNum associated with the feature to add to the map
    * @param featureCoords, an array of geocoord objects (with 'lat' 
    *        and 'lng' props) that define the feature.
    * @param featureType, the type of feature to add to the map 
    *        ('transitionPath', 'teebox', 'golfPath', or 'green')
    * @param createMarkers, a boolean indicating whether to create fresh tee and
    *        green markers (used only when featureType==='golfPath')
    * @Desc 
    * - Add a feature (transition path, teebox, golf path, or green) to map
    * - label the feature on the map
    * - Add tee and green markers as appropriate
    *************************************************************************/
    function addFeatureToMap(holeNum, featureCoords, featureType, createMarkers=true) {
      if (featureCoords.length === 0) return; //empty path
      const geojson = { //create path feature
        'type': 'geojson',
        'data': { 
          'type': 'Feature',
          'properties': {
            'label': `Hole ${holeNum} ${featureLabel[featureType]}`
          },
          'geometry': {
            'type': 'LineString',
            'coordinates': featureCoords.map(pt => [pt.lng, pt.lat])                 
          }
        }
      };
      const id = getFeatureId(holeNum,featureType); 
      map.current.addSource(id,geojson); //add feature source
      map.current.addLayer({ //add layer
        'id': id,
        'type': 'line',
        'source': id,
        'layout': {
          'line-join': 'round',
          'line-cap': 'round',
        },
        'paint': {
          'line-color': lineColor[featureType],
          'line-width': 3
        },
      });
      if (!mapFeatures.current[teeUnits.selectedTee].pathIds.includes(id)) {
        //Push id onto mapFeatures array, so we can respond to path events and show/hide when tee changes
        mapFeatures.current[teeUnits.selectedTee].pathIds.push(id);
      }
      if (featureType.includes('Path')) {
       //Add path label layer and add to pathIds array to enable
       //popup on event hover
       const labelId = getFeatureLabelId(holeNum,featureType);
       map.current.addLayer({ //add path label layer
         'id': labelId,
         'type': "symbol",
         'source': id,
         'layout': {
           'symbol-placement': 'line-center',
           'text-max-angle': 90,
           'text-offset': [1,1],
           "text-font": ["Arial Unicode MS Regular"],
           "text-field": '{label}',
           "text-size": 12,
         },
         'paint': {
           'text-color': '#FFFFFF',
           'text-halo-color': '#000000',
           'text-halo-width': 0.5,
           'text-halo-blur': 0.5
         }
       });
       if (!mapFeatures.current[teeUnits.selectedTee].labelIds.includes(labelId)) {
        //Push labelId onto mapFeatures array, so we can show/hide when tee changes
        mapFeatures.current[teeUnits.selectedTee].labelIds.push(labelId);
       }
     } 
     if (createMarkers) { //Add start, tee, flag, and finish markers associated with new feature, as appropriate...
        let flagPopup, flag, teePopup, tee, startPopup, start, finishPopup, finish, teeDiv, flagDiv, startDiv, finishDiv;
        if (featureType === 'golfPath') {
          if (mapFeatures.current[teeUnits.selectedTee].markers[holeNum-1].tee === null) {
            teePopup = new mapboxgl.Popup({closeButton: false, maxWidth: 'none'})
          .setText(`Hole ${holeNum} Tee`);
          tee = new FontawesomeMarker({
            icon: 'fas fa-golf-ball-tee',
            iconColor: 'white',
            color: 'blue',
            draggable: true
          }).setLngLat([featureCoords[0].lng, 
              featureCoords[0].lat])
            .setPopup(teePopup)
            .addTo(map.current);
            teeDiv = tee.getElement();
            mapFeatures.current[teeUnits.selectedTee].markers[holeNum-1].tee = tee;
            //teeFlagMarkers.current[holeNum-1].tee = tee;
            //console.dir("teeFlagMarker.current updated with hole " + holeNum + " tee marker.")
            tee.on('drag', ()=>handleTeeDrag(holeNum,tee));
            tee.on('dragend',()=>handleTeeDragEnd(holeNum,tee));
            teeDiv.addEventListener('mouseenter',()=>tee.togglePopup());
            teeDiv.addEventListener('mouseleave',()=>tee.togglePopup());
          }
          if ((mapFeatures.current[teeUnits.selectedTee].markers[holeNum-1].flag === null)) { 
            flagPopup = new mapboxgl.Popup({closeButton: false, maxWidth: 'none'})
              .setText(`Hole ${holeNum} Flag`);
            flag = new FontawesomeMarker({
                icon: 'fas fa-flag',
                iconColor: 'white',
                color: 'lightgreen',
                draggable: true
              }).setLngLat([featureCoords[featureCoords.length-1].lng, 
                            featureCoords[featureCoords.length-1].lat])
                .setPopup(flagPopup)
                .addTo(map.current);
            flagDiv = flag.getElement();
            mapFeatures.current[teeUnits.selectedTee].markers[holeNum-1].flag = flag;
            flag.on('drag', ()=>handleFlagDrag(holeNum,flag));
            flag.on('dragend',()=>handleFlagDragEnd(holeNum,flag));
            flagDiv.addEventListener('mouseenter',()=>flag.togglePopup());
            flagDiv.addEventListener('mouseleave',()=>flag.togglePopup());
          }
        } else if (featureType === 'transitionPath') {
          if (mapFeatures.current[teeUnits.selectedTee].markers[holeNum-2].flag === null) {
            flagPopup = new mapboxgl.Popup({closeButton: false, maxWidth: 'none'})
            .setText(`Hole ${holeNum-1} Flag`);
          flag = new FontawesomeMarker({
              icon: 'fas fa-flag',
              iconColor: 'white',
              color: 'lightgreen',
              draggable: true
            }).setLngLat([featureCoords[0].lng, 
                          featureCoords[0].lat])
                .setPopup(flagPopup)
                .addTo(map.current);
          flagDiv = flag.getElement();
          mapFeatures.current[teeUnits.selectedTee].markers[holeNum-2].flag = flag;
          //teeFlagMarkers.current[holeNum-2].flag = flag;
          //console.dir("teeFlagMarker.current updated with hole " + holeNum + " flag marker.");
          //flag.on('drag', ()=>handleFlagDrag(holeNum-1,flag));
          flag.on('dragend',()=>handleFlagDragEnd(holeNum-1,flag));
          flagDiv.addEventListener('mouseenter',()=>flag.togglePopup());
          flagDiv.addEventListener('mouseleave',()=>flag.togglePopup());
          }
          if (mapFeatures.current[teeUnits.selectedTee].markers[holeNum-1].tee === null) { 
            teePopup = new mapboxgl.Popup({closeButton: false, maxWidth: 'none'})
            .setText(`Hole ${holeNum} Tee`);
            tee = new FontawesomeMarker({
              icon: 'fas fa-golf-ball-tee',
              iconColor: 'white',
              color: 'blue',
              draggable: true
            }).setLngLat([featureCoords[featureCoords.length-1].lng, 
                featureCoords[featureCoords.length-1].lat])
              .setPopup(teePopup)
              .addTo(map.current);
              teeDiv = tee.getElement();
              mapFeatures.current[teeUnits.selectedTee].markers[holeNum-1].tee = tee;
              //tee.on('drag', ()=>handleTeeDrag(holeNum,tee));
              tee.on('dragend',()=>handleTeeDragEnd(holeNum,tee));
              teeDiv.addEventListener('mouseenter',()=>tee.togglePopup());
              teeDiv.addEventListener('mouseleave',()=>tee.togglePopup());
          }
        } else if (featureType === 'startPath') {
          if (mapFeatures.current[teeUnits.selectedTee].markers[0].start === null) {
            startPopup = new mapboxgl.Popup({closeButton: false, maxWidth: 'none'})
            .setText(`Start Line`);
            start = new FontawesomeMarker({
              icon: 'fas fa-person-running',
              iconColor: 'black',
              color: 'lightgray',
              draggable: true
            }).setLngLat([featureCoords[0].lng, 
                featureCoords[0].lat])
              .setPopup(startPopup)
              .addTo(map.current);
              startDiv = start.getElement();
              mapFeatures.current[teeUnits.selectedTee].markers[0].start = start;
              //start.on('drag', ()=>handleStartDrag(holeNum,start));
              start.on('dragend',()=>handleStartDragEnd(start));
              startDiv.addEventListener('mouseenter',()=>start.togglePopup());
              startDiv.addEventListener('mouseleave',()=>start.togglePopup());
          }
          if (mapFeatures.current[teeUnits.selectedTee].markers[holeNum-1].tee === null) { 
            teePopup = new mapboxgl.Popup({closeButton: false, maxWidth: 'none'})
            .setText(`Hole ${holeNum} Tee`);
            tee = new FontawesomeMarker({
              icon: 'fas fa-golf-ball-tee',
              iconColor: 'white',
              color: 'blue',
              draggable: true
            }).setLngLat([featureCoords[featureCoords.length-1].lng, 
                featureCoords[featureCoords.length-1].lat])
              .setPopup(teePopup)
              .addTo(map.current);
              teeDiv = tee.getElement();
              mapFeatures.current[teeUnits.selectedTee].markers[holeNum-1].tee = tee;
              tee.on('drag', ()=>handleTeeDrag(holeNum,tee));
              tee.on('dragend',()=>handleTeeDragEnd(holeNum,tee));
              teeDiv.addEventListener('mouseenter',()=>tee.togglePopup());
              teeDiv.addEventListener('mouseleave',()=>tee.togglePopup());
          }
        } else if (featureType === 'finishPath') {
         
          if (mapFeatures.current[teeUnits.selectedTee].markers[course.tees[teeUnits.selectedTee].holes.length-1].finish === null) {
            finishPopup = new mapboxgl.Popup({closeButton: false, maxWidth: 'none'})
            .setText(`Finish Line`);
            finish = new FontawesomeMarker({
                icon: 'fas fa-flag-checkered',
                iconColor: 'black',
                color: 'lightgray',
                draggable: true
              }).setLngLat([featureCoords[featureCoords.length-1].lng, 
                            featureCoords[featureCoords.length-1].lat])
                  .setPopup(finishPopup)
                  .addTo(map.current);
            finishDiv = finish.getElement();
            mapFeatures.current[teeUnits.selectedTee].markers[course.tees[teeUnits.selectedTee].holes.length-1].finish = finish;
            //finish.on('drag', ()=>handleFinishDrag(holeNum,finish));
            finish.on('dragend',()=>handleFinishDragEnd(finish));
            finishDiv.addEventListener('mouseenter',()=>finish.togglePopup());
            finishDiv.addEventListener('mouseleave',()=>finish.togglePopup());
          }
        } else {
          throw Error("Invalid featureType in addFeatureToMap");
        }
     }
   }
 
   /*************************************************************************
    * @function displayCurrentTeeFeaturesInMap
    * @Desc 
    * Invoked when map first loads and when user switches the currently-
    * selected tee. If a previous tee's features are displayed, hide them.
    * As appropriate, then add or display the features defined for the 
    * currently selected tee. Each path/label receives a unique id so that 
    * (a) they can be shown/hidden and (b) click handlers can be defined on
    * them. Each feature is given a distinctive color according to our 
    * color legend: yellow for trans path, blue for tee box, red for 
    * golf path, and bright green for green.
    *************************************************************************/
   function displayCurrentTeeFeaturesInMap() {
    //1. If necessary, first hide features of previously-selected tee...
    if (prevTee.current !== null && prevTee.current !== teeUnits.selectedTee) {
      console.log("Hiding features of previously-selected tee: " + prevTee.current);
      for (const pathId of mapFeatures.current[prevTee.current].pathIds) {
        map.current.setLayoutProperty(pathId,'visibility','none');
      } 
      for (const labelId of mapFeatures.current[prevTee.current].labelIds) {
        map.current.setLayoutProperty(labelId,'visibility','none');
      } 
      for (const hole of mapFeatures.current[prevTee.current].markers) {
          if (hole.tee !== null)  hole.tee.getElement().style.visibility = 'hidden';
          if (hole.flag !== null) hole.flag.getElement().style.visibility = 'hidden';
      }
    }
    //2. Display features of currently-selected tee...
    //Check if we have already added features for this tee
    if (mapFeatures.current.hasOwnProperty(teeUnits.selectedTee)) {
      //This tee's features have already been added to the map. Display them...
      console.log("Displaying features of currently-selected tee: " + teeUnits.selectedTee);
      for (const pathId of mapFeatures.current[teeUnits.selectedTee].pathIds) {
        map.current.setLayoutProperty(pathId,'visibility','visible');
      }
      for (const labelId of mapFeatures.current[teeUnits.selectedTee].labelIds) {
        map.current.setLayoutProperty(labelId,'visibility','visible');
      }
      for (const polyId of mapFeatures.current[teeUnits.selectedTee].polyIds) {
        map.current.setLayoutProperty(polyId,'visibility','visible');
      }
      for (const hole of mapFeatures.current[teeUnits.selectedTee].markers) {
        if (hole.tee !== null)  hole.tee.getElement().style.visibility = 'visible';
        if (hole.flag !== null) hole.flag.getElement().style.visibility = 'visible';
      }
    } else { //This tee's features have not yet been added to the map. Add them...      
      console.log("Adding & Displaying features of currently-selected tee: " + teeUnits.selectedTee);
      mapFeatures.current[teeUnits.selectedTee] = {origTeeName: teeUnits.selectedTee, pathIds: [], labelIds: [], polyIds: [], 
        markers: Array.from({length: course.tees[teeUnits.selectedTee].holes.length}, (h) => {return {tee: null, flag: null}})};
      mapFeatures.current[teeUnits.selectedTee].markers[0].start = null;
      mapFeatures.current[teeUnits.selectedTee].markers[course.tees[teeUnits.selectedTee].holes.length-1].finish = null;
      for (let h = 0; h < course.tees[teeUnits.selectedTee].holes.length; h++) {
        if (h === 0 && course.tees[teeUnits.selectedTee].holes[h].startPath !== "") {
          addFeatureToMap(h+1,course.tees[teeUnits.selectedTee].holes[h].startPath,'startPath');
        }
        if (course.tees[teeUnits.selectedTee].holes[h].transitionPath !== "") {
          addFeatureToMap(h+1,course.tees[teeUnits.selectedTee].holes[h].transitionPath,'transitionPath');
        }
       if (course.tees[teeUnits.selectedTee].holes[h].golfPath !== "") {
         addFeatureToMap(h+1,course.tees[teeUnits.selectedTee].holes[h].golfPath,'golfPath');
       }
       if (h === course.tees[teeUnits.selectedTee].holes.length-1 && course.tees[teeUnits.selectedTee].holes[h].finishPath !== "") {
          addFeatureToMap(h+1,course.tees[teeUnits.selectedTee].holes[h].finishPath,'finishPath');
        }
       if (course.tees[teeUnits.selectedTee].holes[h].teebox !== "") {
         addFeatureToMap(h+1,course.tees[teeUnits.selectedTee].holes[h].teebox,'teebox');
       }
       if (course.tees[teeUnits.selectedTee].holes[h].green!== "") {
         addFeatureToMap(h+1,course.tees[teeUnits.selectedTee].holes[h].green,'green');
       }   
     }
    }
    prevTee.current = teeUnits.selectedTee; //update prevTee for next call to this function.
    const pt = getPathInsertionPoint();
    let msg;
    if (pt.path === "") {
      msg = "Congratulations! All paths are defined for this tee set.";
    } else {
      msg = `Click '+' button to define ${featureLabel[pt.path]} path for hole ${pt.holeNum}`;
    }
    teeUnitsDispatch({type: "UPDATE_STATUS_MESSAGE", statusMessage: msg});
  }
 
   /**********************************************************************
    * END OF FUNCTIONS TO ADD COURSE FEATURES TO MAP
    **********************************************************************/
   /*************************************************************************
    * @function handleKeyDown
    * @param e, the event object
    * @Desc 
    * When the user hits a key when the map is focused, we potentially
    * need to respond. Here are the cases we currently support:
    * - Delete or backspace when feature selected: Delete the feature
    * - Escape when feature is being created: cancel the feature in progress
    *************************************************************************/
   function handleKeyDown(e) {
     if (selectedFeatureId.current !== null && (e.keyCode === 8 || e.keyCode === 46)) {
      //Delete selected path...
      //1. Delete layer and source from map.
       map.current.removeLayer(selectedFeatureId.current);
       map.current.removeLayer(selectedFeatureId.current + "_label");
       map.current.removeSource(selectedFeatureId.current);
       //2. Delete path and label from mapFeatures.
       let i = mapFeatures.current[teeUnits.selectedTee].pathIds.indexOf(selectedFeatureId.current);
       if (i > -1) {
        mapFeatures.current[teeUnits.selectedTee].pathIds.splice(i,1); //remove from array;
       }
       i = mapFeatures.current[teeUnits.selectedTee].labelIds.indexOf(selectedFeatureId.current + "_label");
       if (i > -1) {
        mapFeatures.current[teeUnits.selectedTee].labelIds.splice(i,1); //remove from array;
       }
       //3. Delete from course
       const hNum = parseInt(selectedFeatureId.current.substr(1,2));
       const featureType = selectedFeatureId.current.substring(3,selectedFeatureId.current.indexOf('_'));
       courseDispatch({type: "UPDATE_HOLE_FEATURE", tee: teeUnits.selectedTee,
                        holeNum: hNum, featureType: featureType, featureCoords: "", sampledPathCoords: ""});
       selectedFeatureId.current = null; //path no longer selected
       if (featureType === 'golfPath') {
         if (hNum === 1) { //special case #1--could have start path
           if (!course.tees[teeUnits.selectedTee].hasStartLine || (course.tees[teeUnits.selectedTee].hasStartLine && course.tees[teeUnits.selectedTee].holes[hNum-1].startPath === "" )) {
           mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].tee.remove(); //remove tee
           mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].tee = null;
           }
           if (course.tees[teeUnits.selectedTee].holes[hNum].transitionPath === "") { //remove flag
           mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].flag.remove();
           mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].flag = null;
           }
         } else if (hNum === course.tees[teeUnits.selectedTee].holes.length) { //special case #2--could have finish path
           if (!course.tees[teeUnits.selectedTee].hasFinishLine || (course.tees[teeUnits.selectedTee].hasFinishLine && course.tees[teeUnits.selectedTee].holes[hNum-1].funishPath === "")) {
             mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].flag.remove(); //remove flag
             mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].flag = null;
           } 
           if (course.tees[teeUnits.selectedTee].holes[hNum-1].transitionPath === "") { //remove tee
             mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].tee.remove();
             mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].tee = null;
           }
         } else { //General case
           if (course.tees[teeUnits.selectedTee].holes[hNum-1].transitionPath === "") {
             mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].tee.remove();
             mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].tee = null;
           }
           if (hNum < course.tees[teeUnits.selectedTee].holes.length && course.tees[teeUnits.selectedTee].holes[hNum].transitionPath === "") {
             mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].flag.remove();
             mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].flag = null;
           }  
         } 
       } else if (featureType === 'transitionPath') {
         if (course.tees[teeUnits.selectedTee].holes[hNum-1].golfPath === "" ) {
           mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].tee.remove();
           mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].tee = null;
         }
         if (hNum > 1 && course.tees[teeUnits.selectedTee].holes[hNum-2].golfPath === "") {
           mapFeatures.current[teeUnits.selectedTee].markers[hNum-2].flag.remove();
           mapFeatures.current[teeUnits.selectedTee].markers[hNum-2].flag = null;
         }
       } else if (featureType === 'startPath') {
         if (course.tees[teeUnits.selectedTee].holes[hNum-1].golfPath === "") {
           mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].tee.remove();
           mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].tee = null;
          }
           mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].start.remove(); //always remove start marker
           mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].start = null;
       } else if (featureType === 'finishPath') {
         if (course.tees[teeUnits.selectedTee].holes[hNum-1].golfPath === "") {
           mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].flag.remove();
           mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].flag = null;
          }
           mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].finish.remove(); //always remove finish marker
           mapFeatures.current[teeUnits.selectedTee].markers[hNum-1].finish = null;
       }
     } else if (defineFeature !== null && e.keyCode === 27) {
       //Escape key pressed while defining a feature. Cancel the feature definition.
       const pt = getPathInsertionPoint();
       let msg;
       if (pt.path === "") {
          msg = "Congratulations! All paths are defined for this tee set.";
       } else {
          msg = `Click '+' button to define ${featureLabel[pt.path]} path for hole ${pt.holeNum}`;
       }
       teeUnitsDispatch({type: "UPDATE_STATUS_MESSAGE", statusMessage: msg});
       draw.current.changeMode('simple_select');
       setDefineFeature(null);
     }
   }
 
   
   /**********************************************************************
    * MARKER DRAG EVENT HANDLERS
    **********************************************************************/
     function handleTeeDrag(holeNum, teeMarker) {
     //TBD: May need to write code here to update status box as marker is dragged
     }
 
     function handleFlagDrag(holeNum, flagMarker) {
     //TBD: May need to write code here to update status box as marker is dragged
     }
 
  
   /*************************************************************************
    * @function handleFlagDragEnd
    * @param the holeNum of the flag marker just dragged
    * @param flagMarker, the Mapbox marker object just dragged
    * @Desc 
    * Update the golf path leading up to the flag, along with the transition
    * path emanating from the tee (if present), such that they match the
    * flag's new dragged location 
    *************************************************************************/
     function handleFlagDragEnd(holeNum, flagMarker) {
       const lngLat = flagMarker.getLngLat();
       const elv = map.current.queryTerrainElevation(lngLat, {exaggerated: false}) * 3.280839895;
       const golfLayerId = getFeatureId(holeNum,'golfPath');
       const transLayerId = getFeatureId(holeNum+1,'transitionPath');       
       let newPath;
       if (course.tees[teeUnits.selectedTee].holes[holeNum-1].golfPath !== "") {
        //Remove and re-add golf path
         map.current.removeLayer(golfLayerId);
         map.current.removeLayer(golfLayerId + "_label");
         map.current.removeSource(golfLayerId);
        let i = mapFeatures.current[teeUnits.selectedTee].pathIds.indexOf(golfLayerId);
        if (i > -1) {
         mapFeatures.current[teeUnits.selectedTee].pathIds.splice(i,1); //remove from array;
        }
        i = mapFeatures.current[teeUnits.selectedTee].labelIds.indexOf(golfLayerId + "_label");
        if (i > -1) {
          mapFeatures.current[teeUnits.selectedTee].labelIds.splice(i,1); //remove from array;
        }
        //newPath = [...course.tees[teeUnits.selectedTee].holes[holeNum-1].golfPath]; //This caused the parent state var to be modified!
        newPath = JSON.parse(JSON.stringify(course.tees[teeUnits.selectedTee].holes[holeNum-1].golfPath)); //deep copy
        newPath[newPath.length-1].lat = lngLat.lat;
        newPath[newPath.length-1].lng = lngLat.lng;
        newPath[newPath.length-1].elv = elv; 
        addFeatureToMap(holeNum,newPath,'golfPath',false);
        courseDispatch({type: "UPDATE_HOLE_FEATURE", tee: teeUnits.selectedTee,
                        holeNum: holeNum, featureType: 'golfPath', featureCoords: newPath, sampledPathCoords: getSampledPath(newPath)});
       }
       if (holeNum < course.numHoles && course.tees[teeUnits.selectedTee].holes[holeNum].transitionPath !== "") {
         //Remove and re-add transition path
         map.current.removeLayer(transLayerId);
         map.current.removeLayer(transLayerId + "_label");
         map.current.removeSource(transLayerId);
         let i = mapFeatures.current[teeUnits.selectedTee].pathIds.indexOf(transLayerId);
         if (i > -1) {
           mapFeatures.current[teeUnits.selectedTee].pathIds.splice(i,1); //remove from array;
         }
         i = mapFeatures.current[teeUnits.selectedTee].labelIds.indexOf(transLayerId + "_label");
         if (i > -1) {
           mapFeatures.current[teeUnits.selectedTee].labelIds.splice(i,1); //remove from array;
         }
         //newPath = [...course.tees[teeUnits.selectedTee].holes[holeNum].transitionPath];
         newPath = JSON.parse(JSON.stringify(course.tees[teeUnits.selectedTee].holes[holeNum].transitionPath)); //deep copy
         newPath[0].lat = lngLat.lat;
         newPath[0].lng = lngLat.lng;
         newPath[0].elv = elv;
         addFeatureToMap(holeNum+1,newPath,'transitionPath',false);
         courseDispatch({type: "UPDATE_HOLE_FEATURE", tee: teeUnits.selectedTee,
                        holeNum: holeNum+1, featureType: 'transitionPath', featureCoords: newPath, sampledPathCoords: getSampledPath(newPath)});
       } else if (holeNum === course.numHoles && course.tees[teeUnits.selectedTee].hasFinishPath &&  
                  course.tees[teeUnits.selectedTee].holes[holeNum-1].finishPath !== "") {
           //Special case: Course has finish path and user dragged final flag
           const finishLayerId = getFeatureId(holeNum,'finishPath'); 
           //Remove current finish path
           map.current.removeLayer(finishLayerId);
           map.current.removeLayer(finishLayerId + "_label");
           map.current.removeSource(finishLayerId);
           let i = mapFeatures.current[teeUnits.selectedTee].labelIds.indexOf(finishLayerId + "_label");
           if (i > -1) {
            mapFeatures.current[teeUnits.selectedTee].pathIds.splice(i,1); //remove from array;
          }
          i = mapFeatures.current[teeUnits.selectedTee].labelIds.indexOf(finishLayerId + "_label");
          if (i > -1) {
            mapFeatures.current[teeUnits.selectedTee].labelIds.splice(i,1); //remove from array;
          }
          //newPath = [...course.tees[teeUnits.selectedTee].holes[holeNum-1].finishPath]; //caused parent state var to be modified!
          newPath = JSON.parse(JSON.stringify(course.tees[teeUnits.selectedTee].holes[holeNum-1].golfPath)); //deep copy
          newPath[0].lat = lngLat.lat;
          newPath[0].lng = lngLat.lng;
          newPath[0].elv = elv;
          addFeatureToMap(holeNum,newPath,'finishPath',false);
          courseDispatch({type: "UPDATE_HOLE_FEATURE", tee: teeUnits.selectedTee,
                       holeNum: holeNum, featureType: 'finishPath', featureCoords: newPath, sampledPathCoords: getSampledPath(newPath)});
       }
     }
 
   /*************************************************************************
    * @function handleTeeDragEnd
    * @param the holeNum of the tee marker just dragged
    * @param teeMarker, the Mapbox marker object just dragged
    * @Desc 
    * Update the transition path leading up to the tee, along with the golf
    * path emanating from the tee (if present), such that they match the
    * tee's new dragged location 
    *************************************************************************/
     function handleTeeDragEnd(holeNum, teeMarker) {
       const lngLat = teeMarker.getLngLat();
       const elv = map.current.queryTerrainElevation(lngLat, {exaggerated: false}) * 3.280839895;
       const transLayerId = getFeatureId(holeNum,'transitionPath');
       const golfLayerId = getFeatureId(holeNum,'golfPath');
       let newPath;
       if (holeNum === 1 && course.tees[teeUnits.selectedTee].hasStartLine && 
           course.tees[teeUnits.selectedTee].holes[holeNum-1].startPath !== "") {
         //Special case: Tee has start path and user dragged first tee marker
         //Relocate end point of connecting start path
         const startLayerId = getFeatureId(holeNum,'startPath');
         //Remove current path
         map.current.removeLayer(startLayerId);
         map.current.removeLayer(startLayerId + "_label");
         map.current.removeSource(startLayerId);
         let i = mapFeatures.current[teeUnits.selectedTee].pathIds.indexOf(startLayerId);
         if (i > -1) {
           mapFeatures.current[teeUnits.selectedTee].pathIds.splice(i,1); //remove from array;
         }
         i = mapFeatures.current[teeUnits.selectedTee].labelIds.indexOf(startLayerId + "_label");
         if (i > -1) {
           mapFeatures.current[teeUnits.selectedTee].labelIds.splice(i,1); //remove from array;
         }
         newPath = JSON.parse(JSON.stringify(course.tees[teeUnits.selectedTee].holes[holeNum-1].startPath)); //deep copy
         newPath[newPath.length-1].lat = lngLat.lat;
         newPath[newPath.length-1].lng = lngLat.lng;
         newPath[newPath.length-1].elv = elv;
         addFeatureToMap(holeNum,newPath,'startPath',false);
         courseDispatch({type: "UPDATE_HOLE_FEATURE", tee: teeUnits.selectedTee,
                        holeNum: holeNum, featureType: 'startPath', featureCoords: newPath, sampledPathCoords: getSampledPath(newPath)});
       } else if (holeNum !== 1 && course.tees[teeUnits.selectedTee].holes[holeNum-1].transitionPath !== "" ) {
         //Relocate end point of connecting transition path 
         map.current.removeLayer(transLayerId);
         map.current.removeLayer(transLayerId + "_label");
         map.current.removeSource(transLayerId);
         let i = mapFeatures.current[teeUnits.selectedTee].pathIds.indexOf(transLayerId);
         if (i > -1) {
           mapFeatures.current[teeUnits.selectedTee].pathIds.splice(i,1); //remove from array;
         }
         i = mapFeatures.current[teeUnits.selectedTee].labelIds.indexOf(transLayerId + "_label");
         if (i > -1) {
           mapFeatures.current[teeUnits.selectedTee].labelIds.splice(i,1); //remove from array;
         }
         newPath = JSON.parse(JSON.stringify(course.tees[teeUnits.selectedTee].holes[holeNum-1].transitionPath)); //deep copy
         newPath[newPath.length-1].lat = lngLat.lat;
         newPath[newPath.length-1].lng = lngLat.lng;
         newPath[newPath.length-1].elv = elv;
         addFeatureToMap(holeNum,newPath,'transitionPath', false);
         courseDispatch({type: "UPDATE_HOLE_FEATURE", tee: teeUnits.selectedTee,
                         holeNum: holeNum, featureType: 'transitionPath', featureCoords: newPath, sampledPathCoords: getSampledPath(newPath)});
       }
       if (course.tees[teeUnits.selectedTee].holes[holeNum-1].golfPath !== "") { 
        //Relocate start point of connecting golf path
        //Remove current path
         map.current.removeLayer(golfLayerId);
         map.current.removeLayer(golfLayerId + "_label");
         map.current.removeSource(golfLayerId);
         let i = mapFeatures.current[teeUnits.selectedTee].pathIds.indexOf(golfLayerId);
         if (i > -1) {
           mapFeatures.current[teeUnits.selectedTee].pathIds.splice(i,1); //remove from array;
         }
         i = mapFeatures.current[teeUnits.selectedTee].labelIds.indexOf(golfLayerId + "_label");
         if (i > -1) {
           mapFeatures.current[teeUnits.selectedTee].labelIds.splice(i,1); //remove from array;
         }
         //newPath = [...course.tees[teeUnits.selectedTee].holes[holeNum-1].golfPath];
         newPath = JSON.parse(JSON.stringify(course.tees[teeUnits.selectedTee].holes[holeNum-1].golfPath)); //deep copy
         newPath[0].lat = lngLat.lat;
         newPath[0].lng = lngLat.lng;
         newPath[0].elv = elv; 
         addFeatureToMap(holeNum,newPath,'golfPath',false);
        courseDispatch({type: "UPDATE_HOLE_FEATURE", tee: teeUnits.selectedTee,
                        holeNum: holeNum, featureType: 'golfPath', featureCoords: newPath, sampledPathCoords: getSampledPath(newPath)});
       }
     }

    /*************************************************************************
    * @function handleStartDragEnd
    * @param startMarker, the Mapbox marker object for start line just dragged
    * @Desc 
    * Update the start path's start point to match the starting line marker's
    * new dragged location.   
    *************************************************************************/
    function handleStartDragEnd(startMarker) {
      const lngLat = startMarker.getLngLat();
      const elv = map.current.queryTerrainElevation(lngLat, {exaggerated: false}) * 3.280839895;
      const startLayerId = getFeatureId(1,'startPath');
      map.current.removeLayer(startLayerId);
      map.current.removeLayer(startLayerId + "_label");
      map.current.removeSource(startLayerId);
      let i = mapFeatures.current[teeUnits.selectedTee].pathIds.indexOf(startLayerId);
      if (i > -1) {
        mapFeatures.current[teeUnits.selectedTee].pathIds.splice(i,1); //remove from array;
      }
      i = mapFeatures.current[teeUnits.selectedTee].labelIds.indexOf(startLayerId + "_label");
      if (i > -1) {
        mapFeatures.current[teeUnits.selectedTee].labelIds.splice(i,1); //remove from array;
      }
      const newPath = JSON.parse(JSON.stringify(course.tees[teeUnits.selectedTee].holes[0].startPath)); //deep copy
      newPath[0].lat = lngLat.lat;
      newPath[0].lng = lngLat.lng;
      newPath[0].elv = elv; 
      addFeatureToMap(1,newPath,'startPath',false);
     courseDispatch({type: "UPDATE_HOLE_FEATURE", tee: teeUnits.selectedTee,
                     holeNum: 1, featureType: 'startPath', featureCoords: newPath, sampledPathCoords: getSampledPath(newPath)});

    }

    /*************************************************************************
    * @function handleFinishDragEnd
    * @param finishMarker, the Mapbox marker object for finish line just dragged
    * @Desc 
    * Update the finish path's end point to match the finish line marker's
    * new dragged location.   
    *************************************************************************/
    function handleFinishDragEnd(finishMarker) {
      const lngLat = finishMarker.getLngLat();
      const elv = map.current.queryTerrainElevation(lngLat, {exaggerated: false}) * 3.280839895;
      const finishLayerId = getFeatureId(1,'finishPath');
      map.current.removeLayer(finishLayerId);
      map.current.removeLayer(finishLayerId + "_label");
      map.current.removeSource(finishLayerId);
      let i = mapFeatures.current[teeUnits.selectedTee].pathIds.indexOf(finishLayerId);
      if (i > -1) {
        mapFeatures.current[teeUnits.selectedTee].pathIds.splice(i,1); //remove from array;
      }
      i = mapFeatures.current[teeUnits.selectedTee].labelIds.indexOf(finishLayerId + "_label");
      if (i > -1) {
        mapFeatures.current[teeUnits.selectedTee].labelIds.splice(i,1); //remove from array;
      }
      const newPath = JSON.parse(JSON.stringify(course.tees[teeUnits.selectedTee].holes[course.numHoles-1].finishPath)); //deep copy
      newPath[newPath.length-1].lat = lngLat.lat;
      newPath[newPath.length-1].lng = lngLat.lng;
      newPath[newPath.length-1].elv = elv; 
      addFeatureToMap(1,newPath,'finishPath',false);
     courseDispatch({type: "UPDATE_HOLE_FEATURE", tee: teeUnits.selectedTee,
                     holeNum: course.numHoles, featureType: 'finishPath', featureCoords: newPath, sampledPathCoords: getSampledPath(newPath)});
    }
    

   /**********************************************************************
    * END OF GLOBAL MAP EVENT HANDLERS
    **********************************************************************/
 
   /*************************************************************************
    * @function handleProfileClick
    * @param holeNum, the number of the hole whose "show profile" button was
    *        clicked.
    * @Desc 
    * Shows/hides the currently displayed hole profile pane.
    *************************************************************************/
   
   function handleProfileClick(holeNum) {
     if (profileHole === holeNum) {
       setProfileHole(0);
     }
     else {
       setProfileHole(holeNum);
     }
  }
    
   // Component's JSX Render Code
   if (teeUnits.selectedTee === null) {
    return(
      <>
      <h1>No tees created. Create a tee to map the course.</h1>
      </>
    );
   }


   return ( 
    
     <div className="map-container" onKeyDown={handleKeyDown}>
       <CoursesModeDetailsMapTable 
       showHideSFPath={showHideSFPath} 
       handleProfileClick={handleProfileClick} 
       handleDefineFeature={handleDefineFeature} 
         selectFeature={selectFeature} 
         enablePathCreation={enablePathCreation} 
         enablePolyCreation={enablePolyCreation}
         chartData={chartData} // Pass the state setter for chart data
         chartOptions={chartOptions} // Pass the state setter for chart options
         summary={summary} //Pass for total elevation gain/loss
         />
     
       <div className="map-box-container">
         <div ref={mapContainer} className="map-box-full"></div>
         {profileHole === 0 ? null : <CoursesModeDetailsMapHoleProfile profileHole={profileHole} setProfileHole={setProfileHole} summary={summary} setChartData={setChartData} setChartOptions={setChartOptions} />}
       </div>
     </div>
   );
 };