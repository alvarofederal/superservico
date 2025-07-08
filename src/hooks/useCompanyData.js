import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';

const fetchAllDataForCompany = async (companyIdToFetch, userId, userRole) => {
    if (!userId) return { equipments: [], parts: [], workOrders: [], serviceRequests: [], categories: [] };

    const isClientWithNoCompany = userRole === 'client' && !companyIdToFetch;
    const isAdminGlobalView = userRole === 'admin' && !companyIdToFetch;

    let equipmentQuery = supabase.from('equipments').select('*');
    let partsQuery = supabase.from('parts').select('*');
    let workOrdersQuery = supabase.from('work_orders').select('*');
    let serviceRequestsQuery = supabase.from('service_requests').select('*, equipments(name)');
    let categoriesQuery = supabase.from('equipment_categories').select('*');

    if (isAdminGlobalView) {
      // Admin global view fetches all data, no filter needed.
    } else if (companyIdToFetch) {
      equipmentQuery = equipmentQuery.eq('company_id', companyIdToFetch);
      partsQuery = partsQuery.eq('company_id', companyIdToFetch);
      workOrdersQuery = workOrdersQuery.eq('company_id', companyIdToFetch);
      serviceRequestsQuery = serviceRequestsQuery.eq('company_id', companyIdToFetch);
      categoriesQuery = categoriesQuery.eq('company_id', companyIdToFetch);
    } else if (isClientWithNoCompany) {
      equipmentQuery = null;
      partsQuery = null;
      workOrdersQuery = null;
      serviceRequestsQuery = supabase.from('service_requests').select('*, equipments(name)').eq('user_id', userId).is('company_id', null);
      categoriesQuery = null;
    } else {
      // If not admin and no company selected, return empty.
      return { equipments: [], parts: [], workOrders: [], serviceRequests: [], categories: [] };
    }

    try {
      const [equipmentsRes, partsRes, workOrdersRes, serviceRequestsRes, categoriesRes] = await Promise.all([
        equipmentQuery ? equipmentQuery.order('createdat', { ascending: false }) : Promise.resolve({ data: [] }),
        partsQuery ? partsQuery.order('createdat', { ascending: false }) : Promise.resolve({ data: [] }),
        workOrdersQuery ? workOrdersQuery.order('createdat', { ascending: false }) : Promise.resolve({ data: [] }),
        serviceRequestsQuery ? serviceRequestsQuery.order('created_at', { ascending: false }) : Promise.resolve({ data: [] }),
        categoriesQuery ? categoriesQuery.order('name', { ascending: true }) : Promise.resolve({ data: [] }),
      ]);

      if (equipmentsRes.error) throw equipmentsRes.error;
      if (partsRes.error) throw partsRes.error;
      if (workOrdersRes.error) throw workOrdersRes.error;
      if (serviceRequestsRes.error) throw serviceRequestsRes.error;
      if (categoriesRes.error) throw categoriesRes.error;
      
      return {
        equipments: equipmentsRes.data || [],
        parts: partsRes.data || [],
        workOrders: workOrdersRes.data || [],
        serviceRequests: serviceRequestsRes.data || [],
        categories: categoriesRes.data || [],
      };
    } catch (error) {
      toast({ title: "Erro ao carregar dados da empresa", description: error.message, variant: "destructive" });
      return { equipments: [], parts: [], workOrders: [], serviceRequests: [], categories: [] };
    }
  };

export const useCompanyData = () => {
  const { userProfile, currentCompanyId } = useAuth();
  
  const { data: companyData, isLoading, isError, error } = useQuery(
    ['companyData', currentCompanyId, userProfile?.id],
    () => fetchAllDataForCompany(currentCompanyId, userProfile?.id, userProfile?.role),
    {
      enabled: !!userProfile?.id,
      initialData: { equipments: [], parts: [], workOrders: [], serviceRequests: [], categories: [] },
    }
  );

  return { companyData, isLoading, isError, error };
};