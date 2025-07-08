import React from 'react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Loader2, User, Shield } from 'lucide-react';

const CompanyMembersTable = ({ members, isLoading, currentCompanyDetails, userProfile, onRemoveUser }) => {
  if (isLoading) {
    return <Loader2 className="animate-spin h-8 w-8 text-primary mx-auto" />;
  }

  if (!members || members.length === 0) {
    return <p className="text-muted-foreground">Nenhum membro encontrado para esta empresa.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Papel na Empresa</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map(member => {
             const isOwner = member.id === currentCompanyDetails.company_owner_id;
             const currentUserIsOwner = userProfile.id === currentCompanyDetails.company_owner_id;
             const currentUserRole = currentCompanyDetails.user_role_in_company;
             
             const canCurrentUserManage = ['company_admin', 'company_technician'].includes(currentUserRole);
             const isTargetManager = ['company_admin', 'company_technician'].includes(member.role_in_company);

             const canBeRemoved = (currentUserIsOwner && !isOwner) || (canCurrentUserManage && !isOwner && !isTargetManager);

            return (
              <TableRow key={member.id}>
                <TableCell className="font-medium flex items-center">
                    {member.full_name}
                    {isOwner && <Shield className="ml-2 h-4 w-4 text-amber-500" title="Proprietário" />}
                </TableCell>
                <TableCell>{member.email}</TableCell>
                <TableCell className="capitalize">{member.role_in_company?.replace('company_', '')}</TableCell>
                <TableCell className="text-right">
                  {canBeRemoved && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Remoção</AlertDialogTitle>
                          <AlertDialogDescription>
                            Tem certeza que deseja remover {member.full_name} da empresa {currentCompanyDetails.company_name}?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => onRemoveUser(member.id, currentCompanyDetails.company_id)} className="bg-destructive hover:bg-destructive/90">Remover</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default CompanyMembersTable;