/**
 * GPS and EXIF utility functions
 */

export interface GPSData {
  latitude: number;
  longitude: number;
  timestamp: string | null;
}

/**
 * Get current GPS location using browser Geolocation API
 */
export function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

/**
 * Extract GPS data from an image file using EXIF data
 */
export async function extractGPSFromImage(file: File): Promise<GPSData | null> {
  try {
    const ExifReader = (await import('exifreader')).default;
    const arrayBuffer = await file.arrayBuffer();
    const tags = ExifReader.load(arrayBuffer);

    const lat = tags.GPSLatitude;
    const lng = tags.GPSLongitude;
    const latRef = tags.GPSLatitudeRef;
    const lngRef = tags.GPSLongitudeRef;
    const dateTime = tags.DateTimeOriginal || tags.DateTime;

    if (lat && lng) {
      let latitude = parseFloat(lat.description);
      let longitude = parseFloat(lng.description);

      if (latRef && latRef.value && String(latRef.value).startsWith('S')) latitude = -latitude;
      if (lngRef && lngRef.value && String(lngRef.value).startsWith('W')) longitude = -longitude;

      return {
        latitude,
        longitude,
        timestamp: dateTime ? dateTime.description : null,
      };
    }
    return null;
  } catch {
    console.warn('Could not extract EXIF GPS data');
    return null;
  }
}

/**
 * Calculate distance between two GPS points using Haversine formula
 */
export function calculateDistance(
  lat1: number, lon1: number,
  lat2: number, lon2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Validate if coordinates are within a city's geofence
 * Uses a simple radius check (50km radius from city center)
 */
export function validateGeofence(
  photoLat: number, photoLng: number,
  userLat: number, userLng: number,
  maxDistanceKm: number = 50
): { valid: boolean; distanceKm: number } {
  const distanceMeters = calculateDistance(photoLat, photoLng, userLat, userLng);
  const distanceKm = distanceMeters / 1000;
  return {
    valid: distanceKm <= maxDistanceKm,
    distanceKm: Math.round(distanceKm * 10) / 10,
  };
}

/**
 * Reverse geocode coordinates to an address using OpenStreetMap Nominatim
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      { headers: { 'User-Agent': 'CivicPulse/1.0' } }
    );
    const data = await response.json();
    return data.display_name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  } catch {
    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  }
}
