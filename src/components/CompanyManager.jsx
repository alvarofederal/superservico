import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Plus, Briefcase, Check, ChevronsRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth.js';

import CreateCompanyForm from './company/CreateCompanyForm';
import CompanyList from './company/CompanyList';
import CompanyDetails from './company/CompanyDetails';

const CompanyManager = () => {
  const { userProfile, userCompanies, selectCompany, refreshAuthData } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState(userProfile?.current_company_id);

  useEffect(() => {
    setSelectedCompanyId(userProfile?.current_company_id);
  }, [userProfile?.current_company_id]);

  const handleCreateCompany = async ({ name }) => {
    setIsSubmitting(true);
    try {
      if (!userProfile || !userProfile.id) throw new Error("Usuário não autenticado.");
      
      const { data: companyData, error: companyError } = await supabase
        .from('companies')
        .insert([{ name, owner_id: userProfile.id }])
        .select()
        .single();

      if (companyError) throw companyError;
      
      toast({ title: "Sucesso!", description: `Empresa "${name}" criada.` });
      setIsCreateDialogOpen(false);
      
      if (companyData) {
        await selectCompany(companyData.id);
        setSelectedCompanyId(companyData.id);
      }
      if (typeof refreshAuthData === 'function') await refreshAuthData();

    } catch (error) {
      console.error('Erro ao criar empresa:', error);
      toast({ title: "Erro ao Criar Empresa", description: error.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleInviteUser = async ({ email, roleInCompany, companyId }) => {
    setIsSubmitting(true);
    try {
        const { data: invitedUserId, error: findUserError } = await supabase.rpc('get_user_id_by_email', {
          p_email: email
        });

        if (findUserError) throw findUserError;

        if (!invitedUserId) {
            toast({ title: "Usuário não encontrado", description: `Usuário com email ${email} não encontrado. O usuário precisa se cadastrar primeiro.`, variant: "destructive", duration: 7000});
            setIsSubmitting(false);
            return false; 
        }
        
        const { error: inviteError } = await supabase
            .from('company_users')
            .insert([{ company_id: companyId, user_id: invitedUserId, role_in_company: roleInCompany }]);
        
        if (inviteError) {
            if (inviteError.code === '23505') {
                 toast({ title: "Usuário Já Membro", description: `${email} já faz parte desta empresa.`, variant: "default" });
            } else {
                throw inviteError;
            }
        } else {
            toast({ title: "Sucesso!", description: `Usuário ${email} convidado.` });
        }
        return true; 
    } catch (error) {
        console.error('Erro ao convidar usuário:', error);
        toast({ title: "Erro ao Convidar", description: error.message, variant: "destructive" });
        return false;
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleRemoveUserFromCompany = async (userIdToRemove, companyId) => {
    if (userIdToRemove === userProfile?.id) {
       const companyDetails = userCompanies.find(c => c.id === companyId);
       if (companyDetails?.owner_id === userProfile?.id) {
         toast({ title: "Ação não permitida", description: "Você não pode remover a si mesmo como proprietário.", variant: "destructive" });
         return;
       }
    }

    try {
        const { error } = await supabase.from('company_users').delete().match({ user_id: userIdToRemove, company_id: companyId });
        if (error) throw error;
        toast({ title: "Usuário Removido", description: "Usuário removido da empresa com sucesso." });
    } catch (error) {
        console.error("Erro ao remover usuário da empresa:", error);
        toast({ title: "Erro ao Remover", description: error.message, variant: "destructive" });
    }
  };

  const handleSelectCompanyForView = (companyId) => {
    setSelectedCompanyId(companyId);
  }

  const handleConfirmCompanySelection = async () => {
    if (selectedCompanyId) {
      await selectCompany(selectedCompanyId);
    }
  };

  const selectedCompanyDetails = selectedCompanyId ? userCompanies.find(c => c.id === selectedCompanyId) : null;
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
          <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
            Gerenciamento de Empresas
          </h1>
          <p className="text-muted-foreground mt-1">Crie, gerencie suas empresas e convide membros.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg">
              <Plus className="mr-2 h-5 w-5" /> Nova Empresa
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
                 <Button size="lg" onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
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
                    currentCompanyId={selectedCompanyId}
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

       {!showCreateFirstCompany && selectedCompanyId !== userProfile?.current_company_id && (
         <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-2xl p-4 z-50">
          <Card className="bg-background/80 backdrop-blur-lg border-primary shadow-2xl">
            <CardContent className="p-4 flex items-center justify-between">
              <p className="font-semibold">
                Você selecionou <span className="text-primary">{selectedCompanyDetails?.name}</span>. Deseja definir como sua empresa ativa?
              </p>
              <Button onClick={handleConfirmCompanySelection} className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
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