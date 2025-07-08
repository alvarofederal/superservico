import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Save, ArrowLeft, ShieldAlert, UserCog } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth.js';
import { useNavigate, useParams } from 'react-router-dom';

const AVAILABLE_FEATURES = [
  { id: 'dashboard_access', label: 'Acesso ao Dashboard' },
  { id: 'requests_management', label: 'Gerenciamento de Solicitações' },
  { id: 'work_orders_management', label: 'Gerenciamento de Ordens de Serviço' },
  { id: 'equipment_management', label: 'Gerenciamento de Equipamentos' },
  { id: 'parts_management', label: 'Gerenciamento de Peças' },
  { id: 'company_management_admin', label: 'Administração de Empresas (Ver/Editar Todas)' },
  { id: 'user_management_system', label: 'Gerenciamento de Usuários do Sistema (Admin Global)' },
];

const AdminUserPermissions = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { userProfile: adminUserProfile } = useAuth();
  const [targetUser, setTargetUser] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchUserDataAndPermissions = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data: userDataResponse, error: functionError } = await supabase.functions.invoke('get-admin-user-details', {
        body: { userId }
      });

      if (functionError) throw functionError;
      if (userDataResponse.error) throw new Error(userDataResponse.error);
      
      setTargetUser(userDataResponse);

      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions')
        .select('feature, has_access')
        .eq('user_id', userId);

      if (permissionsError) throw permissionsError;
      
      const loadedPermissions = {};
      AVAILABLE_FEATURES.forEach(feature => {
        const found = permissionsData.find(p => p.feature === feature.id);
        loadedPermissions[feature.id] = found ? found.has_access : false;
      });
      setPermissions(loadedPermissions);

    } catch (error) {
      console.error("Error fetching user data or permissions:", error);
      toast({ title: "Erro ao carregar dados", description: error.message, variant: "destructive" });
      navigate('/app'); 
    } finally {
      setIsLoading(false);
    }
  }, [userId, navigate]);

  useEffect(() => {
    if (adminUserProfile?.role !== 'admin') {
      toast({ title: "Acesso Negado", description: "Você não tem permissão para acessar esta página.", variant: "destructive" });
      navigate('/app');
      return;
    }
    fetchUserDataAndPermissions();
  }, [adminUserProfile, fetchUserDataAndPermissions, navigate]);

  const handlePermissionChange = (featureId, checked) => {
    setPermissions(prev => ({ ...prev, [featureId]: checked }));
  };

  const handleSaveChanges = async () => {
    if (!targetUser) return;
    setIsSaving(true);
    try {
      const permissionUpserts = AVAILABLE_FEATURES.map(feature => ({
        user_id: targetUser.id,
        feature: feature.id,
        has_access: permissions[feature.id] || false,
        updated_at: new Date().toISOString(),
      }));

      const { error } = await supabase
        .from('user_permissions')
        .upsert(permissionUpserts, { onConflict: 'user_id, feature' });

      if (error) throw error;

      toast({ title: "Sucesso!", description: `Permissões para ${targetUser.full_name} atualizadas.` });
    } catch (error) {
      console.error("Error saving permissions:", error);
      toast({ title: "Erro ao Salvar", description: `Falha ao salvar permissões: ${error.message}`, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-[calc(100vh-200px)]"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>;
  }

  if (!targetUser) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center p-8">
        <ShieldAlert className="h-16 w-16 mx-auto text-destructive mb-4" />
        <h2 className="text-2xl font-semibold">Usuário não encontrado</h2>
        <p className="text-muted-foreground">Não foi possível carregar os dados do usuário selecionado.</p>
        <Button onClick={() => navigate('/app/user-management')} className="mt-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar para Gerenciamento de Usuários
        </Button>
      </motion.div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      transition={{ duration: 0.5 }}
      className="space-y-8 max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <UserCog className="mr-3 h-8 w-8 text-primary" /> Gerenciar Permissões de Usuário
          </h1>
          <p className="text-muted-foreground mt-1">
            Editando permissões para: <span className="font-semibold text-primary">{targetUser.full_name} ({targetUser.email})</span>
          </p>
           <p className="text-sm text-muted-foreground">
            Perfil do Sistema: <span className="font-semibold capitalize">{targetUser.role}</span>
          </p>
        </div>
        <Button onClick={() => navigate('/app/user-management')} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>

      <Card className="bg-card/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Funcionalidades do Sistema</CardTitle>
          <CardDescription>Marque as caixas para conceder acesso à funcionalidade específica.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {AVAILABLE_FEATURES.map(feature => (
            <motion.div 
              key={feature.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: AVAILABLE_FEATURES.indexOf(feature) * 0.05 }}
              className="flex items-center space-x-3 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
            >
              <Checkbox
                id={feature.id}
                checked={permissions[feature.id] || false}
                onCheckedChange={(checked) => handlePermissionChange(feature.id, !!checked)}
                className="w-5 h-5"
              />
              <Label htmlFor={feature.id} className="text-base font-medium text-foreground cursor-pointer flex-grow">
                {feature.label}
              </Label>
            </motion.div>
          ))}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSaveChanges} disabled={isSaving} className="bg-green-500 hover:bg-green-600 text-white shadow-lg px-8 py-3 text-base">
          {isSaving ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
          Salvar Alterações
        </Button>
      </div>
    </motion.div>
  );
};

export default AdminUserPermissions;