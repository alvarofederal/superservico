
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const urgencyLevels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
const statusLevels = { aberta: 'Aberta', 'em analise': 'Em Análise', convertida: 'Convertida', fechada: 'Fechada' };
const maintenanceTypeLabels = {
  preventive: 'Preventiva',
  corrective: 'Corretiva',
  predictive: 'Preditiva',
  inspection: 'Inspeção',
  other: 'Outra',
};

const ServiceRequestForm = ({ initialData, onSubmit, onCancel, equipments, isSubmitting }) => {
  const [formData, setFormData] = useState(
    initialData || {
      title: '', description: '', requester_name: '', requester_contact: '',
      equipment_id: null, urgency: 'medium', status: 'aberta',
      scheduled_maintenance_date: '', maintenance_type: 'corrective'
    }
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        scheduled_maintenance_date: initialData.scheduled_maintenance_date ? new Date(initialData.scheduled_maintenance_date).toISOString().substring(0,16) : '',
        maintenance_type: initialData.maintenance_type || 'corrective'
      });
    } else {
       setFormData({
        title: '', description: '', requester_name: '', requester_contact: '',
        equipment_id: null, urgency: 'medium', status: 'aberta',
        scheduled_maintenance_date: '', maintenance_type: 'corrective'
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.requester_name) {
      toast({ title: "Erro de Validação", description: "Título e Nome do Solicitante são obrigatórios.", variant: "destructive" });
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmitForm} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
        <div className="md:col-span-2">
          <Label htmlFor="title">Título da Solicitação *</Label>
          <Input id="title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Ex: Equipamento X parou de funcionar" required />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="description">Descrição do Problema</Label>
          <Textarea id="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Detalhe o problema ou a necessidade..." />
        </div>
        <div>
          <Label htmlFor="requester_name">Nome do Solicitante *</Label>
          <Input id="requester_name" value={formData.requester_name} onChange={(e) => handleChange('requester_name', e.target.value)} placeholder="Ex: João Silva" required />
        </div>
        <div>
          <Label htmlFor="requester_contact">Contato do Solicitante</Label>
          <Input id="requester_contact" value={formData.requester_contact} onChange={(e) => handleChange('requester_contact', e.target.value)} placeholder="Ex: (99) 99999-9999 ou ramal 123" />
        </div>
        <div>
          <Label htmlFor="equipment_id">Equipamento (Opcional)</Label>
          <Select value={formData.equipment_id || ''} onValueChange={(value) => handleChange('equipment_id', value || null)}>
            <SelectTrigger><SelectValue placeholder="Selecione um equipamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {equipments.map(eq => (<SelectItem key={eq.id} value={eq.id}>{eq.name} - {eq.location}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="urgency">Urgência</Label>
          <Select value={formData.urgency} onValueChange={(value) => handleChange('urgency', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(urgencyLevels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
         {initialData && (
          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(statusLevels).map(([key, label]) => (
                  <SelectItem key={key} value={key} disabled={key === 'convertida'}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="md:col-span-2">
          <Label htmlFor="maintenance_type">Tipo de Manutenção Agendada</Label>
          <Select value={formData.maintenance_type} onValueChange={(value) => handleChange('maintenance_type', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(maintenanceTypeLabels).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="scheduled_maintenance_date">Data para Manutenção Agendada (Opcional)</Label>
          <Input id="scheduled_maintenance_date" type="datetime-local" value={formData.scheduled_maintenance_date} onChange={(e) => handleChange('scheduled_maintenance_date', e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Atualizar Solicitação' : 'Criar Solicitação'}
        </Button>
      </div>
    </form>
  );
};

export default ServiceRequestForm;
