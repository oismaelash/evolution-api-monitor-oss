'use client';

/**
 * Renders an instant in the user’s browser locale and timezone (not UTC).
 * Pass ISO 8601 from the server (e.g. date.toISOString()).
 */
export function LocalDateTime({
  iso,
  className,
}: {
  iso: string;
  className?: string;
}) {
  const d = new Date(iso);
  const text = d.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium',
  });
  return (
    <time dateTime={iso} suppressHydrationWarning className={className}>
      {text}
    </time>
  );
}
