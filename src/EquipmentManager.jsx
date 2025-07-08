import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Settings, Briefcase, ScanLine, Lock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/hooks/useAuth.js';
import { useLicense } from '@/hooks/useLicense.js';
import QRCodeDisplayModal from '@/components/equipment/QRCodeDisplayModal';
import QRCodeScannerComponent from '@/components/equipment/QRCodeScannerComponent';
import EquipmentDetailsModal from '@/components/equipment/EquipmentDetailsModal';
import EquipmentForm from '@/components/equipment/EquipmentForm';
import EquipmentCard from '@/components/equipment/EquipmentCard';

const APP_URL = import.meta.env.VITE_APP_URL || window.location.origin;

const EquipmentManager = ({ equipments, categories }) => {
  const { userProfile, hasAccess } = useAuth();
  const { limits } = useLicense();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState(null);
  const [isQrDisplayOpen, setIsQrDisplayOpen] = useState(false);
  const [selectedEquipmentForQr, setSelectedEquipmentForQr] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scannedEquipmentDetails, setScannedEquipmentDetails] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const equipmentLimit = limits.equipment;
  const isAtLimit = equipmentLimit !== Infinity && equipments.length >= equipmentLimit;

  const filteredEquipments = equipments.filter(equipment => {
    const name = equipment.name || "";
    const category = equipment.category || "";
    const location = equipment.location || "";
    const serial = equipment.serialnumber || "";
    const brand = equipment.brand || "";
    const model = equipment.model || "";

    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      serial.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
      model.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter = filterStatus === 'all' || equipment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const generateQrCodePayload = (equipmentId) => {
    return `${APP_URL}/app/equipment/view/${equipmentId}`;
  };
  
  const handleCancelForm = useCallback(() => {
    setIsFormOpen(false);
    setEditingEquipment(null);
  }, []);

  const saveEquipmentMutation = useMutation(
    async (formData) => {
      if (!userProfile || !userProfile.current_company_id) {
        throw new Error("Nenhuma empresa selecionada.");
      }
      const isEditing = !!editingEquipment?.id;
      if (!isEditing && isAtLimit) {
        throw new Error(`Limite de ${equipmentLimit} equipamentos atingido.`);
      }

      const equipmentId = isEditing ? editingEquipment.id : crypto.randomUUID();

      let finalPhotoUrls = formData.existing_photos || [];
      if (formData.new_photos && formData.new_photos.length > 0) {
        const uploadPromises = formData.new_photos.map(async (fileWrapper) => {
          const filePath = `${userProfile.id}/equipment-photos/${equipmentId}/${fileWrapper.file.name}`;
          const { error: uploadError } = await supabase.storage
            .from('ticket-attachments')
            .upload(filePath, fileWrapper.file, { upsert: true });

          if (uploadError) throw new Error(`Falha no upload da imagem: ${uploadError.message}`);
          
          const { data: { publicUrl } } = supabase.storage
            .from('ticket-attachments')
            .getPublicUrl(filePath);

          return publicUrl;
        });
        const newPhotoUrls = await Promise.all(uploadPromises);
        finalPhotoUrls = [...finalPhotoUrls, ...newPhotoUrls];
      }

      const equipmentData = { 
        ...formData.dbData,
        photos_urls: finalPhotoUrls,
        company_id: userProfile.current_company_id, 
        user_id: userProfile.id,
        updatedat: new Date().toISOString(),
      };
      
      if (isEditing) {
        const { error } = await supabase.from('equipments').update(equipmentData).eq('id', equipmentId);
        if (error) throw error;
      } else {
        const qrcode_payload = generateQrCodePayload(equipmentId);
        const { error } = await supabase.from('equipments').insert({ 
          ...equipmentData, 
          id: equipmentId, 
          qrcode_payload, 
          createdat: new Date().toISOString() 
        });
        if (error) throw error;
      }
    },
    {
      onSuccess: () => {
        toast({ title: "Sucesso!", description: `Equipamento ${editingEquipment ? 'atualizado' : 'cadastrado'}.` });
        queryClient.invalidateQueries(['companyData', userProfile.current_company_id, userProfile.id]);
        handleCancelForm();
      },
      onError: (error) => {
        console.error('Erro ao salvar equipamento:', error);
        toast({ title: "Erro ao Salvar", description: error.message, variant: "destructive" });
        if (error.message.includes('Limite')) {
          setIsFormOpen(false);
        }
      },
    }
  );

  const handleFormSubmit = (formData) => {
    saveEquipmentMutation.mutate(formData);
  };
  
  const handleShowQrModal = (equipment) => {
    if(!hasAccess('equipment_qrcode_view')) {
      toast({ title: "Funcionalidade Premium", description: "Visualizar QRCodes requer um plano superior.", variant: "default" });
      return;
    }
    setSelectedEquipmentForQr(equipment);
    setIsQrDisplayOpen(true);
  };

  const openAddDialog = () => {
    if (!userProfile?.current_company_id) {
      toast({ title: "Selecione uma Empresa", description: "Você precisa selecionar ou criar uma empresa antes de adicionar equipamentos.", variant: "default", duration: 5000});
      return;
    }
    if (isAtLimit) {
       toast({ title: "Limite Atingido", description: `Seu plano atual permite até ${equipmentLimit} equipamentos. Faça upgrade para adicionar mais.`, variant: "default", duration: 7000 });
       return;
    }
    setEditingEquipment(null);
    setIsFormOpen(true);
  };

  const openEditDialog = (equipment) => {
     if (!hasAccess('equipment_edit')) {
       toast({ title: "Acesso Negado", description: "Seu plano atual não permite editar equipamentos.", variant: "destructive" });
       return;
    }
    setEditingEquipment(equipment);
    setIsFormOpen(true);
  };

  const handleScanSuccess = async (decodedText) => {
    toast({ title: "QRCode Lido!", description: `Conteúdo: ${decodedText}`, duration: 2000 });
    if(!hasAccess('equipment_qrcode_scan')) {
      toast({ title: "Funcionalidade Premium", description: "Escanear QRCodes requer um plano superior.", variant: "default" });
      setIsScannerOpen(false);
      return;
    }
    try {
      const urlParts = decodedText.split('/');
      const equipmentId = urlParts[urlParts.length - 1];

      if (!equipmentId) {
        throw new Error("Formato de QRCode inválido. ID do equipamento não encontrado.");
      }
      
      const { data: equipment, error } = await supabase
        .from('equipments')
        .select('*')
        .eq('id', equipmentId)
        .eq('company_id', userProfile.current_company_id) 
        .single();

      if (error) {
        if (error.code === 'PGRST116') throw new Error(`Equipamento com ID ${equipmentId} não encontrado na empresa atual ou acesso negado.`);
        throw error;
      }
      
      if (equipment) {
        setScannedEquipmentDetails(equipment);
        setIsDetailsModalOpen(true);
      } else {
        throw new Error(`Equipamento com ID ${equipmentId} não encontrado.`);
      }
    } catch (e) {
      console.error("Erro ao processar QRCode:", e);
      toast({ title: "Erro ao Processar QRCode", description: e.message, variant: "destructive" });
    }
    setIsScannerOpen(false);
  };

  const handleScanError = (errorMessage) => {
  };
  
  if (!userProfile?.current_company_id && userProfile?.role !== 'client' && userProfile?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-card shadow-xl h-[calc(100vh-200px)]">
        <Briefcase className="w-16 h-16 text-primary mb-6" />
        <h2 className="text-2xl font-semibold text-foreground mb-3">Nenhuma Empresa Selecionada</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Por favor, selecione uma empresa no menu lateral ou crie uma nova na seção 'Minha Empresa' para gerenciar equipamentos.
        </p>
      </div>
    );
  }

  const canScan = hasAccess('equipment_qrcode_scan');

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Settings className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Equipamentos</h1>
            <p className="text-muted-foreground">Gerencie todos os equipamentos da empresa selecionada.</p>
            <p className="text-sm text-amber-500 mt-1 font-medium">
              {equipments.length}/{equipmentLimit === Infinity ? '∞' : equipmentLimit} equipamentos cadastrados.
              {isAtLimit && " Limite do plano atingido."}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
           <Button 
            variant="outline"
            className={`border-primary text-primary hover:bg-primary/10 hover:text-primary ${!canScan ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => canScan ? setIsScannerOpen(true) : toast({ title: "Funcionalidade Premium", description: "Escanear QRCodes requer um plano superior."})}
            disabled={!userProfile?.current_company_id || !canScan}
            title={!canScan ? "Funcionalidade Premium: Escanear QRCodes" : "Escanear Equipamento"}
          >
            <ScanLine className="h-4 w-4 mr-2" /> Escanear {!canScan && <Lock className="ml-1 h-3 w-3"/>}
          </Button>
          <Dialog open={isFormOpen} onOpenChange={(open) => { if (!saveEquipmentMutation.isLoading) setIsFormOpen(open); }}>
            <DialogTrigger asChild>
              <Button 
                onClick={openAddDialog}
                disabled={!userProfile?.current_company_id || isAtLimit}
                title={isAtLimit ? `Limite de ${equipmentLimit} equipamentos atingido. Faça upgrade.` : "Novo Equipamento"}
              >
                <Plus className="h-4 w-4 mr-2" /> Novo Equipamento {isAtLimit && <Lock className="ml-1 h-3 w-3"/>}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle>{editingEquipment?.id ? 'Editar Equipamento' : 'Novo Equipamento'}</DialogTitle></DialogHeader>
              <EquipmentForm 
                initialData={editingEquipment} 
                onSubmit={handleFormSubmit} 
                onCancel={handleCancelForm} 
                isSubmitting={saveEquipmentMutation.isLoading}
                categories={categories}
              />
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input placeholder="Buscar por nome, categoria, marca, local ou S/N..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Filtrar por status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os Status</SelectItem>
            <SelectItem value="operational">Operacional</SelectItem>
            <SelectItem value="maintenance">Em Manutenção</SelectItem>
            <SelectItem value="broken">Quebrado</SelectItem>
            <SelectItem value="retired">Aposentado</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipments.map((equipment, index) => (
          <motion.div key={equipment.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: index * 0.05 }}>
            <EquipmentCard equipment={equipment} onEdit={openEditDialog} onShowQr={handleShowQrModal} onShowDetails={() => { setScannedEquipmentDetails(equipment); setIsDetailsModalOpen(true); }} canEdit={hasAccess('equipment_edit')} canViewQr={hasAccess('equipment_qrcode_view')} />
          </motion.div>
        ))}
      </div>
      {filteredEquipments.length === 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12">
          <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum equipamento encontrado</h3>
          <p className="text-muted-foreground">{searchTerm || filterStatus !== 'all' ? 'Tente ajustar os filtros.' : 'Cadastre seu primeiro equipamento para a empresa atual.'}</p>
        </motion.div>
      )}
      {selectedEquipmentForQr && (
        <QRCodeDisplayModal 
          isOpen={isQrDisplayOpen} 
          setIsOpen={setIsQrDisplayOpen} 
          equipment={selectedEquipmentForQr} 
        />
      )}
      <QRCodeScannerComponent 
        isOpen={isScannerOpen}
        setIsOpen={setIsScannerOpen}
        onScanSuccess={handleScanSuccess}
        onScanError={handleScanError}
      />
      {scannedEquipmentDetails && (
        <EquipmentDetailsModal
          isOpen={isDetailsModalOpen}
          setIsOpen={setIsDetailsModalOpen}
          equipment={scannedEquipmentDetails}
        />
      )}
    </div>
  );
};

export default EquipmentManager;