/**
 * Formats gender enum values for display
 */
export function formatGender(gender: string): string {
  return gender
    .replace('_', ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}

/**
 * Formats relationship status enum values for display
 */
export function formatRelationshipStatus(status: string): string {
  return status
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());
}
