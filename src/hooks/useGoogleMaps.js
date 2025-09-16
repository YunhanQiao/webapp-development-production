// src/hooks/useGoogleMaps.js
import { useEffect, useState, useCallback } from "react";

export const useGoogleMaps = () => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadGoogleMaps = useCallback(() => {
    // Already loaded
    if (window.google?.maps?.places) {
      setIsLoaded(true);
      return Promise.resolve();
    }

    // Already loading
    if (isLoading) {
      return new Promise(resolve => {
        const checkLoaded = () => {
          if (window.google?.maps?.places) {
            setIsLoaded(true);
            resolve();
          } else {
            setTimeout(checkLoaded, 100);
          }
        };
        checkLoaded();
      });
    }

    // Check if script already exists (prevent duplicate loading)
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Script exists - wait for it to load instead of creating a new one
      setIsLoading(true);
      return new Promise((resolve, reject) => {
        // If already loaded, resolve immediately
        if (window.google?.maps) {
          setIsLoaded(true);
          setIsLoading(false);
          resolve();
          return;
        }

        // Wait for existing script to load
        existingScript.onload = () => {
          setIsLoaded(true);
          setIsLoading(false);
          resolve();
        };
        existingScript.onerror = () => {
          setError("Google Maps script failed to load");
          setIsLoading(false);
          reject();
        };

        // Also check periodically in case onload already fired
        const checkInterval = setInterval(() => {
          if (window.google?.maps?.places) {
            setIsLoaded(true);
            setIsLoading(false);
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);

        // Clean up interval after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.google?.maps?.places) {
            setError("Google Maps script load timeout");
            setIsLoading(false);
            reject(new Error("Timeout"));
          }
        }, 10000);
      });
    }

    // No existing script found - this shouldn't happen if RootLayout loads globally
    // But we'll keep this as fallback
    console.warn("useGoogleMaps: No existing Google Maps script found, loading fresh script");
    setIsLoading(true);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_PLACES_KEY}&libraries=places&loading=async`;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        setIsLoaded(true);
        setIsLoading(false);
        resolve();
      };

      script.onerror = () => {
        const errorMsg = "Google Maps script failed to load";
        setError(errorMsg);
        setIsLoading(false);
        reject(new Error(errorMsg));
      };

      document.body.appendChild(script);
    });
  }, [isLoading]);

  return { isLoaded, isLoading, error, loadGoogleMaps };
};

// Helper hook for components that need Google Maps services
export const useGoogleMapsServices = () => {
  const { isLoaded, isLoading, error, loadGoogleMaps } = useGoogleMaps();
  const [services, setServices] = useState({
    autocompleteService: null,
    placesService: null,
    geocoder: null,
  });

  useEffect(() => {
    if (isLoaded && window.google?.maps) {
      setServices({
        // TODO: DEPRECATION WARNING - Migrate to google.maps.places.AutocompleteSuggestion
        // AutocompleteService deprecated as of March 1st, 2025
        // See: https://developers.google.com/maps/documentation/javascript/places-migration-overview
        // At least 12 months notice will be given before discontinuation
        autocompleteService: new window.google.maps.places.AutocompleteService(),
        placesService: null, // Requires DOM element, set in component
        geocoder: new window.google.maps.Geocoder(),
      });
    }
  }, [isLoaded]);

  const initializePlacesService = useCallback(
    element => {
      if (isLoaded && element && window.google?.maps) {
        return new window.google.maps.places.PlacesService(element);
      }
      return null;
    },
    [isLoaded],
  );

  return {
    isLoaded,
    isLoading,
    error,
    loadGoogleMaps,
    ...services,
    initializePlacesService,
  };
};
