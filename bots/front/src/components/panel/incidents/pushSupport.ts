/** VAPID public keys travel base64url; `PushManager.subscribe` wants the raw bytes. */
export function keyBytes(base64url: string): Uint8Array<ArrayBuffer> {
  const padded = `${base64url}${"=".repeat((4 - (base64url.length % 4)) % 4)}`.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

export const PUSH_STATE = {
  unsupported: "unsupported",
  denied: "denied",
  off: "off",
  on: "on",
} as const;
