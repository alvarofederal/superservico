import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Loader2, PlusCircle, Edit3, Trash2, Eye, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { Checkbox } from '@/components/ui/checkbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const DOCUMENT_TYPES = [{ value: 'terms_of_service', label: 'Termos de Uso' }, { value: 'privacy_policy', label: 'Política de Privacidade' }];

const TermsForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState(
    initialData || { type: DOCUMENT_TYPES[0].value, version: '', content: '', is_active: false }
  );

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }], ['bold', 'italic', 'underline', 'strike'],
      [{'list': 'ordered'}, {'list': 'bullet'}], ['link'], ['clean']
    ],
  };

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.type || !formData.version || !formData.content) {
      toast({ title: "Erro de Validação", description: "Tipo, Versão e Conteúdo são obrigatórios.", variant: "destructive" });
      return;
    }
    onSubmit({
      ...formData,
      published_at: formData.is_active && !initialData?.published_at ? new Date().toISOString() : initialData?.published_at 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label htmlFor="term-type">Tipo de Documento *</Label><Select value={formData.type} onValueChange={(v) => handleChange('type', v)}><SelectTrigger><SelectValue/></SelectTrigger><SelectContent>{DOCUMENT_TYPES.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label htmlFor="term-version">Versão *</Label><Input id="term-version" value={formData.version} onChange={(e) => handleChange('version', e.target.value)} required /></div>
      </div>
      <div><Label htmlFor="term-content">Conteúdo *</Label><div className="bg-background mt-1 rounded-md"><ReactQuill theme="snow" value={formData.content} onChange={(c) => handleChange('content', c)} modules={quillModules} style={{height: '300px', marginBottom: '40px'}}/></div></div>
      <div className="flex items-center space-x-2 pt-8"><Checkbox id="term-isactive" checked={formData.is_active} onCheckedChange={(c) => handleChange('is_active', c)} /><Label htmlFor="term-isactive">Marcar como versão ativa?</Label></div>
      <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{initialData ? 'Atualizar' : 'Criar'}</Button></div>
    </form>
  );
};

const TermsManager = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [editingTerm, setEditingTerm] = useState(null);
  const [viewingTerm, setViewingTerm] = useState(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const { data: terms = [], isLoading, isError, error } = useQuery({
    queryKey: ['terms'],
    queryFn: async () => {
      const { data, error } = await supabase.from('terms_and_policies').select('*').order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return data;
    }
  });

  const saveTermMutation = useMutation({
    mutationFn: async (formData) => {
      if (formData.is_active) {
        const { error: updateError } = await supabase.from('terms_and_policies').update({ is_active: false, published_at: null }).eq('type', formData.type).neq('id', formData.id || '00000000-0000-0000-0000-000000000000');
        if (updateError) throw updateError;
        if (!formData.published_at || (editingTerm && editingTerm.is_active !== formData.is_active)) {
            formData.published_at = new Date().toISOString();
        }
      }
      if (editingTerm) {
        const { error } = await supabase.from('terms_and_policies').update(formData).eq('id', editingTerm.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('terms_and_policies').insert(formData).select().single();
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: `Documento ${editingTerm ? 'atualizado' : 'criado'}.` });
      queryClient.invalidateQueries(['terms']);
      setView('list'); setEditingTerm(null);
    },
    onError: (err) => toast({ title: "Erro ao salvar", description: `Falha: ${err.message}`, variant: "destructive" })
  });

  const deleteTermMutation = useMutation({
    mutationFn: async ({ termId }) => {
      const { error } = await supabase.from('terms_and_policies').delete().eq('id', termId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: "Documento excluído." });
      queryClient.invalidateQueries(['terms']);
    },
    onError: (err) => toast({ title: "Erro ao excluir", description: `Falha: ${err.message}`, variant: "destructive" })
  });

  const openAddForm = () => { setEditingTerm(null); setView('form'); };
  const openEditForm = (term) => { setEditingTerm(term); setView('form'); };
  const openViewDialog = (term) => { setViewingTerm(term); setIsViewModalOpen(true); };

  if (isLoading) return <div className="flex justify-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>;
  if (isError) return <div className="text-center text-destructive">Erro ao carregar documentos: {error.message}</div>;

  if (view === 'form') {
    return (
        <motion.div key="form-view" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" onClick={() => setView('list')}><ArrowLeft className="h-4 w-4" /></Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{editingTerm ? 'Editar Documento' : 'Novo Documento Legal'}</h1>
                </div>
            </div>
            <Card><CardContent className="p-6"><TermsForm initialData={editingTerm} onSubmit={(data) => saveTermMutation.mutate(data)} onCancel={() => setView('list')} isSubmitting={saveTermMutation.isPending} /></CardContent></Card>
        </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-semibold">Gerenciar Termos e Políticas</h2><Button onClick={openAddForm}><PlusCircle className="mr-2 h-4 w-4" /> Novo Documento</Button></div>
      <div className="bg-card p-4 rounded-lg shadow"><Table><TableHeader><TableRow><TableHead>Tipo</TableHead><TableHead>Versão</TableHead><TableHead>Ativo?</TableHead><TableHead>Publicado em</TableHead><TableHead>Criado em</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {terms.length > 0 ? terms.map((term) => (
            <TableRow key={term.id}>
              <TableCell>{DOCUMENT_TYPES.find(dt => dt.value === term.type)?.label || term.type}</TableCell>
              <TableCell>{term.version}</TableCell>
              <TableCell>{term.is_active ? <CheckCircle className="text-green-500"/> : <XCircle className="text-red-500"/>}</TableCell>
              <TableCell>{term.published_at ? new Date(term.published_at).toLocaleDateString() : 'N/A'}</TableCell>
              <TableCell>{new Date(term.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="icon" onClick={() => openViewDialog(term)} title="Visualizar"><Eye className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={() => openEditForm(term)} title="Editar"><Edit3 className="h-4 w-4" /></Button>
                <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="hover:text-destructive" title="Excluir"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                  <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Excluir "{term.version} - {DOCUMENT_TYPES.find(dt => dt.value === term.type)?.label}"?</AlertDialogDescription></AlertDialogHeader>
                    <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteTermMutation.mutate({ termId: term.id })} className="bg-destructive hover:bg-destructive/80">Excluir</AlertDialogAction></AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TableCell>
            </TableRow>
          )) : <TableRow><TableCell colSpan={6} className="text-center">Nenhum documento encontrado.</TableCell></TableRow>}
        </TableBody>
      </Table></div>
      {viewingTerm && <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}><DialogContent className="max-w-3xl max-h-[80vh]"><DialogHeader><DialogTitle>{DOCUMENT_TYPES.find(dt => dt.value === viewingTerm.type)?.label} - Versão {viewingTerm.version}</DialogTitle><DialogDescription>Publicado em: {viewingTerm.published_at ? new Date(viewingTerm.published_at).toLocaleString() : 'Não publicado'}</DialogDescription></DialogHeader><div className="prose dark:prose-invert max-w-none overflow-y-auto p-4 bg-muted/30 rounded-md mt-4 max-h-[60vh]" dangerouslySetInnerHTML={{ __html: viewingTerm.content }} /><DialogFooter><Button variant="outline" onClick={() => setIsViewModalOpen(false)}>Fechar</Button></DialogFooter></DialogContent></Dialog>}
    </motion.div>
  );
};
export default TermsManager;