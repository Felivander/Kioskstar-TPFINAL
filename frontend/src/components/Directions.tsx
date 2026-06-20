/// <reference types="google.maps" />
import { useEffect, useState } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

interface DirectionsProps {
  origin: { lat: number; lng: number };
  destination: { lat: number; lng: number } | null;
  onRouteCalculated?: (durationText: string, distanceText: string) => void;
}

export function Directions({ origin, destination, onRouteCalculated }: DirectionsProps) {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const [directionsService, setDirectionsService] = useState<google.maps.DirectionsService | null>(null);
  const [directionsRenderer, setDirectionsRenderer] = useState<google.maps.DirectionsRenderer | null>(null);

  useEffect(() => {
    if (!routesLib || !map) return;
    setDirectionsService(new routesLib.DirectionsService());
    setDirectionsRenderer(new routesLib.DirectionsRenderer({
      map,
      suppressMarkers: true,
      polylineOptions: {
        strokeColor: '#f97316',
        strokeOpacity: 0.8,
        strokeWeight: 6
      }
    }));
  }, [routesLib, map]);

  useEffect(() => {
    if (!directionsService || !directionsRenderer) return;
    if (!destination) {
      directionsRenderer.setDirections(null);
      return;
    }

    directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.WALKING,
      },
      (result, status) => {
        if (status === 'OK' && result) {
          directionsRenderer.setDirections(result);
          if (onRouteCalculated && result.routes[0]?.legs[0]) {
            const leg = result.routes[0].legs[0];
            onRouteCalculated(leg.duration?.text || '', leg.distance?.text || '');
          }
        } else {
          console.error('Error drawing route:', status);
        }
      }
    );
  }, [directionsService, directionsRenderer, origin, destination, onRouteCalculated]);

  useEffect(() => {
    return () => {
      if (directionsRenderer) {
        directionsRenderer.setMap(null);
      }
    };
  }, [directionsRenderer]);

  return null;
}
