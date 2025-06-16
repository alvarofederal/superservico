import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart as IconPieChart } from 'lucide-react';
import { formatCurrency, getTypeColor, categories } from './utils';

const CostByTypeChart = ({ costByType, totalCost }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconPieChart className="h-5 w-5" />
            Custos por Tipo de Manutenção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(costByType).map(([type, cost]) => {
              const percentage = totalCost > 0 ? (cost / totalCost) * 100 : 0;
              return (
                <div key={type} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${getTypeColor(type)}`} />
                      <span className="font-medium">{categories[type]}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{formatCurrency(cost)}</div>
                      <div className="text-sm text-muted-foreground">{percentage.toFixed(1)}%</div>
                    </div>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${getTypeColor(type)}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default CostByTypeChart;