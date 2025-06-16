import React from 'react';
import { motion } from 'framer-motion';
import { Wrench } from 'lucide-react'; 
import { Link } from 'react-router-dom';

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 p-4 overflow-hidden">
      <motion.div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23A0AEC0' fill-opacity='0.1'%3E%3Cpath d='M30 0c16.568 0 30 13.432 30 30S46.568 60 30 60 0 46.568 0 30 13.432 0 30 0zm0 2c15.464 0 28 12.536 28 28S45.464 58 30 58 2 45.464 2 30 12.536 2 30 2zm0 10a2 2 0 012 2v32a2 2 0 01-4 0V14a2 2 0 012-2zm-16 8a2 2 0 012 2v12a2 2 0 01-4 0V24a2 2 0 012-2zm32 0a2 2 0 012 2v12a2 2 0 01-4 0V24a2 2 0 012-2z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          backgroundRepeat: 'repeat',
        }}
        animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
      />
      
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative z-10 flex flex-col items-center mb-8"
      >
        <Link to="/" className="flex flex-col items-center group">
          <div className="p-4 bg-gradient-to-br from-primary to-blue-500 dark:to-purple-600 rounded-full shadow-2xl mb-4 group-hover:scale-105 transition-transform">
            <Wrench className="h-12 w-12 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 group-hover:brightness-110 transition">
            Super Serviço
          </h1>
        </Link>
        <p className="text-lg text-slate-300 mt-1">SaaS Edition - Bem-vindo!</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="bg-card/80 dark:bg-card/60 backdrop-blur-xl shadow-2xl rounded-xl p-8 border border-slate-700/50">
          {children}
        </div>
      </motion.div>

      {[...Array(5)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-gradient-to-r from-purple-500/30 to-pink-500/30"
          style={{
            width: Math.random() * 100 + 50,
            height: Math.random() * 100 + 50,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            x: [0, Math.random() * 100 - 50, 0],
            y: [0, Math.random() * 100 - 50, 0],
            scale: [1, 1.2, 1],
            opacity: [0, 0.5, 0],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 2,
          }}
        />
      ))}
      <p className="absolute bottom-4 text-xs text-slate-500 z-10">
        © {new Date().getFullYear()} Super Serviço. Todos os direitos reservados.
      </p>
    </div>
  );
};

export default AuthLayout;