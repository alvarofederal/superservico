import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Mail, User, Building, Shield } from 'lucide-react';

const DetailItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-4">
    <Icon className="h-5 w-5 text-muted-foreground" />
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value || 'N/A'}</p>
    </div>
  </div>
);

const UserProfileCard = ({ userProfile, currentCompany }) => {
  const getInitials = (name) => {
    if (!name) return 'U';
    const names = name.split(' ');
    if (names.length > 1) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  const roleLabels = {
    admin: 'Administrador do Sistema',
    company_admin: 'Administrador da Empresa',
    company_technician: 'Técnico',
    company_viewer: 'Visualizador',
    client: 'Cliente',
  };

  const userRoleInCompany = currentCompany?.user_role_in_company;
  const displayRole = roleLabels[userRoleInCompany] || roleLabels[userProfile?.role] || 'Não definido';

  return (
    <Card className="w-full max-w-2xl mx-auto shadow-lg">
      <CardHeader className="text-center">
        <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-primary/50">
          <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.full_name} />
          <AvatarFallback className="text-3xl bg-primary/20 text-primary font-semibold">
            {getInitials(userProfile?.full_name)}
          </AvatarFallback>
        </Avatar>
        <CardTitle className="text-3xl">{userProfile?.full_name}</CardTitle>
        <CardDescription>{userProfile?.email}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t">
        <DetailItem icon={User} label="Nome Completo" value={userProfile?.full_name} />
        <DetailItem icon={Mail} label="Email" value={userProfile?.email} />
        <DetailItem icon={Building} label="Empresa Atual" value={currentCompany?.company_name} />
        <DetailItem icon={Shield} label="Perfil na Empresa" value={displayRole} />
      </CardContent>
    </Card>
  );
};

export default UserProfileCard;