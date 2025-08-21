/**
 * Utility functions for number formatting across the application
 */

/**
 * Format a decimal number to a maximum number of decimal places
 * Removes trailing zeros and shows integers without .000
 */
export function formatDecimal(
  value: string | number,
  maxDecimals: number = 3,
): string {
  const num: number = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "0";

  // If the number is an integer, return it without decimals
  if (Number.isInteger(num)) {
    return num.toString();
  }

  const formatted: string = num.toFixed(maxDecimals);

  // Remove trailing zeros and decimal point if all decimals are zero
  return formatted.replace(/\.?0+$/, "");
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + "B";
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toString();
}

/**
 * Convert wei (smallest unit) to decimal with specified decimal places
 */
export function weiToDecimal(weiValue: string, decimals: number = 18): string {
  if (!weiValue || weiValue === "0") return "0";

  const wei: bigint = BigInt(weiValue);
  const divisor: bigint = BigInt(10 ** decimals);
  const whole: bigint = wei / divisor;
  const remainder: bigint = wei % divisor;

  // Convert remainder to string with proper padding
  const remainderStr: string = remainder.toString().padStart(decimals, "0");
  const trimmedRemainder: string = remainderStr.replace(/0+$/, ""); // Remove trailing zeros

  if (trimmedRemainder === "") {
    return whole.toString();
  }

  return `${whole}.${trimmedRemainder}`;
}

/**
 * Formats a decimal number to show only up to 3 decimal places, removing trailing zeros
 * Examples:
 * - 1.1035 → "1.103"
 * - 1.12 → "1.12"
 * - 1.1241958095 → "1.124"
 * - 1 → "1"
 * - 1.0 → "1"
 * - 1.100 → "1.1"
 */
export const formatDecimalConsistent = (value: string | number): string => {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) {
    return "0";
  }

  // Convert to string with up to 3 decimal places
  const formatted = num.toFixed(3);

  // Remove trailing zeros and decimal point if not needed
  return formatted.replace(/\.?0+$/, "");
};
