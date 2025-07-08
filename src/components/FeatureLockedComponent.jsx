import React from 'react';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const FeatureLockedComponent = ({ featureName, requiredPlan, currentPlan, onUpgrade }) => {
  const navigate = useNavigate();

  const handleUpgradeClick = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/pricing');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="flex flex-col items-center justify-center text-center p-6 sm:p-10 bg-gradient-to-br from-slate-800 via-slate-900 to-indigo-900 rounded-xl shadow-2xl border border-slate-700 text-white"
    >
      <div className="p-4 bg-yellow-400/20 rounded-full mb-6 shadow-lg">
        <Lock className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-400" />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold mb-3">
        <Sparkles className="inline-block h-7 w-7 text-yellow-400 mr-2 mb-1" />
        Desbloqueie {featureName || 'esta Funcionalidade Avançada'}!
      </h2>
      <p className="text-slate-300 mb-2 max-w-md text-sm sm:text-base">
        Este recurso incrível faz parte {requiredPlan ? `do nosso plano ${requiredPlan}` : 'de um plano superior'}.
      </p>
      {currentPlan && (
        <p className="text-slate-400 mb-6 text-xs sm:text-sm">Seu plano atual: <span className="font-semibold text-sky-400">{currentPlan}</span>.</p>
      )}
       {!currentPlan && (
         <p className="text-slate-400 mb-6 text-xs sm:text-sm">Parece que você ainda não possui um plano ativo.</p>
       )}

      <Button 
        onClick={handleUpgradeClick} 
        className="bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-600 hover:to-amber-600 text-slate-900 font-semibold text-base sm:text-lg py-3 px-6 sm:px-8 rounded-lg shadow-xl transition-transform duration-150 hover:scale-105 group"
      >
        Fazer Upgrade Agora <ArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
      </Button>
      <Button 
        variant="link" 
        className="mt-4 text-sky-400 hover:text-sky-300 text-xs sm:text-sm"
        onClick={() => navigate(-1)} 
      >
        Voltar
      </Button>
    </motion.div>
  );
};

export default FeatureLockedComponent;