
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { PlusCircle, Edit, Trash2, Loader2, Tag, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PromotionForm from '@/components/promotions/PromotionForm';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const PromotionsManager = () => {
  const [promotions, setPromotions] = useState([]);
  const [licenseTypes, setLicenseTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  const fetchPromotions = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase.from('promotions').select('*').order('created_at', { ascending: false });
    if (error) {
      toast({ title: 'Erro ao buscar promoções', description: error.message, variant: 'destructive' });
    } else {
      setPromotions(data);
    }
    setLoading(false);
  }, []);

  const fetchLicenseTypes = useCallback(async () => {
    const { data, error } = await supabase.from('license_types').select('id, name');
    if (error) {
      toast({ title: 'Erro ao buscar tipos de licença', description: error.message, variant: 'destructive' });
    } else {
      setLicenseTypes(data);
    }
  }, []);

  useEffect(() => {
    fetchPromotions();
    fetchLicenseTypes();
  }, [fetchPromotions, fetchLicenseTypes]);

  const handleFormSubmit = async (formData) => {
    setIsSubmitting(true);
    const { id, ...dataToUpsert } = formData;
    
    const { data, error } = await supabase
      .from('promotions')
      .upsert(id ? { id, ...dataToUpsert } : dataToUpsert)
      .select()
      .single();

    if (error) {
      toast({ title: `Erro ao ${id ? 'atualizar' : 'criar'} promoção`, description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `Promoção ${id ? 'atualizada' : 'criada'} com sucesso!`, description: data.name });
      setIsFormOpen(false);
      setSelectedPromotion(null);
      fetchPromotions();
    }
    setIsSubmitting(false);
  };
  
  const handleDelete = async (promotionId) => {
    const { error } = await supabase.from('promotions').delete().eq('id', promotionId);
    if(error) {
      toast({ title: 'Erro ao excluir promoção', description: error.message, variant: 'destructive'});
    } else {
      toast({ title: 'Promoção excluída com sucesso!' });
      fetchPromotions();
    }
  };

  const getPlanNames = (planIds) => {
    if (!planIds) return "Todos os Planos";
    if (planIds.length === 0) return "Nenhum";
    return planIds.map(id => licenseTypes.find(lt => lt.id === id)?.name || 'Plano Desconhecido').join(', ');
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Gerenciador de Promoções</CardTitle>
            <CardDescription>Crie e gerencie cupons de desconto para seus planos.</CardDescription>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedPromotion(null)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Nova Promoção
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
              <DialogHeader>
                <DialogTitle>{selectedPromotion ? 'Editar Promoção' : 'Nova Promoção'}</DialogTitle>
              </DialogHeader>
              <PromotionForm
                initialData={selectedPromotion}
                onSubmit={handleFormSubmit}
                onCancel={() => setIsFormOpen(false)}
                isSubmitting={isSubmitting}
                licenseTypes={licenseTypes}
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Desconto</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Planos</TableHead>
                  <TableHead>Uso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {promotions.length > 0 ? (
                  promotions.map((promo) => (
                    <TableRow key={promo.id}>
                      <TableCell>
                        <Badge variant={promo.is_active ? 'default' : 'destructive'} className={promo.is_active ? 'bg-green-500' : 'bg-red-500'}>
                          {promo.is_active ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{promo.name}</TableCell>
                      <TableCell>
                        <Badge variant="secondary"><Tag className="w-3 h-3 mr-1" />{promo.code}</Badge>
                      </TableCell>
                      <TableCell>{promo.discount_type === 'percentage' ? `${promo.discount_value}%` : `R$ ${promo.discount_value}`}</TableCell>
                      <TableCell>{format(new Date(promo.start_date), 'dd/MM/yy', { locale: ptBR })} - {format(new Date(promo.end_date), 'dd/MM/yy', { locale: ptBR })}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{getPlanNames(promo.eligible_plan_ids)}</TableCell>
                      <TableCell>{promo.current_uses} / {promo.max_uses || '∞'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedPromotion(promo); setIsFormOpen(true); }}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Esta ação não pode ser desfeita. Isso irá excluir permanentemente a promoção <span className="font-bold">{promo.name}</span>.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(promo.id)}>Excluir</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="h-24 text-center">Nenhuma promoção encontrada.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PromotionsManager;
