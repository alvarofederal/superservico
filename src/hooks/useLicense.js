import { useAuth } from './useAuth';
import { getPlanLimits } from '@/config/planLimits';

export const useLicense = () => {
  const { activeLicense } = useAuth();
  
  const limits = getPlanLimits(activeLicense?.planName);

  const checkLimit = (itemType, currentCount) => {
    if (!limits || limits[itemType] === undefined) {
      return { canCreate: true, limit: Infinity };
    }
    const limit = limits[itemType];
    return {
      canCreate: currentCount < limit,
      limit: limit,
      current: currentCount,
    };
  };

  return {
    limits,
    checkLimit,
  };
};