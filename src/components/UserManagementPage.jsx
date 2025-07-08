
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2, UserPlus, Search, Filter, Users, Lock, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLicense } from '@/hooks/useLicense';
import UserForm from '@/components/user-management/UserForm';
import UserTable from '@/components/user-management/UserTable';
import UserParametersEditor from '@/components/admin/UserParametersEditor'; 
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { logAction } from '@/services/logService';

const ROLES = ['admin', 'technician', 'client'];

const UserManagementPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { userProfile } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('list');
  const [editingUser, setEditingUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isUserParamsModalOpen, setIsUserParamsModalOpen] = useState(false);
  const [selectedUserForParams, setSelectedUserForParams] = useState(null);
  const [allCompanies, setAllCompanies] = useState([]);
  const [highlightedUserId, setHighlightedUserId] = useState(null);
  const { limits } = useLicense();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const usersLimit = limits.users;
  const isAtLimit = usersLimit !== Infinity && users.length >= usersLimit;

  const fetchAllCompanies = useCallback(async () => {
    const { data, error } = await supabase.from('companies').select('id, name').order('name');
    if (error) {
      toast({title: "Erro ao buscar empresas", description: error.message, variant: "destructive"});
      setAllCompanies([]);
    } else {
      setAllCompanies(data || []);
    }
  }, []);

  useEffect(() => {
    fetchAllCompanies();
    const highlightId = searchParams.get('highlight_user_id');
    if (highlightId) {
        setHighlightedUserId(highlightId);
    }
  }, [searchParams, fetchAllCompanies]);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: functionData, error: functionError } = await supabase.functions.invoke('list-admin-users');
      if (functionError) throw functionError;
      
      const userListFromFunction = functionData?.users || [];
      let companiesMap = {};

      if (allCompanies.length > 0) {
        allCompanies.forEach(c => companiesMap[c.id] = c.name);
      } else { 
        const companyIdsToFetch = userListFromFunction.map(u => u.current_company_id).filter(id => id && !companiesMap[id]);
        if (companyIdsToFetch.length > 0) {
            const { data: fetchedCompanies, error: companiesError } = await supabase.from('companies').select('id, name').in('id', [...new Set(companyIdsToFetch)]);
            if (companiesError) console.warn("Error fetching specific company names:", companiesError);
            else (fetchedCompanies || []).forEach(c => companiesMap[c.id] = c.name);
        }
      }

      const formattedUsers = userListFromFunction.map(u => ({
        id: u.id, email: u.email, created_at: u.created_at, last_sign_in_at: u.last_sign_in_at,
        full_name: u.full_name || u.user_metadata?.full_name || u.email?.split('@')[0] || 'N/A',
        role: u.role || u.user_metadata?.role || 'client',
        avatar_url: u.avatar_url || u.user_metadata?.avatar_url,
        current_company_id: u.current_company_id || u.user_metadata?.current_company_id,
        current_company_name: companiesMap[u.current_company_id || u.user_metadata?.current_company_id] || (u.current_company_id ? 'Carregando...' : 'N/A'),
        user_metadata: u.user_metadata,
      }));
      setUsers(formattedUsers);
    } catch (error) {
      toast({ title: "Erro ao buscar usuários", description: `Falha: ${error.message}.`, variant: "destructive", duration: 10000 });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [allCompanies]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleFormSubmit = async ({ userId, email, fullName, role, password, currentCompanyId }) => {
    if (!editingUser && isAtLimit) {
      toast({ title: "Limite Atingido", description: `Seu plano permite até ${usersLimit} usuários.`, variant: "default" });
      return;
    }
    setIsSubmitting(true);
    const isEditing = !!editingUser;
    const logTag = isEditing ? 'ADMIN_USER_UPDATE' : 'ADMIN_USER_CREATE';
    await logAction({ tag: `${logTag}_ATTEMPT`, message: `Tentativa de ${isEditing ? 'atualizar' : 'criar'} usuário: "${email}"`, meta: { role, fullName, currentCompanyId }, userId: userProfile?.id });
    try {
      if (isEditing && userId) {
        const { error } = await supabase.functions.invoke('update-admin-user', { body: { userId, fullName, role, currentCompanyId } });
        if (error) throw error;
        toast({ title: "Sucesso!", description: "Usuário atualizado." });
        await logAction({ tag: `${logTag}_SUCCESS`, message: `Usuário "${email}" atualizado com sucesso.`, meta: { updatedUserId: userId }, userId: userProfile?.id });
      } else {
        const { error } = await supabase.functions.invoke('create-admin-user', { body: { email, password, fullName, role, currentCompanyId } });
        if (error) throw error;
        toast({ title: "Sucesso!", description: `Usuário ${email} criado.` });
        await logAction({ tag: `${logTag}_SUCCESS`, message: `Usuário "${email}" criado com sucesso.`, meta: { email, role }, userId: userProfile?.id });
      }
      fetchUsers();
      setView('list');
      setEditingUser(null);
    } catch (error) {
      toast({ title: "Erro", description: `Falha: ${error.message}.`, variant: "destructive" });
      await logAction({ level: 'ERROR', tag: `${logTag}_ERROR`, message: `Falha ao ${isEditing ? 'atualizar' : 'criar'} usuário: "${email}"`, error, userId: userProfile?.id });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteUser = async (userId, userEmail) => {
    await logAction({ tag: 'ADMIN_USER_DELETE_ATTEMPT', message: `Tentativa de excluir usuário: "${userEmail}"`, meta: { userIdToDelete: userId }, userId: userProfile?.id });
    try {
      const { error } = await supabase.functions.invoke('delete-admin-user', { body: { userId } });
      if (error) throw error;
      toast({ title: "Sucesso!", description: `Usuário ${userEmail} excluído.` });
      await logAction({ tag: 'ADMIN_USER_DELETE_SUCCESS', message: `Usuário "${userEmail}" excluído com sucesso.`, meta: { deletedUserId: userId }, userId: userProfile?.id });
      fetchUsers();
    } catch (error) {
      toast({ title: "Erro ao excluir", description: `Falha: ${error.message}.`, variant: "destructive" });
      await logAction({ level: 'ERROR', tag: 'ADMIN_USER_DELETE_ERROR', message: `Falha ao excluir usuário: "${userEmail}"`, error, meta: { userIdToDelete: userId }, userId: userProfile?.id });
    }
  };

  const openAddForm = () => { if (isAtLimit) { toast({ title: "Limite Atingido", description: `Seu plano permite até ${usersLimit} usuários.`, variant: "default" }); return; } setEditingUser(null); setView('form'); };
  const openEditForm = (user) => { setEditingUser(user); setView('form'); };
  
  const openUserParamsModal = (user) => { setSelectedUserForParams(user); setIsUserParamsModalOpen(true); };
  const navigateToPermissions = (userId) => { navigate(`/app/admin/permissions/${userId}`); };

  const filteredUsers = users.filter(user => {
    const name = user.full_name || ""; const email = user.email || ""; const userRole = user.role || "";
    const companyName = user.current_company_name || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || email.toLowerCase().includes(searchTerm.toLowerCase()) || companyName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === 'all' || userRole === filterRole;
    return matchesSearch && matchesFilter;
  });

  if (isLoading && users.length === 0) return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;

  if (view === 'form') {
    return (
      <motion.div key="form-view" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => setView('list')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{editingUser ? 'Editar Usuário' : 'Criar Novo Usuário (Admin)'}</h1>
            <p className="text-muted-foreground">Gerencie os detalhes do usuário.</p>
          </div>
        </div>
        <Card><CardContent className="p-6"><UserForm initialData={editingUser} onSubmit={handleFormSubmit} onCancel={() => setView('list')} isSubmitting={isSubmitting} companiesList={allCompanies}/></CardContent></Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Gerenciamento de Usuários</h1>
          <p className="text-muted-foreground mt-1">Administre perfis, empresas, permissões e parâmetros.</p>
          <p className="text-sm text-amber-500 mt-1 font-medium">{users.length}/{usersLimit === Infinity ? '∞' : usersLimit} usuários. {isAtLimit && " Limite do plano atingido."}</p>
        </div>
        <Button onClick={openAddForm} disabled={isAtLimit} title={isAtLimit ? `Limite de ${usersLimit} usuários atingido.` : "Novo Usuário"}>
            <UserPlus className="mr-2 h-5 w-5" /> Novo Usuário (Admin) {isAtLimit && <Lock className="ml-1 h-3 w-3"/>}
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 p-4 bg-card/50 rounded-lg border border-border">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Buscar por nome, email ou empresa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-background/70" />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full md:w-48 bg-background/70"><Filter className="h-4 w-4 mr-2 text-muted-foreground" /><SelectValue placeholder="Filtrar por perfil" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Perfis</SelectItem>
            {ROLES.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
         <Button variant="outline" onClick={() => supabase.functions.invoke('check-users-without-company')} className="whitespace-nowrap" title="Verificar usuários sem empresa e gerar notificações para admins.">
            <Users className="mr-2 h-4 w-4" /> Checar Usuários Sem Empresa
        </Button>
      </div>

      <UserTable users={filteredUsers} isLoading={isLoading && users.length > 0} highlightedUserId={highlightedUserId} setHighlightedUserId={setHighlightedUserId} onEditUser={openEditForm} onDeleteUser={handleDeleteUser} onManageParams={openUserParamsModal} onManagePermissions={navigateToPermissions}/>
      
      {filteredUsers.length === 0 && !isLoading && (
         <p className="text-center text-muted-foreground py-10">{searchTerm ? "Nenhum usuário corresponde à sua busca." : "Nenhum usuário cadastrado."}</p>
      )}

      {selectedUserForParams && (
        <UserParametersEditor 
          isOpen={isUserParamsModalOpen}
          setIsOpen={setIsUserParamsModalOpen}
          userId={selectedUserForParams.id} 
          userFullName={selectedUserForParams.full_name}
        />
      )}
    </motion.div>
  );
};

export default UserManagementPage;
