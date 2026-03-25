'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MouseEvent } from 'react';
import { LocalDateTime } from '@/components/ui/local-datetime';

type ProjectRowProps = {
  id: string;
  name: string;
  evolutionFlavor: string;
  numbersCount: number;
  updatedAt: string;
  flavorGoText: string;
  flavorApiText: string;
};

export function ProjectRow({
  id,
  name,
  evolutionFlavor,
  numbersCount,
  updatedAt,
  flavorGoText,
  flavorApiText,
}: ProjectRowProps) {
  const router = useRouter();

  const handleRowClick = (e: MouseEvent<HTMLTableRowElement>) => {
    // If the user clicks on the link itself, let the link handle it
    if ((e.target as HTMLElement).closest('a')) return;
    router.push(`/projects/${id}`);
  };

  return (
    <tr
      className="group cursor-pointer border-t border-[var(--color-border)] transition-colors hover:bg-white/5"
      onClick={handleRowClick}
    >
      <td className="px-4 py-2">
        <Link
          href={`/projects/${id}`}
          className="font-medium text-[var(--color-accent)] group-hover:underline"
        >
          {name}
        </Link>
      </td>
      <td className="px-4 py-2 text-[var(--color-text-muted)]">
        {evolutionFlavor === 'EVOLUTION_GO' ? flavorGoText : flavorApiText}
      </td>
      <td className="px-4 py-2">{numbersCount}</td>
      <td className="px-4 py-2 text-[var(--color-text-muted)]">
        <LocalDateTime iso={updatedAt} />
      </td>
    </tr>
  );
}
