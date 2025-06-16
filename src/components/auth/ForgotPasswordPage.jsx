import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Mail, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageSent, setMessageSent] = useState(false);
  const navigate = useNavigate();

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessageSent(false);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setMessageSent(true);
      toast({
        title: 'Link Enviado!',
        description: 'Se o email existir, um link para redefinição de senha foi enviado.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao Enviar Email',
        description: error.message || 'Não foi possível enviar o email de redefinição.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-semibold text-foreground">Recuperar Senha</h2>
        <p className="text-muted-foreground mt-1">Insira seu email para receber o link de redefinição.</p>
      </div>
      {messageSent ? (
        <div className="text-center p-4 bg-green-500/10 border border-green-500/30 rounded-md">
          <Mail className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">Verifique seu Email</h3>
          <p className="text-muted-foreground text-sm">
            Um link para redefinir sua senha foi enviado para <strong>{email}</strong>. Siga as instruções no email.
          </p>
        </div>
      ) : (
        <form onSubmit={handlePasswordReset} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email-forgot">Email</Label>
            <Input
              id="email-forgot"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              className="bg-background/70"
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground text-lg py-3" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Mail className="mr-2 h-5 w-5" />}
            Enviar Link
          </Button>
        </form>
      )}
      <div className="text-center">
        <Button
          variant="link"
          className="text-sm text-muted-foreground hover:text-primary"
          onClick={() => navigate('/login')}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Voltar para Login
        </Button>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;