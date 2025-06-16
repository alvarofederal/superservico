import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Settings, Calendar, MapPin, AlertTriangle, Loader2, Briefcase } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth.js';

const statusColors = {
  operational: 'bg-green-500',
  maintenance: 'bg-yellow-500',
  broken: 'bg-red-500',
  retired: 'bg-gray-500'
};

const statusLabels = {
  operational: 'Operacional',
  maintenance: 'Em Manutenção',
  broken: 'Quebrado',
  retired: 'Aposentado'
};

const EquipmentForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState(
    initialData || {
      name: '',
      type: '',
      model: '',
      serialNumber: '',
      location: '',
      status: 'operational',
      lastMaintenance: '',
      nextMaintenance: '',
      maintenanceInterval: 30,
      notes: ''
    }
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        lastMaintenance: initialData.lastmaintenance ? initialData.lastmaintenance.split('T')[0] : '',
        nextMaintenance: initialData.nextmaintenance ? initialData.nextmaintenance.split('T')[0] : '',
        serialNumber: initialData.serialnumber || '',
        maintenanceInterval: initialData.maintenanceinterval || 30,
      });
    } else {
      setFormData({
        name: '', type: '', model: '', serialNumber: '', location: '', status: 'operational',
        lastMaintenance: '', nextMaintenance: '', maintenanceInterval: 30, notes: ''
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.location) {
      toast({
        title: "Campos Obrigatórios",
        description: "Por favor, preencha o nome, tipo e localização do equipamento.",
        variant: "destructive"
      });
      return;
    }
    const dataToSubmit = { 
      ...formData,
      serialnumber: formData.serialNumber, 
      lastmaintenance: formData.lastMaintenance || null,
      nextmaintenance: formData.nextMaintenance || null,
      maintenanceinterval: formData.maintenanceInterval ? parseInt(formData.maintenanceInterval) : null,
    };
    delete dataToSubmit.serialNumber; 
    delete dataToSubmit.lastMaintenance;
    delete dataToSubmit.nextMaintenance;
    delete dataToSubmit.maintenanceInterval;

    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmitForm} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Equipamento *</Label>
          <Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Ex: Compressor de Ar" />
        </div>
        <div>
          <Label htmlFor="type">Tipo *</Label>
          <Input id="type" value={formData.type} onChange={(e) => handleChange('type', e.target.value)} placeholder="Ex: Compressor" />
        </div>
        <div>
          <Label htmlFor="model">Modelo</Label>
          <Input id="model" value={formData.model} onChange={(e) => handleChange('model', e.target.value)} placeholder="Ex: XYZ-2000" />
        </div>
        <div>
          <Label htmlFor="serialNumberForm">Número de Série</Label>
          <Input id="serialNumberForm" value={formData.serialNumber} onChange={(e) => handleChange('serialNumber', e.target.value)} placeholder="Ex: SN123456789" />
        </div>
        <div>
          <Label htmlFor="location">Localização *</Label>
          <Input id="location" value={formData.location} onChange={(e) => handleChange('location', e.target.value)} placeholder="Ex: Setor A - Linha 1" />
        </div>
        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={formData.status} onValueChange={(value) => handleChange('status', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="operational">Operacional</SelectItem>
              <SelectItem value="maintenance">Em Manutenção</SelectItem>
              <SelectItem value="broken">Quebrado</SelectItem>
              <SelectItem value="retired">Aposentado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="lastMaintenanceForm">Última Manutenção</Label>
          <Input id="lastMaintenanceForm" type="date" value={formData.lastMaintenance} onChange={(e) => handleChange('lastMaintenance', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="nextMaintenanceForm">Próxima Manutenção</Label>
          <Input id="nextMaintenanceForm" type="date" value={formData.nextMaintenance} onChange={(e) => handleChange('nextMaintenance', e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="maintenanceIntervalForm">Intervalo de Manutenção (dias)</Label>
          <Input id="maintenanceIntervalForm" type="number" value={formData.maintenanceInterval} onChange={(e) => handleChange('maintenanceInterval', parseInt(e.target.value))} placeholder="30"/>
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="notes">Observações</Label>
          <Input id="notes" value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} placeholder="Observações adicionais..." />
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Atualizar' : 'Cadastrar'}
        </Button>
      </div>
    </form>
  );
};

const EquipmentCard = ({ equipment, onEdit }) => {
  const getMaintenanceStatus = (nextMaintenance) => {
    if (!nextMaintenance) return null;
    const today = new Date();
    const maintenanceDate = new Date(nextMaintenance);
    const diffTime = maintenanceDate.setHours(0,0,0,0) - today.setHours(0,0,0,0);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'overdue', label: `Atrasada (${Math.abs(diffDays)}d)`, color: 'text-red-400' };
    if (diffDays <= 7) return { status: 'upcoming', label: `Próxima (${diffDays}d)`, color: 'text-yellow-400' };
    return { status: 'scheduled', label: `Agendada (${diffDays}d)`, color: 'text-green-400' };
  };
  const maintenanceStatus = getMaintenanceStatus(equipment.nextmaintenance);

  return (
    <Card className="glass-effect card-hover h-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{equipment.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{equipment.type}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${statusColors[equipment.status] || 'bg-gray-300'}`} />
            <Button variant="ghost" size="icon" onClick={() => onEdit(equipment)} className="h-8 w-8"><Settings className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span>{equipment.location}</span></div>
        {equipment.model && <div className="text-sm"><span className="text-muted-foreground">Modelo: </span><span>{equipment.model}</span></div>}
        {equipment.serialnumber && <div className="text-sm"><span className="text-muted-foreground">S/N: </span><span>{equipment.serialnumber}</span></div>}
        <div className="flex items-center justify-between">
          <Badge variant="outline" className={`${statusColors[equipment.status] || 'bg-gray-300'} text-white border-0`}>{statusLabels[equipment.status] || 'Desconhecido'}</Badge>
        </div>
        {equipment.nextmaintenance && maintenanceStatus && (
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Próxima:</span>
            <span className={maintenanceStatus.color}>{new Date(equipment.nextmaintenance + 'T00:00:00').toLocaleDateString()}</span>
            {maintenanceStatus.status === 'overdue' && <AlertTriangle className="h-4 w-4 text-red-400" />}
            {maintenanceStatus.status === 'upcoming' && <span className={`text-xs ${maintenanceStatus.color}`}>{maintenanceStatus.label.replace('Próxima ', '')}</span>}
          </div>
        )}
        {equipment.notes && <div className="text-sm text-muted-foreground"><span className="font-medium">Obs: </span>{equipment.notes}</div>}
      </CardContent>
    </Card>
  );
};

const EquipmentManager = ({ equipments: initialEquipments, setEquipments: setGlobalEquipments }) => {
  const { userProfile } = useAuth();
  const [equipments, setEquipmentsState] = useState(initialEquipments);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setEquipmentsState(initialEquipments);
  }, [initialEquipments]);

  const filteredEquipments = equipments.filter(equipment => {
    const name = equipment.name || "";
    const type = equipment.type || "";
    const location = equipment.location || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || equipment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleFormSubmit = async (formData) => {
    if (!userProfile || !userProfile.current_company_id) {
      toast({ title: "Erro", description: "Nenhuma empresa selecionada. Selecione uma empresa para gerenciar equipamentos.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const equipmentData = { 
      ...formData, 
      company_id: userProfile.current_company_id, 
      user_id: userProfile.id
    };
    
    try {
      if (editingEquipment) {
        const { data, error } = await supabase
          .from('equipments')
          .update({ ...equipmentData, updatedat: new Date().toISOString() })
          .eq('id', editingEquipment.id)
          .eq('company_id', userProfile.current_company_id)
          .select()
          .single();
        if (error) throw error;
        if (typeof setGlobalEquipments === 'function') setGlobalEquipments();
        toast({ title: "Sucesso!", description: "Equipamento atualizado." });
      } else {
        const { data, error } = await supabase
          .from('equipments')
          .insert([{ 
            ...equipmentData, 
            id: crypto.randomUUID(),
            createdat: new Date().toISOString(), 
            updatedat: new Date().toISOString() 
          }])
          .select()
          .single();
        if (error) throw error;
        if (typeof setGlobalEquipments === 'function') setGlobalEquipments();
        toast({ title: "Sucesso!", description: "Equipamento cadastrado." });
      }
      setIsDialogOpen(false);
      setEditingEquipment(null);
    } catch (error) {
      console.error('Erro ao salvar equipamento:', error);
      let description = "Ocorreu um erro ao salvar o equipamento. Tente novamente.";
      if (error.message && error.message.includes("violates row-level security policy")) {
        description = "Você não tem permissão para realizar esta ação na empresa atual ou os dados estão incorretos.";
      } else if (error.message) {
        description = error.message;
      }
      toast({ title: "Erro ao Salvar", description: description, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openAddDialog = () => {
    if (!userProfile?.current_company_id) {
      toast({ title: "Selecione uma Empresa", description: "Você precisa selecionar ou criar uma empresa antes de adicionar equipamentos.", variant: "default", duration: 5000});
      return;
    }
    setEditingEquipment(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (equipment) => {
    setEditingEquipment(equipment);
    setIsDialogOpen(true);
  };
  
  if (!userProfile?.current_company_id && userProfile?.role !== 'client') {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-card shadow-xl h-[calc(100vh-200px)]">
        <Briefcase className="w-16 h-16 text-primary mb-6" />
        <h2 className="text-2xl font-semibold text-foreground mb-3">Nenhuma Empresa Selecionada</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Por favor, selecione uma empresa no menu lateral ou crie uma nova na seção 'Minha Empresa' para gerenciar equipamentos.
        </p>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold gradient-text">Gestão de Equipamentos</h1>
          <p className="text-muted-foreground">Gerencie todos os equipamentos da empresa selecionada.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsDialogOpen(isOpen); }}>
          <DialogTrigger asChild>
            <Button 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700" 
              onClick={openAddDialog}
              disabled={!userProfile?.current_company_id}
            >
              <Plus className="h-4 w-4 mr-2" /> Novo Equipamento
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editingEquipment ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle></DialogHeader>
            <EquipmentForm initialData={editingEquipment} onSubmit={handleFormSubmit} onCancel={() => setIsDialogOpen(false)} isSubmitting={isSubmitting} />
          </DialogContent>
        </Dialog>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Buscar equipamentos..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="operational">Operacional</SelectItem>
            <SelectItem value="maintenance">Em Manutenção</SelectItem>
            <SelectItem value="broken">Quebrado</SelectItem>
            <SelectItem value="retired">Aposentado</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipments.map((equipment, index) => (
          <motion.div key={equipment.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
            <EquipmentCard equipment={equipment} onEdit={openEditDialog} />
          </motion.div>
        ))}
      </div>
      {filteredEquipments.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum equipamento encontrado</h3>
          <p className="text-muted-foreground">{searchTerm || filterStatus !== 'all' ? 'Tente ajustar os filtros.' : 'Cadastre seu primeiro equipamento para a empresa atual.'}</p>
        </motion.div>
      )}
    </div>
  );
};

export default EquipmentManager;