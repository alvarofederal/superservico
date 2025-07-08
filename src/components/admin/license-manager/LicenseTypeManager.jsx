import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Loader2, PlusCircle, Edit3, Trash2, CheckCircle, XCircle, Tag } from 'lucide-react';
import { motion } from 'framer-motion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import LicenseTypeForm from '@/components/admin/license-manager/LicenseTypeForm';

const LicenseTypeManager = () => {
  const [licenseTypes, setLicenseTypes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingLicenseType, setEditingLicenseType] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLicenseTypes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('license_types').select('*').order('name');
      if (error) throw error;
      setLicenseTypes(data || []);
    } catch (error) {
      toast({ title: "Erro ao buscar Tipos de Licença", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLicenseTypes();
  }, [fetchLicenseTypes]);

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    try {
      let result;
      const dataToSave = {
        ...formData,
        features: formData.features, // Already an array of strings
      };

      if (editingLicenseType) {
        result = await supabase.from('license_types').update(dataToSave).eq('id', editingLicenseType.id);
      } else {
        result = await supabase.from('license_types').insert(dataToSave);
      }
      
      const { error } = result;
      if (error) throw error;

      toast({ title: "Sucesso!", description: `Tipo de Licença ${editingLicenseType ? 'atualizado' : 'criado'}.` });
      fetchLicenseTypes();
      setIsFormOpen(false);
      setEditingLicenseType(null);
    } catch (error) {
      toast({ title: "Erro ao salvar Tipo de Licença", description: `Falha: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleDeleteLicenseType = async (licenseTypeId, licenseTypeName) => {
    try {
      // Check if any licenses_contracts are using this license_type
      const { count, error: checkError } = await supabase
        .from('licenses') // Changed from licenses_contracts to new table
        .select('id', { count: 'exact', head: true }) 
        .eq('license_type_id', licenseTypeId);

      if (checkError) throw checkError;
      
      if (count !== null && count > 0) {
        toast({ title: "Ação Bloqueada", description: `Não é possível excluir "${licenseTypeName}". Existem ${count} licenças ativas ou passadas usando este tipo.`, variant: "destructive", duration: 7000 });
        return;
      }
      
      // If no active licenses, proceed to delete
      const { error } = await supabase.from('license_types').delete().eq('id', licenseTypeId);
      if (error) throw error;
      toast({ title: "Sucesso!", description: `Tipo de Licença "${licenseTypeName}" excluído.` });
      fetchLicenseTypes();
    } catch (error) {
      toast({ title: "Erro ao excluir Tipo de Licença", description: `Falha: ${error.message}`, variant: "destructive" });
    }
  };

  const openAddDialog = () => { setEditingLicenseType(null); setIsFormOpen(true); };
  const openEditDialog = (lt) => { setEditingLicenseType(lt); setIsFormOpen(true); };

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Tag className="h-7 w-7 text-primary"/>
          <div>
            <h2 className="text-2xl font-semibold">Gerenciar Tipos de Licença (Planos)</h2>
            <p className="text-sm text-muted-foreground">Crie e configure os planos de assinatura disponíveis.</p>
          </div>
        </div>
        <Dialog open={isFormOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsFormOpen(isOpen); }}>
          <DialogTrigger asChild>
            <Button onClick={openAddDialog} className="w-full sm:w-auto bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white"><PlusCircle className="mr-2 h-4 w-4" /> Novo Tipo de Licença</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>{editingLicenseType ? 'Editar Tipo de Licença' : 'Novo Tipo de Licença (Plano)'}</DialogTitle></DialogHeader>
            <LicenseTypeForm initialData={editingLicenseType} onSubmit={handleFormSubmit} onCancel={() => setIsFormOpen(false)} isSubmitting={isSubmitting} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-card p-4 rounded-lg shadow-md border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Ciclo</TableHead>
                <TableHead className="text-center">Ativo?</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {licenseTypes.length > 0 ? licenseTypes.map((lt) => (
                <TableRow key={lt.id}>
                  <TableCell className="font-medium">{lt.name}</TableCell>
                  <TableCell>{lt.price.toLocaleString('pt-BR', { style: 'currency', currency: lt.currency || 'BRL' })}</TableCell>
                  <TableCell>{lt.billing_cycle === 'monthly' ? 'Mensal' : lt.billing_cycle === 'annually' ? 'Anual' : 'Único'}</TableCell>
                  <TableCell className="text-center">{lt.is_active ? <CheckCircle className="text-green-500 mx-auto"/> : <XCircle className="text-red-500 mx-auto"/>}</TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(lt)} title="Editar"><Edit3 className="h-4 w-4" /></Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="hover:text-destructive" title="Excluir"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>Tem certeza que deseja excluir o tipo de licença "{lt.name}"? Esta ação é irreversível se não houver licenças vinculadas.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDeleteLicenseType(lt.id, lt.name)} className="bg-destructive hover:bg-destructive/80">Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              )) : (
                <TableRow><TableCell colSpan={5} className="text-center h-24">Nenhum tipo de licença encontrado.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </motion.div>
  );
};

export default LicenseTypeManager;