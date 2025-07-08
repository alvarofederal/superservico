
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, Zap, BrainCircuit, Loader2, ServerCrash, ArrowRight, FileWarning, UserCheck, Wand2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

const fetchAgentDiagnostics = async () => {
  const { data, error } = await supabase.functions.invoke('system-agent-diagnostics');
  if (error) throw new Error(`Erro ao executar diagnóstico: ${error.message}`);
  return data;
};

const executeCorrectiveAgent = async (agentName) => {
  const { data, error } = await supabase.functions.invoke(agentName);
  if (error) throw new Error(error.message);
  return data;
};

const DiagnosticCard = ({ title, value, description, icon: Icon, color, index }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1, duration: 0.5 }}
  >
    <Card className="glass-effect card-hover h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-5 w-5 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  </motion.div>
);

const FlowStep = ({ title, count, icon: Icon, isBottleneck }) => (
  <div className="flex flex-col items-center text-center">
    <div className={`flex items-center justify-center w-16 h-16 rounded-full ${isBottleneck ? 'bg-destructive/20' : 'bg-primary/10'} border-2 ${isBottleneck ? 'border-destructive' : 'border-primary'}`}>
      <Icon className={`h-8 w-8 ${isBottleneck ? 'text-destructive' : 'text-primary'}`} />
    </div>
    <p className="mt-2 font-semibold text-foreground">{title}</p>
    <p className={`text-2xl font-bold ${isBottleneck ? 'text-destructive' : 'text-foreground'}`}>{count}</p>
  </div>
);

const FlowConnector = () => (
  <div className="flex-1 flex items-center justify-center">
    <ArrowRight className="h-8 w-8 text-muted-foreground/50" />
  </div>
);

