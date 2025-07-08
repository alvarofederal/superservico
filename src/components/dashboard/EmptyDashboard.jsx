
import React from 'react';
import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';

const EmptyDashboard = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="text-center py-16"
  >
    <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
    <h3 className="text-xl font-semibold text-foreground mb-2">Dashboard em Preparação</h3>
    <p className="text-muted-foreground max-w-md mx-auto">
      Comece cadastrando equipamentos, peças e criando solicitações de serviço para ver os dados aparecerem aqui.
    </p>
  </motion.div>
);

export default EmptyDashboard;
