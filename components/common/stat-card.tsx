'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    direction: 'up' | 'down';
  };
  color?: 'primary' | 'accent' | 'secondary';
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color = 'primary',
}: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary/14 text-primary border-primary/20',
    accent: 'bg-accent/16 text-accent border-accent/24',
    secondary: 'bg-secondary/20 text-secondary-foreground border-secondary/25',
  };

  return (
    <Card className="animate-fade-up">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold tracking-tight text-muted-foreground">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-3xl font-semibold tracking-tight sm:text-[2rem]">{value}</p>
            {trend && (
              <p
                className={cn(
                  'mt-2 inline-flex items-center gap-1 text-sm font-semibold',
                  trend.direction === 'up'
                    ? 'text-primary'
                    : 'text-destructive'
                )}
              >
                {trend.direction === 'up' ? (
                  <ArrowUpRight size={12} />
                ) : (
                  <ArrowDownRight size={12} />
                )}
                {Math.abs(trend.value)}%
              </p>
            )}
          </div>
          <div className={cn('animate-float-soft rounded-2xl border p-3 shadow-sm', colorClasses[color])}>
            <Icon size={22} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
