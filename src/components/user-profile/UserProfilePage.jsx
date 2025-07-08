import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import UserProfileCard from '@/components/user-profile/UserProfileCard';
import { Loader2, User } from 'lucide-react';

const UserProfilePage = () => {
  const { userProfile, userCompanies, currentCompanyId } = useAuth();

  if (!userProfile) {
    return (
      <div className="flex justify-center items-center h-full">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }
  
  const currentCompany = userCompanies.find(c => c.company_id === currentCompanyId);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div className="flex items-center space-x-4">
        <User className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Meu Perfil
          </h1>
          <p className="text-muted-foreground">Suas informações de usuário e detalhes da conta.</p>
        </div>
      </div>

      <UserProfileCard userProfile={userProfile} currentCompany={currentCompany} />
    </motion.div>
  );
};

export default UserProfilePage;