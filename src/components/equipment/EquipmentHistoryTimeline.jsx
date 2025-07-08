
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, AlertTriangle, HardHat, FileText, Wrench, Settings } from 'lucide-react';

const eventIcons = {
  SERVICE_REQUEST_CREATED: <FileText className="h-5 w-5 text-blue-500" />,
  CONVERTED_TO_WORK_ORDER: <Settings className="h-5 w-5 text-purple-500" />,
  MAINTENANCE_CREATED: <Wrench className="h-5 w-5 text-yellow-500" />,
  EQUIPMENT_CREATED: <HardHat className="h-5 w-5 text-green-500" />,
  EQUIPMENT_UPDATED: <Settings className="h-5 w-5 text-indigo-500" />,
  DEFAULT: <FileText className="h-5 w-5 text-gray-500" />
};

const EquipmentHistoryTimeline = ({ equipmentId }) => {
  const { data: history, isLoading, isError, error } = useQuery(
    ['equipmentHistory', equipmentId],
    async () => {
      const { data, error } = await supabase
        .from('equipment_history')
        .select('*, profiles(full_name)')
        .eq('equipment_id', equipmentId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    {
      enabled: !!equipmentId,
    }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center text-destructive-foreground bg-destructive/80 p-4 rounded-lg">
        <AlertTriangle className="h-8 w-8 mb-2" />
        <p className="font-semibold">Erro ao carregar histórico</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-10">
        <p>Nenhum evento histórico registrado para este equipamento.</p>
      </div>
    );
  }

  return (
    <div className="relative p-1">
      <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border/40" aria-hidden="true"></div>
      <ScrollArea className="h-[400px]">
        <ul className="space-y-8">
          {history.map((event, index) => (
            <motion.li
              key={event.id}
              className="relative flex items-start space-x-4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-card border border-border/50 flex items-center justify-center z-10">
                {eventIcons[event.event_type] || eventIcons.DEFAULT}
              </div>
              <div className="flex-grow pt-1.5">
                <p className="text-sm font-semibold text-foreground">{event.event_description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(event.created_at).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' })}
                  {event.profiles?.full_name && ` por ${event.profiles.full_name}`}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </ScrollArea>
    </div>
  );
};

export default EquipmentHistoryTimeline;
