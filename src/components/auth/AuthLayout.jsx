import React from 'react';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTheme } from '@/context/ThemeProvider';

const AuthLayout = ({ children }) => {
  const { theme } = useTheme();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 overflow-hidden relative">
      <div className="absolute inset-0 z-0 opacity-50 dark:opacity-100">
        <motion.div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M80 0v80H0V0h80zM40 0v80M0 40h80'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat',
          }}
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
        />
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/10 dark:bg-primary/20 blur-2xl"
            style={{
              width: Math.random() * 200 + 100,
              height: Math.random() * 200 + 100,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50, 0],
              y: [0, Math.random() * 100 - 50, 0],
              scale: [1, 1.3, 1],
              opacity: [0, 0.8, 0],
            }}
            transition={{
              duration: Math.random() * 20 + 15,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: i * 3,
            }}
          />
        ))}
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center mb-8"
      >
        <Link to="/" className="flex flex-col items-center group">
          <div className="p-4 bg-gradient-to-br from-primary to-blue-500 rounded-full shadow-2xl mb-4 group-hover:scale-105 transition-transform">
            <Wrench className="h-12 w-12 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold text-foreground group-hover:brightness-110 transition">
            Super Serviço
          </h1>
        </Link>
        <p className="text-lg text-muted-foreground mt-1">Super SaaS Edition!</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-card/80 dark:bg-card/70 backdrop-blur-lg shadow-2xl rounded-xl p-8 border border-border/50">
          {children}
        </div>
      </motion.div>
      
      <p className="absolute bottom-4 text-xs text-muted-foreground z-10">
        © {new Date().getFullYear()} Super Serviço. Todos os direitos reservados.
      </p>
    </div>
  );
};

export default AuthLayout;