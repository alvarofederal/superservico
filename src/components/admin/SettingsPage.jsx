import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { List, Shield, FileText, Settings as SettingsIcon, Users, CreditCard, Ticket, Newspaper, Gift, BrainCircuit } from 'lucide-react';

const settingsOptions = [
  {
    title: "Diagnóstico do Sistema",
    description: "Agente IA para análise de fluxos, saúde e erros.",
    icon: BrainCircuit,
    path: "/app/settings/system-agent",
    color: "text-teal-500",
    bgColor: "bg-teal-50"
  },
  {
    title: "Parâmetros do Sistema",
    description: "Configure parâmetros globais e funcionalidades.",
    icon: SettingsIcon,
    path: "/app/settings/system-parameters",
    color: "text-blue-500",
    bgColor: "bg-blue-50"
  },
  {
    title: "Tipos de Licença",
    description: "Gerencie os tipos de planos e licenças disponíveis.",
    icon: Shield,
    path: "/app/settings/licenses-contracts",
    color: "text-green-500",
    bgColor: "bg-green-50"
  },
    {
    title: "Promoções",
    description: "Crie e gerencie cupons de desconto para seus planos.",
    icon: Gift,
    path: "/app/settings/promotions",
    color: "text-purple-500",
    bgColor: "bg-purple-50"
  },
  {
    title: "Termos e Políticas",
    description: "Edite os Termos de Serviço e as Políticas de Privacidade.",
    icon: FileText,
    path: "/app/settings/terms-policies",
    color: "text-yellow-500",
    bgColor: "bg-yellow-50"
  },
  {
    title: "Usuários do Sistema",
    description: "Gerencie todos os usuários da plataforma.",
    icon: Users,
    path: "/app/user-management",
    color: "text-indigo-500",
    bgColor: "bg-indigo-50"
  },
  {
    title: "Logs do Sistema",
    description: "Visualize os logs de atividade do sistema.",
    icon: List,
    path: "/app/settings/system-logs",
    color: "text-gray-500",
    bgColor: "bg-gray-50"
  },
    {
    title: "Chamados de Suporte",
    description: "Gerencie e responda aos tickets de suporte dos usuários.",
    icon: Ticket,
    path: "/app/settings/tickets",
    color: "text-orange-500",
    bgColor: "bg-orange-50"
  },
   {
    title: "Gestão do Blog",
    description: "Crie, edite e gerencie as postagens do blog.",
    icon: Newspaper,
    path: "/app/settings/blog-management",
    color: "text-pink-500",
    bgColor: "bg-pink-50"
  }
];

const SettingsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="p-4 md:p-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">Configurações de Administrador</CardTitle>
          <CardDescription className="text-lg text-muted-foreground">
            Acesse e gerencie as configurações globais da plataforma Super Serviço.
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {settingsOptions.map((option, index) => (
          <Card 
            key={index} 
            className="hover:shadow-lg transition-shadow duration-300 cursor-pointer group"
            onClick={() => navigate(option.path)}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className={`p-3 rounded-full ${option.bgColor}`}>
                <option.icon className={`h-6 w-6 ${option.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <h3 className="text-xl font-bold">{option.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{option.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default SettingsPage;
