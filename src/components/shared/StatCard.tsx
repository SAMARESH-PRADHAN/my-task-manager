import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  iconClassName?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  trend,
  className,
  iconClassName,
}) => {
  return (
    <Card className={cn('shadow-card animate-slide-up', className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
            {trend && (
              <p
                className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-success' : 'text-destructive'
                )}
              >
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% from yesterday
              </p>
            )}
          </div>
          <div
            className={cn(
              'flex h-14 w-14 items-center justify-center rounded-xl',
              iconClassName || 'bg-primary/10'
            )}
          >
            <Icon className={cn('h-7 w-7', iconClassName ? 'text-primary-foreground' : 'text-primary')} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
