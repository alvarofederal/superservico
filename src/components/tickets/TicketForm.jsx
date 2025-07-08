import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ImageUploadInput from '@/components/tickets/ImageUploadInput';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Save, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const TICKET_PRIORITIES = { low: 'Baixa', medium: 'Média', high: 'Alta' };
const APPLICATION_MODULES = ['Login', 'Dashboard', 'Relatórios', 'Manutenções', 'Equipamentos', 'Peças', 'Ordens de Serviço', 'Solicitações', 'Configurações', 'Outro'];

const TicketForm = ({ initialData, onSubmitSuccess, onCancel }) => {
  const { userProfile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageFilesToUpload, setImageFilesToUpload] = useState([]);
  const [existingImageObjects, setExistingImageObjects] = useState([]);


  const { register, handleSubmit, control, reset, setValue, watch, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      application_module: APPLICATION_MODULES[0],
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        title: initialData.title || '',
        description: initialData.description || '',
        priority: initialData.priority || 'medium',
        application_module: initialData.application_module || APPLICATION_MODULES[0],
      });
      
      if (initialData.id) {
        const fetchInitialImages = async () => {
          const { data: imagesData, error: imagesError } = await supabase
            .from('ticket_images')
            .select('id, image_url, file_name')
            .eq('ticket_id', initialData.id);

          if (imagesError) {
            console.error("Erro ao carregar imagens iniciais:", imagesError);
            toast({ title: "Erro ao carregar imagens", description: imagesError.message, variant: "destructive" });
            setExistingImageObjects([]);
          } else {
            setExistingImageObjects(imagesData.map(img => ({ 
              id: img.id, 
              preview: img.image_url, 
              name: img.file_name, 
              isUploaded: true, 
              file: null 
            })));
          }
        };
        fetchInitialImages();
      } else {
        setExistingImageObjects([]);
      }
      setImageFilesToUpload([]);

    } else {
      reset({
        title: '',
        description: '',
        priority: 'medium',
        application_module: APPLICATION_MODULES[0],
      });
      setImageFilesToUpload([]);
      setExistingImageObjects([]);
    }
  }, [initialData, reset]);

  const handleFilesChange = (newFiles) => {
    setImageFilesToUpload(newFiles);
  };

  const onSubmit = async (formData) => {
    if (!userProfile) {
      toast({ title: "Erro de Autenticação", description: "Usuário não identificado.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);

    try {
      const ticketPayload = {
        ...formData,
        user_id: userProfile.id,
        company_id: userProfile.current_company_id || null,
        status: initialData?.status || 'open',
      };

      let ticketResult;
      if (initialData?.id) {
        const { data, error } = await supabase
          .from('tickets')
          .update({ ...ticketPayload, updated_at: new Date().toISOString() })
          .eq('id', initialData.id)
          .select()
          .single();
        if (error) throw error;
        ticketResult = data;
        toast({ title: "Sucesso!", description: "Chamado atualizado." });
      } else {
        const { data, error } = await supabase
          .from('tickets')
          .insert(ticketPayload)
          .select()
          .single();
        if (error) throw error;
        ticketResult = data;
        toast({ title: "Sucesso!", description: "Novo chamado criado." });
      }

      if (imageFilesToUpload.length > 0 && ticketResult?.id) {
        const imageUploadPromises = imageFilesToUpload.map(async (file) => {
          if (!file || !(file instanceof File)) {
            console.warn("Item inválido em imageFilesToUpload:", file);
            return null;
          }
          const uniqueFileName = `${userProfile.id}/${ticketResult.id}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('ticket-attachments')
            .upload(uniqueFileName, file, {
              cacheControl: '3600',
              upsert: false, 
            });

          if (uploadError) {
            console.error("Erro no upload da imagem:", uploadError);
            toast({ title: "Erro no Upload", description: `Falha ao enviar ${file.name}: ${uploadError.message}`, variant: "destructive" });
            return null;
          }
          
          const publicUrlData = supabase.storage.from('ticket-attachments').getPublicUrl(uploadData.path);

          return {
            ticket_id: ticketResult.id,
            image_url: publicUrlData.data.publicUrl,
            file_name: file.name,
            file_size_kb: Math.round(file.size / 1024),
          };
        });

        const imageRecords = (await Promise.all(imageUploadPromises)).filter(record => record !== null);
        
        if (imageRecords.length > 0) {
          const { error: imageDbError } = await supabase.from('ticket_images').insert(imageRecords);
          if (imageDbError) {
            console.error("Erro ao salvar metadados das imagens:", imageDbError);
            toast({ title: "Erro ao Salvar Imagens", description: `Não foi possível registrar as imagens no banco: ${imageDbError.message}`, variant: "destructive" });
          }
        }
      }
      
      onSubmitSuccess(ticketResult);
      reset();
      setImageFilesToUpload([]);
      setExistingImageObjects([]);

    } catch (error) {
      console.error("Erro ao salvar chamado:", error);
      toast({ title: "Erro ao Salvar Chamado", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const combinedInitialFilesForUploadComponent = initialData ? existingImageObjects : [];

  return (
    <motion.form 
      onSubmit={handleSubmit(onSubmit)} 
      className="space-y-6 bg-card p-6 rounded-lg shadow-xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div>
        <Label htmlFor="title" className="text-foreground">Título do Chamado</Label>
        <Input
          id="title"
          {...register("title", { 
            required: "Título é obrigatório", 
            maxLength: { value: 100, message: "Título deve ter no máximo 100 caracteres" }
          })}
          className={`mt-1 ${errors.title ? 'border-destructive' : 'border-input'}`}
          placeholder="Ex: Erro ao gerar relatório de vendas"
        />
        {errors.title && <p className="text-sm text-destructive mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <Label htmlFor="description" className="text-foreground">Descrição Detalhada do Erro</Label>
        <Textarea
          id="description"
          {...register("description", { 
            required: "Descrição é obrigatória",
            maxLength: { value: 2000, message: "Descrição deve ter no máximo 2000 caracteres" }
          })}
          rows={5}
          className={`mt-1 ${errors.description ? 'border-destructive' : 'border-input'}`}
          placeholder="Descreva o problema em detalhes, incluindo passos para reproduzir, se possível."
        />
        {errors.description && <p className="text-sm text-destructive mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Label htmlFor="priority" className="text-foreground">Prioridade</Label>
          <Select
            onValueChange={(value) => setValue('priority', value)}
            value={watch('priority')} 
            name="priority"
          >
            <SelectTrigger id="priority" className={`mt-1 ${errors.priority ? 'border-destructive' : 'border-input'}`}>
              <SelectValue placeholder="Selecione a prioridade" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TICKET_PRIORITIES).map(([key, value]) => (
                <SelectItem key={key} value={key}>{value}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.priority && <p className="text-sm text-destructive mt-1">{errors.priority.message}</p>}
        </div>

        <div>
          <Label htmlFor="application_module" className="text-foreground">Módulo da Aplicação</Label>
          <Select
            onValueChange={(value) => setValue('application_module', value)}
            value={watch('application_module')}
            name="application_module"
          >
            <SelectTrigger id="application_module" className={`mt-1 ${errors.application_module ? 'border-destructive' : 'border-input'}`}>
              <SelectValue placeholder="Selecione o módulo" />
            </SelectTrigger>
            <SelectContent>
              {APPLICATION_MODULES.map((module) => (
                <SelectItem key={module} value={module}>{module}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.application_module && <p className="text-sm text-destructive mt-1">{errors.application_module.message}</p>}
        </div>
      </div>
      
      <div>
        <Label className="text-foreground">Anexar Imagens (Opcional)</Label>
        <ImageUploadInput 
          onFilesChange={handleFilesChange} 
          initialFiles={combinedInitialFilesForUploadComponent} 
        />
        <p className="text-xs text-muted-foreground mt-1">Máximo de 5 imagens. Formatos: PNG, JPEG, JPG. Tamanho máx: 1MB por imagem.</p>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t border-border">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          <XCircle className="mr-2 h-4 w-4" /> Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90">
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {initialData?.id ? 'Salvar Alterações' : 'Abrir Chamado'}
        </Button>
      </div>
    </motion.form>
  );
};

export default TicketForm;