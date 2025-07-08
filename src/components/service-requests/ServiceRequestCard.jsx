
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Send, Eye, Archive, FolderArchive as Unarchive } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const urgencyLevels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
const urgencyColors = { low: 'bg-green-500 dark:bg-green-600', medium: 'bg-yellow-500 dark:bg-yellow-600', high: 'bg-red-500 dark:bg-red-600' };
const statusLevels = { aberta: 'Aberta', 'em-atendimento': 'Em Atendimento', concluida: 'Concluída', cancelada: 'Cancelada', convertida: 'Convertida' };
const statusColors = { aberta: 'bg-blue-500', 'em-atendimento': 'bg-orange-500', concluida: 'bg-green-500', cancelada: 'bg-gray-500', convertida: 'bg-purple-500' };
const maintenanceTypeLabels = {
  preventive: 'Preventiva',
  corrective: 'Corretiva',
  predictive: 'Preditiva',
  inspection: 'Inspeção',
  other: 'Outra',
};

const ServiceRequestCard = ({ request, onEdit, onDetails, onArchive, onConvertToWorkOrder, canEdit, canArchive }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-2">
            <CardTitle className="text-lg text-foreground truncate" title={request.title}>{request.title}</CardTitle>
            <p className="text-sm text-muted-foreground">Solicitante: {request.requester_name}</p>
          </div>
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => onDetails(request)} className="h-8 w-8 text-muted-foreground hover:text-primary"><Eye className="h-4 w-4" /></Button>
            <Button variant="ghost" size="icon" onClick={() => onEdit(request)} className="h-8 w-8 text-muted-foreground hover:text-primary" disabled={!canEdit}><Edit className="h-4 w-4" /></Button>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <Badge variant="outline" className={`${statusColors[request.status]} text-primary-foreground border-0`}>{statusLevels[request.status]}</Badge>
          <Badge variant="outline" className={`${urgencyColors[request.urgency]} text-primary-foreground border-0`}>{urgencyLevels[request.urgency]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
        {request.description && (<p className="text-sm text-foreground line-clamp-3" title={request.description}>{request.description}</p>)}
        {request.equipment_id && (<p className="text-sm"><span className="text-muted-foreground">Equipamento: </span><span className="text-foreground">{request.equipments?.name || 'Não encontrado'}</span></p>)}
        {request.requester_contact && (<p className="text-sm"><span className="text-muted-foreground">Contato: </span><span className="text-foreground">{request.requester_contact}</span></p>)}
        {request.scheduled_maintenance_date && (<p className="text-sm"><span className="text-muted-foreground">Manutenção Agendada: </span><span className="text-foreground">{new Date(request.scheduled_maintenance_date).toLocaleDateString('pt-BR')} ({maintenanceTypeLabels[request.maintenance_type]})</span></p>)}
        <p className="text-xs text-muted-foreground pt-1">Criado em: {new Date(request.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </CardContent>
      <div className="p-4 border-t border-border/50 mt-auto space-y-2">
        {!request.is_archived && (request.status === 'aberta' || request.status === 'em-atendimento') ? (
          <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => onConvertToWorkOrder(request)} disabled={!canEdit}>
            <Send className="h-4 w-4 mr-2" /> Converter para O.S.
          </Button>
        ) : !request.is_archived && (
           <Button size="sm" className="w-full" disabled>
             <Send className="h-4 w-4 mr-2" /> {statusLevels[request.status]}
           </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm" className="w-full" disabled={!canArchive}>
              {request.is_archived ? <Unarchive className="h-4 w-4 mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
              {request.is_archived ? 'Desarquivar' : 'Arquivar'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar {request.is_archived ? 'Desarquivamento' : 'Arquivamento'}</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja {request.is_archived ? 'desarquivar' : 'arquivar'} a solicitação "{request.title}"?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onArchive(request.id, !request.is_archived)} className={request.is_archived ? '' : 'bg-amber-600 hover:bg-amber-700'}>
                {request.is_archived ? 'Desarquivar' : 'Arquivar'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};

export default ServiceRequestCard;
