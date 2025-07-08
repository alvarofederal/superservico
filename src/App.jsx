
import React, { Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { Toaster } from '@/components/ui/toaster';
import AppRouter from '@/components/routing/AppRouter';
import { Loader2 } from 'lucide-react';

function App() {
  return (
    <>
      <Helmet>
        <title>Super Serviço - Gestão Inteligente</title>
        <meta name="description" content="Plataforma completa para gerenciamento de equipamentos, serviços e manutenções. Otimize sua operação com nossa solução inteligente." />
      </Helmet>
      <Suspense fallback={<div className="flex justify-center items-center min-h-screen bg-background"><Loader2 className="h-24 w-24 animate-spin text-primary" /></div>}>
        <AppRouter />
        <Toaster />
      </Suspense>
    </>
  );
}

export default App;
