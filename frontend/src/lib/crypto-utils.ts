export async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();

  const salt = "DataDesktop_Static_Salt_9e78b2c1";
  const saltedData = encoder.encode(value + salt);

  const hashBuffer = await crypto.subtle.digest("SHA-256", saltedData);

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return hashHex;
}

export async function compareHash(
  plainValue: string,
  storedHash: string
): Promise<boolean> {
  const hashOfPlainValue = await hashValue(plainValue);
  return hashOfPlainValue === storedHash;
}
