/**
 * Utility functions for number formatting across the application
 */

/**
 * Format a decimal number to a maximum number of decimal places
 * Removes trailing zeros and shows integers without .000
 */
export function formatDecimal(value: string | number, maxDecimals = 3): string {
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

/**
 * Formats orderbook and trade values using the trading pair's pair decimal configuration
 * This function converts raw values (pair decimal form) to properly formatted decimal numbers
 * The backend sends values in pair decimal format, not individual token decimal format
 */
export function formatOrderbookValue(
  rawValue: string | number,
  pairDecimals: number,
  maxDisplayDecimals = 3,
): string {
  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return "0";
  }

  // Convert raw value to number
  const num = typeof rawValue === "string" ? parseFloat(rawValue) : rawValue;

  if (isNaN(num)) {
    return "0";
  }

  // Validate pairDecimals
  if (
    pairDecimals === 0 ||
    pairDecimals === undefined ||
    pairDecimals === null ||
    pairDecimals < 0
  ) {
    console.error("❌ formatOrderbookValue: Invalid pairDecimals:", {
      rawValue,
      pairDecimals,
      type: typeof pairDecimals,
    });
    throw new Error(`Invalid pairDecimals: ${pairDecimals}`);
  }

  // Convert from pair decimal form to human-readable decimal form
  const decimalValue = num / Math.pow(10, pairDecimals);

  // Format with appropriate decimal places
  const formatted = decimalValue.toFixed(maxDisplayDecimals);

  // Remove trailing zeros and decimal point if not needed
  return formatted.replace(/\.?0+$/, "");
}

/**
 * Formats price values using the trading pair's pair decimals
 */
export function formatOrderbookPrice(
  rawPrice: string | number,
  pairDecimals: number,
): string {
  return formatOrderbookValue(rawPrice, pairDecimals, 6); // Use more decimals for price precision
}

/**
 * Formats quantity values using the trading pair's pair decimals
 */
export function formatOrderbookQuantity(
  rawQuantity: string | number,
  pairDecimals: number,
): string {
  return formatOrderbookValue(rawQuantity, pairDecimals, 3);
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1)}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return num.toString();
}

/**
 * Convert wei (smallest unit) to decimal with specified decimal places
 */
export function weiToDecimal(
  weiValue: bigint | string,
  decimals: number,
  maxDecimalPlaces = 3,
): string {
  const weiBigInt = typeof weiValue === "string" ? BigInt(weiValue) : weiValue;

  if (!weiBigInt || weiBigInt === BigInt(0)) return "0";

  const divisor = BigInt(10 ** decimals);
  const quotient = weiBigInt / divisor;
  const remainder = weiBigInt % divisor;

  const decimalPart = remainder.toString().padStart(decimals, "0");
  const trimmedDecimal = decimalPart
    .slice(0, maxDecimalPlaces)
    .replace(/0+$/, "");

  return trimmedDecimal ? `${quotient}.${trimmedDecimal}` : quotient.toString();
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
