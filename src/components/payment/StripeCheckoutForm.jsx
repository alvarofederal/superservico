import React, { useState, useEffect } from 'react';
import {
  PaymentElement,
  LinkAuthenticationElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const StripeCheckoutForm = ({ clientSecret, onSuccessfulPayment, onPaymentError, planName, planPrice }) => {
  const stripe = useStripe();
  const elements = useElements();

  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!stripe || !clientSecret) {
      return;
    }
    // No need to retrieve PaymentIntent here if clientSecret is passed directly
  }, [stripe, clientSecret]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      setMessage("Stripe.js has not yet loaded.");
      return;
    }

    setIsLoading(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Make sure to change this to your payment completion page
        return_url: `${window.location.origin}/app`, // Or a dedicated payment success/status page
        // receipt_email: email, // Optional: Stripe can send email receipts
      },
      redirect: 'if_required' // This prevents immediate redirection
    });
    
    if (error) {
      if (error.type === "card_error" || error.type === "validation_error") {
        setMessage(error.message);
        toast({ title: "Erro no Pagamento", description: error.message, variant: "destructive" });
      } else {
        setMessage("Ocorreu um erro inesperado.");
        toast({ title: "Erro no Pagamento", description: "Ocorreu um erro inesperado. Tente novamente.", variant: "destructive" });
      }
      if (onPaymentError) onPaymentError(error);
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        setMessage(`Pagamento para ${planName} (${planPrice}) realizado com sucesso! ID: ${paymentIntent.id}`);
        toast({ title: "Pagamento Bem-Sucedido!", description: `Obrigado por assinar o plano ${planName}.` });
        if (onSuccessfulPayment) onSuccessfulPayment(paymentIntent);
    } else if (paymentIntent && paymentIntent.status === 'requires_action') {
        setMessage("Pagamento requer ação adicional.");
        toast({ title: "Ação Necessária", description: "Seu banco requer autenticação adicional para completar este pagamento.", variant: "default" });
        // Handle actions like 3D Secure
    } else {
        setMessage("Status do pagamento: " + paymentIntent?.status);
    }

    setIsLoading(false);
  };

  const paymentElementOptions = {
    layout: "tabs", // "tabs" or "accordion"
    // paymentMethodOrder: ['card', 'pix', 'boleto'] // Customize order if needed
  };

  return (
    <form id="payment-form" onSubmit={handleSubmit} className="space-y-6 p-4 bg-card rounded-lg shadow-lg">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-semibold text-primary">Finalizar Assinatura</h2>
        <p className="text-muted-foreground">Plano: <span className="font-medium text-foreground">{planName}</span> - <span className="font-medium text-foreground">{planPrice}</span></p>
      </div>
      
      <LinkAuthenticationElement
        id="link-authentication-element"
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4"
      />
      <PaymentElement id="payment-element" options={paymentElementOptions} />
      
      <Button disabled={isLoading || !stripe || !elements} id="submit" className="w-full text-lg py-3 mt-6">
        <span id="button-text">
          {isLoading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : `Pagar ${planPrice}`}
        </span>
      </Button>
      
      {message && <div id="payment-message" className="mt-4 text-sm text-center text-destructive p-3 bg-destructive/10 rounded-md">{message}</div>}
    </form>
  );
};

export default StripeCheckoutForm;