
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Wrench, Tag, Info, CalendarDays, User, Clock, AlertTriangle, CheckCircle, FileText, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { maintenanceStatusColors, maintenanceStatusLabels, maintenanceTypeLabels, maintenancePriorityLabels, getDateColorClass } from '@/components/maintenance/maintenanceUtils';

const sheetVariants = {
  hidden: { x: "100%" },
  visible: { x: 0 },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const DetailItem = ({ icon: Icon, label, value, children }) => (
  <div className="flex items-start space-x-4 py-3 border-b border-border/30 last:border-b-0">
    <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
    <div className="flex-grow">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {value ? (
        <p className="text-base text-foreground break-words">{value}</p>
      ) : children || <p className="text-base text-muted-foreground/70 italic">Não informado</p>}
    </div>
  </div>
);

const MaintenanceDetailsModal = ({ isOpen, setIsOpen, maintenance, getEquipmentName, getAssignedUserName }) => {
  const onClose = () => setIsOpen(false);

  return (
    <AnimatePresence>
      {isOpen && maintenance && (
        <>
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
            transition={{ duration: 0.3 }}
          />
          <motion.div
            key="sheet"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-card border-l border-border/50 shadow-2xl z-50 flex flex-col"
          >
            <header className="flex items-center justify-between p-4 border-b border-border/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Wrench className="h-7 w-7 text-primary"/>
                <h2 className="text-xl font-bold text-foreground">Detalhes da Manutenção</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </header>

            <ScrollArea className="flex-grow p-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold mb-2 text-primary">Informações Gerais</h3>
                <DetailItem icon={Info} label="Título" value={maintenance.title} />
                <DetailItem icon={FileText} label="Descrição" value={maintenance.description} />
                <DetailItem icon={Wrench} label="Equipamento" value={getEquipmentName(maintenance)} />
                <DetailItem icon={Tag} label="Tipo">
                  <Badge variant="outline">{maintenanceTypeLabels[maintenance.type] || maintenance.type}</Badge>
                </DetailItem>
                <DetailItem icon={Tag} label="Status">
                  <Badge className={`${maintenanceStatusColors[maintenance.status]} text-primary-foreground border-0`}>
                    {maintenanceStatusLabels[maintenance.status] || maintenance.status}
                  </Badge>
                </DetailItem>
                <DetailItem icon={AlertTriangle} label="Prioridade">
                  <Badge variant="outline">{maintenancePriorityLabels[maintenance.priority] || maintenance.priority}</Badge>
                </DetailItem>

                <h3 className="text-lg font-semibold mt-6 mb-2 text-primary">Datas e Prazos</h3>
                <DetailItem icon={CalendarDays} label="Data Agendada">
                  <span className={getDateColorClass(maintenance.scheduled_date)}>
                    {new Date(maintenance.scheduled_date).toLocaleString('pt-BR', {dateStyle: 'long', timeStyle: 'short'})}
                  </span>
                </DetailItem>
                <DetailItem icon={CheckCircle} label="Data de Conclusão" value={maintenance.completion_date ? new Date(maintenance.completion_date).toLocaleString('pt-BR', {dateStyle: 'long', timeStyle: 'short'}) : null} />
                <DetailItem icon={Clock} label="Última Manutenção (Equip.)" value={maintenance.last_maintenance_date ? new Date(maintenance.last_maintenance_date + 'T00:00:00').toLocaleDateString('pt-BR') : null} />

                <h3 className="text-lg font-semibold mt-6 mb-2 text-primary">Responsáveis e Origem</h3>
                <DetailItem icon={User} label="Atribuído a" value={getAssignedUserName(maintenance)} />
                <DetailItem icon={LinkIcon} label="Origem (Solicitação de Serviço)" value={maintenance.service_request_id} />
                <DetailItem icon={LinkIcon} label="Origem (Ordem de Serviço)" value={maintenance.work_order_id} />

                <h3 className="text-lg font-semibold mt-6 mb-2 text-primary">Outras Informações</h3>
                <DetailItem icon={FileText} label="Observações" value={maintenance.notes} />
                <DetailItem icon={Clock} label="Criado em" value={new Date(maintenance.created_at).toLocaleString('pt-BR')} />
                <DetailItem icon={Clock} label="Atualizado em" value={new Date(maintenance.updated_at).toLocaleString('pt-BR')} />
              </div>
            </ScrollArea>

            <footer className="p-4 border-t border-border/50 flex-shrink-0 flex justify-end">
              <Button variant="outline" onClick={onClose}>
                <X className="mr-2 h-4 w-4" /> Fechar
              </Button>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MaintenanceDetailsModal;
