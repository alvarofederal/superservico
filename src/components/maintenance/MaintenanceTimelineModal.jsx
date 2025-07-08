
import React from 'react';
import { motion } from 'framer-motion';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle, CheckCircle, AlertCircle, X, CalendarClock, ArrowRight, Settings2, Info, FileText, User, Tag, DollarSign, Edit } from 'lucide-react';
import { maintenanceStatusColors, maintenanceStatusLabels, maintenanceTypeLabels, maintenancePriorityLabels, getDateColorClass } from '@/components/maintenance/maintenanceUtils';
import { cn } from '@/lib/utils';

const MaintenanceTimelineModal = ({ isOpen, setIsOpen, maintenance, getEquipmentName, getAssignedUserName }) => {
  if (!maintenance) return null;

  const timelineStepsOrder = ['pending', 'in_progress', 'completed'];
  const terminalStatuses = ['completed', 'cancelled'];
  const isTerminal = terminalStatuses.includes(maintenance.status);

  let activeStepIndex = timelineStepsOrder.indexOf(maintenance.status);
  if (maintenance.status === 'cancelled' || maintenance.status === 'rescheduled') {
    activeStepIndex = timelineStepsOrder.length; // Marks it as beyond the normal flow
  } else if (activeStepIndex === -1 && maintenance.status === 'completed') {
    activeStepIndex = timelineStepsOrder.length -1;
  } else if (activeStepIndex === -1) {
    activeStepIndex = 0; // Default to pending if status is unknown
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
    if (maintenance.status === stepStatusKey) return maintenance.updated_at; // For in_progress or other current states
    return null;
  };
  
  const InfoPill = ({ Icon, label, value, className, valueClassName }) => (
    <div className={cn("flex items-center space-x-2 bg-muted/30 p-2.5 rounded-lg shadow-sm hover:shadow-md transition-shadow", className)}>
      <Icon className="h-5 w-5 text-primary" />
      <div className="flex flex-col">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className={cn("text-sm font-semibold text-foreground", valueClassName)}>{value || '-'}</span>
      </div>
    </div>
  );


  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl bg-gradient-to-br from-card via-background to-card/70 backdrop-blur-xl border-border/50 shadow-2xl rounded-xl">
        <DialogHeader className="pb-4 border-b border-border/30">
          <DialogTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-primary via-sky-400 to-emerald-400 flex items-center">
            <CalendarClock className="mr-3 h-8 w-8" /> Linha do Tempo da Manutenção
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-base">
            Status e detalhes de: <span className="font-semibold text-foreground">{maintenance.title}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-6 max-h-[70vh] overflow-y-auto pr-2">
          {/* Coluna da Timeline */}
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-xl font-semibold text-foreground mb-4">Progresso da Manutenção:</h3>
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-4 sm:space-y-0 sm:space-x-2">
              {timelineStepsOrder.map((stepKey, index) => {
                const currentStepRealStatus = getStepStatus(index);
                const isCurrent = currentStepRealStatus === maintenance.status && !isTerminal;
                const isCompleted = currentStepRealStatus === 'completed' || (index < activeStepIndex && maintenance.status !== 'cancelled' && maintenance.status !== 'rescheduled');
                const isCancelled = maintenance.status === 'cancelled' && index >= timelineStepsOrder.indexOf('pending');
                const isRescheduled = maintenance.status === 'rescheduled' && index >= timelineStepsOrder.indexOf('pending');
                
                let bgColor = 'bg-muted/40';
                let textColor = 'text-muted-foreground';
                let borderColor = 'border-border/30';
                let IconStep = AlertCircle;

                if (isCancelled) {
                  bgColor = 'bg-red-500/20'; textColor = 'text-red-400'; borderColor = 'border-red-500/50'; IconStep = X;
                } else if (isRescheduled) {
                  bgColor = 'bg-purple-500/20'; textColor = 'text-purple-400'; borderColor = 'border-purple-500/50'; IconStep = CalendarClock;
                } else if (isCompleted) {
                  bgColor = 'bg-green-500/20'; textColor = 'text-green-400'; borderColor = 'border-green-500/50'; IconStep = CheckCircle;
                } else if (isCurrent) {
                  bgColor = maintenanceStatusColors[maintenance.status] ? `${maintenanceStatusColors[maintenance.status]}/20` : 'bg-blue-500/20';
                  textColor = maintenanceStatusColors[maintenance.status] ? maintenanceStatusColors[maintenance.status].replace('bg-','text-') : 'text-blue-400';
                  textColor = textColor.replace('-500', '-400');
                  borderColor = maintenanceStatusColors[maintenance.status] ? `border-${maintenanceStatusColors[maintenance.status].split('-')[1]}-500/50` : 'border-blue-500/50';
                  IconStep = Settings2;
                }

                const stepDate = getStepDate(stepKey);

                return (
                  <React.Fragment key={stepKey}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.15 }}
                      className={cn(
                        "flex-1 p-3.5 rounded-lg border-2 shadow-lg min-w-[150px] text-center transition-all duration-300 transform hover:scale-105",
                        bgColor, borderColor
                      )}
                    >
                      <div className="flex flex-col items-center">
                        <IconStep className={cn("h-7 w-7 mb-2", textColor)} />
                        <p className={cn("font-semibold text-sm", textColor)}>{maintenanceStatusLabels[stepKey]}</p>
                        {stepDate && (isCompleted || isCurrent || isCancelled || isRescheduled) && (
                           <p className={cn("text-xs mt-1", textColor, "opacity-80")}>
                             {new Date(stepDate).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })}
                           </p>
                        )}
                      </div>
                    </motion.div>
                    {index < timelineStepsOrder.length - 1 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.15 + 0.1 }}
                        className="hidden sm:block"
                      >
                        <ArrowRight className={cn("h-6 w-6 mx-2", (isCompleted || isCancelled || isRescheduled) && index < activeStepIndex ? 'text-green-500' : 'text-muted-foreground/50')} />
                      </motion.div>
                       )}
                     {index < timelineStepsOrder.length - 1 && (
                       <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: index * 0.15 + 0.1 }}
                        className="block sm:hidden self-center transform rotate-90 my-2" // Flecha para baixo em mobile
                      >
                        <ArrowRight className={cn("h-5 w-5", (isCompleted || isCancelled || isRescheduled) && index < activeStepIndex ? 'text-green-500' : 'text-muted-foreground/50')} />
                      </motion.div>
                    )}
                  </React.Fragment>
                );
              })}
               {(maintenance.status === 'cancelled' || maintenance.status === 'rescheduled') && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: timelineStepsOrder.length * 0.15 + 0.1 }}
                    className="hidden sm:block"
                  >
                    <ArrowRight className={cn("h-6 w-6 mx-2", maintenance.status === 'cancelled' ? 'text-red-500' : 'text-purple-500')} />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: timelineStepsOrder.length * 0.15 + 0.1 }}
                    className="block sm:hidden self-center transform rotate-90 my-2"
                  >
                    <ArrowRight className={cn("h-5 w-5", maintenance.status === 'cancelled' ? 'text-red-500' : 'text-purple-500')} />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: timelineStepsOrder.length * 0.15 }}
                    className={cn(
                      "flex-1 p-3.5 rounded-lg border-2 shadow-lg min-w-[150px] text-center transition-all duration-300 transform hover:scale-105",
                      maintenance.status === 'cancelled' ? 'bg-red-500/20 border-red-500/50' : 'bg-purple-500/20 border-purple-500/50'
                    )}
                  >
                    <div className="flex flex-col items-center">
                      {maintenance.status === 'cancelled' ? <X className={cn("h-7 w-7 mb-2", 'text-red-400')} /> : <CalendarClock className={cn("h-7 w-7 mb-2", 'text-purple-400')} /> }
                      <p className={cn("font-semibold text-sm", maintenance.status === 'cancelled' ? 'text-red-400' : 'text-purple-400')}>{maintenanceStatusLabels[maintenance.status]}</p>
                      <p className={cn("text-xs mt-1", maintenance.status === 'cancelled' ? 'text-red-400' : 'text-purple-400', "opacity-80")}>
                        {new Date(maintenance.updated_at).toLocaleDateString('pt-BR', { day:'2-digit', month:'2-digit', year:'2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </div>
          
          {/* Coluna de Detalhes */}
          <div className="md:col-span-1 space-y-3 bg-card/50 p-4 rounded-lg shadow-inner border border-border/20">
            <h3 className="text-xl font-semibold text-foreground mb-3 border-b border-border/20 pb-2">Detalhes Adicionais:</h3>
            
            <InfoPill Icon={Info} label="Equipamento" value={getEquipmentName(maintenance)} />
            <InfoPill Icon={Tag} label="Tipo de Manutenção" value={<Badge variant="outline" className="text-sm">{maintenanceTypeLabels[maintenance.type] || maintenance.type}</Badge>} />
            <InfoPill Icon={AlertCircle} label="Prioridade" value={<Badge variant="outline" className="text-sm">{maintenancePriorityLabels[maintenance.priority] || maintenance.priority}</Badge>} />
            <InfoPill Icon={CalendarClock} label="Data Agendada" value={new Date(maintenance.scheduled_date).toLocaleString('pt-BR', {dateStyle: 'long', timeStyle: 'short'})} valueClassName={getDateColorClass(maintenance.scheduled_date)} />
             {maintenance.last_maintenance_date && <InfoPill Icon={Edit} label="Última Manutenção (Equip.)" value={new Date(maintenance.last_maintenance_date + 'T00:00:00').toLocaleDateString('pt-BR')} />}
            {getAssignedUserName(maintenance) !== 'N/A' && <InfoPill Icon={User} label="Atribuído a" value={getAssignedUserName(maintenance)} />}
            {maintenance.service_request_id && <InfoPill Icon={FileText} label="Origem (SS ID)" value={maintenance.service_request_id} />}
            {maintenance.work_order_id && <InfoPill Icon={FileText} label="Origem (OS ID)" value={maintenance.work_order_id} />}

            {maintenance.description && (
                <Card className="bg-transparent border-border/40">
                    <CardHeader className="p-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><FileText size={16} className="mr-2 text-primary"/> Descrição</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 text-sm text-foreground">
                        {maintenance.description}
                    </CardContent>
                </Card>
            )}

            {maintenance.notes && (
                <Card className="bg-transparent border-border/40">
                    <CardHeader className="p-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center"><FileText size={16} className="mr-2 text-primary"/> Observações</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0 text-sm text-foreground">
                        {maintenance.notes}
                    </CardContent>
                </Card>
            )}

            <div className="text-xs text-muted-foreground pt-3 border-t border-border/20 space-y-1">
              <p>Criado em: {new Date(maintenance.created_at).toLocaleString('pt-BR')}</p>
              <p>Atualizado em: {new Date(maintenance.updated_at).toLocaleString('pt-BR')}</p>
            </div>
          </div>
        </div>

        <DialogFooter className="pt-6 border-t border-border/30">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="bg-background hover:bg-muted">
            <XCircle className="mr-2 h-4 w-4" /> Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceTimelineModal;
