
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth.js';
import { logAction } from '@/services/logService.js';
import WorkOrderDetailsModal from '@/components/work-orders/WorkOrderDetailsModal';
import WorkOrderForm from '@/components/work-orders/WorkOrderForm';
import WorkOrderList from '@/components/work-orders/WorkOrderList';
import WorkOrderHeader from '@/components/work-orders/WorkOrderHeader';
import { useWorkOrderMutations } from '@/components/work-orders/useWorkOrderMutations';
import { ArrowLeft, Loader2 } from 'lucide-react';

const WorkOrderManager = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, currentCompanyId, hasAccess } = useAuth();

  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [editingOrder, setEditingOrder] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [detailsOrder, setDetailsOrder] = useState(null);

  const { data: equipments = [], isLoading: isLoadingEquipments } = useQuery(
    ['equipments', currentCompanyId],
    async () => {
      if (!currentCompanyId) return [];
      const { data, error } = await supabase.from('equipments').select('id, name, location').eq('company_id', currentCompanyId);
      if (error) {
        toast({ title: 'Erro ao carregar equipamentos', description: error.message, variant: 'destructive' });
        return [];
      }
      return data;
    },
    {
      enabled: !!currentCompanyId,
    }
  );

  const { data: workOrders = [], isLoading: isLoadingWorkOrders, isError, error: workOrdersError } = useQuery(
    ['workOrders', currentCompanyId, showArchived],
    async () => {
      if (!currentCompanyId) return [];
      const { data, error } = await supabase.from('work_orders').select('*').eq('company_id', currentCompanyId).eq('is_archived', showArchived).order('createdat', { ascending: false });
      if (error) throw error;
      return data;
    },
    { enabled: !!currentCompanyId }
  );

  const { saveMutation, archiveMutation } = useWorkOrderMutations({
    editingOrder,
    setEditingOrder,
    setView,
  });

  const handleOpenFormFromConversion = useCallback(async (requestId) => {
    await logAction({ tag: 'WORK_ORDER_CONVERSION_START', message: `Iniciando conversão da Solicitação ID: ${requestId}`, meta: { requestId }, userId: userProfile?.id, companyId: currentCompanyId });
    
    const { data: request, error } = await supabase.from('service_requests').select('*').eq('id', requestId).single();
    if (error || !request) {
        toast({ title: 'Erro', description: 'Não foi possível encontrar a solicitação para conversão.', variant: 'destructive' });
        logAction({ level: 'ERROR', tag: 'WORK_ORDER_CONVERSION_FETCH_ERROR', message: `Falha ao buscar Solicitação ID: ${requestId} para conversão.`, error, userId: userProfile?.id, companyId: currentCompanyId });
        navigate('/app/work-orders', { replace: true });
    } else {
        const newOrderFromRequest = {
            title: `OS da Solicitação: ${request.title}`, description: request.description, equipmentid: request.equipment_id,
            priority: request.urgency, maintenance_type: request.maintenance_type || 'corrective', status: 'pending',
            service_request_id: request.id, scheduleddate: request.scheduled_maintenance_date || '',
            notes: `Originado da solicitação de ${request.requester_name}. Contato: ${request.requester_contact || 'N/A'}.`,
        };
        setEditingOrder(newOrderFromRequest);
        setView('form');
        logAction({ tag: 'WORK_ORDER_CONVERSION_FORM_OPENED', message: `Formulário de O.S. aberto para conversão da Solicitação: "${request.title}"`, meta: { requestId: request.id, newOrderTitle: newOrderFromRequest.title }, userId: userProfile?.id, companyId: currentCompanyId });
        navigate('/app/work-orders', { replace: true });
    }
  }, [navigate, userProfile?.id, currentCompanyId]);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const fromRequestId = searchParams.get('from_request_id');
    const action = searchParams.get('action');

    if (action === 'new' && fromRequestId) {
        handleOpenFormFromConversion(fromRequestId);
    } else if (action === 'new' && !fromRequestId) {
        setEditingOrder(null);
        setView('form');
        navigate('/app/work-orders', { replace: true });
    }
  }, [location.search, handleOpenFormFromConversion, navigate]);

  const filteredOrders = useMemo(() => workOrders.filter(order => {
    const matchesSearch = searchTerm === '' ||
                         (order.title || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (order.description || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (order.assignedto || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || order.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || order.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  }), [workOrders, searchTerm, filterStatus, filterPriority]);

  const openEditForm = (order) => { setEditingOrder(order); setView('form'); };
  const getEquipmentName = (equipmentId) => equipments.find(eq => eq.id === equipmentId)?.name || 'N/A';
  
  if (isLoadingWorkOrders || isLoadingEquipments) return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  if (isError) return <div className="text-center text-destructive">Erro ao carregar Ordens de Serviço: {workOrdersError.message}</div>;

  if (view === 'form') {
    return (
       <motion.div key="form-view" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => { setView('list'); setEditingOrder(null); }}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{editingOrder?.id ? 'Editar Ordem de Serviço' : 'Nova Ordem de Serviço'}</h1>
            <p className="text-muted-foreground">Preencha os detalhes da ordem de serviço.</p>
          </div>
        </div>
        <Card><CardContent className="p-6"><WorkOrderForm initialData={editingOrder} onSubmit={(data) => saveMutation.mutate(data)} onCancel={() => { setView('list'); setEditingOrder(null); }} equipments={equipments} isSubmitting={saveMutation.isLoading} /></CardContent></Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <WorkOrderHeader
        showArchived={showArchived}
        workOrders={workOrders}
        onToggleArchived={() => setShowArchived(!showArchived)}
        onSearch={setSearchTerm}
        onFilterStatus={setFilterStatus}
        onFilterPriority={setFilterPriority}
        searchTerm={searchTerm}
        filterStatus={filterStatus}
        filterPriority={filterPriority}
      />
      
      <WorkOrderList
        workOrders={filteredOrders}
        onEdit={openEditForm}
        onDetails={setDetailsOrder}
        onArchive={(id, archive) => archiveMutation.mutate({ id, archive })}
        getEquipmentName={getEquipmentName}
        canEdit={hasAccess('work_orders_management')}
        canArchive={hasAccess('work_orders_management')}
      />

      <WorkOrderDetailsModal 
        isOpen={!!detailsOrder} 
        onClose={() => setDetailsOrder(null)} 
        order={detailsOrder} 
        equipments={equipments}
      />
    </div>
  );
};
export default WorkOrderManager;
