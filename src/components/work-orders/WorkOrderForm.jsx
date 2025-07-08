
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const statusLabels = { pending: 'Pendente', 'in-progress': 'Em Andamento', completed: 'Concluída', cancelled: 'Cancelada' };
const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' };
const typeLabels = { preventive: 'Preventiva', corrective: 'Corretiva', emergency: 'Emergência', improvement: 'Melhoria', inspection: 'Inspeção', predictive: 'Preditiva', other: 'Outra' };

const WorkOrderForm = ({ initialData, onSubmit, onCancel, equipments, isSubmitting }) => {
  const [formData, setFormData] = useState(
    initialData || {
      title: '', description: '', equipmentid: '', type: 'corrective', priority: 'medium', status: 'pending',
      assignedto: '', scheduleddate: '', estimatedcost: 0, actualcost: 0,
      estimatedhours: 0, actualhours: 0, notes: '', partsused: [], service_request_id: null,
      maintenance_type: 'corrective'
    }
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        scheduleddate: initialData.scheduleddate ? new Date(initialData.scheduleddate).toISOString().substring(0, 16) : '',
        maintenance_type: initialData.maintenance_type || initialData.type || 'corrective'
      });
    } else {
      setFormData({
        title: '', description: '', equipmentid: '', type: 'corrective', priority: 'medium', status: 'pending',
        assignedto: '', scheduleddate: '', estimatedcost: 0, actualcost: 0,
        estimatedhours: 0, actualhours: 0, notes: '', partsused: [], service_request_id: null,
        maintenance_type: 'corrective'
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.equipmentid) {
      toast({ title: "Erro de Validação", description: "Título e Equipamento são obrigatórios.", variant: "destructive" });
      return;
    }
    const dataToSubmit = { ...formData, type: formData.maintenance_type };
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmitForm} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-1">
        <div className="md:col-span-2"><Label htmlFor="title">Título da Ordem *</Label><Input id="title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Ex: Manutenção corretiva do compressor" required /></div>
        <div className="md:col-span-2"><Label htmlFor="description">Descrição</Label><Input id="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Descrição detalhada do serviço..." /></div>
        <div><Label htmlFor="equipmentid">Equipamento *</Label><Select value={formData.equipmentid} onValueChange={(value) => handleChange('equipmentid', value)} required><SelectTrigger><SelectValue placeholder="Selecione um equipamento" /></SelectTrigger><SelectContent>{equipments.map(eq => (<SelectItem key={eq.id} value={eq.id}>{eq.name} - {eq.location}</SelectItem>))}</SelectContent></Select></div>
        
        <div>
          <Label htmlFor="maintenance_type">Tipo de Manutenção</Label>
          <Select value={formData.maintenance_type} onValueChange={(value) => handleChange('maintenance_type', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(typeLabels).map(([k,v])=>(<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
          </Select>
        </div>

        <div><Label htmlFor="priority">Prioridade</Label><Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(priorityLabels).map(([k,v])=>(<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select></div>
        <div><Label htmlFor="status">Status</Label><Select value={formData.status} onValueChange={(value) => handleChange('status', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([k,v])=>(<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select></div>
        <div><Label htmlFor="assignedto">Responsável</Label><Input id="assignedto" value={formData.assignedto} onChange={(e) => handleChange('assignedto', e.target.value)} placeholder="Nome do técnico responsável" /></div>
        <div><Label htmlFor="scheduleddate">Data Agendada</Label><Input id="scheduleddate" type="datetime-local" value={formData.scheduleddate} onChange={(e) => handleChange('scheduleddate', e.target.value)} /></div>
        <div><Label htmlFor="estimatedcost">Custo Estimado (R$)</Label><Input id="estimatedcost" type="number" step="0.01" value={formData.estimatedcost} onChange={(e) => handleChange('estimatedcost', e.target.value)} placeholder="0.00" /></div>
        <div><Label htmlFor="actualcost">Custo Real (R$)</Label><Input id="actualcost" type="number" step="0.01" value={formData.actualcost} onChange={(e) => handleChange('actualcost', e.target.value)} placeholder="0.00" /></div>
        <div><Label htmlFor="estimatedhours">Horas Estimadas</Label><Input id="estimatedhours" type="number" step="0.5" value={formData.estimatedhours} onChange={(e) => handleChange('estimatedhours', e.target.value)} placeholder="0" /></div>
        <div><Label htmlFor="actualhours">Horas Reais</Label><Input id="actualhours" type="number" step="0.5" value={formData.actualhours} onChange={(e) => handleChange('actualhours', e.target.value)} placeholder="0" /></div>
        <div className="md:col-span-2"><Label htmlFor="notes">Observações</Label><Input id="notes" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Observações adicionais..." /></div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? 'Atualizar Ordem' : 'Criar Ordem'}
        </Button>
      </div>
    </form>
  );
};

export default WorkOrderForm;
