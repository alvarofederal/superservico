import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Target, TrendingUp, Calendar, CheckCircle, AlertTriangle, Edit, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

const MaintenanceGoals = ({ maintenanceGoals: initialGoals, setMaintenanceGoals: setGlobalGoals, workOrders }) => {
  const [maintenanceGoals, setMaintenanceGoals] = useState(initialGoals);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '', description: '', type: 'completion_rate', targetValue: 0,
    currentValue: 0, unit: '%', deadline: '', category: 'efficiency'
  });

  useEffect(() => {
    setMaintenanceGoals(initialGoals);
  }, [initialGoals]);

  const goalTypes = {
    completion_rate: 'Taxa de Conclusão', cost_reduction: 'Redução de Custos',
    downtime_reduction: 'Redução de Paradas', preventive_ratio: 'Proporção Preventiva',
    response_time: 'Tempo de Resposta'
  };
  const categories = { efficiency: 'Eficiência', cost: 'Custos', quality: 'Qualidade', safety: 'Segurança' };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.targetValue) {
      toast({ title: "Erro", description: "Por favor, preencha os campos obrigatórios.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    const goalData = {
      ...formData,
      targetValue: parseFloat(formData.targetValue),
      currentValue: parseFloat(formData.currentValue),
      deadline: formData.deadline || null,
    };

    try {
      if (editingGoal) {
        const { data, error } = await supabase.from('maintenance_goals').update({ ...goalData, updatedAt: new Date().toISOString() }).eq('id', editingGoal.id).select().single();
        if (error) throw error;
        setGlobalGoals(prev => prev.map(g => g.id === editingGoal.id ? data : g));
        toast({ title: "Sucesso!", description: "Meta atualizada." });
      } else {
        const { data, error } = await supabase.from('maintenance_goals').insert([{ ...goalData, id: crypto.randomUUID() }]).select().single();
        if (error) throw error;
        setGlobalGoals(prev => [data, ...prev]);
        toast({ title: "Sucesso!", description: "Meta criada." });
      }
      resetForm();
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Error submitting goal:", error);
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '', description: '', type: 'completion_rate', targetValue: 0,
      currentValue: 0, unit: '%', deadline: '', category: 'efficiency'
    });
    setEditingGoal(null);
  };

  const handleEdit = (goal) => {
    setFormData({
      ...goal,
      deadline: goal.deadline ? goal.deadline.split('T')[0] : '',
    });
    setEditingGoal(goal);
    setIsDialogOpen(true);
  };

  const calculateProgress = (current, target) => {
    if (target === 0) return 0;
    return Math.min((current / target) * 100, 100);
  };

  const getProgressColor = (progress) => {
    if (progress >= 90) return '#10b981'; if (progress >= 70) return '#f59e0b';
    if (progress >= 50) return '#3b82f6'; return '#ef4444';
  };

  const getStatusBadge = (progress, deadline) => {
    const today = new Date(); const deadlineDate = deadline ? new Date(deadline) : null;
    const isOverdue = deadlineDate && deadlineDate < today && progress < 100;
    if (progress >= 100) return { label: 'Concluída', color: 'bg-green-500', icon: CheckCircle };
    if (isOverdue) return { label: 'Atrasada', color: 'bg-red-500', icon: AlertTriangle };
    if (progress >= 70) return { label: 'No Prazo', color: 'bg-blue-500', icon: TrendingUp };
    return { label: 'Em Risco', color: 'bg-yellow-500', icon: AlertTriangle };
  };

  const metrics = (() => {
    const totalOrders = workOrders.length;
    const completedOrders = workOrders.filter(o => o.status === 'completed').length;
    const preventiveOrders = workOrders.filter(o => o.type === 'preventive').length;
    const totalCost = workOrders.reduce((sum, o) => sum + (o.actualCost || o.estimatedCost || 0), 0);
    return {
      completionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
      preventiveRatio: totalOrders > 0 ? (preventiveOrders / totalOrders) * 100 : 0,
      averageCost: totalOrders > 0 ? totalCost / totalOrders : 0,
    };
  })();

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div><h1 className="text-3xl font-bold gradient-text">Metas de Manutenção</h1><p className="text-muted-foreground">Defina e acompanhe suas metas</p></div>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsDialogOpen(isOpen); }}>
          <DialogTrigger asChild><Button className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700" onClick={resetForm}><Plus className="h-4 w-4 mr-2" /> Nova Meta</Button></DialogTrigger>
          <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editingGoal ? 'Editar Meta' : 'Nova Meta'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2"><Label htmlFor="title">Título da Meta *</Label><Input id="title" value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} placeholder="Ex: Aumentar taxa de conclusão" /></div>
                <div className="md:col-span-2"><Label htmlFor="description">Descrição</Label><Input id="description" value={formData.description} onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="Descrição detalhada..." /></div>
                <div><Label htmlFor="type">Tipo</Label><Select value={formData.type} onValueChange={(v) => setFormData(p => ({ ...p, type: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(goalTypes).map(([k, l]) => (<SelectItem key={k} value={k}>{l}</SelectItem>))}</SelectContent></Select></div>
                <div><Label htmlFor="category">Categoria</Label><Select value={formData.category} onValueChange={(v) => setFormData(p => ({ ...p, category: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{Object.entries(categories).map(([k, l]) => (<SelectItem key={k} value={k}>{l}</SelectItem>))}</SelectContent></Select></div>
                <div><Label htmlFor="targetValue">Valor Alvo *</Label><Input id="targetValue" type="number" step="0.01" value={formData.targetValue} onChange={(e) => setFormData(p => ({ ...p, targetValue: e.target.value }))} placeholder="100" /></div>
                <div><Label htmlFor="currentValue">Valor Atual</Label><Input id="currentValue" type="number" step="0.01" value={formData.currentValue} onChange={(e) => setFormData(p => ({ ...p, currentValue: e.target.value }))} placeholder="0" /></div>
                <div><Label htmlFor="unit">Unidade</Label><Select value={formData.unit} onValueChange={(v) => setFormData(p => ({ ...p, unit: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="%">%</SelectItem><SelectItem value="R$">R$</SelectItem><SelectItem value="h">Horas</SelectItem><SelectItem value="dias">Dias</SelectItem><SelectItem value="unidades">Unidades</SelectItem></SelectContent></Select></div>
                <div><Label htmlFor="deadline">Prazo</Label><Input id="deadline" type="date" value={formData.deadline} onChange={(e) => setFormData(p => ({ ...p, deadline: e.target.value }))} /></div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{editingGoal ? 'Atualizar' : 'Criar Meta'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}><Card className="glass-effect card-hover"><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium">Taxa de Conclusão</CardTitle><CheckCircle className="h-4 w-4 text-green-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-400">{metrics.completionRate.toFixed(1)}%</div><p className="text-xs text-muted-foreground">Ordens concluídas</p></CardContent></Card></motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}><Card className="glass-effect card-hover"><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium">Manut. Preventiva</CardTitle><Target className="h-4 w-4 text-blue-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-blue-400">{metrics.preventiveRatio.toFixed(1)}%</div><p className="text-xs text-muted-foreground">Do total de ordens</p></CardContent></Card></motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}><Card className="glass-effect card-hover"><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium">Custo Médio</CardTitle><TrendingUp className="h-4 w-4 text-purple-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-purple-400">R$ {metrics.averageCost.toFixed(0)}</div><p className="text-xs text-muted-foreground">Por ordem</p></CardContent></Card></motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}><Card className="glass-effect card-hover"><CardHeader className="pb-2 flex flex-row items-center justify-between"><CardTitle className="text-sm font-medium">Metas Ativas</CardTitle><Target className="h-4 w-4 text-yellow-400" /></CardHeader><CardContent><div className="text-2xl font-bold text-yellow-400">{maintenanceGoals.length}</div><p className="text-xs text-muted-foreground">Metas definidas</p></CardContent></Card></motion.div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {maintenanceGoals.map((goal, index) => {
          const progress = calculateProgress(goal.currentValue, goal.targetValue);
          const status = getStatusBadge(progress, goal.deadline);
          const StatusIcon = status.icon;
          return (<motion.div key={goal.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.1 }}>
            <Card className="glass-effect card-hover h-full"><CardHeader className="pb-3"><div className="flex items-start justify-between"><div className="flex-1"><CardTitle className="text-lg">{goal.title}</CardTitle><p className="text-sm text-muted-foreground">{goalTypes[goal.type]}</p></div><div className="flex items-center gap-2"><Badge variant="outline" className={`${status.color} text-white border-0`}><StatusIcon className="h-3 w-3 mr-1" />{status.label}</Badge><Button variant="ghost" size="icon" onClick={() => handleEdit(goal)} className="h-8 w-8"><Edit className="h-4 w-4" /></Button></div></div></CardHeader>
              <CardContent className="space-y-4">{goal.description && (<p className="text-sm text-muted-foreground">{goal.description}</p>)}
                <div className="flex items-center justify-center"><div className="w-24 h-24"><div className="relative w-full h-full"><svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-gray-700" /><circle cx="50" cy="50" r="40" stroke={getProgressColor(progress)} strokeWidth="8" fill="none" strokeDasharray={`${2 * Math.PI * 40}`} strokeDashoffset={`${2 * Math.PI * 40 * (1 - progress / 100)}`} className="transition-all duration-500 ease-in-out" /></svg><div className="absolute inset-0 flex items-center justify-center"><span className="text-lg font-bold" style={{ color: getProgressColor(progress) }}>{progress.toFixed(0)}%</span></div></div></div></div>
                <div className="space-y-2"><div className="flex justify-between text-sm"><span className="text-muted-foreground">Atual:</span><span className="font-medium">{goal.currentValue} {goal.unit}</span></div><div className="flex justify-between text-sm"><span className="text-muted-foreground">Meta:</span><span className="font-medium">{goal.targetValue} {goal.unit}</span></div>{goal.deadline && (<div className="flex justify-between text-sm"><span className="text-muted-foreground">Prazo:</span><span className="font-medium flex items-center"><Calendar className="h-3 w-3 mr-1" />{new Date(goal.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}</span></div>)}</div>
                <div className="flex justify-center"><Badge variant="secondary" className="text-xs">{categories[goal.category]}</Badge></div>
              </CardContent></Card></motion.div>);
        })}
      </div>
      {maintenanceGoals.length === 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12"><Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">Nenhuma meta definida</h3><p className="text-muted-foreground mb-4">Crie metas para acompanhar o desempenho.</p><Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-to-r from-green-500 to-teal-600"><Plus className="h-4 w-4 mr-2" /> Criar Primeira Meta</Button></motion.div>)}
    </div>);
};
export default MaintenanceGoals;