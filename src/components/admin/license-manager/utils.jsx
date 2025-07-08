import React from 'react';
import { Badge } from '@/components/ui/badge';
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays, isPast, isValid } from 'date-fns';
import { CalendarDays, AlertTriangle, CheckCircle, XCircle, Clock, HelpCircle } from 'lucide-react';

// Consistent with EditLicenseForm options
const PLAN_STATUS_OPTIONS_INTERNAL = [
  { value: 'trialing', label: 'Em Cortesia' },
  { value: 'active', label: 'Ativo' },
  { value: 'past_due', label: 'Pagamento Pendente' },
  { value: 'canceled', label: 'Cancelado' },
  { value: 'expired', label: 'Expirado' },
  { value: 'pending_renewal', label: 'Aguardando Renovação' },
  { value: 'unpaid', label: 'Não Pago' },
  { value: 'inactive', label: 'Inativo'} // Added inactive
];


export const getStatusBadge = (status) => {
  if (!status) return <Badge variant="outline" className="border-dashed">Sem Licença</Badge>;
  const option = PLAN_STATUS_OPTIONS_INTERNAL.find(opt => opt.value === status);
  let className = "bg-gray-500 text-white"; 
  if (status === 'active') className = "bg-green-500 text-white";
  else if (status === 'trialing') className = "bg-blue-500 text-white";
  else if (status === 'expired' || status === 'canceled' || status === 'unpaid') className = "bg-red-500 text-white";
  else if (status === 'past_due' || status === 'pending_renewal') className = "bg-yellow-500 text-black";
  else if (status === 'inactive') className = "bg-slate-400 text-slate-800";
  
  return <Badge className={cn("capitalize", className)}>{option?.label || status}</Badge>;
};

export const getDaysRemaining = (license) => {
  if (!license) return { text: 'N/A', Icon: HelpCircle, color: "text-muted-foreground" };
  
  const relevantDateStr = license.status === 'trialing' ? license.trial_ends_at : license.end_date;
  
  if (!relevantDateStr) {
    if (license.status === 'active') return { text: 'Vitalício/Ativo', Icon: CheckCircle, color: "text-green-500" };
    return { text: 'Sem data definida', Icon: Clock, color: "text-muted-foreground" };
  }
  
  const relevantDate = parseISO(relevantDateStr);

  if (!isValid(relevantDate)) {
    return { text: 'Data Inválida', Icon: AlertTriangle, color: "text-red-500" };
  }
  
  if (isPast(relevantDate)) {
    if (license.status === 'expired' || license.status === 'canceled') {
       return { text: `Finalizou em ${format(relevantDate, 'dd/MM/yy')}`, Icon: XCircle, color: "text-red-500" };
    }
    return { text: `Expirou em ${format(relevantDate, 'dd/MM/yy')}`, Icon: XCircle, color: "text-red-500" };
  }
  
  const daysLeft = differenceInDays(relevantDate, new Date());

  if (daysLeft <= 0 && license.status !== 'active') { // If it's today but not active, show as expiring soon or past.
     return { text: `Expira Hoje`, Icon: AlertTriangle, color: "text-orange-500" };
  }
  if (daysLeft <= 7) return { text: `${daysLeft} dia${daysLeft > 1 ? 's' : ''}`, Icon: AlertTriangle, color: "text-orange-500" };
  
  return { text: format(relevantDate, 'dd/MM/yyyy'), Icon: CalendarDays, color: "text-muted-foreground" };
};