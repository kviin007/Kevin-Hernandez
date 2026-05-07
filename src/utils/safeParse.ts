/**
 * Safely parses a JSON string, handling potential edge cases like 'undefined' or malformed JSON.
 * @param val The value to parse
 * @param fallback The fallback value if parsing fails
 */
export function safeParse<T>(
  value: string | null | undefined,
  fallback: T
): T {
  try {
    if (
      value === undefined ||
      value === null ||
      value === "" ||
      value === "undefined"
    ) {
      return fallback;
    }

    return JSON.parse(value) as T;
  } catch (error) {
    console.error("safeParse error:", error);
    return fallback;
  }
}
