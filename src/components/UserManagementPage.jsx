import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Loader2, UserPlus, Edit3, Trash2, Shield, Users, Search, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

const ROLES = ['admin', 'technician', 'client'];

const UserForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [email, setEmail] = useState(initialData?.email || '');
  const [fullName, setFullName] = useState(initialData?.user_metadata?.full_name || initialData?.full_name || '');
  const [role, setRole] = useState(initialData?.user_metadata?.role || initialData?.role || 'client');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (initialData) {
      setEmail(initialData.email || '');
      setFullName(initialData.user_metadata?.full_name || initialData.full_name || '');
      setRole(initialData.user_metadata?.role || initialData.role || 'client');
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !fullName || !role) {
      toast({ title: "Erro de Validação", description: "Email, Nome Completo e Perfil são obrigatórios.", variant: "destructive" });
      return;
    }
    if (!initialData && (!password || password.length < 6)) {
      toast({ title: "Erro de Validação", description: "Senha é obrigatória e deve ter no mínimo 6 caracteres para novos usuários.", variant: "destructive" });
      return;
    }
    onSubmit({ email, fullName, role, password: password || undefined, userId: initialData?.id });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="user-email">Email *</Label>
        <Input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required disabled={!!initialData} />
        {initialData && <p className="text-xs text-muted-foreground mt-1">Email não pode ser alterado.</p>}
      </div>
      <div>
        <Label htmlFor="user-fullname">Nome Completo *</Label>
        <Input id="user-fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome Sobrenome" required />
      </div>
      <div>
        <Label htmlFor="user-role">Perfil *</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger><SelectValue placeholder="Selecione um perfil" /></SelectTrigger>
          <SelectContent>
            {ROLES.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      {!initialData && (
        <div>
          <Label htmlFor="user-password">Senha (mín. 6 caracteres) *</Label>
          <Input id="user-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
      )}
      <DialogFooter className="pt-4">
        <DialogClose asChild><Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button></DialogClose>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Atualizar Usuário' : 'Criar Usuário'}
        </Button>
      </DialogFooter>
    </form>
  );
};


const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('list-admin-users');
      if (error) throw error;
      if (data && data.users) {
         // Ensure user_metadata is consistently available or default
        const formattedUsers = data.users.map(u => ({
          ...u,
          full_name: u.user_metadata?.full_name || u.email,
          role: u.user_metadata?.role || 'client' 
        }));
        setUsers(formattedUsers);
      } else {
        setUsers([]);
        console.warn("Nenhum usuário retornado pela Edge Function ou formato inesperado:", data);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários via Edge Function:', error);
      toast({ title: "Erro ao buscar usuários", description: `Falha ao contatar o servidor: ${error.message || 'Erro desconhecido'}. Verifique se a Edge Function 'list-admin-users' está implantada e configurada corretamente.`, variant: "destructive", duration: 10000 });
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleFormSubmit = async ({ userId, email, fullName, role, password }) => {
    setIsSubmitting(true);
    try {
      if (editingUser && userId) {
        const { error } = await supabase.functions.invoke('update-admin-user', {
          body: { userId, fullName, role }
        });
        if (error) throw error;
        toast({ title: "Sucesso!", description: "Usuário atualizado." });
      } else {
        const { error } = await supabase.functions.invoke('create-admin-user', {
          body: { email, password, fullName, role }
        });
        if (error) throw error;
        toast({ title: "Sucesso!", description: `Usuário ${email} criado.` });
      }
      fetchUsers();
      setIsDialogOpen(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Erro ao submeter usuário via Edge Function:', error);
      toast({ title: "Erro", description: `Falha ao salvar usuário: ${error.message || 'Erro desconhecido'}. Verifique as Edge Functions.`, variant: "destructive", duration: 8000 });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteUser = async (userId, userEmail) => {
    try {
      const { error } = await supabase.functions.invoke('delete-admin-user', {
        body: { userId }
      });
      if (error) throw error;
      toast({ title: "Sucesso!", description: `Usuário ${userEmail} excluído.` });
      fetchUsers();
    } catch (error) {
      console.error('Erro ao excluir usuário via Edge Function:', error);
      toast({ title: "Erro ao excluir", description: `Falha ao excluir usuário: ${error.message || 'Erro desconhecido'}. Verifique a Edge Function.`, variant: "destructive", duration: 8000 });
    }
  };

  const openAddDialog = () => { setEditingUser(null); setIsDialogOpen(true); };
  const openEditDialog = (user) => { setEditingUser(user); setIsDialogOpen(true); };

  const filteredUsers = users.filter(user => {
    const name = user.full_name || user.user_metadata?.full_name || "";
    const email = user.email || "";
    const userRole = user.role || user.user_metadata?.role || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterRole === 'all' || userRole === filterRole;
    return matchesSearch && matchesFilter;
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-orange-500">
            Gerenciamento de Usuários
          </h1>
          <p className="text-muted-foreground mt-1">Administre perfis e acessos do sistema.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsDialogOpen(isOpen); }}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white shadow-lg">
              <UserPlus className="mr-2 h-5 w-5" /> Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl text-foreground">{editingUser ? 'Editar Usuário' : 'Criar Novo Usuário'}</DialogTitle>
            </DialogHeader>
            <UserForm initialData={editingUser} onSubmit={handleFormSubmit} onCancel={() => setIsDialogOpen(false)} isSubmitting={isSubmitting} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col md:flex-row gap-4 p-4 bg-card/50 rounded-lg border border-border">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input 
            placeholder="Buscar por nome ou email..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="pl-10 bg-background/70" 
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-full md:w-48 bg-background/70">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filtrar por perfil" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos Perfis</SelectItem>
            {ROLES.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto bg-card/50 rounded-lg border border-border shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Nome Completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Criado em</TableHead>
              <TableHead className="text-right w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-muted/50">
                <TableCell className="font-medium text-foreground">{user.full_name || user.user_metadata?.full_name || user.email?.split('@')[0]}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={(user.role || user.user_metadata?.role) === 'admin' ? 'destructive' : (user.role || user.user_metadata?.role) === 'technician' ? 'secondary' : 'outline'} className="capitalize">
                    <Shield className="h-3 w-3 mr-1.5 opacity-70"/>
                    {user.role || user.user_metadata?.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)} className="mr-2 hover:text-primary">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o usuário {user.email}? Esta ação é irreversível.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteUser(user.id, user.email)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhum usuário encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {filteredUsers.length === 0 && searchTerm && (
         <p className="text-center text-muted-foreground">Nenhum usuário corresponde à sua busca.</p>
      )}
    </motion.div>
  );
};

export default UserManagementPage;