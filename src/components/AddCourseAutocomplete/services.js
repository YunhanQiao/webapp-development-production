export async function getPlaceId(course, window, attrib) {
  // Check if Google Maps API is loaded
  if (!window.google || !window.google.maps) {
    console.warn("Google Maps API not loaded yet");
    return null;
  }

  const googleMaps = window.google.maps;
  const placesService = new googleMaps.places.PlacesService(attrib.current);
  const geocoder = new googleMaps.Geocoder();

  // Check if mapsUrl has place_id (CID format)
  // if (course.mapsUrl && course.mapsUrl.includes("cid=")) {
  //   const placeId = course.mapsUrl.split("cid=")[1];
  //   console.log(`Place ID from mapsUrl: ${placeId}`);
  //   return placeId;
  // }

  // 1. Try fetching Place ID using name
  const placeIdByName = await findPlaceIdByName(placesService, course.name);
  if (placeIdByName) return placeIdByName;

  // 2. If name fails, try with address
  const placeIdByAddress = await findPlaceIdByAddress(geocoder, course.address);
  if (placeIdByAddress) return placeIdByAddress;

  // 3. If both fail, try reverse geocoding with lat/lng
  if (course.geoLocation) {
    const placeIdByLatLng = await findPlaceIdByLatLng(geocoder, course.geoLocation.lat, course.geoLocation.lng);
    if (placeIdByLatLng) return placeIdByLatLng;
  }

  return null;
}

// Find place by name using Find Place API
async function findPlaceIdByName(service, name) {
  return new Promise(resolve => {
    const request = {
      query: name,
      fields: ["place_id"],
    };
    service.findPlaceFromQuery(request, (results, status) => {
      if (status === window.google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
        resolve(results[0].place_id);
      } else {
        resolve(null);
      }
    });
  });
}

// Find place by address using Geocoding API
async function findPlaceIdByAddress(geocoder, address) {
  return new Promise(resolve => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results.length > 0) {
        resolve(results[0].place_id);
      } else {
        resolve(null);
      }
    });
  });
}

// Find place by latitude & longitude using Reverse Geocoding
async function findPlaceIdByLatLng(geocoder, lat, lng) {
  return new Promise(resolve => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === window.google.maps.GeocoderStatus.OK && results.length > 0) {
        resolve(results[0].place_id);
      } else {
        resolve(null);
      }
    });
  });
}
