/**
 * Open navigation to a destination using the device's default map app
 */
export function openNavigation(
  latitude: number,
  longitude: number,
  label?: string
): void {
  // Check if we're on mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile) {
    // Try to open native map apps
    
    // iOS - Apple Maps
    if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      const appleMapsUrl = `maps://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=d`;
      window.location.href = appleMapsUrl;
      
      // Fallback to Google Maps if Apple Maps fails
      setTimeout(() => {
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        window.open(googleMapsUrl, '_blank');
      }, 500);
    } 
    // Android - Try Google Maps app first
    else if (/Android/i.test(navigator.userAgent)) {
      const googleMapsAppUrl = `google.navigation:q=${latitude},${longitude}`;
      window.location.href = googleMapsAppUrl;
      
      // Fallback to Google Maps web
      setTimeout(() => {
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        window.open(googleMapsUrl, '_blank');
      }, 500);
    }
  } else {
    // Desktop - Open Google Maps in new tab
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    window.open(googleMapsUrl, '_blank');
  }
}

/**
 * Get directions URL for TomTom
 */
export function getTomTomDirectionsUrl(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): string {
  return `https://www.tomtom.com/directions/${fromLat},${fromLng}/${toLat},${toLng}`;
}

/**
 * Open TomTom directions
 */
export function openTomTomDirections(
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): void {
  const url = getTomTomDirectionsUrl(fromLat, fromLng, toLat, toLng);
  window.open(url, '_blank');
}

/**
 * Open Waze navigation to a destination
 * Uses Waze Deep Links: https://developers.google.com/waze/deeplinks
 * On mobile with Waze installed: opens app and starts navigation
 * Otherwise: opens Waze web
 */
export function openWazeNavigation(
  latitude: number,
  longitude: number,
  _label?: string
): void {
  const url = `https://www.waze.com/ul?ll=${latitude},${longitude}&navigate=yes&zoom=17`;
  window.open(url, '_blank');
}
