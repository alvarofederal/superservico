
import { cn } from '@/lib/utils';

export const maintenanceStatusColors = {
  pending: 'bg-yellow-500',
  in_progress: 'bg-blue-500',
  completed: 'bg-green-500',
  cancelled: 'bg-red-700',
  rescheduled: 'bg-purple-500',
};

export const maintenanceStatusLabels = {
  pending: 'Pendente',
  in_progress: 'Em Andamento',
  completed: 'Concluída',
  cancelled: 'Cancelada',
  rescheduled: 'Reagendada',
};

export const maintenanceTypeLabels = {
  preventive: 'Preventiva',
  corrective: 'Corretiva',
  predictive: 'Preditiva',
  inspection: 'Inspeção',
  other: 'Outra',
};

export const maintenancePriorityLabels = {
  low: 'Baixa',
  medium: 'Média',
  high: 'Alta',
  critical: 'Crítica',
};

export const getDateColorClass = (scheduledDateStr, withAnimation = false) => {
  if (!scheduledDateStr) return 'text-muted-foreground';
  const scheduledDate = new Date(scheduledDateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = scheduledDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  const baseClasses = 'font-semibold';
  const animationClass = withAnimation ? 'animate-pulse-intense' : '';

  if (diffDays < 0) return cn(baseClasses, 'text-red-500', animationClass);
  if (diffDays <= 2) return cn(baseClasses, 'text-red-400', animationClass);
  if (diffDays <= 7) return cn(baseClasses, 'text-yellow-500');
  return cn(baseClasses, 'text-green-500');
};
