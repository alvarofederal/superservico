
import { supabase } from '@/lib/supabaseClient';
import { logAction } from '@/services/logService';

export const logEquipmentHistory = async (event) => {
  try {
    const { data, error } = await supabase.from('equipment_history').insert([event]);
    if (error) {
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    console.error('Failed to log equipment history:', error);
    await logAction({
        level: 'ERROR',
        tag: 'HISTORY_LOG_ERROR',
        message: `Falha ao registrar histórico do equipamento: ${event.equipment_id}`,
        error: error,
        meta: { event },
        userId: event.user_id,
        companyId: event.company_id,
    });
    return { data: null, error };
  }
};
