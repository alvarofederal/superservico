import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Loader2, UserPlus, ArrowLeft, FileText, CheckCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import TermsViewerModal from '@/components/admin/TermsViewerModal';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('client');
  
  const [termsAcceptedObj, setTermsAcceptedObj] = useState({ id: null, version: null, scrolled: false });
  const [policyAcceptedObj, setPolicyAcceptedObj] = useState({ id: null, version: null, scrolled: false });
  const [mainCheckboxAgreed, setMainCheckboxAgreed] = useState(false);

  const [isTermsModalOpen, setIsTermsModalOpen] = useState(false);
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const canEnableMainCheckbox = termsAcceptedObj.scrolled && policyAcceptedObj.scrolled;
  const canSubmit = mainCheckboxAgreed && termsAcceptedObj.id && policyAcceptedObj.id;

  useEffect(() => {
    if (termsAcceptedObj.scrolled && policyAcceptedObj.scrolled && termsAcceptedObj.id && policyAcceptedObj.id) {
      setMainCheckboxAgreed(true);
    } else {
      setMainCheckboxAgreed(false);
    }
  }, [termsAcceptedObj, policyAcceptedObj]);


  const handleRegister = async (e) => {
    e.preventDefault();
    if (!canSubmit) {
      toast({ title: 'Termos e Políticas', description: 'Você deve ler e aceitar os Termos de Uso e a Política de Privacidade clicando em "Li e Aceito" em cada documento.', variant: 'destructive' });
      return;
    }
    if (password !== confirmPassword) {
      toast({ title: 'Erro de Senha', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      toast({ title: 'Senha Curta', description: 'A senha deve ter no mínimo 6 caracteres.', variant: 'destructive' });
      return;
    }
    if (!fullName.trim()) {
      toast({ title: 'Nome Obrigatório', description: 'Por favor, informe seu nome completo.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          }
        }
      });

      if (signUpError) throw signUpError;
      
      const user = signUpData.user;
      if (!user) throw new Error("Usuário não retornado após cadastro.");

      const acceptancesToInsert = [];
      if (termsAcceptedObj.id) {
        acceptancesToInsert.push({ user_id: user.id, terms_id: termsAcceptedObj.id });
      }
      if (policyAcceptedObj.id) {
        acceptancesToInsert.push({ user_id: user.id, terms_id: policyAcceptedObj.id });
      }

      if (acceptancesToInsert.length > 0) {
        const { error: acceptanceError } = await supabase.from('user_terms_acceptance').insert(acceptancesToInsert);
        if (acceptanceError) {
            console.warn("Erro ao salvar aceites:", acceptanceError.message);
            toast({ title: "Atenção", description: "Houve um problema ao registrar seu aceite dos termos. Contate o suporte se persistir.", variant: "default" });
        }
      }
      
      if (user && signUpData.session) { 
        toast({ title: 'Cadastro Realizado!', description: 'Sua conta foi criada com sucesso. Você já está logado.' });
        navigate('/app');
      } else if (user) { 
        toast({ title: 'Cadastro Quase Lá!', description: 'Verifique seu email para confirmar sua conta antes de fazer login.' });
        navigate('/login');
      }

    } catch (error) {
      toast({
        title: 'Erro no Cadastro',
        description: error.message || 'Não foi possível criar sua conta.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleTermsAccepted = (docId, docVersion) => {
    setTermsAcceptedObj(prev => ({ ...prev, id: docId, version: docVersion }));
    setIsTermsModalOpen(false); 
  };

  const handlePolicyAccepted = (docId, docVersion) => {
    setPolicyAcceptedObj(prev => ({ ...prev, id: docId, version: docVersion }));
    setIsPolicyModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-foreground">Crie sua Conta</h2>
        <p className="text-muted-foreground mt-1">Junte-se ao Super Serviço e otimize sua manutenção!</p>
      </div>
      <form onSubmit={handleRegister} className="space-y-4">
        <div>
          <Label htmlFor="fullName">Nome Completo</Label>
          <Input id="fullName" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Seu Nome Completo" required className="bg-background/70" />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" required className="bg-background/70" />
        </div>
        <div>
          <Label htmlFor="password">Senha (mín. 6 caracteres)</Label>
          <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="bg-background/70" />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirme a Senha</Label>
          <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" required className="bg-background/70" />
        </div>
        <div>
          <Label htmlFor="role">Tipo de Perfil</Label>
          <Select value={role} onValueChange={setRole}>
            <SelectTrigger className="bg-background/70"><SelectValue placeholder="Selecione seu perfil" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="client">Cliente (Solicitante)</SelectItem>
              <SelectItem value="technician">Técnico de Manutenção</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground mt-1">Perfis de técnico podem requerer aprovação do administrador.</p>
        </div>

        <div className="space-y-3 pt-2">
            <div className="flex items-center space-x-2">
                <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={() => setIsTermsModalOpen(true)}>
                    <FileText className="mr-1.5 h-4 w-4"/> Ler Termos de Uso
                </Button>
                {termsAcceptedObj.scrolled && <CheckCircle className={`h-4 w-4 ${termsAcceptedObj.id ? 'text-green-500' : 'text-yellow-500'}`} title={termsAcceptedObj.id ? "Termos aceitos!" : "Termos lidos, aceite no modal."} />}
            </div>
            <div className="flex items-center space-x-2">
                 <Button type="button" variant="link" className="p-0 h-auto text-sm" onClick={() => setIsPolicyModalOpen(true)}>
                    <FileText className="mr-1.5 h-4 w-4"/> Ler Política de Privacidade
                </Button>
                {policyAcceptedObj.scrolled && <CheckCircle className={`h-4 w-4 ${policyAcceptedObj.id ? 'text-green-500' : 'text-yellow-500'}`} title={policyAcceptedObj.id ? "Política aceita!" : "Política lida, aceite no modal."} />}
            </div>
            <div className="flex items-center space-x-2">
                <Checkbox 
                    id="terms" 
                    checked={mainCheckboxAgreed} 
                    onCheckedChange={setMainCheckboxAgreed} 
                    disabled={!canEnableMainCheckbox} 
                />
                <Label htmlFor="terms" className={`text-sm ${!canEnableMainCheckbox ? 'text-muted-foreground' : ''}`}>
                    Li e concordo com os Termos de Uso e a Política de Privacidade.
                </Label>
            </div>
        </div>

        <Button type="submit" className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600/90 hover:to-teal-700/90 text-primary-foreground text-lg py-3" disabled={loading || !canSubmit}>
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <UserPlus className="mr-2 h-5 w-5" />}
          Cadastrar
        </Button>
      </form>
      <div className="text-center">
        <Link to="/login">
          <Button variant="link" className="text-sm text-muted-foreground hover:text-primary">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Já tem uma conta? Faça login
          </Button>
        </Link>
      </div>

      <TermsViewerModal 
        isOpen={isTermsModalOpen} 
        setIsOpen={setIsTermsModalOpen} 
        documentType="terms_of_service"
        onScrolledToEnd={() => setTermsAcceptedObj(prev => ({ ...prev, scrolled: true }))}
        onAccepted={handleTermsAccepted}
      />
      <TermsViewerModal 
        isOpen={isPolicyModalOpen} 
        setIsOpen={setIsPolicyModalOpen} 
        documentType="privacy_policy"
        onScrolledToEnd={() => setPolicyAcceptedObj(prev => ({ ...prev, scrolled: true }))}
        onAccepted={handlePolicyAccepted}
      />

    </div>
  );
};

export default RegisterPage;