
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

const InviteUserForm = ({ companyId, onSubmit, onCancel, isSubmitting }) => {
    const [email, setEmail] = useState('');
    const [roleInCompany, setRoleInCompany] = useState('company_technician');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!email.trim()) {
            toast({ title: "Email do Usuário Obrigatório", variant: "destructive" });
            return;
        }
        onSubmit({ email, roleInCompany, companyId });
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <Label htmlFor="invite-email-form">Email do Usuário</Label>
                <Input id="invite-email-form" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@example.com" required />
                 <p className="text-xs text-muted-foreground mt-1">O usuário já deve ter uma conta no sistema para ser convidado.</p>
            </div>
            <div>
                <Label htmlFor="invite-role-form">Papel na Empresa</Label>
                <Select value={roleInCompany} onValueChange={setRoleInCompany}>
                    <SelectTrigger id="invite-role-form"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="company_technician">Técnico da Empresa</SelectItem>
                        <SelectItem value="company_admin">Admin da Empresa</SelectItem>
                        <SelectItem value="company_viewer">Visualizador</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Convidar Usuário
                </Button>
            </div>
        </form>
    );
};

export default InviteUserForm;
