
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Calendar, FileText, Eye, Archive, FolderArchive as Unarchive } from 'lucide-react';

const statusColors = { pending: 'bg-yellow-500', 'in-progress': 'bg-blue-500', completed: 'bg-green-500', cancelled: 'bg-gray-500' };
const statusLabels = { pending: 'Pendente', 'in-progress': 'Em Andamento', completed: 'Concluída', cancelled: 'Cancelada' };
const priorityColors = { low: 'bg-green-500', medium: 'bg-yellow-500', high: 'bg-orange-500', critical: 'bg-red-500' };
const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' };
const typeLabels = { preventive: 'Preventiva', corrective: 'Corretiva', emergency: 'Emergência', improvement: 'Melhoria', inspection: 'Inspeção', predictive: 'Preditiva', other: 'Outra' };

const WorkOrderCard = ({ order, onEdit, onDetails, onArchive, getEquipmentName, canEdit, canArchive }) => (
  <Card className="glass-effect card-hover h-full flex flex-col">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <CardTitle className="text-lg">{order.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{getEquipmentName(order.equipmentid)}</p>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => onDetails(order)} className="h-8 w-8"><Eye className="h-4 w-4" /></Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(order)} className="h-8 w-8" disabled={!canEdit}><FileText className="h-4 w-4" /></Button>
        </div>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={`${statusColors[order.status]} text-white border-0`}>{statusLabels[order.status]}</Badge>
        <Badge variant="outline" className={`${priorityColors[order.priority]} text-white border-0`}>{priorityLabels[order.priority]}</Badge>
        <Badge variant="outline">{typeLabels[order.type] || order.type}</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-3 flex-grow">
      {order.description && (<p className="text-sm text-muted-foreground line-clamp-2">{order.description}</p>)}
      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Responsável:</span><span>{order.assignedto || 'Não definido'}</span></div>
        {order.scheduleddate && (<div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="text-muted-foreground">Agendado:</span><span>{new Date(order.scheduleddate).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span></div>)}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 pt-2">
          <div><span className="text-muted-foreground">Custo Est.:</span><p className="font-medium text-blue-400">R$ {(order.estimatedcost || 0).toFixed(2)}</p></div>
          {order.actualcost > 0 && <div><span className="text-muted-foreground">Custo Real:</span><p className="font-medium text-green-400">R$ {(order.actualcost || 0).toFixed(2)}</p></div>}
          <div><span className="text-muted-foreground">Horas Est.:</span><p className="font-medium">{(order.estimatedhours || 0)}h</p></div>
          {order.actualhours > 0 && <div><span className="text-muted-foreground">Horas Reais:</span><p className="font-medium">{(order.actualhours || 0)}h</p></div>}
        </div>
      </div>
      {order.notes && (<div className="text-sm"><span className="text-muted-foreground font-medium">Obs: </span><span className="line-clamp-1">{order.notes}</span></div>)}
      <div className="text-xs text-muted-foreground pt-2 border-t border-border">Criado: {new Date(order.createdat).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}{order.updatedat && order.updatedat !== order.createdat && ` | Atualizado: ${new Date(order.updatedat).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`}</div>
    </CardContent>
    <div className="p-4 border-t border-border/50 mt-auto">
      <Button variant="outline" size="sm" className="w-full" onClick={() => onArchive(order.id, !order.is_archived)} disabled={!canArchive}>
        {order.is_archived ? <Unarchive className="h-4 w-4 mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
        {order.is_archived ? 'Desarquivar' : 'Arquivar'}
      </Button>
    </div>
  </Card>
);

export default WorkOrderCard;
