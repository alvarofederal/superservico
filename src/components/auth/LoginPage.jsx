import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Loader2, LogIn, KeyRound, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const handleLogin = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      const {
        error
      } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      if (error) {
        toast({
          title: 'Erro de Login',
          description: error.message || 'Falha ao tentar fazer login. Verifique suas credenciais.',
          variant: 'destructive'
        });
      }
      // No navigation or state setting here. AuthProvider/AuthManager handle it.
    } catch (generalError) {
      // Catch any unexpected errors during the sign-in process itself
      toast({
        title: 'Erro Inesperado',
        description: 'Ocorreu um problema inesperado. Tente novamente.',
        variant: 'destructive'
      });
      console.error("Unexpected login error:", generalError);
    } finally {
      setLoading(false);
    }
  };
  return <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-foreground">Acesse sua Conta</h2>
        <p className="text-muted-foreground mt-1">Seja muito bem-vindo ao Super Serviço!</p>
      </div>
      <form onSubmit={handleLogin} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required className="bg-background/70" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required className="bg-background/70" />
        </div>
        <Button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground text-lg py-3" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <LogIn className="mr-2 h-5 w-5" />}
          Entrar
        </Button>
      </form>
      <div className="text-center space-y-2">
        <Button variant="link" className="text-sm text-muted-foreground hover:text-primary" onClick={() => navigate('/forgot-password')}>
          <KeyRound className="mr-1.5 h-4 w-4" />
          Esqueceu sua senha?
        </Button>
         <div>
          <Link to="/register">
            <Button variant="link" className="text-sm text-muted-foreground hover:text-primary">
              <UserPlus className="mr-1.5 h-4 w-4" />
              Não tem uma conta? Cadastre-se
            </Button>
          </Link>
        </div>
      </div>
    </div>;
};
export default LoginPage;