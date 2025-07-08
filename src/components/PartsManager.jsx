
import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Package, AlertTriangle, Edit, Loader2, Trash2, Lock, ArrowLeft } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useLicense } from '@/hooks/useLicense';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useAuth } from '@/hooks/useAuth.js';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { logAction } from '@/services/logService';

const categories = ['Filtros', 'Rolamentos', 'Correias', 'Vedações', 'Lubrificantes', 'Elétricos', 'Hidráulicos', 'Pneumáticos', 'Motores', 'Bombas', 'Sensores', 'Outros'];

const PartForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState(
    initialData || {
      name: '', partNumber: '', category: categories[0], supplier: '', quantity: 0,
      minQuantity: 5, unitCost: 0, location: '', description: ''
    }
  );

  useEffect(() => {
     if (initialData) {
      setFormData({
        name: initialData.name || '',
        partNumber: initialData.partnumber || '', 
        category: initialData.category || categories[0],
        supplier: initialData.supplier || '',
        quantity: initialData.quantity === null || initialData.quantity === undefined ? 0 : Number(initialData.quantity),
        minQuantity: initialData.minquantity === null || initialData.minquantity === undefined ? 5 : Number(initialData.minquantity),
        unitCost: initialData.unitcost === null || initialData.unitcost === undefined ? 0 : Number(initialData.unitcost),
        location: initialData.location || '',
        description: initialData.description || ''
      });
    } else {
      setFormData({
        name: '', partNumber: '', category: categories[0], supplier: '', quantity: 0,
        minQuantity: 5, unitCost: 0, location: '', description: ''
      });
    }
  }, [initialData]);

  const handleChange = (field, value) => {
    let processedValue = value;
    if (field === 'quantity' || field === 'minQuantity') {
      processedValue = value === '' ? null : parseInt(value, 10);
      if (isNaN(processedValue)) processedValue = null;
    } else if (field === 'unitCost') {
      processedValue = value === '' ? null : parseFloat(value);
      if (isNaN(processedValue)) processedValue = null;
    }
    setFormData(prev => ({ ...prev, [field]: processedValue }));
  };

  const handleSubmitForm = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.partNumber || !formData.category) {
      toast({ title: "Erro de Validação", description: "Nome, Código da Peça e Categoria são obrigatórios.", variant: "destructive" });
      return;
    }
    const dataToSubmit = {
      name: formData.name,
      partnumber: formData.partNumber,
      category: formData.category,
      supplier: formData.supplier || null,
      quantity: formData.quantity === null || formData.quantity === undefined ? 0 : Number(formData.quantity),
      minquantity: formData.minQuantity === null || formData.minQuantity === undefined ? 0 : Number(formData.minQuantity),
      unitcost: formData.unitCost === null || formData.unitCost === undefined ? 0 : Number(formData.unitCost),
      location: formData.location || null,
      description: formData.description || null,
    };
    onSubmit(dataToSubmit);
  };

  return (
    <form onSubmit={handleSubmitForm} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto p-1">
        <div><Label htmlFor="name">Nome da Peça *</Label><Input id="name" value={formData.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Ex: Filtro de Óleo Axial" required /></div>
        <div><Label htmlFor="partNumber">Código da Peça *</Label><Input id="partNumber" value={formData.partNumber} onChange={(e) => handleChange('partNumber', e.target.value)} placeholder="Ex: FO-AX-001B" required /></div>
        <div><Label htmlFor="category">Categoria *</Label><Select value={formData.category} onValueChange={(value) => handleChange('category', value)} required><SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger><SelectContent>{categories.map(category => (<SelectItem key={category} value={category}>{category}</SelectItem>))}</SelectContent></Select></div>
        <div><Label htmlFor="supplier">Fornecedor</Label><Input id="supplier" value={formData.supplier || ''} onChange={(e) => handleChange('supplier', e.target.value)} placeholder="Ex: Fornecedor Global Peças" /></div>
        <div><Label htmlFor="quantity">Quantidade em Estoque</Label><Input id="quantity" type="number" min="0" value={formData.quantity === null ? '' : formData.quantity} onChange={(e) => handleChange('quantity', e.target.value)} placeholder="0" /></div>
        <div><Label htmlFor="minQuantity">Quantidade Mínima</Label><Input id="minQuantity" type="number" min="0" value={formData.minQuantity === null ? '' : formData.minQuantity} onChange={(e) => handleChange('minQuantity', e.target.value)} placeholder="5" /></div>
        <div><Label htmlFor="unitCost">Custo Unitário (R$)</Label><Input id="unitCost" type="number" step="0.01" min="0" value={formData.unitCost === null ? '' : formData.unitCost} onChange={(e) => handleChange('unitCost', e.target.value)} placeholder="0.00" /></div>
        <div><Label htmlFor="location">Localização no Estoque</Label><Input id="location" value={formData.location || ''} onChange={(e) => handleChange('location', e.target.value)} placeholder="Ex: Prateleira A-1, Gaveta 3" /></div>
        <div className="md:col-span-2"><Label htmlFor="description">Descrição</Label><Input id="description" value={formData.description || ''} onChange={(e) => handleChange('description', e.target.value)} placeholder="Informações adicionais sobre a peça..." /></div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Atualizar Peça' : 'Cadastrar Peça'}
        </Button>
      </div>
    </form>
  );
};

