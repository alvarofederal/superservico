
import React from 'react';
import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';
import WorkOrderCard from '@/components/work-orders/WorkOrderCard';

const WorkOrderList = ({ workOrders, onEdit, onDetails, onArchive, getEquipmentName, canEdit, canArchive }) => {
  if (workOrders.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-12"
      >
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium mb-2">Nenhuma ordem de serviço encontrada</h3>
        <p className="text-muted-foreground">Tente ajustar os filtros ou crie uma nova ordem de serviço.</p>
      </motion.div>
    );
  }
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {workOrders.map((order, index) => (
        <motion.div
          key={order.id}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <WorkOrderCard 
            order={order} 
            onEdit={onEdit} 
            onDetails={onDetails} 
            onArchive={onArchive} 
            getEquipmentName={getEquipmentName}
            canEdit={canEdit} 
            canArchive={canArchive} 
          />
        </motion.div>
      ))}
    </div>
  );
};

export default WorkOrderList;
