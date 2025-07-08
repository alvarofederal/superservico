import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle, AlertCircle, X, CalendarClock, ArrowRight, Settings2, Info, FileText, User, Tag, Edit, Clock } from 'lucide-react';
import { maintenanceStatusColors, maintenanceStatusLabels, maintenanceTypeLabels, maintenancePriorityLabels, getDateColorClass } from '@/components/maintenance/maintenanceUtils';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

const InfoPill = ({ Icon, label, value, className, valueClassName }) => (
  <div className={cn("flex items-center space-x-3 bg-muted/50 p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow", className)}>
    <Icon className="h-6 w-6 text-primary flex-shrink-0" />
    <div className="flex flex-col flex-grow">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className={cn("text-sm font-semibold text-foreground break-words", valueClassName)}>{value || '-'}</span>
    </div>
  </div>
);

const MaintenanceTimelineView = ({ maintenance, getEquipmentName, getAssignedUserName, onBack }) => {
  if (!maintenance) return null;

  const timelineStepsOrder = ['pending', 'in_progress', 'completed'];
  const terminalStatuses = ['completed', 'cancelled'];
  const isTerminal = terminalStatuses.includes(maintenance.status);

  let activeStepIndex = timelineStepsOrder.indexOf(maintenance.status);
  if (maintenance.status === 'cancelled' || maintenance.status === 'rescheduled') {
    activeStepIndex = timelineStepsOrder.length; 
  } else if (activeStepIndex === -1 && maintenance.status === 'completed') {
    activeStepIndex = timelineStepsOrder.length -1;
  } else if (activeStepIndex === -1) {
    activeStepIndex = 0;
  }

  const getStepStatus = (stepIndex) => {
    if (maintenance.status === 'cancelled' && stepIndex >= timelineStepsOrder.indexOf('pending')) return 'cancelled';
    if (maintenance.status === 'rescheduled' && stepIndex >= timelineStepsOrder.indexOf('pending')) return 'rescheduled';
    if (stepIndex < activeStepIndex) return 'completed';
    if (stepIndex === activeStepIndex) return maintenance.status;
    return 'upcoming';
  };

  const getStepDate = (stepStatusKey) => {
    if (stepStatusKey === 'pending') return maintenance.created_at;
    if (stepStatusKey === 'completed') return maintenance.completion_date || maintenance.updated_at;
    if (maintenance.status === stepStatusKey) return maintenance.updated_at;
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
        <div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-sky-400 to-emerald-400 flex items-center">
            <CalendarClock className="mr-3 h-8 w-8" /> Linha do Tempo da Manutenção
          </h1>
          <p className="text-muted-foreground text-base">
            Status e detalhes de: <span className="font-semibold text-foreground">{maintenance.title}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <ScrollArea className="lg:col-span-1 h-[calc(100vh-200px)]">
          <Card className="bg-card/50 p-2 shadow-inner border border-border/20 sticky top-0">
            <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground border-b border-border/20 pb-3">
                    Detalhes Adicionais
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoPill Icon={Info} label="Equipamento" value={getEquipmentName(maintenance)} />
              <InfoPill Icon={Tag} label="Tipo de Manutenção" value={<Badge variant="outline" className="text-sm">{maintenanceTypeLabels[maintenance.type] || maintenance.type}</Badge>} />
              <InfoPill Icon={AlertCircle} label="Prioridade" value={<Badge variant="outline" className="text-sm">{maintenancePriorityLabels[maintenance.priority] || maintenance.priority}</Badge>} />
              <InfoPill Icon={CalendarClock} label="Data Agendada" value={new Date(maintenance.scheduled_date).toLocaleString('pt-BR', {dateStyle: 'long', timeStyle: 'short'})} valueClassName={cn(getDateColorClass(maintenance.scheduled_date, true), 'font-bold text-base')} />
              {maintenance.last_maintenance_date && <InfoPill Icon={Edit} label="Última Manutenção (Equip.)" value={new Date(maintenance.last_maintenance_date + 'T00:00:00').toLocaleDateString('pt-BR')} />}
              {getAssignedUserName(maintenance) !== 'N/A' && <InfoPill Icon={User} label="Atribuído a" value={getAssignedUserName(maintenance)} />}
              {maintenance.service_request_id && <InfoPill Icon={FileText} label="Origem (SS ID)" value={maintenance.service_request_id} />}
              {maintenance.work_order_id && <InfoPill Icon={FileText} label="Origem (OS ID)" value={maintenance.work_order_id} />}

              {maintenance.description && (
                  <Card className="bg-transparent border-border/40">
                      <CardHeader className="p-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><FileText size={16} className="mr-2 text-primary"/> Descrição</CardTitle></CardHeader>
                      <CardContent className="p-3 pt-0 text-sm text-foreground">{maintenance.description}</CardContent>
                  </Card>
              )}
              {maintenance.notes && (
                  <Card className="bg-transparent border-border/40">
                      <CardHeader className="p-3"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><FileText size={16} className="mr-2 text-primary"/> Observações</CardTitle></CardHeader>
                      <CardContent className="p-3 pt-0 text-sm text-foreground">{maintenance.notes}</CardContent>
                  </Card>
              )}

              <div className="text-xs text-muted-foreground pt-3 border-t border-border/20 space-y-1">
                <p>Criado em: {new Date(maintenance.created_at).toLocaleString('pt-BR')}</p>
                <p>Atualizado em: {new Date(maintenance.updated_at).toLocaleString('pt-BR')}</p>
              </div>
            </CardContent>
          </Card>
        </ScrollArea>
        
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-card/50 p-6 shadow-xl border border-border/20">
            <CardHeader>
              <CardTitle className="text-2xl font-semibold text-foreground mb-4">Progresso da Manutenção:</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center justify-between space-y-6 sm:space-y-0 sm:space-x-4">
                {timelineStepsOrder.map((stepKey, index) => {
                  const currentStepRealStatus = getStepStatus(index);
                  const isCurrent = currentStepRealStatus === maintenance.status && !isTerminal;
                  const isCompleted = currentStepRealStatus === 'completed' || (index < activeStepIndex && maintenance.status !== 'cancelled' && maintenance.status !== 'rescheduled');
                  const isCancelled = maintenance.status === 'cancelled' && index >= timelineStepsOrder.indexOf('pending');
                  
                  let bgColor = 'bg-muted/40';
                  let textColor = 'text-muted-foreground';
                  let borderColor = 'border-border/30';
                  let IconStep = Clock;

                  if (isCancelled) {
                    bgColor = 'bg-red-500/20'; textColor = 'text-red-400'; borderColor = 'border-red-500/50'; IconStep = X;
                  } else if (isCompleted) {
                    bgColor = 'bg-green-500/20'; textColor = 'text-green-400'; borderColor = 'border-green-500/50'; IconStep = CheckCircle;
                  } else if (isCurrent) {
                    const colorBase = maintenanceStatusColors[maintenance.status] ? maintenanceStatusColors[maintenance.status].replace('bg-', '') : 'blue-500';
                    bgColor = `bg-${colorBase}/20`;
                    textColor = `text-${colorBase.split('-')[0]}-400`;
                    borderColor = `border-${colorBase}/50`;
                    IconStep = Settings2;
                  } else if (currentStepRealStatus === 'pending') {
                    bgColor = 'bg-yellow-500/20'; textColor = 'text-yellow-400'; borderColor = 'border-yellow-500/50'; IconStep = AlertCircle;
                  } else if (currentStepRealStatus === 'in_progress') {
                     bgColor = 'bg-blue-500/20'; textColor = 'text-blue-400'; borderColor = 'border-blue-500/50'; IconStep = Settings2;
                  }

                  const stepDate = getStepDate(stepKey);

                  return (
                    <React.Fragment key={stepKey}>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.15 }}
                        className={cn("flex-1 p-4 rounded-lg border-2 shadow-lg min-w-[150px] text-center transition-all duration-300 transform hover:scale-105 flex flex-col justify-center items-center h-full", bgColor, borderColor)}
                      >
                        <IconStep className={cn("h-8 w-8 mb-2", textColor)} />
                        <p className={cn("font-semibold text-base", textColor)}>{maintenanceStatusLabels[stepKey]}</p>
                        {stepDate && (isCompleted || isCurrent || isCancelled) && (
                          <p className={cn("text-xs mt-1", textColor, "opacity-80")}>
                            {new Date(stepDate).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })}
                          </p>
                        )}
                      </motion.div>
                      {index < timelineStepsOrder.length - 1 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.15 + 0.1 }} className="hidden sm:block">
                          <ArrowRight className={cn("h-8 w-8 mx-2 self-center", isCompleted && maintenance.status !== 'cancelled' ? 'text-green-500' : 'text-muted-foreground/50')} />
                        </motion.div>
                      )}
                      {index < timelineStepsOrder.length - 1 && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: index * 0.15 + 0.1 }} className="block sm:hidden self-center transform rotate-90 my-2">
                          <ArrowRight className={cn("h-6 w-6", isCompleted && maintenance.status !== 'cancelled' ? 'text-green-500' : 'text-muted-foreground/50')} />
                        </motion.div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
};

export default MaintenanceTimelineView;