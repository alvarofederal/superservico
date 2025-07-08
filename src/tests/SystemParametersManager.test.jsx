import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SystemParametersManager from '@/components/admin/SystemParametersManager';
import { supabase } from '@/lib/supabaseClient';
import { Toaster } from '@/components/ui/toaster';

vi.mock('@/lib/supabaseClient');
vi.mock('@/hooks/useAuth', () => ({ useAuth: () => ({ userProfile: { role: 'admin' } }) }));

const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });

const mockDefinitions = [
  { id: '1', parameter_key: 'site_name', description: 'Nome do Site', value_type: 'string', default_value: 'Meu Site', category: 'Geral' },
  { id: '2', parameter_key: 'max_users', description: 'Máximo de Usuários', value_type: 'number', default_value: '100', category: 'Limites' },
];

describe('SystemParametersManager', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    queryClient.clear();
    supabase.from.mockImplementation((tableName) => {
        const chainable = {
            select: vi.fn().mockReturnThis(),
            insert: vi.fn().mockResolvedValue({ error: null }),
            update: vi.fn().mockReturnThis(),
            delete: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
        };
        if (tableName === 'system_parameters_definitions') {
            chainable.select.mockResolvedValue({ data: mockDefinitions, error: null });
        } else if (tableName === 'user_parameters') {
            chainable.select.mockResolvedValue({ data: [], count: 0, error: null });
        }
        return chainable;
    });
  });

  const renderComponent = () => render(
    <QueryClientProvider client={queryClient}>
      <Toaster /><SystemParametersManager />
    </QueryClientProvider>
  );

  it('deve renderizar o título e o botão de nova definição', async () => {
    renderComponent();
    expect(screen.getByText(/Parâmetros e Planos do Sistema/i)).toBeInTheDocument();
    await waitFor(() => expect(screen.getByRole('button', { name: /Nova Definição/i })).toBeInTheDocument());
  });

  it('deve abrir a visualização do formulário ao clicar em "Nova Definição"', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Nova Definição'));
    fireEvent.click(screen.getByText('Nova Definição'));
    await waitFor(() => {
      expect(screen.getByText(/Nova Definição de Parâmetro/i)).toBeInTheDocument();
    });
  });

  it('deve criar uma nova definição de parâmetro', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Nova Definição'));
    fireEvent.click(screen.getByText('Nova Definição'));
    
    await waitFor(() => screen.getByLabelText(/Chave do Parâmetro/i));
    fireEvent.change(screen.getByLabelText(/Chave do Parâmetro/i), { target: { value: 'new_param' } });
    fireEvent.change(screen.getByLabelText(/Descrição/i), { target: { value: 'Novo Parâmetro' } });
    
    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: /Criar/i }));
    });

    await waitFor(() => {
      expect(supabase.from('system_parameters_definitions').insert).toHaveBeenCalledWith(expect.objectContaining({ parameter_key: 'new_param' }));
      expect(screen.queryByText(/Nova Definição de Parâmetro/i)).not.toBeInTheDocument();
    });
  });

  it('deve excluir uma definição se não houver valores de usuário vinculados', async () => {
    renderComponent();
    await waitFor(() => expect(screen.getByText('site_name')).toBeInTheDocument());

    const deleteButtons = screen.getAllByTitle(/Excluir/i);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => expect(screen.getByText(/Confirmar Exclusão/i)).toBeInTheDocument());

    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    });

    await waitFor(() => {
        expect(supabase.from('system_parameters_definitions').delete().eq).toHaveBeenCalledWith('id', mockDefinitions[0].id);
    });
  });

  it('não deve excluir uma definição se houver valores de usuário vinculados', async () => {
    supabase.from('user_parameters').select.mockResolvedValue({ count: 1, error: null });
    
    renderComponent();
    await waitFor(() => expect(screen.getByText('site_name')).toBeInTheDocument());

    const deleteButtons = screen.getAllByTitle(/Excluir/i);
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => expect(screen.getByText(/Confirmar Exclusão/i)).toBeInTheDocument());

    await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Excluir' }));
    });

    await waitFor(() => {
      expect(supabase.from('system_parameters_definitions').delete).not.toHaveBeenCalled();
    });
  });
});