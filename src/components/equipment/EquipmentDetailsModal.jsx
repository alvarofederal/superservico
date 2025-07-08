
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Tag, MapPin, Settings, Info, CalendarDays, Package, ExternalLink, HardHat, DollarSign, BarChart, Users, FileText, Anchor, History, Trash2, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import QRCodeStylized from '@/components/equipment/QRCodeStylized';
import EquipmentHistoryTimeline from '@/components/equipment/EquipmentHistoryTimeline';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logAction } from '@/services/logService';

const statusColors = {
  operational: 'bg-green-500',
  maintenance: 'bg-yellow-500',
  broken: 'bg-red-500',
  retired: 'bg-gray-500'
};

const statusLabels = {
  operational: 'Operacional',
  maintenance: 'Em Manutenção',
  broken: 'Quebrado',
  retired: 'Aposentado'
};

const DetailItem = ({ icon: Icon, label, value, children, isLink }) => (
  <div className="flex items-start space-x-4 py-3 border-b border-border/30 last:border-b-0">
    <Icon className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
    <div className="flex-grow">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {value ? (
        isLink ? (
          <a href={value} target="_blank" rel="noopener noreferrer" className="text-base text-blue-400 hover:underline break-all">
            {value}
          </a>
        ) : (
          <p className="text-base text-foreground break-words">{value}</p>
        )
      ) : children || <p className="text-base text-muted-foreground/70 italic">Não informado</p>}
    </div>
  </div>
);

const PhotoGallery = ({ photos }) => {
  if (!photos || photos.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-4">
        Nenhuma foto disponível.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {photos.map((photoUrl, index) => (
        <a key={index} href={photoUrl} target="_blank" rel="noopener noreferrer" className="block rounded-lg overflow-hidden border border-border/50 hover:opacity-80 transition-opacity">
          <img-replace src={photoUrl} alt={`Foto do equipamento ${index + 1}`} className="w-full h-24 object-cover" />
        </a>
      ))}
    </div>
  );
};

