import Link from 'next/link';

export default function DocsPlaceholderPage() {
  return (
    <main className="py-24 text-center">
      <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">Documentation</h1>
      <p className="mt-4 text-[var(--color-text-muted)]">Full docs will be published here.</p>
      <Link
        href="/"
        className="mt-8 inline-block text-sm font-medium text-[var(--color-accent)] hover:underline"
      >
        ← Back to home
      </Link>
    </main>
  );
}
