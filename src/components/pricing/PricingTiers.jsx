import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CheckCircle, Loader2, Star, ShieldCheck, XCircle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { getPlanLimits } from '@/config/planLimits.js';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 40, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 120,
      damping: 15,
    },
  },
};

const PricingTiers = ({ lightTheme = false }) => {
  const { userProfile, refreshAuthData, activeLicense, currentCompanyId: authCurrentCompanyIdFromHook } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isSubscribing, setIsSubscribing] = useState(null);
  const [billingCycle, setBillingCycle] = useState('monthly');

  useEffect(() => {
    const fetchLicenseTypes = async () => {
      setIsLoadingPlans(true);
      try {
        const { data, error } = await supabase.from('license_types').select('*').eq('is_active', true).order('price', { ascending: true });
        if (error) throw error;
        setPlans(data || []);
      } catch (error) {
        toast({ title: "Erro ao carregar planos", description: "Não foi possível buscar os detalhes dos planos.", variant: "destructive" });
        setPlans([]);
      } finally {
        setIsLoadingPlans(false);
      }
    };
    fetchLicenseTypes();
  }, []);

  const handleChoosePlan = async (chosenPlan) => {
    if (!userProfile) {
      toast({ title: "Autenticação Necessária", description: "Faça login ou crie uma conta para escolher um plano.", variant: "default" });
      navigate('/login');
      return;
    }
    
    let companyIdToUse = authCurrentCompanyIdFromHook;
    if (!companyIdToUse) {
      const refreshedAuthState = await refreshAuthData(false);
      companyIdToUse = refreshedAuthState?.companyId || refreshedAuthState?.profile?.current_company_id;
      if (!companyIdToUse) {
         toast({ title: "Empresa Não Encontrada", description: "Por favor, crie ou selecione uma empresa antes de assinar um plano.", variant: "destructive" });
         navigate('/app', { state: { activeTab: 'company-management' } });
         return;
      }
    }

    setIsSubscribing(chosenPlan.id);
    try {
      const startDate = new Date();
      let endDate = null;

      if (chosenPlan.billing_cycle === 'monthly') { endDate = new Date(startDate); endDate.setMonth(startDate.getMonth() + 1); } 
      else if (chosenPlan.billing_cycle === 'annually') { endDate = new Date(startDate); endDate.setFullYear(startDate.getFullYear() + 1); }
      
      const licensePayload = {
        user_id: userProfile.id, company_id: companyIdToUse, license_type_id: chosenPlan.id, plan_name: chosenPlan.name,
        status: 'active', start_date: startDate.toISOString(), end_date: endDate ? endDate.toISOString() : null
      };
      
      const { data: foundLicenses } = await supabase.from('licenses').select('id').eq('user_id', userProfile.id).eq('company_id', companyIdToUse);
      if (foundLicenses && foundLicenses.length > 0) {
        await supabase.from('licenses').update(licensePayload).eq('id', foundLicenses[0].id);
      } else {
        await supabase.from('licenses').insert(licensePayload);
      }
      
      toast({ title: `Plano ${foundLicenses && foundLicenses.length > 0 ? 'Atualizado' : 'Assinado'}!`, description: `Você agora está no ${chosenPlan.name}.`, duration: 5000 });
      await refreshAuthData(true); 
      navigate('/app');
    } catch (error) {
      console.error("Subscription Error:", error);
      toast({ title: "Erro ao escolher plano", description: error.message, variant: "destructive" });
    } finally {
      setIsSubscribing(null);
    }
  };

  const getFeaturesList = (planName) => {
    const limits = getPlanLimits(planName);
    if (!limits) return [];
    
    const features = [
      `${limits.companies} Empresa(s)`,
      `${limits.users} Usuário(s)`,
      `${limits.equipment} Equipamento(s)`,
      `${limits.requests} Solicitação(ões)`,
    ];

    if (planName.toLowerCase().includes('profissional') || planName.toLowerCase().includes('ultimate')) {
      features.push(limits.workOrders > 0 ? `${limits.workOrders} Ordem(ns) de Serviço` : 'Nenhuma Ordem de Serviço');
      features.push(limits.maintenances > 0 ? `${limits.maintenances} Manutenção(ões)` : 'Nenhuma Manutenção');
    }
    
    features.push(`${limits.parts} Peça(s) no inventário`);
    
    if (limits.features.qrcode) {
        features.push('Scanner de QRCode Incluso');
    }

    return features;
  };

  const filteredPlans = plans
    .filter(plan => {
        if (plan.name.toLowerCase().includes('cortesia') || plan.name.toLowerCase().includes('ultimate')) return true;
        return billingCycle === 'monthly' ? plan.billing_cycle === 'monthly' : plan.billing_cycle === 'annually';
    })
    .sort((a, b) => {
        const order = ['Cortesia', 'Básico', 'Profissional', 'Ultimate'];
        const nameA = a.name.split(' ')[0];
        const nameB = b.name.split(' ')[0];
        return order.indexOf(nameA) - order.indexOf(nameB);
    });

  const currentPlanId = activeLicense?.license_type_id;

  const cardClass = lightTheme ? 'bg-white/80 border-gray-200/80 shadow-lg' : 'bg-slate-800/60 border-slate-700/80 backdrop-blur-sm shadow-2xl';
  const highlightedCardClass = lightTheme ? 'border-2 border-blue-600 bg-blue-50/80' : 'border-2 border-sky-500 bg-slate-800/90';
  const textColor = lightTheme ? 'text-[#1d3156]' : 'text-white';
  const mutedTextColor = lightTheme ? 'text-gray-600' : 'text-slate-300';
  const featureTextColor = lightTheme ? 'text-gray-700' : 'text-slate-300';
  const titleColor = lightTheme ? 'text-blue-700' : 'text-sky-300';
  
  return (
    <div className={`w-full py-12 px-4 sm:px-6 lg:px-8 ${lightTheme ? 'bg-gray-50' : ''}`}>
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center mb-12">
        <div className="flex items-center justify-center space-x-4 mb-8">
          <Label htmlFor="billing-cycle-switch" className={`text-lg font-medium ${mutedTextColor}`}>Mensal</Label>
          <Switch id="billing-cycle-switch" checked={billingCycle === 'annually'} onCheckedChange={(checked) => setBillingCycle(checked ? 'annually' : 'monthly')} />
          <Label htmlFor="billing-cycle-switch" className={`text-lg font-medium ${mutedTextColor}`}>Anual <span className="text-sm text-green-500 font-bold">(Economize!)</span></Label>
        </div>

        {activeLicense && (activeLicense.status === 'active' || activeLicense.status === 'trialing') && (
          <p className="mt-4 text-lg text-green-400 font-semibold">
            <ShieldCheck className="inline h-6 w-6 mr-2" />
            Seu plano atual: {activeLicense.planName}
          </p>
        )}
      </motion.div>

      {isLoadingPlans ? (
        <div className="flex justify-center items-center h-64"><Loader2 className={`h-16 w-16 animate-spin ${lightTheme ? 'text-blue-600' : 'text-sky-400'}`} /></div>
      ) : (
        <motion.div 
            className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
          <AnimatePresence>
            {filteredPlans.map((plan) => {
              const isHighlighted = plan.name.toLowerCase().includes('profissional');
              const features = getFeaturesList(plan.name);
              return (
                <motion.div
                  key={plan.id}
                  layout
                  variants={itemVariants}
                  whileHover={{ 
                      y: -12, 
                      scale: 1.04, 
                      boxShadow: lightTheme 
                        ? '0 25px 50px -12px rgb(0 0 0 / 0.25)' 
                        : '0px 0px 30px 4px rgba(56, 189, 248, 0.35)',
                      transition: { type: 'spring', stiffness: 250, damping: 15 }
                  }}
                  className="flex"
                >
                  <Card className={`w-full flex flex-col rounded-xl transition-all duration-300 ease-in-out relative overflow-hidden ${isHighlighted ? highlightedCardClass : cardClass}`}>
                    {isHighlighted && (
                      <div className={`absolute -top-3 -right-3 text-white text-xs font-semibold px-3 py-1 rounded-full shadow-lg transform rotate-6 ${lightTheme ? 'bg-blue-600' : 'bg-sky-500'}`}>
                        <Star className="inline h-4 w-4 mr-1 mb-0.5" /> MAIS POPULAR
                      </div>
                    )}
                    <CardHeader className="p-6 md:p-8 text-center">
                      <CardTitle className={`text-2xl lg:text-3xl font-bold ${isHighlighted ? titleColor : (lightTheme ? 'text-blue-800' : 'text-sky-400')}`}>{plan.name.replace(' Mensal', '').replace(' Anual', '')}</CardTitle>
                      <CardDescription className={`mt-2 text-3xl lg:text-4xl font-extrabold ${textColor}`}>
                        {plan.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </CardDescription>
                      <p className={`text-xs lg:text-sm ${mutedTextColor}`}>{plan.billing_cycle === 'monthly' ? '/mês' : plan.billing_cycle === 'annually' ? '/ano' : 'pagamento único'}</p>
                    </CardHeader>
                    <CardContent className="flex-grow px-6 md:px-8 pb-8 space-y-4">
                      <ul className="space-y-3">
                        {features.map((feature, i) => (
                          <li key={i} className="flex items-start">
                            <CheckCircle className="flex-shrink-0 h-5 w-5 text-green-500 mr-2 mt-0.5" />
                            <span className={`${featureTextColor} text-sm`}>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                    <CardFooter className={`p-6 md:p-8 mt-auto border-t ${lightTheme ? 'border-gray-200' : 'border-slate-700/50'}`}>
                      <Button
                        className={`w-full text-base lg:text-lg py-3 shadow-lg transition-transform duration-150 hover:scale-105 ${
                          currentPlanId === plan.id && (activeLicense?.status === 'active' || activeLicense?.status === 'trialing')
                            ? 'bg-green-600 hover:bg-green-700 text-white font-semibold cursor-not-allowed'
                            : isHighlighted 
                              ? (lightTheme ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-sky-500 hover:bg-sky-400 text-slate-900 font-semibold')
                              : (lightTheme ? 'bg-gray-800 hover:bg-black text-white' : 'bg-slate-700 hover:bg-slate-600 text-white')
                        }`}
                        onClick={() => !(currentPlanId === plan.id && (activeLicense?.status === 'active' || activeLicense?.status === 'trialing')) && handleChoosePlan(plan)}
                        disabled={isSubscribing === plan.id || isLoadingPlans || (currentPlanId === plan.id && (activeLicense?.status === 'active' || activeLicense?.status === 'trialing'))}
                      >
                        {isSubscribing === plan.id ? ( <Loader2 className="mr-2 h-5 w-5 animate-spin" /> ) : 
                          currentPlanId === plan.id && (activeLicense?.status === 'active' || activeLicense?.status === 'trialing') ? ( 'Plano Atual' ) : ( 'Escolher Plano' )
                        }
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              )
            })}
          </AnimatePresence>
        </motion.div>
      )}
      {!lightTheme && (
         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }} className="mt-16 text-center">
            <Button variant="outline" onClick={() => navigate('/app')} className="mt-8 bg-transparent border-slate-600 hover:bg-slate-700/50 hover:border-slate-500 text-slate-300">
                <XCircle className="mr-2 h-4 w-4"/> Voltar para a Aplicação
            </Button>
        </motion.div>
      )}
    </div>
  );
};

export default PricingTiers;