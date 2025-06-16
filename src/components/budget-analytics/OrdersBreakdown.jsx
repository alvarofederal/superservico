import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, getTypeColor, getStatusColor, categories as typeCategories } from './utils';

const OrdersBreakdown = ({ filteredOrders, equipment }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
    >
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle>Detalhamento de Ordens de Serviço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredOrders.length > 0 ? (
              filteredOrders.slice(0, 10).map((order) => {
                const equipmentData = equipment.find(eq => eq.id === order.equipmentId);
                const cost = order.actualCost || order.estimatedCost || 0;
                
                return (
                  <div key={order.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={`${getTypeColor(order.type)} text-white border-0`}>
                          {typeCategories[order.type]}
                        </Badge>
                        <span className={`text-sm ${getStatusColor(order.status)}`}>
                          {order.status === 'completed' ? 'Concluída' : 
                           order.status === 'in_progress' ? 'Em Andamento' : 'Pendente'}
                        </span>
                      </div>
                      <h4 className="font-medium">{order.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {equipmentData?.name || 'Equipamento não encontrado'}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">{formatCurrency(cost)}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma ordem de serviço encontrada para os filtros selecionados.
              </p>
            )}
            
            {filteredOrders.length > 10 && (
              <div className="text-center pt-4">
                <p className="text-sm text-muted-foreground">
                  Mostrando 10 de {filteredOrders.length} ordens de serviço
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OrdersBreakdown;