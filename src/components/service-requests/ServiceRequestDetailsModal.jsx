
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, FileText, Tag, Info, CalendarDays, User, AlertTriangle, Link as LinkIcon, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const sheetVariants = {
  hidden: { x: "100%" },
  visible: { x: 0 },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const urgencyLevels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
const urgencyColors = { low: 'bg-green-500', medium: 'bg-yellow-500', high: 'bg-red-500' };
const statusLevels = { aberta: 'Aberta', 'em-atendimento': 'Em Atendimento', concluida: 'Concluída', cancelada: 'Cancelada', convertida: 'Convertida' };
const statusColors = { aberta: 'bg-blue-500', 'em-atendimento': 'bg-orange-500', concluida: 'bg-green-500', cancelada: 'bg-gray-500', convertida: 'bg-purple-500' };
const maintenanceTypeLabels = {
  preventive: 'Preventiva',
  corrective: 'Corretiva',
  predictive: 'Preditiva',
  inspection: 'Inspeção',
  other: 'Outra',
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

const ServiceRequestDetailsModal = ({ isOpen, onClose, request }) => {
  if (!request) return null;

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
                <h2 className="text-xl font-bold text-foreground">Detalhes da Solicitação</h2>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-5 w-5" />
              </Button>
            </header>

            <ScrollArea className="flex-grow p-6">
              <div className="space-y-1">
                <h3 className="text-lg font-semibold mb-2 text-primary">Informações Gerais</h3>
                <DetailItem icon={Info} label="Título" value={request.title} />
                <DetailItem icon={FileText} label="Descrição" value={request.description} />
                <DetailItem icon={LinkIcon} label="Equipamento" value={request.equipments?.name || 'Nenhum'} />
                
                <DetailItem icon={Tag} label="Status">
                  <Badge className={`${statusColors[request.status]} text-primary-foreground border-0`}>
                    {statusLevels[request.status] || request.status}
                  </Badge>
                </DetailItem>
                <DetailItem icon={AlertTriangle} label="Urgência">
                  <Badge className={`${urgencyColors[request.urgency]} text-primary-foreground border-0`}>
                    {urgencyLevels[request.urgency] || request.urgency}
                  </Badge>
                </DetailItem>

                <h3 className="text-lg font-semibold mt-6 mb-2 text-primary">Solicitante</h3>
                <DetailItem icon={User} label="Nome do Solicitante" value={request.requester_name} />
                <DetailItem icon={Phone} label="Contato" value={request.requester_contact} />

                <h3 className="text-lg font-semibold mt-6 mb-2 text-primary">Agendamento</h3>
                <DetailItem icon={Tag} label="Tipo de Manutenção Sugerida" value={maintenanceTypeLabels[request.maintenance_type]} />
                <DetailItem icon={CalendarDays} label="Data Sugerida" value={request.scheduled_maintenance_date ? new Date(request.scheduled_maintenance_date).toLocaleString('pt-BR', {dateStyle: 'long', timeStyle: 'short'}) : null} />

                <h3 className="text-lg font-semibold mt-6 mb-2 text-primary">Datas</h3>
                <DetailItem icon={CalendarDays} label="Criado em" value={new Date(request.created_at).toLocaleString('pt-BR')} />
                <DetailItem icon={CalendarDays} label="Atualizado em" value={new Date(request.updated_at).toLocaleString('pt-BR')} />
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

export default ServiceRequestDetailsModal;
