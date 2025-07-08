
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, FileText, Tag, Info, CalendarDays, User, AlertTriangle, Link as LinkIcon, DollarSign, Clock, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { generateWorkOrderPDF } from '@/components/work-orders/workOrderUtils';

const sheetVariants = {
  hidden: { x: "100%" },
  visible: { x: 0 },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const statusColors = { pending: 'bg-yellow-500', 'in-progress': 'bg-blue-500', completed: 'bg-green-500', cancelled: 'bg-gray-500' };
const statusLabels = { pending: 'Pendente', 'in-progress': 'Em Andamento', completed: 'Concluída', cancelled: 'Cancelada' };
const priorityColors = { low: 'bg-green-500', medium: 'bg-yellow-500', high: 'bg-orange-500', critical: 'bg-red-500' };
const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' };
const typeLabels = { preventive: 'Preventiva', corrective: 'Corretiva', emergency: 'Emergência', improvement: 'Melhoria', inspection: 'Inspeção', predictive: 'Preditiva', other: 'Outra' };

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

const WorkOrderDetailsModal = ({ isOpen, onClose, order, equipments }) => {
  if (!order) return null;

  const getEquipmentName = (equipmentId) => {
    const equipment = equipments.find(eq => eq.id === equipmentId);
    return equipment ? equipment.name : 'Equipamento não encontrado';
  };
  
  const getEquipmentDetails = (equipmentId) => {
    return equipments.find(eq => eq.id === equipmentId) || {};
  }
  
  const handleGeneratePDF = () => {
    generateWorkOrderPDF(order, getEquipmentDetails(order.equipmentid));
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
                <FileText className="h-7 w-7 text-primary"/>
                <h2 className="text-xl font-bold text-foreground">Detalhes da Ordem de Serviço</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleGeneratePDF}>
                  <Download className="h-4 w-4 mr-2"/>
                  Gerar PDF
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </header>

            <ScrollArea className="flex-grow p-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold mb-2 text-primary">Informações Gerais</h3>
                <DetailItem icon={Info} label="Título" value={order.title} />
                <DetailItem icon={FileText} label="Descrição" value={order.description} />
                <DetailItem icon={LinkIcon} label="Equipamento" value={getEquipmentName(order.equipmentid)} />
                
                <DetailItem icon={Tag} label="Status">
                  <Badge className={`${statusColors[order.status]} text-primary-foreground border-0`}>
                    {statusLabels[order.status] || order.status}
                  </Badge>
                </DetailItem>
                <DetailItem icon={AlertTriangle} label="Prioridade">
                   <Badge variant="outline" className={`${priorityColors[order.priority]} text-white border-0`}>{priorityLabels[order.priority]}</Badge>
                </DetailItem>
                 <DetailItem icon={Tag} label="Tipo">
                  <Badge variant="outline">{typeLabels[order.type] || order.type}</Badge>
                </DetailItem>

                <h3 className="text-lg font-semibold mt-6 mb-2 text-primary">Agendamento e Responsáveis</h3>
                <DetailItem icon={User} label="Responsável" value={order.assignedto} />
                <DetailItem icon={CalendarDays} label="Data Agendada" value={order.scheduleddate ? new Date(order.scheduleddate).toLocaleString('pt-BR', {dateStyle: 'long', timeStyle: 'short'}) : null} />

                <h3 className="text-lg font-semibold mt-6 mb-2 text-primary">Custos e Horas</h3>
                <DetailItem icon={DollarSign} label="Custo Estimado" value={`R$ ${(order.estimatedcost || 0).toFixed(2)}`} />
                <DetailItem icon={DollarSign} label="Custo Real" value={`R$ ${(order.actualcost || 0).toFixed(2)}`} />
                <DetailItem icon={Clock} label="Horas Estimadas" value={`${(order.estimatedhours || 0)}h`} />
                <DetailItem icon={Clock} label="Horas Reais" value={`${(order.actualhours || 0)}h`} />

                <h3 className="text-lg font-semibold mt-6 mb-2 text-primary">Outras Informações</h3>
                <DetailItem icon={FileText} label="Observações" value={order.notes} />
                <DetailItem icon={LinkIcon} label="Originado da SS" value={order.service_request_id} />
                <DetailItem icon={CalendarDays} label="Criado em" value={new Date(order.createdat).toLocaleString('pt-BR')} />
                <DetailItem icon={CalendarDays} label="Atualizado em" value={new Date(order.updatedat).toLocaleString('pt-BR')} />
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

export default WorkOrderDetailsModal;
