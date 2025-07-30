/**
 * Utility functions for number formatting across the application
 */

/**
 * Formats a number with 3 decimal precision, removing trailing zeros
 * Examples: 1.000 -> "1", 1.003 -> "1.003", 2.100 -> "2.1"
 */
export function formatDecimal(value: string | number, maxDecimals: number = 3): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  
  // Format with 3 decimal precision
  const formatted = num.toFixed(maxDecimals);
  
  // Remove trailing zeros and decimal point if no decimals
  return formatted.replace(/\.?0+$/, '');
}

/**
 * Formats large numbers with K/M suffixes for display
 * Examples: 1000 -> "1K", 1500000 -> "1.5M"
 */
export function formatLargeNumber(num: number): string {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toFixed(0);
}

/**
 * Converts wei string to decimal format
 * Examples: "1000000000000000000" -> "1", "1500000000000000000" -> "1.5"
 */
export function weiToDecimal(weiValue: string, decimals: number = 18): string {
  if (!weiValue || weiValue === '0') return '0';
  
  // Convert wei string to decimal
  const wei = BigInt(weiValue);
  const divisor = BigInt(10 ** decimals);
  const whole = wei / divisor;
  const remainder = wei % divisor;
  
  // Format remainder with proper decimal places
  const remainderStr = remainder.toString().padStart(decimals, '0');
  const trimmedRemainder = remainderStr.replace(/0+$/, ''); // Remove trailing zeros
  
  if (trimmedRemainder === '') {
    return whole.toString();
  } else {
    return `${whole}.${trimmedRemainder}`;
  }
} 