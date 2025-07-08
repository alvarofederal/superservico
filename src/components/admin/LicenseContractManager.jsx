
import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Edit3, Search, Filter, CreditCard, PlusCircle, ShieldQuestion, FileText as ContractIcon, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import EditLicenseForm from '@/components/admin/license-manager/EditLicenseForm';
import TermsViewerModal from '@/components/admin/TermsViewerModal'; 
import TermsAcceptanceModal from '@/components/admin/license-manager/TermsAcceptanceModal';
import { getStatusBadge, getDaysRemaining } from '@/components/admin/license-manager/utils.jsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const LOCAL_PLAN_STATUS_OPTIONS = [
    { value: 'trialing', label: 'Em Cortesia' }, { value: 'active', label: 'Ativo' },
    { value: 'past_due', label: 'Pagamento Pendente' }, { value: 'canceled', label: 'Cancelado' },
    { value: 'expired', label: 'Expirado' }, { value: 'pending_renewal', label: 'Aguardando Renovação' },
    { value: 'unpaid', label: 'Não Pago' }, { value: 'inactive', label: 'Inativo (Novo)'}
];

const LicensesTable = ({ usersWithLicenses, onEditLicense, onOpenPaymentDialog, onOpenTermsAcceptance, onOpenReAcceptTerms }) => (
  <div className="overflow-x-auto bg-card/50 rounded-lg border shadow-md">
    <Table>
      <TableHeader><TableRow>
          <TableHead>Usuário</TableHead><TableHead>Email</TableHead><TableHead>Plano Atual</TableHead>
          <TableHead>Status</TableHead><TableHead className="text-center">Validade</TableHead><TableHead className="text-right">Ações</TableHead>
      </TableRow></TableHeader>
      <TableBody>
        {usersWithLicenses.map((user) => {
          const validity = getDaysRemaining(user.license);
          const planDisplayName = user.license?.license_type_id?.name || user.license?.plan_name || 'N/A';
          return (
            <TableRow key={user.id} className="hover:bg-muted/50">
              <TableCell className="font-medium text-foreground">{user.full_name}</TableCell>
              <TableCell className="text-muted-foreground">{user.email}</TableCell>
              <TableCell>{planDisplayName}</TableCell>
              <TableCell>{getStatusBadge(user.license?.status)}</TableCell>
              <TableCell className={cn("flex items-center justify-center", validity.color)}>
                <validity.Icon className="h-4 w-4 mr-1.5 shrink-0" />
                <span>{validity.text}</span>
              </TableCell>
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="icon" onClick={() => onEditLicense(user)} title="Editar Licença"><Edit3 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onOpenPaymentDialog(user.license)} title="Gerenciar Pagamentos"><CreditCard className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onOpenTermsAcceptance(user.id, user.full_name)} title="Histórico de Aceite"><ContractIcon className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => onOpenReAcceptTerms(user)} title="Solicitar Novo Aceite"><ShieldQuestion className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);

const LicenseManagerPage = () => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLicenseData, setEditingLicenseData] = useState(null); 
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewingTermsAcceptance, setViewingTermsAcceptance] = useState(null);
  const [isTermsAcceptanceModalOpen, setIsTermsAcceptanceModalOpen] = useState(false);
  const [isReAcceptTermsModalOpen, setIsReAcceptTermsModalOpen] = useState(false);
  const [userForReAcceptTerms, setUserForReAcceptTerms] = useState(null);
  const [documentTypeForReAccept, setDocumentTypeForReAccept] = useState('terms_of_service');

  const { data: allUsers = [], isLoading: isLoadingAllUsers } = useQuery({
    queryKey: ['allUsersForAdmin'],
    queryFn: async () => {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('list-admin-users');
      if (functionError) throw new Error(functionError.message);
      return functionData?.users || [];
    }
  });

  const { data: licenseTypes = [], isLoading: isLoadingTypes } = useQuery({
    queryKey: ['licenseTypes'],
    queryFn: async () => {
      const { data, error } = await supabase.from('license_types').select('*').eq('is_active', true).order('name');
      if (error) throw new Error(error.message);
      return data;
    }
  });

  const { data: usersWithLicenses = [], isLoading: isLoadingUsers } = useQuery({
    queryKey: ['usersWithLicenses'],
    queryFn: async () => {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('list-admin-users');
      if (functionError) throw new Error(functionError.message);
      
      const usersFromFunction = functionData?.users || [];
      const userIds = usersFromFunction.map(u => u.id);
      let licensesMap = {};

      if (userIds.length > 0) {
        const { data: licensesData, error: licensesError } = await supabase.from('licenses').select('*, license_type_id ( id, name, billing_cycle, price, currency )').in('user_id', userIds);
        if (licensesError) throw new Error(licensesError.message);
        licensesData.forEach(lic => { licensesMap[lic.user_id] = { ...lic, plan_name: lic.license_type_id?.name || lic.plan_name }; });
      }

      return usersFromFunction.map(user => ({
        id: user.id, full_name: user.full_name, email: user.email, role: user.role, created_at: user.created_at,
        current_company_id: user.current_company_id, license: licensesMap[user.id] || null,
      }));
    }
  });
  
  const saveLicenseMutation = useMutation({
    mutationFn: async (formData) => {
      const { licenseId, userId, companyId, licenseTypeId, ...updateData } = formData;
      const selectedLicenseType = licenseTypes.find(lt => lt.id === licenseTypeId);

      if ((!companyId || !licenseTypeId) && !licenseId) throw new Error("Empresa e Tipo de Licença são obrigatórios para criar.");
      
      const dataToUpsert = {
        ...updateData, user_id: userId, company_id: companyId, license_type_id: licenseTypeId,
        plan_name: selectedLicenseType?.name || updateData.plan_name,
        start_date: (!updateData.start_date && !licenseId) ? new Date().toISOString() : updateData.start_date,
      };

      if (!licenseId) {
        const { error } = await supabase.from('licenses').insert(dataToUpsert);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('licenses').update(dataToUpsert).eq('id', licenseId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: `Licença ${editingLicenseData?.license?.id ? 'atualizada' : 'criada'}.` });
      queryClient.invalidateQueries(['usersWithLicenses']);
      setIsFormOpen(false);
      setEditingLicenseData(null);
    },
    onError: (error) => toast({ title: "Erro ao Salvar", description: `Falha: ${error.message}`, variant: "destructive" })
  });

  const openEditLicenseForm = (user = {}) => {
    setEditingLicenseData({
      license: user.license || { user_id: user.id, company_id: user.current_company_id },
      userFullName: user.full_name, userId: user.id, companyId: user.current_company_id
    });
    setIsFormOpen(true);
  };
  
  const openPaymentDialog = () => toast({ title: "🚧 Em Breve!", description: "Gerenciamento de pagamentos será implementado aqui." });
  const openTermsAcceptanceDialog = async (userId, userFullName) => {
    try {
      const { data, error } = await supabase.from('user_terms_acceptance').select(`id, accepted_at, terms_and_policies (id, type, version)`).eq('user_id', userId).order('accepted_at', { ascending: false });
      if (error) throw error;
      setViewingTermsAcceptance({ userFullName, acceptances: data });
      setIsTermsAcceptanceModalOpen(true);
    } catch (error) { toast({ title: "Erro ao buscar aceites", description: error.message, variant: "destructive" }); }
  };
  const openReAcceptTermsDialog = (user, docType = 'terms_of_service') => { setUserForReAcceptTerms(user); setDocumentTypeForReAccept(docType); setIsReAcceptTermsModalOpen(true); };
  const handleAdminAcceptedTermsForUser = () => { setIsReAcceptTermsModalOpen(false); setUserForReAcceptTerms(null); toast({ title: "Ação Registrada", description: "O aceite de termos foi registrado (simulação)." }); };

  const filteredUsers = (usersWithLicenses || []).filter(user => {
    const nameMatch = user.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const emailMatch = user.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const statusMatch = filterStatus === 'all' || (user.license && user.license.status === filterStatus) || (filterStatus === 'no_license' && !user.license);
    return (nameMatch || emailMatch) && statusMatch;
  });

  const isLoading = isLoadingUsers || isLoadingTypes || isLoadingAllUsers;

  if (isLoading) return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">Gerenciamento de Licenças</h1>
          <p className="text-muted-foreground">Gerencie planos, status e validades dos usuários.</p>
        </div>
        <Button onClick={() => openEditLicenseForm()}><PlusCircle className="mr-2 h-5 w-5" /> Nova Licença</Button>
      </div>
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-card/50 rounded-lg border">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Buscar por nome ou email..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 text-sm" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full md:w-56 text-sm"><Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
          <SelectContent>{[{value: 'all', label: 'Todos'}, ...LOCAL_PLAN_STATUS_OPTIONS, {value: 'no_license', label: 'Sem Licença'}].map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <LicensesTable usersWithLicenses={filteredUsers} onEditLicense={openEditLicenseForm} onOpenPaymentDialog={openPaymentDialog} onOpenTermsAcceptance={openTermsAcceptanceDialog} onOpenReAcceptTerms={openReAcceptTermsDialog}/>
      
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{editingLicenseData?.license?.id ? 'Editar Licença' : 'Criar Nova Licença'}</DialogTitle>
            <DialogDescription>
              Gerencie a licença para {editingLicenseData?.userFullName}.
            </DialogDescription>
          </DialogHeader>
          {editingLicenseData && (
             <EditLicenseForm 
                initialData={editingLicenseData.license} 
                userFullName={editingLicenseData.userFullName} 
                userId={editingLicenseData.userId} 
                companyId={editingLicenseData.companyId}
                allUsers={allUsers}
                licenseTypes={licenseTypes} 
                onSubmit={(data) => saveLicenseMutation.mutate(data)} 
                onCancel={() => setIsFormOpen(false)} 
                isSubmitting={saveLicenseMutation.isPending} 
              />
          )}
        </DialogContent>
      </Dialog>

      <TermsAcceptanceModal isOpen={isTermsAcceptanceModalOpen} onOpenChange={setIsTermsAcceptanceModalOpen} termsAcceptanceData={viewingTermsAcceptance} onClose={() => setIsTermsAcceptanceModalOpen(false)}/>
      {userForReAcceptTerms && <TermsViewerModal isOpen={isReAcceptTermsModalOpen} setIsOpen={setIsReAcceptTermsModalOpen} documentType={documentTypeForReAccept} onAccepted={handleAdminAcceptedTermsForUser} forUserId={userForReAcceptTerms.id} forUserFullName={userForReAcceptTerms.full_name} onScrolledToEnd={() => {}} />}
    </motion.div>
  );
};
export default LicenseManagerPage;
