
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Plus, Briefcase, Check, ChevronsRight, Lock } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth.js';
import { useLicense } from '@/hooks/useLicense.js';
import { logAction } from '@/services/logService';
import CreateCompanyForm from './CreateCompanyForm';
import CompanyList from './CompanyList';
import CompanyDetails from './CompanyDetails';

const CompanyManager = () => {
  const { userProfile, userCompanies, selectCompany, refreshAuthData } = useAuth();
  const { limits } = useLicense();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompanyIdForView, setSelectedCompanyIdForView] = useState(userProfile?.current_company_id);

  const companiesLimit = limits.companies;
  const isAtLimit = companiesLimit !== Infinity && userCompanies.length >= companiesLimit;

  useEffect(() => {
    setSelectedCompanyIdForView(userProfile?.current_company_id);
  }, [userProfile?.current_company_id]);

  const handleCreateCompany = async ({ name }) => {
    if (isAtLimit) {
      toast({ title: "Limite Atingido", description: `Seu plano atual permite até ${companiesLimit} empresas. Faça upgrade para adicionar mais.`, variant: "default" });
      return;
    }
    setIsSubmitting(true);
    await logAction({ tag: 'COMPANY_CREATE_ATTEMPT', message: `Tentativa de criar empresa: "${name}"`, userId: userProfile?.id });
    try {
      if (!userProfile || !userProfile.id) throw new Error("Usuário não autenticado.");
      
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{ name, owner_id: userProfile.id }])
        .select()
        .single();

      if (companyError) throw companyError;
      
      await logAction({ tag: 'COMPANY_CREATE_SUCCESS', message: `Empresa "${name}" criada com sucesso.`, meta: { companyId: companyData.id }, userId: userProfile.id, companyId: companyData.id });
      toast({ title: "Sucesso!", description: `Empresa "${name}" criada.` });
      setIsCreateDialogOpen(false);
      
      if (companyData) {
        await selectCompany(companyData.id); 
        setSelectedCompanyIdForView(companyData.id);
        if (typeof refreshAuthData === 'function') {
          await refreshAuthData(true); 
        }
      }

    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      toast({ title: "Erro ao Criar Empresa", description: error.message, variant: "destructive" });
      await logAction({ level: 'ERROR', tag: 'COMPANY_CREATE_ERROR', message: `Falha ao criar empresa: "${name}"`, error, userId: userProfile?.id });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInviteUser = async ({ email, roleInCompany, companyId }) => {
    setIsSubmitting(true);
    await logAction({ tag: 'USER_INVITE_ATTEMPT', message: `Tentativa de convidar usuário: "${email}" para a empresa.`, meta: { roleInCompany }, userId: userProfile?.id, companyId });
    try {
        const { data: invitedUserId, error: findUserError } = await supabase.rpc('get_user_id_by_email', {
          p_email: email
        });

        if (findUserError) throw findUserError;

        if (!invitedUserId) {
            toast({ title: "Usuário não encontrado", description: `Usuário com email ${email} não encontrado. O usuário precisa se cadastrar primeiro.`, variant: "destructive", duration: 7000});
            await logAction({ level: 'WARN', tag: 'USER_INVITE_NOT_FOUND', message: `Usuário "${email}" não encontrado no sistema.`, meta: { email }, userId: userProfile?.id, companyId });
            setIsSubmitting(false);
            return false; 
        }
        
        const { error: inviteError } = await supabase
            .from('company_users')
            .insert([{ company_id: companyId, user_id: invitedUserId, role_in_company: roleInCompany }]);
        
        if (inviteError) {
            if (inviteError.code === '23505') {
                 toast({ title: "Usuário Já Membro", description: `${email} já faz parte desta empresa.`, variant: "default" });
                 await logAction({ level: 'WARN', tag: 'USER_INVITE_ALREADY_MEMBER', message: `Usuário "${email}" já é membro da empresa.`, meta: { invitedUserId }, userId: userProfile?.id, companyId });
            } else {
                throw inviteError;
            }
        } else {
            toast({ title: "Sucesso!", description: `Usuário ${email} convidado.` });
            await logAction({ tag: 'USER_INVITE_SUCCESS', message: `Usuário "${email}" convidado com sucesso.`, meta: { invitedUserId, roleInCompany }, userId: userProfile?.id, companyId });
        }
        return true; 
    } catch (error) {
        console.error('Erro ao convidar usuário:', error);
        toast({ title: "Erro ao Convidar", description: error.message, variant: "destructive" });
        await logAction({ level: 'ERROR', tag: 'USER_INVITE_ERROR', message: `Falha ao convidar usuário: "${email}"`, error, userId: userProfile?.id, companyId });
        return false;
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleRemoveUserFromCompany = async (userIdToRemove, companyId) => {
    if (userIdToRemove === userProfile?.id) {
       const companyDetails = userCompanies.find(c => c.company_id === companyId);
       if (companyDetails?.owner_id === userProfile?.id) {
         toast({ title: "Ação não permitida", description: "Você não pode remover a si mesmo como proprietário.", variant: "destructive" });
         return;
       }
    }
    
    await logAction({ tag: 'USER_REMOVE_FROM_COMPANY_ATTEMPT', message: `Tentativa de remover usuário da empresa.`, meta: { userIdToRemove }, userId: userProfile?.id, companyId });

    try {
        const { error } = await supabase.from('company_users').delete().match({ user_id: userIdToRemove, company_id: companyId });
        if (error) throw error;
        toast({ title: "Usuário Removido", description: "Usuário removido da empresa com sucesso." });
        await logAction({ tag: 'USER_REMOVE_FROM_COMPANY_SUCCESS', message: `Usuário removido com sucesso.`, meta: { userIdToRemove }, userId: userProfile?.id, companyId });
        if (typeof refreshAuthData === 'function') {
          await refreshAuthData(false);
        }
    } catch (error) {
        console.error("Erro ao remover usuário da empresa:", error);
        toast({ title: "Erro ao Remover", description: error.message, variant: "destructive" });
        await logAction({ level: 'ERROR', tag: 'USER_REMOVE_FROM_COMPANY_ERROR', message: 'Falha ao remover usuário da empresa.', error, meta: { userIdToRemove }, userId: userProfile?.id, companyId });
    }
  };

  const handleSelectCompanyForView = (companyId) => {
    setSelectedCompanyIdForView(companyId);
  }

  const handleConfirmCompanySelection = async () => {
    if (selectedCompanyIdForView) {
      await selectCompany(selectedCompanyIdForView);
      if (typeof refreshAuthData === 'function') {
        await refreshAuthData(true);
      }
    }
  };

  const selectedCompanyDetails = selectedCompanyIdForView ? userCompanies.find(c => c.company_id === selectedCompanyIdForView) : null;
  const showCreateFirstCompany = !userCompanies || userCompanies.length === 0;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8 w-full max-w-5xl mx-auto"
    >
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold text-foreground">
            Gerenciamento de Empresas
          </h1>
          <p className="text-muted-foreground mt-1">Crie, gerencie suas empresas e convide membros.</p>
          <p className="text-sm text-amber-500 mt-1 font-medium">
            {userCompanies.length}/{companiesLimit === Infinity ? '∞' : companiesLimit} empresas cadastradas.
            {isAtLimit && " Limite do plano atingido."}
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              disabled={isAtLimit}
              title={isAtLimit ? `Limite de ${companiesLimit} empresas atingido. Faça upgrade.` : "Nova Empresa"}
            >
              <Plus className="mr-2 h-5 w-5" /> Nova Empresa {isAtLimit && <Lock className="ml-1 h-3 w-3"/>}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl text-foreground">Criar Nova Empresa</DialogTitle>
            </DialogHeader>
            <CreateCompanyForm onSubmit={handleCreateCompany} onCancel={() => setIsCreateDialogOpen(false)} isSubmitting={isSubmitting} />
          </DialogContent>
        </Dialog>
      </div>

      {showCreateFirstCompany && (
        <Card className="text-center p-8 shadow-lg border-2 border-dashed border-primary/40">
            <CardHeader>
                <Briefcase className="mx-auto h-12 w-12 text-primary mb-4" />
                <CardTitle className="text-2xl">Comece Criando Sua Empresa</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-6">
                    Você ainda não faz parte de nenhuma empresa. Crie sua primeira empresa para começar!
                </p>
            </CardContent>
            <CardFooter className="justify-center">
                 <Button size="lg" onClick={() => setIsCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-5 w-5" /> Criar Minha Primeira Empresa
                </Button>
            </CardFooter>
        </Card>
      )}

      {!showCreateFirstCompany && (
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1">
                 <CompanyList 
                    userCompanies={userCompanies}
                    currentCompanyId={userProfile?.current_company_id} 
                    selectedCompanyIdForView={selectedCompanyIdForView}
                    onSelectCompany={handleSelectCompanyForView}
                  />
            </div>
            <div className="md:col-span-2">
                 {selectedCompanyDetails ? (
                    <CompanyDetails 
                      company={selectedCompanyDetails}
                      userProfile={userProfile}
                      onInviteUser={handleInviteUser}
                      onRemoveUser={handleRemoveUserFromCompany}
                      isSubmitting={isSubmitting}
                    />
                  ) : (
                    <Card className="flex flex-col items-center justify-center p-8 h-full text-center">
                        <CardHeader>
                            <ChevronsRight className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                            <CardTitle>Selecione uma Empresa</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground">Escolha uma empresa da lista ao lado para ver os detalhes e gerenciar membros.</p>
                        </CardContent>
                    </Card>
                  )}
            </div>
        </div>
      )}

       {!showCreateFirstCompany && selectedCompanyIdForView && selectedCompanyIdForView !== userProfile?.current_company_id && (
         <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl p-4 z-50">
          <Card className="bg-background/80 backdrop-blur-lg border-primary shadow-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <p className="font-semibold">
                Você selecionou <span className="text-primary">{selectedCompanyDetails?.company_name}</span>. Deseja definir como sua empresa ativa?
              </p>
              <Button onClick={handleConfirmCompanySelection}>
                <Check className="mr-2 h-4 w-4"/> Confirmar e Continuar
              </Button>
            </CardContent>
          </Card>
         </div>
       )}

    </motion.div>
  );
};

export default CompanyManager;
