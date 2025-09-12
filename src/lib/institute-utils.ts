/**
 * Utility functions for handling institute names and URL slugs
 */

/**
 * Convert institute name to URL-friendly slug
 */
export function instituteNameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .trim();
}

/**
 * Convert URL slug back to display name (basic conversion)
 * Note: This is a simple conversion and may not be perfect for all cases
 */
export function slugToInstituteName(slug: string): string {
  return slug
    .replace(/-/g, ' ') // Replace hyphens with spaces
    .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
}

/**
 * Get current institute name from localStorage
 */
export function getCurrentInstituteName(): string | null {
  return localStorage.getItem('institute_name');
}

/**
 * Get current institute slug from URL
 */
export function getCurrentInstituteSlug(): string | null {
  const path = window.location.pathname;
  const match = path.match(/^\/institute\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * Build institute-specific URL
 */
export function buildInstituteUrl(path: string, instituteSlug?: string): string {
  const slug = instituteSlug || getCurrentInstituteSlug();
  if (!slug) {
    throw new Error('Institute slug not found');
  }
  return `/institute/${slug}${path}`;
}
