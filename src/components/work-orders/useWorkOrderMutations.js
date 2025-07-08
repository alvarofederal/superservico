
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { logAction } from '@/services/logService';
import { logEquipmentHistory } from '@/services/historyService';

export const useWorkOrderMutations = ({ editingOrder, setEditingOrder, setView }) => {
  const queryClient = useQueryClient();
  const { userProfile, currentCompanyId } = useAuth();

  const saveMutation = useMutation(
    async (formData) => {
      const isEditing = !!editingOrder?.id;
      const logTag = isEditing ? 'WORK_ORDER_UPDATE' : 'WORK_ORDER_CREATE';

      await logAction({ tag: `${logTag}_ATTEMPT`, message: `Tentativa de ${isEditing ? 'atualizar' : 'criar'} Ordem de Serviço: "${formData.title}"`, meta: { formData }, userId: userProfile?.id, companyId: currentCompanyId });

      const orderData = {
        ...formData, company_id: currentCompanyId, user_id: userProfile?.id,
        estimatedcost: parseFloat(formData.estimatedcost) || 0, actualcost: parseFloat(formData.actualcost) || 0,
        estimatedhours: parseFloat(formData.estimatedhours) || 0, actualhours: parseFloat(formData.actualhours) || 0,
        scheduleddate: formData.scheduleddate || null, type: formData.maintenance_type,
      };
      delete orderData.maintenance_type;

      let savedWorkOrder;
      if (isEditing) {
        const { data, error } = await supabase.from('work_orders').update({ ...orderData, updatedat: new Date().toISOString() }).eq('id', editingOrder.id).select().single();
        if (error) throw error;
        savedWorkOrder = data;
      } else {
        const { data, error } = await supabase.from('work_orders').insert([{ ...orderData, createdat: new Date().toISOString(), updatedat: new Date().toISOString() }]).select().single();
        if (error) throw error;
        savedWorkOrder = data;
      }
      await logAction({ tag: `${logTag}_SUCCESS`, message: `Ordem de Serviço "${savedWorkOrder.title}" salva com sucesso.`, meta: { workOrderId: savedWorkOrder.id }, userId: userProfile?.id, companyId: currentCompanyId });
      
      return { savedWorkOrder, isEditing };
    },
    {
      onSuccess: async ({ savedWorkOrder, isEditing }) => {
        toast({ title: "Sucesso!", description: "Ordem de serviço salva." });

        const maintenanceEntry = {
            company_id: currentCompanyId, user_id: userProfile.id, equipment_id: savedWorkOrder.equipmentid || null,
            work_order_id: savedWorkOrder.id, service_request_id: savedWorkOrder.service_request_id || null,
            title: `Manutenção da OS: ${savedWorkOrder.title}`, description: savedWorkOrder.description, type: savedWorkOrder.type,
            status: 'pending', priority: savedWorkOrder.priority, scheduled_date: savedWorkOrder.scheduleddate || new Date().toISOString(),
            assigned_to_user_id: null, notes: savedWorkOrder.notes,
        };

        if (isEditing) {
            const { data: existingMaintenance, error: findError } = await supabase.from('maintenances').select('id').eq('work_order_id', savedWorkOrder.id).single();
            if (findError && findError.code !== 'PGRST116') {
                toast({ title: "Erro", description: `Não foi possível encontrar a manutenção associada: ${findError.message}`, variant: "destructive" });
            } else if (existingMaintenance) {
                const { error: updateError } = await supabase.from('maintenances').update(maintenanceEntry).eq('id', existingMaintenance.id);
                if (updateError) {
                    toast({ title: "Aviso", description: `OS salva, mas falha ao atualizar manutenção: ${updateError.message}`, variant: "destructive" });
                }
            }
        } else {
            try {
                const { data: newMaintenance, error: insertError } = await supabase.from('maintenances').insert([maintenanceEntry]).select().single();
                if (insertError) throw insertError;
                toast({ title: "Manutenção Agendada", description: "Manutenção correspondente criada." });
                if (savedWorkOrder.equipmentid && savedWorkOrder.service_request_id) {
                    await logEquipmentHistory({
                        equipment_id: savedWorkOrder.equipmentid, company_id: currentCompanyId, user_id: userProfile.id,
                        event_type: 'CONVERTED_TO_WORK_ORDER', event_description: `Solicitação convertida para Ordem de Serviço: "${savedWorkOrder.title}"`,
                        related_service_request_id: savedWorkOrder.service_request_id, related_work_order_id: savedWorkOrder.id,
                        related_maintenance_id: newMaintenance.id
                    });
                }
            } catch (error) {
                toast({ title: "Aviso", description: `OS salva, mas falha ao criar manutenção: ${error.message}`, variant: "destructive" });
            }
        }
        
        if (savedWorkOrder.service_request_id) {
            const { error: updateError } = await supabase.from('service_requests').update({ status: 'convertida' }).eq('id', savedWorkOrder.service_request_id);
            if (updateError) {
                toast({ title: "Aviso", description: `OS salva, mas falha ao atualizar status da SS: ${updateError.message}`, variant: "destructive" });
            }
        }
        
        queryClient.invalidateQueries(['workOrders', currentCompanyId, false]);
        queryClient.invalidateQueries(['workOrders', currentCompanyId, true]);
        queryClient.invalidateQueries(['serviceRequests', currentCompanyId, false]);
        queryClient.invalidateQueries(['serviceRequests', currentCompanyId, true]);
        queryClient.invalidateQueries(['maintenances', currentCompanyId]);
        setView('list'); setEditingOrder(null);
      },
      onError: async (err) => { 
          toast({ title: "Erro ao Salvar", description: err.message, variant: "destructive" });
          const isEditing = !!editingOrder?.id;
          const logTag = isEditing ? 'WORK_ORDER_UPDATE' : 'WORK_ORDER_CREATE';
          await logAction({ level: 'ERROR', tag: `${logTag}_ERROR`, message: `Falha ao salvar Ordem de Serviço: "${editingOrder?.title}"`, error: err, userId: userProfile.id, companyId: currentCompanyId });
      }
    }
  );

  const archiveMutation = useMutation(
    async ({ id, archive }) => {
      const logTag = archive ? 'WORK_ORDER_ARCHIVE' : 'WORK_ORDER_UNARCHIVE';
      await logAction({ tag: `${logTag}_ATTEMPT`, message: `Tentativa de ${archive ? 'arquivar' : 'desarquivar'} Ordem de Serviço ID: ${id}`, meta: { workOrderId: id }, userId: userProfile?.id, companyId: currentCompanyId });
      const { error } = await supabase.from('work_orders').update({ is_archived: archive }).eq('id', id);
      if (error) throw error;
      await logAction({ tag: `${logTag}_SUCCESS`, message: `Ordem de Serviço ID: ${id} ${archive ? 'arquivada' : 'desarquivada'} com sucesso.`, meta: { workOrderId: id }, userId: userProfile?.id, companyId: currentCompanyId });
    },
    {
      onSuccess: (_, { archive }) => {
        toast({ title: "Sucesso!", description: `Ordem de Serviço ${archive ? 'arquivada' : 'desarquivada'}.` });
        queryClient.invalidateQueries(['workOrders', currentCompanyId, true]);
        queryClient.invalidateQueries(['workOrders', currentCompanyId, false]);
      },
      onError: async (error, { archive }) => {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        const logTag = archive ? 'WORK_ORDER_ARCHIVE_ERROR' : 'WORK_ORDER_UNARCHIVE_ERROR';
        await logAction({ level: 'ERROR', tag: logTag, message: `Falha ao ${archive ? 'arquivar' : 'desarquivar'} Ordem de Serviço.`, error, userId: userProfile.id, companyId: currentCompanyId });
      },
    }
  );

  return { saveMutation, archiveMutation };
};
