import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Search, FileText, Edit, Loader2, Trash2, Send, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const urgencyLevels = { low: 'Baixa', medium: 'Média', high: 'Alta' };
const urgencyColors = { low: 'bg-green-500 dark:bg-green-600', medium: 'bg-yellow-500 dark:bg-yellow-600', high: 'bg-red-500 dark:bg-red-600' };
const statusLevels = { aberta: 'Aberta', 'em analise': 'Em Análise', convertida: 'Convertida', fechada: 'Fechada' };
const statusColors = { aberta: 'bg-blue-500 dark:bg-blue-600', 'em analise': 'bg-purple-500 dark:bg-purple-600', convertida: 'bg-teal-500 dark:bg-teal-600', fechada: 'bg-gray-500 dark:bg-gray-600' };


const ServiceRequestForm = ({ initialData, onSubmit, onCancel, equipments, isSubmitting }) => {
  const [formData, setFormData] = useState(
    initialData || {
      title: '', description: '', requester_name: '', requester_contact: '',
      equipment_id: null, urgency: 'medium', status: 'aberta'
    }
  );

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
       setFormData({
        title: '', description: '', requester_name: '', requester_contact: '',
        equipment_id: null, urgency: 'medium', status: 'aberta'
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
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <DialogFooter className="pt-4">
        <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button></DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Atualizar Solicitação' : 'Criar Solicitação'}
        </Button>
      </DialogFooter>
    </form>
  );
};

const ServiceRequestCard = ({ request, onEdit, onDelete, onConvertToWorkOrder, getEquipmentName }) => {
  return (
    <Card className="glass-effect card-hover h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-2">
            <CardTitle className="text-lg text-foreground truncate" title={request.title}>{request.title}</CardTitle>
            <p className="text-sm text-muted-foreground">Solicitante: {request.requester_name}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => onEdit(request)} className="h-8 w-8 text-muted-foreground hover:text-primary"><Edit className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-2 flex-wrap mt-1">
          <Badge variant="outline" className={`${statusColors[request.status]} text-primary-foreground border-0`}>{statusLevels[request.status]}</Badge>
          <Badge variant="outline" className={`${urgencyColors[request.urgency]} text-primary-foreground border-0`}>{urgencyLevels[request.urgency]}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
        {request.description && (<p className="text-sm text-foreground line-clamp-3" title={request.description}>{request.description}</p>)}
        {request.equipment_id && (<p className="text-sm"><span className="text-muted-foreground">Equipamento: </span><span className="text-foreground">{getEquipmentName(request.equipment_id)}</span></p>)}
        {request.requester_contact && (<p className="text-sm"><span className="text-muted-foreground">Contato: </span><span className="text-foreground">{request.requester_contact}</span></p>)}
        <p className="text-xs text-muted-foreground pt-1">Criado em: {new Date(request.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
      </CardContent>
      <div className="p-4 border-t border-border/50 mt-auto space-y-2">
        {request.status === 'aberta' || request.status === 'em analise' ? (
          <Button size="sm" className="w-full bg-green-600 hover:bg-green-700 text-white" onClick={() => onConvertToWorkOrder(request)}>
            <Send className="h-4 w-4 mr-2" /> Converter para O.S.
          </Button>
        ) : (
           <Button size="sm" className="w-full" disabled>
             <Send className="h-4 w-4 mr-2" /> Convertida/Fechada
           </Button>
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" /> Excluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a solicitação "{request.title}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(request.id)}>Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};

const ServiceRequestManager = ({ serviceRequests: initialServiceRequests, setServiceRequests: setGlobalServiceRequests, equipments, onConvertToWorkOrder, userProfile }) => {
  const [serviceRequests, setServiceRequests] = useState(initialServiceRequests || []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterUrgency, setFilterUrgency] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRequest, setEditingRequest] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setServiceRequests(initialServiceRequests || []);
  }, [initialServiceRequests]);

  const getEquipmentName = (equipmentId) => {
    if (!equipments) return 'N/A';
    const equipment = equipments.find(eq => eq.id === equipmentId);
    return equipment?.name || 'N/A';
  };

  const filteredRequests = serviceRequests.filter(req => {
    const title = req.title || "";
    const description = req.description || "";
    const requester = req.requester_name || "";
    const equipmentName = req.equipment_id ? getEquipmentName(req.equipment_id).toLowerCase() : "";

    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (req.equipment_id && equipmentName.includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesUrgency = filterUrgency === 'all' || req.urgency === filterUrgency;
    return matchesSearch && matchesStatus && matchesUrgency;
  });

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      const { equipments, ...cleanFormData } = formData;

      if (editingRequest) {
        const { error } = await supabase.from('service_requests').update({ ...cleanFormData, updated_at: new Date().toISOString() }).eq('id', editingRequest.id);
        if (error) throw error;
        setGlobalServiceRequests();
        toast({ title: "Sucesso!", description: "Solicitação de serviço atualizada." });
      } else {
        if (!userProfile) throw new Error("Perfil do usuário não encontrado.");
        
        const newRequestData = {
          ...cleanFormData,
          user_id: userProfile.id,
          company_id: userProfile.current_company_id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        const { error } = await supabase.from('service_requests').insert([newRequestData]);
        if (error) throw error;
        setGlobalServiceRequests();
        toast({ title: "Sucesso!", description: "Nova solicitação de serviço criada." });
      }
      setIsDialogOpen(false);
      setEditingRequest(null);
    } catch (error) {
      console.error('Error submitting service request:', error);
      toast({ title: "Erro ao Salvar", description: `Falha ao salvar solicitação: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteRequest = async (requestId) => {
    try {
      const { error } = await supabase.from('service_requests').delete().eq('id', requestId);
      if (error) throw error;
      setGlobalServiceRequests();
      toast({ title: "Sucesso!", description: "Solicitação excluída." });
    } catch (error) {
      console.error('Error deleting service request:', error);
      toast({ title: "Erro ao Excluir", description: `Falha ao excluir solicitação: ${error.message}`, variant: "destructive" });
    }
  };

  const openAddDialog = () => { setEditingRequest(null); setIsDialogOpen(true); };
  const openEditDialog = (request) => { setEditingRequest(request); setIsDialogOpen(true); };

  const openRequestsCount = serviceRequests.filter(r => r.status === 'aberta').length;
  const highUrgencyCount = serviceRequests.filter(r => r.urgency === 'high' && r.status !== 'convertida' && r.status !== 'fechada').length;

  return (
    <div className="space-y-6 md:space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
        <div><h1 className="text-3xl md:text-4xl font-bold text-foreground">Solicitações de Serviço</h1><p className="text-muted-foreground text-base md:text-lg">Gerencie os pedidos de manutenção e suporte.</p></div>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsDialogOpen(isOpen); }}>
          <DialogTrigger asChild><Button onClick={openAddDialog} className="bg-primary hover:bg-primary/90 text-primary-foreground"><Plus className="h-4 w-4 mr-2" /> Nova Solicitação</Button></DialogTrigger>
          <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle className="text-foreground">{editingRequest ? 'Editar Solicitação' : 'Criar Nova Solicitação'}</DialogTitle></DialogHeader><ServiceRequestForm initialData={editingRequest} onSubmit={handleFormSubmit} onCancel={() => setIsDialogOpen(false)} equipments={equipments} isSubmitting={isSubmitting} /></DialogContent>
        </Dialog>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}><Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total de Solicitações</CardTitle><FileText className="h-5 w-5 text-primary" /></CardHeader><CardContent><div className="text-3xl font-bold text-primary">{serviceRequests.length}</div><p className="text-xs text-muted-foreground pt-1">Registros no sistema</p></CardContent></Card></motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}><Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Abertas / Não Atendidas</CardTitle><Loader2 className="h-5 w-5 text-blue-500 dark:text-blue-400 animate-spin" /></CardHeader><CardContent><div className="text-3xl font-bold text-blue-500 dark:text-blue-400">{openRequestsCount}</div><p className="text-xs text-muted-foreground pt-1">Aguardando análise ou conversão</p></CardContent></Card></motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}><Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Urgência Alta</CardTitle><AlertTriangle className="h-5 w-5 text-red-500 dark:text-red-400" /></CardHeader><CardContent><div className="text-3xl font-bold text-red-500 dark:text-red-400">{highUrgencyCount}</div><p className="text-xs text-muted-foreground pt-1">Requerem atenção prioritária</p></CardContent></Card></motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" /><Input placeholder="Buscar por título, solicitante, equipamento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-background" /></div>
        <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="w-full sm:w-48 bg-background"><SelectValue placeholder="Filtrar por status" /></SelectTrigger><SelectContent>{[{value: 'all', label: 'Todos Status'}, ...Object.entries(statusLevels).map(([k,v]) => ({value: k, label: v}))].map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent></Select>
        <Select value={filterUrgency} onValueChange={setFilterUrgency}><SelectTrigger className="w-full sm:w-48 bg-background"><SelectValue placeholder="Filtrar por urgência" /></SelectTrigger><SelectContent>{[{value: 'all', label: 'Todas Urgências'}, ...Object.entries(urgencyLevels).map(([k,v]) => ({value: k, label: v}))].map(u => (<SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>))}</SelectContent></Select>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 md:gap-6">{filteredRequests.map((request, index) => (<motion.div key={request.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.03, duration: 0.3 }}><ServiceRequestCard request={request} onEdit={openEditDialog} onDelete={handleDeleteRequest} onConvertToWorkOrder={onConvertToWorkOrder} getEquipmentName={getEquipmentName} /></motion.div>))}</div>
      {filteredRequests.length === 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12"><FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma Solicitação Encontrada</h3><p className="text-muted-foreground">{searchTerm || filterStatus !== 'all' || filterUrgency !== 'all' ? 'Tente refinar sua busca ou alterar os filtros.' : 'Crie a primeira solicitação de serviço.'}</p></motion.div>)}
    </div>
  );
};

export default ServiceRequestManager;