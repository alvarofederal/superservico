
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, parseISO, isValid } from 'date-fns';
import { cn } from "@/lib/utils";
import { Loader2, CalendarDays } from 'lucide-react';

export const PLAN_STATUS_OPTIONS = [
  { value: 'trialing', label: 'Em Cortesia' },
  { value: 'active', label: 'Ativo' },
  { value: 'past_due', label: 'Pagamento Pendente' },
  { value: 'canceled', label: 'Cancelado' },
  { value: 'expired', label: 'Expirado' },
  { value: 'pending_renewal', label: 'Aguardando Renovação' },
  { value: 'unpaid', label: 'Não Pago' },
  { value: 'inactive', label: 'Inativo (Novo)'}
];

const EditLicenseForm = ({ initialData, userFullName, userId, companyId, allUsers, licenseTypes, onSubmit, onCancel, isSubmitting }) => {
  const [selectedUserId, setSelectedUserId] = useState(userId || '');
  const [selectedCompanyId, setSelectedCompanyId] = useState(companyId || '');
  const [licenseTypeId, setLicenseTypeId] = useState(initialData?.license_type_id || '');
  const [status, setStatus] = useState(initialData?.status || 'inactive');
  const [endDate, setEndDate] = useState(initialData?.end_date && isValid(parseISO(initialData.end_date)) ? parseISO(initialData.end_date) : null);
  const [trialEndsAt, setTrialEndsAt] = useState(initialData?.trial_ends_at && isValid(parseISO(initialData.trial_ends_at)) ? parseISO(initialData.trial_ends_at) : null);
  const [notes, setNotes] = useState(initialData?.notes || ''); 
  const [planName, setPlanName] = useState(initialData?.plan_name || ''); 
  const [startDate, setStartDate] = useState(initialData?.start_date && isValid(parseISO(initialData.start_date)) ? parseISO(initialData.start_date) : new Date());

  useEffect(() => {
    if (initialData) {
      setSelectedUserId(initialData.user_id || userId || '');
      setSelectedCompanyId(initialData.company_id || companyId || '');
      setLicenseTypeId(initialData.license_type_id || '');
      setStatus(initialData.status || 'inactive');
      setEndDate(initialData.end_date && isValid(parseISO(initialData.end_date)) ? parseISO(initialData.end_date) : null);
      setTrialEndsAt(initialData.trial_ends_at && isValid(parseISO(initialData.trial_ends_at)) ? parseISO(initialData.trial_ends_at) : null);
      setStartDate(initialData.start_date && isValid(parseISO(initialData.start_date)) ? parseISO(initialData.start_date) : new Date());
      setNotes(initialData.notes || '');
      setPlanName(initialData.plan_name || '');
    } else {
      setSelectedUserId(userId || '');
      setSelectedCompanyId(companyId || '');
      setLicenseTypeId('');
      setStatus('inactive');
      setEndDate(null);
      setTrialEndsAt(null);
      setStartDate(new Date());
      setNotes('');
      setPlanName('');
    }
  }, [initialData, userId, companyId]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      licenseId: initialData?.id,
      userId: selectedUserId, 
      companyId: selectedCompanyId, 
      licenseTypeId: licenseTypeId,
      plan_name: planName, 
      status,
      start_date: startDate ? format(startDate, 'yyyy-MM-dd') : null,
      end_date: endDate ? format(endDate, 'yyyy-MM-dd') : null,
      trial_ends_at: trialEndsAt ? format(trialEndsAt, 'yyyy-MM-dd') : null,
      notes,
    });
  };

  const handleUserChange = (newUserId) => {
    setSelectedUserId(newUserId);
    const selectedUser = allUsers.find(u => u.id === newUserId);
    if (selectedUser && selectedUser.current_company_id) {
      setSelectedCompanyId(selectedUser.current_company_id);
    } else {
      setSelectedCompanyId('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
      <div>
        <Label htmlFor="edit-license-user">Usuário *</Label>
        <Select value={selectedUserId} onValueChange={handleUserChange} required disabled={!!initialData?.id}>
          <SelectTrigger id="edit-license-user" disabled={!!initialData?.id}>
            <SelectValue placeholder="Selecione um usuário" />
          </SelectTrigger>
          <SelectContent>
            {allUsers.map(u => (
              <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {initialData?.id && (
          <p className="text-sm text-muted-foreground mt-1">
            Editando licença para: <span className="font-semibold text-primary">{userFullName}</span>
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="edit-license-type">Tipo de Licença (Plano) *</Label>
        <Select value={licenseTypeId} onValueChange={setLicenseTypeId} required={!initialData?.id}>
          <SelectTrigger id="edit-license-type"><SelectValue placeholder="Selecione o tipo de licença" /></SelectTrigger>
          <SelectContent>
            {licenseTypes && licenseTypes.map(lt => <SelectItem key={lt.id} value={lt.id}>{lt.name} ({lt.price} {lt.currency} - {lt.billing_cycle})</SelectItem>)}
          </SelectContent>
        </Select>
        {!licenseTypeId && initialData?.id && <Input className="mt-2" value={planName} onChange={(e) => setPlanName(e.target.value)} placeholder="Nome do plano (legado)" />}
      </div>
      <div>
        <Label htmlFor="edit-status">Status da Licença *</Label>
        <Select value={status} onValueChange={setStatus} required>
          <SelectTrigger id="edit-status"><SelectValue placeholder="Selecione o status" /></SelectTrigger>
          <SelectContent>{PLAN_STATUS_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>
       <div>
        <Label htmlFor="edit-start-date">Data de Início *</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !startDate && "text-muted-foreground")}>
              <CalendarDays className="mr-2 h-4 w-4" />{startDate ? format(startDate, "dd/MM/yyyy") : <span>Escolha uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={startDate} onSelect={setStartDate} initialFocus /></PopoverContent>
        </Popover>
      </div>
      <div>
        <Label htmlFor="edit-trial-ends-at">Término da Cortesia</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !trialEndsAt && "text-muted-foreground")}>
              <CalendarDays className="mr-2 h-4 w-4" />{trialEndsAt ? format(trialEndsAt, "dd/MM/yyyy") : <span>Escolha uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={trialEndsAt} onSelect={setTrialEndsAt} /></PopoverContent>
        </Popover>
      </div>
      <div>
        <Label htmlFor="edit-end-date">Data de Término da Assinatura</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !endDate && "text-muted-foreground")}>
              <CalendarDays className="mr-2 h-4 w-4" />{endDate ? format(endDate, "dd/MM/yyyy") : <span>Escolha uma data</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={endDate} onSelect={setEndDate} /></PopoverContent>
        </Popover>
      </div>
      <div>
        <Label htmlFor="edit-notes-admin">Observações (Admin)</Label>
        <Input id="edit-notes-admin" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas internas sobre esta licença" />
      </div>
      
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button 
            type="submit" 
            disabled={isSubmitting || !selectedUserId || (!licenseTypeId && !planName) || !status || !startDate }
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData?.id ? 'Atualizar Licença' : 'Criar Licença'}
        </Button>
      </div>
    </form>
  );
};

export default EditLicenseForm;
