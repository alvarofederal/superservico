import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wrench } from 'lucide-react';
import { formatCurrency } from './utils';

const TopEquipmentChart = ({ topEquipment }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Equipamentos com Maiores Custos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topEquipment.length > 0 ? (
              topEquipment.map((equipment, index) => {
                const maxCost = Math.max(...topEquipment.map(eq => eq.cost));
                const percentage = maxCost > 0 ? (equipment.cost / maxCost) * 100 : 0;
                
                return (
                  <div key={equipment.id} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          #{index + 1}
                        </Badge>
                        <span className="font-medium">{equipment.name}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{formatCurrency(equipment.cost)}</div>
                        <div className="text-sm text-muted-foreground">{equipment.orders} ordens</div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhum dado de equipamento disponível para o período selecionado.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default TopEquipmentChart;