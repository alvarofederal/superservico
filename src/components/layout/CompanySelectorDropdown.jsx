import React from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu.jsx"; 
import { Button } from '@/components/ui/button';
import { Briefcase, ChevronDown, Check, Plus } from 'lucide-react';

const CompanySelectorDropdown = ({ userCompanies, currentCompanyId, currentCompanyName, selectCompany, onManageCompanies }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 hover:bg-muted/80">
          <Briefcase className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
          <span className="text-xs sm:text-sm font-medium text-foreground truncate max-w-[100px] sm:max-w-[150px]" title={currentCompanyName}>
            {currentCompanyName}
          </span>
          <ChevronDown className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground ml-auto flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64" align="start">
        <DropdownMenuLabel>Mudar de Empresa</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userCompanies.length > 0 ? userCompanies.map(company => (
          <DropdownMenuItem key={company.company_id} onClick={() => selectCompany(company.company_id)} className="cursor-pointer">
            <Briefcase className="mr-2 h-4 w-4" />
            <span>{company.company_name}</span>
            {currentCompanyId === company.company_id && <Check className="ml-auto h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        )) : (
          <DropdownMenuItem disabled>Nenhuma empresa associada</DropdownMenuItem>
        )}
        {userCompanies.length > 0 && <DropdownMenuSeparator />}
        <DropdownMenuItem onClick={onManageCompanies}>
          <Plus className="mr-2 h-4 w-4" /> Gerenciar Empresas
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CompanySelectorDropdown;