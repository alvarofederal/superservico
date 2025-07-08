import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import QRCodeStylized from '@/components/equipment/QRCodeStylized';
import { Printer, X } from 'lucide-react';

const QRCodeDisplayModal = ({ isOpen, setIsOpen, equipment }) => {
  const qrCodeRef = useRef(null);

  const handlePrint = () => {
    const qrCodeElement = qrCodeRef.current;
    if (qrCodeElement) {
      const printWindow = window.open('', '_blank');
      printWindow.document.write('<html><head><title>QRCode Equipamento</title>');
      printWindow.document.write('<style>body { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; font-family: Arial, sans-serif; text-align: center; } .qr-container { border: 2px solid #eee; padding: 20px; border-radius: 8px; } h3 { margin-bottom: 10px; } img { max-width: 80vw; max-height: 80vh; display: block; margin: 0 auto; } .details p { margin: 5px 0; font-size: 14px; color: #555;} @media print { body { -webkit-print-color-adjust: exact; } .no-print { display: none; } }</style>');
      printWindow.document.write('</head><body>');
      printWindow.document.write('<div class="qr-container">');
      printWindow.document.write(`<h3>Equipamento: ${equipment.name}</h3>`);
      printWindow.document.write(`<div class="details"><p>ID: ${equipment.id}</p><p>Local: ${equipment.location}</p></div>`);
      
      const canvas = qrCodeElement.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL();
        printWindow.document.write(`<img src="${dataUrl}" alt="QRCode" />`);
      } else {
        printWindow.document.write('<p>Erro ao gerar imagem do QRCode.</p>');
      }

      printWindow.document.write('</div>');
      printWindow.document.write('<script>setTimeout(() => { window.print(); window.close(); }, 500);</script>');
      printWindow.document.write('</body></html>');
      printWindow.document.close();
    }
  };
  
  if (!equipment || !equipment.qrcode_payload) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md bg-card/80 backdrop-blur-lg border-border/60">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">QRCode do Equipamento</DialogTitle>
          <DialogDescription>
            {equipment.name} - {equipment.location}
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center justify-center my-6 space-y-4" ref={qrCodeRef}>
          <QRCodeStylized value={equipment.qrcode_payload} size={256} />
          <p className="text-xs text-muted-foreground break-all text-center px-4">
            Payload: {equipment.qrcode_payload}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => setIsOpen(false)} className="w-full sm:w-auto">
            <X className="mr-2 h-4 w-4" /> Fechar
          </Button>
          <Button onClick={handlePrint} className="w-full sm:w-auto bg-gradient-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground">
            <Printer className="mr-2 h-4 w-4" /> Imprimir QRCode
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeDisplayModal;