import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import StripeProviderWrapper from '@/components/payment/StripeProviderWrapper';
import StripeCheckoutForm from '@/components/payment/StripeCheckoutForm';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { Loader2, AlertTriangle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';

const PaymentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userProfile, currentCompanyId, refreshAuthData } = useAuth();
  const [clientSecret, setClientSecret] = useState(null);
  const [stripePublishableKey, setStripePublishableKey] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const { planId, planName, planPrice, planRawPrice, planCurrency = 'BRL', stripePriceId } = location.state || {};
  
  useEffect(() => {
    const fetchPaymentConfig = async () => {
      if (!planId || !userProfile || !currentCompanyId || !stripePriceId) {
        setError("Informações do plano, usuário ou empresa ausentes. Não é possível iniciar o pagamento.");
        toast({ title: "Erro de Configuração", description: "Faltam dados para iniciar o pagamento. Selecione um plano novamente.", variant: "destructive"});
        navigate('/pricing');
        return;
      }
      
      setIsLoading(true);
      setError(null);

      try {
        
        const { data: intentData, error: intentError } = await supabase.functions.invoke('create-payment-intent', {
          body: { 
            amount: Math.round(planRawPrice * 100), 
            currency: planCurrency.toLowerCase(), 
            userId: userProfile.id,
            companyId: currentCompanyId,
            licenseTypeId: planId, 
            stripePriceId: stripePriceId 
          }
        });

        if (intentError) throw new Error(`Erro ao criar intenção de pagamento: ${intentError.message}`);
        if (!intentData.clientSecret || !intentData.publishableKey) {
             throw new Error("Resposta inválida da função de criação de pagamento. Chave publicável ou client_secret ausente.");
        }
        
        setClientSecret(intentData.clientSecret);
        setStripePublishableKey(intentData.publishableKey); 

      } catch (err) {
        console.error("Payment Setup Error:", err);
        setError(err.message || "Falha ao configurar o pagamento.");
        toast({ title: "Erro na Configuração do Pagamento", description: err.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPaymentConfig();
  }, [planId, userProfile, currentCompanyId, planRawPrice, planCurrency, navigate, stripePriceId]);

  const handleSuccessfulPayment = async (paymentIntent) => {
    try {
        const { data, error: finalizeError } = await supabase.functions.invoke('handle-successful-payment', {
            body: {
                paymentIntentId: paymentIntent.id,
                userId: userProfile.id,
                companyId: currentCompanyId,
                licenseTypeId: planId,
                planName: planName,
                stripePriceId: stripePriceId,
            }
        });

        if (finalizeError) throw finalizeError;

        toast({ title: "Assinatura Ativada!", description: `Seu plano ${planName} está ativo.`, variant: "success" });
        await refreshAuthData(true);
        navigate('/app');

    } catch (err) {
        console.error("Error finalizing subscription:", err);
        toast({ title: "Erro Pós-Pagamento", description: `Ocorreu um erro ao ativar sua assinatura: ${err.message}. Contate o suporte.`, variant: "destructive", duration: 10000 });
        setError(`Erro ao finalizar assinatura: ${err.message}. Seu pagamento foi processado, mas houve um problema ao ativar o plano. Por favor, contate o suporte com o ID do pagamento: ${paymentIntent.id}`);
    }
  };
  
  const handlePaymentError = (stripeError) => {
    console.error("Stripe Payment Error on Page:", stripeError);
  }

  if (!location.state) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
            <AlertTriangle className="h-16 w-16 text-yellow-400 mb-6" />
            <h1 className="text-3xl font-bold mb-4">Informações do Plano Ausentes</h1>
            <p className="text-lg text-slate-300 mb-8 text-center">Não foi possível carregar os detalhes do plano para pagamento. Por favor, retorne à página de preços e selecione um plano.</p>
            <Button onClick={() => navigate('/pricing')} variant="outline" className="bg-sky-500 hover:bg-sky-400 border-sky-500 text-slate-900">
                Ver Planos
            </Button>
        </div>
    );
  }


  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white">
        <Loader2 className="h-16 w-16 animate-spin text-sky-400 mb-4" />
        <p className="text-xl">Configurando seu pagamento seguro...</p>
      </div>
    );
  }

  if (error || !clientSecret || !stripePublishableKey) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4">
        <AlertTriangle className="h-16 w-16 text-red-500 mb-6" />
        <h1 className="text-3xl font-bold mb-4">Erro na Configuração do Pagamento</h1>
        <p className="text-lg text-red-300 mb-8 text-center max-w-lg">{error || "Não foi possível carregar os detalhes para pagamento. Tente novamente ou contate o suporte."}</p>
        <Button onClick={() => navigate('/pricing')} variant="outline" className="bg-slate-700 hover:bg-slate-600 border-slate-600 text-white">
            Voltar aos Planos
        </Button>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-lg w-full">
            <StripeProviderWrapper stripePublishableKey={stripePublishableKey}>
                <StripeCheckoutForm 
                    clientSecret={clientSecret}
                    onSuccessfulPayment={handleSuccessfulPayment}
                    onPaymentError={handlePaymentError}
                    planName={planName}
                    planPrice={planPrice}
                />
            </StripeProviderWrapper>
        </div>
    </div>
  );
};

export default PaymentPage;