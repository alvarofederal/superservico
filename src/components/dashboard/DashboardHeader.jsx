
import React from 'react';
import { motion } from 'framer-motion';

const DashboardHeader = ({ companyName, userProfile }) => (
  <motion.div
    initial={{ opacity: 0, y: -20 }}
    animate={{ opacity: 1, y: 0 }}
    className="pb-4 border-b border-border"
  >
    <h1 className="text-3xl md:text-4xl font-bold text-foreground">Dashboard Operacional</h1>
    <p className="text-muted-foreground text-base md:text-lg">
      Visão geral do sistema Super Serviço - {companyName}
    </p>
    {userProfile && (
      <p className="text-sm text-primary mt-1">
        Bem-vindo, {userProfile.full_name} ({userProfile.role})
      </p>
    )}
  </motion.div>
);

export default DashboardHeader;
