import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Wrench, Facebook, Instagram, Linkedin } from 'lucide-react';

const BlogFooter = () => {
  return (
    <footer className="bg-white text-[#1d3156]">
      <div className="bg-gray-50">
        <div className="container mx-auto px-6 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Pronto para Transformar sua Gestão de Serviços?
          </h2>
          <p className="text-lg text-gray-600 mb-8 max-w-3xl mx-auto">
            Junte-se a centenas de empresas que já estão otimizando suas operações, reduzindo custos e aumentando a eficiência com o Super Serviço.
          </p>
          <Link to="/register">
            <Button size="lg" className="bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 text-white text-lg px-8 py-6">
              Comece Agora
            </Button>
          </Link>
        </div>
      </div>
      <div className="bg-[#1d3156] text-white">
        <div className="container mx-auto px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <Link to="/" className="flex items-center gap-2">
                <div className="p-2 bg-white rounded-lg">
                  <Wrench className="h-6 w-6 text-blue-600" />
                </div>
                <h1 className="text-2xl font-bold text-white">Super Serviço</h1>
              </Link>
              <p className="text-gray-300">
                Otimizando a gestão de manutenção e serviços para um futuro mais eficiente.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Soluções</h3>
              <ul className="space-y-2">
                <li><Link to="/#features" className="text-gray-300 hover:text-white">Ordens de Serviço</Link></li>
                <li><Link to="/#features" className="text-gray-300 hover:text-white">Gestão de Ativos</Link></li>
                <li><Link to="/#features" className="text-gray-300 hover:text-white">Manutenção Preventiva</Link></li>
                <li><Link to="/#features" className="text-gray-300 hover:text-white">Relatórios e Análises</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Recursos</h3>
              <ul className="space-y-2">
                <li><Link to="/blog" className="text-gray-300 hover:text-white">Blog</Link></li>
                <li><Link to="/pricing" className="text-gray-300 hover:text-white">Planos</Link></li>
                <li><Link to="/#faq" className="text-gray-300 hover:text-white">FAQ</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4">Empresa</h3>
              <ul className="space-y-2">
                <li><Link to="/#about" className="text-gray-300 hover:text-white">Sobre Nós</Link></li>
                <li><Link to="/#contact" className="text-gray-300 hover:text-white">Contato</Link></li>
                <li><Link to="/terms" className="text-gray-300 hover:text-white">Termos de Serviço</Link></li>
                <li><Link to="/privacy" className="text-gray-300 hover:text-white">Política de Privacidade</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8 flex flex-col sm:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {new Date().getFullYear()} Super Serviço. Todos os direitos reservados.
            </p>
            <div className="flex space-x-4 mt-4 sm:mt-0">
              <a href="#" className="text-gray-400 hover:text-white"><Facebook /></a>
              <a href="#" className="text-gray-400 hover:text-white"><Instagram /></a>
              <a href="#" className="text-gray-400 hover:text-white"><Linkedin /></a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default BlogFooter;