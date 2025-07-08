
import { supabase } from '@/lib/supabaseClient';

export const logAction = async ({
  level = 'INFO',
  tag,
  message,
  meta,
  error,
  userId,
  companyId,
}) => {
  try {
    const logEntry = {
      level,
      tag,
      message,
      meta,
      error_stack: error ? (error.stack || error.toString()) : null,
      user_id: userId,
      company_id: companyId,
    };

    const { error: logError } = await supabase.from('system_logs').insert([logEntry]);

    if (logError) {
      console.error('Failed to write to system_logs:', logError);
    }
  } catch (e) {
    console.error('Catastrophic failure in logAction service:', e);
  }
};
