
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Calendar as CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { cn } from '@/lib/utils';

const PromotionForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [formData, setFormData] = useState(
    initialData || {
      name: '',
      code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: '',
      start_date: null,
      end_date: null,
      eligible_plan_ids: [],
      max_uses: '',
      is_active: true,
      all_plans: false,
    }
  );
  const [licenseTypes, setLicenseTypes] = useState([]);

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        discount_value: initialData.discount_value?.toString() || '',
        max_uses: initialData.max_uses?.toString() || '',
        eligible_plan_ids: initialData.eligible_plan_ids || [],
        all_plans: !initialData.eligible_plan_ids || initialData.eligible_plan_ids.length === 0,
      });
    }
  }, [initialData]);

  useEffect(() => {
    const fetchLicenseTypes = async () => {
      const { data, error } = await supabase.from('license_types').select('id, name').eq('is_active', true);
      if (error) {
        toast({ title: 'Erro ao buscar planos', description: error.message, variant: 'destructive' });
      } else {
        setLicenseTypes(data);
      }
    };
    fetchLicenseTypes();
  }, []);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePlanChange = (planId) => {
    setFormData(prev => {
      const newPlanIds = prev.eligible_plan_ids.includes(planId)
        ? prev.eligible_plan_ids.filter(id => id !== planId)
        : [...prev.eligible_plan_ids, planId];
      return { ...prev, eligible_plan_ids: newPlanIds };
    });
  };
  
  const handleAllPlansChange = (checked) => {
    setFormData(prev => ({
      ...prev,
      all_plans: checked,
      eligible_plan_ids: checked ? [] : prev.eligible_plan_ids,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const dataToSend = {
        ...formData,
        discount_value: parseFloat(formData.discount_value) || 0,
        max_uses: formData.max_uses ? parseInt(formData.max_uses, 10) : null,
        eligible_plan_ids: formData.all_plans ? null : formData.eligible_plan_ids,
    };
    delete dataToSend.all_plans;
    onSubmit(dataToSend);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="name">Nome da Promoção</Label>
          <Input id="name" value={formData.name} onChange={e => handleChange('name', e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="code">Código do Cupom</Label>
          <Input id="code" value={formData.code} onChange={e => handleChange('code', e.target.value)} required />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="description">Descrição</Label>
          <Textarea id="description" value={formData.description} onChange={e => handleChange('description', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="discount_type">Tipo de Desconto</Label>
          <Select value={formData.discount_type} onValueChange={value => handleChange('discount_type', value)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Porcentagem (%)</SelectItem>
              <SelectItem value="fixed_amount">Valor Fixo (R$)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="discount_value">Valor do Desconto</Label>
          <Input id="discount_value" type="number" value={formData.discount_value} onChange={e => handleChange('discount_value', e.target.value)} required />
        </div>
        <div>
          <Label>Data de Início</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.start_date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.start_date ? format(formData.start_date, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.start_date} onSelect={date => handleChange('start_date', date)} initialFocus /></PopoverContent>
          </Popover>
        </div>
        <div>
          <Label>Data de Fim</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !formData.end_date && "text-muted-foreground")}>
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.end_date ? format(formData.end_date, 'PPP', { locale: ptBR }) : <span>Escolha uma data</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={formData.end_date} onSelect={date => handleChange('end_date', date)} initialFocus /></PopoverContent>
          </Popover>
        </div>
        <div className="md:col-span-2">
          <Label>Planos Elegíveis</Label>
          <div className="space-y-2 rounded-md border p-4">
            <div className="flex items-center space-x-2">
                <Checkbox id="all_plans" checked={formData.all_plans} onCheckedChange={handleAllPlansChange} />
                <label htmlFor="all_plans" className="text-sm font-medium leading-none">Todos os Planos</label>
            </div>
            {!formData.all_plans && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                {licenseTypes.map(plan => (
                  <div key={plan.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`plan-${plan.id}`}
                      checked={formData.eligible_plan_ids.includes(plan.id)}
                      onCheckedChange={() => handlePlanChange(plan.id)}
                    />
                    <label htmlFor={`plan-${plan.id}`} className="text-sm font-medium leading-none">{plan.name}</label>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="max_uses">Limite de Usos (Opcional)</Label>
          <Input id="max_uses" type="number" placeholder="Deixe em branco para ilimitado" value={formData.max_uses} onChange={e => handleChange('max_uses', e.target.value)} />
        </div>
        <div className="flex items-center pt-6">
          <Checkbox id="is_active" checked={formData.is_active} onCheckedChange={checked => handleChange('is_active', checked)} />
          <Label htmlFor="is_active" className="ml-2">Ativo</Label>
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? 'Atualizar Promoção' : 'Criar Promoção'}
        </Button>
      </div>
    </form>
  );
};
export default PromotionForm;
