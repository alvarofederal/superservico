
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Wrench, 
  ClipboardList,
  FilePlus2,
  Package,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { startOfMonth, subMonths, format, isWithinInterval } from 'date-fns';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';

import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatCard from '@/components/dashboard/StatCard';
import MaintenanceTrendChart from '@/components/dashboard/MaintenanceTrendChart';
import WorkOrderStatusChart from '@/components/dashboard/WorkOrderStatusChart';
import FinancialSummary from '@/components/dashboard/FinancialSummary';
import EquipmentStatusChart from '@/components/dashboard/EquipmentStatusChart';
import EmptyDashboard from '@/components/dashboard/EmptyDashboard';

const Dashboard = () => {
  const { userProfile, currentCompanyId, companyName } = useAuth();

  const { data: dashboardFetchData, isLoading, isError, error } = useQuery(
    ['dashboardData', currentCompanyId],
    async () => {
      if (!currentCompanyId) {
        return { equipments: [], workOrders: [], parts: [], serviceRequests: [] };
      }

      const [equipmentsRes, workOrdersRes, partsRes, serviceRequestsRes] = await Promise.all([
        supabase.from('equipments').select('*').eq('company_id', currentCompanyId),
        supabase.from('work_orders').select('*').eq('company_id', currentCompanyId),
        supabase.from('parts').select('*').eq('company_id', currentCompanyId),
        supabase.from('service_requests').select('*').eq('company_id', currentCompanyId)
      ]);

      const errors = [equipmentsRes.error, workOrdersRes.error, partsRes.error, serviceRequestsRes.error].filter(Boolean);
      if (errors.length > 0) {
        console.error("Dashboard data fetch errors:", errors);
        throw new Error(errors.map(e => e.message).join(', '));
      }

      return {
        equipments: equipmentsRes.data || [],
        workOrders: workOrdersRes.data || [],
        parts: partsRes.data || [],
        serviceRequests: serviceRequestsRes.data || [],
      };
    },
    {
      enabled: !!currentCompanyId,
      staleTime: 1000 * 60 * 5, // 5 minutes
    }
  );

  const { equipments, workOrders, parts, serviceRequests } = dashboardFetchData || { equipments: [], workOrders: [], parts: [], serviceRequests: [] };
  
  const dashboardData = useMemo(() => {
    const totalEquipments = equipments.length;
    const operationalEquipments = equipments.filter(e => e.status === 'operational').length;
    const totalWorkOrders = workOrders.length;
    const pendingWorkOrders = workOrders.filter(wo => wo.status === 'pending').length;
    const inProgressWorkOrders = workOrders.filter(wo => wo.status === 'in-progress').length;
    const completedWorkOrders = workOrders.filter(wo => wo.status === 'completed').length;
    const totalServiceRequests = serviceRequests.length;
    const openServiceRequests = serviceRequests.filter(req => req.status === 'aberta').length;
    const highUrgencyRequests = serviceRequests.filter(req => req.urgency === 'high' && req.status !== 'convertida' && req.status !== 'fechada').length;
    const totalParts = parts.length;
    const lowStockParts = parts.filter(p => (p.quantity ?? 0) <= (p.minquantity ?? 0)).length;
    const totalPartsValue = parts.reduce((sum, part) => sum + ((part.quantity ?? 0) * (part.unitcost ?? 0)), 0);
    const totalWorkOrdersCost = workOrders.reduce((sum, order) => sum + (Number(order.actualcost) || Number(order.estimatedcost) || 0), 0);

    return {
      totalEquipments, operationalEquipments,
      totalWorkOrders, pendingWorkOrders, inProgressWorkOrders, completedWorkOrders,
      totalServiceRequests, openServiceRequests, highUrgencyRequests,
      totalParts, lowStockParts, totalPartsValue, totalWorkOrdersCost
    };
  }, [equipments, workOrders, parts, serviceRequests]);

  const chartData = useMemo(() => {
    const workOrderStatusData = [
      { name: 'Concluídas', value: dashboardData.completedWorkOrders, color: 'hsl(var(--primary))' },
      { name: 'Em Andamento', value: dashboardData.inProgressWorkOrders, color: 'hsl(142, 76%, 36%)' },
      { name: 'Pendentes', value: dashboardData.pendingWorkOrders, color: 'hsl(48, 96%, 53%)' },
    ].filter(d => d.value > 0);

    const equipmentStatusData = [
      { name: 'Operacional', value: equipments.filter(e => e.status === 'operational').length, color: 'hsl(142, 76%, 36%)' },
      { name: 'Manutenção', value: equipments.filter(e => e.status === 'maintenance').length, color: 'hsl(48, 96%, 53%)' },
      { name: 'Quebrado', value: equipments.filter(e => e.status === 'broken').length, color: 'hsl(0, 84%, 60%)' },
    ].filter(d => d.value > 0);

    const now = new Date();
    const sixMonthsAgo = startOfMonth(subMonths(now, 5));
    const months = Array.from({ length: 6 }, (_, i) => ({
        date: startOfMonth(subMonths(now, 5 - i)),
        month: format(subMonths(now, 5 - i), 'MMM'),
        preventiva: 0, corretiva: 0, custo: 0,
    }));

    workOrders.forEach(order => {
        const orderDate = new Date(order.createdat);
        if (isWithinInterval(orderDate, { start: sixMonthsAgo, end: now })) {
            const monthIndex = months.findIndex(m => m.date.getFullYear() === orderDate.getFullYear() && m.date.getMonth() === orderDate.getMonth());
            if (monthIndex !== -1) {
                if (order.maintenance_type === 'preventiva') months[monthIndex].preventiva += 1;
                else if (order.maintenance_type === 'corretiva') months[monthIndex].corretiva += 1;
                months[monthIndex].custo += (Number(order.actualcost) || Number(order.estimatedcost) || 0);
            }
        }
    });

    return { workOrderStatusData, equipmentStatusData, monthlyTrendData: months };
  }, [dashboardData, equipments, workOrders]);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" }
    })
  };

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-4" />
        <p className="text-muted-foreground">Carregando dados do dashboard...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] bg-destructive/10 p-8 rounded-lg">
        <AlertCircle className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-xl font-semibold text-destructive mb-2">Erro ao Carregar Dashboard</h3>
        <p className="text-destructive/80 text-center max-w-md">Não foi possível buscar os dados. Tente recarregar a página ou contate o suporte.</p>
        <p className="text-xs text-muted-foreground mt-4">Detalhe: {error.message}</p>
      </div>
    );
  }

  const hasData = dashboardData.totalEquipments > 0 || dashboardData.totalWorkOrders > 0 || dashboardData.totalServiceRequests > 0 || dashboardData.totalParts > 0;

  const statCards = [
    { title: 'Equipamentos', value: dashboardData.totalEquipments, icon: Wrench, color: 'text-blue-500 dark:text-blue-400', note: `${dashboardData.operationalEquipments} operacionais` },
    { title: 'Ordens de Serviço', value: dashboardData.totalWorkOrders, icon: ClipboardList, color: 'text-green-500 dark:text-green-400', note: `${dashboardData.pendingWorkOrders} pendentes` },
    { title: 'Solicitações', value: dashboardData.totalServiceRequests, icon: FilePlus2, color: 'text-yellow-500 dark:text-yellow-400', note: `${dashboardData.openServiceRequests} abertas` },
    { title: 'Peças em Estoque', value: dashboardData.totalParts, icon: Package, color: 'text-orange-500 dark:text-orange-400', note: `${dashboardData.lowStockParts} com estoque baixo` },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      <DashboardHeader companyName={companyName} userProfile={userProfile} />

      {!hasData ? (
        <EmptyDashboard />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {statCards.map((item, i) => (
              <StatCard key={item.title} item={item} index={i} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
            <MaintenanceTrendChart data={chartData.monthlyTrendData} cardVariants={cardVariants} customIndex={4} />
            <WorkOrderStatusChart data={chartData.workOrderStatusData} cardVariants={cardVariants} customIndex={5} />
          </div>

          <FinancialSummary data={dashboardData} cardVariants={cardVariants} customIndex={6} />

          {chartData.equipmentStatusData.length > 0 && (
            <EquipmentStatusChart data={chartData.equipmentStatusData} cardVariants={cardVariants} customIndex={7} />
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;
