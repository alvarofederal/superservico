import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign, BarChart3, CheckCircle, Clock } from 'lucide-react';
import { formatCurrency } from './utils';

const KeyMetrics = ({ analytics }) => {
  const metrics = [
    {
      title: 'Custo Total',
      value: formatCurrency(analytics.totalCost),
      description: `${analytics.totalOrders} ordens de serviço`,
      icon: DollarSign,
      color: 'text-green-400',
      delay: 0.1,
    },
    {
      title: 'Custo Médio',
      value: formatCurrency(analytics.averageCost),
      description: 'Por ordem de serviço',
      icon: BarChart3,
      color: 'text-blue-400',
      delay: 0.2,
    },
    {
      title: 'Ordens Concluídas',
      value: analytics.completedOrders,
      description: analytics.totalOrders > 0 ? 
        `${((analytics.completedOrders / analytics.totalOrders) * 100).toFixed(1)}% do total` : 
        '0% do total',
      icon: CheckCircle,
      color: 'text-purple-400',
      delay: 0.3,
    },
    {
      title: 'Em Andamento',
      value: analytics.inProgressOrders + analytics.pendingOrders,
      description: `${analytics.inProgressOrders} ativas, ${analytics.pendingOrders} pendentes`,
      icon: Clock,
      color: 'text-yellow-400',
      delay: 0.4,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: metric.delay }}
          >
            <Card className="glass-effect card-hover">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                <Icon className={`h-4 w-4 ${metric.color}`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metric.color}`}>
                  {metric.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {metric.description}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
};

export default KeyMetrics;