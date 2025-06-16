import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Wrench, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  DollarSign,
  Target,
  Package,
  FilePlus2,
  ClipboardList
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const Dashboard = ({ equipments, workOrders, parts, serviceRequests, maintenanceGoals }) => {
  const monthlyData = [
    { month: 'Jan', preventiva: 12, corretiva: 8, custo: 15000 },
    { month: 'Fev', preventiva: 15, corretiva: 6, custo: 12000 },
    { month: 'Mar', preventiva: 18, corretiva: 4, custo: 9000 },
    { month: 'Abr', preventiva: 20, corretiva: 7, custo: 14000 },
    { month: 'Mai', preventiva: 22, corretiva: 3, custo: 8000 },
    { month: 'Jun', preventiva: 25, corretiva: 5, custo: 11000 },
  ];

  const workOrderStatusData = [
    { name: 'Concluídas', value: workOrders.filter(order => order.status === 'completed').length, color: 'hsl(var(--primary))' },
    { name: 'Em Andamento', value: workOrders.filter(order => order.status === 'in-progress').length, color: 'hsl(var(--secondary))' },
    { name: 'Pendentes', value: workOrders.filter(order => order.status === 'pending').length, color: 'hsl(var(--destructive))' },
  ].filter(d => d.value > 0);

  const totalWorkOrders = workOrders.length;
  const openServiceRequests = serviceRequests.filter(req => req.status === 'aberta').length;

  const totalCost = workOrders.reduce((sum, order) => sum + (order.actualCost || order.estimatedCost || 0), 0);
  
  const upcomingMaintenance = equipments.filter(eq => {
    if (!eq.nextMaintenance) return false;
    const nextMaintenance = new Date(eq.nextMaintenance);
    const today = new Date();
    const diffTime = nextMaintenance - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays >= 0;
  });

  const overdueMaintenance = equipments.filter(eq => {
    if (!eq.nextMaintenance) return false;
    const nextMaintenance = new Date(eq.nextMaintenance);
    const today = new Date();
    return nextMaintenance < today;
  });

  const lowStockPartsCount = parts.filter(p => (p.quantity || 0) <= (p.minQuantity || 0)).length;

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.1,
        duration: 0.5,
        ease: "easeOut"
      }
    })
  };
  
  const chartColors = {
    preventiva: 'hsl(var(--primary))', // Blue
    corretiva: 'hsl(var(--destructive))', // Red
    custo: 'hsl(var(--secondary))', // Muted Blue/Gray
  };

  return (
    <div className="space-y-6 md:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pb-4 border-b border-border"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-foreground">Dashboard Operacional</h1>
        <p className="text-muted-foreground text-base md:text-lg">
          Visão geral do sistema Super Serviço.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {[
          { title: 'Equipamentos Ativos', value: equipments.length, icon: Wrench, color: 'text-blue-500 dark:text-blue-400', note: `${equipments.filter(e=>e.status === 'operational').length} operacionais` },
          { title: 'Ordens de Serviço', value: totalWorkOrders, icon: ClipboardList, color: 'text-green-500 dark:text-green-400', note: `${workOrders.filter(wo => wo.status === 'pending').length} pendentes` },
          { title: 'Solicitações Abertas', value: openServiceRequests, icon: FilePlus2, color: 'text-yellow-500 dark:text-yellow-400', note: `${serviceRequests.length} no total` },
          { title: 'Peças com Estoque Baixo', value: lowStockPartsCount, icon: Package, color: 'text-orange-500 dark:text-orange-400', note: `${parts.length} tipos de peças` },
        ].map((item, i) => (
          <motion.div key={item.title} custom={i} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="glass-effect card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{item.title}</CardTitle>
                <item.icon className={`h-5 w-5 ${item.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-3xl font-bold ${item.color}`}>{item.value}</div>
                <p className="text-xs text-muted-foreground pt-1">
                  {item.note}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <motion.div className="lg:col-span-2" custom={4} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="glass-effect h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TrendingUp className="h-5 w-5 text-primary" />
                Tendência Mensal (Dados Fictícios)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 'var(--radius)'
                    }} 
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    itemStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Line type="monotone" dataKey="preventiva" stroke={chartColors.preventiva} strokeWidth={2.5} name="Preventiva" dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                  <Line type="monotone" dataKey="corretiva" stroke={chartColors.corretiva} strokeWidth={2.5} name="Corretiva" dot={{ r: 4 }} activeDot={{ r: 6 }}/>
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible">
          <Card className="glass-effect h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Target className="h-5 w-5 text-primary" />
                Status das Ordens de Serviço
              </CardTitle>
            </CardHeader>
            <CardContent>
              {workOrderStatusData.length > 0 ? (
                <>
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie data={workOrderStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" labelLine={false}
                         label={({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }) => {
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * Math.PI / 180);
                            const y = cy + radius * Math.sin(-midAngle * Math.PI / 180);
                            return (
                              <text x={x} y={y} fill="hsl(var(--primary-foreground))" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
                                {`${(percent * 100).toFixed(0)}%`}
                              </text>
                            );
                          }}>
                      {workOrderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke="hsl(var(--background))" strokeWidth={2}/>
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)'}} 
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      itemStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
                  {workOrderStatusData.map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}/>
                      <span className="text-xs text-muted-foreground">{item.name} ({item.value})</span>
                    </div>
                  ))}
                </div>
                </>
              ) : (
                <p className="text-muted-foreground text-center py-10">Sem dados de ordens de serviço para exibir.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible">
        <Card className="glass-effect">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <DollarSign className="h-5 w-5 text-primary" />
              Custos Mensais (Dados Fictícios)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 'var(--radius)' }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                  formatter={(value) => [`R$ ${value.toLocaleString()}`, 'Custo']}
                />
                <Bar dataKey="custo" fill={chartColors.custo} radius={[4, 4, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {upcomingMaintenance.length > 0 && (
          <motion.div custom={7} variants={cardVariants} initial="hidden" animate="visible">
            <Card className="glass-effect border-yellow-500/50 dark:border-yellow-400/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400">
                  <Calendar className="h-5 w-5" />
                  Manutenções Programadas (Próximos 7 Dias)
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-60 overflow-y-auto scrollbar-hide">
                <div className="space-y-2">
                  {upcomingMaintenance.slice(0, 5).map((equipment) => (
                    <div key={equipment.id} className="flex items-center justify-between p-3 rounded-md bg-yellow-500/10 dark:bg-yellow-400/10 border border-yellow-500/20 dark:border-yellow-400/20">
                      <div>
                        <p className="font-medium text-foreground">{equipment.name}</p>
                        <p className="text-sm text-muted-foreground">{equipment.location}</p>
                      </div>
                      <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:border-yellow-400 dark:text-yellow-300">
                        {new Date(equipment.nextMaintenance).toLocaleDateString()}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
        {overdueMaintenance.length > 0 && (
          <motion.div custom={8} variants={cardVariants} initial="hidden" animate="visible" className={upcomingMaintenance.length === 0 ? 'md:col-span-2' : ''}>
             <Card className="glass-effect border-red-500/50 dark:border-red-400/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                  <AlertTriangle className="h-5 w-5" />
                  Manutenções Atrasadas
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-60 overflow-y-auto scrollbar-hide">
                <div className="space-y-2">
                  {overdueMaintenance.slice(0, 5).map((equipment) => (
                    <div key={equipment.id} className="flex items-center justify-between p-3 rounded-md bg-red-500/10 dark:bg-red-400/10 border border-red-500/20 dark:border-red-400/20">
                      <div>
                        <p className="font-medium text-foreground">{equipment.name}</p>
                        <p className="text-sm text-muted-foreground">{equipment.location}</p>
                      </div>
                       <Badge variant="outline" className="border-red-500 text-red-600 dark:border-red-400 dark:text-red-300">
                        Atrasada
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;