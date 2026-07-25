import { cn } from '@/lib/utils';
import { type HTMLAttributes } from 'react';

type RiskLevel = 'HIGH' | 'MEDIUM' | 'LOW';

interface RiskBadgeProps extends HTMLAttributes<HTMLDivElement> {
  level: RiskLevel | string;
}

export function RiskBadge({ level, className, ...props }: RiskBadgeProps) {
  const upperLevel = String(level).toUpperCase();
  
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-none border px-2 py-0.5 text-[10px] font-mono font-bold uppercase tracking-widest",
        {
          'bg-destructive/10 border-destructive/20 text-destructive': upperLevel === 'HIGH' || upperLevel === 'CRITICAL',
          'bg-amber-500/10 border-amber-500/20 text-amber-600 dark:text-amber-500': upperLevel === 'MEDIUM',
          'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400': upperLevel === 'LOW',
          'bg-secondary border-border text-muted-foreground': !['HIGH', 'CRITICAL', 'MEDIUM', 'LOW'].includes(upperLevel)
        },
        className
      )}
      {...props}
    >
      {level}
    </div>
  );
}
