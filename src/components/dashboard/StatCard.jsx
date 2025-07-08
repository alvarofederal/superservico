
import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StatCard = ({ item, index }) => {
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

  return (
    <motion.div custom={index} variants={cardVariants} initial="hidden" animate="visible">
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
  );
};

export default StatCard;
