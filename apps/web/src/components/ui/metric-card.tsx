import { type ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './card';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  description?: string;
}

export function MetricCard({ title, value, icon: Icon, trend, trendUp, description }: MetricCardProps) {
  return (
    <Card className="rounded-none border-border/50 bg-background/50 shadow-none hover:border-primary/30 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-mono uppercase tracking-widest font-bold text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-mono tracking-tighter text-foreground">{value}</div>
        {(trend || description) && (
          <p className="text-xs text-muted-foreground mt-1 font-mono flex items-center gap-1">
            {trend && (
              <span className={trendUp ? 'text-emerald-500' : 'text-destructive'}>
                {trend}
              </span>
            )}
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
