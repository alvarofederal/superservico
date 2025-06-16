import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Check, Briefcase } from 'lucide-react';

const CompanyList = ({ userCompanies, currentCompanyId, onSelectCompany }) => {
  if (!userCompanies || userCompanies.length === 0) {
    return null; 
  }

  return (
    <Card className="shadow-xl">
      <CardHeader>
        <CardTitle className="text-2xl">Minhas Empresas</CardTitle>
        <CardDescription>Selecione uma empresa para gerenciar ou ver detalhes.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {userCompanies.map((company, index) => (
          <motion.div 
            key={company.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
            className={`p-4 rounded-lg border flex justify-between items-center transition-all duration-200 ease-in-out cursor-pointer hover:shadow-md ${currentCompanyId === company.id ? 'bg-primary/10 border-primary shadow-md' : 'bg-card hover:bg-muted/50'}`}
            onClick={() => onSelectCompany(company.id)}
          >
            <div className="flex items-center gap-3">
              <Briefcase className={`h-5 w-5 ${currentCompanyId === company.id ? 'text-primary' : 'text-muted-foreground'}`} />
              <div>
                <h3 className="text-lg font-semibold text-foreground">{company.name}</h3>
                <p className="text-sm text-muted-foreground">Seu papel: <span className="capitalize font-medium">{company.role_in_company?.replace('company_', '') || 'Proprietário'}</span></p>
              </div>
            </div>
            {currentCompanyId === company.id && <Check className="h-6 w-6 text-primary" />}
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CompanyList;