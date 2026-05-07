/**
 * Safely parses a JSON string, handling potential edge cases like 'undefined' or malformed JSON.
 * @param val The value to parse
 * @param fallback The fallback value if parsing fails
 */
export function safeParse<T>(val: any, fallback: T): T {
  if (val === null || val === undefined) return fallback;
  
  if (typeof val !== 'string') {
    // If it's already an object, return it (if it matches the expected structure)
    if (typeof val === 'object') return val as T;
    return fallback;
  }

  const trimmed = val.trim();
  if (!trimmed || trimmed === 'undefined' || trimmed === 'null' || trimmed === '""' || trimmed === 'NaN') {
    return fallback;
  }

  try {
    const jsonStr = typeof trimmed === 'string' ? trimmed : JSON.stringify(trimmed);
    return JSON.parse(jsonStr) as T;
  } catch (e) {
    if (trimmed !== 'undefined' && trimmed !== 'null') {
      console.warn('safeParse - JSON.parse failed for:', trimmed.substring(0, 50), e);
    }
    
    // Attempt to extract JSON from string if it's wrapped in other text
    const jsonMatch = trimmed.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as T;
      } catch (innerE) {
        console.error('safeParse extraction attempt failed:', innerE);
      }
    }
    
    return fallback;
  }
}
