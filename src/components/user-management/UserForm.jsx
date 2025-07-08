
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const ROLES = ['admin', 'technician', 'client'];

const UserForm = ({ initialData, onSubmit, onCancel, isSubmitting, companiesList }) => {
  const [email, setEmail] = useState(initialData?.email || '');
  const [fullName, setFullName] = useState(initialData?.user_metadata?.full_name || initialData?.full_name || '');
  const [role, setRole] = useState(initialData?.user_metadata?.role || initialData?.role || 'client');
  const [password, setPassword] = useState('');
  const [currentCompanyId, setCurrentCompanyId] = useState(initialData?.current_company_id || '');

  useEffect(() => {
    if (initialData) {
      setEmail(initialData.email || '');
      setFullName(initialData.user_metadata?.full_name || initialData.full_name || '');
      setRole(initialData.user_metadata?.role || initialData.role || 'client');
      setCurrentCompanyId(initialData.current_company_id || '');
      setPassword(''); 
    } else {
        setEmail('');
        setFullName('');
        setRole('client');
        setPassword('');
        setCurrentCompanyId('');
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email || !fullName || !role) {
      toast({ title: "Erro de Validação", description: "Email, Nome Completo e Perfil são obrigatórios.", variant: "destructive" });
      return;
    }
    if (!initialData && (!password || password.length < 6)) {
      toast({ title: "Erro de Validação", description: "Senha é obrigatória e deve ter no mínimo 6 caracteres para novos usuários.", variant: "destructive" });
      return;
    }
    onSubmit({ 
      email, 
      fullName, 
      role, 
      password: password || undefined, 
      userId: initialData?.id,
      currentCompanyId: currentCompanyId || null 
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <div>
        <Label htmlFor="user-email">Email *</Label>
        <Input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" required disabled={!!initialData} />
        {initialData && <p className="text-xs text-muted-foreground mt-1">Email não pode ser alterado.</p>}
      </div>
      <div>
        <Label htmlFor="user-fullname">Nome Completo *</Label>
        <Input id="user-fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome Sobrenome" required />
      </div>
      <div>
        <Label htmlFor="user-role">Perfil *</Label>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger><SelectValue placeholder="Selecione um perfil" /></SelectTrigger>
          <SelectContent>
            {ROLES.map(r => <SelectItem key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="user-company">Empresa Associada</Label>
        <Select value={currentCompanyId || ''} onValueChange={setCurrentCompanyId}>
          <SelectTrigger><SelectValue placeholder="Selecione uma empresa (opcional)" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">Nenhuma Empresa</SelectItem>
            {companiesList && companiesList.map(company => (
              <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {!initialData && (
        <div>
          <Label htmlFor="user-password">Senha (mín. 6 caracteres) *</Label>
          <Input id="user-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
      )}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Atualizar Usuário' : 'Criar Usuário'}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
