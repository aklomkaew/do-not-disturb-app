/**
 * Formats a location string from "Borough - Neighborhood" format
 * Returns an object with borough and neighborhood, or null if invalid
 */
export function parseLocation(location: string | null): { borough: string; neighborhood: string } | null {
  if (!location) return null;
  
  const parts = location.split(' - ');
  if (parts.length !== 2) return null;
  
  return {
    borough: parts[0].trim(),
    neighborhood: parts[1].trim(),
  };
}

/**
 * Formats location for display
 * Returns "Borough - Neighborhood" or the original string if not in expected format
 */
export function formatLocation(location: string | null): string {
  if (!location) return 'Location not set';
  
  const parsed = parseLocation(location);
  if (!parsed) return location; // Return original if format is unexpected
  
  return `${parsed.borough} - ${parsed.neighborhood}`;
}

/**
 * Formats location for compact display (just neighborhood)
 */
export function formatLocationCompact(location: string | null): string {
  if (!location) return 'Location not set';
  
  const parsed = parseLocation(location);
  if (!parsed) return location;
  
  return parsed.neighborhood;
}
