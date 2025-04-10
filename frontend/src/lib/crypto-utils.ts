// src/lib/crypto-utils.ts
/**
 * Utility functions for cryptographic operations
 *
 * Note: This uses the Web Crypto API for secure hashing.
 * While this is not suitable for truly sensitive data storage,
 * it's appropriate for a local desktop application where we just
 * want to avoid storing PINs/passwords in plain text.
 */

/**
 * Hashes a string value using SHA-256
 * @param value The string to hash
 * @returns A hex-encoded hash string
 */
export async function hashValue(value: string): Promise<string> {
  // Convert the string to a buffer
  const encoder = new TextEncoder();

  // Create a salted value for extra security
  // Note: In a production app, you would use a proper salt strategy
  const salt = "DataDesktop_Static_Salt_9e78b2c1";
  const saltedData = encoder.encode(value + salt);

  // Hash the data using SHA-256
  const hashBuffer = await crypto.subtle.digest("SHA-256", saltedData);

  // Convert the hash buffer to a hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

/**
 * Compare a plain value against a stored hash
 *
 * @param plainValue Plain text value to check
 * @param storedHash Stored hash to compare against
 * @returns Boolean indicating if the values match
 */
export async function compareHash(
  plainValue: string,
  storedHash: string
): Promise<boolean> {
  const hashOfPlainValue = await hashValue(plainValue);
  return hashOfPlainValue === storedHash;
}
