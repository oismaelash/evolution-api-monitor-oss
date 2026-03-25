/** Parses JSON error body from internal API routes into a single display string. */
export function apiErrorMessage(body: unknown): string {
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return 'Request failed';
  }
  const err = (body as { error: unknown }).error;
  if (typeof err === 'string') {
    return err;
  }
  try {
    return JSON.stringify(err);
  } catch {
    return 'Request failed';
  }
}
