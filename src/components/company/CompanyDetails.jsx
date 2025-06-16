import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { UserPlus as InviteIcon } from 'lucide-react';
import InviteUserForm from './InviteUserForm';
import CompanyMembersTable from './CompanyMembersTable';

const CompanyDetails = ({ company, userProfile, onInviteUser, onRemoveUser, isSubmitting }) => {
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [companyMembers, setCompanyMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  const fetchCompanyMembers = useCallback(async (companyId) => {
    if (!companyId) return;
    setIsLoadingMembers(true);
    try {
      const { data, error } = await supabase.rpc('get_company_members_details', {
        p_company_id: companyId
      });

      if (error) throw error;

      setCompanyMembers(data.map(m => ({
        id: m.user_id,
        full_name: m.user_full_name,
        email: m.user_email,
        avatar_url: m.user_avatar_url,
        role_in_company: m.user_role_in_company
      })) || []);
    } catch (error) {
      console.error("Erro ao buscar membros da empresa via RPC:", error);
      toast({ title: "Erro ao buscar membros", description: error.message, variant: "destructive" });
      setCompanyMembers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  }, []);

  useEffect(() => {
    if (company?.id) {
      fetchCompanyMembers(company.id);
    } else {
      setCompanyMembers([]);
    }
  }, [company?.id, fetchCompanyMembers]);

  const handleInviteSubmit = async (formData) => {
    const success = await onInviteUser(formData);
    if (success) { 
        fetchCompanyMembers(company.id); 
        setIsInviteDialogOpen(false);
    }
  };
  
  const handleRemoveUserSubmit = async (userId, companyId) => {
    await onRemoveUser(userId, companyId);
    fetchCompanyMembers(companyId); 
  }

  if (!company) return null; 

  const canManageCompany = company.owner_id === userProfile?.id || company.role_in_company === 'company_admin';

  return (
    <Card className="shadow-xl h-full">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle className="text-2xl">Gerenciar: {company.name}</CardTitle>
          <CardDescription>Adicione membros e gerencie configurações da empresa.</CardDescription>
        </div>
        {canManageCompany && (
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <InviteIcon className="mr-2 h-4 w-4" /> Convidar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Convidar Novo Membro para {company.name}</DialogTitle>
              </DialogHeader>
              <InviteUserForm 
                companyId={company.id} 
                onSubmit={handleInviteSubmit} 
                onCancel={() => setIsInviteDialogOpen(false)} 
                isSubmitting={isSubmitting} 
              />
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        <h3 className="text-lg font-semibold mb-3">Membros da Empresa</h3>
        <CompanyMembersTable 
          members={companyMembers} 
          isLoading={isLoadingMembers}
          currentCompanyDetails={company}
          userProfile={userProfile}
          onRemoveUser={handleRemoveUserSubmit}
        />
      </CardContent>
    </Card>
  );
};

export default CompanyDetails;