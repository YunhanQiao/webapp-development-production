/*************************************************************************
 * File: speedgolfCacluations.js
 * This file defines constants and functions that are useful for computing
 * speedgolf pars.
 ************************************************************************/
const parRunPaceMinMen = 7;
const parRunPaceSecMen = 0;
export const parRunPaceMen = (parRunPaceMinMen * 60) + parRunPaceSecMen;
const parRunPaceMinWomen = 9;
const parRunPaceSecWomen = 0;
export const parRunPaceWomen = (parRunPaceMinWomen * 60) + parRunPaceSecWomen;
export const parShotBoxSecMen = 15;
export const parShotBoxSecWomen = 20;
const mileDistInFeet = 5280;
export const samplingDistInFeet = 50;
 
 
/*********************************************************************
 * @function getHoleTimePar 
 * @desc 
 * Compute time par for a segment of a running path, taking elevation
 * change into account.
 * @param distance -- the distance in feet of the hole
 * @param strokePar -- the stroke par of the hole
 * @param parPace -- the par running pace (in seconds per mile) 
 * @param shotboxTime -- the par time (in seconds) for hitting a shot
 ********************************************************************/
 
export function getTimePar(distance, strokePar, parPace, shotboxTime) {
    let timepar = distance/mileDistInFeet * parPace; //seconds
    //Add in shotbox times
    timepar += strokePar * shotboxTime;
    return timepar;
}


/*********************************************************************
 * @function getDistance 
 * @desc 
 * Compute distance, in feet, between a path defined by a set of 
 * geocoordinates
 * @parm coords -- an array of geocoords with lat and lng props
 * @return a float containing the distance of the path
 * @credit https://www.movable-type.co.uk/scripts/latlong.html
 ********************************************************************/
export function getDistance(coords) {
    let distance = 0;
    for (let i = 0; i < coords.length-1; i++) {
        let lat1 = coords[i].lat
        let lon1 = coords[i].lng
        let lat2 = coords[i+1].lat
        let lon2 = coords[i+1].lng
        let R = 6371e3 * 3.28084; //feet
        let φ1 = lat1 * Math.PI/180 // φ, λ in radians
        let φ2 = lat2 * Math.PI/180
        let Δφ = (lat2-lat1) * Math.PI/180
        let Δλ = (lon2-lon1) * Math.PI/180
        let a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                  Math.cos(φ1) * Math.cos(φ2) *
                  Math.sin(Δλ/2) * Math.sin(Δλ/2)
        let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
        distance += R * c; 
    }
    return distance;  
}

/*********************************************************************
 * @function getPercentGradient 
 * @desc 
 * Compute percent gradient pc (100 <= pc <= 100) between two
 * geocoordinates.
 * @parm coords -- an array of at least two coords with elv prop
 * @param distance -- distance in same unit as coord elv prop
 ********************************************************************/          
export function getPercentGradient(coords, distance) {
    let ele1 = coords[0].elv
    let ele2 = coords[1].elv
    let elevation_change = ele2 - ele1
    return (elevation_change / distance) * 100 // number between 1 and 100
}

/*********************************************************************
 * @function getSegmentTimePar 
 * @desc 
 * Compute time par for a segment of a running path, taking elevation
 * change into account.
 * @param distance -- the distance in feet of the path segment
 * @param percentGradient -- the percent gradient of the path seg.
 * @param parPace -- the par running pace (in seconds per mile) 
 ********************************************************************/

export function getSegmentTimePar(distance, percentGradient, parPace) {
    let timepar = distance/mileDistInFeet * parPace; //seconds
    //Adjust based on gradient
    if (percentGradient > 0) {
        timepar += (distance/mileDistInFeet) * (percentGradient * 15);
    }
    else if (percentGradient < 0) {
        timepar -= (distance/mileDistInFeet) * (Math.abs(percentGradient) * 8);
    }
    return timepar;
}

/*********************************************************************
 * @function getHoleRunningStats
 * @desc 
 * Compute running distance, transition path distance, 
 * golf path distance, and time par for a hole.
 * Time par is calculated by multiplying hole distance by par 
 * running pace and then
 *   - adding 15 seconds per percent uphill gradient per mile,
 *   - subtracing 8 seconds per percent downill gradient per mile, and
 *   - adding in the par shot box times for the hole 
 * Note: We set a standard sampling rate of 50 feet and use gradients
 * of individual 50 foot segments on path to calculate time par.
 * Time par is calculated by considering each path segment in a path
 * @param map -- the mapbox GL object where the path is plotted
 * @param transPath -- array of georcoords defining transition  
 *        running path from center of previous green to tee box
 * @param golfPath -- array of geocoords defining golf running path
 *        from tee box to center of green.  
 * @param womensStrokePar -- women's stroke par for the hole
 * @param mensStrokePar -- men's stroke par for the hole
 * @param finishPath -- array of geocoords defining golf running path
 *        from center of final green to finish line (final hole only,
 *        defaults to null to indicate it shouldn't be considered).
 * @returns Object with the following props: 
 *          --transPathRunDistance
 *          --transPathWomensTimePar,
 *          --transPathMensTimePar,
 *          --golfPathRunDistance
 *          --golfPathWomensTimePar
 *          --golfPathMensTimePar
 *          --runDistance
 *          --womensTimePar
 *          --mensTimePar
 *         If any of the hole's paths has no data, the functino returns
 *         an object with all empty ("") values.
 ********************************************************************/
