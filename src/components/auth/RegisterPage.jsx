import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/components/ui/use-toast';
import { Loader2, UserPlus, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';


const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('client'); 
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          }
        }
      });

      if (error) throw error;

      if (data.user && data.session) {
        toast({ title: 'Cadastro Realizado!', description: 'Sua conta foi criada com sucesso. Você já está logado.' });
      } else if (data.user) {
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
        <Button type="submit" className="w-full bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600/90 hover:to-teal-700/90 text-primary-foreground text-lg py-3" disabled={loading}>
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
    </div>
  );
};

export default RegisterPage;