/**
 * Utility functions for number formatting across the application
 */





/**
 * Format a decimal number to a maximum number of decimal places
 * Removes trailing zeros and shows integers without .000
 */
export function formatDecimal(
  value: string | number,
  maxDecimals = 3,
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
    return `${(num / 1000000000).toFixed(1)  }B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)  }M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)  }K`;
  }
  return num.toString();
}

/**
 * Convert wei (smallest unit) to decimal with specified decimal places
 */
export function weiToDecimal(weiValue: string, decimals = 18): string {
  // Always log debug output regardless of environment
  console.log("🔍 weiToDecimal: Starting conversion:", { 
    weiValue, 
    decimals, 
    weiValueType: typeof weiValue,
    decimalsType: typeof decimals,
    weiValueLength: typeof weiValue === 'string' ? weiValue.length : 'N/A'
  });
  
  if (!weiValue || weiValue === "0") return "0";

  console.log("🔍 weiToDecimal: Input:", { weiValue, decimals, weiValueType: typeof weiValue });

  const wei = BigInt(weiValue);
  const divisor = BigInt(10 ** decimals);
  const whole: bigint = wei / divisor;
  const remainder: bigint = wei % divisor;

  console.log("🔍 weiToDecimal: Calculation:", { 
    wei: wei.toString(), 
    divisor: divisor.toString(), 
    whole: whole.toString(), 
    remainder: remainder.toString() 
  });

  // Convert remainder to string with proper padding
  const remainderStr: string = remainder.toString().padStart(decimals, "0");
  const trimmedRemainder: string = remainderStr.replace(/0+$/, ""); // Remove trailing zeros

  const result = trimmedRemainder === "" ? whole.toString() : `${whole}.${trimmedRemainder}`;
  
  // Always log debug output regardless of environment
  console.log("🔍 weiToDecimal: Result:", { 
    remainderStr, 
    trimmedRemainder, 
    result,
    resultType: typeof result 
  });

  return result;
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
  maxDisplayDecimals = 3
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
  if (pairDecimals === 0 || pairDecimals === undefined || pairDecimals === null || pairDecimals < 0) {
    console.error("❌ formatOrderbookValue: Invalid pairDecimals:", {
      rawValue,
      pairDecimals,
      type: typeof pairDecimals
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
  pairDecimals: number
): string {
  return formatOrderbookValue(rawPrice, pairDecimals, 6); // Use more decimals for price precision
}

/**
 * Format bytes to human readable format
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Formats quantity values using the trading pair's pair decimals
 */
export function formatOrderbookQuantity(
  rawQuantity: string | number,
  pairDecimals: number
): string {
  return formatOrderbookValue(rawQuantity, pairDecimals, 3);
}

// Test the weiToDecimal function with known values
console.log("🧪 TESTING weiToDecimal FUNCTION:");
console.log("5000000000000 with 8 decimals should be 50.0:", weiToDecimal("5000000000000", 8));
console.log("100000000 with 8 decimals should be 1.0:", weiToDecimal("100000000", 8));
console.log("13415000 with 8 decimals should be 0.13415:", weiToDecimal("13415000", 8));
