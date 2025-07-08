import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Wrench, ClipboardList, FileText, Users, ArrowRight, Package, BarChart3, Rss } from 'lucide-react';
import PricingTiers from '@/components/pricing/PricingTiers';

const FeatureCard = ({ icon, title, description, delay }) => (
  <motion.div
    initial={{ opacity: 0, y: 50 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.3 }}
    transition={{ duration: 0.5, delay }}
    className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 flex flex-col items-center text-center h-full"
  >
    <div className="p-3 bg-gradient-to-br from-blue-600 to-blue-400 rounded-full mb-4 text-white">
      {React.cloneElement(icon, { className: "h-8 w-8" })}
    </div>
    <h3 className="text-xl font-semibold text-[#1d3156] mb-2">{title}</h3>
    <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
  </motion.div>
);

const LandingPage = () => {
  const currentYear = new Date().getFullYear();
  const videoUrl = "http://jornalismo.portaldaindustria.com.br/cni/Grid/banner_industria.mp4";

  return (
    <div className="min-h-screen flex flex-col bg-white text-[#1d3156] overflow-x-hidden">
      <header className="sticky top-0 z-50 bg-white shadow-md">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-blue-600 to-blue-400 rounded-lg">
              <Wrench className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-[#1d3156]">Super Serviço</h1>
          </Link>
          <nav className="flex items-center space-x-1 sm:space-x-2">
            <Link to="/blog">
              <Button variant="ghost" className="text-[#1d3156] hover:bg-gray-100 text-xs sm:text-sm">
                <Rss className="mr-0 sm:mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Blog</span>
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" className="bg-white text-[#1d3156] border-blue-600 hover:bg-gray-100 text-xs sm:text-sm">Login</Button>
            </Link>
            <Link to="/register">
              <Button className="bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white text-xs sm:text-sm">Cadastre-se</Button>
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        <section className="py-20 md:py-32 text-center relative overflow-hidden bg-white">
          <video autoPlay muted loop playsInline className="bg-video opacity-10">
            <source src={videoUrl} type="video/mp4" />
            Seu navegador não suporta vídeo HTML5.
          </video>
          <div className="container mx-auto px-6 relative z-10">
            <motion.h2 
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              className="text-4xl sm:text-5xl md:text-7xl font-extrabold mb-6 text-[#1d3156]"
            >
              Revolucione a Gestão de Manutenção
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
              className="text-lg sm:text-xl md:text-2xl text-gray-700 mb-10 max-w-3xl mx-auto"
            >
              Com o Super Serviço, otimize suas operações, reduza custos e maximize a eficiência dos seus equipamentos e serviços.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.4, type: "spring", stiffness: 150 }}
            >
              <Link to="/register">
                <Button size="lg" className="text-base sm:text-lg py-3 px-6 sm:px-8 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-xl">
                  Comece Agora <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        <section id="features" className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-6">
            <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-[#1d3156]">Funcionalidades Poderosas</h2>
            <p className="text-base sm:text-lg text-gray-700 text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
              Tudo o que você precisa para uma gestão de manutenção e serviços de excelência, em um só lugar.
            </p>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Wrench />} 
                title="Gestão de Equipamentos" 
                description="Inventário completo, histórico de manutenções, agendamentos preventivos e acompanhamento do ciclo de vida dos seus ativos."
                delay={0.1}
              />
              <FeatureCard 
                icon={<FileText />} 
                title="Solicitações de Serviço Inteligentes" 
                description="Canalize, priorize e acompanhe todas as solicitações de manutenção ou serviços de forma organizada e em tempo real."
                delay={0.2}
              />
              <FeatureCard 
                icon={<ClipboardList />} 
                title="Ordens de Serviço Detalhadas" 
                description="Crie, atribua e gerencie OS com informações completas: custos, peças, horas, checklists e status de aprovação."
                delay={0.3}
              />
              <FeatureCard 
                icon={<Package />} 
                title="Controle de Estoque de Peças" 
                description="Gerencie seu inventário de peças, controle custos, quantidades mínimas e evite paradas por falta de componentes essenciais."
                delay={0.4}
              />
              <FeatureCard 
                icon={<Users />} 
                title="Perfis de Acesso Flexíveis" 
                description="Defina perfis (Admin, Técnico, Cliente) para colaboração segura, com permissões personalizadas para cada funcionalidade."
                delay={0.5}
              />
              <FeatureCard 
                icon={<BarChart3 />} 
                title="Relatórios e Análises" 
                description="Insights valiosos sobre custos, MTTR, MTBF, desempenho de equipamentos e eficiência da equipe com dashboards interativos."
                delay={0.6}
              />
            </div>
          </div>
        </section>
        
        <section id="pricing" className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4 text-[#1d3156]">Planos Flexíveis para Todos</h2>
              <p className="text-base sm:text-lg text-gray-700 text-center mb-12 sm:mb-16 max-w-2xl mx-auto">
                Escolha o plano que melhor se adapta ao tamanho e às necessidades da sua operação.
              </p>
              <PricingTiers lightTheme={true} />
          </div>
        </section>


        <section className="py-20 md:py-28 text-center bg-[#1d3156] text-white">
           <div className="container mx-auto px-6 relative z-10">
            <motion.h2 
              initial={{ opacity: 0, y: -20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-3xl sm:text-4xl font-bold mb-6"
            >
              Pronto para Transformar sua Gestão de Serviços?
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              className="text-base sm:text-lg text-gray-200 mb-10 max-w-xl mx-auto"
            >
              Junte-se a empresas que já estão elevando a eficiência e satisfação dos clientes com o Super Serviço.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.5, delay: 0.3, type: "spring", stiffness: 120 }}
            >
              <Link to="/register">
                <Button size="lg" className="text-base sm:text-lg py-3 px-6 sm:px-8 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white shadow-lg">
                  Experimente Agora
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="py-10 bg-[#f5f5f5] border-t border-gray-300">
        <div className="container mx-auto px-6 text-center text-[#1d3156]">
          <div className="mb-4 space-x-6">
            <Link to="/" className="hover:text-blue-600 text-sm font-medium">Home</Link>
            <a href="#features" className="hover:text-blue-600 text-sm font-medium">Funcionalidades</a>
            <a href="#pricing" className="hover:text-blue-600 text-sm font-medium">Preços</a>
            <Link to="/blog" className="hover:text-blue-600 text-sm font-medium">Blog</Link>
          </div>
        </div>
      </footer>
      <div className="bg-[#444444] py-4">
        <div className="container mx-auto px-6 text-center text-gray-300">
          <p className="text-sm">&copy; {currentYear} Super Serviço. Todos os direitos reservados.</p>
          <p className="text-xs mt-1">Uma solução inovadora para gestão de manutenção e serviços.</p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;