const HealthCheckItem = ({ check, onExecuteAgent, isExecuting }) => {
  const statusConfig = {
    ok: { icon: CheckCircle, color: 'text-green-500', label: 'OK' },
    warning: { icon: AlertTriangle, color: 'text-yellow-500', label: 'Atenção' },
    error: { icon: ServerCrash, color: 'text-destructive', label: 'Crítico' },
  };
  const { icon: Icon, color, label } = statusConfig[check.status] || statusConfig.warning;

  const agentForCheck = {
    'wo_without_maintenance': 'agent-fix-wo-without-maintenance',
    'inconsistent_archived_status': 'agent-fix-inconsistent-archive',
  };

  const agentName = agentForCheck[check.id];
  const isCorrectable = agentName && check.status !== 'ok';

  return (
    <div className="flex items-start space-x-4 p-4 border-b border-border/30 last:border-b-0">
      <Icon className={`h-6 w-6 ${color} mt-1 flex-shrink-0`} />
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <p className="font-semibold text-foreground">{check.title}</p>
          <Badge variant={check.status === 'ok' ? 'default' : 'destructive'} className={`${color} bg-opacity-10 border-none`}>{label}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{check.description}</p>
        {check.details && <p className="text-xs mt-1 text-muted-foreground/80">{check.details}</p>}
        {isCorrectable && (
          <div className="mt-3">
            <Button size="sm" variant="outline" onClick={() => onExecuteAgent(agentName)} disabled={isExecuting[agentName]}>
              {isExecuting[agentName] ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4 text-primary" />}
              {isExecuting[agentName] ? 'Corrigindo...' : 'Executar Agente Corretivo'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

const SystemAgentDashboard = () => {
  const queryClient = useQueryClient();
  const [isExecuting, setIsExecuting] = useState({});

  const { data: diagnostics, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['systemAgentDiagnostics'],
    queryFn: fetchAgentDiagnostics,
    refetchInterval: 60000, 
  });
  
  const correctiveAgentMutation = useMutation({
    mutationFn: executeCorrectiveAgent,
    onMutate: (agentName) => {
      setIsExecuting(prev => ({...prev, [agentName]: true}));
    },
    onSuccess: (data, agentName) => {
      toast({
        title: "Agente Concluído!",
        description: data.message,
        action: <ShieldCheck className="h-5 w-5 text-green-500"/>,
      });
      refetch(); 
    },
    onError: (error, agentName) => {
      toast({
        title: "Erro na Execução do Agente",
        description: error.message,
        variant: 'destructive',
      });
    },
    onSettled: (data, error, agentName) => {
      setIsExecuting(prev => ({...prev, [agentName]: false}));
      queryClient.invalidateQueries(['systemAgentDiagnostics']);
    }
  });

  const handleExecuteAgent = (agentName) => {
    correctiveAgentMutation.mutate(agentName);
  };

  if (isLoading && !diagnostics) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)]">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}><BrainCircuit className="h-20 w-20 text-primary mb-4" /></motion.div>
        <h2 className="text-2xl font-semibold text-foreground">Agente em Ação...</h2>
        <p className="text-muted-foreground">Analisando os fluxos e a saúde do sistema.</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-200px)] bg-destructive/10 p-8 rounded-lg">
        <ServerCrash className="h-16 w-16 text-destructive mb-4" />
        <h3 className="text-xl font-semibold text-destructive mb-2">Erro no Diagnóstico</h3>
        <p className="text-destructive/80 text-center max-w-md">O agente não conseguiu completar a análise. Tente novamente mais tarde.</p>
        <p className="text-xs text-muted-foreground mt-4">Detalhe: {error.message}</p>
      </div>
    );
  }

  const { logSummary, flowAnalysis, healthChecks, recentErrors } = diagnostics;

  const diagnosticCards = [
    { title: 'Eventos Registrados (24h)', value: logSummary.total, description: 'Total de logs informativos', icon: Zap, color: 'text-primary', index: 0 },
    { title: 'Alertas (24h)', value: logSummary.warnings, description: 'Logs de aviso que requerem atenção', icon: AlertTriangle, color: 'text-yellow-500', index: 1 },
    { title: 'Erros Críticos (24h)', value: logSummary.errors, description: 'Falhas que impactaram o sistema', icon: ServerCrash, color: 'text-destructive', index: 2 },
    { title: 'Verificações de Saúde', value: `${healthChecks.filter(c => c.status === 'ok').length}/${healthChecks.length}`, description: 'Sistemas operando corretamente', icon: CheckCircle, color: 'text-green-500', index: 3 },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-bold text-foreground flex items-center gap-3"><BrainCircuit className="h-10 w-10 text-primary" />Diagnóstico do Sistema</h1>
        <p className="text-muted-foreground mt-1">Análise de fluxos, saúde e erros da plataforma.</p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {diagnosticCards.map(card => <DiagnosticCard key={card.title} {...card} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full"><CardHeader><CardTitle>Análise de Fluxo de Trabalho</CardTitle><CardDescription>Acompanhe a conversão de solicitações em ordens de serviço.</CardDescription></CardHeader>
            <CardContent className="flex items-center justify-around p-6">
              <FlowStep title="Solicitações Abertas" count={flowAnalysis.openRequests} icon={FileWarning} isBottleneck={flowAnalysis.openRequests > 10 && flowAnalysis.openRequests > flowAnalysis.inProgressOrders * 2} />
              <FlowConnector />
              <FlowStep title="O.S. em Andamento" count={flowAnalysis.inProgressOrders} icon={UserCheck} isBottleneck={false} />
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
          <Card className="h-full"><CardHeader><CardTitle>Verificações de Saúde Corrigíveis</CardTitle><CardDescription>Pontos de atenção e integridade dos dados que podem ser corrigidos por agentes.</CardDescription></CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-[230px]">
                {healthChecks.map(check => <HealthCheckItem key={check.id} check={check} onExecuteAgent={handleExecuteAgent} isExecuting={isExecuting}/>)}
              </ScrollArea>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
        <Card>
          <CardHeader><CardTitle>Diagnóstico de Erros Recentes</CardTitle><CardDescription>Análise dos últimos 5 erros críticos registrados no sistema.</CardDescription></CardHeader>
          <CardContent>
            {recentErrors.length > 0 ? (
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-6">
                  {recentErrors.map(err => (
                    <div key={err.id} className="p-4 rounded-lg bg-destructive/5 border border-destructive/20">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-destructive">{err.tag}</p>
                        <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(err.created_at), { addSuffix: true, locale: ptBR })}</span>
                      </div>
                      <p className="text-sm text-foreground mt-1">{err.message}</p>
                      {err.meta?.suggestion && (
                        <div className="mt-2 p-2 bg-primary/10 rounded-md text-sm">
                          <span className="font-semibold text-primary">Sugestão do Agente:</span> {err.meta.suggestion}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="text-center py-10"><CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" /><p className="font-semibold">Nenhum erro crítico recente!</p><p className="text-sm text-muted-foreground">O sistema está operando sem falhas.</p></div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default SystemAgentDashboard;
