
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import MaintenanceManager from '@/components/MaintenanceManager.jsx';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

vi.mock('@/hooks/useAuth');
vi.mock('@/lib/supabaseClient');
vi.mock('@/hooks/useLicense', () => ({
  useLicense: () => ({ limits: { maintenances: Infinity } }),
}));

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false, cacheTime: 0 } },
});

const mockUserProfile = { id: 'user-123' };
const mockCurrentCompanyId = 'company-123';
const mockEquipmentsData = [{ id: 'eq-1', name: 'Gerador Alpha', location: 'Sala A' }];
const mockUsersData = [{ id: 'user-123', full_name: 'Admin User', role: 'company_admin' }, { id: 'tech-1', full_name: 'Técnico Silva', role: 'technician' }];
let mockMaintenancesData = [];

const setupMocks = () => {
    supabase.from.mockImplementation((tableName) => {
        const mockChain = {
            select: vi.fn().mockReturnThis(),
            update: vi.fn((payload) => {
                const updatedIndex = mockMaintenancesData.findIndex(item => item.id === mockChain.eq.mock.calls[0][1]);
                if (updatedIndex > -1) {
                    mockMaintenancesData[updatedIndex] = { ...mockMaintenancesData[updatedIndex], ...payload };
                }
                const updatedData = mockMaintenancesData[updatedIndex];
                return { data: [updatedData], error: null, single: () => ({ data: updatedData, error: null }) };
            }).mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            order: vi.fn().mockReturnThis(),
            single: vi.fn(),
        };

        if (tableName === 'maintenances') {
            mockChain.select.mockResolvedValue({ data: mockMaintenancesData, error: null });
        } else if (tableName === 'equipments') {
            mockChain.select.mockResolvedValue({ data: mockEquipmentsData, error: null });
        } else if (tableName === 'company_users') {
            const companyUsers = mockUsersData.map(u => ({ user_id: u.id, profiles: u }));
            mockChain.select.mockResolvedValue({ data: companyUsers, error: null });
        }
        
        return mockChain;
    });
};

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <MaintenanceManager />
    </QueryClientProvider>
  );
};

describe('MaintenanceManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    mockMaintenancesData = [
        { id: 'm1', title: 'Manutenção Teste 1', status: 'pending', type: 'preventive', scheduled_date: new Date().toISOString(), equipment: { name: 'Gerador Alpha' } },
        { id: 'm2', title: 'Manutenção Teste 2', status: 'completed', type: 'corrective', scheduled_date: new Date().toISOString(), equipment: { name: 'Compressor Beta' } },
    ];
    useAuth.mockReturnValue({ userProfile: mockUserProfile, currentCompanyId: mockCurrentCompanyId });
    setupMocks();
  });

  it('deve renderizar o título e a lista de manutenções', async () => {
    renderComponent();
    await waitFor(() => {
        expect(screen.getByText('Manutenções Agendadas')).toBeInTheDocument();
        expect(screen.getByText('Manutenção Teste 1')).toBeInTheDocument();
        expect(screen.getByText('Manutenção Teste 2')).toBeInTheDocument();
    });
  });

  it('não deve mostrar botão de criar nova manutenção', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /nova manutenção/i })).not.toBeInTheDocument();
    });
  });

  it('deve abrir o formulário de edição ao clicar em "Editar"', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Manutenção Teste 1'));
    
    const editButtons = screen.getAllByTitle('Editar Manutenção');
    fireEvent.click(editButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Editar Manutenção')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Manutenção Teste 1')).toBeInTheDocument();
    });
  });

  it('deve filtrar manutenções por status corretamente', async () => {
    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('Manutenção Teste 1')).toBeInTheDocument();
      expect(screen.getByText('Manutenção Teste 2')).toBeInTheDocument();
    });

    const statusFilterTrigger = screen.getAllByRole('combobox').find(el => el.textContent.includes('Todos Status'));
    fireEvent.mouseDown(statusFilterTrigger);
    await waitFor(() => screen.getByText('Concluída'));
    fireEvent.click(screen.getByText('Concluída'));

    await waitFor(() => {
      expect(screen.queryByText('Manutenção Teste 1')).not.toBeInTheDocument();
      expect(screen.getByText('Manutenção Teste 2')).toBeInTheDocument();
    });
  });

  it('deve atualizar o status de uma manutenção para concluída', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Manutenção Teste 1'));

    const completeButtons = screen.getAllByTitle('Marcar como Concluída');
    await act(async () => {
        fireEvent.click(completeButtons[0]);
    });

    await waitFor(() => {
        expect(supabase.from('maintenances').update).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }));
        expect(screen.getByText('Status Atualizado!')).toBeInTheDocument();
    });
  });
});