const PartCard = ({ part, onEdit, onDelete, canEdit }) => {
  const quantity = part.quantity === null || part.quantity === undefined ? 0 : Number(part.quantity);
  const minQuantity = part.minquantity === null || part.minquantity === undefined ? 0 : Number(part.minquantity);
  const unitCost = part.unitcost === null || part.unitcost === undefined ? 0 : Number(part.unitcost);

  const getStockStatus = (currentQty, minQty) => {
    if (currentQty === 0) return { status: 'out', label: 'Sem Estoque', color: 'bg-red-500 dark:bg-red-600', textColor: 'text-red-500 dark:text-red-400' };
    if (currentQty <= minQty) return { status: 'low', label: 'Estoque Baixo', color: 'bg-yellow-500 dark:bg-yellow-600', textColor: 'text-yellow-500 dark:text-yellow-400' };
    return { status: 'good', label: 'Em Estoque', color: 'bg-green-500 dark:bg-green-600', textColor: 'text-green-500 dark:text-green-400' };
  };
  const stockStatus = getStockStatus(quantity, minQuantity);

  return (
    <Card className="glass-effect card-hover h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 mr-2">
            <CardTitle className="text-lg text-foreground truncate" title={part.name}>{part.name}</CardTitle>
            <p className="text-sm text-muted-foreground">{part.partnumber}</p>
          </div>
          <div className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-full ${stockStatus.color} flex-shrink-0`} title={stockStatus.label}/>
            <Button variant="ghost" size="icon" onClick={() => onEdit(part)} className="h-8 w-8 text-muted-foreground hover:text-primary" disabled={!canEdit}><Edit className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 flex-grow">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">{part.category}</Badge>
          <Badge variant="outline" className={`${stockStatus.color} text-primary-foreground border-0`}>{stockStatus.label}</Badge>
        </div>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between"><span className="text-muted-foreground">Quantidade:</span><span className="font-medium text-foreground">{quantity} un.</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Mín. Estoque:</span><span className="text-foreground">{minQuantity} un.</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Custo Unit.:</span><span className="text-foreground">R$ {unitCost.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Valor Total:</span><span className={`font-medium ${stockStatus.textColor}`}>R$ {(quantity * unitCost).toFixed(2)}</span></div>
        </div>
        {part.supplier && <div className="text-sm"><span className="text-muted-foreground">Fornecedor: </span><span className="text-foreground">{part.supplier}</span></div>}
        {part.location && <div className="text-sm"><span className="text-muted-foreground">Local: </span><span className="text-foreground">{part.location}</span></div>}
      </CardContent>
      <div className="p-4 border-t border-border/50 mt-auto">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="w-full" disabled={!canEdit}>
              <Trash2 className="h-4 w-4 mr-2"/> Excluir
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir a peça "{part.name}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(part.id, part.name)} className="bg-destructive hover:bg-destructive/80">Excluir</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
};

const PartsManager = () => {
  const { userProfile, currentCompanyId, hasAccess } = useAuth();
  const queryClient = useQueryClient();
  const { limits } = useLicense();

  const [view, setView] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [editingPart, setEditingPart] = useState(null);

  const { data: parts = [], isLoading, isError, error } = useQuery(
    ['parts', currentCompanyId],
    async () => {
      if (!currentCompanyId) return [];
      const { data, error } = await supabase
        .from('parts')
        .select('*')
        .eq('company_id', currentCompanyId)
        .order('createdat', { ascending: false });
      if (error) throw error;
      return data;
    },
    { enabled: !!currentCompanyId }
  );

  const partsLimit = limits.parts;
  const isAtLimit = partsLimit !== Infinity && parts.length >= partsLimit;
  const canEdit = hasAccess('parts_management');

  const saveMutation = useMutation(
    async (formData) => {
        const isEditing = !!editingPart;
        const logTag = isEditing ? 'PART_UPDATE' : 'PART_CREATE';

        await logAction({ tag: `${logTag}_ATTEMPT`, message: `Tentativa de ${isEditing ? 'atualizar' : 'criar'} peça: "${formData.name}"`, meta: { formData }, userId: userProfile?.id, companyId: currentCompanyId });

        if (!isEditing && isAtLimit) {
            throw new Error(`Limite de ${partsLimit} peças atingido.`);
        }
        const partData = { ...formData, company_id: currentCompanyId, user_id: userProfile.id };
        
        let savedPart;
        if (isEditing) {
            const { data, error } = await supabase.from('parts').update({ ...partData, updatedat: new Date().toISOString() }).eq('id', editingPart.id).select().single();
            if (error) throw error;
            savedPart = data;
        } else {
            const { data, error } = await supabase.from('parts').insert({ ...partData, id: crypto.randomUUID(), createdat: new Date().toISOString(), updatedat: new Date().toISOString() }).select().single();
            if (error) throw error;
            savedPart = data;
        }

        await logAction({ tag: `${logTag}_SUCCESS`, message: `Peça "${savedPart.name}" salva com sucesso.`, meta: { partId: savedPart.id }, userId: userProfile?.id, companyId: currentCompanyId });
        return savedPart;
    },
    {
      onSuccess: () => {
        toast({ title: "Sucesso!", description: `Peça ${editingPart ? 'atualizada' : 'cadastrada'}.` });
        queryClient.invalidateQueries(['parts', currentCompanyId]);
        setView('list');
        setEditingPart(null);
      },
      onError: async (err) => {
        const isEditing = !!editingPart;
        const logTag = isEditing ? 'PART_UPDATE_ERROR' : 'PART_CREATE_ERROR';
        toast({ title: "Erro ao Salvar", description: err.message, variant: "destructive" });
        await logAction({ level: 'ERROR', tag: logTag, message: `Falha ao salvar peça: "${editingPart?.name || 'Nova'}"`, error: err, meta: { partData: editingPart }, userId: userProfile?.id, companyId: currentCompanyId });
      }
    }
  );

  const deleteMutation = useMutation(
    async ({partId, partName}) => {
        await logAction({ tag: 'PART_DELETE_ATTEMPT', message: `Tentativa de excluir peça: "${partName}"`, meta: { partId }, userId: userProfile?.id, companyId: currentCompanyId });
        const { error } = await supabase.from('parts').delete().eq('id', partId);
        if (error) throw error;
        await logAction({ tag: 'PART_DELETE_SUCCESS', message: `Peça "${partName}" excluída com sucesso.`, meta: { partId }, userId: userProfile?.id, companyId: currentCompanyId });
    },
    {
      onSuccess: () => {
        toast({ title: "Sucesso!", description: "Peça excluída." });
        queryClient.invalidateQueries(['parts', currentCompanyId]);
      },
      onError: async (err, { partName }) => {
        toast({ title: "Erro ao Excluir", description: err.message, variant: "destructive" });
        await logAction({ level: 'ERROR', tag: 'PART_DELETE_ERROR', message: `Falha ao excluir peça: "${partName}"`, error: err, userId: userProfile?.id, companyId: currentCompanyId });
      }
    }
  );

  const filteredParts = parts.filter(part => {
    const name = part.name || "";
    const partNumber = part.partnumber || "";
    const supplier = part.supplier || "";
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) || partNumber.toLowerCase().includes(searchTerm.toLowerCase()) || supplier.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterCategory === 'all' || part.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const openAddForm = () => {
    if (isAtLimit) {
      toast({ title: "Limite Atingido", description: `Seu plano atual permite até ${partsLimit} peças. Faça upgrade para adicionar mais.`, variant: "default" });
      return;
    }
    setEditingPart(null);
    setView('form');
  };
  const openEditForm = (part) => { setEditingPart(part); setView('form'); };

  const lowStockPartsCount = parts.filter(part => Number(part.quantity || 0) <= Number(part.minquantity || 0)).length;
  const totalValue = parts.reduce((sum, part) => sum + (Number(part.quantity || 0) * Number(part.unitcost || 0)), 0);

  if (isLoading) return <div className="flex justify-center items-center h-full"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  if (isError) return <div className="text-center text-destructive">Erro ao carregar peças: {error.message}</div>;

  if (view === 'form') {
    return (
      <motion.div key="form-view" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
        <div className="flex items-center gap-4 mb-6">
          <Button variant="outline" size="icon" onClick={() => setView('list')}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{editingPart ? 'Editar Peça' : 'Cadastrar Nova Peça'}</h1>
            <p className="text-muted-foreground">Preencha os detalhes da peça.</p>
          </div>
        </div>
        <Card><CardContent className="p-6"><PartForm initialData={editingPart} onSubmit={(data) => saveMutation.mutate(data)} onCancel={() => setView('list')} isSubmitting={saveMutation.isLoading} /></CardContent></Card>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Gestão de Peças</h1>
          <p className="text-muted-foreground text-base md:text-lg">Controle seu estoque de peças e componentes.</p>
          <p className="text-sm text-amber-500 mt-1 font-medium">{parts.length}/{partsLimit === Infinity ? '∞' : partsLimit} peças cadastradas.{isAtLimit && " Limite do plano atingido."}</p>
        </div>
        <Button onClick={openAddForm} className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isAtLimit || !canEdit} title={isAtLimit ? `Limite de ${partsLimit} peças atingido.` : "Nova Peça"}>
            <Plus className="h-4 w-4 mr-2" /> Nova Peça {isAtLimit && <Lock className="ml-1 h-3 w-3"/>}
        </Button>
      </motion.div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.1 }}><Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Tipos de Peças</CardTitle><Package className="h-5 w-5 text-primary" /></CardHeader><CardContent><div className="text-3xl font-bold text-primary">{parts.length}</div><p className="text-xs text-muted-foreground pt-1">Itens únicos cadastrados</p></CardContent></Card></motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }}><Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Alerta de Estoque Baixo</CardTitle><AlertTriangle className="h-5 w-5 text-yellow-500 dark:text-yellow-400" /></CardHeader><CardContent><div className="text-3xl font-bold text-yellow-500 dark:text-yellow-400">{lowStockPartsCount}</div><p className="text-xs text-muted-foreground pt-1">Itens que precisam de reposição</p></CardContent></Card></motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }}><Card className="glass-effect card-hover"><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Valor Total do Estoque</CardTitle><Package className="h-5 w-5 text-green-500 dark:text-green-400" /></CardHeader><CardContent><div className="text-3xl font-bold text-green-500 dark:text-green-400">R$ {totalValue.toLocaleString('pt-BR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</div><p className="text-xs text-muted-foreground pt-1">Valor monetário do estoque atual</p></CardContent></Card></motion.div>
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" /><Input placeholder="Buscar por nome, código ou fornecedor..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 bg-background" /></div>
        <Select value={filterCategory} onValueChange={setFilterCategory}><SelectTrigger className="w-full sm:w-56 bg-background"><SelectValue placeholder="Filtrar por categoria" /></SelectTrigger><SelectContent><SelectItem value="all">Todas as Categorias</SelectItem>{categories.map(category => (<SelectItem key={category} value={category}>{category}</SelectItem>))}</SelectContent></Select>
      </motion.div>
      {lowStockPartsCount > 0 && (<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}><Card className="glass-effect border-yellow-500/50 dark:border-yellow-400/30"><CardHeader><CardTitle className="flex items-center gap-2 text-yellow-600 dark:text-yellow-400"><AlertTriangle className="h-5 w-5" /> Alerta de Estoque Baixo</CardTitle></CardHeader><CardContent><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-60 overflow-y-auto scrollbar-hide">{parts.filter(p => Number(p.quantity || 0) <= Number(p.minquantity || 0)).slice(0, 6).map((part) => (<div key={part.id} className="flex items-center justify-between p-3 rounded-md bg-yellow-500/10 dark:bg-yellow-400/10 border border-yellow-500/20 dark:border-yellow-400/20"><div><p className="font-medium text-foreground">{part.name}</p><p className="text-sm text-muted-foreground">{part.partnumber}</p></div><Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:border-yellow-400 dark:text-yellow-300">{part.quantity || 0} un.</Badge></div>))}</div></CardContent></Card></motion.div>)}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">{filteredParts.map((part, index) => (<motion.div key={part.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.03, duration: 0.3 }}><PartCard part={part} onEdit={openEditForm} onDelete={(id, name) => deleteMutation.mutate({partId: id, partName: name})} canEdit={canEdit} /></motion.div>))}</div>
      {filteredParts.length === 0 && (<motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12"><Package className="h-16 w-16 text-muted-foreground mx-auto mb-4" /><h3 className="text-xl font-semibold text-foreground mb-2">Nenhuma Peça Encontrada</h3><p className="text-muted-foreground">{searchTerm || filterCategory !== 'all' ? 'Tente refinar sua busca ou alterar os filtros.' : 'Comece cadastrando sua primeira peça.'}</p></motion.div>)}
    </div>
  );
};
export default PartsManager;
