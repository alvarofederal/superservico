import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import EquipmentManager from '@/components/EquipmentManager';
import { Toaster } from '@/components/ui/toaster';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';

vi.mock('@/hooks/useAuth');
vi.mock('@/hooks/useLicense', () => ({
  useLicense: () => ({ limits: { equipment: Infinity } }),
}));
vi.mock('@/lib/supabaseClient');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      staleTime: Infinity,
    },
  },
});

const mockUserProfile = { id: 'user-123', role: 'admin' };
const mockCompanyId = 'company-123';
const mockEquipments = [
  { id: 'eq-1', name: 'Torno CNC', category: 'Usinagem', status: 'operational', company_id: mockCompanyId, createdat: new Date().toISOString() },
  { id: 'eq-2', name: 'Prensa Hidráulica', category: 'Prensas', status: 'maintenance', company_id: mockCompanyId, createdat: new Date().toISOString() },
];

const renderComponent = () => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Toaster />
        <EquipmentManager />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('EquipmentManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryClient.clear();
    
    useAuth.mockReturnValue({
      userProfile: mockUserProfile,
      currentCompanyId: mockCompanyId,
      hasAccess: () => true,
    });

    supabase.from.mockImplementation((tableName) => {
      const mockChain = {
        select: vi.fn().mockReturnThis(),
        insert: vi.fn().mockResolvedValue({ error: null }),
        update: vi.fn().mockResolvedValue({ error: null }),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        single: vi.fn(),
      };

      if (tableName === 'equipments') {
        mockChain.select.mockResolvedValue({ data: mockEquipments, error: null });
      } else if (tableName === 'equipment_categories') {
        mockChain.select.mockResolvedValue({ data: [{id: 'cat-1', name: 'Usinagem'}], error: null });
      }
      return mockChain;
    });
  });

  it('deve buscar e exibir a lista de equipamentos', async () => {
    renderComponent();
    await waitFor(() => {
      expect(screen.getByText('Torno CNC')).toBeInTheDocument();
      expect(screen.getByText('Prensa Hidráulica')).toBeInTheDocument();
    });
    expect(supabase.from('equipments').select).toHaveBeenCalled();
  });

  it('deve abrir o formulário para criar um novo equipamento', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Novo Equipamento'));
    fireEvent.click(screen.getByText('Novo Equipamento'));
    await waitFor(() => {
      expect(screen.getByText('Novo Equipamento')).toBeInTheDocument();
      expect(screen.getByLabelText('Nome *')).toBeInTheDocument();
    });
  });

  it('deve validar campos obrigatórios ao criar um equipamento', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Novo Equipamento'));
    fireEvent.click(screen.getByText('Novo Equipamento'));
    
    await waitFor(() => screen.getByRole('button', { name: 'Cadastrar Equipamento' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Equipamento' }));

    await waitFor(() => {
      expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
      expect(screen.getByText('Categoria é obrigatória')).toBeInTheDocument();
      expect(screen.getByText('A data da última manutenção é obrigatória')).toBeInTheDocument();
      expect(screen.getByText('A data da próxima manutenção é obrigatória')).toBeInTheDocument();
    });
    expect(supabase.from('equipments').insert).not.toHaveBeenCalled();
  });

  it('deve criar um novo equipamento com sucesso', async () => {
    renderComponent();
    await waitFor(() => screen.getByText('Novo Equipamento'));
    fireEvent.click(screen.getByText('Novo Equipamento'));

    await waitFor(() => screen.getByLabelText('Nome *'));

    fireEvent.change(screen.getByLabelText('Nome *'), { target: { value: 'Nova Furadeira' } });
    
    const categorySelect = screen.getByRole('combobox');
    fireEvent.mouseDown(categorySelect);
    await waitFor(() => screen.getByText('Usinagem'));
    fireEvent.click(screen.getByText('Usinagem'));

    fireEvent.change(screen.getByLabelText('Última Manutenção *'), { target: { value: '2025-01-01' } });
    fireEvent.change(screen.getByLabelText('Próxima Manutenção *'), { target: { value: '2025-07-01' } });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Cadastrar Equipamento' }));
    });

    await waitFor(() => {
      expect(supabase.from('equipments').insert).toHaveBeenCalledTimes(1);
      expect(supabase.from('equipments').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Nova Furadeira',
          category: 'Usinagem',
          lastmaintenance: '2025-01-01',
          nextmaintenance: '2025-07-01',
          company_id: mockCompanyId,
        })
      );
    });
  });
});