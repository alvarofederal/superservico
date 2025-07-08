import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Loader2, DollarSign, Plus } from 'lucide-react';
import ImageUploader from '@/components/equipment/ImageUploader';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import CategoryForm from '@/components/categories/CategoryForm';

const EquipmentForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm({
    defaultValues: initialData ? {
      ...initialData,
      lastmaintenance: initialData.lastmaintenance ? initialData.lastmaintenance.split('T')[0] : '',
      nextmaintenance: initialData.nextmaintenance ? initialData.nextmaintenance.split('T')[0] : '',
      image_files: { new: [], existing: initialData.photos_urls || [] }
    } : {
      status: 'operational',
      image_files: { new: [], existing: [] }
    }
  });

  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);

  const { data: categories = [], isLoading: isLoadingCategories } = useQuery(
    ['equipment_categories', userProfile?.current_company_id],
    async () => {
      if (!userProfile?.current_company_id) return [];
      const { data, error } = await supabase
        .from('equipment_categories')
        .select('id, name')
        .eq('company_id', userProfile.current_company_id)
        .order('name', { ascending: true });
      if (error) {
        toast({ title: "Erro ao carregar categorias", description: error.message, variant: "destructive" });
        return [];
      }
      return data;
    },
    {
      enabled: !!userProfile?.current_company_id,
    }
  );

  const saveCategoryMutation = useMutation(
    async (formData) => {
      if (!userProfile?.current_company_id) {
        throw new Error("Nenhuma empresa selecionada. Por favor, selecione uma no menu superior.");
      }
      const categoryData = {
        ...formData,
        company_id: userProfile.current_company_id,
        user_id: userProfile.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      const { data, error } = await supabase.from('equipment_categories').insert(categoryData).select().single();
      if (error) throw error;
      return data;
    },
    {
      onSuccess: (newCategory) => {
        toast({ title: "Sucesso!", description: `Categoria "${newCategory.name}" foi criada.` });
        queryClient.invalidateQueries(['equipment_categories', userProfile.current_company_id]);
        setIsCategoryFormOpen(false);
        setValue('category', newCategory.name, { shouldValidate: true });
      },
      onError: (error) => {
        console.error('Erro ao criar categoria:', error);
        if (error.code === '23505') { // Unique constraint violation
          toast({ title: "Erro de Duplicidade", description: "Já existe uma categoria com este nome.", variant: "destructive" });
        } else {
          toast({ title: "Erro ao Criar Categoria", description: error.message, variant: "destructive" });
        }
      },
    }
  );

  useEffect(() => {
    if (initialData) {
      reset({
        ...initialData,
        lastmaintenance: initialData.lastmaintenance ? initialData.lastmaintenance.split('T')[0] : '',
        nextmaintenance: initialData.nextmaintenance ? initialData.nextmaintenance.split('T')[0] : '',
        image_files: { new: [], existing: initialData.photos_urls || [] }
      });
    } else {
      reset({
        name: '', description: '', brand: '', model: '', category: '', serialnumber: '',
        status: 'operational', year_of_manufacture: '', power_rating: '', dimensions: '',
        operating_requirements: '', location: '', geo_coordinates: '', responsible_unit: '',
        operating_hours: '', manual_url: '', certificates_url: '', acquisition_cost: '',
        depreciation_value: '', owner_department: '', supplier_info: '', lastmaintenance: '',
        nextmaintenance: '', notes: '',
        image_files: { new: [], existing: [] }
      });
    }
  }, [initialData, reset]);

  const handleFinalSubmit = (data) => {
    const { image_files, ...dbData } = data;
    
    const sanitizedDbData = { ...dbData };
    const numericFields = ['year_of_manufacture', 'operating_hours', 'acquisition_cost', 'depreciation_value'];
    numericFields.forEach(field => {
        if (sanitizedDbData[field] === '' || sanitizedDbData[field] === undefined || sanitizedDbData[field] === null) {
            sanitizedDbData[field] = null;
        } else {
            const num = Number(sanitizedDbData[field]);
            sanitizedDbData[field] = isNaN(num) ? null : num;
        }
    });

    if (!sanitizedDbData.type && sanitizedDbData.category) {
        sanitizedDbData.type = sanitizedDbData.category;
    } else if (!sanitizedDbData.type && !sanitizedDbData.category) {
        sanitizedDbData.type = 'Geral';
    }

    const submissionData = {
      dbData: sanitizedDbData,
      new_photos: image_files.new,
      existing_photos: image_files.existing,
    };
    onSubmit(submissionData);
  };

  const ErrorMessage = ({ name }) => {
    const error = errors[name];
    return error ? <p className="text-red-500 text-xs mt-1">{error.message}</p> : null;
  };

  return (
    <form onSubmit={handleSubmit(handleFinalSubmit)} className="space-y-6">
       <Tabs defaultValue="identification" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4">
          <TabsTrigger value="identification">Identificação</TabsTrigger>
          <TabsTrigger value="technical">Detalhes Técnicos</TabsTrigger>
          <TabsTrigger value="docs">Documentação</TabsTrigger>
          <TabsTrigger value="management">Gestão</TabsTrigger>
        </TabsList>

        <TabsContent value="identification" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" {...register("name", { required: "Nome é obrigatório" })} placeholder="Ex: Torno Mecânico" />
              <ErrorMessage name="name" />
            </div>
            <div>
              <Label htmlFor="category">Categoria/Tipo *</Label>
              <div className="flex items-center gap-2">
                <div className="flex-grow">
                  <Controller
                    name="category"
                    control={control}
                    rules={{ required: "Categoria é obrigatória" }}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value} disabled={isLoadingCategories}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder={isLoadingCategories ? "Carregando..." : "Selecione uma categoria"} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((cat) => (
                            <SelectItem key={cat.id} value={cat.name}>
                              {cat.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <Dialog open={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen}>
                  <DialogTrigger asChild>
                    <Button type="button" variant="outline" size="icon" title="Adicionar nova categoria">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Categoria</DialogTitle>
                    </DialogHeader>
                    <CategoryForm
                      onSubmit={(data) => saveCategoryMutation.mutate(data)}
                      onCancel={() => setIsCategoryFormOpen(false)}
                      isSubmitting={saveCategoryMutation.isLoading}
                    />
                  </DialogContent>
                </Dialog>
              </div>
              <ErrorMessage name="category" />
            </div>
            <div>
              <Label htmlFor="brand">Marca/Fabricante</Label>
              <Input id="brand" {...register("brand")} placeholder="Ex: Indústrias Romi" />
            </div>
            <div>
              <Label htmlFor="model">Modelo</Label>
              <Input id="model" {...register("model")} placeholder="Ex: T-240" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea id="description" {...register("description")} placeholder="Descrição detalhada do equipamento..." />
            </div>
            <div>
              <Label htmlFor="serialnumber">Número de Série</Label>
              <Input id="serialnumber" {...register("serialnumber")} placeholder="Ex: SN123456" />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger id="status"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="operational">Operacional</SelectItem>
                      <SelectItem value="maintenance">Em Manutenção</SelectItem>
                      <SelectItem value="broken">Quebrado</SelectItem>
                      <SelectItem value="retired">Aposentado</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div>
              <Label htmlFor="location">Local Físico</Label>
              <Input id="location" {...register("location")} placeholder="Ex: Galpão 2, Setor Usinagem" />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="space-y-4 pt-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="year_of_manufacture">Ano de Fabricação</Label>
              <Input id="year_of_manufacture" type="number" {...register("year_of_manufacture")} placeholder="Ex: 2021" />
            </div>
            <div>
              <Label htmlFor="power_rating">Potência</Label>
              <Input id="power_rating" {...register("power_rating")} placeholder="Ex: 7.5 CV" />
            </div>
            <div>
              <Label htmlFor="dimensions">Dimensões e Peso</Label>
              <Input id="dimensions" {...register("dimensions")} placeholder="Ex: 2.5m x 1.2m x 1.8m, 1500kg" />
            </div>
            <div>
              <Label htmlFor="operating_requirements">Requisitos de Operação</Label>
              <Input id="operating_requirements" {...register("operating_requirements")} placeholder="Ex: 220V Trifásico, Ar Comprimido 8 bar" />
            </div>
            <div>
              <Label htmlFor="operating_hours">Horas de Operação</Label>
              <Input id="operating_hours" type="number" {...register("operating_hours")} placeholder="Ex: 12500" />
            </div>
            <div>
              <Label htmlFor="geo_coordinates">Coordenadas Geográficas</Label>
              <Input id="geo_coordinates" {...register("geo_coordinates")} placeholder="Ex: -23.5505, -46.6333" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="notes">Observações Adicionais</Label>
              <Textarea id="notes" {...register("notes")} placeholder="Notas sobre a operação, histórico, etc." />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="docs" className="space-y-4 pt-4">
          <Controller
            name="image_files"
            control={control}
            render={({ field: { onChange, value } }) => (
              <ImageUploader
                initialFiles={value?.existing || []}
                onFilesChange={onChange}
              />
            )}
          />
          <div>
            <Label htmlFor="manual_url">Link para Manual</Label>
            <Input id="manual_url" {...register("manual_url")} placeholder="https://..." />
          </div>
          <div>
            <Label htmlFor="certificates_url">Link para Certificados</Label>
            <Input id="certificates_url" {...register("certificates_url")} placeholder="https://..." />
          </div>
        </TabsContent>
        
        <TabsContent value="management" className="space-y-4 pt-4">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="owner_department">Proprietário/Responsável</Label>
              <Input id="owner_department" {...register("owner_department")} placeholder="Ex: Departamento de Produção" />
            </div>
            <div>
              <Label htmlFor="supplier_info">Fornecedor/Manutenção</Label>
              <Input id="supplier_info" {...register("supplier_info")} placeholder="Ex: Assistência Técnica XYZ (contato)" />
            </div>
            <div>
              <Label htmlFor="responsible_unit">Unidade/Empresa Responsável</Label>
              <Input id="responsible_unit" {...register("responsible_unit")} placeholder="Ex: Filial São Paulo" />
            </div>
            <div>
              <Label htmlFor="acquisition_cost">Custo de Aquisição</Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="acquisition_cost" type="number" step="0.01" {...register("acquisition_cost")} placeholder="55000.00" className="pl-9" />
              </div>
            </div>
            <div>
              <Label htmlFor="depreciation_value">Valor de Depreciação</Label>
               <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="depreciation_value" type="number" step="0.01" {...register("depreciation_value")} placeholder="5500.00" className="pl-9" />
              </div>
            </div>
            <div>
              <Label htmlFor="lastmaintenance">Última Manutenção *</Label>
              <Input id="lastmaintenance" type="date" {...register("lastmaintenance", { required: "A data da última manutenção é obrigatória" })} />
              <ErrorMessage name="lastmaintenance" />
            </div>
            <div>
              <Label htmlFor="nextmaintenance">Próxima Manutenção *</Label>
              <Input id="nextmaintenance" type="date" {...register("nextmaintenance", { required: "A data da próxima manutenção é obrigatória" })} />
              <ErrorMessage name="nextmaintenance" />
            </div>
           </div>
        </TabsContent>

      </Tabs>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? 'Atualizar Equipamento' : 'Cadastrar Equipamento'}
        </Button>
      </div>
    </form>
  );
};

export default EquipmentForm;