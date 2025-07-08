import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TermsViewerModal from '@/components/admin/TermsViewerModal';
import { supabase } from '@/lib/supabaseClient';
import { Toaster } from '@/components/ui/toaster';

// Mock de supabaseClient
vi.mock('@/lib/supabaseClient', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn(),
  }
}));

const mockTermDocument = {
  id: 'term-id-123',
  type: 'terms_of_service',
  version: '1.1.0',
  content: '<h1>Termos de Uso</h1><p>Conteúdo dos termos.</p><div style="height:1000px">Espaço para scroll</div><p>Fim dos termos.</p>',
  published_at: new Date().toISOString(),
};

const mockPolicyDocument = {
  id: 'policy-id-456',
  type: 'privacy_policy',
  version: '1.0.0',
  content: '<h1>Política de Privacidade</h1><p>Conteúdo da política.</p><div style="height:1000px">Espaço para scroll</div><p>Fim da política.</p>',
  published_at: new Date().toISOString(),
};


describe('TermsViewerModal', () => {
  let setIsOpenMock;
  let onScrolledToEndMock;
  let onAcceptedMock;

  beforeEach(() => {
    vi.resetAllMocks();
    setIsOpenMock = vi.fn();
    onScrolledToEndMock = vi.fn();
    onAcceptedMock = vi.fn();
  });

  it('não deve renderizar nada se isOpen for false', () => {
    render(
      <>
        <TermsViewerModal isOpen={false} setIsOpen={setIsOpenMock} documentType="terms_of_service" />
        <Toaster />
      </>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('deve buscar e exibir Termos de Uso quando aberto para "terms_of_service"', async () => {
    supabase.from('terms_and_policies').single.mockResolvedValueOnce({ data: mockTermDocument, error: null });
    render(
      <>
        <TermsViewerModal 
            isOpen={true} 
            setIsOpen={setIsOpenMock} 
            documentType="terms_of_service" 
            onScrolledToEnd={onScrolledToEndMock}
            onAccepted={onAcceptedMock}
        />
        <Toaster />
      </>
    );

    await waitFor(() => {
      expect(screen.getByText('Termos de Uso')).toBeInTheDocument();
      expect(screen.getByText(`Versão: ${mockTermDocument.version}`)).toBeInTheDocument();
      expect(screen.getByText('Conteúdo dos termos.')).toBeInTheDocument(); // Parte do HTML
    });
    expect(supabase.from('terms_and_policies').eq).toHaveBeenCalledWith('type', 'terms_of_service');
    expect(supabase.from('terms_and_policies').eq).toHaveBeenCalledWith('is_active', true);
  });

  it('deve buscar e exibir Política de Privacidade quando aberto para "privacy_policy"', async () => {
    supabase.from('terms_and_policies').single.mockResolvedValueOnce({ data: mockPolicyDocument, error: null });
    render(
        <>
            <TermsViewerModal 
                isOpen={true} 
                setIsOpen={setIsOpenMock} 
                documentType="privacy_policy"
                onScrolledToEnd={onScrolledToEndMock}
                onAccepted={onAcceptedMock}
            />
            <Toaster />
        </>
    );

    await waitFor(() => {
      expect(screen.getByText('Política de Privacidade')).toBeInTheDocument();
      expect(screen.getByText(`Versão: ${mockPolicyDocument.version}`)).toBeInTheDocument();
      expect(screen.getByText('Conteúdo da política.')).toBeInTheDocument();
    });
    expect(supabase.from('terms_and_policies').eq).toHaveBeenCalledWith('type', 'privacy_policy');
  });

  it('deve exibir mensagem se nenhum documento ativo for encontrado', async () => {
    supabase.from('terms_and_policies').single.mockResolvedValueOnce({ data: null, error: null }); // Simula documento não encontrado
     render(
        <>
            <TermsViewerModal 
                isOpen={true} 
                setIsOpen={setIsOpenMock} 
                documentType="terms_of_service"
                onScrolledToEnd={onScrolledToEndMock}
                onAccepted={onAcceptedMock}
            />
            <Toaster />
        </>
    );
    await waitFor(() => {
      expect(screen.getByText('Conteúdo não disponível.')).toBeInTheDocument();
    });
  });
  
  it('deve habilitar o botão "Li e Aceito" após o scroll até o final', async () => {
    supabase.from('terms_and_policies').single.mockResolvedValueOnce({ data: mockTermDocument, error: null });
    render(
        <>
            <TermsViewerModal 
                isOpen={true} 
                setIsOpen={setIsOpenMock} 
                documentType="terms_of_service"
                onScrolledToEnd={onScrolledToEndMock}
                onAccepted={onAcceptedMock}
            />
            <Toaster />
        </>
    );

    await waitFor(() => {
      expect(screen.getByText('Conteúdo dos termos.')).toBeInTheDocument();
    });

    const acceptButton = screen.getByRole('button', { name: /Li e Aceito/i });
    expect(acceptButton).toBeDisabled();

    // Simula o scroll
    // No ambiente de teste, a detecção de scroll real é complexa.
    // Vamos simular a chamada de onScrolledToEnd manualmente ou forçar o estado.
    // Para este teste, vamos focar na lógica do componente.
    // Se o scrollAreaRef fosse acessível e pudéssemos disparar o evento de scroll:
    const scrollArea = screen.getByRole('region'); // O ScrollArea tem role 'region' por padrão
    fireEvent.scroll(scrollArea, { target: { scrollTop: 1000, scrollHeight: 1005, clientHeight: 100 } });


    await waitFor(() => {
        expect(acceptButton).not.toBeDisabled();
    });
    expect(onScrolledToEndMock).toHaveBeenCalled();
  });


  it('deve chamar onAccepted e fechar o modal ao clicar em "Li e Aceito" (após scroll)', async () => {
    supabase.from('terms_and_policies').single.mockResolvedValueOnce({ data: mockTermDocument, error: null });
     render(
        <>
            <TermsViewerModal 
                isOpen={true} 
                setIsOpen={setIsOpenMock} 
                documentType="terms_of_service"
                onScrolledToEnd={onScrolledToEndMock}
                onAccepted={onAcceptedMock}
            />
            <Toaster />
        </>
    );

    await waitFor(() => {
      expect(screen.getByText('Conteúdo dos termos.')).toBeInTheDocument();
    });
    
    const scrollArea = screen.getByRole('region');
    fireEvent.scroll(scrollArea, { target: { scrollTop: 1000, scrollHeight: 1005, clientHeight: 100 } });

    const acceptButton = screen.getByRole('button', { name: /Li e Aceito/i });
    await waitFor(() => expect(acceptButton).not.toBeDisabled());
    
    fireEvent.click(acceptButton);

    expect(onAcceptedMock).toHaveBeenCalledWith(mockTermDocument.id, mockTermDocument.version);
    expect(setIsOpenMock).toHaveBeenCalledWith(false);
  });

  it('deve chamar setIsOpen(false) ao clicar no botão Fechar', async () => {
    supabase.from('terms_and_policies').single.mockResolvedValueOnce({ data: mockTermDocument, error: null });
    render(
        <>
            <TermsViewerModal 
                isOpen={true} 
                setIsOpen={setIsOpenMock} 
                documentType="terms_of_service"
            />
            <Toaster />
        </>
    );
    await waitFor(() => screen.getByText('Fechar'));
    fireEvent.click(screen.getByRole('button', { name: /Fechar/i }));
    expect(setIsOpenMock).toHaveBeenCalledWith(false);
  });

});