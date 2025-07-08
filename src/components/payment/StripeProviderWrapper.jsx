import React from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

// Make sure to replace with your actual Stripe publishable key
// const stripePromise = loadStripe('YOUR_STRIPE_PUBLISHABLE_KEY');

const StripeProviderWrapper = ({ children, stripePublishableKey }) => {
  if (!stripePublishableKey) {
    console.error("Stripe Publishable Key is not provided to StripeProviderWrapper.");
    return <div className="text-center p-4 bg-red-100 text-red-700">Erro: Chave Stripe não configurada. O pagamento não pode ser processado.</div>;
  }
  const stripePromise = loadStripe(stripePublishableKey);

  return (
    <Elements stripe={stripePromise}>
      {children}
    </Elements>
  );
};

export default StripeProviderWrapper;