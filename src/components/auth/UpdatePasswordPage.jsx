import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Loader2, KeyRound, CheckCircle } from 'lucide-react';

const UpdatePasswordPage = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [updated, setUpdated] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (!hash.includes('type=recovery') && !hash.includes('access_token')) {
      setError('Token de recuperação inválido ou ausente. Por favor, solicite um novo link.');
      toast({ title: 'Erro', description: 'Token de recuperação inválido.', variant: 'destructive' });
    }
  }, []);


  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      toast({ title: 'Erro', description: 'As senhas não coincidem.', variant: 'destructive' });
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      toast({ title: 'Erro', description: 'A senha deve ter pelo menos 6 caracteres.', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setUpdated(true);
      toast({
        title: 'Senha Atualizada!',
        description: 'Sua senha foi alterada com sucesso. Você pode fazer login agora.',
      });
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.message || 'Falha ao atualizar a senha.');
      toast({
        title: 'Erro ao Atualizar Senha',
        description: err.message || 'Não foi possível atualizar sua senha.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (updated) {
    return (
      <div className="space-y-6 text-center">
        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-semibold text-foreground">Senha Atualizada!</h2>
        <p className="text-muted-foreground">
          Sua senha foi alterada com sucesso. Você será redirecionado para a tela de login em breve.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-foreground">Redefinir Senha</h2>
        <p className="text-muted-foreground mt-1">Crie uma nova senha para sua conta.</p>
      </div>
      <form onSubmit={handleUpdatePassword} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="new-password">Nova Senha</Label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="bg-background/70"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
          <Input
            id="confirm-password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="bg-background/70"
          />
        </div>
        {error && <p className="text-sm text-destructive text-center">{error}</p>}
        <Button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground text-lg py-3" disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <KeyRound className="mr-2 h-5 w-5" />}
          Atualizar Senha
        </Button>
      </form>
    </div>
  );
};

export default UpdatePasswordPage;