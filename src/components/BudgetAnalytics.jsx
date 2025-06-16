import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import KeyMetrics from './budget-analytics/KeyMetrics';
import CostByTypeChart from './budget-analytics/CostByTypeChart';
import MonthlyTrendChart from './budget-analytics/MonthlyTrendChart';
import TopEquipmentChart from './budget-analytics/TopEquipmentChart';
import OrdersBreakdown from './budget-analytics/OrdersBreakdown';
import { periods, categories } from './budget-analytics/utils';

const BudgetAnalytics = ({ workOrders, equipment }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const getDateRange = () => {
    const now = new Date();
    const ranges = {
      week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      quarter: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
      year: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
    };
    return ranges[selectedPeriod];
  };

  const filteredOrders = useMemo(() => {
    const startDate = getDateRange();
    return workOrders.filter(order => {
      const orderDate = new Date(order.createdAt);
      const matchesPeriod = orderDate >= startDate;
      const matchesCategory = selectedCategory === 'all' || order.type === selectedCategory;
      return matchesPeriod && matchesCategory;
    });
  }, [workOrders, selectedPeriod, selectedCategory]);

  const analyticsData = useMemo(() => {
    const totalCost = filteredOrders.reduce((sum, order) => 
      sum + (order.actualCost || order.estimatedCost || 0), 0
    );
    
    const completedOrders = filteredOrders.filter(order => order.status === 'completed');
    const pendingOrders = filteredOrders.filter(order => order.status === 'pending');
    const inProgressOrders = filteredOrders.filter(order => order.status === 'in_progress' || order.status === 'in-progress'); // Corrected typo
    
    const averageCost = filteredOrders.length > 0 ? totalCost / filteredOrders.length : 0;
    
    const costByType = { preventive: 0, corrective: 0, emergency: 0, improvement: 0 };
    filteredOrders.forEach(order => {
      const cost = order.actualCost || order.estimatedCost || 0;
      costByType[order.type] = (costByType[order.type] || 0) + cost;
    });
    
    const monthlyTrend = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthOrders = workOrders.filter(order => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });
      
      const monthCost = monthOrders.reduce((sum, order) => 
        sum + (order.actualCost || order.estimatedCost || 0), 0
      );
      
      monthlyTrend.push({
        month: date.toLocaleDateString('pt-BR', { month: 'short' }),
        cost: monthCost,
        orders: monthOrders.length
      });
    }
    
    const equipmentCosts = {};
    filteredOrders.forEach(order => {
      const cost = order.actualCost || order.estimatedCost || 0;
      equipmentCosts[order.equipmentId] = (equipmentCosts[order.equipmentId] || 0) + cost;
    });
    
    const topEquipment = Object.entries(equipmentCosts)
      .map(([equipmentId, cost]) => {
        const equipmentData = equipment.find(eq => eq.id === equipmentId);
        return {
          id: equipmentId,
          name: equipmentData?.name || 'Equipamento não encontrado',
          cost,
          orders: filteredOrders.filter(order => order.equipmentId === equipmentId).length
        };
      })
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5);
    
    return {
      totalCost,
      averageCost,
      totalOrders: filteredOrders.length,
      completedOrders: completedOrders.length,
      pendingOrders: pendingOrders.length,
      inProgressOrders: inProgressOrders.length,
      costByType,
      monthlyTrend,
      topEquipment
    };
  }, [filteredOrders, equipment, workOrders]);

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold gradient-text">Análise de Orçamento</h1>
          <p className="text-muted-foreground">Insights detalhados sobre custos de manutenção</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(periods).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              {Object.entries(categories).map(([key, label]) => (
                <SelectItem key={key} value={key}>{label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      <KeyMetrics analytics={analyticsData} />

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
          <TabsTrigger value="equipment">Equipamentos</TabsTrigger>
          <TabsTrigger value="breakdown">Detalhamento</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <CostByTypeChart costByType={analyticsData.costByType} totalCost={analyticsData.totalCost} />
        </TabsContent>
        <TabsContent value="trends">
          <MonthlyTrendChart monthlyTrend={analyticsData.monthlyTrend} />
        </TabsContent>
        <TabsContent value="equipment">
          <TopEquipmentChart topEquipment={analyticsData.topEquipment} />
        </TabsContent>
        <TabsContent value="breakdown">
          <OrdersBreakdown filteredOrders={filteredOrders} equipment={equipment} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BudgetAnalytics;