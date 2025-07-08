import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const TermsViewerModal = ({ isOpen, setIsOpen, documentType, onScrolledToEnd, onAccepted, forUserId, forUserFullName }) => {
  const [document, setDocument] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasScrolledToEndState, setHasScrolledToEndState] = useState(false);
  const viewportRef = useRef(null);

  const checkScrollPosition = useCallback(() => {
    if (viewportRef.current && !hasScrolledToEndState) {
      const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
      const tolerance = 15; 

      if (scrollHeight <= clientHeight + tolerance) {
        setHasScrolledToEndState(true);
        if (onScrolledToEnd) {
          onScrolledToEnd();
        }
        return; 
      }

      if (scrollTop + clientHeight >= scrollHeight - tolerance) {
        setHasScrolledToEndState(true);
        if (onScrolledToEnd) {
          onScrolledToEnd();
        }
      }
    }
  }, [hasScrolledToEndState, onScrolledToEnd]);

  useEffect(() => {
    if (isOpen && documentType) {
      const fetchDocument = async () => {
        setIsLoading(true);
        setHasScrolledToEndState(false);
        if (viewportRef.current) {
          viewportRef.current.scrollTop = 0;
        }
        
        try {
          const { data, error } = await supabase
            .from('terms_and_policies')
            .select('id, type, version, content, published_at')
            .eq('type', documentType)
            .eq('is_active', true)
            .order('published_at', { ascending: false })
            .limit(1)
            .single();

          if (error && error.code !== 'PGRST116') {
            throw error;
          }
          if (!data) {
            toast({ title: "Documento não encontrado", description: `Não foi possível carregar o documento (${documentType}). Por favor, tente mais tarde.`, variant: "destructive" });
            setDocument(null);
          } else {
            setDocument(data);
          }
        } catch (error) {
          toast({ title: "Erro ao Carregar Documento", description: error.message, variant: "destructive" });
          setDocument(null);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDocument();
    }
  }, [isOpen, documentType]);
  
  useEffect(() => {
    const currentViewport = viewportRef.current;
    let timerId = null;

    if (currentViewport && isOpen && !isLoading && document) {
      currentViewport.addEventListener('scroll', checkScrollPosition);
      
      timerId = setTimeout(() => {
        checkScrollPosition();
      }, 200); 

      return () => {
        if (timerId) clearTimeout(timerId);
        currentViewport.removeEventListener('scroll', checkScrollPosition);
      };
    }
    
    return () => {
      if (timerId) clearTimeout(timerId);
      if (currentViewport) {
         currentViewport.removeEventListener('scroll', checkScrollPosition);
      }
    };
  }, [isOpen, isLoading, document, checkScrollPosition]);
  
  const handleAccept = async () => {
    if (document) {
      if (forUserId) { 
        try {
          const { error } = await supabase.from('user_terms_acceptance').insert({
            user_id: forUserId,
            terms_id: document.id,
          });
          if (error) throw error;
          toast({ title: "Sucesso", description: `Aceite dos ${getDocumentTitle()} registrado para ${forUserFullName || 'o usuário'}.` });
          if (onAccepted) onAccepted(document.id, document.version, forUserId);
        } catch (error) {
          toast({ title: "Erro ao Registrar Aceite", description: error.message, variant: "destructive" });
        }
      } else if (onAccepted) { 
        onAccepted(document.id, document.version);
      }
    }
    setIsOpen(false);
  }
  
  const getDocumentTitle = () => {
    if (!document) return "Documento Legal";
    return document.type === 'terms_of_service' ? "Termos de Uso" : "Política de Privacidade";
  }

  const isAcceptButtonDisabled = isLoading || (!forUserId && !hasScrolledToEndState);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-2xl sm:max-w-3xl md:max-w-4xl lg:max-w-5xl max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="text-2xl">
            {getDocumentTitle()}
            {forUserFullName && <span className="text-base font-normal text-muted-foreground"> (para {forUserFullName})</span>}
          </DialogTitle>
          {document && <DialogDescription>Versão: {document.version} (Publicado em: {document.published_at ? new Date(document.published_at).toLocaleDateString() : 'N/A'})</DialogDescription>}
        </DialogHeader>
        
        <div className="flex-grow overflow-hidden">
          {isLoading ? (
            <div className="h-full flex items-center justify-center p-6"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
          ) : document ? (
            <ScrollArea 
              className="h-full rounded-b-md"
            >
              <div 
                ref={viewportRef} 
                className="prose dark:prose-invert max-w-none p-6" 
                style={{ height: '100%', overflowY: 'auto', scrollBehavior: 'smooth' }} 
              >
                <div dangerouslySetInnerHTML={{ __html: document.content }} />
              </div>
              <ScrollBar orientation="vertical" />
            </ScrollArea>
          ) : (
            <div className="h-full flex items-center justify-center text-muted-foreground p-6">Conteúdo não disponível.</div>
          )}
        </div>

        <DialogFooter className="p-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setIsOpen(false)}>Fechar</Button>
          {document && (
            <Button onClick={handleAccept} disabled={isAcceptButtonDisabled}>
              {forUserId ? 'Registrar Apresentação/Aceite' : 'Li e Aceito'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TermsViewerModal;