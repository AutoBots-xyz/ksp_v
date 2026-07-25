/**
 * PlaceholderCard — empty-state placeholder for unimplemented feature screens.
 * Reference: IMPLEMENTATION2.md 2A "Empty placeholders for each home".
 */
interface PlaceholderCardProps {
  phase: string;
  title: string;
  items: string[];
}

export function PlaceholderCard({ phase, title, items }: PlaceholderCardProps) {
  return (
    <div className="rounded-lg border border-dashed border-ksp-steel/50 bg-white p-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ksp-navy">{title}</h2>
        <span className="rounded bg-ksp-accent/10 px-2 py-0.5 text-xs font-medium text-ksp-accent">
          {phase}
        </span>
      </div>
      <p className="mb-4 text-sm text-gray-500">Planned capabilities (not yet implemented):</p>
      <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
