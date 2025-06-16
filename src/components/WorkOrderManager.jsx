import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FileText, Calendar, User, DollarSign, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const statusColors = { pending: 'bg-yellow-500', 'in-progress': 'bg-blue-500', completed: 'bg-green-500', cancelled: 'bg-gray-500' };
const statusLabels = { pending: 'Pendente', 'in-progress': 'Em Andamento', completed: 'Concluída', cancelled: 'Cancelada' };
const priorityColors = { low: 'bg-green-500', medium: 'bg-yellow-500', high: 'bg-orange-500', critical: 'bg-red-500' };
const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' };
const typeLabels = { preventive: 'Preventiva', corrective: 'Corretiva', emergency: 'Emergência', improvement: 'Melhoria' };

const WorkOrderForm = ({ initialData, onSubmit, onCancel, equipments, isSubmitting, userProfile }) => {
  const [formData, setFormData] = useState(
    initialData || {
      title: '', description: '', equipmentid: '', type: 'corrective', priority: 'medium', status: 'pending',
      assignedto: '', scheduleddate: '', estimatedcost: 0, actualcost: 0,
      estimatedhours: 0, actualhours: 0, notes: '', partsused: [], service_request_id: null
    }
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        scheduleddate: initialData.scheduleddate ? new Date(initialData.scheduleddate).toISOString().substring(0, 16) : '',
      });
    } else {
      setFormData({
        title: '', description: '', equipmentid: '', type: 'corrective', priority: 'medium', status: 'pending',
        assignedto: '', scheduleddate: '', estimatedcost: 0, actualcost: 0,
        estimatedhours: 0, actualhours: 0, notes: '', partsused: [], service_request_id: null
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
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmitForm} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[70vh] overflow-y-auto p-1">
        <div className="md:col-span-2"><Label htmlFor="title">Título da Ordem *</Label><Input id="title" value={formData.title} onChange={(e) => handleChange('title', e.target.value)} placeholder="Ex: Manutenção corretiva do compressor" /></div>
        <div className="md:col-span-2"><Label htmlFor="description">Descrição</Label><Input id="description" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Descrição detalhada do serviço..." /></div>
        <div><Label htmlFor="equipmentid">Equipamento *</Label><Select value={formData.equipmentid} onValueChange={(value) => handleChange('equipmentid', value)}><SelectTrigger><SelectValue placeholder="Selecione um equipamento" /></SelectTrigger><SelectContent>{equipments.map(eq => (<SelectItem key={eq.id} value={eq.id}>{eq.name} - {eq.location}</SelectItem>))}</SelectContent></Select></div>
        <div><Label htmlFor="type">Tipo de Manutenção</Label><Select value={formData.type} onValueChange={(value) => handleChange('type', value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(typeLabels).map(([k,v])=>(<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select></div>
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

const WorkOrderCard = ({ order, onEdit, getEquipmentName }) => (
  <Card className="glass-effect card-hover h-full">
    <CardHeader className="pb-3">
      <div className="flex items-start justify-between">
        <div className="flex-1"><CardTitle className="text-lg">{order.title}</CardTitle><p className="text-sm text-muted-foreground">{getEquipmentName(order.equipmentid)}</p></div>
        <Button variant="ghost" size="icon" onClick={() => onEdit(order)} className="h-8 w-8"><FileText className="h-4 w-4" /></Button>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <Badge variant="outline" className={`${statusColors[order.status]} text-white border-0`}>{statusLabels[order.status]}</Badge>
        <Badge variant="outline" className={`${priorityColors[order.priority]} text-white border-0`}>{priorityLabels[order.priority]}</Badge>
        <Badge variant="outline">{typeLabels[order.type]}</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-3">
      {order.description && (<p className="text-sm text-muted-foreground">{order.description}</p>)}
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
      {order.notes && (<div className="text-sm"><span className="text-muted-foreground font-medium">Obs: </span><span>{order.notes}</span></div>)}
      <div className="text-xs text-muted-foreground pt-2 border-t border-border">Criado: {new Date(order.createdat).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}{order.updatedat && order.updatedat !== order.createdat && ` | Atualizado: ${new Date(order.updatedat).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`}</div>
    </CardContent>
  </Card>
);

const WorkOrderManager = ({ workOrders: initialWorkOrders, setWorkOrders: setGlobalWorkOrders, equipments, userProfile, serviceRequestToConvert, onConversionHandled }) => {
  const [workOrders, setWorkOrders] = useState(initialWorkOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setWorkOrders(initialWorkOrders);
  }, [initialWorkOrders]);

  useEffect(() => {
    if (serviceRequestToConvert) {
      const newOrderFromRequest = {
        title: `OS da Solicitação: ${serviceRequestToConvert.title}`,
        description: serviceRequestToConvert.description,
        equipmentid: serviceRequestToConvert.equipment_id,
        priority: serviceRequestToConvert.urgency,
        type: 'corrective',
        status: 'pending',
        service_request_id: serviceRequestToConvert.id,
        assignedto: '',
        scheduleddate: '',
        estimatedcost: 0,
        actualcost: 0,
        estimatedhours: 0,
        actualhours: 0,
        notes: `Originado da solicitação de ${serviceRequestToConvert.requester_name}. Contato: ${serviceRequestToConvert.requester_contact || 'N/A'}.`,
        partsused: []
      };
      setEditingOrder(newOrderFromRequest);
      setIsDialogOpen(true);
      onConversionHandled();
    }
  }, [serviceRequestToConvert, onConversionHandled]);

  const filteredOrders = workOrders.filter(order => {
    const title = order.title || "";
    const description = order.description || "";
    const assignedTo = order.assignedto || "";
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) || description.toLowerCase().includes(searchTerm.toLowerCase()) || assignedTo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || order.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const orderData = {
        ...formData,
        company_id: userProfile?.current_company_id,
        user_id: userProfile?.id,
        estimatedcost: parseFloat(formData.estimatedcost) || 0,
        actualcost: parseFloat(formData.actualcost) || 0,
        estimatedhours: parseFloat(formData.estimatedhours) || 0,
        actualhours: parseFloat(formData.actualhours) || 0,
        scheduleddate: formData.scheduleddate || null,
      };

      if (editingOrder?.id) {
        const { error } = await supabase.from('work_orders').update({ ...orderData, updatedat: new Date().toISOString() }).eq('id', editingOrder.id);
        if (error) throw error;
        toast({ title: "Sucesso!", description: "Ordem de serviço atualizada." });
      } else {
        const { error } = await supabase.from('work_orders').insert([{ ...orderData, createdat: new Date().toISOString(), updatedat: new Date().toISOString() }]);
        if (error) throw error;
        toast({ title: "Sucesso!", description: "Ordem de serviço criada." });
      }
      setGlobalWorkOrders();
      setIsDialogOpen(false);
      setEditingOrder(null);
    } catch (error) {
      console.error('Error submitting work order:', error);
      toast({ title: "Erro ao Salvar", description: `Falha ao salvar ordem de serviço: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddDialog = () => { setEditingOrder(null); setIsDialogOpen(true); };
  const openEditDialog = (order) => { setEditingOrder(order); setIsDialogOpen(true); };
  const getEquipmentName = (equipmentId) => equipments.find(eq => eq.id === equipmentId)?.name || 'N/A';
  
  const pendingOrdersCount = workOrders.filter(o => o.status === 'pending').length;
  const inProgressOrdersCount = workOrders.filter(o => o.status === 'in-progress').length;
  const completedOrdersCount = workOrders.filter(o => o.status === 'completed').length;
  const totalCost = workOrders.reduce((sum, o) => sum + (o.actualcost || o.estimatedcost || 0), 0);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-3xl font-bold gradient-text">Ordens de Serviço</h1><p className="text-muted-foreground">Gerencie todas as ordens de manutenção</p></div>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsDialogOpen(isOpen); }}>
          <DialogTrigger asChild><Button className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700" onClick={openAddDialog}><Plus className="h-4 w-4 mr-2" /> Nova Ordem</Button></DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh]"><DialogHeader><DialogTitle>{editingOrder?.id ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}</DialogTitle></DialogHeader><WorkOrderForm initialData={editingOrder} onSubmit={handleFormSubmit} onCancel={() => setIsDialogOpen(false)} equipments={equipments} isSubmitting={isSubmitting} userProfile={userProfile} /></DialogContent>
        </Dialog>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}><Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pendentes</CardTitle><Clock className="h-4 w-4 text-yellow-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-400">{pendingOrdersCount}</div></CardContent></Card></motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}><Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Em Andamento</CardTitle><AlertCircle className="h-4 w-4 text-blue-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-400">{inProgressOrdersCount}</div></CardContent></Card></motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}><Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Concluídas</CardTitle><CheckCircle className="h-4 w-4 text-green-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-400">{completedOrdersCount}</div></CardContent></Card></motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}><Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Custo Total</CardTitle><DollarSign className="h-4 w-4 text-green-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-400">R$ {totalCost.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div></CardContent></Card></motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" /><Input placeholder="Buscar ordens de serviço..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" /></div>
        <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filtrar por status" /></SelectTrigger><SelectContent>{Object.entries(statusLabels).map(([k,v])=>(<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filtrar por prioridade" /></SelectTrigger><SelectContent>{Object.entries(priorityLabels).map(([k,v])=>(<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select>
      </motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">{filteredOrders.map((order, index) => (<motion.div key={order.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}><WorkOrderCard order={order} onEdit={openEditDialog} getEquipmentName={getEquipmentName} /></motion.div>))}</div>
      {filteredOrders.length === 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12"><FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium mb-2">Nenhuma ordem de serviço encontrada</h3><p className="text-muted-foreground">{searchTerm || filterStatus !== 'all' || filterPriority !== 'all' ? 'Tente ajustar os filtros.' : 'Crie sua primeira ordem.'}</p></motion.div>)}
    </div>
  );
};
export default WorkOrderManager;