import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';

const TermsAcceptanceModal = ({ isOpen, onOpenChange, termsAcceptanceData, onClose }) => {
  if (!termsAcceptanceData) return null;

  const { userFullName, acceptances } = termsAcceptanceData;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Histórico de Aceite de Termos</DialogTitle>
          <DialogDescription>Usuário: {userFullName}</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto mt-4 space-y-3">
          {acceptances && acceptances.length > 0 ? (
            acceptances.map(acceptance => (
              <div key={acceptance.id} className="p-3 border rounded-md bg-muted/30">
                <p className="font-semibold">{acceptance.terms_and_policies?.type === 'terms_of_service' ? 'Termos de Uso' : 'Política de Privacidade'} - v{acceptance.terms_and_policies?.version}</p>
                <p className="text-sm text-muted-foreground">Aceito em: {new Date(acceptance.accepted_at).toLocaleString()}</p>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">Nenhum aceite de termo registrado para este usuário.</p>
          )}
        </div>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsAcceptanceModal;