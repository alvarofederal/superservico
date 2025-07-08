
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, CalendarDays, Loader2, Briefcase, Wrench as MaintenanceIcon, ArrowLeft, Lock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useLicense } from '@/hooks/useLicense';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import MaintenanceForm from '@/components/maintenance/MaintenanceForm';
import MaintenanceDetailsModal from '@/components/maintenance/MaintenanceDetailsModal';
import MaintenanceTimelineView from '@/components/maintenance/MaintenanceTimelineView';
import MaintenanceTable from '@/components/maintenance/MaintenanceTable';
import { maintenanceStatusLabels, maintenanceTypeLabels } from '@/components/maintenance/maintenanceUtils';
import { Card, CardContent } from '@/components/ui/card';
import { logAction } from '@/services/logService';

const saveMaintenance = async ({ formData, editingMaintenance, currentCompanyId, userProfile }) => {
  const logTag = 'MAINTENANCE_UPDATE';
  await logAction({ tag: `${logTag}_ATTEMPT`, message: `Tentativa de atualizar Manutenção: "${formData.title}"`, meta: { formData }, userId: userProfile?.id, companyId: currentCompanyId });

  const dataToSave = {
    ...formData,
    company_id: currentCompanyId,
    user_id: userProfile.id,
    scheduled_date: new Date(formData.scheduled_date).toISOString(),
    last_maintenance_date: formData.last_maintenance_date || null,
    completion_date: formData.status === 'completed' && !formData.completion_date ? new Date().toISOString() : formData.completion_date || null,
    equipment_id: formData.equipment_id || null,
  };

  delete dataToSave.equipments;
  delete dataToSave.profiles;
  delete dataToSave.equipment;
  delete dataToSave.responsible;

  let savedMaintenance;
  if (editingMaintenance?.id) {
    const { data, error } = await supabase.from('maintenances').update({ ...dataToSave, updated_at: new Date().toISOString() }).eq('id', editingMaintenance.id).select('*, equipment:equipments(name, location), responsible:profiles!maintenances_assigned_to_user_id_fkey(full_name)').single();
    if (error) {
      await logAction({ level: 'ERROR', tag: `${logTag}_ERROR`, message: `Falha ao atualizar Manutenção: "${formData.title}"`, error, meta: { maintenanceId: editingMaintenance.id }, userId: userProfile?.id, companyId: currentCompanyId });
      throw error;
    }
    savedMaintenance = data;
    await logAction({ tag: `${logTag}_SUCCESS`, message: `Manutenção "${savedMaintenance.title}" atualizada com sucesso.`, meta: { maintenanceId: savedMaintenance.id }, userId: userProfile?.id, companyId: currentCompanyId });
  } else {
    const err = new Error("A criação de manutenções só pode ser feita através de uma Ordem de Serviço.");
    await logAction({ level: 'ERROR', tag: 'MAINTENANCE_CREATE_MANUAL_ERROR', message: err.message, userId: userProfile?.id, companyId: currentCompanyId });
    throw err;
  }
  return savedMaintenance;
};

