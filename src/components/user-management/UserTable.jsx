import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Edit3, Trash2, Shield, KeyRound, Settings2 as UserParamsIcon, Briefcase, Loader2 } from 'lucide-react';
import Pagination from '@/components/ui/pagination';

const UserTable = ({ users, isLoading, highlightedUserId, setHighlightedUserId, onEditUser, onDeleteUser, onManageParams, onManagePermissions }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = users.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto bg-card/50 rounded-lg border border-border shadow-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Nome Completo</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Perfil</TableHead>
                <TableHead>Empresa Atual</TableHead>
                <TableHead className="text-right w-[220px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...Array(5)].map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  <TableCell><div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-full animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-1/2 animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-muted rounded w-3/4 animate-pulse"></div></TableCell>
                  <TableCell className="text-right space-x-1">
                    <div className="h-8 w-8 bg-muted rounded-full inline-block animate-pulse"></div>
                    <div className="h-8 w-8 bg-muted rounded-full inline-block animate-pulse"></div>
                    <div className="h-8 w-8 bg-muted rounded-full inline-block animate-pulse"></div>
                    <div className="h-8 w-8 bg-muted rounded-full inline-block animate-pulse"></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto bg-card/50 rounded-lg border border-border shadow-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Nome Completo</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Perfil</TableHead>
              <TableHead>Empresa Atual</TableHead>
              <TableHead className="text-right w-[220px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentUsers.length > 0 ? currentUsers.map((user) => (
              <TableRow 
                key={user.id} 
                className={`hover:bg-muted/50 ${highlightedUserId === user.id ? 'bg-primary/10 ring-2 ring-primary' : ''}`}
                onClick={() => highlightedUserId === user.id && setHighlightedUserId && setHighlightedUserId(null)}
              >
                <TableCell className="font-medium text-foreground">{user.full_name}</TableCell>
                <TableCell className="text-muted-foreground">{user.email}</TableCell>
                <TableCell>
                  <Badge variant={user.role === 'admin' ? 'destructive' : user.role === 'technician' ? 'secondary' : 'outline'} className="capitalize">
                    <Shield className="h-3 w-3 mr-1.5 opacity-70"/>
                    {user.role}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground flex items-center">
                    {user.current_company_id ? <Briefcase className="h-4 w-4 mr-1.5 text-sky-500"/> : <Briefcase className="h-4 w-4 mr-1.5 text-muted-foreground opacity-50"/>}
                    {user.current_company_name || (user.current_company_id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'N/A')}
                </TableCell>
                <TableCell className="text-right space-x-1">
                  <Button variant="ghost" size="icon" onClick={() => onManageParams(user)} className="hover:text-purple-500" title="Gerenciar Parâmetros do Usuário">
                    <UserParamsIcon className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onManagePermissions(user.id)} className="hover:text-blue-500" title="Gerenciar Permissões (Funcionalidades)">
                    <KeyRound className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => onEditUser(user)} className="hover:text-primary" title="Editar Usuário (Perfil/Nome/Empresa)">
                    <Edit3 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:text-destructive" title="Excluir Usuário">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tem certeza que deseja excluir o usuário {user.email}? Esta ação é irreversível e removerá todos os dados associados.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => onDeleteUser(user.id, user.email)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Nenhum usuário encontrado com os filtros atuais.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={users.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
};

export default UserTable;