/** Normalize Clerk / network errors for UI strings (ClerkError shape varies by SDK version). */
export function formatClerkError(err: unknown): string {
  if (err && typeof err === 'object' && 'errors' in err) {
    const list = (err as { errors?: Array<{ longMessage?: string; message?: string }> }).errors;
    const first = list?.[0];
    if (first) return first.longMessage ?? first.message ?? 'Something went wrong';
  }
  if (err instanceof Error) return err.message;
  return 'Something went wrong';
}
