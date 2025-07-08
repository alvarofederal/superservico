
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, FileText, Loader2, Lock, Archive, FolderArchive as Unarchive } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth.js';
import { useLicense } from '@/hooks/useLicense.js';
import ServiceRequestForm from '@/components/service-requests/ServiceRequestForm';
import ServiceRequestCard from '@/components/service-requests/ServiceRequestCard';
import ServiceRequestDetailsModal from '@/components/service-requests/ServiceRequestDetailsModal';
import { logAction } from '@/services/logService.js';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ServiceRequestManager = () => {
  const { userProfile, currentCompanyId, hasAccess } = useAuth();
  const { limits } = useLicense();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingRequest, setEditingRequest] = useState(null);
  const [showArchived, setShowArchived] = useState(false);
  const [detailsRequest, setDetailsRequest] = useState(null);

  const { data: serviceRequests = [], isLoading, isError, error } = useQuery(
    ['serviceRequests', currentCompanyId, showArchived],
    async () => {
      if (!currentCompanyId) return [];
      const { data, error } = await supabase
        .from('service_requests')
        .select('*, equipments(name, location)')
        .eq('company_id', currentCompanyId)
        .eq('is_archived', showArchived)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    { enabled: !!currentCompanyId }
  );

  const { data: equipments = [] } = useQuery(
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
    { enabled: !!currentCompanyId }
  );

  const requestsLimit = limits.serviceRequests;
  const isAtLimit = requestsLimit !== Infinity && serviceRequests.filter(r => !r.is_archived).length >= requestsLimit;
  const canCreate = hasAccess('service_request_creation');
  const canConvert = hasAccess('service_request_conversion');
  const canEdit = hasAccess('service_request_management');
  const canDelete = hasAccess('service_request_management');
  const canArchive = hasAccess('service_request_management');

  const saveMutation = useMutation(
    async (formData) => {
        const isEditing = !!editingRequest?.id;
        const logTag = isEditing ? 'SERVICE_REQUEST_UPDATE' : 'SERVICE_REQUEST_CREATE';
        
        await logAction({ tag: `${logTag}_ATTEMPT`, message: `Tentativa de ${isEditing ? 'atualizar' : 'criar'} Solicitação: "${formData.title}"`, meta: { formData }, userId: userProfile?.id, companyId: currentCompanyId });
        
        if (!isEditing && isAtLimit) {
            const err = new Error(`Limite de ${requestsLimit} solicitações atingido.`);
            await logAction({ level: 'ERROR', tag: `${logTag}_LIMIT_ERROR`, message: err.message, error: err, meta: { limit: requestsLimit }, userId: userProfile?.id, companyId: currentCompanyId });
            throw err;
        }

        const requestData = {
            ...formData,
            company_id: currentCompanyId,
            user_id: userProfile.id,
            updated_at: new Date().toISOString(),
        };

        let savedRequest;
        if (isEditing) {
            const { data, error } = await supabase.from('service_requests').update(requestData).eq('id', editingRequest.id).select().single();
            if (error) throw error;
            savedRequest = data;
        } else {
            const { data, error } = await supabase.from('service_requests').insert([{ ...requestData, created_at: new Date().toISOString() }]).select().single();
            if (error) throw error;
            savedRequest = data;
        }
        await logAction({ tag: `${logTag}_SUCCESS`, message: `Solicitação "${savedRequest.title}" salva com sucesso.`, meta: { serviceRequestId: savedRequest.id }, userId: userProfile?.id, companyId: currentCompanyId });
        return savedRequest;
    },
    {
      onSuccess: () => {
        toast({ title: "Sucesso!", description: `Solicitação de serviço ${editingRequest ? 'atualizada' : 'criada'}.` });
        queryClient.invalidateQueries(['serviceRequests', currentCompanyId, showArchived]);
        setView('list');
        setEditingRequest(null);
      },
      onError: async (error) => {
        toast({ title: "Erro ao Salvar", description: error.message, variant: "destructive" });
        const isEditing = !!editingRequest?.id;
        const logTag = isEditing ? 'SERVICE_REQUEST_UPDATE' : 'SERVICE_REQUEST_CREATE';
        await logAction({ level: 'ERROR', tag: `${logTag}_ERROR`, message: `Falha ao salvar Solicitação: "${editingRequest?.title}"`, error, userId: userProfile?.id, companyId: currentCompanyId });
      },
    }
  );

  const archiveMutation = useMutation(
    async ({ id, archive }) => {
      const logTag = archive ? 'SERVICE_REQUEST_ARCHIVE' : 'SERVICE_REQUEST_UNARCHIVE';
      await logAction({ tag: `${logTag}_ATTEMPT`, message: `Tentativa de ${archive ? 'arquivar' : 'desarquivar'} Solicitação ID: ${id}`, meta: { serviceRequestId: id }, userId: userProfile?.id, companyId: currentCompanyId });
      const { error } = await supabase.from('service_requests').update({ is_archived: archive }).eq('id', id);
      if (error) throw error;
      await logAction({ tag: `${logTag}_SUCCESS`, message: `Solicitação ID: ${id} ${archive ? 'arquivada' : 'desarquivada'} com sucesso.`, meta: { serviceRequestId: id }, userId: userProfile?.id, companyId: currentCompanyId });
    },
    {
      onSuccess: (_, { archive }) => {
        toast({ title: "Sucesso!", description: `Solicitação de serviço ${archive ? 'arquivada' : 'desarquivada'}.` });
        queryClient.invalidateQueries(['serviceRequests', currentCompanyId, true]);
        queryClient.invalidateQueries(['serviceRequests', currentCompanyId, false]);
      },
      onError: async (error, { archive }) => {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        const logTag = archive ? 'SERVICE_REQUEST_ARCHIVE_ERROR' : 'SERVICE_REQUEST_UNARCHIVE_ERROR';
        await logAction({ level: 'ERROR', tag: logTag, message: `Falha ao ${archive ? 'arquivar' : 'desarquivar'} Solicitação.`, error, userId: userProfile?.id, companyId: currentCompanyId });
      },
    }
  );

  const handleConvertToWorkOrder = (request) => {
    if (!canConvert) {
      toast({ title: "Acesso Negado", description: "Seu plano não permite converter solicitações.", variant: "destructive" });
      return;
    }
    navigate(`/app/work-orders?action=new&from_request_id=${request.id}`);
  };

  const filteredRequests = useMemo(() => serviceRequests.filter(req => {
    const matchesSearch = searchTerm === '' ||
      (req.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.requester_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (req.equipments?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    return matchesSearch && matchesStatus;
  }), [serviceRequests, searchTerm, filterStatus]);

  const openAddForm = () => {
    if (isAtLimit) {
      toast({ title: "Limite Atingido", description: `Seu plano permite até ${requestsLimit} solicitações.` });
      return;
    }
    if (!canCreate) {
      toast({ title: "Acesso Negado", description: "Seu plano não permite criar novas solicitações.", variant: "destructive" });
      return;
    }
    setEditingRequest(null);
    setView('form');
  };

  const openEditForm = (request) => {
    setEditingRequest(request);
    setView('form');
  };

  if (view === 'form') {
    return (
      <ServiceRequestForm
        initialData={editingRequest}
        onSubmit={(data) => saveMutation.mutate(data)}
        onCancel={() => { setView('list'); setEditingRequest(null); }}
        isSubmitting={saveMutation.isLoading}
        equipments={equipments}
      />
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {showArchived ? 'Solicitações Arquivadas' : 'Solicitações de Serviço'}
          </h1>
          <p className="text-muted-foreground">
            {showArchived ? 'Visualize solicitações antigas.' : 'Gerencie todas as solicitações de serviço e manutenção.'}
          </p>
          {!showArchived && <p className="text-sm text-amber-500 mt-1 font-medium">{serviceRequests.length}/{requestsLimit === Infinity ? '∞' : requestsLimit} solicitações. {isAtLimit && " Limite do plano atingido."}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setShowArchived(!showArchived)}>
            {showArchived ? <Unarchive className="h-4 w-4 mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
            {showArchived ? 'Ver Ativas' : 'Ver Arquivo'}
          </Button>
          <Button onClick={openAddForm} disabled={isAtLimit || !canCreate}>
            <Plus className="h-4 w-4 mr-2" /> Nova Solicitação {(!canCreate || isAtLimit) && <Lock className="ml-1 h-3 w-3"/>}
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Buscar por título, solicitante ou equipamento..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Status</SelectItem>
            <SelectItem value="aberta">Aberta</SelectItem>
            <SelectItem value="em-atendimento">Em Atendimento</SelectItem>
            <SelectItem value="concluida">Concluída</SelectItem>
            <SelectItem value="cancelada">Cancelada</SelectItem>
            <SelectItem value="convertida">Convertida</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center items-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
      ) : isError ? (
        <div className="text-center text-destructive py-10">Erro ao carregar solicitações: {error.message}</div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request, index) => (
              <motion.div key={request.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
                <ServiceRequestCard
                  request={request}
                  onEdit={openEditForm}
                  onDetails={() => setDetailsRequest(request)}
                  onArchive={(id, archive) => archiveMutation.mutate({ id, archive })}
                  onConvertToWorkOrder={handleConvertToWorkOrder}
                  canEdit={canEdit}
                  canArchive={canArchive}
                />
              </motion.div>
            ))}
          </div>
          {filteredRequests.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma solicitação encontrada</h3>
              <p className="text-muted-foreground">{searchTerm || filterStatus !== 'all' ? 'Tente ajustar os filtros.' : 'Nenhuma solicitação aqui.'}</p>
            </motion.div>
          )}
        </>
      )}
      <ServiceRequestDetailsModal
        isOpen={!!detailsRequest}
        onClose={() => setDetailsRequest(null)}
        request={detailsRequest}
      />
    </div>
  );
};

export default ServiceRequestManager;
