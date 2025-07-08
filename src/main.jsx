
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { HelmetProvider } from 'react-helmet-async';
import App from '@/App';
import { AuthProvider } from '@/context/AuthProvider.jsx';
import { ThemeProvider } from '@/context/ThemeProvider.jsx';
import '@/index.css';
import 'react-day-picker/dist/style.css';
import 'react-quill/dist/quill.snow.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: false,
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <ThemeProvider>
          <HelmetProvider>
            <AuthProvider>
              <App />
            </AuthProvider>
          </HelmetProvider>
        </ThemeProvider>
      </Router>
    </QueryClientProvider>
  </React.StrictMode>
);
