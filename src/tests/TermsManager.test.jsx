import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import TermsManager from '@/components/admin/TermsManager';
import { supabase } from '@/lib/supabaseClient';
import { Toaster } from '@/components/ui/toaster';

vi.mock('@/lib/supabaseClient');
vi.mock('react-quill', () => ({
  __esModule: true,
  default: ({ value, onChange }) => (
    <textarea data-testid="react-quill-mock" value={value} onChange={(e) => onChange(e.target.value)} />
  ),
}));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const mockTerms = [
  { id: '1', type: 'terms_of_service', version: '1.0', content: '<p>Termos v1</p>', is_active: true, published_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: '2', type: 'privacy_policy', version: '1.0', content: '<p>Política v1</p>', is_active: false, published_at: null, created_at: new Date().toISOString() },
];

describe('TermsManager', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
    supabase.from.mockImplementation((tableName) => {
        const chainable = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockReturnThis(),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            neq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({ data: {id: 'new-id'}, error: null}),
            order: vi.fn().mockResolvedValue({ data: mockTerms, error: null }),
        };
        chainable.insert.mockResolvedValue({ error: null, select: () => chainable });
        chainable.update.mockResolvedValue({ error: null });
        chainable.delete.mockResolvedValue({ error: null });
        return chainable;
    });
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <Toaster /><TermsManager />
    </QueryClientProvider>
  );

  it('deve listar os documentos existentes', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Termos de Uso')).toBeInTheDocument();
      expect(screen.getByText('Política de Privacidade')).toBeInTheDocument();
    });
  });

  it('deve abrir a visualização do formulário ao clicar em "Novo Documento"', async () => {
    renderComponent();
    await waitFor(() => screen.getByText(/Novo Documento/i));
    fireEvent.click(screen.getByRole('button', { name: /Novo Documento/i }));
    await waitFor(() => {
      expect(screen.getByText(/Novo Documento Legal/i)).toBeInTheDocument();
    });
  });

  it('deve criar um novo documento', async () => {
    renderComponent();
    await waitFor(() => screen.getByText(/Novo Documento/i));
    fireEvent.click(screen.getByRole('button', { name: /Novo Documento/i }));

    await waitFor(() => screen.getByLabelText(/Versão/i));
    fireEvent.change(screen.getByLabelText(/Versão/i), { target: { value: '2.0' } });
    fireEvent.change(screen.getByTestId('react-quill-mock'), { target: { value: '<p>Conteúdo novo.</p>' } });
    
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Criar/i }));
    });

    await waitFor(() => {
      expect(supabase.from('terms_and_policies').insert).toHaveBeenCalledWith(expect.objectContaining({ version: '2.0' }));
      expect(screen.queryByText(/Novo Documento Legal/i)).not.toBeInTheDocument();
    });
  });

  it('deve excluir um documento', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getAllByTitle(/Excluir/i).length).toBeGreaterThan(0));

    const deleteButtons = screen.getAllByTitle(/Excluir/i);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => expect(screen.getByText(/Confirmar Exclusão/i)).toBeInTheDocument());

    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    });

    await waitFor(() => {
      expect(supabase.from('terms_and_policies').delete().eq).toHaveBeenCalledWith('id', mockTerms[0].id);
    });
  });
});