const MaintenanceManager = () => {
  const { userProfile, currentCompanyId } = useAuth();
  const { limits } = useLicense();
  const queryClient = useQueryClient();

  const [view, setView] = useState('list');
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'scheduled_date', direction: 'ascending' });
  
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedMaintenanceForDetails, setSelectedMaintenanceForDetails] = useState(null);
  const [selectedMaintenanceForTimeline, setSelectedMaintenanceForTimeline] = useState(null);

  const fetchCompanyData = async (companyId) => {
    if (!companyId) return { maintenances: [], equipments: [], users: [] };
    
    const [maintenancesRes, equipmentsRes, companyUsersRes] = await Promise.all([
        supabase.from('maintenances').select('*, equipment:equipments(name, location), responsible:profiles!maintenances_assigned_to_user_id_fkey(full_name)').eq('company_id', companyId).order('scheduled_date', { ascending: true }),
        supabase.from('equipments').select('id, name, location').eq('company_id', companyId),
        supabase.from('company_users').select('user_id, profiles(id, full_name, role)').eq('company_id', companyId)
    ]);

    if (maintenancesRes.error) throw new Error(`Manutenções: ${maintenancesRes.error.message}`);
    if (equipmentsRes.error) throw new Error(`Equipamentos: ${equipmentsRes.error.message}`);
    if (companyUsersRes.error) throw new Error(`Usuários da Empresa: ${companyUsersRes.error.message}`);
    
    const users = companyUsersRes.data.map(cu => cu.profiles).filter(Boolean);

    return { 
      maintenances: maintenancesRes.data || [], 
      equipments: equipmentsRes.data || [], 
      users: users || [] 
    };
  };

  const { data: companyData, isLoading, isError, error } = useQuery({
    queryKey: ['maintenanceData', currentCompanyId],
    queryFn: () => fetchCompanyData(currentCompanyId),
    enabled: !!currentCompanyId,
  });

  const { maintenances = [], equipments = [], users = [] } = companyData || {};
  const maintenancesLimit = limits.maintenances;
  const isAtLimit = maintenancesLimit !== Infinity && maintenances.length >= maintenancesLimit;

  const saveMutation = useMutation(
    (formData) => saveMaintenance({ formData, editingMaintenance, currentCompanyId, userProfile }),
    {
      onSuccess: async (savedMaintenance) => {
        toast({ title: "Sucesso!", description: `Manutenção atualizada.` });
        
        queryClient.invalidateQueries(['maintenanceData', currentCompanyId]);
        if (savedMaintenance.equipment_id) {
          queryClient.invalidateQueries(['equipmentHistory', savedMaintenance.equipment_id]);
        }
        setView('list');
        setEditingMaintenance(null);
      },
      onError: (err) => {
        toast({ title: "Erro ao Salvar", description: err.message, variant: "destructive" });
      }
    }
  );

  const statusUpdateMutation = useMutation(
    async ({ maintenanceId, newStatus }) => {
      const logTag = 'MAINTENANCE_STATUS_UPDATE';
      await logAction({ tag: `${logTag}_ATTEMPT`, message: `Tentativa de atualizar status da Manutenção ID: ${maintenanceId} para ${newStatus}`, meta: { maintenanceId, newStatus }, userId: userProfile?.id, companyId: currentCompanyId });

      const updateData = { status: newStatus, updated_at: new Date().toISOString() };
      if (newStatus === 'completed') {
        updateData.completion_date = new Date().toISOString();
      }
      const { data: updatedMaintenance, error } = await supabase.from('maintenances').update(updateData).eq('id', maintenanceId).select('*, equipment:equipments(name, location), responsible:profiles!maintenances_assigned_to_user_id_fkey(full_name)').single();
      if (error) {
        await logAction({ level: 'ERROR', tag: `${logTag}_ERROR`, message: `Falha ao atualizar status da Manutenção ID: ${maintenanceId}`, error, meta: { maintenanceId }, userId: userProfile?.id, companyId: currentCompanyId });
        throw error;
      }
      await logAction({ tag: `${logTag}_SUCCESS`, message: `Status da Manutenção "${updatedMaintenance.title}" atualizado para ${newStatus}.`, meta: { maintenanceId: updatedMaintenance.id }, userId: userProfile?.id, companyId: currentCompanyId });
      return updatedMaintenance;
    },
    {
      onSuccess: (updatedMaintenance) => {
        toast({ title: "Status Atualizado!", description: `Manutenção marcada como ${maintenanceStatusLabels[updatedMaintenance.status]}.` });
        queryClient.invalidateQueries(['maintenanceData', currentCompanyId]);
        if(updatedMaintenance.equipment_id) {
            queryClient.invalidateQueries(['equipmentHistory', updatedMaintenance.equipment_id]);
        }
      },
      onError: (err) => {
        toast({ title: "Erro ao Atualizar Status", description: err.message, variant: "destructive" });
      }
    }
  );

  const getEquipmentName = (maintenance) => maintenance.equipment?.name || 'N/A';
  const getAssignedUserName = (maintenance) => maintenance.responsible?.full_name || 'N/A';

  const openEditForm = (maintenance) => { setEditingMaintenance(maintenance); setView('form'); };
  const openDetailsModal = (maintenance) => { setSelectedMaintenanceForDetails(maintenance); setIsDetailsModalOpen(true); };
  const openTimelineView = (maintenance) => { setSelectedMaintenanceForTimeline(maintenance); setView('timeline'); };

  const sortedAndFilteredMaintenances = useMemo(() => {
    let items = [...maintenances];
    
    items = items.filter(m => {
      const title = m.title || "";
      const description = m.description || "";
      const equipmentName = m.equipment?.name.toLowerCase() || "";
      const assignedName = m.responsible?.full_name.toLowerCase() || "";

      const matchesSearch = searchTerm === '' || title.toLowerCase().includes(searchTerm.toLowerCase()) || description.toLowerCase().includes(searchTerm.toLowerCase()) || equipmentName.includes(searchTerm.toLowerCase()) || assignedName.includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || m.status === filterStatus;
      const matchesType = filterType === 'all' || m.type === filterType;
      
      let matchesDate = true;
      if (filterDateRange.start && filterDateRange.end) {
        try {
          const scheduled = new Date(m.scheduled_date);
          const start = new Date(filterDateRange.start);
          const end = new Date(filterDateRange.end);
          end.setHours(23, 59, 59, 999);
          matchesDate = scheduled >= start && scheduled <= end;
        } catch(e) {
          matchesDate = false;
        }
      }
      return matchesSearch && matchesStatus && matchesType && matchesDate;
    });

    items.sort((a, b) => {
      if (sortConfig.key) {
        let valA = a[sortConfig.key];
        let valB = b[sortConfig.key];
        
        if (sortConfig.key === 'equipment_name') {
          valA = a.equipment?.name || '';
          valB = b.equipment?.name || '';
        }

        if (valA < valB) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'ascending' ? 1 : -1;
      }
      return 0;
    });
    return items;
  }, [maintenances, searchTerm, filterStatus, filterType, filterDateRange, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') direction = 'descending';
    setSortConfig({ key, direction });
  };
  
  if (!currentCompanyId) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-card shadow-xl h-[calc(100vh-200px)]">
        <Briefcase className="w-16 h-16 text-primary mb-6" />
        <h2 className="text-2xl font-semibold text-foreground mb-3">Nenhuma Empresa Selecionada</h2>
        <p className="text-muted-foreground mb-6 max-w-md">Selecione uma empresa para gerenciar manutenções.</p>
      </div>
    );
  }

  if (isError) return <div className="text-center text-destructive">Erro ao carregar dados: {error.message}</div>;

  if (view === 'timeline') {
    return (
      <MaintenanceTimelineView 
        maintenance={selectedMaintenanceForTimeline}
        getEquipmentName={getEquipmentName}
        getAssignedUserName={getAssignedUserName}
        onBack={() => setView('list')}
      />
    )
  }

  if (view === 'form') {
    return (
        <motion.div key="form-view" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" onClick={() => setView('list')}><ArrowLeft className="h-4 w-4" /></Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Editar Manutenção</h1>
                    <p className="text-muted-foreground">Preencha os detalhes e salve as alterações.</p>
                </div>
            </div>
            <Card><CardContent className="p-6">
                <MaintenanceForm 
                    initialData={editingMaintenance} 
                    onSubmit={(data) => saveMutation.mutate(data)} 
                    onCancel={() => setView('list')} 
                    equipments={equipments} 
                    users={users} 
                    isSubmitting={saveMutation.isLoading} 
                />
            </CardContent></Card>
        </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4">
        <div className="flex items-center gap-4">
          <MaintenanceIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Manutenções Agendadas</h1>
            <p className="text-muted-foreground">Visualize e gerencie todas as manutenções planejadas.</p>
            <p className="text-sm text-amber-500 mt-1 font-medium">{maintenances.length}/{maintenancesLimit === Infinity ? '∞' : maintenancesLimit} manutenções cadastradas.{isAtLimit && " Limite do plano atingido."}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="relative flex-1 md:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Buscar por título, equipamento, técnico..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-background" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger className="bg-background"><SelectValue placeholder="Filtrar por status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos Status</SelectItem>{Object.entries(maintenanceStatusLabels).map(([k,v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select>
        <Select value={filterType} onValueChange={setFilterType}><SelectTrigger className="bg-background"><SelectValue placeholder="Filtrar por tipo" /></SelectTrigger><SelectContent><SelectItem value="all">Todos Tipos</SelectItem>{Object.entries(maintenanceTypeLabels).map(([k,v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select>
        <div className="flex gap-2 items-center lg:col-span-1">
            <Input type="date" value={filterDateRange.start} onChange={e => setFilterDateRange(prev => ({...prev, start: e.target.value}))} className="bg-background" title="Data Início"/>
            <span className="text-muted-foreground">-</span>
            <Input type="date" value={filterDateRange.end} onChange={e => setFilterDateRange(prev => ({...prev, end: e.target.value}))} className="bg-background" title="Data Fim"/>
        </div>
      </motion.div>

      {isLoading ? (<div className="flex justify-center items-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>) : 
      sortedAndFilteredMaintenances.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <CalendarDays className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma Manutenção Encontrada</h3>
          <p className="text-muted-foreground">As manutenções aparecerão aqui quando uma Ordem de Serviço for criada.</p>
        </motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <MaintenanceTable maintenances={sortedAndFilteredMaintenances} onEdit={openEditForm} onDetails={openDetailsModal} onTimeline={openTimelineView} onUpdateStatus={(id, status) => statusUpdateMutation.mutate({ maintenanceId: id, newStatus: status })} isSubmitting={statusUpdateMutation.isLoading} getEquipmentName={getEquipmentName} getAssignedUserName={getAssignedUserName} sortConfig={sortConfig} requestSort={requestSort}/>
        </motion.div>
      )}
      {selectedMaintenanceForDetails && <MaintenanceDetailsModal isOpen={isDetailsModalOpen} setIsOpen={setIsDetailsModalOpen} maintenance={selectedMaintenanceForDetails} getEquipmentName={getEquipmentName} getAssignedUserName={getAssignedUserName} />}
    </div>
  );
};

export default MaintenanceManager;
