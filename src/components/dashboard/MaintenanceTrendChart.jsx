
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

const MaintenanceTrendChart = ({ data, cardVariants, customIndex }) => {
  const chartColors = {
    preventiva: 'hsl(var(--primary))',
    corretiva: 'hsl(0, 84%, 60%)',
  };

  return (
    <motion.div className="lg:col-span-2" custom={customIndex} variants={cardVariants} initial="hidden" animate="visible">
      <Card className="glass-effect h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <TrendingUp className="h-5 w-5 text-primary" />
            Tendência de Manutenções (Últimos 6 Meses)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
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
  );
};

export default MaintenanceTrendChart;
