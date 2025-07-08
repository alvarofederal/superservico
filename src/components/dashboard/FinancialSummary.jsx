
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

const FinancialSummary = ({ data, cardVariants, customIndex }) => {
  return (
    <motion.div custom={customIndex} variants={cardVariants} initial="hidden" animate="visible">
      <Card className="glass-effect">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <DollarSign className="h-5 w-5 text-primary" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Valor Total em Peças</p>
              <p className="text-2xl font-bold text-green-500">
                R$ {data.totalPartsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Custo Total de Ordens</p>
              <p className="text-2xl font-bold text-blue-500">
                R$ {data.totalWorkOrdersCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground">Solicitações Urgentes</p>
              <p className="text-2xl font-bold text-red-500">
                {data.highUrgencyRequests}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FinancialSummary;
