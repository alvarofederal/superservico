import React from 'react';
import PricingTiers from '@/components/pricing/PricingTiers';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const PricingPage = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
      <header className="absolute top-0 left-0 p-6 z-10">
        <Button variant="ghost" onClick={() => navigate(-1)} className="text-white hover:bg-white/10">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </header>
      <div className="text-center pt-24 pb-12 px-4 sm:px-6 lg:px-8">
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        >
          <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
            <span className="block">Escolha o Plano Perfeito</span>
            <span className="block text-sky-400">para sua Operação</span>
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-xl text-slate-300">
            Desbloqueie todo o potencial do Super Serviço e leve sua gestão de manutenção a um novo nível.
          </p>
        </motion.div>
      </div>
      <PricingTiers lightTheme={false} />
    </div>
  );
};

export default PricingPage;