/**
 * Single coercion point for string comparisons: a missing record value is treated
 * as an empty string so operands never dereference null/undefined.
 */
export function normalizeCase(string: string | null | undefined, caseSensitive?: boolean) {
  const value = string ?? '';
  return caseSensitive ? value : value.toLowerCase();
}
