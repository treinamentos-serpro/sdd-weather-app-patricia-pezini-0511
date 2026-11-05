import { useId } from 'react';

interface EmptyStateProps {
  title: string;
  hint: string;
}

export default function EmptyState({ title, hint }: EmptyStateProps) {
  const headingId = useId();
  const hintId = useId();

  return (
    <section
      aria-labelledby={headingId}
      aria-describedby={hintId}
      className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center font-sans text-white shadow-glass backdrop-blur-md"
    >
      <h2 id={headingId} className="break-words text-xl font-semibold">
        {title}
      </h2>
      <p id={hintId} className="mt-2 break-words text-slate-300">
        {hint}
      </p>
    </section>
  );
}
