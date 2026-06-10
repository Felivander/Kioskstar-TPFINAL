// Google Maps Service
// Integrado con Google Maps API para geocoding

export const geocodeAddress = async (address: string): Promise<{ lat: number; lng: number } | null> => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    console.warn('geocodeAddress: GOOGLE_MAPS_API_KEY no configurada');
    return null;
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`Error de red en Geocoding API: ${response.status} ${response.statusText}`);
      return null;
    }

    const data = (await response.json()) as any;
    
    if (data.status === 'OK' && data.results && data.results.length > 0) {
      const location = data.results[0].geometry.location;
      return {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lng)
      };
    } else {
      console.warn(`Geocoding falló para la dirección: "${address}". Estado: ${data.status}. Mensaje: ${data.error_message || 'Sin mensaje de error'}`);
      return null;
    }
  } catch (error) {
    console.error('Error en geocodeAddress:', error);
    return null;
  }
};

export const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371; // km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

