import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays, isPast } from 'date-fns';
import { CalendarDays, AlertTriangle, CheckCircle, XCircle, Clock } from 'lucide-react';
import { PLAN_STATUS_OPTIONS } from '@/components/admin/license-manager/EditLicenseForm';


export const getStatusBadge = (status) => {
  if (!status) return <Badge variant="outline">Sem Licença</Badge>;
  const option = PLAN_STATUS_OPTIONS.find(opt => opt.value === status);
  let className = "bg-gray-500 text-white"; 
  if (status === 'active') className = "bg-green-500 text-white";
  else if (status === 'trialing') className = "bg-blue-500 text-white";
  else if (status === 'expired' || status === 'canceled' || status === 'unpaid') className = "bg-red-500 text-white";
  else if (status === 'past_due' || status === 'pending_renewal') className = "bg-yellow-500 text-black";
  
  return <Badge className={cn("capitalize", className)}>{option?.label || status}</Badge>;
};

export const getDaysRemaining = (license) => {
  if (!license) return { text: 'N/A', Icon: Clock, color: "text-muted-foreground" };
  const relevantDateStr = license.status === 'trialing' ? license.trial_ends_at : license.end_date;
  if (!relevantDateStr) return { text: 'Vitalício/N/A', Icon: CheckCircle, color: "text-green-500" };
  
  const relevantDate = parseISO(relevantDateStr);
  if (isPast(relevantDate)) return { text: `Expirou em ${format(relevantDate, 'dd/MM/yy')}`, Icon: XCircle, color: "text-red-500" };
  
  const daysLeft = differenceInDays(relevantDate, new Date());
  if (daysLeft <= 7) return { text: `${daysLeft} dias`, Icon: AlertTriangle, color: "text-orange-500" };
  
  return { text: format(relevantDate, 'dd/MM/yyyy'), Icon: CalendarDays, color: "text-muted-foreground" };
};