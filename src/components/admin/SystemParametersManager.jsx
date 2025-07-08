import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/use-toast';
import { Loader2, PlusCircle, Edit3, Trash2, Settings2, Tag, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import LicenseTypeManager from '@/components/admin/license-manager/LicenseTypeManager';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const PARAM_VALUE_TYPES = [{ value: 'string', label: 'Texto' }, { value: 'number', label: 'Número' }, { value: 'date', label: 'Data' }, { value: 'boolean', label: 'Booleano' }];
const PARAM_CATEGORIES = ['Geral', 'Licenciamento', 'Funcionalidades', 'Limites', 'Integrações'];

const ParameterDefinitionForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState(
    initialData || { parameter_key: '', description: '', value_type: 'string', default_value: '', category: 'Geral' }
  );

  useEffect(() => {
    if (initialData) setFormData(initialData);
  }, [initialData]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.parameter_key || !formData.value_type || !formData.category) {
      toast({ title: "Erro de Validação", description: "Chave, Tipo e Categoria são obrigatórios.", variant: "destructive" });
      return;
    }
    onSubmit({ ...formData, parameter_key: formData.parameter_key.toLowerCase().replace(/\s+/g, '_') });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <div><Label htmlFor="param-key">Chave do Parâmetro *</Label><Input id="param-key" value={formData.parameter_key} onChange={(e) => handleChange('parameter_key', e.target.value)} placeholder="chave_unica_parametro" required disabled={!!initialData} />{initialData && <p className="text-xs text-muted-foreground mt-1">Chave não pode ser alterada.</p>}</div>
      <div><Label htmlFor="param-desc">Descrição</Label><Input id="param-desc" value={formData.description} onChange={(e) => handleChange('description', e.target.value)} placeholder="Descrição do parâmetro" /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><Label htmlFor="param-value-type">Tipo de Valor *</Label><Select value={formData.value_type} onValueChange={(v) => handleChange('value_type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PARAM_VALUE_TYPES.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label htmlFor="param-category">Categoria *</Label><Select value={formData.category} onValueChange={(v) => handleChange('category', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PARAM_CATEGORIES.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}</SelectContent></Select></div>
      </div>
      <div><Label htmlFor="param-default-value">Valor Padrão</Label><Input id="param-default-value" value={formData.default_value} onChange={(e) => handleChange('default_value', e.target.value)} placeholder="Valor padrão (Opcional)" /><p className="text-xs text-muted-foreground mt-1">Para Booleanos, use 'true' ou 'false'. Para Datas, use YYYY-MM-DD.</p></div>
      <div className="flex justify-end gap-2 pt-4"><Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{initialData ? 'Atualizar' : 'Criar'}</Button></div>
    </form>
  );
};

const SystemParametersManager = () => {
  const queryClient = useQueryClient();
  const [view, setView] = useState('list');
  const [editingDefinition, setEditingDefinition] = useState(null);
  const [activeTab, setActiveTab] = useState('params');

  const { data: definitions = [], isLoading, isError, error } = useQuery({
    queryKey: ['systemParameters'],
    queryFn: async () => {
      const { data, error } = await supabase.from('system_parameters_definitions').select('*').order('category').order('parameter_key');
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: activeTab === 'params'
  });

  const saveDefinitionMutation = useMutation({
    mutationFn: async (formData) => {
      const { id, ...dataToUpsert } = formData;
      if (editingDefinition) {
        const { error } = await supabase.from('system_parameters_definitions').update(dataToUpsert).eq('id', editingDefinition.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('system_parameters_definitions').insert(dataToUpsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast({ title: "Sucesso!", description: `Definição ${editingDefinition ? 'atualizada' : 'criada'}.` });
      queryClient.invalidateQueries({ queryKey: ['systemParameters'] });
      setView('list'); setEditingDefinition(null);
    },
    onError: (err) => toast({ title: "Erro ao salvar", description: `Falha: ${err.message}`, variant: "destructive" })
  });
  
  const deleteDefinitionMutation = useMutation({
    mutationFn: async ({ definitionId, definitionKey }) => {
      const { count, error: checkError } = await supabase.from('user_parameters').select('id', { count: 'exact', head: true }).eq('parameter_definition_id', definitionId);
      if (checkError) throw new Error(`Erro na verificação: ${checkError.message}`);
      if (count > 0) throw new Error(`Exclusão bloqueada: Existem ${count} valores de usuário vinculados a "${definitionKey}".`);
      
      const { error } = await supabase.from('system_parameters_definitions').delete().eq('id', definitionId);
      if (error) throw new Error(error.message);
      return definitionKey;
    },
    onSuccess: (definitionKey) => {
      toast({ title: "Sucesso!", description: `Definição "${definitionKey}" excluída.` });
      queryClient.invalidateQueries({ queryKey: ['systemParameters'] });
    },
    onError: (err) => toast({ title: "Erro ao excluir", description: `Falha: ${err.message}`, variant: "destructive", duration: 7000 })
  });

  const openAddForm = () => { setEditingDefinition(null); setView('form'); };
  const openEditForm = (def) => { setEditingDefinition(def); setView('form'); };

  if (view === 'form') {
     return (
        <motion.div key="form-view" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" onClick={() => setView('list')}><ArrowLeft className="h-4 w-4" /></Button>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{editingDefinition ? 'Editar Definição de Parâmetro' : 'Nova Definição de Parâmetro'}</h1>
                </div>
            </div>
            <Card><CardContent className="p-6"><ParameterDefinitionForm initialData={editingDefinition} onSubmit={(data) => saveDefinitionMutation.mutate(data)} onCancel={() => setView('list')} isSubmitting={saveDefinitionMutation.isPending} /></CardContent></Card>
        </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div><h1 className="text-3xl md:text-4xl font-bold">Parâmetros e Planos do Sistema</h1><p className="text-muted-foreground mt-1">Configure definições globais e tipos de licença.</p></div>
      <div className="flex border-b">
        <button onClick={() => setActiveTab('params')} className={`py-3 px-4 font-medium text-sm transition-colors ${activeTab === 'params' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Settings2 className="inline-block mr-2 h-4 w-4" />Definições de Parâmetros</button>
        <button onClick={() => setActiveTab('licenseTypes')} className={`py-3 px-4 font-medium text-sm transition-colors ${activeTab === 'licenseTypes' ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'}`}><Tag className="inline-block mr-2 h-4 w-4" />Tipos de Licença (Planos)</button>
      </div>

      {activeTab === 'params' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex justify-between items-center pt-4">
            <h2 className="text-xl font-semibold">Definições de Parâmetros Globais</h2>
            <Button onClick={openAddForm} variant="outline"><PlusCircle className="mr-2 h-4 w-4" /> Nova Definição</Button>
          </div>
          {isLoading && <div className="flex justify-center h-64"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>}
          {isError && <div className="text-destructive text-center">Erro ao carregar: {error.message}</div>}
          {!isLoading && !isError && (
            <div className="bg-card p-4 rounded-lg shadow-md border"><div className="overflow-x-auto">
              <Table><TableHeader><TableRow><TableHead>Chave</TableHead><TableHead>Descrição</TableHead><TableHead>Tipo</TableHead><TableHead>Padrão</TableHead><TableHead>Categoria</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {definitions.length > 0 ? definitions.map((def) => (
                    <TableRow key={def.id}><TableCell className="font-mono text-sm">{def.parameter_key}</TableCell><TableCell className="text-xs max-w-xs truncate">{def.description}</TableCell><TableCell>{def.value_type}</TableCell><TableCell>{def.default_value || 'N/A'}</TableCell><TableCell>{def.category}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" onClick={() => openEditForm(def)} title="Editar"><Edit3 className="h-4 w-4" /></Button>
                        <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="hover:text-destructive" title="Excluir"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                          <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle><AlertDialogDescription>Deseja excluir "{def.parameter_key}"? Esta ação é irreversível se não houver valores de usuário vinculados.</AlertDialogDescription></AlertDialogHeader>
                            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => deleteDefinitionMutation.mutate({ definitionId: def.id, definitionKey: def.parameter_key })} className="bg-destructive hover:bg-destructive/80">Excluir</AlertDialogAction></AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={6} className="text-center h-24">Nenhuma definição encontrada.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div></div>
          )}
        </motion.div>
      )}
      {activeTab === 'licenseTypes' && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4"><LicenseTypeManager /></motion.div>)}
    </motion.div>
  );
};

export default SystemParametersManager;