export function getHoleRunningStats(transPath, golfPath,womensStrokePar, mensStrokePar, finishPath=null) {
    const stats = {
        transPathRunDistance: 0,
        transPathWomensTimePar: 0,
        transPathMensTimePar: 0,
        golfPathRunDistance: 0,
        golfPathWomensTimePar: 0,
        golfPathMensTimePar: 0,
        finishPathRunDistance: 0,
        finishPathWomensTimePar: 0,
        finishPathMensTimePar: 0,
        runDistance: 0,
        womensTimePar: 0,
        mensTimePar: 0
    };
    if (transPath==="") {
        stats.transPathRunDistance = "";
        stats.transPathWomensTimePar = "";
        stats.transPathMensTimePar = "";
        stats.womensTimePar = "";
        stats.mensTimePar = ""
        stats.runDistance = ""
    } 
    if (golfPath==="") {
        stats.golfPathRunDistance = "";
        stats.golfPathWomensTimePar = "";
        stats.golfPathMensTimePar = "";
        stats.womensTimePar = "";
        stats.mensTimePar = "";
        stats.runDistance = "";
    }
    if (finishPath==="") {
        stats.finishPathRunDistance = "";
        stats.finishPathWomensTimePar = "";
        stats.finishPathMensTimePar = "";
        stats.womensTimePar = "";
        stats.mensTimePar = "";
        stats.runDistance = "";
    }
    if (transPath !== "") {
    //Get stats for transition path
        //transPath = getSampledPath(map,transPath,50); 
        for (let i = 0; i < transPath.length-1; i++) {
            let segDist = getDistance([transPath[i], transPath[i+1]]);
            stats.transPathRunDistance += segDist;
            let segPctGrad = getPercentGradient([transPath[i], transPath[i+1]], segDist);
            stats.transPathWomensTimePar += getSegmentTimePar(segDist,segPctGrad, parRunPaceWomen);
            stats.transPathMensTimePar += getSegmentTimePar(segDist,segPctGrad, parRunPaceMen);
        }
    }
    if (golfPath !== "") {
        //Get stats for golf path
        //golfPath = getSampledPath(map,golfPath,50); 
        for (let i = 0; i < golfPath.length-1; i++) {
            let segDist = getDistance([golfPath[i], golfPath[i+1]]);
            stats.golfPathRunDistance += segDist;
            let segPctGrad = getPercentGradient([golfPath[i], golfPath[i+1]], segDist);
            stats.golfPathWomensTimePar += getSegmentTimePar(segDist,segPctGrad, parRunPaceWomen);
            stats.golfPathMensTimePar += getSegmentTimePar(segDist,segPctGrad, parRunPaceMen);
        }
    }
    if (finishPath !== null && finishPath !== "") {
        //Get stats for finish path
        //finishPath = getSampledPath(map,finishPath,50); 
        for (let i = 0; i < finishPath.length-1; i++) {
            let segDist = getDistance([finishPath[i], finishPath[i+1]]);
            stats.finishPathRunDistance += segDist;
            let segPctGrad = getPercentGradient([finishPath[i], finishPath[i+1]], segDist);
            stats.finishPathWomensTimePar += getSegmentTimePar(segDist,segPctGrad, parRunPaceWomen);
            stats.finishPathMensTimePar += getSegmentTimePar(segDist,segPctGrad, parRunPaceMen);
        }
    }
    if (stats.runDistance !== "") {
        //Compute total hole distance and time par
        stats.runDistance = stats.transPathRunDistance + stats.golfPathRunDistance + stats.finishPathRunDistance;
        stats.womensTimePar = stats.transPathWomensTimePar + stats.golfPathWomensTimePar + stats.finishPathWomensTimePar +
                            (womensStrokePar * parShotBoxSecWomen);
        stats.mensTimePar = stats.transPathMensTimePar + stats.golfPathMensTimePar + stats.finishPathMensTimePar +
                            (mensStrokePar * parShotBoxSecMen);
    }
    return stats;
}