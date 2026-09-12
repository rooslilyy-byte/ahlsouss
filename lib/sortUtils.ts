/**
 * Utility functions for consistent Arabic-first alphabetical sorting across the application.
 */

/**
 * Checks if a string contains Arabic characters.
 */
export const isArabicText = (str: string): boolean => {
  return /[\u0600-\u06FF]/.test(str);
};

/**
 * Alphabetical comparator for product/item names:
 * - Arabic names first, ordered alphabetically (أ to ي)
 * - Followed by French/Latin names, ordered alphabetically (A to Z)
 */
export const compareProductNames = (nameA: string = '', nameB: string = ''): number => {
  const cleanA = (nameA || '').trim();
  const cleanB = (nameB || '').trim();

  const aIsArabic = isArabicText(cleanA);
  const bIsArabic = isArabicText(cleanB);

  // If one is Arabic and the other is Latin, the Arabic one comes first.
  if (aIsArabic && !bIsArabic) return -1;
  if (!aIsArabic && bIsArabic) return 1;

  // If both are Arabic, use localeCompare('ar')
  if (aIsArabic && bIsArabic) {
    return cleanA.localeCompare(cleanB, 'ar', { sensitivity: 'base' });
  }

  // If both are Latin, use localeCompare('fr')
  return cleanA.localeCompare(cleanB, 'fr', { sensitivity: 'base' });
};
