// utils/testHelpers.ts
import { randomUUID } from 'crypto';

/** Adds a short unique suffix so parallel tests never collide on the same data. */
export function uniqueText(base: string): string {
  return `${base} [${randomUUID().slice(0, 8)}]`;
}

/** Builds a Basic auth header for API calls with a synthetic test account. */
export function basicAuth(username: string, password: string): string {
  return 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');
}
