import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { maintenanceTypeLabels, maintenanceStatusLabels, maintenancePriorityLabels } from '@/components/maintenance/maintenanceUtils';

const MaintenanceForm = ({ initialData, onSubmit, onCancel, equipments, users, isSubmitting }) => {
  const [formData, setFormData] = useState(
    initialData || {
      title: '', description: '', equipment_id: null, type: 'preventive', status: 'pending', priority: 'medium',
      scheduled_date: '', last_maintenance_date: null, assigned_to_user_id: null, notes: ''
    }
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        scheduled_date: initialData.scheduled_date ? new Date(initialData.scheduled_date).toISOString().substring(0, 16) : '',
        last_maintenance_date: initialData.last_maintenance_date ? new Date(initialData.last_maintenance_date).toISOString().substring(0, 10) : null,
      });
    } else {
      setFormData({
        title: '', description: '', equipment_id: null, type: 'preventive', status: 'pending', priority: 'medium',
        scheduled_date: '', last_maintenance_date: null, assigned_to_user_id: null, notes: ''
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.type || !formData.scheduled_date) {
      toast({ title: "Erro de Validação", description: "Título, Tipo e Data Agendada são obrigatórios.", variant: "destructive" });
      return;
    }
    onSubmit(formData);
  };
  
  const technicians = (users || []).filter(u => u.role_in_company === 'company_technician' || u.role_in_company === 'company_admin');

  return (
    <form onSubmit={handleSubmitForm} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-1">
        <div className="md:col-span-2">
          <Label htmlFor="title">Título da Manutenção *</Label>
          <Input id="title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Ex: Inspeção Semanal do Gerador" required />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Detalhes da manutenção..." />
        </div>
        <div>
          <Label htmlFor="equipment_id">Equipamento (Opcional)</Label>
          <Select value={formData.equipment_id || ''} onValueChange={(value) => handleChange('equipment_id', value || null)}>
            <SelectTrigger><SelectValue placeholder="Selecione um equipamento" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Nenhum</SelectItem>
              {(equipments || []).map(eq => (<SelectItem key={eq.id} value={eq.id}>{eq.name} - {eq.location}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="type">Tipo de Manutenção *</Label>
          <Select value={formData.type} onValueChange={(value) => handleChange('type', value)} required>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(maintenanceTypeLabels).map(([k,v])=>(<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Status *</Label>
          <Select value={formData.status} onValueChange={(value) => handleChange('status', value)} required>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(maintenanceStatusLabels).map(([k,v])=>(<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="priority">Prioridade</Label>
          <Select value={formData.priority} onValueChange={(value) => handleChange('priority', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{Object.entries(maintenancePriorityLabels).map(([k,v])=>(<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="scheduled_date">Data Agendada *</Label>
          <Input id="scheduled_date" type="datetime-local" value={formData.scheduled_date} onChange={(e) => handleChange('scheduled_date', e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="last_maintenance_date">Última Manutenção (Equip.)</Label>
          <Input id="last_maintenance_date" type="date" value={formData.last_maintenance_date || ''} onChange={(e) => handleChange('last_maintenance_date', e.target.value || null)} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="assigned_to_user_id">Atribuído Para (Técnico)</Label>
          <Select value={formData.assigned_to_user_id || ''} onValueChange={(value) => handleChange('assigned_to_user_id', value || null)}>
            <SelectTrigger><SelectValue placeholder="Selecione um técnico" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">Ninguém</SelectItem>
              {technicians.map(user => (<SelectItem key={user.id} value={user.id}>{user.full_name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Textarea id="notes" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Notas adicionais..." />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? 'Atualizar Manutenção' : 'Criar Manutenção'}
        </Button>
      </div>
    </form>
  );
};

export default MaintenanceForm;