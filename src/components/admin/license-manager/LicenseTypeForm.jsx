import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { DialogFooter } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';

const BILLING_CYCLES = [
  { value: 'monthly', label: 'Mensal' },
  { value: 'annually', label: 'Anual' },
  { value: 'one_time', label: 'Pagamento Único (Vitalício)' },
];

const CURRENCIES = ['BRL', 'USD', 'EUR'];

// Master list of all available features in the system
const AVAILABLE_FEATURES = [
  { key: 'dashboard_access', label: 'Dashboard', description: 'Acesso ao painel principal com métricas e visões gerais.' },
  { key: 'requests_management', label: 'Gerenciar Solicitações', description: 'Visualizar, criar e gerenciar solicitações de serviço.' },
  { key: 'work_orders_management', label: 'Gerenciar Ordens de Serviço', description: 'Criar, editar e acompanhar ordens de serviço.' },
  { key: 'maintenances_management', label: 'Gerenciar Manutenções', description: 'Acessar e gerenciar planos e registros de manutenção.' },
  { key: 'equipment_management', label: 'Gerenciar Equipamentos', description: 'Acesso total ao cadastro e gestão de equipamentos.' },
  { key: 'parts_management', label: 'Gerenciar Peças', description: 'Controlar o inventário de peças e componentes.' },
  { key: 'company_view_access', label: 'Gerenciar Empresa', description: 'Visualizar e editar detalhes da empresa, convidar usuários.' },
  { key: 'equipment_qrcode_scan', label: 'Scanner de QRCode', description: 'Permite escanear QRCodes de equipamentos.' },
  { key: 'category_management', label: 'Gerenciar Categorias de Equipamentos', description: 'Permite criar, editar e excluir categorias para equipamentos.' },
];


const LicenseTypeForm = ({ initialData, onSubmit, onCancel, isSubmitting }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [billingCycle, setBillingCycle] = useState(BILLING_CYCLES[0].value);
  const [price, setPrice] = useState('');
  const [currency, setCurrency] = useState(CURRENCIES[0]);
  const [isActive, setIsActive] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState([]);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setBillingCycle(initialData.billing_cycle || BILLING_CYCLES[0].value);
      setPrice(initialData.price || '');
      setCurrency(initialData.currency || CURRENCIES[0]);
      setIsActive(initialData.is_active || false);
      
      let parsedFeatures = [];
      if (initialData.features) {
          if (Array.isArray(initialData.features)) {
            parsedFeatures = initialData.features;
          } else if (typeof initialData.features === 'string') {
              try {
                  parsedFeatures = JSON.parse(initialData.features)
              } catch {
                  parsedFeatures = []
              }
          }
      }
      setSelectedFeatures(parsedFeatures);

    } else {
      // Reset form for new entry
      setName('');
      setDescription('');
      setBillingCycle(BILLING_CYCLES[0].value);
      setPrice('');
      setCurrency(CURRENCIES[0]);
      setIsActive(false);
      setSelectedFeatures([]);
    }
  }, [initialData]);

  const handleFeatureToggle = (featureKey) => {
    setSelectedFeatures(prev =>
      prev.includes(featureKey)
        ? prev.filter(key => key !== featureKey)
        : [...prev, featureKey]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !billingCycle || price === '' || !currency) {
      toast({ title: "Erro de Validação", description: "Nome, Ciclo, Preço e Moeda são obrigatórios.", variant: "destructive" });
      return;
    }
    
    onSubmit({
      id: initialData?.id,
      name, description, billing_cycle: billingCycle, price: parseFloat(price), currency,
      features: selectedFeatures, // Pass the array of selected feature keys
      is_active: isActive,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto p-1 pr-3">
      <div>
        <Label htmlFor="lt-name">Nome do Plano/Tipo de Licença *</Label>
        <Input id="lt-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Básico, Profissional, Premium" required />
      </div>
      <div>
        <Label htmlFor="lt-description">Descrição</Label>
        <Textarea id="lt-description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Breve descrição do plano e seus benefícios" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="lt-price">Preço *</Label>
          <Input id="lt-price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="Ex: 49.90" required />
        </div>
        <div>
          <Label htmlFor="lt-currency">Moeda *</Label>
          <Select value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="lt-currency"><SelectValue placeholder="Selecione a moeda" /></SelectTrigger>
            <SelectContent>{CURRENCIES.map(curr => <SelectItem key={curr} value={curr}>{curr}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="lt-billing-cycle">Ciclo de Cobrança *</Label>
          <Select value={billingCycle} onValueChange={setBillingCycle}>
            <SelectTrigger id="lt-billing-cycle"><SelectValue placeholder="Selecione o ciclo" /></SelectTrigger>
            <SelectContent>{BILLING_CYCLES.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label className="mb-2 block">Funcionalidades do Plano</Label>
        <ScrollArea className="h-60 w-full rounded-md border p-4">
          <div className="space-y-3">
            {AVAILABLE_FEATURES.map(feature => (
              <div key={feature.key} className="flex items-start rounded-md p-2 transition-colors hover:bg-muted/50">
                <Checkbox
                  id={`feature-${feature.key}`}
                  checked={selectedFeatures.includes(feature.key)}
                  onCheckedChange={() => handleFeatureToggle(feature.key)}
                  className="mt-1"
                />
                <div className="ml-3">
                  <Label htmlFor={`feature-${feature.key}`} className="font-semibold cursor-pointer">{feature.label}</Label>
                  <p className="text-xs text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Checkbox id="lt-isactive" checked={isActive} onCheckedChange={setIsActive} />
        <Label htmlFor="lt-isactive" className="text-sm font-medium">Plano Ativo e Disponível para Assinatura?</Label>
      </div>
      <DialogFooter className="pt-6 sticky bottom-0 bg-background py-4 z-10">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>Cancelar</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {initialData ? 'Atualizar Plano' : 'Criar Plano'}
        </Button>
      </DialogFooter>
    </form>
  );
};

export default LicenseTypeForm;