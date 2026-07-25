import { cn } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

/**
 * SampleDataBanner — Honesty Rule label.
 *
 * Per the implementation plan, any UI surface that renders intelligence output
 * (risk scores, "why flagged" reasons, alert severities, correlation claims,
 * hotspot clusters) sourced from a hardcoded array rather than a live query/model
 * MUST display this banner until the underlying feature is genuinely wired.
 *
 * The banner is intentionally unmissable (amber, border, icon) so a demo viewer
 * cannot mistake the numbers for live-computed values.
 *
 * When the feature behind the surface becomes real, REMOVE this banner from that
 * surface — do not leave it after the data is live (Phase 3.2 enforces this).
 */
interface SampleDataBannerProps {
  /** What the surface claims to show (e.g. "Predictive risk scores"). */
  feature: string;
  /** Optional: where the real data will come from once wired. */
  pendingSource?: string;
  className?: string;
}

export function SampleDataBanner({ feature, pendingSource, className }: SampleDataBannerProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex items-start gap-2 rounded-md border border-amber-400/60 bg-amber-50 p-2.5 text-xs text-amber-900 shadow-sm dark:bg-amber-950/40 dark:text-amber-200',
        className,
      )}
    >
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
      <div>
        <span className="font-bold">SAMPLE / DEMO DATA — not live.</span>{' '}
        <span className="text-amber-800 dark:text-amber-300">
          {feature} shown here are hardcoded sample values, not computed from real
          case data
          {pendingSource ? <>; pending {pendingSource}.</> : <>.</>}
        </span>
      </div>
    </div>
  );
}
