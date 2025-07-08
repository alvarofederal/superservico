
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Search, Briefcase, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth.js';
import GenericForm from '@/components/common/GenericForm';
import { logAction } from '@/services/logService';

const GenericManagerPage = ({
  tableName,
  queryKey,
  pageIcon: PageIcon,
  pageTitle,
  pageDescription,
  columns,
  formFields,
  searchColumn = 'name',
  addPermission,
  editPermission,
  deletePermission,
}) => {
  const { userProfile, currentCompanyId, hasAccess } = useAuth();
  const queryClient = useQueryClient();

  const [view, setView] = useState('list'); // 'list' or 'form'
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const { data: items = [], isLoading, isError, error } = useQuery(
    [queryKey, currentCompanyId],
    async () => {
      if (!currentCompanyId) return [];
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('company_id', currentCompanyId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    {
      enabled: !!currentCompanyId,
    }
  );

  const handleBackToList = () => {
    setView('list');
    setEditingItem(null);
  };
  
  const handleAddNew = () => {
    if (!currentCompanyId) {
      toast({ title: "Selecione uma Empresa", description: `Você precisa selecionar uma empresa antes de adicionar.`, variant: "default" });
      return;
    }
    if (!hasAccess(addPermission)) {
      toast({ title: "Acesso Negado", description: "Seu plano não permite adicionar novos itens.", variant: "destructive" });
      return;
    }
    setEditingItem(null);
    setView('form');
  };

  const handleEdit = (item) => {
    if (!hasAccess(editPermission)) {
      toast({ title: "Acesso Negado", description: "Seu plano não permite editar itens.", variant: "destructive" });
      return;
    }
    setEditingItem(item);
    setView('form');
  };

  const saveItemMutation = useMutation(
    async (formData) => {
        if (!currentCompanyId) throw new Error("Nenhuma empresa selecionada.");
        const isEditing = !!editingItem?.id;
        const logTag = isEditing ? `${queryKey.toUpperCase()}_UPDATE` : `${queryKey.toUpperCase()}_CREATE`;

        await logAction({ tag: `${logTag}_ATTEMPT`, message: `Tentativa de ${isEditing ? 'atualizar' : 'criar'} ${pageTitle.slice(0, -1)}: "${formData.name}"`, meta: { formData }, userId: userProfile?.id, companyId: currentCompanyId });

        const itemData = {
            ...formData,
            company_id: currentCompanyId,
            user_id: userProfile.id,
            updated_at: new Date().toISOString(),
        };

        let savedItem;
        if (isEditing) {
            if (!hasAccess(editPermission)) throw new Error("Você não tem permissão para editar.");
            const { data, error } = await supabase.from(tableName).update(itemData).eq('id', editingItem.id).select().single();
            if (error) throw error;
            savedItem = data;
        } else {
            if (!hasAccess(addPermission)) throw new Error("Você não tem permissão para adicionar.");
            const { data, error } = await supabase.from(tableName).insert({ ...itemData, created_at: new Date().toISOString() }).select().single();
            if (error) throw error;
            savedItem = data;
        }
        await logAction({ tag: `${logTag}_SUCCESS`, message: `${pageTitle.slice(0, -1)} "${savedItem.name}" salvo com sucesso.`, meta: { itemId: savedItem.id }, userId: userProfile?.id, companyId: currentCompanyId });
        return savedItem;
    },
    {
      onSuccess: () => {
        toast({ title: "Sucesso!", description: `${pageTitle.slice(0, -1)} ${editingItem ? 'atualizada' : 'criada'}.` });
        queryClient.invalidateQueries([queryKey, currentCompanyId]);
        handleBackToList();
      },
      onError: async (error) => {
        console.error(`Erro ao salvar ${pageTitle.slice(0, -1)}:`, error);
        const isEditing = !!editingItem?.id;
        const logTag = isEditing ? `${queryKey.toUpperCase()}_UPDATE_ERROR` : `${queryKey.toUpperCase()}_CREATE_ERROR`;
        if (error.code === '23505') {
            toast({ title: "Erro de Duplicidade", description: `Já existe um item com estes dados.`, variant: "destructive" });
        } else {
            toast({ title: "Erro ao Salvar", description: error.message, variant: "destructive" });
        }
        await logAction({ level: 'ERROR', tag: logTag, message: `Falha ao salvar ${pageTitle.slice(0, -1)}: "${editingItem?.name || 'Novo'}"`, error, userId: userProfile?.id, companyId: currentCompanyId });
      },
    }
  );

  const deleteItemMutation = useMutation(
    async ({itemId, itemName}) => {
        if (!hasAccess(deletePermission)) throw new Error("Você não tem permissão para deletar.");
        const logTag = `${queryKey.toUpperCase()}_DELETE`;
        await logAction({ tag: `${logTag}_ATTEMPT`, message: `Tentativa de excluir ${pageTitle.slice(0, -1)}: "${itemName}"`, meta: { itemId }, userId: userProfile?.id, companyId: currentCompanyId });
        const { error } = await supabase.from(tableName).delete().eq('id', itemId);
        if (error) throw error;
        await logAction({ tag: `${logTag}_SUCCESS`, message: `${pageTitle.slice(0, -1)} "${itemName}" excluído com sucesso.`, meta: { itemId }, userId: userProfile?.id, companyId: currentCompanyId });
    },
    {
      onSuccess: () => {
        toast({ title: "Sucesso!", description: `${pageTitle.slice(0, -1)} removida.` });
        queryClient.invalidateQueries([queryKey, currentCompanyId]);
      },
      onError: async (error, { itemName }) => {
        toast({ title: "Erro ao Remover", description: error.message, variant: "destructive" });
        const logTag = `${queryKey.toUpperCase()}_DELETE_ERROR`;
        await logAction({ level: 'ERROR', tag: logTag, message: `Falha ao excluir ${pageTitle.slice(0, -1)}: "${itemName}"`, error, userId: userProfile?.id, companyId: currentCompanyId });
      },
    }
  );

  const filteredItems = useMemo(() => {
    if (!searchTerm) return items;
    return items.filter(item =>
      item[searchColumn]?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm, searchColumn]);

  if (view === 'form') {
    return (
      <motion.div 
        key="form-view"
        initial={{ opacity: 0, x: 50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
        transition={{ duration: 0.3 }}
      >
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={handleBackToList}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {editingItem ? `Editar ${pageTitle.slice(0, -1)}` : `Nova ${pageTitle.slice(0, -1)}`}
            </h1>
            <p className="text-muted-foreground">Preencha os detalhes e salve as alterações.</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6">
            <GenericForm
              initialData={editingItem}
              onSubmit={(data) => saveItemMutation.mutate(data)}
              onCancel={handleBackToList}
              isSubmitting={saveItemMutation.isLoading}
              formFields={formFields}
              isEditing={!!editingItem}
            />
          </CardContent>
        </Card>
      </motion.div>
    );
  }
  
  if (!currentCompanyId) {
    const MessageCard = ({ icon: Icon, title, message }) => (
       <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-card shadow-xl h-[calc(100vh-200px)]">
        <Icon className="w-16 h-16 text-primary mb-6" />
        <h2 className="text-2xl font-semibold text-foreground mb-3">{title}</h2>
        <p className="text-muted-foreground mb-6 max-w-md">{message}</p>
      </div>
    );
    if(userProfile?.role === 'admin'){
        return <MessageCard icon={Briefcase} title="Visão de Administrador" message="Para visualizar ou gerenciar dados, por favor, selecione uma empresa específica no menu superior." />;
    }
    return <MessageCard icon={Briefcase} title="Nenhuma Empresa Selecionada" message="Por favor, selecione uma empresa para gerenciar." />;
  }

  return (
    <motion.div 
      key="list-view"
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <PageIcon className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">{pageTitle}</h1>
            <p className="text-muted-foreground">{pageDescription}</p>
          </div>
        </div>
        <Button onClick={handleAddNew} disabled={!hasAccess(addPermission)}>
          <Plus className="h-4 w-4 mr-2" /> Nova
        </Button>
      </div>

      <div>
        <div className="relative flex-1 mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder={`Buscar por ${searchColumn}...`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(col => <TableHead key={col.accessor}>{col.header}</TableHead>)}
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={columns.length + 1} className="h-24 text-center"><Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" /></TableCell></TableRow>
              ) : isError ? (
                <TableRow><TableCell colSpan={columns.length + 1} className="h-24 text-center text-destructive">Erro ao carregar dados: {error.message}</TableCell></TableRow>
              ) : filteredItems.length > 0 ? (
                filteredItems.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map(col => (
                      <TableCell key={col.accessor} className={col.className || ''}>
                        {col.cell ? col.cell(item[col.accessor]) : item[col.accessor] || 'N/A'}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} disabled={!hasAccess(editPermission)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={!hasAccess(deletePermission)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Esta ação não pode ser desfeita. Isso removerá permanentemente o item.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteItemMutation.mutate({ itemId: item.id, itemName: item.name })} className="bg-destructive hover:bg-destructive/90">
                              Sim, remover
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length + 1} className="h-24 text-center">
                    Nenhum item encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </div>
    </motion.div>
  );
};

export default GenericManagerPage;