const sheetVariants = {
  hidden: { x: "100%" },
  visible: { x: 0 },
};

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const EquipmentDetailsModal = ({ equipment, onClose, onEdit }) => {
  const { userProfile, currentCompanyId, hasAccess } = useAuth();
  const queryClient = useQueryClient();

  const deleteMutation = useMutation(
    async (equipmentId) => {
        const { error } = await supabase.from('equipments').delete().eq('id', equipmentId);
        if (error) throw error;
        return equipmentId;
    },
    {
      onSuccess: async () => {
        toast({ title: "Sucesso!", description: "Equipamento excluído." });
        await logAction({ tag: 'EQUIPMENT_DELETE_SUCCESS', message: `Equipamento "${equipment.name}" excluído.`, meta: { equipmentId: equipment.id }, userId: userProfile?.id, companyId: currentCompanyId });
        queryClient.invalidateQueries(['equipments', currentCompanyId]);
        onClose();
      },
      onError: async (error) => {
        toast({ title: "Erro ao Excluir", description: error.message, variant: "destructive" });
        await logAction({ level: 'ERROR', tag: 'EQUIPMENT_DELETE_ERROR', message: `Falha ao excluir equipamento: "${equipment.name}"`, error, meta: { equipmentId: equipment.id }, userId: userProfile?.id, companyId: currentCompanyId });
      }
    }
  );

  const handleDelete = async () => {
    if (!equipment) return;
    await logAction({ tag: 'EQUIPMENT_DELETE_ATTEMPT', message: `Tentativa de excluir equipamento: "${equipment.name}"`, meta: { equipmentId: equipment.id }, userId: userProfile?.id, companyId: currentCompanyId });
    deleteMutation.mutate(equipment.id);
  };

  const handleEdit = () => {
    onClose();
    onEdit(equipment);
  };

  const canDelete = hasAccess('equipment_delete');
  const canEdit = hasAccess('equipment_edit');

  return (
    <AnimatePresence>
      {equipment && (
        <>
          <motion.div
            key="backdrop"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-40"
            transition={{ duration: 0.3 }}
          />
          <motion.div
            key="sheet"
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-2xl bg-card border-l border-border/50 shadow-2xl z-50 flex flex-col"
          >
            <header className="flex items-center justify-between p-4 border-b border-border/50 flex-shrink-0">
              <div className="flex items-center gap-3">
                <Package className="h-7 w-7 text-primary"/>
                <h2 className="text-xl font-bold text-foreground">{equipment.name || 'Detalhes do Equipamento'}</h2>
              </div>
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button variant="outline" size="icon" onClick={handleEdit}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {canDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="icon">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza de que deseja excluir o equipamento "{equipment.name}"? Esta ação é irreversível e removerá todos os dados associados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                          Excluir
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </header>

            <Tabs defaultValue="details" className="flex-grow flex flex-col min-h-0">
              <TabsList className="flex-shrink-0 mx-4 mt-4 grid w-auto grid-cols-2">
                <TabsTrigger value="details"><Info className="mr-2 h-4 w-4" /> Detalhes</TabsTrigger>
                <TabsTrigger value="history"><History className="mr-2 h-4 w-4" /> Histórico</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="flex-grow overflow-hidden">
                <ScrollArea className="h-full px-6 pt-2 pb-6">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-1">
                      <h3 className="text-lg font-semibold mb-2 text-primary">Informações Gerais</h3>
                      <DetailItem icon={Info} label="Descrição" value={equipment.description} />
                      <DetailItem icon={Settings} label="Categoria" value={equipment.category} />
                      <DetailItem icon={HardHat} label="Marca / Modelo" value={`${equipment.brand || 'N/A'} / ${equipment.model || 'N/A'}`} />
                      <DetailItem icon={Tag} label="Número de Série" value={equipment.serialnumber} />
                      <DetailItem icon={MapPin} label="Localização" value={equipment.location} />
                      <DetailItem icon={Tag} label="Status">
                         <Badge variant="outline" className={`${statusColors[equipment.status] || 'bg-gray-300'} text-white border-0`}>
                          {statusLabels[equipment.status] || 'Desconhecido'}
                        </Badge>
                      </DetailItem>

                      <h3 className="text-lg font-semibold mt-6 mb-2 text-primary">Operacional e Manutenção</h3>
                      <DetailItem icon={BarChart} label="Horas de Operação" value={equipment.operating_hours ? `${equipment.operating_hours}h` : 'N/A'} />
                      <DetailItem icon={CalendarDays} label="Última Manutenção" value={equipment.lastmaintenance ? new Date(equipment.lastmaintenance + 'T00:00:00').toLocaleDateString() : 'N/A'} />
                      <DetailItem icon={CalendarDays} label="Próxima Manutenção" value={equipment.nextmaintenance ? new Date(equipment.nextmaintenance + 'T00:00:00').toLocaleDateString() : 'N/A'} />
                      
                      <h3 className="text-lg font-semibold mt-6 mb-2 text-primary">Financeiro e Responsáveis</h3>
                      <DetailItem icon={DollarSign} label="Custo de Aquisição" value={equipment.acquisition_cost ? `R$ ${parseFloat(equipment.acquisition_cost).toFixed(2)}` : 'N/A'} />
                      <DetailItem icon={Users} label="Departamento Responsável" value={equipment.owner_department} />
                      <DetailItem icon={Anchor} label="Fornecedor" value={equipment.supplier_info} />

                      <h3 className="text-lg font-semibold mt-6 mb-2 text-primary">Documentação</h3>
                      <DetailItem icon={FileText} label="Manual" value={equipment.manual_url} isLink={true} />
                      <DetailItem icon={FileText} label="Certificados" value={equipment.certificates_url} isLink={true} />
                      <div className="pt-4">
                          <p className="text-sm font-medium text-muted-foreground mb-3">Fotos</p>
                          <PhotoGallery photos={equipment.photos_urls} />
                      </div>
                    </div>

                    <div className="lg:col-span-1 flex flex-col items-center justify-start space-y-6 pt-2">
                      {equipment.qrcode_payload && (
                        <div className="flex flex-col items-center p-4 bg-background/50 rounded-lg border border-border/40">
                          <p className="text-sm font-medium text-muted-foreground mb-3">QRCode</p>
                          <QRCodeStylized value={equipment.qrcode_payload} size={160} />
                          <a
                            href={equipment.qrcode_payload}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline break-all text-center mt-3 flex items-center"
                          >
                            <ExternalLink size={12} className="mr-1"/> Ver Link
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="history" className="flex-grow overflow-hidden">
                 <ScrollArea className="h-full p-6">
                    <EquipmentHistoryTimeline equipmentId={equipment.id} />
                  </ScrollArea>
              </TabsContent>
            </Tabs>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default EquipmentDetailsModal;
