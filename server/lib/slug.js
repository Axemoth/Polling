import { nanoid } from 'nanoid';

export function generateSlug() {
  // Generates an 8-character URL-friendly string like "V1StGXR8"
  return nanoid(8);
}
