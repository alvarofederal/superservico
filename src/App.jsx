import React from 'react';
import { Toaster } from '@/components/ui/toaster';
import AppRouter from '@/components/routing/AppRouter';

function App() {
  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}

export default App;