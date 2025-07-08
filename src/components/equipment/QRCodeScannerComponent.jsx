import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, VideoOff, AlertTriangle, RotateCcw } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const QRCodeScannerComponent = ({ isOpen, setIsOpen, onScanSuccess, onScanError }) => {
  const scannerRegionId = "qr-code-full-region";
  const html5QrCodeScannerRef = useRef(null);
  const [error, setError] = useState(null);
  const [isScannerActive, setIsScannerActive] = useState(false);

  useEffect(() => {
    let scannerInstance;

    const startScanner = () => {
      if (!isOpen || !document.getElementById(scannerRegionId) || html5QrCodeScannerRef.current) {
        return;
      }
      
      try {
        setError(null);
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          supportedScanTypes: [0], // SCAN_TYPE_CAMERA
          formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        };

        scannerInstance = new Html5QrcodeScanner(
          scannerRegionId,
          config,
          false 
        );
        
        html5QrCodeScannerRef.current = scannerInstance;

        const successCallback = (decodedText, decodedResult) => {
          setIsScannerActive(false);
          if (scannerInstance) {
            scannerInstance.clear().catch(err => console.error("Error clearing scanner:", err));
            html5QrCodeScannerRef.current = null;
          }
          onScanSuccess(decodedText, decodedResult);
          setIsOpen(false); 
        };

        const errorCallback = (errorMessage) => {
          if (onScanError) {
            onScanError(errorMessage);
          }
          if (typeof errorMessage === 'string' && (errorMessage.includes("NotAllowedError") || errorMessage.includes("Permission denied"))) {
             setError("Permissão da câmera negada. Por favor, habilite o acesso à câmera nas configurações do seu navegador.");
          } else if (typeof errorMessage === 'string' && errorMessage.includes("NotFoundError")) {
             setError("Nenhuma câmera encontrada. Verifique se uma câmera está conectada e habilitada.");
          }
          // Don't log common "QR code not found" errors to console to avoid spam
          if (!errorMessage.toLowerCase().includes("qr code parse error") && !errorMessage.toLowerCase().includes("code not found")) {
            console.warn("QR Scanner Error:", errorMessage);
          }
        };
        
        scannerInstance.render(successCallback, errorCallback);
        setIsScannerActive(true);
      } catch (e) {
        console.error("Failed to initialize QR Scanner:", e);
        setError(`Falha ao iniciar o scanner: ${e.message}. Verifique as permissões da câmera.`);
        setIsScannerActive(false);
      }
    };
    
    const stopScanner = () => {
      if (html5QrCodeScannerRef.current) {
        html5QrCodeScannerRef.current.clear()
          .then(() => {
            html5QrCodeScannerRef.current = null;
            setIsScannerActive(false);
            console.log("QR Scanner cleared successfully");
          })
          .catch(err => {
            console.error("Error clearing scanner:", err);
            // Attempt to remove the region manually if clear fails
            const regionElement = document.getElementById(scannerRegionId);
            if (regionElement) regionElement.innerHTML = '';
            html5QrCodeScannerRef.current = null;
            setIsScannerActive(false);
          });
      }
    };

    if (isOpen) {
      // Delay startScanner slightly to ensure dialog is rendered
      const timer = setTimeout(startScanner, 100);
      return () => {
        clearTimeout(timer);
        stopScanner();
      };
    } else {
      stopScanner();
    }

  }, [isOpen, onScanSuccess, onScanError, setIsOpen]);
  
  const handleRetry = () => {
    setError(null);
    setIsScannerActive(false); 
    if (html5QrCodeScannerRef.current) {
        html5QrCodeScannerRef.current.clear().catch(err => console.error("Error clearing scanner before retry:", err)).finally(() => {
            html5QrCodeScannerRef.current = null;
             // Re-trigger useEffect to restart scanner
            setIsOpen(false); 
            setTimeout(() => setIsOpen(true), 50);
        });
    } else {
        setIsOpen(false);
        setTimeout(() => setIsOpen(true), 50);
    }
  };


  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        setIsScannerActive(false); 
      }
      setIsOpen(open);
    }}>
      <DialogContent className="sm:max-w-lg bg-card/80 backdrop-blur-lg border-border/60">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">Escanear QRCode do Equipamento</DialogTitle>
          <DialogDescription>Aponte a câmera para o QRCode.</DialogDescription>
        </DialogHeader>
        
        <div id={scannerRegionId} className="w-full min-h-[300px] rounded-md overflow-hidden border border-border bg-muted/20 my-4" />

        {error && (
          <div className="p-4 mt-2 bg-destructive/10 border border-destructive/30 rounded-md text-center">
            <AlertTriangle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-destructive font-medium">Erro ao Escanear</p>
            <p className="text-sm text-destructive/80">{error}</p>
            <Button onClick={handleRetry} variant="outline" className="mt-3">
              <RotateCcw className="mr-2 h-4 w-4" /> Tentar Novamente
            </Button>
          </div>
        )}

        {!isScannerActive && !error && isOpen && (
           <div className="text-center py-4">
             <p className="text-muted-foreground">Iniciando scanner...</p>
           </div>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="outline" onClick={() => { setIsScannerActive(false); setIsOpen(false); }}>
            <X className="mr-2 h-4 w-4" /> Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QRCodeScannerComponent;