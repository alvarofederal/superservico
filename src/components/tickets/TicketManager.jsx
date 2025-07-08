
import React, { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Plus, Search, Loader2, MessageSquare as MessageSquareWarning, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import TicketForm from '@/components/tickets/TicketForm';
import TicketTable, { TICKET_STATUS_LABELS, TICKET_PRIORITY_LABELS } from '@/components/tickets/TicketTable';
import TicketDetailsModal from '@/components/tickets/TicketDetailsModal';
import { logAction } from '@/services/logService';

const APPLICATION_MODULES_FILTER = ['Todos', 'Login', 'Dashboard', 'Relatórios', 'Manutenções', 'Equipamentos', 'Peças', 'Ordens de Serviço', 'Solicitações', 'Configurações', 'Outro'];

const TicketManager = () => {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();

  const [view, setView] = useState('list');
  const [editingTicket, setEditingTicket] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterModule, setFilterModule] = useState('Todos');
  const [filterDateRange, setFilterDateRange] = useState({ start: '', end: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'descending' });
  const [selectedTicketForDetails, setSelectedTicketForDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const currentUserRole = useMemo(() => {
    if (!userProfile) return 'client'; 
    if (userProfile.role === 'admin') return 'admin';
    if (userProfile.current_company_id && userProfile.role_in_company) return userProfile.role_in_company;
    return userProfile.role;
  }, [userProfile]);
  
  const { data: tickets = [], isLoading, isError, error } = useQuery({
    queryKey: ['tickets', userProfile?.id, currentUserRole, userProfile?.current_company_id, sortConfig],
    queryFn: async () => {
      if (!userProfile) return [];
      let query = supabase.from('tickets').select('*, profiles(full_name)');
      
      if (currentUserRole !== 'admin') {
        if (currentUserRole === 'company_admin' && userProfile.current_company_id) {
            query = query.eq('company_id', userProfile.current_company_id);
        } else {
            query = query.eq('user_id', userProfile.id);
        }
      }

      const { data, error } = await query.order(sortConfig.key, { ascending: sortConfig.direction === 'ascending' });
      if (error) throw new Error(error.message);
      return data.map(t => ({...t, profiles: t.profiles || {full_name: 'N/A'}}));
    },
    enabled: !!userProfile
  });
  
  const deleteMutation = useMutation({
    mutationFn: async (ticketId) => {
      await logAction({ tag: 'TICKET_DELETE_ATTEMPT', message: `Tentativa de excluir chamado ID: ${ticketId}`, meta: { ticketId }, userId: userProfile?.id });
      const { data: images, error: imagesError } = await supabase.from('ticket_images').select('image_url').eq('ticket_id', ticketId);
      if (imagesError) throw imagesError;
      if (images && images.length > 0) {
        const filePaths = images.map(img => new URL(img.image_url).pathname.split('/ticket-attachments/')[1]).filter(Boolean);
        if (filePaths.length > 0) await supabase.storage.from('ticket-attachments').remove(filePaths);
      }
      const { error: deleteError } = await supabase.from('tickets').delete().eq('id', ticketId);
      if (deleteError) throw deleteError;
      await logAction({ tag: 'TICKET_DELETE_SUCCESS', message: `Chamado ID: ${ticketId} excluído com sucesso.`, meta: { ticketId }, userId: userProfile?.id });
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Chamado excluído." });
      queryClient.invalidateQueries(['tickets']);
    },
    onError: async (err) => {
      toast({ title: "Erro ao Excluir", description: err.message, variant: "destructive" });
      await logAction({ level: 'ERROR', tag: 'TICKET_DELETE_ERROR', message: `Falha ao excluir chamado.`, error: err, userId: userProfile?.id });
    }
  });
  
  const openAddForm = () => { setEditingTicket(null); setView('form'); };
  const openEditForm = (ticket) => { setEditingTicket(ticket); setView('form'); };
  const openDetailsModal = (ticket) => { setSelectedTicketForDetails(ticket); setIsDetailsModalOpen(true); };

  const sortedAndFilteredTickets = useMemo(() => {
    return tickets.filter(ticket => {
      const matchesSearch = searchTerm === '' || (ticket.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || (ticket.description || '').toLowerCase().includes(searchTerm.toLowerCase()) || (ticket.application_module || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
      const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
      const matchesModule = filterModule === 'Todos' || ticket.application_module === filterModule;
      let matchesDate = true;
      if (filterDateRange.start && filterDateRange.end) {
        const created = new Date(ticket.created_at); const start = new Date(filterDateRange.start); const end = new Date(filterDateRange.end);
        end.setHours(23, 59, 59, 999); matchesDate = created >= start && created <= end;
      }
      return matchesSearch && matchesStatus && matchesPriority && matchesModule && matchesDate;
    });
  }, [tickets, searchTerm, filterStatus, filterPriority, filterModule, filterDateRange]);

  const requestSort = (key) => {
    let direction = sortConfig.key === key && sortConfig.direction === 'ascending' ? 'descending' : 'ascending';
    setSortConfig({ key, direction }); 
  };
  
  if (isLoading) return <div className="flex justify-center items-center py-10"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (isError) return <div className="text-destructive text-center py-10">Erro ao carregar chamados: {error.message}</div>;

  if (view === 'form') {
    return (
      <motion.div key="form-view" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
          <div className="flex items-center gap-4 mb-6">
              <Button variant="outline" size="icon" onClick={() => setView('list')}><ArrowLeft className="h-4 w-4" /></Button>
              <div><h1 className="text-2xl font-bold text-foreground">{editingTicket ? 'Editar Chamado' : 'Abrir Novo Chamado'}</h1></div>
          </div>
          <Card><CardContent className="p-6">
              <TicketForm initialData={editingTicket} onSubmitSuccess={() => { queryClient.invalidateQueries(['tickets']); setView('list'); }} onCancel={() => setView('list')} />
          </CardContent></Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b">
        <div><h1 className="text-3xl md:text-4xl font-bold flex items-center"><MessageSquareWarning className="mr-3 h-8 w-8 text-primary"/>Gerenciamento de Chamados</h1><p className="text-muted-foreground">Abra, visualize e gerencie os chamados da aplicação.</p></div>
        <Button onClick={openAddForm} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"><Plus className="h-4 w-4 mr-2" /> Novo Chamado</Button>
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 p-4 bg-card/50 rounded-lg shadow-md border">
        <div className="relative flex-1 md:col-span-2 lg:col-span-1 xl:col-span-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" /><Input placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10"/></div>
        <Select value={filterStatus} onValueChange={setFilterStatus}><SelectTrigger><SelectValue placeholder="Filtrar por status" /></SelectTrigger><SelectContent>{[{value: 'all', label: 'Todos Status'}, ...Object.entries(TICKET_STATUS_LABELS).map(([k,v]) => ({value: k, label: v}))].map(s => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}</SelectContent></Select>
        <Select value={filterPriority} onValueChange={setFilterPriority}><SelectTrigger><SelectValue placeholder="Filtrar por prioridade" /></SelectTrigger><SelectContent>{[{value: 'all', label: 'Todas Prioridades'}, ...Object.entries(TICKET_PRIORITY_LABELS).map(([k,v]) => ({value: k, label: v}))].map(p => (<SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>))}</SelectContent></Select>
        <Select value={filterModule} onValueChange={setFilterModule}><SelectTrigger><SelectValue placeholder="Filtrar por módulo" /></SelectTrigger><SelectContent>{APPLICATION_MODULES_FILTER.map(m => (<SelectItem key={m} value={m}>{m}</SelectItem>))}</SelectContent></Select>
        <div className="flex gap-2 items-center md:col-span-2 lg:col-span-3 xl:col-span-1"><Input type="date" value={filterDateRange.start} onChange={e => setFilterDateRange(prev => ({...prev, start: e.target.value}))} title="Data Início"/><span className="text-muted-foreground">-</span><Input type="date" value={filterDateRange.end} onChange={e => setFilterDateRange(prev => ({...prev, end: e.target.value}))} title="Data Fim"/></div>
      </motion.div>
      {sortedAndFilteredTickets.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 bg-card/30 rounded-lg shadow-md border"><MessageSquareWarning className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold mb-2">Nenhum Chamado Encontrado</h3><p className="text-muted-foreground">Tente refinar sua busca ou crie o primeiro chamado.</p></motion.div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
          <TicketTable tickets={sortedAndFilteredTickets} onViewDetails={openDetailsModal} onEdit={openEditForm} onDelete={(ticketId, title) => {
              const ticketToDelete = tickets.find(t => t.id === ticketId);
              return <AlertDialog defaultOpen><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão?</AlertDialogTitle><AlertDialogDescription>Excluir chamado "{ticketToDelete?.title || ticketId}" e seus dados? Esta ação é irreversível.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel asChild><Button variant="outline" onClick={() => toast.dismiss()}>Cancelar</Button></AlertDialogCancel><AlertDialogAction onClick={() => {deleteMutation.mutate(ticketId); toast.dismiss();}} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
            }}
            sortConfig={sortConfig} requestSort={requestSort} currentUserRole={currentUserRole}/>
        </motion.div>
      )}
      {selectedTicketForDetails && <TicketDetailsModal isOpen={isDetailsModalOpen} setIsOpen={setIsDetailsModalOpen} ticket={selectedTicketForDetails} onTicketUpdate={() => queryClient.invalidateQueries(['tickets'])} />}
    </div>
  );
};
export default TicketManager;
