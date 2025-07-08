
import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Archive, FolderArchive as Unarchive, Lock, Clock, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { useLicense } from '@/hooks/useLicense';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

const statusLabels = { pending: 'Pendente', 'in-progress': 'Em Andamento', completed: 'Concluída', cancelled: 'Cancelada' };
const priorityLabels = { low: 'Baixa', medium: 'Média', high: 'Alta', critical: 'Crítica' };

const WorkOrderHeader = ({ 
  showArchived, 
  workOrders, 
  onToggleArchived, 
  onSearch, 
  onFilterStatus, 
  onFilterPriority,
  searchTerm,
  filterStatus,
  filterPriority
}) => {
  const navigate = useNavigate();
  const { limits } = useLicense();
  const { hasAccess } = useAuth();
  
  const workOrdersLimit = limits.workOrders;
  const activeOrders = workOrders.filter(o => !o.is_archived);
  const isAtLimit = workOrdersLimit !== Infinity && activeOrders.length >= workOrdersLimit;
  const canCreate = hasAccess('work_orders_management');

  const pendingOrdersCount = activeOrders.filter(o => o.status === 'pending').length;
  const inProgressOrdersCount = activeOrders.filter(o => o.status === 'in-progress').length;
  const completedOrdersCount = activeOrders.filter(o => o.status === 'completed').length;
  const totalCost = activeOrders.reduce((sum, o) => sum + (o.actualcost || o.estimatedcost || 0), 0);
  
  return (
    <>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{showArchived ? 'Ordens de Serviço Arquivadas' : 'Ordens de Serviço'}</h1>
          <p className="text-muted-foreground">{showArchived ? 'Visualize ordens de serviço antigas.' : 'Gerencie todas as ordens de manutenção'}</p>
          {!showArchived && <p className="text-sm text-amber-500 mt-1 font-medium">{activeOrders.length}/{workOrdersLimit === Infinity ? '∞' : workOrdersLimit} ordens. {isAtLimit && " Limite do plano atingido."}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onToggleArchived}>
            {showArchived ? <Unarchive className="h-4 w-4 mr-2" /> : <Archive className="h-4 w-4 mr-2" />}
            {showArchived ? 'Ver Ativas' : 'Ver Arquivo'}
          </Button>
          <Button onClick={() => navigate('/app/work-orders?action=new')} disabled={isAtLimit || !canCreate} title={isAtLimit ? `Limite de ${workOrdersLimit} Ordens de Serviço atingido.` : "Nova Ordem"}>
            <Plus className="h-4 w-4 mr-2" /> Nova Ordem {isAtLimit && <Lock className="ml-1 h-3 w-3"/>}
          </Button>
        </div>
      </motion.div>

      {!showArchived && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}>
            <Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pendentes</CardTitle><Clock className="h-4 w-4 text-yellow-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-400">{pendingOrdersCount}</div></CardContent></Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}>
            <Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Em Andamento</CardTitle><AlertCircle className="h-4 w-4 text-blue-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-400">{inProgressOrdersCount}</div></CardContent></Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}>
            <Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Concluídas</CardTitle><CheckCircle className="h-4 w-4 text-green-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-400">{completedOrdersCount}</div></CardContent></Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}>
            <Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Custo Total</CardTitle><DollarSign className="h-4 w-4 text-green-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-400">R$ {totalCost.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div></CardContent></Card>
          </motion.div>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" /><Input placeholder="Buscar ordens de serviço..." value={searchTerm} onChange={(e) => onSearch(e.target.value)} className="pl-10" /></div>
        <Select value={filterStatus} onValueChange={onFilterStatus}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filtrar por status" /></SelectTrigger><SelectContent><SelectItem value="all">Todos Status</SelectItem>{Object.entries(statusLabels).map(([k,v])=>(<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select>
        <Select value={filterPriority} onValueChange={onFilterPriority}><SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filtrar por prioridade" /></SelectTrigger><SelectContent><SelectItem value="all">Todas Prioridades</SelectItem>{Object.entries(priorityLabels).map(([k,v])=>(<SelectItem key={k} value={k}>{v}</SelectItem>))}</SelectContent></Select>
      </motion.div>
    </>
  );
};

export default WorkOrderHeader;
