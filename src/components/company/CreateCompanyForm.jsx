
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const CreateCompanyForm = ({ onSubmit, onCancel, isSubmitting }) => {
  const [companyName, setCompanyName] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      toast({ title: "Nome da Empresa Obrigatório", variant: "destructive" });
      return;
    }
    onSubmit({ name: companyName });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="company-name-form" className="text-lg">Nome da Empresa</Label>
        <Input 
          id="company-name-form" 
          value={companyName} 
          onChange={(e) => setCompanyName(e.target.value)} 
          placeholder="Minha Incrível Empresa Ltda." 
          className="mt-2 text-base p-3"
          required 
        />
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-green-500 to-teal-600 text-white">
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Criar Empresa
        </Button>
      </div>
    </form>
  );
};

export default CreateCompanyForm;
